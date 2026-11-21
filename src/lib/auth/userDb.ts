import fs from 'fs';
import path from 'path';
import { User, UserRecord, UserRole, AuthProvider } from '../../types/auth';
import { generateSalt, hashPassword, verifyPassword } from './jwt';
import { getUsersFromNeon, getSingleUserByEmailFromNeon, upsertUserInNeon } from '../db/neon';

const USERS_FILE = path.join(process.cwd(), '.users_data.json');

// Default admin salt & hash
const ADMIN_SALT = 'e4a8b79c31df4a629b35fa2901c4e7ab';
const ADMIN_HASH = hashPassword('Admin@123', ADMIN_SALT);

// Default customer salt & hash
const CUSTOMER_SALT = '78f190e4a3b2c1d5e6f7a8b9c0d1e2f3';
const CUSTOMER_HASH = hashPassword('Customer@123', CUSTOMER_SALT);

const SEED_USERS: UserRecord[] = [
  {
    id: 'usr_admin_001',
    name: 'SYNDICATE ADMIN',
    email: 'admin@goatednation.com',
    role: 'ADMIN',
    avatar: '',
    provider: 'credentials',
    salt: ADMIN_SALT,
    passwordHash: ADMIN_HASH,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_cust_002',
    name: 'Tokyo Streetwear Collector',
    email: 'customer@goatednation.com',
    role: 'CUSTOMER',
    avatar: '',
    provider: 'credentials',
    salt: CUSTOMER_SALT,
    passwordHash: CUSTOMER_HASH,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

let cachedUsers: UserRecord[] | null = null;

function loadUsersFromLocal(): UserRecord[] {
  if (cachedUsers && cachedUsers.length > 0) {
    return cachedUsers;
  }

  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedUsers = parsed;
        return cachedUsers;
      }
    }
  } catch (err) {
    console.warn('[UserDb] Local users file read warning:', err);
  }

  cachedUsers = [...SEED_USERS];
  return cachedUsers;
}

function saveLocalUsersBackup(users: UserRecord[]): void {
  cachedUsers = users;
  if (process.env.NODE_ENV === 'production') {
    // In serverless environments, file writing may be read-only, Neon is primary
    return;
  }
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[UserDb] Local users backup write skipped/failed:', err);
  }
}

export function toPublicUser(record: UserRecord): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    avatar: record.avatar,
    provider: record.provider,
    createdAt: record.createdAt,
  };
}

/**
 * Finds a user by email. Checks authoritative Neon Postgres first, then in-memory/local cache.
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase().trim();

  // 1. Authoritative Neon cloud query first
  try {
    const neonUser = await getSingleUserByEmailFromNeon<UserRecord>(normalized);
    if (neonUser) {
      if (!cachedUsers) cachedUsers = [];
      const idx = cachedUsers.findIndex((u) => u.email.toLowerCase().trim() === normalized);
      if (idx >= 0) cachedUsers[idx] = neonUser;
      else cachedUsers.push(neonUser);
      return neonUser;
    }
  } catch (err) {
    console.warn('[UserDb] Direct Neon user fetch by email bypassed:', err);
  }

  // 2. Fallback to memory / local cache
  const localList = loadUsersFromLocal();
  const cached = localList.find((u) => u.email.toLowerCase().trim() === normalized);
  if (cached) return cached;

  return null;
}

/**
 * Finds a user by ID. Checks authoritative Neon Postgres first, then in-memory/local cache.
 */
export async function findUserById(id: string): Promise<UserRecord | null> {
  // 1. Authoritative Neon cloud query first
  try {
    const neonUsers = await getUsersFromNeon<UserRecord>();
    if (neonUsers && neonUsers.length > 0) {
      cachedUsers = neonUsers;
      const found = neonUsers.find((u) => u.id === id);
      if (found) return found;
    }
  } catch (err) {
    console.warn('[UserDb] Direct Neon user fetch by ID bypassed:', err);
  }

  // 2. Fallback to memory / local cache
  const localList = loadUsersFromLocal();
  const cached = localList.find((u) => u.id === id);
  if (cached) return cached;

  return null;
}

/**
 * Registers a new user. Persists to memory/disk and directly upserts ONLY this single user to Neon.
 */
export async function createUser(params: {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  avatar?: string;
  provider?: AuthProvider;
}): Promise<User> {
  const normalizedEmail = params.email.toLowerCase().trim();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const salt = params.password ? generateSalt() : undefined;
  const passwordHash = params.password && salt ? hashPassword(params.password, salt) : undefined;

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: params.name.trim(),
    email: normalizedEmail,
    role: params.role || 'CUSTOMER',
    avatar: params.avatar || '',
    provider: params.provider || 'credentials',
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const users = loadUsersFromLocal();
  users.push(newUser);
  saveLocalUsersBackup(users);

  // Sync only the new user to Neon (no N-loop)
  upsertUserInNeon(newUser).catch((err) => {
    console.warn('[UserDb] Failed to sync new user to Neon:', err);
  });

  return toPublicUser(newUser);
}

/**
 * Authenticates user credentials with password verification.
 */
export async function authenticateCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  if (user.provider !== 'credentials' || !user.salt || !user.passwordHash) {
    return {
      success: false,
      error: `This account was registered via ${user.provider}. Please sign in with ${user.provider}.`,
    };
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  return { success: true, user: toPublicUser(user) };
}

/**
 * Finds or registers an OAuth user. Syncs only this single user to Neon.
 */
export async function findOrCreateOAuthUser(params: {
  email: string;
  name: string;
  avatar?: string;
  provider: 'google';
  defaultRole?: UserRole;
}): Promise<User> {
  const normalizedEmail = params.email.toLowerCase().trim();
  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    if (params.avatar && (!existing.avatar || existing.avatar.includes('dicebear'))) {
      existing.avatar = params.avatar;
      const users = loadUsersFromLocal();
      saveLocalUsersBackup(users);
      upsertUserInNeon(existing).catch((err) => {
        console.warn('[UserDb] Failed to update OAuth user in Neon:', err);
      });
    }
    return toPublicUser(existing);
  }

  const newUser: UserRecord = {
    id: `usr_oauth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: params.name.trim(),
    email: normalizedEmail,
    role: params.defaultRole || 'CUSTOMER',
    avatar: params.avatar || '',
    provider: params.provider,
    createdAt: new Date().toISOString(),
  };

  const users = loadUsersFromLocal();
  users.push(newUser);
  saveLocalUsersBackup(users);

  // Sync only the new user to Neon
  upsertUserInNeon(newUser).catch((err) => {
    console.warn('[UserDb] Failed to sync OAuth user to Neon:', err);
  });

  return toPublicUser(newUser);
}

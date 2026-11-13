import fs from 'fs';
import path from 'path';
import { User, UserRecord, UserRole, AuthProvider } from '../../types/auth';
import { generateSalt, hashPassword, verifyPassword } from './jwt';

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
    avatar: 'https://zenin.co.in/cdn/shop/files/web1s.jpg',
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
    avatar: 'https://zenin.co.in/cdn/shop/files/pant3ss.png',
    provider: 'credentials',
    salt: CUSTOMER_SALT,
    passwordHash: CUSTOMER_HASH,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

let cachedUsers: UserRecord[] | null = null;

function loadUsers(): UserRecord[] {
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
    console.error('[UserDb] Error loading users file:', err);
  }

  // Fallback to seed users
  cachedUsers = [...SEED_USERS];
  saveUsers(cachedUsers);
  return cachedUsers;
}

function saveUsers(users: UserRecord[]): void {
  try {
    cachedUsers = users;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[UserDb] Error saving users file:', err);
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

export function findUserByEmail(email: string): UserRecord | null {
  const users = loadUsers();
  const normalized = email.toLowerCase().trim();
  const found = users.find((u) => u.email.toLowerCase().trim() === normalized);
  return found || null;
}

export function findUserById(id: string): UserRecord | null {
  const users = loadUsers();
  const found = users.find((u) => u.id === id);
  return found || null;
}

export function createUser(params: {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  avatar?: string;
  provider?: AuthProvider;
}): User {
  const users = loadUsers();
  const normalizedEmail = params.email.toLowerCase().trim();

  const existing = users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
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
    avatar:
      params.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    provider: params.provider || 'credentials',
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return toPublicUser(newUser);
}

export function authenticateCredentials(
  email: string,
  password: string
): { success: boolean; user?: User; error?: string } {
  const user = findUserByEmail(email);
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

export function findOrCreateOAuthUser(params: {
  email: string;
  name: string;
  avatar?: string;
  provider: 'google';
  defaultRole?: UserRole;
}): User {
  const users = loadUsers();
  const normalizedEmail = params.email.toLowerCase().trim();

  const existing = users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);

  if (existing) {
    // If user already exists, update avatar or provider details if needed
    if (params.avatar && (!existing.avatar || existing.avatar.includes('dicebear'))) {
      existing.avatar = params.avatar;
      saveUsers(users);
    }
    return toPublicUser(existing);
  }

  // Create new OAuth user
  const newUser: UserRecord = {
    id: `usr_oauth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: params.name.trim(),
    email: normalizedEmail,
    role: params.defaultRole || 'CUSTOMER',
    avatar:
      params.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    provider: params.provider,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return toPublicUser(newUser);
}

export type UserRole = 'ADMIN' | 'CUSTOMER';

export type AuthProvider = 'credentials' | 'google';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  provider: AuthProvider;
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash?: string;
  salt?: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  provider: AuthProvider;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  redirectTo?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  adminKey?: string;
}


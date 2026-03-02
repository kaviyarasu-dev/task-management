import jwt from 'jsonwebtoken';
import { config } from '../../src/config';
import type { UserRole } from '../../src/types';

interface TokenPayload {
  userId: string;
  tenantId: string;
  email?: string;
  role?: UserRole;
}

/**
 * Generates a valid JWT access token for testing.
 */
export function generateTestAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email ?? 'test@example.com',
      role: payload.role ?? 'member',
    },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generates a valid JWT refresh token for testing.
 */
export function generateTestRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      tenantId: payload.tenantId,
      tokenFamily: 'test-family',
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Returns an Authorization header object for authenticated requests.
 */
export function getAuthHeader(
  userId: string,
  tenantId: string,
  role: UserRole = 'member'
): Record<string, string> {
  const token = generateTestAccessToken({ userId, tenantId, role });
  return { Authorization: `Bearer ${token}` };
}

/**
 * Generates an expired token for testing expiration handling.
 */
export function generateExpiredToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email ?? 'test@example.com',
      role: payload.role ?? 'member',
    },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '-1h' } // Already expired
  );
}

/**
 * Generates a token with invalid signature for testing.
 */
export function generateInvalidSignatureToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email ?? 'test@example.com',
      role: payload.role ?? 'member',
    },
    'wrong-secret-key-that-wont-verify',
    { expiresIn: '1h' }
  );
}

/**
 * Decodes a token without verification for test assertions.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Creates a complete auth test context with user credentials and tokens.
 */
export interface TestAuthContext {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  authHeader: Record<string, string>;
}

export function createTestAuthContext(
  userId: string,
  tenantId: string,
  options: { email?: string; role?: UserRole } = {}
): TestAuthContext {
  const email = options.email ?? 'test@example.com';
  const role = options.role ?? 'member';
  const accessToken = generateTestAccessToken({ userId, tenantId, email, role });
  const refreshToken = generateTestRefreshToken({ userId, tenantId });

  return {
    userId,
    tenantId,
    email,
    role,
    accessToken,
    refreshToken,
    authHeader: { Authorization: `Bearer ${accessToken}` },
  };
}

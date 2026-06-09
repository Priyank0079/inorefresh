import jwt from 'jsonwebtoken';
import { UserType } from '../models/Otp';

export interface TokenPayload {
  userId: string;
  userType: UserType;
  role?: string;
  // RBAC — embedded for zero-latency permission checks (Staff only)
  viewModules?: string[];
  writeModules?: string[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(
  userId: string,
  userType: UserType,
  role?: string,
  viewModules?: string[],
  writeModules?: string[],
): string {
  const payload: TokenPayload = {
    userId,
    userType,
    ...(role && { role }),
    ...(viewModules && viewModules.length > 0 && { viewModules }),
    ...(writeModules && writeModules.length > 0 && { writeModules }),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

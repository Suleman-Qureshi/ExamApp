// lib/auth.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export type UserRole = 'student' | 'teacher';
export interface AuthUser {
  id: string;
  role: UserRole;
}

// Match your dev IDs
const DEV_TEACHER_ID = '000000000000000000000001';
const DEV_STUDENT_ID = '000000000000000000000002';

class UnauthorizedError extends Error {}
class ForbiddenError extends Error {}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export function requireAuth(request: Request): AuthUser {
  const token = getBearerToken(request);

  // Dev bypass
  if (process.env.ALLOW_DEV_TOKEN === 'true') {
    if (token === 'dev-teacher') return { id: DEV_TEACHER_ID, role: 'teacher' };
    if (token === 'dev-student') return { id: DEV_STUDENT_ID, role: 'student' };
  }

  if (!token) throw new UnauthorizedError('Authentication required');

  const secret = process.env.JWT_SECRET || 'devsecret';
  try {
    const payload = jwt.verify(token, secret) as JwtPayload & {
      id?: string;
      role?: UserRole;
    };

    if (!payload || typeof payload !== 'object' || !payload.id || !payload.role) {
      throw new UnauthorizedError('Invalid token payload');
    }

    return { id: payload.id, role: payload.role };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requireRole(user: AuthUser, role: UserRole) {
  if (!user || user.role !== role) {
    throw new ForbiddenError('Forbidden');
  }
}

// Helper to turn auth errors into HTTP responses
export function handleAuthError(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ message: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
  return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
}
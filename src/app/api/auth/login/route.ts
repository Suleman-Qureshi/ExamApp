// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
// Update the path below if your User model is not located at this relative path
import User from '../../../../models/User';

export const runtime = 'nodejs';
export const revalidate = 0;

type LoginBody = {
  email?: string;
  password?: string;
  role?: 'student' | 'teacher';
};

export async function POST(request: Request) {
  try {
    const { email, password, role }: LoginBody = await request.json();

    // DEV FALLBACK: mint a token without DB
    if (process.env.ALLOW_DEV_TOKEN === 'true') {
      const effectiveRole = role === 'student' ? 'student' : 'teacher';
      const id =
        effectiveRole === 'teacher'
          ? '000000000000000000000001'
          : '000000000000000000000002';

      const token = jwt.sign(
        { id, role: effectiveRole },
        process.env.JWT_SECRET || 'devsecret',
        { expiresIn: '30d' }
      );

      return NextResponse.json({ token, role: effectiveRole });
    }

    // Normal DB-auth flow
    if (!email || !password) {
      return NextResponse.json(
        { message: 'email and password required' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    if (role && user.role !== role) {
      return NextResponse.json({ message: 'Role mismatch' }, { status: 403 });
    }

    const token = jwt.sign(
      { id: String(user._id), role: user.role },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '7d' }
    );
    return NextResponse.json({ token, role: user.role });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 });
  }
}
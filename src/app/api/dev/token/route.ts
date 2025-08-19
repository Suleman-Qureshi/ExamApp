// app/api/dev/token/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roleParam = url.searchParams.get('role');
  const idParam = url.searchParams.get('id');

  const role = roleParam === 'student' ? 'student' : 'teacher';
  const id =
    idParam ||
    (role === 'teacher'
      ? '000000000000000000000001'
      : '000000000000000000000002');

  const token = jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '30d' }
  );

  return NextResponse.json({ token, role, id });
}
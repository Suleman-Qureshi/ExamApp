// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '../../../lib/db';
import Question from '../../../models/Question';
import { requireAuth, requireRole, handleAuthError } from '../../../lib/auth';

export const runtime = 'nodejs';
export const revalidate = 0;

// POST /api/questions (teacher)
export async function POST(request: Request) {
  // Auth + role
  let user;
  try {
    user = requireAuth(request);
    requireRole(user, 'teacher');
  } catch (e) {
    return handleAuthError(e);
  }

  try {
    const body = await request.json();

    // Dev fallback: return fake doc without DB
    if (process.env.ALLOW_DEV_TOKEN === 'true') {
      const now = new Date().toISOString();
      return NextResponse.json(
        {
          _id: '0000000000000000000000b1',
          ...body,
          createdAt: now,
          updatedAt: now,
        },
        { status: 201 }
      );
    }

    if (!body?.examId || !isValidObjectId(body.examId)) {
      return NextResponse.json({ message: 'Invalid examId' }, { status: 400 });
    }

    await connectDB();
    const q = await Question.create(body);
    return NextResponse.json(q, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { message: e?.message || 'Bad Request' },
      { status: 400 }
    );
  }
}
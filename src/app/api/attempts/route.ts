// app/api/attempts/route.ts
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '../../../lib/db';
import Attempt from '../../../models/Attempt';
import { requireAuth, handleAuthError } from '../../../lib/auth';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function POST(request: Request) {
  // Auth first
  let user;
  try {
    user = requireAuth(request);
  } catch (e) {
    return handleAuthError(e);
  }

  try {
    const body = await request.json();

    // Dev bypass: echo a fake doc (matches your Express behavior)
    if (process.env.ALLOW_DEV_TOKEN === 'true') {
      const now = new Date().toISOString();
      return NextResponse.json(
        {
          _id: '0000000000000000000000cc',
          ...body,
          examId: body?.examId || '0000000000000000000000aa',
          student: user.id,
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
    const attempt = await Attempt.create({ ...body, student: user.id });
    return NextResponse.json(attempt, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { message: e?.message || 'Bad Request' },
      { status: 400 }
    );
  }
}
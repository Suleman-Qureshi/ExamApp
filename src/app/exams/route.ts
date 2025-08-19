import { NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import Exam from '../../models/Exam';
import { requireAuth, requireRole, handleAuthError } from '../../lib/auth';
interface CustomError {message:string;statusCode?:number;}
export const runtime = 'nodejs';
export const revalidate = 0;

// GET /api/exams
export async function GET(request: Request) {
  // Auth
  let user;
  try {
    user = requireAuth(request);
  } catch (e) {
    return handleAuthError(e);
  }

  try {
    // Dev fallback: sample data, no DB
    if (process.env.ALLOW_DEV_TOKEN === 'true') {
      const now = new Date();
      const sample = [
        {
          _id: '0000000000000000000000aa',
          title: 'Sample Exam',
          description: 'Demo exam (dev mode)',
          durationMinutes: 60,
          teacher: user.id,
          startTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
          endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];
      return NextResponse.json(sample);
    }

    await connectDB();
    const exams = await Exam.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(exams);
  }catch (e: unknown) {
      const error =e as CustomError;
      console.error(e);
      return NextResponse.json(
        { message: error.message || 'Bad Request' },
        { status: 400 }
      );
    }
}

// POST /api/exams (teacher only)
export async function POST(request: Request) {
  // Auth + role
  let user;
  try {
    user = requireAuth(request);
  } catch (e) {
    return handleAuthError(e);
  }
  try {
    requireRole(user, 'teacher');
  } catch (e) {
    return handleAuthError(e);
  }

  try {
    const body = await request.json();

    // Dev fallback
    if (process.env.ALLOW_DEV_TOKEN === 'true') {
      const now = new Date().toISOString();
      return NextResponse.json(
        {
          _id: '0000000000000000000000ab',
          ...body,
          teacher: user.id,
          createdAt: now,
          updatedAt: now,
        },
        { status: 201 }
      );
    }

    await connectDB();
    const exam = await Exam.create({ ...body, teacher: user.id });
    return NextResponse.json(exam, { status: 201 });
  } catch (e: unknown) {
      const error =e as CustomError;
      console.error(e);
      return NextResponse.json(
        { message: error.message || 'Bad Request' },
        { status: 400 }
      );
    }
}
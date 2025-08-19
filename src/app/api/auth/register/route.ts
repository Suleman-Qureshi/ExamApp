import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '../../../../lib/db';
import User from '../../../../models/User';

export const runtime = 'nodejs';
export const revalidate = 0;
interface CustomError {message:string;statusCode?:number;code?:number;keyPattern?:{email:string};}
type RegisterBody = {
  email?: string;
  password?: string;
  userType?: 'student' | 'teacher';
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO string or yyyy-mm-dd
  gender?: string;
  institution?: string;
  fieldOfStudy?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;

    if (!body.email || !body.password || !body.userType) {
      return NextResponse.json(
        { message: 'email, password and userType are required' },
        { status: 400 }
      );
    }

    if (!['student', 'teacher'].includes(body.userType)) {
      return NextResponse.json(
        { message: 'userType must be student or teacher' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const exists = await User.findOne({ email: body.email }).lean();
    if (exists) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    await User.create({
      email: body.email,
      passwordHash,
      role: body.userType,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      gender: body.gender,
      institution: body.institution,
      fieldOfStudy: body.fieldOfStudy,
    });

    return NextResponse.json({ message: 'Registered successfully' }, { status: 201 });
  } catch (e: unknown) {
    const error = e as CustomError;
     // Handle unique-index race condition too
    if (error.code === 11000 && error.keyPattern?.email) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
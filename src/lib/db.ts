// lib/db.ts
import mongoose, { Mongoose } from 'mongoose';

// Cache the connection across hot reloads and serverless invocations
const globalForMongoose = global as unknown as {
  mongoose?: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
};

const cached =
  globalForMongoose.mongoose ??
  (globalForMongoose.mongoose = { conn: null as Mongoose | null, promise: null as Promise<Mongoose> | null });

export async function connectDB(uri?: string): Promise<Mongoose> {
  const mongoUri = uri ?? process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Add it to .env.local or pass connectDB(uri).');
  }

  // Reuse existing connection
  if (cached.conn) return cached.conn;

  // Create a new connection if needed
  if (!cached.promise) {
    mongoose.set('strictQuery', true); // optional
    cached.promise = mongoose.connect(mongoUri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next call
    throw err; // don't process.exit in Next.js
  }

  return cached.conn;
}
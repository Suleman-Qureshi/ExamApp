// models/User.ts
import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    firstName: { type: String },
    lastName: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    institution: { type: String },
    fieldOfStudy: { type: String },
  },
  { timestamps: true }
);

// Ensure unique index exists (recommended)
userSchema.index({ email: 1 }, { unique: true });

// Inferred TypeScript type from the schema
export type User = InferSchemaType<typeof userSchema>;

// Avoid OverwriteModelError in dev/HMR
export const UserModel: Model<User> =
  (models.User as Model<User>) || model<User>('User', userSchema);

export default UserModel;
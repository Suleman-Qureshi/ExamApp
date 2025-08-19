// models/Exam.ts
import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const examSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    durationMinutes: { type: Number },
    teacher: { type: Schema.Types.ObjectId, ref: 'User' },
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { timestamps: true }
);

// Infer TS type from the schema
export type Exam = InferSchemaType<typeof examSchema>;

// Avoid OverwriteModelError in dev/HMR
export const ExamModel: Model<Exam> =
  (models.Exam as Model<Exam>) || model<Exam>('Exam', examSchema);

export default ExamModel;
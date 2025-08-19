// models/Attempt.ts
import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
  // type HydratedDocument, // uncomment if you want a hydrated type
} from 'mongoose';

const answerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    selectedIndex: Number,
    correct: Boolean,
    score: Number,
  },
  // If you don't need an _id for each answer item, uncomment:
  // { _id: false }
);

const attemptSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    totalScore: Number,
    startedAt: Date,
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TS types inferred from the schema
export type Attempt = InferSchemaType<typeof attemptSchema>;
// export type AttemptDoc = HydratedDocument<Attempt>; // optional helper

// Avoid OverwriteModelError in dev/HMR
export const AttemptModel: Model<Attempt> =
  (models.Attempt as Model<Attempt>) || model<Attempt>('Attempt', attemptSchema);

export default AttemptModel;
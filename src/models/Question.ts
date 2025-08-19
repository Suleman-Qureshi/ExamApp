// models/Question.ts
import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const attachmentSchema = new Schema(
  {
    filename: { type: String },
    url: { type: String },
    mimetype: { type: String },
    size: { type: Number },
  },
  // If you don't need an _id for each attachment, you can use: { _id: false }
);

const questionSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    text: { type: String, required: true },
    options: [{ type: String }],
    answerIndex: { type: Number },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

// Inferred TS type from the schema
export type Question = InferSchemaType<typeof questionSchema>;

// Avoid OverwriteModelError during dev/HMR
export const QuestionModel: Model<Question> =
  (models.Question as Model<Question>) || model<Question>('Question', questionSchema);

export default QuestionModel;
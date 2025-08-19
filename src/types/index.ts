export type Exam = {
  _id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  teacher?: string;
};
export type Question = {
  _id: string;
  examId: string;
  text: string;
  options: string[];
  answerIndex?: number;
  attachments?: { url: string }[];
};
export type Attempt = {
  _id: string;
  examId: string;
  student: string;
  answers: {
    questionId: string;
    selectedIndex: number;
    correct?: boolean;
    score?: number;
  }[];
  totalScore?: number;
  createdAt?: string;
};
export type Role = 'student' | 'teacher';
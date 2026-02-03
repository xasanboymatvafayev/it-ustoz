
export const Subject = {
  FRONTEND: 'Frontend Development',
  BACKEND: 'Backend Development',
  MOBILE: 'Mobile App Development',
  DESIGN: 'UI/UX Design',
  AI_DATA: 'AI & Data Science'
} as const;

export type SubjectType = typeof Subject[keyof typeof Subject];

export interface EnrollmentRequest {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface User {
  id: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'parent';
  enrolledCourses: string[]; // Kurs IDlari
  avatar?: string;
  parentPhone?: string; // Missing
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: SubjectType;
  teacher: string;
  secretKey: string; // 18 talik kod
  createdAt: number;
}

export interface CourseTask {
  id: string;
  courseId: string;
  title: string;
  description: string;
  validationCriteria: string; // Admin belgilagan AI tekshirish mantig'i
  deadline?: number;
  timerEnd?: number; // Missing
}

export interface TaskResult {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  studentAnswer: string;
  aiFeedback: string;
  aiStatus: 'pass' | 'fail';
  adminGrade: number | null;
  timestamp: number;
  // Extended AI results used in ResultView
  grade: number;
  result: string;
  errors: string;
  mistakePatterns: string[];
  cognitiveImpact: number;
  marketabilityBoost: number;
  solution: string;
  explanation: string;
  audioData?: string;
}

export interface ChatMessage {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

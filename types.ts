
export const Subject = {
  FRONTEND: 'Frontend Development',
  BACKEND: 'Backend Development',
  MOBILE: 'Mobile App Development',
  DESIGN: 'UI/UX Design',
  AI_DATA: 'AI & Data Science'
} as const;

export type SubjectType = typeof Subject[keyof typeof Subject];

export interface User {
  id: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  grade: string;
  email: string;
  parentPhone?: string;
  role: 'user' | 'admin' | 'parent';
  enrolledCourses: string[];
  avatar?: string;
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

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: SubjectType;
  teacher: string;
  createdAt: number;
}

export interface EnrollmentRequest {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CourseTask {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  isClassTask?: boolean;
  timerEnd?: number;
}

export interface TaskResult {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  result: string;
  errors: string;
  solution: string;
  explanation: string;
  grade: number;
  adminGrade?: number;
  status: 'pending' | 'reviewed';
  timestamp: number;
  courseId: string;
}

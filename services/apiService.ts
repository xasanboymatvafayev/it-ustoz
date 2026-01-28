
import { User, Course, EnrollmentRequest, CourseTask, TaskResult, ChatMessage } from '../types';

const API_BASE = 'http://localhost:8000/api';

const getLocal = (key: string) => JSON.parse(localStorage.getItem(`db_${key}`) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(`db_${key}`, JSON.stringify(data));

// Baza holatini tekshirish uchun flag
export let isLiveDatabase = false;

async function smartFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    });
    if (!response.ok) throw new Error('API Error');
    isLiveDatabase = true;
    return await response.json();
  } catch (e) {
    isLiveDatabase = false;
    return null;
  }
}

export const api = {
  checkStatus: async () => {
    const res = await smartFetch(`${API_BASE}/users`);
    return res !== null;
  },

  getUsers: async (): Promise<User[]> => {
    const data = await smartFetch(`${API_BASE}/users`);
    if (data) return data;
    return getLocal('users');
  },

  updateUser: async (user: User) => {
    await smartFetch(`${API_BASE}/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });
    const users = getLocal('users');
    const updated = users.map((u: any) => u.id === user.id ? user : u);
    setLocal('users', updated);
  },

  getCourses: async (): Promise<Course[]> => {
    const data = await smartFetch(`${API_BASE}/courses`);
    if (data) return data;
    return getLocal('courses');
  },

  saveCourse: async (course: Course) => {
    await smartFetch(`${API_BASE}/courses`, { method: 'POST', body: JSON.stringify(course) });
    const courses = getLocal('courses');
    setLocal('courses', [...courses, course]);
  },

  getTasks: async (): Promise<CourseTask[]> => {
    const data = await smartFetch(`${API_BASE}/tasks`);
    if (data) return data;
    return getLocal('tasks');
  },

  saveTask: async (task: CourseTask) => {
    await smartFetch(`${API_BASE}/tasks`, { method: 'POST', body: JSON.stringify(task) });
    const tasks = getLocal('tasks');
    setLocal('tasks', [...tasks, task]);
  },

  startTaskTimer: async (taskId: string, durationMinutes: number) => {
    const endTime = Date.now() + durationMinutes * 60000;
    await smartFetch(`${API_BASE}/tasks/${taskId}/timer`, { method: 'PATCH', body: JSON.stringify({ timerEnd: endTime }) });
    const tasks = getLocal('tasks');
    const updated = tasks.map((t: any) => t.id === taskId ? { ...t, timerEnd: endTime } : t);
    setLocal('tasks', updated);
  },

  getResults: async (): Promise<TaskResult[]> => {
    const data = await smartFetch(`${API_BASE}/results`);
    if (data) return data;
    return getLocal('results');
  },

  saveResult: async (result: TaskResult) => {
    await smartFetch(`${API_BASE}/results`, { method: 'POST', body: JSON.stringify(result) });
    const results = getLocal('results');
    setLocal('results', [result, ...results]);
  },

  updateResult: async (resId: string, adminGrade: number) => {
    await smartFetch(`${API_BASE}/results/${resId}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ adminGrade, status: 'reviewed' }) 
    });
    const results = getLocal('results');
    const updated = results.map((r: any) => r.id === resId ? { ...r, adminGrade, status: 'reviewed' } : r);
    setLocal('results', updated);
  },

  getMessages: async (courseId: string): Promise<ChatMessage[]> => {
    const data = await smartFetch(`${API_BASE}/chat/${courseId}`);
    if (data) return data;
    const messages = getLocal('chat_messages');
    return messages.filter((m: any) => m.courseId === courseId);
  },

  sendMessage: async (msg: ChatMessage) => {
    await smartFetch(`${API_BASE}/chat`, { method: 'POST', body: JSON.stringify(msg) });
    const messages = getLocal('chat_messages');
    setLocal('chat_messages', [...messages, msg]);
  },

  getRequests: async (): Promise<EnrollmentRequest[]> => {
    const data = await smartFetch(`${API_BASE}/requests`);
    if (data) return data;
    return getLocal('requests');
  },

  saveRequest: async (req: EnrollmentRequest) => {
    await smartFetch(`${API_BASE}/requests`, { method: 'POST', body: JSON.stringify(req) });
    const requests = getLocal('requests');
    setLocal('requests', [...requests, req]);
  },

  approveRequest: async (reqId: string) => {
    await smartFetch(`${API_BASE}/requests/${reqId}/approve`, { method: 'POST' });
    const requests = getLocal('requests');
    const req = requests.find((r: any) => r.id === reqId);
    if (req) {
      const users = getLocal('users');
      const updatedUsers = users.map((u: any) => u.id === req.userId ? { ...u, enrolledCourses: [...u.enrolledCourses, req.courseId] } : u);
      setLocal('users', updatedUsers);
      setLocal('requests', requests.filter((r: any) => r.id !== reqId));
    }
  },

  deleteUserFromCourse: async (userId: string, courseId: string) => {
    await smartFetch(`${API_BASE}/users/${userId}/courses/${courseId}`, { method: 'DELETE' });
    const users = getLocal('users');
    const updatedUsers = users.map((u: any) => u.id === userId ? { ...u, enrolledCourses: (u.enrolledCourses || []).filter((id: string) => id !== courseId) } : u);
    setLocal('users', updatedUsers);
  },

  registerUserLocal: async (user: User) => {
    await smartFetch(`${API_BASE}/register_user`, { method: 'POST', body: JSON.stringify(user) });
    const users = getLocal('users');
    if (!users.find((u: any) => u.username === user.username)) {
      setLocal('users', [...users, user]);
    }
  }
};

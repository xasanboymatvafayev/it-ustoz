
import { User, Course, EnrollmentRequest, CourseTask, TaskResult, ChatMessage } from '../types';

const API_BASE = 'https://it-ustoz.onrender.com/api'; 

const getLocal = (key: string) => JSON.parse(localStorage.getItem(`db_${key}`) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(`db_${key}`, JSON.stringify(data));

async function smartFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!response.ok) throw new Error("API Offline");
    return await response.json();
  } catch (e) {
    console.warn(`Sinxronizatsiya local rejimda: ${endpoint}`);
    return null;
  }
}

export const api = {
  getUsers: async (): Promise<User[]> => {
    const data = await smartFetch('/users');
    if (data) return data;
    return getLocal('users');
  },

  updateUser: async (user: User) => {
    await smartFetch(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });
    const users = getLocal('users');
    const updated = users.map((u: any) => u.id === user.id ? user : u);
    setLocal('users', updated);
  },

  getCourses: async (): Promise<Course[]> => {
    const data = await smartFetch('/courses');
    if (data) return data;
    return getLocal('courses');
  },

  saveCourse: async (course: Course) => {
    await smartFetch('/courses', { method: 'POST', body: JSON.stringify(course) });
    const courses = getLocal('courses');
    setLocal('courses', [...courses, course]);
  },

  getTasks: async (): Promise<CourseTask[]> => {
    const data = await smartFetch('/tasks');
    if (data) return data;
    return getLocal('tasks');
  },

  saveTask: async (task: CourseTask) => {
    await smartFetch('/tasks', { method: 'POST', body: JSON.stringify(task) });
    const tasks = getLocal('tasks');
    setLocal('tasks', [...tasks, task]);
  },

  getResults: async (): Promise<TaskResult[]> => {
    const data = await smartFetch('/results');
    if (data) return data;
    return getLocal('results');
  },

  saveResult: async (result: TaskResult) => {
    await smartFetch('/results', { method: 'POST', body: JSON.stringify(result) });
    const results = getLocal('results');
    setLocal('results', [result, ...results]);
  },

  updateResult: async (id: string, grade: number) => {
    await smartFetch(`/results/${id}`, { method: 'PATCH', body: JSON.stringify({ adminGrade: grade }) });
    const results = getLocal('results');
    const updated = results.map((r: any) => r.id === id ? { ...r, adminGrade: grade } : r);
    setLocal('results', updated);
  },

  getRequests: async (): Promise<EnrollmentRequest[]> => {
    const data = await smartFetch('/requests');
    if (data) return data;
    return getLocal('requests');
  },

  saveRequest: async (request: EnrollmentRequest) => {
    await smartFetch('/requests', { method: 'POST', body: JSON.stringify(request) });
    const requests = getLocal('requests');
    setLocal('requests', [...requests, request]);
  },

  approveRequest: async (id: string) => {
    await smartFetch(`/requests/${id}/approve`, { method: 'POST' });
    const requests = getLocal('requests');
    const updated = requests.map((r: any) => r.id === id ? { ...r, status: 'approved' } : r);
    setLocal('requests', updated);
  },

  deleteUserFromCourse: async (userId: string, courseId: string) => {
    await smartFetch(`/users/${userId}/courses/${courseId}`, { method: 'DELETE' });
    const users = getLocal('users');
    const updated = users.map((u: any) => {
      if (u.id === userId) {
        return { ...u, enrolledCourses: u.enrolledCourses.filter((c: string) => c !== courseId) };
      }
      return u;
    });
    setLocal('users', updated);
  },

  getMessages: async (courseId: string): Promise<ChatMessage[]> => {
    const data = await smartFetch(`/messages/${courseId}`);
    if (data) return data;
    return getLocal(`messages_${courseId}`);
  },

  sendMessage: async (message: ChatMessage) => {
    await smartFetch('/messages', { method: 'POST', body: JSON.stringify(message) });
    const msgs = getLocal(`messages_${message.courseId}`);
    setLocal(`messages_${message.courseId}`, [...msgs, message]);
  },

  registerUserLocal: async (user: User) => {
    await smartFetch('/register_user', { method: 'POST', body: JSON.stringify(user) });
    const users = getLocal('users');
    if (!users.find((u: any) => u.username === user.username)) {
      setLocal('users', [...users, user]);
    }
  }
};

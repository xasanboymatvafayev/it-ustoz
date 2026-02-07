
import { User, Course, EnrollmentRequest, CourseTask, TaskResult, ChatMessage } from '../types';

/**
 * @file apiService.ts
 * @description Demo Fallback bilan boyitilgan API servisi.
 */

const getBaseUrl = () => {
  const PRODUCTION_DOMAIN = 'https://it-ustoz-production.up.railway.app';
  const base = PRODUCTION_DOMAIN;
  return `${base.replace(/\/+$/, '')}/api`;
};

const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 15000, 
  RETRY_COUNT: 2  
};

// Demo uchun local xotira yordamchisi
const localDB = {
  get: (key: string) => JSON.parse(localStorage.getItem(`demo_${key}`) || 'null'),
  set: (key: string, data: any) => localStorage.setItem(`demo_${key}`, JSON.stringify(data))
};

async function sovereignFetch<T>(endpoint: string, options: RequestInit = {}, retry = 0): Promise<T | null> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers 
      }
    });

    if (res.ok) {
      const data = await res.json();
      // Har gal muvaffaqiyatli yuklanganda local xotirani yangilaymiz (Demo fallback uchun)
      localDB.set(endpoint.split('/')[1], data);
      return data;
    }
    throw new Error("Network Error");
  } catch (err) {
    // Agar serverga bog'lanib bo'lmasa, local xotiradan ma'lumotni beramiz (Demo rejimi)
    console.warn(`[DEMO FALLBACK] Server unreachable for ${endpoint}. Using local storage.`);
    return localDB.get(endpoint.split('/')[1]) as T;
  }
}

export const api = {
  getUsers: () => sovereignFetch<User[]>('/users'),
  registerUserLocal: async (user: User) => {
    const users = localDB.get('users') || [];
    localDB.set('users', [...users, user]);
    return sovereignFetch('/register_user', { method: 'POST', body: JSON.stringify(user) });
  },
  getCourses: () => sovereignFetch<Course[]>('/courses'),
  saveCourse: (course: Course) => sovereignFetch('/courses', { method: 'POST', body: JSON.stringify(course) }),
  getTasks: () => sovereignFetch<CourseTask[]>('/tasks'),
  saveTask: (task: CourseTask) => sovereignFetch('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  getResults: () => sovereignFetch<TaskResult[]>('/results'),
  saveResult: (res: TaskResult) => sovereignFetch('/results', { method: 'POST', body: JSON.stringify(res) }),
  updateResult: (id: string, updates: any) => sovereignFetch(`/results/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  getRequests: () => sovereignFetch<EnrollmentRequest[]>('/requests'),
  saveRequest: (req: EnrollmentRequest) => sovereignFetch('/requests', { method: 'POST', body: JSON.stringify(req) }),
  approveRequest: (id: string) => sovereignFetch(`/requests/${id}/approve`, { method: 'POST' }),
  getMessages: (cId: string) => sovereignFetch<ChatMessage[]>(`/messages/${cId}`),
  sendMessage: (msg: ChatMessage) => sovereignFetch('/messages', { method: 'POST', body: JSON.stringify(msg) }),
  deleteUserFromCourse: (uId: string, cId: string) => sovereignFetch(`/users/${uId}/courses/${cId}`, { method: 'DELETE' }),
};

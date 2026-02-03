
import { User, Course, EnrollmentRequest, CourseTask, TaskResult, ChatMessage } from '../types';

/**
 * @file apiService.ts
 * @description Frontend va Backend o'rtasidagi asosiy muloqot servisi.
 */

const getBaseUrl = () => {
  // Foydalanuvchi taqdim etgan aniq Railway domini
  const PRODUCTION_DOMAIN = 'https://it-ustoz-production.up.railway.app';
  
  // Muhit o'zgaruvchilari tekshiriladi (Netlify/Vercel uchun)
  const shimUrl = (window as any).process?.env?.VITE_BACKEND_URL;
  const viteUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  
  const base = shimUrl || viteUrl || PRODUCTION_DOMAIN;
  
  // URLni tozalash va /api qo'shish
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}/api`;
};

const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 60000, // 60 soniya
  RETRY_COUNT: 5
};

async function sovereignFetch<T>(endpoint: string, options: RequestInit = {}, retry = 0): Promise<T | null> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Cache busting: Har bir so'rovga vaqt tamg'asini qo'shamiz (Failed to fetch keshini oldini olish uchun)
  const url = `${API_CONFIG.BASE_URL}${cleanEndpoint}${cleanEndpoint.includes('?') ? '&' : '?'}t=${Date.now()}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    console.log(`[NETWORK CALL] ${options.method || 'GET'} -> ${url}`);
    
    const res = await fetch(url, {
      ...options,
      cache: 'no-cache', // Keshdan foydalanmaslik
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers 
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status === 404) return null;

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || 'Server Error'}`);
    }
    
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    const isNetworkError = err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.name === 'AbortError';

    if (isNetworkError && retry < API_CONFIG.RETRY_COUNT) {
      // Eksponentsial kutish vaqti
      const waitTime = Math.pow(2, retry) * 2000; 
      console.warn(`[RETRYING ${retry + 1}/${API_CONFIG.RETRY_COUNT}] ${url} | ${waitTime}ms dan so'ng...`);
      await new Promise(r => setTimeout(r, waitTime));
      return sovereignFetch(endpoint, options, retry + 1);
    }
    
    console.error(`[FATAL API ERROR] Endpoint: ${endpoint} | Message: ${err.message}`);
    return null;
  }
}

export const api = {
  getUsers: () => sovereignFetch<User[]>('/users'),
  registerUserLocal: (user: User) => sovereignFetch('/register_user', { method: 'POST', body: JSON.stringify(user) }),
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
  deleteUserFromCourse: (uId: string, cId: string) => sovereignFetch(`/users/${uId}/courses/${cId}`, { method: 'DELETE' }),
  getMessages: (cId: string) => sovereignFetch<ChatMessage[]>(`/messages/${cId}`),
  sendMessage: (msg: ChatMessage) => sovereignFetch('/messages', { method: 'POST', body: JSON.stringify(msg) })
};

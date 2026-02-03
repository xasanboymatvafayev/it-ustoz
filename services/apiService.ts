
/**
 * @file apiService.ts
 * @module SovereignApiService
 * @description IT-Ustoz platformasining markaziy ma'lumotlar magistrali. 
 * Bu xizmat Railway platformasidagi backend bilan uzviy bog'langan va Netlify-dagi frontend bilan muloqot qiladi.
 */

import { User, Course, EnrollmentRequest, CourseTask, TaskResult, ChatMessage } from '../types';

/**
 * @constant API_CONFIG
 * @description Railway backend manzili va ulanish parametrlari.
 * VITE_BACKEND_URL Netlify panelida sozlanishi kerak.
 */
const API_CONFIG = {
  // Netlify panelida VITE_BACKEND_URL o'zgaruvchisini Railway URL manzili bilan to'ldiring
  BASE_URL: (process.env.VITE_BACKEND_URL || 'https://it-ustoz-backend-production.up.railway.app').replace(/\/$/, '') + '/api',
  TIMEOUT: 20000,
  RETRY_COUNT: 5,
  SYNC_INTERVAL: 30000,
  STORAGE_KEYS: {
    USERS: 'it_ustoz_db_users',
    COURSES: 'it_ustoz_db_courses',
    TASKS: 'it_ustoz_db_tasks',
    RESULTS: 'it_ustoz_db_results',
    REQUESTS: 'it_ustoz_db_requests',
    MESSAGES_PREFIX: 'it_ustoz_chat_'
  }
};

/**
 * @class DataPersistenceManager
 * @description Lokal ma'lumotlarni xavfsiz saqlash va sinxronizatsiya qilish uchun mas'ul.
 */
class DataPersistenceManager {
  private static instance: DataPersistenceManager;

  private constructor() {}

  public static getInstance(): DataPersistenceManager {
    if (!DataPersistenceManager.instance) {
      DataPersistenceManager.instance = new DataPersistenceManager();
    }
    return DataPersistenceManager.instance;
  }

  public get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data) as T[];
    } catch (err) {
      this.logError(`Failed to parse local data for key: ${key}`, err);
      return [];
    }
  }

  public set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      this.logError(`Failed to save data to local storage for key: ${key}`, err);
    }
  }

  public updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): void {
    const items = this.get<T>(key);
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
    this.set(key, updated);
  }

  private logError(message: string, error: any): void {
    console.error(`[SovereignDB Error]: ${message}`, error);
  }
}

const persistence = DataPersistenceManager.getInstance();

/**
 * @function sovereignFetch
 */
async function sovereignFetch<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  retryCount = 0
): Promise<T | null> {
  const url = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Sovereign-ID': 'IT-USTOZ-WEB-v3',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 404) return null;

    if (!response.ok) {
      if (response.status >= 500 && retryCount < API_CONFIG.RETRY_COUNT) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(res => setTimeout(res, delay));
        return sovereignFetch(endpoint, options, retryCount + 1);
      }
      throw new Error(`[API Error]: Status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[API Network Error]:`, error);
    return null;
  }
}

export const api = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const remote = await sovereignFetch<User[]>('/users');
    if (remote) {
      persistence.set(API_CONFIG.STORAGE_KEYS.USERS, remote);
      return remote;
    }
    return persistence.get<User>(API_CONFIG.STORAGE_KEYS.USERS);
  },

  registerUserLocal: async (user: User): Promise<void> => {
    await sovereignFetch('/register_user', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    const local = persistence.get<User>(API_CONFIG.STORAGE_KEYS.USERS);
    if (!local.find(u => u.username === user.username)) {
      persistence.set(API_CONFIG.STORAGE_KEYS.USERS, [...local, user]);
    }
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<void> => {
    await sovereignFetch(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    persistence.updateItem<User>(API_CONFIG.STORAGE_KEYS.USERS, userId, updates);
  },

  // --- COURSES ---
  getCourses: async (): Promise<Course[]> => {
    const remote = await sovereignFetch<Course[]>('/courses');
    if (remote) {
      persistence.set(API_CONFIG.STORAGE_KEYS.COURSES, remote);
      return remote;
    }
    return persistence.get<Course>(API_CONFIG.STORAGE_KEYS.COURSES);
  },

  saveCourse: async (course: Course): Promise<void> => {
    await sovereignFetch('/courses', {
      method: 'POST',
      body: JSON.stringify(course)
    });
    const local = persistence.get<Course>(API_CONFIG.STORAGE_KEYS.COURSES);
    persistence.set(API_CONFIG.STORAGE_KEYS.COURSES, [...local, course]);
  },

  // --- TASKS ---
  getTasks: async (): Promise<CourseTask[]> => {
    const remote = await sovereignFetch<CourseTask[]>('/tasks');
    if (remote) {
      persistence.set(API_CONFIG.STORAGE_KEYS.TASKS, remote);
      return remote;
    }
    return persistence.get<CourseTask>(API_CONFIG.STORAGE_KEYS.TASKS);
  },

  saveTask: async (task: CourseTask): Promise<void> => {
    await sovereignFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
    const local = persistence.get<CourseTask>(API_CONFIG.STORAGE_KEYS.TASKS);
    persistence.set(API_CONFIG.STORAGE_KEYS.TASKS, [...local, task]);
  },

  // --- RESULTS ---
  getResults: async (): Promise<TaskResult[]> => {
    const remote = await sovereignFetch<TaskResult[]>('/results');
    if (remote) {
      persistence.set(API_CONFIG.STORAGE_KEYS.RESULTS, remote);
      return remote;
    }
    return persistence.get<TaskResult>(API_CONFIG.STORAGE_KEYS.RESULTS);
  },

  saveResult: async (result: TaskResult): Promise<void> => {
    await sovereignFetch('/results', {
      method: 'POST',
      body: JSON.stringify(result)
    });
    const local = persistence.get<TaskResult>(API_CONFIG.STORAGE_KEYS.RESULTS);
    persistence.set(API_CONFIG.STORAGE_KEYS.RESULTS, [result, ...local]);
  },

  updateResult: async (id: string, grade: number): Promise<void> => {
    await sovereignFetch(`/results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ adminGrade: grade, status: 'reviewed' })
    });
    persistence.updateItem<TaskResult>(API_CONFIG.STORAGE_KEYS.RESULTS, id, { adminGrade: grade, status: 'reviewed' });
  },

  // --- REQUESTS ---
  getRequests: async (): Promise<EnrollmentRequest[]> => {
    const remote = await sovereignFetch<EnrollmentRequest[]>('/requests');
    if (remote) {
      persistence.set(API_CONFIG.STORAGE_KEYS.REQUESTS, remote);
      return remote;
    }
    return persistence.get<EnrollmentRequest>(API_CONFIG.STORAGE_KEYS.REQUESTS);
  },

  saveRequest: async (req: EnrollmentRequest): Promise<void> => {
    await sovereignFetch('/requests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    const local = persistence.get<EnrollmentRequest>(API_CONFIG.STORAGE_KEYS.REQUESTS);
    persistence.set(API_CONFIG.STORAGE_KEYS.REQUESTS, [...local, req]);
  },

  approveRequest: async (requestId: string): Promise<void> => {
    await sovereignFetch(`/requests/${requestId}/approve`, { method: 'POST' });
    const localReqs = persistence.get<EnrollmentRequest>(API_CONFIG.STORAGE_KEYS.REQUESTS);
    const updated = localReqs.map(r => r.id === requestId ? { ...r, status: 'approved' as const } : r);
    persistence.set(API_CONFIG.STORAGE_KEYS.REQUESTS, updated);
  },

  // --- MESSAGES ---
  getMessages: async (courseId: string): Promise<ChatMessage[]> => {
    const storageKey = `${API_CONFIG.STORAGE_KEYS.MESSAGES_PREFIX}${courseId}`;
    const remote = await sovereignFetch<ChatMessage[]>(`/messages/${courseId}`);
    if (remote) {
      persistence.set(storageKey, remote);
      return remote;
    }
    return persistence.get<ChatMessage>(storageKey);
  },

  sendMessage: async (msg: ChatMessage): Promise<void> => {
    await sovereignFetch('/messages', {
      method: 'POST',
      body: JSON.stringify(msg)
    });
    const storageKey = `${API_CONFIG.STORAGE_KEYS.MESSAGES_PREFIX}${msg.courseId}`;
    const local = persistence.get<ChatMessage>(storageKey);
    persistence.set(storageKey, [...local, msg]);
  },

  deleteUserFromCourse: async (userId: string, courseId: string): Promise<void> => {
    await sovereignFetch(`/users/${userId}/courses/${courseId}`, { method: 'DELETE' });
    const users = persistence.get<User>(API_CONFIG.STORAGE_KEYS.USERS);
    const updated = users.map(u => u.id === userId ? { ...u, enrolledCourses: u.enrolledCourses.filter(id => id !== courseId) } : u);
    persistence.set(API_CONFIG.STORAGE_KEYS.USERS, updated);
  }
};

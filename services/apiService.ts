
/**
 * @file apiService.ts
 * @description IT-Ustoz platformasining markaziy ma'lumotlar boshqaruv xizmati.
 * Bu xizmat backend bilan sinxronizatsiya va lokal ma'lumotlarni keshlashtirishni ta'minlaydi.
 */

import { User, Course, EnrollmentRequest, CourseTask, TaskResult, ChatMessage } from '../types';

// API sozlamalari
const API_BASE = 'https://it-ustoz.onrender.com/api';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

/**
 * Lokal ma'lumotlar bazasini boshqarish uchun yordamchi funksiyalar
 */
const storage = {
  get: (key: string): any[] => {
    try {
      const data = localStorage.getItem(`db_${key}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`LocalStorage error (${key}):`, e);
      return [];
    }
  },
  set: (key: string, data: any): void => {
    try {
      localStorage.setItem(`db_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error(`LocalStorage save error (${key}):`, e);
    }
  },
  updateItem: (key: string, id: string, updates: any): void => {
    const data = storage.get(key);
    const updated = data.map((item: any) => item.id === id ? { ...item, ...updates } : item);
    storage.set(key, updated);
  }
};

/**
 * API bilan xavfsiz aloqa o'rnatish funksiyasi
 * @param endpoint API manzili
 * @param options Fetch optsiyalari
 */
async function secureFetch(endpoint: string, options?: RequestInit, attempt = 1): Promise<any> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'AI-Ustoz-Web',
    'X-Request-Timestamp': Date.now().toString()
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options?.headers },
    });

    if (!response.ok) {
      if (response.status >= 500 && attempt <= RETRY_ATTEMPTS) {
        console.warn(`Server error (5xx). Retrying ${attempt}/${RETRY_ATTEMPTS}...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY * attempt));
        return secureFetch(endpoint, options, attempt + 1);
      }
      throw new Error(`API returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch error on ${endpoint}:`, error);
    return null; // Local rejimga o'tish uchun null qaytariladi
  }
}

/**
 * Markaziy API ob'ekti
 */
export const api = {
  // --- USER OPERATIONS ---
  getUsers: async (): Promise<User[]> => {
    const data = await secureFetch('/users');
    if (data) {
      storage.set('users', data);
      return data;
    }
    return storage.get('users');
  },

  updateUser: async (user: User): Promise<void> => {
    const success = await secureFetch(`/users/${user.id}`, { 
      method: 'PUT', 
      body: JSON.stringify(user) 
    });
    storage.updateItem('users', user.id, user);
  },

  registerUserLocal: async (user: User): Promise<void> => {
    await secureFetch('/register_user', { 
      method: 'POST', 
      body: JSON.stringify(user) 
    });
    const users = storage.get('users');
    if (!users.find((u: any) => u.username === user.username)) {
      storage.set('users', [...users, user]);
    }
  },

  // --- COURSE OPERATIONS ---
  getCourses: async (): Promise<Course[]> => {
    const data = await secureFetch('/courses');
    if (data) {
      storage.set('courses', data);
      return data;
    }
    return storage.get('courses');
  },

  saveCourse: async (course: Course): Promise<void> => {
    await secureFetch('/courses', { 
      method: 'POST', 
      body: JSON.stringify(course) 
    });
    const courses = storage.get('courses');
    storage.set('courses', [...courses, course]);
  },

  deleteUserFromCourse: async (userId: string, courseId: string): Promise<void> => {
    await secureFetch(`/users/${userId}/courses/${courseId}`, { method: 'DELETE' });
    const users = storage.get('users');
    const updated = users.map((u: User) => {
      if (u.id === userId) {
        return { 
          ...u, 
          enrolledCourses: (u.enrolledCourses || []).filter((c: string) => c !== courseId) 
        };
      }
      return u;
    });
    storage.set('users', updated);
  },

  // --- TASK OPERATIONS ---
  getTasks: async (): Promise<CourseTask[]> => {
    const data = await secureFetch('/tasks');
    if (data) {
      storage.set('tasks', data);
      return data;
    }
    return storage.get('tasks');
  },

  saveTask: async (task: CourseTask): Promise<void> => {
    await secureFetch('/tasks', { 
      method: 'POST', 
      body: JSON.stringify(task) 
    });
    const tasks = storage.get('tasks');
    storage.set('tasks', [...tasks, task]);
  },

  // --- RESULT OPERATIONS ---
  getResults: async (): Promise<TaskResult[]> => {
    const data = await secureFetch('/results');
    if (data) {
      storage.set('results', data);
      return data;
    }
    return storage.get('results');
  },

  saveResult: async (result: TaskResult): Promise<void> => {
    await secureFetch('/results', { 
      method: 'POST', 
      body: JSON.stringify(result) 
    });
    const results = storage.get('results');
    storage.set('results', [result, ...results]);
  },

  updateResult: async (id: string, grade: number): Promise<void> => {
    await secureFetch(`/results/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ adminGrade: grade }) 
    });
    storage.updateItem('results', id, { adminGrade: grade });
  },

  // --- ENROLLMENT REQUESTS ---
  getRequests: async (): Promise<EnrollmentRequest[]> => {
    const data = await secureFetch('/requests');
    if (data) {
      storage.set('requests', data);
      return data;
    }
    return storage.get('requests');
  },

  saveRequest: async (request: EnrollmentRequest): Promise<void> => {
    await secureFetch('/requests', { 
      method: 'POST', 
      body: JSON.stringify(request) 
    });
    const requests = storage.get('requests');
    storage.set('requests', [...requests, request]);
  },

  approveRequest: async (id: string): Promise<void> => {
    await secureFetch(`/requests/${id}/approve`, { method: 'POST' });
    const requests = storage.get('requests');
    const updated = requests.map((r: EnrollmentRequest) => 
      r.id === id ? { ...r, status: 'approved' as const } : r
    );
    storage.set('requests', updated);
    
    // Foydalanuvchi ma'lumotlarini ham yangilash (kurs ID sini qo'shish)
    const req = requests.find(r => r.id === id);
    if (req) {
      const users = storage.get('users');
      const updatedUsers = users.map((u: User) => {
        if (u.id === req.userId) {
          const courses = u.enrolledCourses || [];
          return { ...u, enrolledCourses: Array.from(new Set([...courses, req.courseId])) };
        }
        return u;
      });
      storage.set('users', updatedUsers);
    }
  },

  // --- MESSAGING ---
  getMessages: async (courseId: string): Promise<ChatMessage[]> => {
    const data = await secureFetch(`/messages/${courseId}`);
    if (data) {
      storage.set(`messages_${courseId}`, data);
      return data;
    }
    return storage.get(`messages_${courseId}`);
  },

  sendMessage: async (message: ChatMessage): Promise<void> => {
    await secureFetch('/messages', { 
      method: 'POST', 
      body: JSON.stringify(message) 
    });
    const msgs = storage.get(`messages_${message.courseId}`);
    storage.set(`messages_${message.courseId}`, [...msgs, message]);
  }
};

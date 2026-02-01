
import { User, Course, EnrollmentRequest, CourseTask, TaskResult, ChatMessage } from '../types.ts';

// Ensure the URL ends without a slash for consistent concatenation
const API_BASE = 'https://it-ustoz.onrender.com/api'; 

const getLocal = (key: string) => JSON.parse(localStorage.getItem(`db_${key}`) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(`db_${key}`, JSON.stringify(data));

export let isLiveDatabase = false;

async function smartFetch(endpoint: string, options?: RequestInit) {
  // Construct URL carefully to avoid double slashes if endpoint starts with one
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 
        'Content-Type': 'application/json',
        ...options?.headers 
      },
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.warn(`API Error ${response.status}: ${response.statusText} at URL: ${url}`);
      // Throwing error to catch it and fallback to local storage
      throw new Error(`API Error: ${response.status}`);
    }
    
    isLiveDatabase = true;
    return await response.json();
  } catch (e) {
    console.error(`Fetch attempt failed for: ${url}. Falling back to local storage if available. Error:`, e);
    isLiveDatabase = false;
    return null;
  }
}

export const api = {
  checkStatus: async () => {
    // Check root or health endpoint
    const res = await smartFetch(`/health`);
    return res !== null;
  },

  getUsers: async (): Promise<User[]> => {
    const data = await smartFetch(`/users`);
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
    const data = await smartFetch(`/courses`);
    if (data) return data;
    return getLocal('courses');
  },

  saveCourse: async (course: Course) => {
    await smartFetch(`/courses`, { method: 'POST', body: JSON.stringify(course) });
    const courses = getLocal('courses');
    setLocal('courses', [...courses, course]);
  },

  getTasks: async (): Promise<CourseTask[]> => {
    const data = await smartFetch(`/tasks`);
    if (data) return data;
    return getLocal('tasks');
  },

  saveTask: async (task: CourseTask) => {
    await smartFetch(`/tasks`, { method: 'POST', body: JSON.stringify(task) });
    const tasks = getLocal('tasks');
    setLocal('tasks', [...tasks, task]);
  },

  getResults: async (): Promise<TaskResult[]> => {
    const data = await smartFetch(`/results`);
    if (data) return data;
    return getLocal('results');
  },

  saveResult: async (result: TaskResult) => {
    await smartFetch(`/results`, { method: 'POST', body: JSON.stringify(result) });
    const results = getLocal('results');
    setLocal('results', [result, ...results]);
  },

  updateResult: async (resId: string, adminGrade: number) => {
    await smartFetch(`/results/${resId}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ adminGrade, status: 'reviewed' }) 
    });
    const results = getLocal('results');
    const updated = results.map((r: any) => r.id === resId ? { ...r, adminGrade, status: 'reviewed' } : r);
    setLocal('results', updated);
  },

  getRequests: async (): Promise<EnrollmentRequest[]> => {
    const data = await smartFetch(`/requests`);
    if (data) return data;
    return getLocal('requests');
  },

  saveRequest: async (req: EnrollmentRequest) => {
    await smartFetch(`/requests`, { method: 'POST', body: JSON.stringify(req) });
    const requests = getLocal('requests');
    setLocal('requests', [...requests, req]);
  },

  approveRequest: async (reqId: string) => {
    await smartFetch(`/requests/${reqId}/approve`, { method: 'POST' });
    const requests = getLocal('requests');
    const req = requests.find((r: any) => r.id === reqId);
    if (req) {
      const users = getLocal('users');
      const updatedUsers = users.map((u: any) => u.id === req.userId ? { ...u, enrolledCourses: [...(u.enrolledCourses || []), req.courseId] } : u);
      setLocal('users', updatedUsers);
      setLocal('requests', requests.filter((r: any) => r.id !== reqId));
    }
  },

  deleteUserFromCourse: async (userId: string, courseId: string) => {
    await smartFetch(`/users/${userId}/courses/${courseId}`, { method: 'DELETE' });
    const users = getLocal('users');
    const updatedUsers = users.map((u: any) => u.id === userId ? { ...u, enrolledCourses: (u.enrolledCourses || []).filter((id: string) => id !== courseId) } : u);
    setLocal('users', updatedUsers);
  },

  registerUserLocal: async (user: User) => {
    await smartFetch(`/register_user`, { method: 'POST', body: JSON.stringify(user) });
    const users = getLocal('users');
    if (!users.find((u: any) => u.username === user.username)) {
      setLocal('users', [...users, user]);
    }
  },

  // Fix: Added getMessages to handle chat history retrieval for CourseChat.tsx
  getMessages: async (courseId: string): Promise<ChatMessage[]> => {
    const data = await smartFetch(`/messages?courseId=${courseId}`);
    if (data) return data;
    const allMessages = getLocal('messages');
    return allMessages.filter((m: any) => m.courseId === courseId);
  },

  // Fix: Added sendMessage to allow users to send messages in CourseChat.tsx
  sendMessage: async (message: ChatMessage) => {
    await smartFetch(`/messages`, { method: 'POST', body: JSON.stringify(message) });
    const messages = getLocal('messages');
    setLocal('messages', [...messages, message]);
  }
};

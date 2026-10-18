import type { AuthResponse, Category, Reminder, Task, TaskListResponse, TaskPriority, TaskStatus, User } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'task_manager_access_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) tokenStore.clear();
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    throw new Error(message ?? `Request failed (${response.status})`);
  }
  return payload as T;
}

export const api = {
  register: (body: { email: string; password: string; fullName?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<User>('/auth/me'),
  listTasks: (params: { page: number; status?: TaskStatus; priority?: TaskPriority; categoryId?: string }) => {
    const search = new URLSearchParams({ page: String(params.page), limit: '8', sortBy: 'createdAt', order: 'desc' });
    if (params.status) search.set('status', params.status);
    if (params.priority) search.set('priority', params.priority);
    if (params.categoryId) search.set('categoryId', params.categoryId);
    return request<TaskListResponse>(`/tasks?${search}`);
  },
  createTask: (body: { title: string; description?: string; priority?: TaskPriority; categoryId?: string }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id: string, body: { status?: TaskStatus; title?: string }) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  listCategories: () => request<Category[]>('/categories'),
  listReminders: () => request<Reminder[]>('/reminders'),
};

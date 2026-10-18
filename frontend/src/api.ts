import type { AuthResponse, Category, Reminder, Tag, Task, TaskListResponse, TaskPriority, TaskStatus, User } from './types';

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
  listTasks: (params: { page: number; status?: TaskStatus; priority?: TaskPriority; categoryId?: string; sortBy?: 'createdAt' | 'dueAt'; order?: 'asc' | 'desc' }) => {
    const search = new URLSearchParams({ page: String(params.page), limit: '8', sortBy: params.sortBy ?? 'createdAt', order: params.order ?? 'desc' });
    if (params.status) search.set('status', params.status);
    if (params.priority) search.set('priority', params.priority);
    if (params.categoryId) search.set('categoryId', params.categoryId);
    return request<TaskListResponse>(`/tasks?${search}`);
  },
  createTask: (body: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; categoryId?: string; parentId?: string; dueAt?: string }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id: string, body: { status?: TaskStatus; title?: string; description?: string; priority?: TaskPriority; categoryId?: string; parentId?: string; dueAt?: string }) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  listCategories: () => request<Category[]>('/categories'),
  createCategory: (body: { name: string; colorHex?: string; icon?: string }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  listTags: () => request<Tag[]>('/tags'),
  createTag: (body: { name: string; colorHex?: string }) =>
    request<Tag>('/tags', { method: 'POST', body: JSON.stringify(body) }),
  deleteTag: (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
  attachTag: (taskId: string, tagId: string) =>
    request<Task>(`/tasks/${taskId}/tags`, { method: 'POST', body: JSON.stringify({ tagId }) }),
  detachTag: (taskId: string, tagId: string) =>
    request<void>(`/tasks/${taskId}/tags/${tagId}`, { method: 'DELETE' }),
  listReminders: () => request<Reminder[]>('/reminders'),
};

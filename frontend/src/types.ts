export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  timezone: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  colorHex: string;
  icon: string | null;
}

export interface Tag {
  id: string;
  name: string;
  colorHex: string;
}

export interface TaskTag {
  tagId: string;
  tag: Tag;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categoryId: string | null;
  parentId: string | null;
  category: Category | null;
  taskTags: TaskTag[];
}

export interface TaskListResponse {
  data: Task[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Reminder {
  id: string;
  title: string;
  dueAt: string;
  priority: TaskPriority;
  kind: 'overdue' | 'upcoming';
}

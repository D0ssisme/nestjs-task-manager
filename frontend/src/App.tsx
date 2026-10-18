import { FormEvent, useEffect, useState } from 'react';
import { api, tokenStore } from './api';
import type { Category, Reminder, Task, TaskPriority, TaskStatus, User } from './types';

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'Chưa làm',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ',
};
const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center-page">Đang tải...</div>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  return <Dashboard user={user} onLogout={() => { tokenStore.clear(); setUser(null); }} />;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = registering
        ? await api.register({ email, password, fullName })
        : await api.login({ email, password });
      tokenStore.set(result.accessToken);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">TM</div>
        <p className="eyebrow">PERSONAL WORKSPACE</p>
        <h1>{registering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1>
        <p className="muted">{registering ? 'Bắt đầu quản lý công việc gọn gàng hơn.' : 'Đăng nhập để tiếp tục với công việc của bạn.'}</p>
        <form onSubmit={submit} className="stack">
          {registering && <label>Họ và tên<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" /></label>}
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Mật khẩu<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu của bạn" /></label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-button" disabled={busy}>{busy ? 'Đang xử lý...' : registering ? 'Đăng ký' : 'Đăng nhập'}</button>
        </form>
        <button className="link-button" onClick={() => { setRegistering(!registering); setError(''); }}>
          {registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        </button>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);

  async function loadTasks() {
    try {
      const result = await api.listTasks({ page, status: status || undefined, priority: priority || undefined });
      setTasks(result.data);
      setTotalPages(result.meta.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải task');
    }
  }
  useEffect(() => { void loadTasks(); }, [page, status, priority]);
  useEffect(() => { api.listCategories().then(setCategories).catch(() => undefined); }, []);
  useEffect(() => {
    const loadReminders = () => { api.listReminders().then(setReminders).catch(() => undefined); };
    loadReminders();
    const interval = window.setInterval(loadReminders, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function changeStatus(task: Task, nextStatus: TaskStatus) {
    try { await api.updateTask(task.id, { status: nextStatus }); await loadTasks(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể cập nhật task'); }
  }
  async function removeTask(task: Task) {
    if (!window.confirm(`Xóa task "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    await loadTasks();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark small">TM</span><strong>Task Manager</strong></div>
        <div className="profile">
          <div className="notification-wrap">
            <button className="notification-button" aria-label="Thông báo" onClick={() => setShowReminders(!showReminders)}>🔔{reminders.length > 0 && <span className="notification-count">{reminders.length}</span>}</button>
            {showReminders && <div className="notification-panel"><strong>Thông báo</strong>{reminders.length === 0 ? <p className="muted">Không có task sắp đến hạn.</p> : reminders.map((reminder) => <div className="notification-item" key={reminder.id}><strong>{reminder.kind === 'overdue' ? 'Đã quá hạn' : 'Sắp đến hạn'}</strong><span>{reminder.title}</span><small>{new Date(reminder.dueAt).toLocaleString('vi-VN')}</small></div>)}</div>}
          </div>
          <span className="avatar">{(user.fullName ?? user.email)[0].toUpperCase()}</span><span>{user.fullName ?? user.email}</span><button className="ghost-button" onClick={onLogout}>Đăng xuất</button>
        </div>
      </header>
      <main className="content">
        <div className="page-heading"><div><p className="eyebrow">MY WORKSPACE</p><h1>Công việc của tôi</h1><p className="muted">Tập trung vào điều quan trọng nhất hôm nay.</p></div><button className="primary-button" onClick={() => setShowForm(!showForm)}>＋ Tạo task</button></div>
        {showForm && <TaskForm categories={categories} onCreated={() => { setShowForm(false); void loadTasks(); }} />}
        <div className="toolbar">
          <select value={status} onChange={(e) => { setStatus(e.target.value as TaskStatus | ''); setPage(1); }}><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value as TaskPriority | ''); setPage(1); }}><option value="">Tất cả ưu tiên</option>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>
        {error && <div className="error-box">{error}</div>}
        <section className="task-list">
          {tasks.length === 0 ? <div className="empty-state"><span>✓</span><h2>Chưa có task nào</h2><p>Tạo task đầu tiên để bắt đầu theo dõi công việc.</p></div> : tasks.map((task) => <article className={`task-card ${task.status === 'DONE' ? 'completed' : ''}`} key={task.id}><div className="task-main"><button className={`check ${task.status === 'DONE' ? 'checked' : ''}`} onClick={() => void changeStatus(task, task.status === 'DONE' ? 'TODO' : 'DONE')}>{task.status === 'DONE' ? '✓' : ''}</button><div><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`pill priority-${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span>{task.category && <span className="category">{task.category.name}</span>}<span>{statusLabels[task.status]}</span></div></div></div><div className="task-actions"><select value={task.status} onChange={(e) => void changeStatus(task, e.target.value as TaskStatus)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button className="icon-button" onClick={() => void removeTask(task)}>×</button></div></article>)}
        </section>
        {tasks.length > 0 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Trước</button><span>Trang {page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau →</button></div>}
      </main>
    </div>
  );
}

function TaskForm({ categories, onCreated }: { categories: Category[]; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    try { await api.createTask({ title, description, priority, categoryId: categoryId || undefined }); onCreated(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể tạo task'); }
  }
  return <form className="task-form" onSubmit={submit}><div className="form-row"><input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên task..." /><select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Không có category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="primary-button">Lưu</button></div><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả (không bắt buộc)" />{error && <div className="error-box">{error}</div>}</form>;
}

import { FormEvent, useEffect, useState } from 'react';
import { api, tokenStore } from './api';
import type { Category, Reminder, Tag, Task, TaskPriority, TaskStatus, User } from './types';

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
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
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
  const [tags, setTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [overview, setOverview] = useState({ total: 0, done: 0, inProgress: 0 });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueAt'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);

  async function loadTasks() {
    try {
      const [result, counts, notifications] = await Promise.all([
        api.listTasks({ page, status: status || undefined, priority: priority || undefined, categoryId: categoryId || undefined, sortBy, order }),
        api.overview(), api.listReminders(),
      ]);
      setOverview(counts);
      setReminders(notifications);
      if (page > Math.max(1, result.meta.totalPages)) setPage(Math.max(1, result.meta.totalPages));
      setTasks(result.data);
      setTotalPages(result.meta.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải task');
    }
  }
  async function loadMetadata() {
    const [categoryResult, tagResult] = await Promise.allSettled([api.listCategories(), api.listTags()]);
    if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value);
    if (tagResult.status === 'fulfilled') setTags(tagResult.value);
    if (categoryResult.status === 'rejected' || tagResult.status === 'rejected') setError('Không thể tải danh mục hoặc nhãn. Vui lòng thử lại.');
  }
  useEffect(() => { void loadTasks(); }, [page, status, priority, categoryId, sortBy, order]);
  useEffect(() => { void loadMetadata(); }, []);
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
    try { await api.deleteTask(task.id); await loadTasks(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể xóa task'); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark small">TM</span><div><strong>Task Manager</strong><small>Personal workspace</small></div></div>
        <div className="profile">
          <div className="notification-wrap">
            <button className="notification-button" aria-label="Thông báo" onClick={() => setShowReminders(!showReminders)}>🔔{reminders.length > 0 && <span className="notification-count">{reminders.length}</span>}</button>
            {showReminders && <div className="notification-panel"><strong>Thông báo</strong>{reminders.length === 0 ? <p className="muted">Không có task sắp đến hạn.</p> : reminders.map((reminder) => <div className="notification-item" key={reminder.id}><strong>{reminder.kind === 'overdue' ? 'Đã quá hạn' : 'Sắp đến hạn'}</strong><span>{reminder.title}</span><small>{new Date(reminder.dueAt).toLocaleString('vi-VN')}</small></div>)}</div>}
          </div>
          <span className="avatar">{(user.fullName ?? user.email)[0].toUpperCase()}</span>
          <span>{user.fullName ?? user.email}</span>
          <button className="ghost-button" onClick={onLogout}>Đăng xuất</button>
        </div>
      </header>
      <main className="content">
        <div className="page-heading"><div><p className="eyebrow">MY WORKSPACE / OVERVIEW</p><h1>Công việc của tôi</h1><p className="muted">Tập trung vào điều quan trọng nhất hôm nay.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => setShowManagement(!showManagement)}>Quản lý dữ liệu</button><button className="primary-button" onClick={() => { setEditingTask(null); setShowForm(!showForm); }}>＋ Tạo task</button></div></div>
        <section className="overview-grid">
          <div className="overview-card accent-blue"><span className="overview-icon">◷</span><div><small>Tổng công việc</small><strong>{overview.total}</strong></div></div>
          <div className="overview-card accent-green"><span className="overview-icon">✓</span><div><small>Đã hoàn thành</small><strong>{overview.done}</strong></div></div>
          <div className="overview-card accent-orange"><span className="overview-icon">!</span><div><small>Đang thực hiện</small><strong>{overview.inProgress}</strong></div></div>
          <div className="overview-card accent-red"><span className="overview-icon">⌁</span><div><small>Sắp đến hạn</small><strong>{reminders.filter((item) => item.kind === 'upcoming').length}</strong></div></div>
        </section>
        {showManagement && <ManagementPanel categories={categories} tags={tags} onChanged={() => { void loadMetadata(); void loadTasks(); }} />}
        {showForm && <TaskForm key={editingTask?.id ?? 'new'} task={editingTask ?? undefined} categories={categories} onCreated={() => { setShowForm(false); setEditingTask(null); void loadTasks(); }} onCancel={() => { setShowForm(false); setEditingTask(null); }} />}
        <div className="section-heading"><div><h2>Danh sách công việc</h2><p className="muted">Theo dõi tiến độ và deadline của bạn.</p></div><span className="result-count">{tasks.length} công việc</span></div>
        <div className="toolbar">
          <span className="filter-label">Lọc theo</span><select value={status} onChange={(e) => { setStatus(e.target.value as TaskStatus | ''); setPage(1); }}><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value as TaskPriority | ''); setPage(1); }}><option value="">Tất cả ưu tiên</option>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}><option value="">Tất cả category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <select value={`${sortBy}:${order}`} onChange={(e) => { const [nextSort, nextOrder] = e.target.value.split(':') as ['createdAt' | 'dueAt', 'asc' | 'desc']; setSortBy(nextSort); setOrder(nextOrder); setPage(1); }}><option value="createdAt:desc">Mới nhất</option><option value="createdAt:asc">Cũ nhất</option><option value="dueAt:asc">Hạn gần nhất</option><option value="dueAt:desc">Hạn xa nhất</option></select>
        </div>
        {error && <div className="error-box">{error}</div>}
        <section className="task-list">
          {tasks.length === 0 ? <div className="empty-state"><span>✓</span><h2>Chưa có task nào</h2><p>Tạo task đầu tiên để bắt đầu theo dõi công việc.</p></div> : tasks.map((task) => <TaskCard key={task.id} task={task} tags={tags} onEdit={() => { setEditingTask(task); setShowForm(true); }} onStatusChange={changeStatus} onDelete={removeTask} onTagsChanged={loadTasks} />)}
        </section>
        {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Trước</button><span>Trang {page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau →</button></div>}
      </main>
    </div>
  );
}

function TaskCard({ task, tags, onEdit, onStatusChange, onDelete, onTagsChanged }: { task: Task; tags: Tag[]; onEdit: () => void; onStatusChange: (task: Task, status: TaskStatus) => void; onDelete: (task: Task) => void; onTagsChanged: () => void }) {
  const [tagId, setTagId] = useState('');
  const [tagError, setTagError] = useState('');
  const availableTags = tags.filter((tag) => !task.taskTags.some((taskTag) => taskTag.tagId === tag.id));
  async function attachTag() { if (!tagId) return; try { await api.attachTag(task.id, tagId); setTagId(''); setTagError(''); onTagsChanged(); } catch (err) { setTagError(err instanceof Error ? err.message : 'Không thể gắn nhãn'); } }
  async function detachTag(tagIdToRemove: string) { try { await api.detachTag(task.id, tagIdToRemove); setTagError(''); onTagsChanged(); } catch (err) { setTagError(err instanceof Error ? err.message : 'Không thể gỡ nhãn'); } }
  return <article className={`task-card ${task.status === 'DONE' ? 'completed' : ''}`}><div className="task-main"><button className={`check ${task.status === 'DONE' ? 'checked' : ''}`} onClick={() => void onStatusChange(task, task.status === 'DONE' ? 'TODO' : 'DONE')}>{task.status === 'DONE' ? '✓' : ''}</button><div className="task-copy"><div className="task-title-row"><h3>{task.title}</h3><span className={`status-dot status-${task.status.toLowerCase()}`}>{statusLabels[task.status]}</span></div>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`pill priority-${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span>{task.category && <span className="category">{task.category.name}</span>}{task.dueAt && <span className={new Date(task.dueAt) < new Date() && task.status !== 'DONE' ? 'due overdue' : 'due'}>◷ {new Date(task.dueAt).toLocaleString('vi-VN')}</span>}</div><div className="tag-list">{task.taskTags.map(({ tag }) => <button className="tag" key={tag.id} onClick={() => void detachTag(tag.id)} title="Bấm để bỏ tag">#{tag.name} ×</button>)}</div><div className="tag-actions">{tagError && <p role="alert" className="error-box">{tagError}</p>}{availableTags.length > 0 && <><select value={tagId} onChange={(e) => setTagId(e.target.value)}><option value="">Gắn tag...</option>{availableTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><button className="small-button" onClick={() => void attachTag()}>Gắn</button></>}</div></div></div><div className="task-actions"><button className="small-button" onClick={onEdit}>Sửa</button><select value={task.status} onChange={(e) => void onStatusChange(task, e.target.value as TaskStatus)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button className="icon-button" onClick={() => void onDelete(task)}>×</button></div></article>;
}

function TaskForm({ categories, task, onCreated, onCancel }: { categories: Category[]; task?: Task; onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? '');
  const [dueAt, setDueAt] = useState(() => {
    if (!task?.dueAt) return '';
    const date = new Date(task.dueAt);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tên công việc.'); return; }
    setBusy(true);
    try {
      const values = { title: title.trim(), description, priority };
      if (task) {
        await api.updateTask(task.id, { ...values, categoryId: categoryId || null, dueAt: dueAt ? new Date(dueAt).toISOString() : null });
      } else {
        await api.createTask({ ...values, categoryId: categoryId || undefined, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined });
      }
      onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu công việc'); }
    finally { setBusy(false); }
  }
  return <form className="task-form" onSubmit={submit}>
    <h3>{task ? 'Sửa công việc' : 'Tạo công việc'}</h3>
    <div className="form-row">
      <input aria-label="Tên công việc" autoFocus required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên task..." />
      <select aria-label="Mức ưu tiên" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="Danh mục" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Không có category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      <label className="inline-label">Hạn <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></label>
      <button className="primary-button" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</button>
      <button type="button" className="secondary-button" onClick={onCancel}>Hủy</button>
    </div>
    <textarea aria-label="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả (không bắt buộc)" />
    {error && <div role="alert" className="error-box">{error}</div>}
  </form>;
}

function ManagementPanel({ categories, tags, onChanged }: { categories: Category[]; tags: Tag[]; onChanged: () => void }) {
  const [categoryName, setCategoryName] = useState('');
  const [tagName, setTagName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function add(kind: 'category' | 'tag') {
    const name = (kind === 'category' ? categoryName : tagName).trim();
    if (!name) return;
    setBusy(true);
    try {
      if (kind === 'category') { await api.createCategory({ name }); setCategoryName(''); }
      else { await api.createTag({ name }); setTagName(''); }
      setError(''); onChanged();
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu dữ liệu'); }
    finally { setBusy(false); }
  }
  return <section className="management-panel">
    <div><h3>Danh mục</h3><div className="inline-form"><input aria-label="Tên danh mục mới" maxLength={100} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Tên danh mục" /><button disabled={busy} className="small-button" onClick={() => void add('category')}>Thêm</button></div>
      <div className="management-list">{categories.map((category) => <MetadataRow key={category.id} name={category.name} maxLength={100} onRename={(name) => api.updateCategory(category.id, { name })} onDelete={() => api.deleteCategory(category.id)} onChanged={onChanged} />)}</div>
    </div>
    <div><h3>Nhãn</h3><div className="inline-form"><input aria-label="Tên nhãn mới" maxLength={50} value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="Tên nhãn" /><button disabled={busy} className="small-button" onClick={() => void add('tag')}>Thêm</button></div>
      <div className="management-list">{tags.map((tag) => <MetadataRow key={tag.id} name={tag.name} maxLength={50} onRename={(name) => api.updateTag(tag.id, { name })} onDelete={() => api.deleteTag(tag.id)} onChanged={onChanged} />)}</div>
    </div>
    {error && <p role="alert" className="error-box">{error}</p>}
  </section>;
}

function MetadataRow({ name, maxLength, onRename, onDelete, onChanged }: { name: string; maxLength: number; onRename: (name: string) => Promise<unknown>; onDelete: () => Promise<unknown>; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(remove = false) {
    if (!remove && !draft.trim()) { setError('Tên không được để trống.'); return; }
    setBusy(true);
    try { if (remove) await onDelete(); else await onRename(draft.trim()); setEditing(false); setError(''); onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu dữ liệu'); }
    finally { setBusy(false); }
  }
  return <div className="metadata-row">
    {editing ? <><input aria-label="Tên mới" maxLength={maxLength} value={draft} onChange={(e) => setDraft(e.target.value)} /><button disabled={busy} onClick={() => void save()}>Lưu</button><button disabled={busy} onClick={() => setEditing(false)}>Hủy</button></> : <><span>{name}</span><button onClick={() => { setDraft(name); setEditing(true); }}>Sửa</button><button disabled={busy} onClick={() => { if (window.confirm('Xóa "' + name + '"?')) void save(true); }}>Xóa</button></>}
    {error && <p role="alert" className="error-box">{error}</p>}
  </div>;
}

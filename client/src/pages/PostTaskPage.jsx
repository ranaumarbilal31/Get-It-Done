import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Dialog } from '../components/UI';
import PaymentBreakdown, { quote } from '../components/PaymentBreakdown';
import MapPicker from '../components/ClientMap';
export default function PostTaskPage() {
  const { user, loading } = useAuth(),
    navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    categoryId: '',
    isRemote: true,
    location: '',
    dueDate: '',
  });
  const [categories, setCategories] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [files, setFiles] = useState([]),
    [draftId, setDraftId] = useState(null);
  const lock = useRef(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('gid-draft');
      if (saved) {
        const d = JSON.parse(saved);
        setForm(d.form);
        setDraftId(d.draftId || null);
      }
    } catch {}
    api
      .get('/categories')
      .then((r) => setCategories(r.data.categories))
      .catch(() => setError('Categories could not be loaded. Refresh to retry.'));
  }, []);
  const change = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setDraftId(null);
    try {
      sessionStorage.setItem('gid-draft', JSON.stringify({ form: next }));
    } catch {}
  };
  const fund = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      let id = draftId;
      if (!id) {
        const body = new FormData();
        for (const [k, v] of Object.entries(form)) if (v !== '') body.append(k, v);
        files.forEach((f) => body.append('images', f));
        id = (
          await api.post('/tasks', body, { headers: { 'Content-Type': 'multipart/form-data' } })
        ).data.task.id;
        setDraftId(id);
        sessionStorage.setItem('gid-draft', JSON.stringify({ form, draftId: id }));
      }
      await api.post(`/payments/tasks/${id}/fund`, { confirmPreview: true });
      sessionStorage.removeItem('gid-draft');
      navigate('/tasks/' + id);
    } catch (e) {
      setError(e.response?.data?.message || 'Publication failed. Retry funding your saved draft.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="page-container workspace-page post-workspace">
      <header className="workspace-heading">
        <span className="eyebrow">MAKE YOUR NEXT MOVE</span>
        <h1>What do you need done?</h1>
        <p>A clear brief brings the right skills to your door.</p>
      </header>
      <section className="surface form-surface">
        {error && <Alert>{error}</Alert>}
        {!user && !loading && (
          <p className="notice">
            Your draft stays on this device. <Link to="/login">Log in</Link> or{' '}
            <Link to="/register">create an account</Link> before funding.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!user) {
              navigate('/login');
              return;
            }
            setConfirm(true);
          }}
        >
          <label>
            Task title
            <input
              aria-label="Task title"
              required
              minLength={5}
              maxLength={120}
              value={form.title}
              onChange={(e) => change('title', e.target.value)}
              placeholder="Build a website for my small business"
            />
          </label>
          <div className="form-grid">
            <label>
              Category
              <select
                aria-label="Task category"
                required
                value={form.categoryId}
                onChange={(e) => change('categoryId', e.target.value)}
              >
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Task budget (USD)
              <input
                aria-label="Budget in US dollars"
                type="number"
                required
                min="2"
                max="50000"
                step="0.01"
                value={form.budget}
                onChange={(e) => change('budget', e.target.value)}
                placeholder="150.00"
              />
            </label>
          </div>
          <label>
            Describe the work
            <textarea
              aria-label="Task description"
              required
              rows={6}
              minLength={10}
              maxLength={3000}
              value={form.description}
              onChange={(e) => change('description', e.target.value)}
              placeholder="Describe the result you need and your timeline."
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => change('isRemote', e.target.checked)}
            />
            This task can be done remotely
          </label>
          {!form.isRemote && (
            <>
              <label>
                Location
                <input
                  required
                  value={form.location}
                  onChange={(e) => change('location', e.target.value)}
                  placeholder="Suburb or address"
                />
              </label>
              <p className="fine-print">
                Street numbers are private until hiring. Keep sensitive details out of the
                description.
              </p>
              <MapPicker
                onLocationSelect={(lat, lng) =>
                  setForm((p) => ({ ...p, latitude: lat, longitude: lng }))
                }
              />
            </>
          )}
          <label>
            Due date (optional)
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => change('dueDate', e.target.value)}
            />
          </label>
          <label>
            Photos (optional)
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFiles([...e.target.files].slice(0, 5))}
            />
          </label>
          {Number(form.budget) >= 2 && <PaymentBreakdown payment={quote(form.budget)} />}
          <button className="button" disabled={busy || loading} type="submit">
            Review and fund task
          </button>
        </form>
      </section>
      {confirm && (
        <Dialog title="Review task payment" onClose={() => !busy && setConfirm(false)}>
          <h2>Ready to get it done?</h2>
          <p>Funding publishes your task. Choose your tasker from the offers you receive.</p>
          <PaymentBreakdown payment={quote(form.budget)} />
          <p className="notice">
            Payment method: account payment preview. No actual charge occurs.
          </p>
          {error && <Alert>{error}</Alert>}
          <button className="button" disabled={busy} onClick={fund}>
            {busy ? 'Publishing…' : 'Confirm funding and publish'}
          </button>
        </Dialog>
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import api from '../api/client';
import { Alert } from '../components/UI';
export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'General',
    message: '',
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const locked = useRef(false);
  const submit = async (e) => {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/contact', form);
      setSuccess(res.data.message);
      setForm({ name: '', email: '', subject: '', category: 'General', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'We could not send your inquiry. Please try again.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="page-container contact-layout">
      <section>
        <span className="eyebrow">LET'S TALK</span>
        <h1>
          A question,
          <br />
          an idea, a little
          <br />
          <em>feedback?</em>
        </h1>
        <p>We'd like to hear it. Share the details and help us make the marketplace better.</p>
        <div className="contact-aside">
          <strong>Prefer email?</strong>
          <a href="mailto:phalanx.getitdone@gmail.com">
            phalanx.getitdone@gmail.com <ArrowUpRight size={15} />
          </a>
          <p>Never include passwords or identity documents in your inquiry.</p>
        </div>
      </section>
      <div>
        {error && <Alert>{error}</Alert>}
        {success && (
          <div role="status" className="alert">
            {success}
          </div>
        )}
        <form onSubmit={submit}>
          {[
            ['name', 'Your name', 'text'],
            ['email', 'Email address', 'email'],
            ['subject', 'Subject', 'text'],
          ].map(([name, label, type]) => (
            <label key={name}>
              {label}
              <input
                type={type}
                required
                minLength={name === 'email' ? undefined : 2}
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              />
            </label>
          ))}
          <label>
            What's on your mind?
            <textarea
              rows={6}
              required
              minLength={10}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </label>
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send your inquiry'}
            <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

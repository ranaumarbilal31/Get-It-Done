import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
export default function AccountSecurityPage({ kind }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [currentPassword, setCurrentPassword] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    lock = useRef(false),
    captured = useRef(false),
    { logout } = useAuth();
  useEffect(() => {
    if (captured.current) return;
    captured.current = true;
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
    window.history.replaceState(null, '', window.location.pathname);
  }, []);
  const title = {
    'verify-email': 'Activate your account.',
    'resend-verification': 'Request an activation email.',
    'forgot-password': 'Let’s get you back in.',
    'reset-password': 'Choose a new password.',
    'change-password': 'Update your password.',
  }[kind];
  const submit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/auth/' + kind, { token, email, password, currentPassword });
      setMessage(r.data.message);
      if (kind === 'change-password') {
        await logout();
        navigate('/login?password=updated');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Please try again.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="page-container security-page">
      <section className="surface form-surface">
        <span className="eyebrow">YOUR ACCOUNT, IN YOUR CONTROL</span>
        <h1>{title}</h1>
        {error && <Alert>{error}</Alert>}
        {message ? (
          <p role="status" className="notice">
            {message} <Link to="/login">Log in</Link>
          </p>
        ) : (
          <form onSubmit={submit}>
            {['forgot-password', 'resend-verification'].includes(kind) && (
              <label>
                Email address
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {kind === 'change-password' && (
              <label>
                Current password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>
            )}
            {['reset-password', 'change-password'].includes(kind) && (
              <label>
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={100}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {kind === 'verify-email' && (
              <p>Confirm activation to start posting tasks and finding work.</p>
            )}
            <button className="button" disabled={busy}>
              {busy
                ? 'Just a moment…'
                : kind === 'verify-email'
                  ? 'Activate account'
                  : kind.includes('password') && kind !== 'forgot-password'
                    ? 'Save password'
                    : 'Send email'}
            </button>
          </form>
        )}
        <p>
          <Link to="/login">Back to login</Link> ·{' '}
          <Link to="/resend-verification">Request activation email</Link>
        </p>
      </section>
    </div>
  );
}

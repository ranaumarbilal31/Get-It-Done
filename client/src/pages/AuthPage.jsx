import React, { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
export default function AuthPage({ registerMode = false }) {
  const [params] = useSearchParams();
  const { login, register } = useAuth(),
    navigate = useNavigate(),
    lock = useRef(false);
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(
      params.get('password') === 'updated'
        ? 'Password updated. Log in with your new password.'
        : '',
    );
  const submit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      if (registerMode) {
        const r = await register(name, email, password);
        setMessage(r.message);
      } else {
        const u = await login(email, password);
        navigate(u.role === 'ADMIN' ? '/admin' : '/account');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Check your details and try again.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="page-container auth-layout">
      <aside className="auth-story">
        <span className="eyebrow">A LITTLE HELP. A LOT MORE POSSIBLE.</span>
        <h2>
          Your skills.
          <br />
          Someone’s
          <br />
          <em>next step.</em>
        </h2>
        <p>Find the right help for your project, or put your skills to work on your own terms.</p>
        <div className="auth-promises">
          <span>Local and remote opportunities</span>
          <span>Clear task agreements</span>
          <span>Conversations and delivery in one place</span>
        </div>
      </aside>
      <section className="auth-form-panel">
        <span className="eyebrow">
          {registerMode ? 'LET’S GET STARTED' : 'GOOD TO SEE YOU AGAIN'}
        </span>
        <h1>{registerMode ? 'Create your account.' : 'Welcome back.'}</h1>
        <p>
          {registerMode
            ? 'Your next project starts here.'
            : 'Log in to pick up where you left off.'}
        </p>
        {error && <Alert>{error}</Alert>}
        {message && (
          <p role="status" className="notice">
            {message} <Link to="/resend-verification">Resend activation email</Link>
          </p>
        )}
        <form onSubmit={submit}>
          {registerMode && (
            <label>
              Full name
              <input
                autoComplete="name"
                required
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete={registerMode ? 'new-password' : 'current-password'}
              minLength={registerMode ? 8 : undefined}
              maxLength={100}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? 'Just a moment…' : registerMode ? 'Create an account' : 'Log in'}
          </button>
        </form>
        {!registerMode && (
          <p className="auth-switch">
            <Link to="/forgot-password">Forgot password?</Link> ·{' '}
            <Link to="/resend-verification">Activate account</Link>
          </p>
        )}
        <p className="auth-switch">
          {registerMode ? 'Already a member?' : 'New here?'}{' '}
          <Link to={registerMode ? '/login' : '/register'}>
            {registerMode ? 'Log in' : 'Create an account'}
          </Link>
        </p>
        <p className="fine-print">
          By continuing, you agree to our <Link to="/terms">terms</Link> and{' '}
          <Link to="/privacy">privacy policy</Link>.
        </p>
      </section>
    </div>
  );
}

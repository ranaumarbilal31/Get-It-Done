import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
export default function AuthPage({ registerMode = false }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const submitting = useRef(false);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const user = registerMode
        ? await register(name, email, password)
        : await login(email, password);
      navigate(user.role === 'ADMIN' ? '/admin' : '/tasks');
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'We could not sign you in. Check your details and try again.',
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="page-container auth-layout">
      <aside className="auth-story">
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2>
          A little help.
          <br />A world of
          <br />
          <em>possibility.</em>
        </h2>
        <p>
          Turn a to-do into a done.
          <br />
          Or turn your skills into someone’s solution.
        </p>
        <div className="auth-promises">
          <span>
            <Check size={18} />
            Find local and remote tasks
          </span>
          <span>
            <Check size={18} />
            Compare offers on your terms
          </span>
          <span>
            <Check size={18} />
            Keep the conversation in one place
          </span>
        </div>
        <span className="demo-note">Demo marketplace · No real payments</span>
      </aside>
      <section className="auth-form-panel">
        <span className="eyebrow">{registerMode ? 'COME ON IN' : 'GOOD TO SEE YOU AGAIN'}</span>
        <h1>{registerMode ? 'Make yourself at home.' : 'Welcome back.'}</h1>
        <p>
          {registerMode
            ? 'Create your account and get things moving.'
            : 'Sign in to pick up where you left off.'}
        </p>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={submit}>
          {registerMode && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={registerMode ? 'new-password' : 'current-password'}
              minLength={registerMode ? 6 : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </label>
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Just a moment…' : registerMode ? 'Create an account' : 'Log in'}
            <ArrowUpRight size={18} />
          </button>
        </form>
        {!registerMode && (
          <div className="demo-accounts">
            <span>EXPLORE THE DEMO</span>
            <div>
              {[
                ['Poster', 'sarah@example.com'],
                ['Tasker', 'alex@example.com'],
                ['Admin', 'admin@getitdone.com'],
              ].map(([label, value]) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    setEmail(value);
                    setPassword('Password123!');
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p>These buttons fill sample credentials. Click Log in to continue.</p>
          </div>
        )}
        <p className="auth-switch">
          {registerMode ? 'Already have an account?' : 'New around here?'}{' '}
          <Link to={registerMode ? '/login' : '/register'}>
            {registerMode ? 'Log in' : 'Create an account'}
          </Link>
        </p>
        <p className="fine-print">
          By continuing you agree to our <Link to="/terms">terms</Link> and acknowledge our{' '}
          <Link to="/privacy">privacy policy</Link>.
        </p>
      </section>
    </div>
  );
}

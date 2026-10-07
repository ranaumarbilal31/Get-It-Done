import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Alert, Loading } from '../components/UI';
import { money } from '../components/PaymentBreakdown';
export default function AccountPage() {
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  const load = () => {
    setError('');
    api
      .get('/payments/account')
      .then((r) => setData(r.data))
      .catch(() => setError('Your account could not be loaded.'));
  };
  useEffect(load, []);
  return (
    <div className="page-container workspace-page">
      <header className="workspace-heading">
        <span className="eyebrow">EVERY TASK, ONE PLACE</span>
        <h1>Your account.</h1>
        <p>Follow your work, deliveries and payment history.</p>
        <div className="hero-actions">
          <Link to="/profile" className="text-link">
            Edit profile
          </Link>
          <Link to="/change-password" className="text-link">
            Change password
          </Link>
        </div>
      </header>
      {error && <Alert onRetry={load}>{error}</Alert>}
      {!data ? (
        <Loading>Loading your account…</Loading>
      ) : (
        <>
          <section className="balance-card">
            <span>Available task earnings</span>
            <strong>{money(data.balanceCents)}</strong>
            <p>Approved task payments appear in your transaction history below.</p>
          </section>
          <section className="surface">
            <h2>Your tasks</h2>
            {data.tasks.length ? (
              <div className="account-tasks">
                {data.tasks.map((t) => (
                  <Link key={t.id} to={'/tasks/' + t.id}>
                    <strong>{t.title}</strong>
                    <span className="status-pill">{t.status.replaceAll('_', ' ')}</span>
                    <span>{money(t.payment?.amountCents || t.budget * 100)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>
                Your first task starts with <Link to="/post-task">a clear brief</Link>, or{' '}
                <Link to="/tasks">an offer on available work</Link>.
              </p>
            )}
          </section>
          <section className="surface">
            <h2>Transaction history</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Activity</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <Link to={'/tasks/' + e.taskId}>{e.task.title}</Link>
                      </td>
                      <td>{e.kind.replaceAll('_', ' ')}</td>
                      <td>{money(e.amountCents)}</td>
                      <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.entries.length && <p>No transactions yet.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Alert, Dialog } from './UI';
import { money } from './PaymentBreakdown';
export default function PaymentAdmin() {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [filter, setFilter] = useState('ALL'),
    [selected, setSelected] = useState(null),
    [history, setHistory] = useState(null),
    [outcome, setOutcome] = useState('RELEASE'),
    [decision, setDecision] = useState(''),
    [award, setAward] = useState(''),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const load = () =>
    api
      .get('/payments/admin')
      .then((r) => {
        setData(r.data);
        setError('');
      })
      .catch(() => setError('Payment administration could not be loaded.'));
  useEffect(() => {
    load();
  }, []);
  const resolve = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await api.post(`/payments/admin/tasks/${selected.taskId}/resolve`, {
        outcome,
        decision,
        awardCents: Math.round(Number(award) * 100),
      });
      setSelected(null);
      setDecision('');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Decision could not be recorded.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="surface">
      <h2>Escrow, releases & disputes</h2>
      {error && <Alert onRetry={load}>{error}</Alert>}
      {data && (
        <>
          <div className="admin-totals">
            <div>
              <span>HELD FUNDS</span>
              <strong>{money(data.heldCents)}</strong>
            </div>
            {data.totals.map((t) => (
              <div key={t.kind}>
                <span>{t.kind.replaceAll('_', ' ')}</span>
                <strong>{money(t._sum.amountCents)}</strong>
              </div>
            ))}
          </div>
          <label>
            Payment status
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {[
                'ALL',
                'HELD_IN_ESCROW',
                'DISPUTED',
                'RELEASED',
                'REFUNDED',
                'PARTIALLY_SETTLED',
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Task / jobber</th>
                  <th>Task / payment state</th>
                  <th>Jobber total</th>
                  <th>Tasker net</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.payments
                  .filter((p) => filter === 'ALL' || p.status === filter)
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={'/tasks/' + p.taskId}>{p.task.title}</Link>
                        <small>{p.task.poster.name}</small>
                      </td>
                      <td>
                        {p.task.status}
                        <small>{p.status}</small>
                      </td>
                      <td>{money(p.posterTotalCents)}</td>
                      <td>{money(p.taskerNetCents)}</td>
                      <td>
                        {p.task.dispute?.status === 'OPEN' ? (
                          <button className="button secondary" onClick={() => setSelected(p)}>
                            Review dispute
                          </button>
                        ) : (
                          <button className="text-link" onClick={() => setHistory(p)}>
                            Transaction history
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {history && (
        <Dialog title="Transaction history" onClose={() => setHistory(null)}>
          <h2>{history.task.title}</h2>
          <p>
            {history.task.status} · {history.status}
          </p>
          <p>
            Fee policy: {history.feeVersion}. Jobber total {money(history.posterTotalCents)}.
          </p>
          {history.task.ledger.length ? (
            <ol className="activity-list">
              {history.task.ledger.map((e) => (
                <li key={e.id}>
                  <strong>
                    {e.kind.replaceAll('_', ' ')} · {money(e.amountCents)}
                  </strong>
                  <p>
                    {new Date(e.createdAt).toLocaleString()} · Actor {e.actorId}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p>
              This payment predates the transaction ledger. Its original recorded balance and fee
              policy are preserved.
            </p>
          )}
          {history.task.dispute?.decision && (
            <p>Platform decision: {history.task.dispute.decision}</p>
          )}
        </Dialog>
      )}
      {selected && (
        <Dialog title="Review dispute" onClose={() => !busy && setSelected(null)}>
          <h2>{selected.task.title}</h2>
          <p>{selected.task.dispute.reason}</p>
          <h3>Delivery and evidence</h3>
          {selected.task.deliveries.map((d) => (
            <article key={d.id}>
              <p>{d.notes}</p>
              {JSON.parse(d.attachments || '[]').map((link) => (
                <p key={link}>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    View delivery attachment
                  </a>
                </p>
              ))}
            </article>
          ))}
          {selected.task.dispute.evidence.map((e) => (
            <p key={e.id}>
              <strong>
                {e.authorId === selected.task.posterId ? 'Jobber response' : 'Tasker response'}
              </strong>
              : {e.content}
            </p>
          ))}
          <form onSubmit={resolve}>
            <label>
              Outcome
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                <option value="RELEASE">Release full payment</option>
                <option value="REFUND">Refund all held funds</option>
                <option value="SPLIT">Split the task payment</option>
              </select>
            </label>
            {outcome === 'SPLIT' && (
              <label>
                Task amount awarded (USD)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  max={(selected.amountCents - 1) / 100}
                  value={award}
                  onChange={(e) => setAward(e.target.value)}
                />
              </label>
            )}
            <label>
              Written decision
              <textarea
                required
                minLength={10}
                maxLength={3000}
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              />
            </label>
            {error && <Alert>{error}</Alert>}
            <button className="button" disabled={busy}>
              Record decision and settle
            </button>
          </form>
        </Dialog>
      )}
    </section>
  );
}

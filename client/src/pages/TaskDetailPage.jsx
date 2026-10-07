import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRouteData } from '../routeData';
import { Alert, Loading, Dialog } from '../components/UI';
import PaymentBreakdown, { quote, money } from '../components/PaymentBreakdown';
import TaskConversation from '../components/TaskConversation';
import RatingStars from '../components/RatingStars';
import ResponsiveImage from '../components/ResponsiveImage';
export default function TaskDetailPage() {
  const { id } = useParams(),
    initial = useRouteData(),
    { user, refreshUser } = useAuth(),
    [query, setQuery] = useSearchParams();
  const [task, setTask] = useState(initial.path === '/tasks/' + id ? initial.task : null),
    [error, setError] = useState(initial.error || ''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(null),
    [amount, setAmount] = useState(''),
    [text, setText] = useState(''),
    [links, setLinks] = useState(''),
    [rating, setRating] = useState(5);
  const lock = useRef(false),
    generation = useRef(0);
  const load = async () => {
    const n = ++generation.current;
    try {
      const r = await api.get('/tasks/' + id);
      if (n !== generation.current) return;
      setTask(r.data.task);
      setError('');
    } catch (e) {
      if (n === generation.current)
        setError(
          e.response?.status === 404
            ? 'This task could not be found.'
            : 'The task could not be loaded. Please retry.',
        );
    }
  };
  useEffect(() => {
    setTask((t) => (t?.id === id ? t : null));
    setModal(null);
    setMessage('');
    load();
    return () => {
      generation.current++;
    };
  }, [id, user?.id]);
  useEffect(() => {
    if (task?.id === id) initial.setRouteData?.({ path: '/tasks/' + id, status: 200, task });
  }, [task, id]);
  const act = async (path, body = {}, verb = 'post') => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const r = await api[verb](path, body);
      setMessage(r.data.message || 'Your action has been recorded.');
      setModal(null);
      setText('');
      setLinks('');
      await load();
      await refreshUser();
    } catch (e) {
      setError(e.response?.data?.message || 'This action failed. Please retry.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (error && !task)
    return (
      <div className="page-container workspace-page">
        <h1>Task unavailable</h1>
        <Alert onRetry={load}>{error}</Alert>
      </div>
    );
  if (!task) return <Loading>Opening task…</Loading>;
  const own = user?.id === task.posterId,
    accepted = task.offers?.find((o) => o.id === task.assignedOfferId || o.status === 'ACCEPTED'),
    hired = user?.id === accepted?.taskerId,
    participant = own || hired;
  const payment = task.payment || quote(task.budget),
    tab = query.get('tab') || 'details';
  return (
    <div className="page-container workspace-page">
      <header className="workspace-heading">
        <span className="eyebrow">
          {task.category?.name} · {task.isRemote ? 'REMOTE' : task.location}
        </span>
        <h1>{task.title}</h1>
        <p>
          <span className="status-pill">{task.status}</span> Posted by{' '}
          <Link to={'/users/' + task.posterId}>{task.poster?.name}</Link>
        </p>
      </header>
      {error && <Alert>{error}</Alert>}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="detail-layout">
        <div>
          <section className="surface">
            <div className="tab-row">
              <button aria-pressed={tab === 'details'} onClick={() => setQuery({})}>
                Task details
              </button>
              {participant && accepted && (
                <button aria-pressed={tab === 'chat'} onClick={() => setQuery({ tab: 'chat' })}>
                  Messages
                </button>
              )}
            </div>
            <h2>The brief</h2>
            <p className="task-description">{task.description}</p>
            {task.dueDate && <p>Due {String(task.dueDate).slice(0, 10)}</p>}
            {(() => {
              try {
                return JSON.parse(task.images || '[]').map((src, i) => (
                  <ResponsiveImage
                    key={src}
                    src={src}
                    alt={'Task attachment ' + (i + 1)}
                    className="task-attachment"
                  />
                ));
              } catch {
                return null;
              }
            })()}
          </section>
          {participant && accepted && tab === 'chat' && (
            <TaskConversation task={task} user={user} />
          )}
          {participant && task.deliveries?.length > 0 && (
            <section className="surface">
              <h2>Delivered work</h2>
              {task.deliveries.map((d) => (
                <article key={d.id}>
                  <p>{d.notes}</p>
                  {JSON.parse(d.attachments || '[]').map((u) => (
                    <p key={u}>
                      <a href={u} target="_blank" rel="noopener noreferrer">
                        View delivery attachment
                      </a>
                    </p>
                  ))}
                </article>
              ))}
            </section>
          )}
          {participant && task.dispute && (
            <section className="surface">
              <h2>Dispute review</h2>
              <p>{task.dispute.reason}</p>
              <p>
                {task.dispute.status === 'OPEN'
                  ? 'Funds remain held while the platform reviews both sides and decides the outcome.'
                  : 'The platform has recorded a decision and settled this task.'}
              </p>
              {task.dispute.evidence?.map((e) => (
                <p key={e.id}>{e.content}</p>
              ))}
              {task.dispute.decision && (
                <p>
                  <strong>Platform decision:</strong> {task.dispute.decision}
                </p>
              )}
              {task.dispute.status === 'OPEN' && (
                <button
                  className="button secondary"
                  onClick={() => {
                    setText('');
                    setModal({ kind: 'evidence' });
                  }}
                >
                  Add evidence or response
                </button>
              )}
            </section>
          )}
          <section className="surface">
            <h2>{task.status === 'OPEN' ? 'Offers from taskers' : 'Task agreement'}</h2>
            {task.offers?.length ? (
              task.offers.map((o) => (
                <article className="offer-card" key={o.id}>
                  <div>
                    <Link to={'/users/' + o.taskerId}>
                      <strong>{o.tasker?.name}</strong>
                    </Link>
                    <RatingStars
                      rating={o.tasker?.ratingAvg || 0}
                      count={o.tasker?.ratingCount || 0}
                    />
                    <p>{o.message}</p>
                    <span className="status-pill">{o.status}</span>
                  </div>
                  <div>
                    <strong>{money(o.amount * 100)}</strong>
                    {own && task.status === 'OPEN' && o.status === 'PENDING' && (
                      <button
                        className="button"
                        onClick={() => setModal({ kind: 'hire', offer: o })}
                      >
                        Choose tasker
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p>
                {task.status === 'OPEN'
                  ? 'Be the first to send a thoughtful offer.'
                  : 'No offers to display.'}
              </p>
            )}
          </section>
          {task.review && (
            <section className="surface">
              <h2>Task feedback</h2>
              <RatingStars rating={task.review.rating} />
              <p>{task.review.comment}</p>
            </section>
          )}
        </div>
        <aside className="surface task-payment-panel">
          <span className="eyebrow">TASK BUDGET</span>
          <strong className="task-price">{money(task.budget * 100)}</strong>
          {participant && task.payment && (
            <>
              <h2>Payment summary</h2>
              <PaymentBreakdown payment={payment} worker={hired} />
              <p className="status-pill">{payment.status.replaceAll('_', ' ')}</p>
            </>
          )}
          {!user && (
            <Link className="button" to="/login">
              Log in to get involved
            </Link>
          )}
          {user && !own && task.status === 'OPEN' && (
            <button
              className="button"
              onClick={() => {
                setAmount(String(task.budget));
                setText('');
                setModal({ kind: 'offer' });
              }}
            >
              Make an offer
            </button>
          )}
          {own && (task.status === 'DRAFT' || (task.status === 'OPEN' && !task.payment)) && (
            <button className="button" onClick={() => setModal({ kind: 'fund' })}>
              Fund and publish
            </button>
          )}
          {hired && task.status === 'ASSIGNED' && (
            <button
              className="button"
              onClick={() => {
                setText('');
                setModal({ kind: 'deliver' });
              }}
            >
              Deliver work
            </button>
          )}
          {own && task.status === 'DELIVERED' && (
            <button className="button" onClick={() => setModal({ kind: 'release' })}>
              Approve and release payment
            </button>
          )}
          {participant && ['ASSIGNED', 'DELIVERED'].includes(task.status) && (
            <button
              className="button secondary"
              onClick={() => {
                setText('');
                setModal({ kind: 'dispute' });
              }}
            >
              Raise a dispute
            </button>
          )}
          {own && ['DRAFT', 'OPEN'].includes(task.status) && (
            <button className="button secondary" onClick={() => setModal({ kind: 'cancel' })}>
              Cancel task
            </button>
          )}
          {own && task.status === 'COMPLETED' && !task.review && (
            <button
              className="button"
              onClick={() => {
                setText('');
                setModal({ kind: 'review' });
              }}
            >
              Leave a review
            </button>
          )}
          <p className="fine-print">
            Agree on scope, review delivery, and keep evidence in your task conversation.{' '}
            <Link to="/dispute-policy">Read the dispute policy</Link>.
          </p>
        </aside>
      </div>
      {modal && (
        <Dialog
          title={modal.kind === 'hire' ? 'Confirm your tasker' : 'Task action'}
          onClose={() => !busy && setModal(null)}
        >
          <h2>
            {
              {
                offer: 'Make your offer',
                hire: 'Confirm your tasker',
                fund: 'Fund this task',
                deliver: 'Deliver your work',
                release: 'Approve delivery',
                dispute: 'Request platform review',
                evidence: 'Add your evidence',
                cancel: 'Cancel this task',
                review: 'Share your experience',
              }[modal.kind]
            }
          </h2>
          {error && <Alert>{error}</Alert>}
          {['fund', 'hire'].includes(modal.kind) && (
            <>
              <PaymentBreakdown payment={modal.offer ? quote(modal.offer.amount) : payment} />
              {modal.kind === 'hire' && (
                <p>
                  Any price difference is settled before hiring. Your connection fee is charged
                  once.
                </p>
              )}
              <p className="notice">Payment preview: no actual charge occurs.</p>
            </>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const k = modal.kind;
              if (k === 'offer') act('/offers/task/' + id, { amount, message: text });
              else if (k === 'hire')
                act('/offers/' + modal.offer.id + '/accept', { confirmPreview: true });
              else if (k === 'review') act('/reviews/task/' + id, { rating, comment: text });
              else
                act('/payments/tasks/' + id + '/' + k, {
                  confirmPreview: true,
                  notes: text,
                  reason: text,
                  content: text,
                  attachments: links
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                });
            }}
          >
            {modal.kind === 'offer' && (
              <>
                <label>
                  Offer amount (USD)
                  <input
                    type="number"
                    min="2"
                    max="50000"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <PaymentBreakdown payment={quote(amount)} worker />
              </>
            )}
            {modal.kind === 'review' && (
              <label>
                Rating
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </label>
            )}
            {['offer', 'deliver', 'dispute', 'evidence', 'review'].includes(modal.kind) && (
              <label>
                {modal.kind === 'offer'
                  ? 'Your proposal'
                  : modal.kind === 'deliver'
                    ? 'Delivery notes'
                    : modal.kind === 'review'
                      ? 'Your feedback'
                      : 'Explain what happened'}
                <textarea
                  required
                  minLength={modal.kind === 'review' ? 3 : 10}
                  maxLength={3000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
            )}
            {modal.kind === 'deliver' && (
              <label>
                HTTPS delivery links (one per line, optional)
                <textarea value={links} onChange={(e) => setLinks(e.target.value)} />
              </label>
            )}
            {modal.kind === 'release' && (
              <p>
                Confirm you received the agreed work. This credits {money(payment.taskerNetCents)}{' '}
                to your tasker’s account.
              </p>
            )}
            {modal.kind === 'cancel' && (
              <p>Your task will be removed from discovery. All held funds will be refunded.</p>
            )}
            <button className="button" disabled={busy}>
              {busy ? 'Working…' : 'Confirm'}
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}

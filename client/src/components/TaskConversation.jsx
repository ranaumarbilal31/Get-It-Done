import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Alert } from './UI';
export default function TaskConversation({ task, user }) {
  const { socket, isConnected, joinTask, leaveTask } = useSocket();
  const [messages, setMessages] = useState([]),
    [content, setContent] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const append = (message) =>
    setMessages((items) => (items.some((m) => m.id === message.id) ? items : [...items, message]));
  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/messages/task/' + task.id, { signal: controller.signal })
      .then((r) => setMessages(r.data.messages))
      .catch(() => {
        if (!controller.signal.aborted)
          setError('Messages could not be loaded. Reopen the conversation to retry.');
      });
    return () => controller.abort();
  }, [task.id]);
  useEffect(() => {
    if (!socket || !isConnected) return;
    joinTask(task.id);
    socket.on('new_message', append);
    return () => {
      socket.off('new_message', append);
      leaveTask(task.id);
    };
  }, [socket, isConnected, task.id]);
  const send = async (e) => {
    e.preventDefault();
    if (lock.current || !content.trim()) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const offer = task.offers.find((o) => o.id === task.assignedOfferId || o.status === 'ACCEPTED');
    try {
      const r = await api.post('/messages/task/' + task.id, {
        taskId: task.id,
        receiverId: user.id === task.posterId ? offer.taskerId : task.posterId,
        content,
      });
      append(r.data.message);
      setContent('');
    } catch (e) {
      setError(e.response?.data?.message || 'Message could not be sent.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="surface">
      <h2>Your task conversation</h2>
      {error && <Alert>{error}</Alert>}
      <div className="conversation-log" aria-label="Conversation" aria-live="polite">
        {messages.length ? (
          messages.map((m) => (
            <article key={m.id} className={m.senderId === user.id ? 'message-own' : ''}>
              <strong>
                {m.sender?.name || (m.senderId === user.id ? 'You' : 'Task participant')}
              </strong>
              <p>{m.content}</p>
            </article>
          ))
        ) : (
          <p>Agree on the scope and delivery details here.</p>
        )}
      </div>
      <form onSubmit={send}>
        <label>
          Message
          <textarea
            required
            maxLength={3000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
        <button className="button" disabled={busy}>
          Send message
        </button>
      </form>
    </section>
  );
}

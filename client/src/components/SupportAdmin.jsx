import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Alert } from './UI';
export default function SupportAdmin() {
  const [items, setItems] = useState([]),
    [error, setError] = useState('');
  const load = () =>
    api
      .get('/admin/inquiries')
      .then((r) => setItems(r.data.inquiries))
      .catch(() => setError('Support inquiries could not be loaded.'));
  useEffect(() => {
    load();
  }, []);
  return (
    <section className="surface">
      <h2>Support inbox</h2>
      {error && <Alert onRetry={load}>{error}</Alert>}
      {items.length ? (
        items.map((i) => (
          <article className="support-inquiry" key={i.id}>
            <h3>{i.subject}</h3>
            <p>
              {i.name} · {i.email}
            </p>
            <p>{i.message}</p>
          </article>
        ))
      ) : (
        <p>No support inquiries yet.</p>
      )}
    </section>
  );
}

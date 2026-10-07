import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Map, List, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../api/client';
import TaskCard from '../components/TaskCard';
import ClientMap from '../components/ClientMap';
import { Alert, Loading } from '../components/UI';
import { useRouteData } from '../routeData';
export default function BrowseTasksPage() {
  const initial = useRouteData();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(initial.path === '/tasks' ? initial : {});
  const [loading, setLoading] = useState(!initial.tasks && !initial.error);
  const [categories, setCategories] = useState(initial.categories || []);
  const [search, setSearch] = useState(params.get('search') || '');
  const [mapView, setMapView] = useState(false);
  const [retry, setRetry] = useState(0);
  const first = useRef(true);
  const key = params.toString();
  useEffect(() => setSearch(params.get('search') || ''), [key]);
  const update = (name, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== 'page') next.delete('page');
    setParams(next);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get('search') || '')) update('search', search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (categories.length) return;
    const controller = new AbortController();
    api
      .get('/categories', { signal: controller.signal })
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (first.current && initial.tasks) {
      first.current = false;
      return;
    }
    first.current = false;
    const controller = new AbortController();
    if (
      params.get('minBudget') &&
      params.get('maxBudget') &&
      Number(params.get('minBudget')) > Number(params.get('maxBudget'))
    ) {
      setData({ error: 'Minimum budget cannot exceed maximum budget.' });
      setLoading(false);
      return;
    }
    setLoading(true);
    const query = new URLSearchParams(params);
    if (!query.has('status')) query.set('status', 'OPEN');
    query.set('limit', '12');
    api
      .get('/tasks?' + query, { signal: controller.signal })
      .then((r) => setData(r.data))
      .catch((error) => {
        if (!controller.signal.aborted)
          setData({
            error: error.response?.data?.message || 'We could not load tasks. Please try again.',
          });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key, retry]);
  const pagination = data.pagination || { page: 1, pages: 1, total: data.tasks?.length || 0 };
  const page = Number(params.get('page') || 1);
  const pageLink = (n) => {
    const next = new URLSearchParams(params);
    next.set('page', n);
    return '/tasks?' + next;
  };
  return (
    <div className="page-container browse-page">
      <div className="browse-heading">
        <div>
          <span className="eyebrow">GOOD WORK IS WAITING</span>
          <h1>
            Find your next <em>get-it-done.</em>
          </h1>
          <p>Local tasks. Remote projects. A chance to put your skills to work.</p>
        </div>
        <Link className="button button-secondary" to="/post-task">
          Have a task to post? <ArrowRight size={18} />
        </Link>
      </div>
      <section className="filter-panel" aria-label="Task filters">
        <div className="filter-title">
          <SlidersHorizontal size={17} />
          <strong>Make it your kind of task</strong>
          <button className="text-link" onClick={() => setParams({})}>
            Clear filters
          </button>
        </div>
        <div className="filter-grid">
          <label className="filter-search">
            Search tasks
            <div className="relative">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="What are you good at?"
              />
            </div>
          </label>
          <label>
            Category
            <select
              aria-label="Category"
              value={params.get('category') || 'all'}
              onChange={(e) => update('category', e.target.value === 'all' ? '' : e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <select
              aria-label="Location"
              value={params.get('isRemote') || ''}
              onChange={(e) => update('isRemote', e.target.value)}
            >
              <option value="">Anywhere</option>
              <option value="false">In person</option>
              <option value="true">Remote / online</option>
            </select>
          </label>
          <label>
            Status
            <select
              aria-label="Status"
              value={params.get('status') || 'OPEN'}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="OPEN">Open tasks</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="COMPLETED">Completed</option>
              <option value="ALL">All statuses</option>
            </select>
          </label>
          <label>
            Min budget ($)
            <input
              type="number"
              min="0"
              value={params.get('minBudget') || ''}
              onChange={(e) => update('minBudget', e.target.value)}
              placeholder="0"
            />
          </label>
          <label>
            Max budget ($)
            <input
              type="number"
              min="0"
              value={params.get('maxBudget') || ''}
              onChange={(e) => update('maxBudget', e.target.value)}
              placeholder="Any"
            />
          </label>
        </div>
      </section>
      <div className="results-toolbar">
        <span>
          {loading
            ? 'Finding tasks…'
            : pagination.total + ' task' + (pagination.total === 1 ? '' : 's') + ' found'}
        </span>
        <div className="view-toggle">
          <button aria-pressed={!mapView} onClick={() => setMapView(false)}>
            <List size={16} />
            List
          </button>
          <button aria-pressed={mapView} onClick={() => setMapView(true)}>
            <Map size={16} />
            Map
          </button>
        </div>
      </div>
      {data.error ? (
        <Alert onRetry={() => setRetry((v) => v + 1)}>{data.error}</Alert>
      ) : loading ? (
        <Loading>Finding the right tasks…</Loading>
      ) : !data.tasks?.length ? (
        <div className="empty-state">
          <Search size={32} />
          <h2>No matches just yet.</h2>
          <p>Try a different keyword or make your filters a little broader.</p>
          <button className="button" onClick={() => setParams({})}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className={'browse-results ' + (mapView ? 'with-map' : '')}>
          <div className="task-grid">
            {data.tasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
          {mapView && (
            <aside className="results-map" aria-label="Task locations">
              <ClientMap mode="tasks" tasks={data.tasks} />
            </aside>
          )}
        </div>
      )}
      {!data.error && pagination.pages > 1 && (
        <nav className="pagination" aria-label="Task pagination">
          {page > 1 ? (
            <Link className="button button-secondary" to={pageLink(page - 1)}>
              <ArrowLeft size={17} />
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {page} of {pagination.pages}
          </span>
          {page < pagination.pages ? (
            <Link className="button button-secondary" to={pageLink(page + 1)}>
              Next
              <ArrowRight size={17} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

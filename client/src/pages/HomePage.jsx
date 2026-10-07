import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Sparkles,
  Wrench,
  Hammer,
  Truck,
  Trees,
  Laptop,
  Check,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';
import api from '../api/client';
import TaskCard from '../components/TaskCard';
import { Alert, Loading } from '../components/UI';
import { useRouteData } from '../routeData';
const icons = {
  'home-cleaning': Sparkles,
  'handyman-repairs': Wrench,
  'furniture-assembly': Hammer,
  'removals-delivery': Truck,
  'gardening-lawns': Trees,
  'tech-support': Laptop,
};
export default function HomePage() {
  const initial = useRouteData();
  const [data, setData] = useState(initial.path === '/' ? initial : {});
  const [loading, setLoading] = useState(!initial.categories && !initial.error);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const load = async () => {
    setLoading(true);
    try {
      const [cats, tasks] = await Promise.all([
        api.get('/categories'),
        api.get('/tasks?limit=6&status=OPEN'),
      ]);
      setData({ ...cats.data, ...tasks.data });
    } catch {
      setData({ error: 'We could not load the marketplace. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!initial.categories && !initial.error) load();
  }, []);
  return (
    <div className="home-page">
      <section className="hero page-container">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-dot" />
            EVERYDAY TASKS. EXTRAORDINARY HELP.
          </span>
          <h1>
            A little help.
            <br />
            <em>A lot more</em>
            <br />
            done.
          </h1>
          <p>
            From the shelf that needs fixing to the move you've been putting off. Find the right
            skills, right here.
          </p>
          <div className="hero-actions">
            <Link to="/post-task" className="button">
              Post a task <ArrowUpRight size={20} />
            </Link>
            <Link to="/tasks" className="text-link">
              Find work <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-footnote">
            <Check size={16} />
            Set your budget <span>·</span>Compare offers <span>·</span>Choose your tasker
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/hero-home.svg"
            alt="Illustrated home representing everyday local services"
            width="580"
            height="500"
            fetchpriority="high"
          />
          <div className="floating-note note-one">
            <span className="note-icon">
              <Wrench size={21} />
            </span>
            <div>
              <strong>That thing on your list?</strong>
              <span>There's a tasker for that.</span>
            </div>
          </div>
          <div className="floating-note note-two">
            <span className="note-icon green">
              <Check size={22} />
            </span>
            <div>
              <strong>Make time for your life.</strong>
              <span>We'll help with the to-dos.</span>
            </div>
          </div>
          <span className="art-caption">A home, a project, a fresh start.</span>
        </div>
      </section>
      <section className="search-band">
        <form
          className="page-container search-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(
              '/tasks' + (query.trim() ? '?search=' + encodeURIComponent(query.trim()) : ''),
            );
          }}
        >
          <label htmlFor="home-search">What needs doing?</label>
          <div className="search-input">
            <Search size={21} />
            <input
              id="home-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try furniture assembly or moving help"
            />
          </div>
          <button className="button" type="submit">
            Explore tasks <ArrowRight size={18} />
          </button>
        </form>
      </section>
      <section className="page-container home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BIG JOBS. SMALL JOBS. YOUR JOBS.</span>
            <h2>A skill for every situation.</h2>
          </div>
          <Link to="/tasks" className="text-link">
            Explore all tasks <ArrowUpRight size={18} />
          </Link>
        </div>
        {data.error ? (
          <Alert onRetry={load}>{data.error}</Alert>
        ) : loading ? (
          <Loading>Finding your next possibility…</Loading>
        ) : (
          <div className="category-grid">
            {data.categories?.map((c) => {
              const Icon = icons[c.slug] || Wrench;
              return (
                <Link key={c.id} to={'/tasks?category=' + c.slug} className="category-card">
                  <span className="category-icon">
                    <Icon size={27} strokeWidth={1.5} />
                  </span>
                  <h3>{c.name}</h3>
                  <ArrowUpRight size={18} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <section className="how-section" id="how-it-works">
        <div className="page-container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LESS HASSLE. MORE POSSIBILITY.</span>
              <h2>From to-do to ta-da.</h2>
            </div>
            <p>
              Good help starts with a clear conversation.
              <br />
              Here's how to make it happen.
            </p>
          </div>
          <div className="steps-grid">
            {[
              [
                ClipboardList,
                '01',
                'Tell us what you need',
                'Describe your task, choose a location and set a budget that works for you.',
              ],
              [
                MessageCircle,
                '02',
                'Find your kind of help',
                'Compare offers and profiles. Choose a tasker, then agree on the details in chat.',
              ],
              [
                Check,
                '03',
                'Get it done, together',
                'Confirm completion and share an honest review. Demo payments simulate the process.',
              ],
            ].map(([Icon, n, title, description]) => (
              <article key={n}>
                <div className="step-top">
                  <Icon size={30} strokeWidth={1.5} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="page-container home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR NEXT OPPORTUNITY</span>
            <h2>Someone could use your skills.</h2>
          </div>
          <Link to="/tasks" className="text-link">
            See all available tasks <ArrowUpRight size={18} />
          </Link>
        </div>
        {!loading &&
          !data.error &&
          (data.tasks?.length ? (
            <div className="task-grid">
              {data.tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>A fresh start.</h3>
              <p>No open tasks right now. Post one to get the conversation going.</p>
              <Link to="/post-task" className="button">
                Post a task
              </Link>
            </div>
          ))}
      </section>
      <section className="page-container">
        <div className="trust-panel">
          <div>
            <span className="eyebrow">CLEAR EXPECTATIONS. BETTER CONNECTIONS.</span>
            <h2>
              Good help starts
              <br />
              with good information.
            </h2>
          </div>
          <div>
            <p>
              Review tasker profiles and feedback, agree on the scope, and keep your conversation in
              the app. An identity badge reflects an admin-reviewed submission, not a background
              check.
            </p>
            <Link to="/trust-safety" className="text-link">
              Get to know our safety tools <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

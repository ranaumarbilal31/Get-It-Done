import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ClipboardList,
  CreditCard,
  Users,
  Laptop,
  Wrench,
  Truck,
  Hammer,
  Trees,
  Sparkles,
  Check,
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
  const initial = useRouteData(),
    [data, setData] = useState(initial.path === '/' ? initial : {}),
    [loading, setLoading] = useState(!initial.categories && !initial.error);
  const load = async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        api.get('/categories'),
        api.get('/tasks?limit=6&status=OPEN'),
      ]);
      setData({ ...c.data, ...t.data });
    } catch {
      setData({ error: 'The marketplace could not be loaded. Please retry.' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!initial.categories && !initial.error) load();
  }, []);
  return (
    <div className="home-page">
      <section className="hero-centered page-container">
        <span className="eyebrow">MORE TIME FOR WHAT MATTERS</span>
        <h1>
          Big ideas. Small errands.
          <br />
          <em>Get it done.</em>
        </h1>
        <p>
          From everyday to-dos to your next big project, connect with people who have the skills to
          make it happen.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/post-task">
            Get it done today <ArrowUpRight size={20} />
          </Link>
          <Link className="button secondary" to="/register">
            Turn your skills into cash <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="hero-footnote">
          <span>
            <Check size={16} />
            Your budget
          </span>
          <span>
            <Check size={16} />
            Your choice of tasker
          </span>
          <span>
            <Check size={16} />
            Your approval before release
          </span>
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="page-container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A CLEAR BRIEF. A GREAT START.</span>
              <h2>Post your first task in seconds</h2>
            </div>
            <Link className="text-link" to="/how-it-works">
              How it works <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="steps-grid">
            {[
              [
                ClipboardList,
                '01',
                'Tell us what you need',
                'Describe the result, choose a category and set your budget.',
              ],
              [
                CreditCard,
                '02',
                'Fund your task',
                'Review your payment and publish your task for interested taskers.',
              ],
              [
                Users,
                '03',
                'Choose the right person',
                'Compare offers, agree on delivery and approve the work when it’s done.',
              ],
            ].map(([Icon, n, title, text]) => (
              <article key={n}>
                <div className="step-top">
                  <Icon size={30} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <Link className="button" to="/post-task">
            Post your task <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="page-container home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THERE’S A SKILL FOR THAT</span>
            <h2>What’s on your list?</h2>
          </div>
          <Link className="text-link" to="/tasks">
            Browse all tasks <ArrowUpRight size={18} />
          </Link>
        </div>
        {data.error ? (
          <Alert onRetry={load}>{data.error}</Alert>
        ) : loading ? (
          <Loading>Opening the marketplace…</Loading>
        ) : (
          <div className="category-grid">
            {data.categories?.map((c) => {
              const Icon = icons[c.slug] || Laptop;
              return (
                <Link key={c.id} to={'/tasks?category=' + c.slug} className="category-card">
                  <span className="category-icon">
                    <Icon size={28} />
                  </span>
                  <h3>{c.name}</h3>
                  <ArrowUpRight size={18} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <section className="page-container home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR SKILLS. THEIR NEXT STEP.</span>
            <h2>Find your next opportunity.</h2>
          </div>
          <Link to="/tasks" className="text-link">
            See available work <ArrowUpRight size={18} />
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
              <h3>Make the first move.</h3>
              <p>Have a project in mind? Post a task and start receiving offers.</p>
              <Link to="/post-task" className="button">
                Post a task
              </Link>
            </div>
          ))}
      </section>
      <section className="page-container home-section">
        <div className="tasker-panel">
          <div>
            <span className="eyebrow">WORK THAT FITS YOUR SKILLS</span>
            <h2>
              Make your next move.
              <br />
              On your terms.
            </h2>
            <p>
              Find local and remote tasks, send a thoughtful offer and build a profile through
              completed work.
            </p>
            <Link to="/register" className="button">
              Become a tasker <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="skill-stack">
            {['Build something brilliant', 'Solve an everyday problem', 'Help a business grow'].map(
              (s, i) => (
                <div key={s}>
                  <span>0{i + 1}</span>
                  <strong>{s}</strong>
                  <ArrowUpRight />
                </div>
              ),
            )}
          </div>
        </div>
      </section>
      <section className="page-container">
        <div className="trust-panel">
          <div>
            <span className="eyebrow">CLEAR EXPECTATIONS, BETTER CONNECTIONS</span>
            <h2>
              Good work starts
              <br />
              with good information.
            </h2>
          </div>
          <div>
            <p>
              Compare profiles and feedback, keep agreements in your task chat and review delivery
              before approving payment. If something goes wrong, both sides can request platform
              review.
            </p>
            <Link to="/trust-safety" className="text-link">
              Explore our safety tools <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

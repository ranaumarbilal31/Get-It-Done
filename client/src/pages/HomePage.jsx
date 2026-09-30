import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import TaskCard from '../components/TaskCard';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Lock,
  Star,
  Sparkles,
  Wrench,
  Hammer,
  Truck,
  Trees,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

const categoryIcons = {
  'home-cleaning': Sparkles,
  'handyman-repairs': Wrench,
  'furniture-assembly': Hammer,
  'removals-delivery': Truck,
  'gardening-lawns': Trees,
  'tech-support': Laptop,
};

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, taskRes] = await Promise.all([
          api.get('/categories'),
          api.get('/tasks?limit=6&status=OPEN'),
        ]);
        setCategories(catRes.data.categories || []);
        setRecentTasks(taskRes.data.tasks || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/tasks');
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-slate-50 to-white pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/70 text-brand-800 text-xs font-bold mb-6 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>The $0 Open-Source Airtasker Alternative</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Get any task done, or <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              earn money doing what you love.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect with verified local taskers for home repairs, cleaning, furniture assembly, moves, and digital jobs. Fast bids and secure simulated escrow payments.
          </p>

          {/* Big Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl sm:rounded-full shadow-xl border border-slate-200"
          >
            <div className="flex items-center gap-3 w-full pl-4 pr-2 py-2">
              <Search className="w-5 h-5 text-brand-600 shrink-0" />
              <input
                type="text"
                placeholder="What task do you need help with? (e.g. Clean 2BR apartment)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-6 py-3 rounded-xl sm:rounded-full transition shrink-0 shadow-md"
            >
              Find Tasks
            </button>
          </form>

          {/* Popular Category Badges */}
          <div className="mt-8 flex items-center justify-center flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="text-slate-400">Popular:</span>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                to={`/tasks?category=${cat.slug}`}
                className="px-3 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-full transition shadow-sm"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Popular Services
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Browse tasks across top categories or post your custom request in minutes.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.slug] || Wrench;
            return (
              <Link
                key={cat.id}
                to={`/tasks?category=${cat.slug}`}
                className="group flex flex-col items-center p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-brand-500 hover:shadow-lg transition text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center transition mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1">
                  {cat._count?.tasks || 0} active
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Live Recent Tasks Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Recent Open Tasks
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Real jobs awaiting competitive offers from local taskers.
            </p>
          </div>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">No open tasks available right now.</p>
            <Link
              to="/post-task"
              className="mt-3 inline-block bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Be the first to post a task
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-900 text-white py-16 sm:py-24 rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
            Simple & Transparent
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight">
            How TaskConnect Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-xl mx-auto">
            From listing a job to final payment release, our platform ensures a smooth, risk-free experience for both parties.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-extrabold text-lg mb-4 border border-brand-500/30">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Post Your Task</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tell us what you need done, set your budget, select date and location on the interactive map, and post for free.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-extrabold text-lg mb-4 border border-brand-500/30">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Review Offers & Chat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive quotes from verified taskers, view ratings, badges, and prior reviews, and chat in real-time.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-extrabold text-lg mb-4 border border-brand-500/30">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Escrow Protection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accept an offer to hold payment securely in platform escrow. Payment is only released when the job is completed to satisfaction.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link
              to="/post-task"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-sm px-7 py-3.5 rounded-2xl shadow-lg transition"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust, Safety & Free-Tier Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-brand-50/50 border border-brand-200/80 rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-800 bg-brand-100 px-3 py-1 rounded-full mb-3">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Trust & Safety Guarantee</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              A complete marketplace engineered on a $0 student budget
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Real marketplaces spend millions on KYC vendors and live payment processing fees. TaskConnect replicates this exact high-trust ecosystem using open-source Leaflet maps, simulated Stripe test mode escrow, admin-moderated identity verification, and Socket.IO real-time channels.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Admin ID KYC Mock</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Real document uploads approved via moderator dashboard.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Escrow Security</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Funds held safely in escrow until the poster approves completion.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Mutual 5-Star Reviews</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Transparent user ratings calculated automatically upon job delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

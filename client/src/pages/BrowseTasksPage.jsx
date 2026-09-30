import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import TaskCard from '../components/TaskCard';
import TaskMap from '../components/TaskMap';
import { Search, Filter, Map, List, RotateCcw, SlidersHorizontal } from 'lucide-react';

export default function BrowseTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from URL query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'OPEN');
  const [isRemote, setIsRemote] = useState(searchParams.get('isRemote') || '');
  const [minBudget, setMinBudget] = useState(searchParams.get('minBudget') || '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('maxBudget') || '');
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch tasks whenever filters change
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category && category !== 'all') params.set('category', category);
        if (status) params.set('status', status);
        if (isRemote !== '') params.set('isRemote', isRemote);
        if (minBudget) params.set('minBudget', minBudget);
        if (maxBudget) params.set('maxBudget', maxBudget);

        const res = await api.get(`/tasks?${params.toString()}`);
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [search, category, status, isRemote, minBudget, maxBudget]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setStatus('OPEN');
    setIsRemote('');
    setMinBudget('');
    setMaxBudget('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Search Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Browse Community Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore local in-person and remote tasks, submit bids, and get hired.
            </p>
          </div>

          {/* Mobile view toggle (List vs Map) */}
          <div className="flex lg:hidden items-center gap-2 self-start">
            <button
              onClick={() => setShowMapOnMobile(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                !showMapOnMobile ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setShowMapOnMobile(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                showMapOnMobile ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>

            {/* Category Select */}
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-700 font-medium"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-700 font-medium"
              >
                <option value="OPEN">Status: Open Tasks</option>
                <option value="ASSIGNED">Status: Assigned Tasks</option>
                <option value="COMPLETED">Status: Completed Tasks</option>
                <option value="ALL">Status: All Statuses</option>
              </select>
            </div>

            {/* In-Person vs Remote */}
            <div>
              <select
                value={isRemote}
                onChange={(e) => setIsRemote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-700 font-medium"
              >
                <option value="">Location: Any Location</option>
                <option value="false">In-Person Only</option>
                <option value="true">Remote / Online Only</option>
              </select>
            </div>

            {/* Budget Range / Reset */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min $"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
              />
              <input
                type="number"
                placeholder="Max $"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
              />
              <button
                onClick={handleResetFilters}
                title="Reset Filters"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Tasks List & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks List */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            showMapOnMobile ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>Showing {tasks.length} task{tasks.length === 1 ? '' : 's'}</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No tasks match your filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try clearing some filters or searching for different keywords to find available tasks.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map */}
        <div
          className={`lg:col-span-5 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] ${
            showMapOnMobile ? 'block h-[70vh]' : 'hidden lg:block'
          }`}
        >
          <TaskMap tasks={tasks} />
        </div>
      </div>
    </div>
  );
}

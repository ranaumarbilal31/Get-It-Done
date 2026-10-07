import { Dialog } from '../components/UI';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/ClientMap';
import {
  DollarSign,
  Calendar,
  MapPin,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function PostTaskPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const publishLock = useRef(false);

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Inline Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('tc_task_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.categoryId) setCategoryId(parsed.categoryId);
        if (parsed.isRemote !== undefined) setIsRemote(parsed.isRemote);
        if (parsed.locationName) setLocationName(parsed.locationName);
        if (parsed.latitude) setLatitude(parsed.latitude);
        if (parsed.longitude) setLongitude(parsed.longitude);
        if (parsed.dueDate) setDueDate(parsed.dueDate);
      }
    } catch (e) {
      console.warn('Failed to parse draft from sessionStorage', e);
    }
  }, []);

  // Auto-save draft changes to sessionStorage
  useEffect(() => {
    const draft = {
      title,
      description,
      budget,
      categoryId,
      isRemote,
      locationName,
      latitude,
      longitude,
      dueDate,
    };
    try {
      sessionStorage.setItem('tc_task_draft', JSON.stringify(draft));
    } catch (e) {
      // ignore quota errors
    }
  }, [
    title,
    description,
    budget,
    categoryId,
    isRemote,
    locationName,
    latitude,
    longitude,
    dueDate,
  ]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const cats = res.data.categories || [];
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, [categoryId]);

  const handleLocationPicked = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    if (!locationName) {
      setLocationName(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const executePublish = async () => {
    if (publishLock.current) return;
    publishLock.current = true;
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('budget', budget);
      formData.append('categoryId', categoryId);
      formData.append('isRemote', isRemote);
      formData.append('location', isRemote ? 'Remote / Online' : locationName);
      if (!isRemote) {
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);
      }
      if (dueDate) {
        formData.append('dueDate', dueDate);
      }

      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const res = await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Clear draft on successful post
      sessionStorage.removeItem('tc_task_draft');
      navigate(`/tasks/${res.data.task.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
      setSubmitting(false);
      publishLock.current = false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !budget || !categoryId) {
      setError('Please fill in all required fields (title, description, budget, category).');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    await executePublish();
  };

  const handleModalAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await login(authEmail, authPassword);
      } else {
        if (!authName) {
          setAuthError('Please enter your full name');
          setAuthLoading(false);
          return;
        }
        await register(authName, authEmail, authPassword);
      }
      setShowAuthModal(false);
      await executePublish();
    } catch (err) {
      setAuthError(
        err.response?.data?.message ||
          err.message ||
          'Authentication failed. Please verify credentials.',
      );
      setAuthLoading(false);
    }
  };

  return (
    <div className="page-container workspace-page post-workspace py-10">
      <div className="post-form-card bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>YOUR TASK. YOUR TERMS.</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tell us what you need done
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Describe your task clearly, then compare offers from interested taskers.
          </p>
        </div>

        {!user && (
          <div className="p-4 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Draft Mode:</strong> Your task is auto-saved locally. Fill out your details
                now and sign in when ready to publish.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 shadow-sm transition"
            >
              Sign In Now
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Move 2-seater sofa to 2nd floor apartment"
              aria-label="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white transition"
            />
          </div>

          {/* Category & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Category *
              </label>
              <select
                required
                aria-label="Task category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 text-slate-700"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Estimated Budget ($ USD) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="number"
                  min="5"
                  step="1"
                  required
                  placeholder="150"
                  aria-label="Budget in US dollars"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Location Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
              Task Location Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsRemote(false)}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                  !isRemote
                    ? 'border-brand-500 bg-brand-50/50 text-brand-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>In-Person at Location</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRemote(true)}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                  isRemote
                    ? 'border-brand-500 bg-brand-50/50 text-brand-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Online / Remote</span>
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map Picker (Only for In-Person) */}
          {!isRemote && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Suburb or Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brooklyn, NY or East Village"
                  aria-label="Location"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Exact house numbers are kept confidential until you accept an offer.
                </p>
              </div>
              <MapPicker
                initialLat={latitude}
                initialLng={longitude}
                onLocationSelect={handleLocationPicked}
              />
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Due Date (Optional)
            </label>
            <input
              type="date"
              aria-label="Due date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 text-slate-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Detailed Description *
            </label>
            <textarea
              rows="5"
              required
              placeholder="Describe the task in detail. What needs doing? What tools are required? Are there stairs or elevators?..."
              aria-label="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Attach Photos (Optional)
            </label>
            <input
              aria-label="Upload a file"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-lg transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publishing Task...</span>
                </>
              ) : (
                <span>Publish Task Listing</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Inline Auth Modal for Guests */}
      {showAuthModal && (
        <Dialog title="Sign in to publish a task" onClose={() => setShowAuthModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {authMode === 'login' ? 'Sign in to Publish' : 'Create Account to Publish'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your task draft is securely preserved. Once signed in, it will be posted
                immediately.
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleModalAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    aria-label="Full name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  aria-label="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  aria-label="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>
                    {authMode === 'login' ? 'Sign In & Post Task' : 'Register & Post Task'}
                  </span>
                )}
              </button>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}

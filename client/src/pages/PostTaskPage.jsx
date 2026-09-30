import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import {
  DollarSign,
  Calendar,
  MapPin,
  Image,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function PostTaskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Protect route
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/post-task');
    }
  }, [user, navigate]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || []);
        if (res.data.categories?.length > 0) {
          setCategoryId(res.data.categories[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const handleLocationPicked = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    if (!locationName) {
      setLocationName(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !budget || !categoryId) {
      setError('Please fill in all required fields (title, description, budget, category).');
      return;
    }

    setSubmitting(true);

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

      navigate(`/tasks/${res.data.task.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Post a Free Marketplace Request</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tell us what you need done
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Taskers will see your listing and submit competitive quotes.
          </p>
        </div>

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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white"
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
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white"
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
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
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
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-lg transition"
            >
              {submitting ? 'Publishing Task...' : 'Post Task for Free'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

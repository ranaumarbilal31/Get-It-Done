import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, MessageSquare, DollarSign } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import RatingStars from './RatingStars';

export default function TaskCard({ task }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Open</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Assigned</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Completed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Flexible timing';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="group block bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-brand-500/50 hover:shadow-lg transition duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {getStatusBadge(task.status)}
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {task.category?.name || 'General'}
            </span>
            {task.isRemote && (
              <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Online / Remote
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-2">
            {task.title}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xl font-extrabold text-slate-900 block">
            ${task.budget}
          </span>
          <span className="text-[11px] font-medium text-slate-400">estimated budget</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{task.location}</span>
          </div>
          <div className="flex items-center gap-1 hidden sm:flex">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
            <span>{task._count?.offers || task.offers?.length || 0} offers</span>
          </div>
          {task.poster?.avatar && (
            <img
              src={task.poster.avatar}
              alt={task.poster.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
          )}
        </div>
      </div>
    </Link>
  );
}

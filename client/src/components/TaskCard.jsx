import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight, Calendar } from 'lucide-react';
export default function TaskCard({ task }) {
  return (
    <Link to={'/tasks/' + task.id} className="task-card">
      <div className="task-card-top">
        <span className="category-tag">{task.category?.name || 'General task'}</span>
        <span className={'status-pill status-' + task.status.toLowerCase()}>
          {task.status.toLowerCase()}
        </span>
      </div>
      <h3>{task.title}</h3>
      <p className="task-summary">{task.description}</p>
      <div className="task-facts">
        <span>
          <MapPin size={15} />
          {task.isRemote ? 'Remote / online' : task.location || 'Location to be agreed'}
        </span>
        <span>
          <Calendar size={15} />
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })
            : 'Flexible timing'}
        </span>
      </div>
      <div className="task-card-bottom">
        <div>
          <span className="budget-label">ESTIMATED BUDGET</span>
          <strong>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(task.budget)}
          </strong>
        </div>
        <span className="task-arrow">
          <ArrowUpRight size={23} />
        </span>
      </div>
    </Link>
  );
}

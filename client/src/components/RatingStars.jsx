import React from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, count, showCount = true, size = 'sm' }) {
  const starSize = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700 ml-0.5">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
      {showCount && count !== undefined && (
        <span className="text-xs text-slate-400">({count})</span>
      )}
    </div>
  );
}

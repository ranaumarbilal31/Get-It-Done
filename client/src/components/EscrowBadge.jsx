import React from 'react';
import { Lock } from 'lucide-react';

export default function EscrowBadge({ amount }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-medium">
      <div className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center">
        <Lock className="w-3 h-3" />
      </div>
      <span>
        {amount ? (
          <>
            <strong>${amount}</strong> Payment held
          </>
        ) : (
          'Awaiting delivery approval'
        )}
      </span>
    </div>
  );
}

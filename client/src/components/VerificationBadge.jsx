import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function VerificationBadge({ size = 'sm', showText = true }) {
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
      title="TaskConnect Verified ID Identity Badge"
    >
      <ShieldCheck className={isSmall ? 'w-3.5 h-3.5 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
      {showText && <span>Verified</span>}
    </span>
  );
}

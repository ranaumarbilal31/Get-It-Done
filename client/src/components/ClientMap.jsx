import React, { lazy, Suspense, useEffect, useState } from 'react';
const Picker = lazy(() => import('./MapPicker'));
const TaskMap = lazy(() => import('./TaskMap'));
export default function ClientMap({ mode, ...props }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const placeholder = (
    <div className="map-placeholder" role="status">
      Loading interactive map…
    </div>
  );
  return mounted ? (
    <Suspense fallback={placeholder}>
      {mode === 'tasks' ? <TaskMap {...props} /> : <Picker {...props} />}
    </Suspense>
  ) : (
    placeholder
  );
}

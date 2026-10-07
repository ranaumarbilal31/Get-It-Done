import React, { useEffect, useRef } from 'react';
export function Alert({ children, onRetry }) {
  return (
    <div role="alert" className="alert">
      {children}
      {onRetry && (
        <button type="button" onClick={onRetry} className="button button-secondary">
          Try again
        </button>
      )}
    </div>
  );
}
export function Loading({ children = 'Loading…' }) {
  return (
    <div role="status" className="loading-state">
      <span className="loader" />
      {children}
    </div>
  );
}
export function Dialog({ title, children, onClose }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const element = ref.current;
    element.focus();
    const handler = (event) => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const nodes = [
        ...element.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]'),
      ].filter((node) => !node.disabled);
      const first = nodes[0],
        last = nodes.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === element)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      previous?.focus();
    };
  }, []);
  return (
    <div className="dialog-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="dialog"
      >
        <button type="button" aria-label="Close dialog" className="dialog-close" onClick={onClose}>
          ×
        </button>
        {children}
      </section>
    </div>
  );
}

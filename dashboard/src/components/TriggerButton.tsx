'use client';

import { useState, useTransition } from 'react';

export function TriggerButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function fire() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch('/api/jobs', { method: 'POST' });
      if (!res.ok) {
        setMessage('Erreur — voir logs');
        return;
      }
      setMessage('Job mis en file — sera ramassé par le worker');
      setTimeout(() => window.location.reload(), 1500);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-xs text-text-muted">{message}</span>}
      <button
        onClick={fire}
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Envoi…' : 'Déclencher un scrape'}
      </button>
    </div>
  );
}

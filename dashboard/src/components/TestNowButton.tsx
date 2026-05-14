'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function TestNowButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch('/api/jobs', { method: 'POST' });
      if (!res.ok) {
        setMessage('Erreur — voir logs');
        return;
      }
      setMessage('Job mis en file. Recharge dans quelques secondes.');
      setTimeout(() => router.refresh(), 3000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-xs text-text-muted">{message}</span>}
      <button
        onClick={run}
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Envoi…' : 'Tester maintenant'}
      </button>
    </div>
  );
}

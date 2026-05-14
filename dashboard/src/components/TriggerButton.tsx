'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function TriggerButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function fire() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch('/api/jobs', { method: 'POST' });
      if (!res.ok) {
        setMessage('Erreur — voir logs');
        return;
      }
      setMessage('Job mis en file…');
      setTimeout(() => {
        router.refresh();
        setMessage(null);
      }, 3000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-[12px] text-muted">{message}</span>}
      <Button variant="accent" onClick={fire} disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" /> Déclencher un scrape
          </>
        )}
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { ExecutionDetail } from '@/components/ExecutionDetail';
import { formatDate, formatDuration, cn } from '@/lib/utils';

type Execution = {
  id: string;
  status: 'running' | 'success' | 'partial' | 'failed';
  triggered_by: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  leads_found: number;
  leads_inserted: number;
  leads_skipped: number;
  error_message: string | null;
  logs: unknown;
};

const statusTone: Record<Execution['status'], StatusTone> = {
  running: 'blue',
  success: 'success',
  partial: 'warning',
  failed: 'danger',
};

const statusLabel: Record<Execution['status'], string> = {
  running: 'En cours',
  success: 'Succès',
  partial: 'Partiel',
  failed: 'Échec',
};

const triggerLabel: Record<string, string> = {
  cron: 'Automatique',
  manual: 'Manuel',
  startup: 'Démarrage',
};

export function ExecutionsList({ executions }: { executions: Execution[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (executions.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-[13px] text-muted">
        Aucune exécution pour le moment.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[24px_1fr_120px_120px_100px_100px_120px] gap-4 border-b border-line bg-canvas-2/50 px-5 py-2.5">
        <div />
        <div className="eyebrow">Démarré · Source</div>
        <div className="eyebrow">Statut</div>
        <div className="eyebrow">Durée</div>
        <div className="eyebrow text-right">Trouvés</div>
        <div className="eyebrow text-right">Insérés</div>
        <div className="eyebrow text-right">Étapes</div>
      </div>
      <div>
        {executions.map((e) => {
          const open = openId === e.id;
          const stepCount = Array.isArray(e.logs) ? e.logs.length : 0;
          const stepFailed = Array.isArray(e.logs)
            ? (e.logs as { status: string }[]).filter((s) => s.status === 'failed').length
            : 0;
          return (
            <div key={e.id} className="border-b border-line/60 last:border-0">
              <button
                onClick={() => setOpenId(open ? null : e.id)}
                className={cn(
                  'grid w-full grid-cols-[24px_1fr_120px_120px_100px_100px_120px] gap-4 px-5 py-3.5 text-left transition-colors',
                  open ? 'bg-violet-soft/50' : 'hover:bg-canvas-2/40',
                )}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 self-center text-muted transition-transform duration-200',
                    open && 'rotate-90 text-violet-strong',
                  )}
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink">{formatDate(e.started_at)}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted">
                    {triggerLabel[e.triggered_by] ?? e.triggered_by}
                    <span className="font-mono ml-2 text-muted-2">#{e.id.slice(0, 6)}</span>
                  </div>
                </div>
                <div className="self-center">
                  <StatusPill tone={statusTone[e.status]} pulse={e.status === 'running'}>
                    {statusLabel[e.status]}
                  </StatusPill>
                </div>
                <div className="self-center text-[13px] tabular-nums">
                  {e.status === 'running' ? (
                    <span className="inline-flex items-center gap-1.5 text-blue">
                      <Loader2 className="h-3 w-3 animate-spin" /> …
                    </span>
                  ) : (
                    formatDuration(e.duration_ms)
                  )}
                </div>
                <div className="self-center text-right text-[13px] tabular-nums">{e.leads_found}</div>
                <div className="self-center text-right text-[13px] font-medium tabular-nums text-emerald">
                  {e.leads_inserted}
                </div>
                <div className="self-center text-right text-[12.5px] tabular-nums text-muted">
                  {stepCount > 0 ? (
                    <>
                      {stepCount - stepFailed}<span className="text-muted-2">/{stepCount}</span>
                      {stepFailed > 0 && <span className="ml-1 text-red">({stepFailed})</span>}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              </button>

              {open && (
                <div className="animate-accordion-down border-t border-line/60 bg-canvas-2/30 px-5 py-5">
                  <ExecutionDetail executionId={e.id} executionRow={e} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Check, X, AlertCircle } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';

type Step = {
  name: string;
  label: string;
  status: 'ok' | 'failed' | 'partial';
  started_at: string;
  duration_ms: number;
  message?: string;
  data?: Record<string, unknown>;
};

const config = {
  ok: { Icon: Check, bg: 'bg-emerald', text: 'text-emerald', ring: 'ring-emerald-soft' },
  failed: { Icon: X, bg: 'bg-red', text: 'text-red', ring: 'ring-red-soft' },
  partial: { Icon: AlertCircle, bg: 'bg-amber', text: 'text-amber', ring: 'ring-amber-soft' },
};

export function Timeline({ steps }: { steps: Step[] }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white px-4 py-3 text-[12.5px] text-muted">
        Aucune trace disponible pour cette exécution.
      </div>
    );
  }
  return (
    <ol className="relative space-y-2">
      <div className="absolute bottom-3 left-[11px] top-3 w-px bg-line" aria-hidden />
      {steps.map((step, i) => {
        const { Icon, bg, text, ring } = config[step.status];
        return (
          <li key={i} className="relative flex items-stretch gap-3">
            <span
              className={cn(
                'relative z-10 mt-2 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-white ring-4',
                bg,
                ring,
              )}
            >
              <Icon className="h-3 w-3" strokeWidth={3} />
            </span>
            <div className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[13px] font-medium text-ink">{step.label}</div>
                <div className={cn('shrink-0 text-[11px] tabular-nums', text)}>
                  {formatDuration(step.duration_ms)}
                </div>
              </div>
              {step.data && Object.keys(step.data).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {Object.entries(step.data).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-md bg-canvas-2 px-1.5 py-0.5 text-[11px] text-muted"
                    >
                      <span className="font-medium text-ink-2">{String(v)}</span>
                      <span>{k}</span>
                    </span>
                  ))}
                </div>
              )}
              {step.message && (
                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-red-soft px-2 py-1.5 text-[11.5px] text-red">
                  {step.message}
                </pre>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

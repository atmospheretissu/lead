import { formatDuration } from '@/lib/utils';

type Step = {
  name: string;
  label: string;
  status: 'ok' | 'failed' | 'partial';
  started_at: string;
  duration_ms: number;
  message?: string;
  data?: Record<string, unknown>;
};

const iconFor: Record<Step['status'], string> = {
  ok: '✓',
  failed: '✕',
  partial: '!',
};

const colorFor: Record<Step['status'], string> = {
  ok: 'bg-success text-white',
  failed: 'bg-danger text-white',
  partial: 'bg-warn text-black',
};

export function Timeline({ steps }: { steps: Step[] }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
        Pas de trace disponible pour cette exécution.
      </div>
    );
  }
  return (
    <ol className="relative space-y-3 border-l border-border pl-6">
      {steps.map((step, i) => (
        <li key={i} className="relative">
          <span
            className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              colorFor[step.status] ?? 'bg-surface-2 text-text-muted'
            }`}
          >
            {iconFor[step.status] ?? '·'}
          </span>
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{step.label}</div>
              <div className="text-xs text-text-muted">{formatDuration(step.duration_ms)}</div>
            </div>
            {step.data && Object.keys(step.data).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                {Object.entries(step.data).map(([k, v]) => (
                  <span key={k} className="rounded bg-surface-2 px-2 py-0.5 text-text-muted">
                    {k}: <span className="text-text">{String(v)}</span>
                  </span>
                ))}
              </div>
            )}
            {step.message && (
              <pre className="mt-2 whitespace-pre-wrap rounded bg-surface-2 p-2 text-xs text-danger">
                {step.message}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

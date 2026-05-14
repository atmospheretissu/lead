'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Timeline } from '@/components/Timeline';
import { RawLeadsTable } from '@/components/RawLeadsTable';
import { formatDuration } from '@/lib/utils';

type ExecutionRow = {
  id: string;
  status: string;
  duration_ms: number | null;
  leads_found: number;
  leads_inserted: number;
  leads_skipped: number;
  error_message: string | null;
};

type RawLead = {
  id: string;
  external_ref: string | null;
  raw_data: Record<string, unknown> | null;
  source_url: string | null;
  inserted: boolean;
  skip_reason: string | null;
  lm_lead_id: string | null;
  client_id: string | null;
};

type Step = {
  name: string;
  label: string;
  status: 'ok' | 'failed' | 'partial';
  started_at: string;
  duration_ms: number;
  message?: string;
  data?: Record<string, unknown>;
};

export function ExecutionDetail({
  executionId,
  executionRow,
}: {
  executionId: string;
  executionRow: ExecutionRow & { logs?: unknown };
}) {
  const [rawLeads, setRawLeads] = useState<RawLead[] | null>(null);
  const steps = (Array.isArray(executionRow.logs) ? executionRow.logs : []) as Step[];

  useEffect(() => {
    let cancelled = false;
    setRawLeads(null);
    fetch(`/api/executions/${executionId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRawLeads(d.rawLeads ?? []);
      })
      .catch(() => {
        if (!cancelled) setRawLeads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [executionId]);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-4 gap-3">
        <Mini label="Durée" value={formatDuration(executionRow.duration_ms)} />
        <Mini label="Leads trouvés" value={String(executionRow.leads_found)} />
        <Mini label="Insérés" value={String(executionRow.leads_inserted)} tone="success" />
        <Mini
          label="Ignorés"
          value={String(executionRow.leads_skipped)}
          tone={executionRow.leads_skipped > 0 ? 'warning' : undefined}
        />
      </section>

      {executionRow.error_message && (
        <div className="rounded-lg border border-red/30 bg-red-soft px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-red">Erreur</div>
          <pre className="mt-1 whitespace-pre-wrap text-[12px] text-ink-2">
            {executionRow.error_message}
          </pre>
        </div>
      )}

      <section>
        <h3 className="mb-2.5 text-[13px] font-semibold text-ink">Timeline</h3>
        <Timeline steps={steps} />
      </section>

      <section>
        <h3 className="mb-2.5 text-[13px] font-semibold text-ink">
          Leads capturés
          {rawLeads !== null && (
            <span className="ml-2 text-[11.5px] font-normal text-muted">({rawLeads.length})</span>
          )}
        </h3>
        {rawLeads === null ? (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-[12.5px] text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement des leads…
          </div>
        ) : (
          <RawLeadsTable rows={rawLeads} />
        )}
      </section>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  const color =
    tone === 'success' ? 'text-emerald' : tone === 'warning' ? 'text-amber' : 'text-ink';
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className={`display-num mt-1 text-[20px] ${color}`}>{value}</div>
    </div>
  );
}

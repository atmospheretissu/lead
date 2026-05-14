import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { formatDate, formatDuration } from '@/lib/utils';
import { Timeline } from '@/components/Timeline';
import { RawLeadsTable } from '@/components/RawLeadsTable';

export const dynamic = 'force-dynamic';

const statusColor: Record<string, string> = {
  running: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  partial: 'bg-warn/15 text-warn',
  failed: 'bg-danger/15 text-danger',
};

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const [{ data: exec }, { data: rawLeads }] = await Promise.all([
    supabase.from('atmolead_executions').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('atmolead_leads_raw')
      .select('id, external_ref, raw_data, source_url, inserted, skip_reason, lm_lead_id, client_id, created_at')
      .eq('execution_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!exec) notFound();

  const steps = Array.isArray(exec.logs) ? exec.logs : [];
  const totalRaw = rawLeads?.length ?? 0;
  const insertedCount = rawLeads?.filter((r) => r.inserted).length ?? 0;
  const skippedCount = totalRaw - insertedCount;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <Link href="/executions" className="text-sm text-text-muted hover:text-text">
            ← Toutes les exécutions
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            Exécution{' '}
            <span className="font-mono text-base text-text-muted">{exec.id.slice(0, 8)}</span>
          </h1>
          <p className="text-sm text-text-muted">
            {formatDate(exec.started_at)} — déclenché par {exec.triggered_by}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            statusColor[exec.status] ?? ''
          }`}
        >
          {exec.status}
        </span>
      </header>

      <section className="grid grid-cols-4 gap-3">
        <Stat label="Durée totale" value={formatDuration(exec.duration_ms)} />
        <Stat label="Leads trouvés" value={String(exec.leads_found ?? 0)} />
        <Stat label="Insérés" value={String(insertedCount)} tone="success" />
        <Stat label="Ignorés" value={String(skippedCount)} tone={skippedCount ? 'warn' : 'muted'} />
      </section>

      {exec.error_message && (
        <section className="rounded-lg border border-danger/40 bg-danger/5 p-4">
          <h3 className="mb-1 text-sm font-medium text-danger">Erreur</h3>
          <pre className="whitespace-pre-wrap text-xs text-text-muted">
            {exec.error_message}
          </pre>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">Étapes</h2>
        <Timeline steps={steps} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Leads scrapés ({totalRaw})</h2>
        <RawLeadsTable rows={rawLeads ?? []} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warn' | 'muted';
}) {
  const toneClass =
    tone === 'success' ? 'text-success' : tone === 'warn' ? 'text-warn' : tone === 'muted' ? 'text-text-muted' : 'text-text';
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

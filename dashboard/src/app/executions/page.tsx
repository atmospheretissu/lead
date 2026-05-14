import Link from 'next/link';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { formatDate, formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const statusColor: Record<string, string> = {
  running: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  partial: 'bg-warn/15 text-warn',
  failed: 'bg-danger/15 text-danger',
};

export default async function ExecutionsPage() {
  const supabase = getSupabaseAdminClient();
  const { data: executions } = await supabase
    .from('atmolead_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Exécutions</h1>
        <p className="text-sm text-text-muted">
          100 dernières runs du scraper — clique sur une ligne pour voir le détail.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3">Démarré</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3">Trouvés</th>
              <th className="px-4 py-3">Insérés</th>
              <th className="px-4 py-3">Ignorés</th>
              <th className="px-4 py-3">Étapes</th>
            </tr>
          </thead>
          <tbody>
            {(executions ?? []).map((e) => {
              const stepCount = Array.isArray(e.logs) ? e.logs.length : 0;
              const stepFailed = Array.isArray(e.logs)
                ? (e.logs as { status: string }[]).filter((s) => s.status === 'failed').length
                : 0;
              return (
                <tr
                  key={e.id}
                  className="cursor-pointer border-t border-border transition hover:bg-surface-2"
                  onClick={undefined}
                >
                  <td className="px-4 py-3 text-text-muted">
                    <Link href={`/executions/${e.id}`} className="block">
                      {formatDate(e.started_at)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/executions/${e.id}`} className="block">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          statusColor[e.status] ?? ''
                        }`}
                      >
                        {e.status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    <Link href={`/executions/${e.id}`} className="block">
                      {e.triggered_by}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/executions/${e.id}`} className="block">
                      {formatDuration(e.duration_ms)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/executions/${e.id}`} className="block">
                      {e.leads_found}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-success">
                    <Link href={`/executions/${e.id}`} className="block">
                      {e.leads_inserted}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    <Link href={`/executions/${e.id}`} className="block">
                      {e.leads_skipped}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    <Link href={`/executions/${e.id}`} className="block">
                      {stepCount > 0 ? (
                        <span>
                          {stepCount - stepFailed}/{stepCount}{' '}
                          {stepFailed > 0 && <span className="text-danger">({stepFailed} ✕)</span>}
                        </span>
                      ) : (
                        '—'
                      )}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!executions || executions.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  Aucune exécution.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

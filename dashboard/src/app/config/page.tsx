import Link from 'next/link';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { formatDate, formatDuration } from '@/lib/utils';
import { describeCron } from '@/lib/cron';
import { ConfigForm } from '@/components/ConfigForm';
import { WorkerStatusCard } from '@/components/WorkerStatusCard';
import { TestNowButton } from '@/components/TestNowButton';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const supabase = getSupabaseAdminClient();
  const yesterday = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [{ data: config }, { data: lastSuccess }, recentExecs, leadsLast24h] = await Promise.all([
    supabase.from('atmolead_config').select('*').single(),
    supabase
      .from('atmolead_executions')
      .select('id, started_at, leads_inserted, status, duration_ms')
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('atmolead_executions')
      .select('id, status, started_at, leads_found, leads_inserted, duration_ms, triggered_by')
      .order('started_at', { ascending: false })
      .limit(5),
    supabase
      .from('atmolead_leads_raw')
      .select('*', { count: 'exact', head: true })
      .eq('inserted', true)
      .gte('created_at', yesterday),
  ]);

  const cronInfo = config ? describeCron(config.cron_expression) : null;

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configuration</h1>
          <p className="text-sm text-text-muted">
            URL cible, fréquence et sélecteurs CSS. Modifiable sans redéploiement du worker.
          </p>
        </div>
        <TestNowButton />
      </header>

      <WorkerStatusCard
        config={config}
        cronInfo={cronInfo}
        lastSuccess={lastSuccess}
        leadsLast24h={leadsLast24h.count ?? 0}
      />

      <ConfigForm config={config} />

      <section>
        <h2 className="mb-3 text-lg font-medium">Dernières exécutions</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-2">Démarré</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Trigger</th>
                <th className="px-4 py-2">Durée</th>
                <th className="px-4 py-2">Trouvés</th>
                <th className="px-4 py-2">Insérés</th>
              </tr>
            </thead>
            <tbody>
              {(recentExecs.data ?? []).map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-surface-2">
                  <td className="px-4 py-2">
                    <Link
                      href={`/executions/${e.id}`}
                      className="text-text-muted hover:text-accent"
                    >
                      {formatDate(e.started_at)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        e.status === 'success'
                          ? 'bg-success/15 text-success'
                          : e.status === 'partial'
                            ? 'bg-warn/15 text-warn'
                            : e.status === 'failed'
                              ? 'bg-danger/15 text-danger'
                              : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{e.triggered_by}</td>
                  <td className="px-4 py-2">{formatDuration(e.duration_ms)}</td>
                  <td className="px-4 py-2">{e.leads_found}</td>
                  <td className="px-4 py-2 text-success">{e.leads_inserted}</td>
                </tr>
              ))}
              {(!recentExecs.data || recentExecs.data.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-text-muted">
                    Pas encore d&apos;exécution.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

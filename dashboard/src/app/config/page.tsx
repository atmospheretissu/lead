import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { describeCron } from '@/lib/cron';
import { ConfigForm } from '@/components/ConfigForm';
import { WorkerStatusCard } from '@/components/WorkerStatusCard';
import { TestNowButton } from '@/components/TestNowButton';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const supabase = getSupabaseAdminClient();
  const yesterday = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [{ data: config }, { data: lastSuccess }, leadsLast24h] = await Promise.all([
    supabase.from('atmolead_config').select('*').single(),
    supabase
      .from('atmolead_executions')
      .select('id, started_at, leads_inserted, status, duration_ms')
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('atmolead_leads_raw')
      .select('*', { count: 'exact', head: true })
      .eq('inserted', true)
      .gte('created_at', yesterday),
  ]);

  const cronInfo = config ? describeCron(config.cron_expression) : null;

  return (
    <div className="max-w-4xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Pipeline LM</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Configuration</h1>
          <p className="mt-1 text-[13px] text-muted">
            Récurrence, sélecteurs CSS, état du worker. Modifiable sans redéploiement.
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
    </div>
  );
}

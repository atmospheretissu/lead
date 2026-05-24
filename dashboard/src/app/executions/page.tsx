import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { ExecutionsList } from '@/components/ExecutionsList';
import { Card } from '@/components/ui/Card';
import { ColorChip } from '@/components/ui/StatusPill';
import { Pagination } from '@/components/ui/Pagination';
import { Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function ExecutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = getSupabaseAdminClient();
  const yesterday = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const [
    { data: executions, count: total },
    { count: success24h },
    { count: failed24h },
    { count: partial24h },
  ] = await Promise.all([
    supabase
      .from('atmolead_executions')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from('atmolead_executions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .gte('started_at', yesterday),
    supabase
      .from('atmolead_executions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('started_at', yesterday),
    supabase
      .from('atmolead_executions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'partial')
      .gte('started_at', yesterday),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Pipeline LM</p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Historique des exécutions</h1>
        <p className="mt-1 text-[13px] text-muted">
          Trace complète de chaque passage du scraper — clique pour déplier la timeline et les leads capturés.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-3">
        <Kpi tone="violet" icon={Activity} label="Total" value={String(total ?? 0)} />
        <Kpi tone="emerald" icon={CheckCircle2} label="Réussies (24h)" value={String(success24h ?? 0)} />
        <Kpi tone="red" icon={XCircle} label="Échouées (24h)" value={String(failed24h ?? 0)} />
        <Kpi tone="orange" icon={AlertTriangle} label="Partielles (24h)" value={String(partial24h ?? 0)} />
      </section>

      <Card className="overflow-hidden">
        <ExecutionsList executions={executions ?? []} />
        <Pagination
          basePath="/executions"
          currentPage={page}
          totalCount={total ?? 0}
          pageSize={PAGE_SIZE}
          itemNoun="exécutions"
        />
      </Card>
    </div>
  );
}

function Kpi({
  tone,
  icon: Icon,
  label,
  value,
}: {
  tone: 'violet' | 'emerald' | 'red' | 'orange';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="eyebrow">{label}</div>
          <div className="display-num mt-1.5 text-[24px]">{value}</div>
        </div>
        <ColorChip tone={tone} size="md">
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </ColorChip>
      </div>
    </Card>
  );
}

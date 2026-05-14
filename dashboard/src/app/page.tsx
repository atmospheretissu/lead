import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { TriggerButton } from '@/components/TriggerButton';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const supabase = getSupabaseAdminClient();

  const [{ data: leads }, { data: lastExec }, { count: totalCount }] = await Promise.all([
    supabase
      .from('lm_leads')
      .select('id, number, region, product_summary, status, amount, created_at, clients(display_name, email, phone, city)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('atmolead_executions')
      .select('id, status, started_at, finished_at, leads_found, leads_inserted')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('lm_leads').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads Leroy Merlin</h1>
          <p className="text-sm text-text-muted">
            {totalCount ?? 0} leads au total — dernier scrape{' '}
            {lastExec ? formatDate(lastExec.started_at) : 'jamais'}
          </p>
        </div>
        <TriggerButton />
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Région</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Reçu</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((l) => {
              const client = Array.isArray(l.clients) ? l.clients[0] : l.clients;
              return (
                <tr key={l.id} className="border-t border-border hover:bg-surface-2">
                  <td className="px-4 py-3 font-mono text-xs">{l.number}</td>
                  <td className="px-4 py-3">
                    <div>{client?.display_name ?? '—'}</div>
                    <div className="text-xs text-text-muted">
                      {[client?.email, client?.phone, client?.city].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td className="px-4 py-3">{l.region}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{l.product_summary}</td>
                  <td className="px-4 py-3">{l.amount ? `${l.amount} €` : '—'}</td>
                  <td className="px-4 py-3"><StatusPill value={l.status} /></td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(l.created_at)}</td>
                </tr>
              );
            })}
            {(!leads || leads.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  Aucun lead pour le moment. Déclenche un scrape pour démarrer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const colors: Record<string, string> = {
    nouveau: 'bg-accent/15 text-accent',
    contacte: 'bg-warn/15 text-warn',
    gagne: 'bg-success/15 text-success',
    perdu: 'bg-danger/15 text-danger',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[value] ?? 'bg-surface-2 text-text-muted'}`}>
      {value}
    </span>
  );
}

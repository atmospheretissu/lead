import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { TriggerButton } from '@/components/TriggerButton';
import { StatusPill, ColorChip, type StatusTone } from '@/components/ui/StatusPill';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { MapPin, Mail, Phone, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const statusTone: Record<string, StatusTone> = {
  nouveau: 'blue',
  visio_planifie: 'amber',
  echantillons: 'violet',
  devis_envoye: 'orange',
  valide: 'success',
  perdu: 'danger',
};

const statusLabel: Record<string, string> = {
  nouveau: 'Nouveau',
  visio_planifie: 'Visio planifiée',
  echantillons: 'Échantillons',
  devis_envoye: 'Devis envoyé',
  valide: 'Validé',
  perdu: 'Perdu',
};

export default async function LeadsPage({
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
    { data: leads, count: totalCount },
    { data: lastExec },
    { count: newCount },
    { count: amount24h },
    { data: amountAll },
  ] = await Promise.all([
    supabase
      .from('lm_leads')
      .select(
        'id, number, region, product_summary, status, amount, created_at, clients(display_name, email, phone, city, postal_code)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from('atmolead_executions')
      .select('id, status, started_at, leads_inserted, duration_ms')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('lm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'nouveau'),
    supabase
      .from('lm_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday),
    supabase.from('lm_leads').select('amount'),
  ]);

  const totalAmount = (amountAll ?? []).reduce((sum, l) => sum + (l.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Pipeline LM</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Leads Leroy Merlin</h1>
          <p className="mt-1 text-[13px] text-muted">
            {totalCount ?? 0} leads scrapés —{' '}
            {lastExec ? (
              <>
                dernier passage {formatDate(lastExec.started_at)} (
                <span className="text-emerald">{lastExec.leads_inserted} nouveau(x)</span>)
              </>
            ) : (
              'aucun scrape pour le moment'
            )}
          </p>
        </div>
        <TriggerButton />
      </header>

      <section className="grid grid-cols-4 gap-3">
        <KpiCard tone="violet" label="Total leads" value={String(totalCount ?? 0)} />
        <KpiCard tone="blue" label="Nouveaux à traiter" value={String(newCount ?? 0)} />
        <KpiCard tone="emerald" label="Reçus (24h)" value={String(amount24h ?? 0)} />
        <KpiCard
          tone="orange"
          label="Cumul montants"
          value={totalAmount > 0 ? `${Math.round(totalAmount).toLocaleString('fr-FR')} €` : '—'}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <div className="text-[13.5px] font-semibold">Tous les leads</div>
            <div className="text-[11.5px] text-muted">Triés par date d&apos;arrivée — {PAGE_SIZE} par page</div>
          </div>
        </div>
        <div className="hairline" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-canvas-2/50 text-left">
                <th className="px-5 py-2.5 eyebrow">Référence</th>
                <th className="px-5 py-2.5 eyebrow">Client</th>
                <th className="px-5 py-2.5 eyebrow">Magasin LM</th>
                <th className="px-5 py-2.5 eyebrow">Produit</th>
                <th className="px-5 py-2.5 eyebrow text-right">Montant</th>
                <th className="px-5 py-2.5 eyebrow">Statut</th>
                <th className="px-5 py-2.5 eyebrow">Reçu</th>
              </tr>
            </thead>
            <tbody>
              {(leads ?? []).map((l) => {
                const client = Array.isArray(l.clients) ? l.clients[0] : l.clients;
                const contact = [client?.email, client?.phone].filter(Boolean) as string[];
                return (
                  <tr key={l.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-canvas-2/40">
                    <td className="px-5 py-3">
                      <div className="font-mono text-[11.5px] text-muted">{l.number}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{client?.display_name ?? '—'}</div>
                      {contact.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted">
                          {client?.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {client.email}
                            </span>
                          )}
                          {client?.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {client.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-2" /> {l.region}
                      </div>
                      {client?.postal_code && (
                        <div className="mt-0.5 text-[11px] text-muted">
                          {client.postal_code} {client.city}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <div className="flex items-start gap-1.5 text-[12.5px]">
                        <Tag className="mt-0.5 h-3 w-3 shrink-0 text-muted-2" />
                        <span className="truncate text-ink-2" title={l.product_summary}>
                          {l.product_summary}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.amount ? (
                        <span className="font-medium tabular-nums">
                          {l.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </span>
                      ) : (
                        <span className="text-muted-2">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill tone={statusTone[l.status] ?? 'muted'}>
                        {statusLabel[l.status] ?? l.status}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-[11.5px] text-muted">
                      {formatDate(l.created_at)}
                    </td>
                  </tr>
                );
              })}
              {(!leads || leads.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-muted">
                    Aucun lead pour le moment. Déclenche un scrape depuis la page Configuration.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          basePath="/"
          currentPage={page}
          totalCount={totalCount ?? 0}
          pageSize={PAGE_SIZE}
          itemNoun="leads"
        />
      </Card>
    </div>
  );
}

function KpiCard({
  tone,
  label,
  value,
}: {
  tone: 'violet' | 'blue' | 'emerald' | 'orange';
  label: string;
  value: string;
}) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="eyebrow">{label}</div>
          <div className="display-num mt-1.5 text-[26px]">{value}</div>
        </div>
        <ColorChip tone={tone} size="md">
          <span className="text-[13px] font-semibold">·</span>
        </ColorChip>
      </div>
    </Card>
  );
}

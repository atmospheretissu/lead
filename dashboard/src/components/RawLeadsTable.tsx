import { CheckCircle2, MinusCircle } from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';

type RawLead = {
  id: string;
  external_ref: string | null;
  raw_data: Record<string, unknown> | null;
  source_url: string | null;
  inserted: boolean;
  skip_reason: string | null;
  lm_lead_id: string | null;
};

export function RawLeadsTable({ rows }: { rows: RawLead[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white px-4 py-3 text-[12.5px] text-muted">
        Aucun lead capturé pour cette exécution.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <table className="w-full text-[13px]">
        <thead className="border-b border-line bg-canvas-2/50">
          <tr className="text-left">
            <th className="px-4 py-2 eyebrow w-8"></th>
            <th className="px-4 py-2 eyebrow">Réf LM</th>
            <th className="px-4 py-2 eyebrow">Client</th>
            <th className="px-4 py-2 eyebrow">Magasin · Localisation</th>
            <th className="px-4 py-2 eyebrow text-right">Montant</th>
            <th className="px-4 py-2 eyebrow">Statut LM</th>
            <th className="px-4 py-2 eyebrow">Issue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const d = (r.raw_data ?? {}) as {
              name?: string;
              status?: string;
              product?: string;
              location?: string;
              amount?: string;
              detail?: { storeName?: string; customerEmail?: string };
            };
            return (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-canvas-2/30">
                <td className="px-4 py-2.5 align-top">
                  {r.inserted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald" strokeWidth={2.3} />
                  ) : (
                    <MinusCircle className="h-4 w-4 text-muted-2" strokeWidth={2.3} />
                  )}
                </td>
                <td className="px-4 py-2.5 align-top">
                  <span className="font-mono text-[11.5px] text-muted">{r.external_ref ?? '—'}</span>
                </td>
                <td className="px-4 py-2.5 align-top">
                  <div className="font-medium text-ink">{d.name ?? '—'}</div>
                  {d.detail?.customerEmail && (
                    <div className="mt-0.5 text-[11.5px] text-muted">{d.detail.customerEmail}</div>
                  )}
                </td>
                <td className="px-4 py-2.5 align-top">
                  <div className="text-[12.5px] text-ink-2">{d.detail?.storeName ?? '—'}</div>
                  <div className="mt-0.5 text-[11px] text-muted">{d.location ?? ''}</div>
                </td>
                <td className="px-4 py-2.5 align-top text-right">
                  <span className="font-mono text-[12px] text-ink-2">{d.amount ?? '—'}</span>
                </td>
                <td className="px-4 py-2.5 align-top">
                  <span className="text-[12.5px] text-muted">{d.status ?? '—'}</span>
                </td>
                <td className="px-4 py-2.5 align-top">
                  {r.inserted ? (
                    <StatusPill tone="success" dot={false}>
                      Inséré
                    </StatusPill>
                  ) : (
                    <StatusPill tone="muted" dot={false}>
                      {r.skip_reason ?? 'Ignoré'}
                    </StatusPill>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

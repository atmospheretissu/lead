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

export function RawLeadsTable({ rows }: { rows: RawLead[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
        Aucun lead capturé.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-muted">
          <tr>
            <th className="px-4 py-2">Réf LM</th>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Magasin / Produit</th>
            <th className="px-4 py-2">Montant</th>
            <th className="px-4 py-2">Statut</th>
            <th className="px-4 py-2">Disposition</th>
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
              detail?: { storeName?: string };
            };
            return (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{r.external_ref ?? '—'}</td>
                <td className="px-4 py-2">{d.name ?? '—'}</td>
                <td className="px-4 py-2">
                  <div>{d.detail?.storeName ?? d.location ?? '—'}</div>
                  <div className="text-xs text-text-muted">{d.product ?? ''}</div>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{d.amount ?? '—'}</td>
                <td className="px-4 py-2 text-text-muted">{d.status ?? ''}</td>
                <td className="px-4 py-2">
                  {r.inserted ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                      inséré
                    </span>
                  ) : (
                    <span
                      className="rounded-full bg-warn/15 px-2 py-0.5 text-xs text-warn"
                      title={r.skip_reason ?? undefined}
                    >
                      {r.skip_reason ?? 'ignoré'}
                    </span>
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

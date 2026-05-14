'use client';

import { useEffect, useState } from 'react';
import { formatDate, formatDuration } from '@/lib/utils';
import type { CronInfo } from '@/lib/cron';

type Status = {
  healthy: boolean;
  version?: string;
  latency?: number;
  error?: string;
};

type Config = {
  enabled: boolean;
  target_url: string;
  cron_expression: string;
  last_run_at: string | null;
} | null;

type LastSuccess = {
  started_at: string;
  leads_inserted: number;
  duration_ms: number;
} | null;

export function WorkerStatusCard({
  config,
  cronInfo,
  lastSuccess,
  leadsLast24h,
}: {
  config: Config;
  cronInfo: CronInfo | null;
  lastSuccess: LastSuccess;
  leadsLast24h: number;
}) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = () => {
      fetch('/api/worker-status', { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setStatus(data);
        })
        .catch(() => {
          if (!cancelled) setStatus({ healthy: false, error: 'fetch failed' });
        });
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const cronOK = cronInfo?.valid && config?.enabled;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dot ok={status?.healthy ?? null} />
          <div>
            <div className="font-medium">
              {status === null
                ? 'Vérification du worker…'
                : status.healthy
                  ? 'Worker connecté'
                  : 'Worker injoignable'}
            </div>
            <div className="text-xs text-text-muted">
              {status?.healthy
                ? `v${status.version ?? '?'} · ${status.latency ?? 0} ms`
                : status?.error}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dot ok={config?.enabled ?? null} />
          <div className="text-sm">
            {config?.enabled ? (
              <>
                <div>Scraping actif</div>
                <div className="text-xs text-text-muted">{cronInfo?.human ?? '—'}</div>
              </>
            ) : (
              <div className="text-text-muted">Scraping désactivé</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat
          label="Prochain run"
          value={
            cronOK && cronInfo?.nextRun
              ? formatDate(cronInfo.nextRun)
              : '—'
          }
          subtitle={cronOK ? cronInfo?.nextRunRelative ?? '' : 'scraping désactivé'}
        />
        <Stat
          label="Dernier succès"
          value={lastSuccess ? formatDate(lastSuccess.started_at) : 'jamais'}
          subtitle={
            lastSuccess
              ? `${lastSuccess.leads_inserted} leads · ${formatDuration(lastSuccess.duration_ms)}`
              : ''
          }
        />
        <Stat label="Leads ingérés (24h)" value={String(leadsLast24h)} tone="success" />
        <Stat label="URL cible" value={config?.target_url ? hostnameOf(config.target_url) : '—'} small />
      </div>
    </div>
  );
}

function Dot({ ok }: { ok: boolean | null }) {
  const color =
    ok === null ? 'bg-text-muted/40' : ok ? 'bg-success' : 'bg-danger';
  return <span className={`h-3 w-3 rounded-full ${color}`} aria-hidden />;
}

function Stat({
  label,
  value,
  subtitle,
  tone,
  small,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'success';
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={`mt-1 font-semibold ${small ? 'text-sm' : 'text-base'} ${
          tone === 'success' ? 'text-success' : ''
        }`}
      >
        {value}
      </div>
      {subtitle && <div className="mt-0.5 text-xs text-text-muted">{subtitle}</div>}
    </div>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

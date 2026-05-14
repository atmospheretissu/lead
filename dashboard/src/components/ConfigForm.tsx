'use client';

import { useMemo, useState, useTransition } from 'react';
import { describeCron } from '@/lib/cron';

type Config = {
  target_url: string;
  cron_expression: string;
  enabled: boolean;
  css_selectors: Record<string, string>;
  notes: string | null;
};

type SelectorSpec = {
  key: string;
  label: string;
  hint: string;
  default: string;
};

const SELECTORS: { group: string; specs: SelectorSpec[] }[] = [
  {
    group: 'Login',
    specs: [
      { key: 'startUrl', label: 'URL de démarrage', hint: 'Page qui redirige vers le SSO Adeo', default: 'https://partenaires.leroymerlin.fr/' },
      { key: 'identifierInput', label: 'Champ identifiant', hint: 'Étape 1 : identifiant', default: '#identifierInput' },
      { key: 'identifierSubmit', label: 'Bouton "Suivant"', hint: 'Étape 1 : soumettre identifiant', default: '#my_sign_on_button' },
      { key: 'passwordInput', label: 'Champ mot de passe', hint: 'Étape 2', default: 'input[type="password"]' },
      { key: 'passwordSubmit', label: 'Bouton "Connexion"', hint: 'Étape 2 : soumettre mot de passe', default: '#signOnButton' },
      { key: 'loggedInUrlMatch', label: 'URL post-login (regex)', hint: 'Doit matcher après login', default: 'leads-management' },
    ],
  },
  {
    group: 'Liste des leads',
    specs: [
      { key: 'leadsUrl', label: 'URL de la liste', hint: 'Page principale des leads', default: 'https://partenaires.leroymerlin.fr/leads-management/leads' },
      { key: 'leadCardPrefix', label: 'Préfixe data-testid des cartes', hint: 'Ex: "lead-card-" pour matcher lead-card-123456', default: 'lead-card-' },
    ],
  },
  {
    group: 'Page détail',
    specs: [
      {
        key: 'leadDetailUrlTemplate',
        label: 'Template URL détail',
        hint: 'Utilise {id} comme placeholder',
        default: 'https://partenaires.leroymerlin.fr/leads-management/leads/{id}',
      },
    ],
  },
];

const PRESETS = [
  { label: 'Chaque heure', value: '0 * * * *' },
  { label: 'Toutes les 6h', value: '0 */6 * * *' },
  { label: 'Toutes les 12h', value: '0 */12 * * *' },
  { label: 'Nuit (3h)', value: '0 3 * * *' },
  { label: 'Lundi 9h', value: '0 9 * * 1' },
];

export function ConfigForm({ config }: { config: Config | null }) {
  const [targetUrl, setTargetUrl] = useState(config?.target_url ?? '');
  const [cron, setCron] = useState(config?.cron_expression ?? '0 */6 * * *');
  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [overrides, setOverrides] = useState<Record<string, string>>(config?.css_selectors ?? {});
  const [notes, setNotes] = useState(config?.notes ?? '');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const cronInfo = useMemo(() => describeCron(cron), [cron]);

  function save() {
    setMessage(null);
    startTransition(async () => {
      // Strip out overrides that equal the default — keep config clean
      const filteredOverrides: Record<string, string> = {};
      for (const group of SELECTORS) {
        for (const spec of group.specs) {
          const v = overrides[spec.key];
          if (v !== undefined && v !== '' && v !== spec.default) {
            filteredOverrides[spec.key] = v;
          }
        }
      }
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          target_url: targetUrl,
          cron_expression: cron,
          enabled,
          css_selectors: filteredOverrides,
          notes,
        }),
      });
      if (res.ok) {
        setMessage({ kind: 'ok', text: 'Sauvegardé. Le worker repris la nouvelle config dans < 5 minutes.' });
      } else {
        const body = await res.json().catch(() => ({}));
        setMessage({ kind: 'err', text: `Erreur — ${body.error?.formErrors?.[0] ?? 'voir logs'}` });
      }
    });
  }

  function reset(key: string, def: string) {
    const next = { ...overrides };
    delete next[key];
    setOverrides(next);
    // Force re-render of input value
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`input[data-key="${key}"]`);
      if (el) el.value = def;
    }, 0);
  }

  return (
    <div className="space-y-6">
      {/* Paramètres généraux */}
      <Section title="Paramètres généraux" subtitle="Activation, source et fréquence de scraping">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-2 px-4 py-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="font-medium">Scraping activé</span>
          <span className="ml-auto text-xs text-text-muted">
            {enabled ? 'Le worker exécutera le cron' : 'Aucun run automatique'}
          </span>
        </label>

        <Field label="URL cible" hint="Point d'entrée du portail. Doit déclencher le SSO Adeo.">
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="input"
          />
        </Field>

        <Field
          label="Fréquence (expression cron)"
          hint={`5 champs au format Unix. ${cronInfo.valid ? `→ ${cronInfo.human}` : cronInfo.error}`}
        >
          <div className="space-y-2">
            <input
              type="text"
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              className="input font-mono"
              placeholder="0 */6 * * *"
            />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setCron(p.value)}
                  className={`rounded-md px-2 py-1 text-xs transition ${
                    cron === p.value
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface-2 text-text-muted hover:text-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {cronInfo.valid && cronInfo.nextRun && (
              <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs">
                <span className="text-text-muted">Prochain run :</span>{' '}
                <span className="font-medium">{new Date(cronInfo.nextRun).toLocaleString('fr-FR')}</span>
                <span className="ml-2 text-text-muted">({cronInfo.nextRunRelative})</span>
              </div>
            )}
            {!cronInfo.valid && (
              <div className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
                Expression invalide — {cronInfo.error}
              </div>
            )}
          </div>
        </Field>
      </Section>

      {/* Sélecteurs CSS */}
      <Section
        title="Sélecteurs CSS"
        subtitle="Sélecteurs utilisés par le scraper Playwright. Surcharger uniquement si Leroy Merlin modifie son DOM — sinon laisser les défauts."
      >
        {SELECTORS.map((group) => (
          <div key={group.group}>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              {group.group}
            </div>
            <div className="space-y-2">
              {group.specs.map((spec) => {
                const current = overrides[spec.key] ?? spec.default;
                const isOverridden = overrides[spec.key] !== undefined && overrides[spec.key] !== spec.default;
                return (
                  <div key={spec.key} className="grid grid-cols-[1fr_auto] gap-2 items-start">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="text-sm font-medium">{spec.label}</label>
                        {isOverridden && (
                          <span className="rounded bg-warn/15 px-1.5 py-0.5 text-[10px] uppercase text-warn">
                            override
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        data-key={spec.key}
                        defaultValue={current}
                        onChange={(e) => setOverrides({ ...overrides, [spec.key]: e.target.value })}
                        className="input font-mono text-xs"
                      />
                      <div className="mt-1 text-xs text-text-muted">
                        {spec.hint} · Défaut : <code className="text-text">{spec.default}</code>
                      </div>
                    </div>
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => reset(spec.key, spec.default)}
                        className="mt-7 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-text-muted hover:text-text"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Section>

      {/* Notes */}
      <Section title="Notes" subtitle="Mémo libre — pas utilisé par le worker.">
        <textarea
          value={notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input"
        />
      </Section>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
        {message && (
          <span className={`text-sm ${message.kind === 'ok' ? 'text-success' : 'text-danger'}`}>
            {message.text}
          </span>
        )}
        <button
          onClick={save}
          disabled={pending || !cronInfo.valid}
          className="ml-auto rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Sauvegarde…' : 'Sauvegarder la configuration'}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 14px;
        }
        .input:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
        code { background: var(--surface-2); padding: 1px 4px; border-radius: 3px; font-size: 11px; }
      `}</style>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

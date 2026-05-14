'use client';

import { useMemo, useState, useTransition } from 'react';
import { Save, RotateCcw, Calendar, Clock, Code2 } from 'lucide-react';
import { describeCron } from '@/lib/cron';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ColorChip, type ChipTone } from '@/components/ui/StatusPill';
import { cn } from '@/lib/utils';

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

const SELECTORS: { group: string; tone: ChipTone; icon: typeof Code2; specs: SelectorSpec[] }[] = [
  {
    group: 'Login',
    tone: 'violet',
    icon: Code2,
    specs: [
      { key: 'startUrl', label: 'URL de démarrage', hint: 'Page qui déclenche le SSO Adeo', default: 'https://partenaires.leroymerlin.fr/' },
      { key: 'identifierInput', label: 'Champ identifiant', hint: 'Étape 1 — identifiant', default: '#identifierInput' },
      { key: 'identifierSubmit', label: 'Bouton "Suivant"', hint: 'Étape 1 — soumettre identifiant', default: '#my_sign_on_button' },
      { key: 'passwordInput', label: 'Champ mot de passe', hint: 'Étape 2', default: 'input[type="password"]' },
      { key: 'passwordSubmit', label: 'Bouton "Connexion"', hint: 'Étape 2 — soumettre password', default: '#signOnButton' },
      { key: 'loggedInUrlMatch', label: 'URL post-login (regex)', hint: 'Doit matcher après login', default: 'leads-management' },
    ],
  },
  {
    group: 'Liste des leads',
    tone: 'pink',
    icon: Code2,
    specs: [
      { key: 'leadsUrl', label: 'URL de la liste', hint: 'Page principale Tandem Pro', default: 'https://partenaires.leroymerlin.fr/leads-management/leads' },
      { key: 'leadCardPrefix', label: 'Préfixe data-testid', hint: 'Préfixe des cartes lead', default: 'lead-card-' },
    ],
  },
  {
    group: 'Page détail',
    tone: 'orange',
    icon: Code2,
    specs: [
      {
        key: 'leadDetailUrlTemplate',
        label: 'Template URL détail',
        hint: '{id} sera remplacé par l\'ID du lead',
        default: 'https://partenaires.leroymerlin.fr/leads-management/leads/{id}',
      },
    ],
  },
];

const PRESETS = [
  { label: 'Toutes les 15 min', value: '*/15 * * * *' },
  { label: 'Toutes les 30 min', value: '*/30 * * * *' },
  { label: 'Chaque heure', value: '0 * * * *' },
  { label: 'Toutes les 6h', value: '0 */6 * * *' },
  { label: 'Toutes les 12h', value: '0 */12 * * *' },
  { label: 'Nuit (3h)', value: '0 3 * * *' },
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
        setMessage({ kind: 'ok', text: 'Sauvegardé. Worker rechargé sous 5 min.' });
      } else {
        setMessage({ kind: 'err', text: 'Erreur — voir logs' });
      }
    });
  }

  function reset(key: string, def: string) {
    const next = { ...overrides };
    delete next[key];
    setOverrides(next);
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`input[data-key="${key}"]`);
      if (el) el.value = def;
    }, 0);
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ColorChip tone="emerald" size="sm">
              <Calendar className="h-3.5 w-3.5" strokeWidth={2.2} />
            </ColorChip>
            <div>
              <div className="text-[13.5px] font-semibold">Paramètres généraux</div>
              <div className="text-[11.5px] text-muted">Activation, source et fréquence du scraping</div>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-canvas-2/50 px-4 py-3 transition-colors hover:bg-canvas-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-violet"
            />
            <div className="flex-1">
              <div className="text-[13px] font-medium">Scraping activé</div>
              <div className="text-[11.5px] text-muted">
                {enabled ? 'Le worker exécutera le cron automatiquement' : 'Aucun run automatique'}
              </div>
            </div>
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                enabled ? 'bg-emerald animate-pulse-soft' : 'bg-muted-2',
              )}
            />
          </label>

          <Field
            label="URL cible"
            hint="Point d'entrée du portail. Déclenche le SSO Adeo."
          >
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="input"
            />
          </Field>

          <Field
            label="Fréquence (expression cron)"
            hint={cronInfo.valid ? `→ ${cronInfo.human}` : (cronInfo.error ?? 'expression invalide')}
            hintTone={cronInfo.valid ? undefined : 'err'}
          >
            <div className="space-y-2.5">
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                className="input font-mono text-[12.5px]"
                placeholder="0 */6 * * *"
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setCron(p.value)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors',
                      cron === p.value
                        ? 'bg-violet text-white'
                        : 'bg-canvas-2 text-ink-3 hover:bg-canvas-3',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {cronInfo.valid && cronInfo.nextRun && (
                <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas-2/40 px-3 py-2 text-[12px]">
                  <Clock className="h-3.5 w-3.5 text-violet" />
                  <span className="text-muted">Prochain run :</span>
                  <span className="font-medium tabular-nums">
                    {new Date(cronInfo.nextRun).toLocaleString('fr-FR')}
                  </span>
                  <span className="ml-auto text-muted">({cronInfo.nextRunRelative})</span>
                </div>
              )}
            </div>
          </Field>
        </div>
      </Card>

      {SELECTORS.map((group) => {
        const Icon = group.icon;
        return (
          <Card key={group.group}>
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ColorChip tone={group.tone} size="sm">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ColorChip>
                <div>
                  <div className="text-[13.5px] font-semibold">Sélecteurs CSS — {group.group}</div>
                  <div className="text-[11.5px] text-muted">
                    Surcharger uniquement si le DOM du portail change.
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-line">
              {group.specs.map((spec) => {
                const current = overrides[spec.key] ?? spec.default;
                const isOverridden = overrides[spec.key] !== undefined && overrides[spec.key] !== spec.default;
                return (
                  <div key={spec.key} className="px-5 py-3.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="text-[12.5px] font-medium text-ink-2">{spec.label}</label>
                      {isOverridden && (
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber">
                            override
                          </span>
                          <button
                            type="button"
                            onClick={() => reset(spec.key, spec.default)}
                            className="inline-flex items-center gap-1 text-[11.5px] text-violet-strong hover:underline"
                          >
                            <RotateCcw className="h-3 w-3" /> Reset
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      data-key={spec.key}
                      defaultValue={current}
                      onChange={(e) =>
                        setOverrides({ ...overrides, [spec.key]: e.target.value })
                      }
                      className="input font-mono text-[12px]"
                    />
                    <div className="mt-1 text-[11.5px] text-muted">
                      {spec.hint} · Défaut : <code className="font-mono text-[11px] text-ink-3">{spec.default}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <Card>
        <div className="border-b border-line px-5 py-4">
          <div className="text-[13.5px] font-semibold">Notes</div>
          <div className="text-[11.5px] text-muted">Mémo libre — pas utilisé par le worker.</div>
        </div>
        <div className="px-5 py-4">
          <textarea
            value={notes ?? ''}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input"
          />
        </div>
      </Card>

      <div className="sticky bottom-4 z-10">
        <Card className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="text-[12.5px]">
            {message ? (
              <span className={message.kind === 'ok' ? 'text-emerald' : 'text-red'}>
                {message.text}
              </span>
            ) : (
              <span className="text-muted">Modifications non sauvegardées si tu changes des champs.</span>
            )}
          </div>
          <Button
            variant="accent"
            size="lg"
            onClick={save}
            disabled={pending || !cronInfo.valid}
          >
            <Save className="h-3.5 w-3.5" />
            {pending ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </Card>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: #fff;
          border: 1px solid var(--color-line);
          color: var(--color-ink);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-violet);
          box-shadow: 0 0 0 3px var(--color-violet-soft);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  hintTone,
  children,
}: {
  label: string;
  hint?: string;
  hintTone?: 'err';
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-ink-2">{label}</label>
      {children}
      {hint && (
        <div className={cn('mt-1 text-[11.5px]', hintTone === 'err' ? 'text-red' : 'text-muted')}>
          {hint}
        </div>
      )}
    </div>
  );
}

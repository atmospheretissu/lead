# Atmolead

Extension d'Atmo qui scrape les leads du portail partenaires Leroy Merlin
(`partenaires.leroymerlin.fr`) et les écrit directement dans les tables
existantes d'Atmo (`clients` + `lm_leads`) via le **même** Supabase.

## Architecture

Deux services Railway distincts, un seul Supabase partagé avec Atmo.

```
┌─────────────────┐                 ┌────────────────────┐
│  Atmolead       │ ◄── trigger ─── │  Atmolead          │
│  worker         │                 │  dashboard         │
│  (Playwright)   │ ─── leads ───►  │  (Next.js 16)      │
└────────┬────────┘                 └──────────┬─────────┘
         │                                     │
         └──────────────► Supabase ◄───────────┘
                  (shared with Atmo)
```

- **`worker/`** — Node + Playwright. Tourne en permanence (Railway `ALWAYS`
  restart). Tâches : (a) cron interne piloté par `atmolead_config.cron_expression`,
  (b) poller la queue `atmolead_jobs`, (c) endpoint HTTP `/trigger` pour les
  déclenchements manuels du dashboard, (d) `/health` pour le healthcheck Railway.

- **`dashboard/`** — Next.js 16 App Router. Trois pages : liste des leads
  (`/`), historique des exécutions (`/executions`), configuration (`/config`).
  Bouton "Déclencher un scrape" qui crée une ligne dans `atmolead_jobs` et notifie
  le worker via son URL interne Railway.

## Tables Supabase

Préfixe `atmolead_` pour l'orchestration. Les leads eux-mêmes vont dans
`lm_leads` + `clients` (channel `leroy_merlin`) — pas de duplication avec Atmo.

| Table | Rôle |
|---|---|
| `atmolead_config` (singleton) | URL cible, cron, on/off, sélecteurs CSS |
| `atmolead_executions` | historique des runs (statut, durée, leads trouvés) |
| `atmolead_jobs` | queue pending → running → done |
| `atmolead_leads_raw` | audit du DOM scrapé avant normalisation |

Voir [supabase/migrations/20260514120000_atmolead_init.sql](supabase/migrations/20260514120000_atmolead_init.sql).

## Premier déploiement

### 1. Appliquer la migration

```bash
cd /Users/davidmanscour/Documents/Code/Atmo/app
# Copier le fichier de migration Atmolead dans le dossier migrations d'Atmo
cp ../../Atmolead/supabase/migrations/20260514120000_atmolead_init.sql supabase/migrations/
npm run db:apply
```

Ou applique directement via `psql` / dashboard Supabase.

### 2. Worker — variables d'env Railway

```
SUPABASE_URL                  = https://mryvgigwmbuusbxzgoym.supabase.co
SUPABASE_SERVICE_ROLE_KEY     = <service role key d'Atmo>
LM_PARTNER_LOGIN              = T2851858
LM_PARTNER_PASSWORD           = <change-this-password>
PORT                          = 3000
WORKER_TRIGGER_SECRET         = <génère 32 bytes aléatoires>
JOB_POLL_INTERVAL_MS          = 15000
```

Healthcheck : `GET /health`. Build : Dockerfile (image Playwright officielle).

### 3. Dashboard — variables d'env Railway

```
NEXT_PUBLIC_SUPABASE_URL          = https://mryvgigwmbuusbxzgoym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = <anon key d'Atmo>
SUPABASE_SERVICE_ROLE_KEY         = <même que worker>
ATMOLEAD_WORKER_URL               = http://atmolead-worker.railway.internal:3000
ATMOLEAD_WORKER_TRIGGER_SECRET    = <même que WORKER_TRIGGER_SECRET>
```

### 4. Calibrer les sélecteurs CSS

Le scraper utilise des sélecteurs par défaut qui sont des **placeholders** —
le portail LM partenaires n'est pas public, donc je n'ai pas pu inspecter le
vrai DOM. Marche à suivre :

1. Ouvre `partenaires.leroymerlin.fr` dans Chrome → DevTools.
2. Note les sélecteurs réels (champ login, bouton submit, liste des leads…).
3. Va sur `/config` du dashboard.
4. Colle un JSON du type :
   ```json
   {
     "loginField": "input#username",
     "passwordField": "input#password",
     "loginSubmit": "button.btn-primary",
     "loggedInIndicator": ".user-menu",
     "leadsUrl": "https://partenaires.leroymerlin.fr/.../leads",
     "leadRow": "tr.lead-row",
     "refSelector": "td.ref",
     "nameSelector": "td.customer-name",
     ...
   }
   ```
5. Sauve, puis "Déclencher un scrape" depuis la page leads.
6. Va dans `/executions` pour voir si ça a réussi, et dans Supabase
   `atmolead_leads_raw` pour vérifier le DOM extrait.

## Développement local

```bash
# Worker
cd worker
cp .env.example .env.local   # remplir les valeurs
npm install
npx playwright install chromium
npm run dev

# Dashboard (autre terminal)
cd dashboard
cp .env.example .env.local
npm install
npm run dev -- -p 3001
```

Test d'un scrape one-shot sans démarrer le worker complet :
```bash
cd worker
npm run scrape:once
```

## Sécurité

- Les credentials LM ne sont **jamais** stockés dans Supabase ni en mémoire IA.
  Ils vivent uniquement dans les env vars Railway du worker.
- Le service_role key bypasse RLS — uniquement côté serveur.
- L'endpoint worker `/trigger` exige un `Bearer <WORKER_TRIGGER_SECRET>` si la
  variable est définie. Sinon, accessible librement sur le réseau interne Railway.
- Les exécutions et raw leads sont auditables : `atmolead_executions` garde
  durée/erreurs, `atmolead_leads_raw` garde le DOM brut avec le `skip_reason`.

## Roadmap court terme

- Auth dashboard (réutiliser le système Supabase Auth d'Atmo)
- Détail d'une exécution (drill-down vers les raw leads)
- Filtres + recherche sur la liste de leads
- Alertes (email/Slack) si N exécutions consécutives échouent
- Rotation de session Playwright (storageState) pour éviter de se relogger à chaque run

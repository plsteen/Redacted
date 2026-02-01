## Redacted – sosialt etterforskningsspill

Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase (Auth, Realtime, Postgres) + Stripe Checkout.

### Kom i gang (≤15 min)

1. **Krav**: Node 18+ (bruker v25), npm
2. **Installer pakker**: `npm install`
3. **Miljøvariabler**: kopier `.env.example` til `.env.local` og fyll inn:
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - App: `NEXT_PUBLIC_BASE_URL`
   - Email (valgfritt): `RESEND_API_KEY`
4. **Database**: kjør migrasjoner i rekkefølge (se under)
5. **Dev-server**: `npm run dev` og åpne http://localhost:3000
6. **Tester**: `npm test` (51 tester med Vitest)

### NPM Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint (0 errors, 4 warnings)
npm test         # Vitest (51 tester)
```

### Database Migrasjoner

Kjør i rekkefølge mot Supabase:

```bash
psql $DATABASE_URL -f scripts/migrations/001_init.sql
psql $DATABASE_URL -f scripts/migrations/002_feedback.sql
psql $DATABASE_URL -f scripts/migrations/003_payments.sql
psql $DATABASE_URL -f scripts/migrations/004_access_codes.sql
psql $DATABASE_URL -f scripts/migrations/005_user_activity_log.sql
```

Seed demo-case:

```bash
psql $DATABASE_URL -f scripts/seed_silent_harbour.sql
```

### Stripe Webhook Setup

1. Installer Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Logg inn: `stripe login`
3. Forward webhooks lokalt: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Kopier webhook secret til `.env.local` som `STRIPE_WEBHOOK_SECRET`

### Prosjektstruktur

```
app/
├── play/           # Spilleropplevelse med hint, progresjon, bevis
├── board/          # TV-board med pinned evidence-grid
├── catalog/        # Browse og kjøp cases
├── library/        # Brukerens kjøpte cases
├── admin/          # Admin dashboards (analytics, feedback, purchases, codes, logs)
├── api/
│   ├── auth/       # Magic link, OAuth, callback, logout
│   ├── stripe/     # Checkout & webhook handlers
│   ├── content/    # Gated content delivery
│   └── admin/      # Admin API routes
components/
├── Board/          # Corkboard, BoardGrid
├── Evidence/       # EvidenceItem, EvidenceList, RevelationModal, TranscriptModal
├── Shared/         # TopBar, Footer, ProgressHUD, Loading states
├── Tasks/          # TaskView
lib/
├── supabaseClient.ts  # Browser Supabase client
├── supabaseAdmin.ts   # Server Supabase client (service role)
├── stripe.ts          # Stripe client
├── realtime.ts        # Supabase Realtime helpers
├── scoring.ts         # Score calculation
├── validation.ts      # Answer validation
├── i18n/              # Internationalization (EN/NO)
├── hooks/             # Custom React hooks
content/cases/         # Case data (JSON) - Silent Harbour (NO/EN)
scripts/migrations/    # SQL migrations
__tests__/             # Vitest tests (51 tester)
middleware.ts          # Rate limiting & security headers
```

### Sikkerhet

- **Rate limiting**: API-ruter beskyttet med per-IP rate limits
  - Auth: 10 req/min
  - Stripe: 30 req/min
  - Admin: 100 req/min
  - Generelt API: 60 req/min
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, etc.
- **Row Level Security**: Supabase RLS på alle tabeller

### Brukerflyt

1. **Host**: Logger inn via magic link → kjøper case via Stripe → starter session fra library
2. **Co-player**: Får sesjonskode fra host → joiner gratis via homepage
3. **Gameplay**: Løs oppgaver sammen i sanntid, få avsløringer underveis

### Admin Dashboards

- `/admin/analytics?auth=redacted2026` - Spillstatistikk
- `/admin/feedback?auth=redacted2026` - Bruker-feedback
- `/admin/purchases?auth=redacted2026` - Kjøpsoversikt med refund
- `/admin/codes?auth=redacted2026` - Tilgangskoder
- `/admin/logs?auth=redacted2026` - Feillogg
- `/admin/activity?auth=redacted2026` - Brukeraktivitet

### Kjente begrensninger

- Content leveres fra filsystem (kan flyttes til Supabase Storage)
- Kun én demo-case (Silent Harbour) i katalogen

### Neste steg
- Legg til flere cases
- Implementer signerte URL-er for media fra Supabase Storage
- Legg til subscription-modell for gjentatte spillere


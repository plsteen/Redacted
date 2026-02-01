# REDACTED - Nordic Noir Mystery Game

## Project Overview
A real-time multiplayer mystery investigation game built with Next.js 16, Supabase, and Stripe.

## Tech Stack
- **Frontend**: Next.js 16.1.5 (App Router, Turbopack), TypeScript 5, Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Realtime, RLS)
- **Payments**: Stripe Checkout + Webhooks
- **Testing**: Vitest (51 tests)
- **i18n**: Custom implementation (EN/NO)

## Key Features
- Magic link & OAuth authentication
- Stripe payment integration with refunds
- Real-time multiplayer via Supabase Realtime
- Content gating (purchased vs session-based access)
- Rate limiting & security headers (middleware.ts)
- Admin dashboards (analytics, feedback, purchases, codes, logs, activity)

## Project Structure
```
app/
├── api/
│   ├── auth/       # Magic link, OAuth, callback, logout, me, signup
│   ├── stripe/     # Checkout & webhook handlers
│   ├── content/    # Protected content delivery
│   ├── admin/      # Admin APIs (purchases, refunds, codes, logs, activity)
│   ├── catalog/    # Case catalog
│   ├── library/    # User's purchased cases
│   └── redeem/     # Access code redemption
├── play/           # Main gameplay experience
├── board/          # TV-board with pinned evidence
├── catalog/        # Browse and purchase cases
├── library/        # User's purchased cases
├── admin/          # Admin dashboards
components/
├── Board/          # Corkboard, BoardGrid
├── Evidence/       # EvidenceItem, EvidenceList, Modals
├── Shared/         # TopBar, Footer, ProgressHUD, Loading states
├── Tasks/          # TaskView
lib/
├── supabaseClient.ts   # Browser client
├── supabaseAdmin.ts    # Server client (service role)
├── stripe.ts           # Stripe client
├── realtime.ts         # Realtime helpers
├── scoring.ts          # Score calculation
├── validation.ts       # Answer validation
├── i18n/               # Internationalization
├── hooks/              # Custom hooks (useLocale)
middleware.ts           # Rate limiting & security headers
__tests__/              # 51 Vitest tests
```

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_BASE_URL=
RESEND_API_KEY=          # Optional: for email notifications
```

## Development Commands
```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint (0 errors)
npm test         # Vitest (51 tests)
```

## Database Migrations
Run in order:
1. `scripts/migrations/001_init.sql` - Core tables
2. `scripts/migrations/002_feedback.sql` - Analytics tables
3. `scripts/migrations/003_payments.sql` - Payment/auth extensions
4. `scripts/migrations/004_access_codes.sql` - Access codes
5. `scripts/migrations/005_user_activity_log.sql` - Activity logging

## Security
- Rate limiting per route type (auth: 10/min, stripe: 30/min, admin: 100/min, api: 60/min)
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
- Row Level Security on all Supabase tables

## Admin Access
- `/admin/analytics?auth=redacted2026`
- `/admin/feedback?auth=redacted2026`
- `/admin/purchases?auth=redacted2026`
- `/admin/codes?auth=redacted2026`
- `/admin/logs?auth=redacted2026`
- `/admin/activity?auth=redacted2026`

## Code Style
- TypeScript strict mode
- ESLint with React hooks rules
- Prefer `useLocale` hook over manual cookie reading
- Use typed interfaces for Supabase queries
- Dynamic imports for heavy components (Corkboard, Modals)



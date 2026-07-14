# Naidile Naturals

E-commerce site for Naidile Naturals — SvelteKit + Supabase (Auth, Postgres, Storage, Realtime).

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase project URL + anon key.
2. Install deps: `npm install`
3. Apply the schema to your Supabase project: run `supabase/migrations/*.sql` then `supabase/seed.sql`
   (via the Supabase SQL editor, `supabase db push`, or the Supabase MCP server).
4. `npm run dev`

## Structure

- `src/routes/(shop)` — public storefront (home, about, contact, category, product, cart, checkout, account)
- `src/routes/(auth)` — login/signup/password reset
- `src/routes/admin` — admin dashboard (products, categories, orders, settings) — requires `profiles.role = 'admin'`
- `src/lib/components` — shared UI; `src/lib/stores` — cart/toast; `src/lib/supabase` — DB client + types
- `supabase/migrations` — schema + RLS; `supabase/seed.sql` — starter catalog data

## Commands

- `npm run dev` — dev server
- `npm run build` / `npm run preview` — production build
- `npm run check` — typecheck
- `npm run lint` / `npm run format` — prettier + eslint

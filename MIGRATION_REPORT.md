# ENRM Vite-to-Next.js Migration Report

## Summary

This migration stage adds Next.js App Router and an OpenNext Cloudflare Worker build while preserving the current business model, catalogue identifiers, database, and existing order RPC. It does not deploy or modify hosted Supabase. The migration is not yet a complete React rewrite: portions of the legacy storefront and the admin remain as generated HTML driven by imperative DOM modules. See the “Remaining migration work” section before planning a production cutover.

## Architecture decisions

- **Next.js App Router:** public routes now have server-rendered entry points and Metadata API support.
- **OpenNext on Cloudflare Workers:** produces a Worker artifact from the real Next.js build. Cloudflare currently promotes vinext as its default recommendation, but vinext is a separate reimplementation of Next APIs. OpenNext was selected here to keep the app on the actual Next.js framework and preserve feature semantics. This choice still requires real Worker runtime and staging checks.
- **Webpack for production build:** OpenNext’s default build command is `npm run build`. Since this package’s `build` script invokes OpenNext, leaving that default would recurse. `open-next.config.ts` explicitly runs `npx next build --webpack` inside adapter builds.
- **Supabase browser access:** only public URL and anon key are used. Existing PostgreSQL RPC functions and RLS remain the trust boundary. No service-role key or new server-side duplicate order logic is introduced.
- **No online payment:** checkout creates an order request using `place_enrm_order`; ENRM contacts the customer and manually updates the request status.
- **Product URLs:** slugs include a normalized product description plus the existing product ID, avoiding collisions without changing database IDs.

## Migration inventory

| Existing feature / source                                                                  | Next.js destination                                    | Change made                                                                                                                                        | Risk / limit                                                                                                                        | Verification                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite HTML entries and `src/layout/` shared markup                                          | `src/app/`, route layouts, `StorefrontChrome`          | App Router routes and shared shell added; legacy body HTML is generated into a compatibility module                                                | Original content is still HTML; not yet React-native and the old Vite files remain                                                  | Production route table and Worker dry-run                                                                                                                                                                        |
| `src/storefront/main.ts`, catalogue HTML                                                   | `/catalogue`                                           | Server filters using URL search params, categories and catalogue rows; server-rendered cards; legacy script retains remaining interaction handlers | Interactive filtering/pagination and URL transitions still depend on old DOM code and need browser QA                               | Existing jsdom filtering/cart tests; typecheck/build                                                                                                                                                             |
| `product.html?id=...`, `src/storefront/routing.ts`                                         | `/produits/[slug]`, `/product.html` redirect/resolver  | Stable SEO slug with immutable ID suffix; legacy URLs map to the new route                                                                         | Need verify all historical URLs and exact variant transitions in browser                                                            | URL helper regression tests and static route build                                                                                                                                                               |
| Product metadata absent from Vite pages                                                    | `generateMetadata`, JSON-LD, `sitemap.ts`, `robots.ts` | Product metadata and schema use live catalogue fields                                                                                              | Search engines and social cards require production domain and real Worker verification                                              | `next build`, inspect rendered HTML on staging                                                                                                                                                                   |
| `src/shared/catalogue.ts` and Supabase RLS                                                 | `src/lib/catalogue.ts`, `src/lib/supabase/`            | Added server and public clients; public queries use anon credentials and no-store reads                                                            | Cloudflare variables must be renamed from `VITE_*` to `NEXT_PUBLIC_*` in the hosting dashboard before deployment                    | Typecheck and Worker bundle; verify with non-production Supabase                                                                                                                                                 |
| `enrm-demo-cart` local storage and checkout RPC                                            | `/panier`, `/commande`, `CartClient`, `CheckoutClient` | React cart/checkout pages; preserves exact IDs, validates stale items, privacy acknowledgment and idempotent request UUID; no payment              | Existing modal cart and new page cart coexist during transition; run browser QA                                                     | Existing cart/variant tests; 11 tests pass                                                                                                                                                                       |
| `src/admin/main.ts`, `src/admin/categories.ts`, `src/app/admin/layout.tsx`, `src/proxy.ts` | `/admin` route and admin layout                        | Admin shell is protected by verified Supabase claims and a live `profiles.role` check; cookie refresh is scoped to `/admin` and `/login`           | Admin remains imperative DOM; customers/analytics derive from order requests; promotions and shared settings have no backend schema | Typecheck and production build passed; Vitest could not initialize under Node 22.12.0 (project minimum is 22.22.2); staging auth/RLS and live-data paths not tested; OpenNext Node Proxy support is experimental |
| Supabase schema migrations and `place_enrm_order`                                          | Existing Supabase project                              | No database migration or data mutation performed                                                                                                   | Production data and schema remain untouched; test next against staging                                                              | No production call made                                                                                                                                                                                          |
| `wrangler.jsonc` static Vite hosting                                                       | OpenNext config and Worker entry/assets                | Worker config now targets `.open-next/worker.js` and `.open-next/assets`                                                                           | Worker build is packaged but has not been run under a local Worker or deployed                                                      | `npm run build`; `wrangler deploy --dry-run`                                                                                                                                                                     |

## Work completed

- Added Next App Router pages for the homepage, catalogue, product detail, informational pages, cart, checkout, admin entry, login redirect, 404, sitemap, and robots.
- Added server-side catalogue/category reads, public product rendering, stable product slugs, metadata, and product/breadcrumb JSON-LD.
- Added page-based cart and checkout with the existing browser cart key, current product prices, disabled submission in unconfigured local mode, privacy acknowledgment, idempotent request UUID, and the existing transactional order RPC.
- Preserved product IDs and all database migrations. No hosted schema/data operations were run.
- Updated Supabase frontend environment variable names to `NEXT_PUBLIC_*` and documented the required Cloudflare environment change.
- Added OpenNext Worker configuration and avoided recursive build invocation through explicit `buildCommand`.
- Kept the existing brand assets, CSS, videos, product catalogue, and database policies.

## Verification results

Executed using Node.js 22.22.2:

- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `vitest run` — passed, 13 tests across 2 files.
- `npm run preview` — OpenNext 1.20.17 production build passed and Wrangler preview started with the local Supabase development environment.
- Local Worker route check — HTTP 200 for `/`, `/catalogue`, `/login`, `/panier`, `/commande`, and a known product URL; unauthenticated `/admin` returned 307 to `/login`; an invalid product slug returned 404.
- `npx wrangler deploy --dry-run` — passed after the adapter update; packaged 287 assets (about 7.4 MiB uncompressed) without deploying.
- `npm audit --omit=dev` — zero production dependency advisories. Full `npm audit` reports three moderate findings in OpenNext's build-time `glob` / `minimatch` dependencies; npm reports no compatible automatic fix.
- GitHub Actions now checks formatting, TypeScript, tests, the OpenNext build, and Wrangler dry-run packaging on Node 22.22.2.
- `git diff --check` — passed.

Not performed: visual browser QA, Supabase staging integration test, DNS/TLS verification, production deployment, Cloudflare dashboard variable changes, or production schema migration. OpenNext still warns that Node.js Proxy support on Cloudflare is experimental.

The OpenNext patch update removed the four high-severity findings from the previous audit. The remaining three moderate findings affect build-time dependencies; npm suggests a breaking downgrade for an automatic fix, so no incompatible downgrade or broad override was applied. Production dependencies have no advisories.

## Remaining migration work before production cutover

1. Replace generated `LegacyPage` markup with React components across public pages and replace the imperative storefront runtime with React state/hooks.
2. Migrate the admin to React routes/components and verify sign-in, session refresh, RLS-denied states, order status transitions, product/category edits, image upload, and stock behavior in a staging Supabase project.
3. Confirm the exact product/variant URL resolution and verify homepage video, motion, responsive layout, filters, pagination, cart persistence, and accessible forms in a browser.
4. Use staging Supabase credentials and a test order to confirm the current RPC shape, idempotency, stock rollback, and admin status-history behavior.
5. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in Cloudflare’s build environment. Only the anon key is public; never add a service-role key.
6. Confirm Cloudflare Worker runtime behavior and custom-domain routing in preview/staging, then handle production deployment as a separate release.

The original `Cahier_des_Charges_ENRM_Designer_Developpeur.docx` was not present in this repository, so the migration followed the supplied brief and the actual source/migrations rather than treating unavailable specification details as implemented behavior.

# ENRM Vite-to-Next.js Migration Report

## Summary

The repository now uses Next.js App Router and an OpenNext Cloudflare Worker build while preserving the current business model, catalogue identifiers, database, and existing order RPC. The public storefront and shared controls are React-rendered; the admin shell/navigation and orders, products, inventory, and customers tables are also React-rendered. Categories and overview/analytics/promotions/settings remain on the imperative renderer, with editors and data workflows still split across both implementations. No production deployment or hosted Supabase changes have been made. See “Remaining migration work” before planning a production cutover.

## Architecture decisions

- **Next.js App Router:** public routes now have server-rendered entry points and Metadata API support.
- **OpenNext on Cloudflare Workers:** produces a Worker artifact from the real Next.js build. Cloudflare currently promotes vinext as its default recommendation, but vinext is a separate reimplementation of Next APIs. OpenNext was selected here to keep the app on the actual Next.js framework and preserve feature semantics. This choice still requires real Worker runtime and staging checks.
- **Webpack for production build:** OpenNext’s default build command is `npm run build`. Since this package’s `build` script invokes OpenNext, leaving that default would recurse. `open-next.config.ts` explicitly runs `npx next build --webpack` inside adapter builds.
- **Supabase browser access:** only public URL and anon key are used. Existing PostgreSQL RPC functions and RLS remain the trust boundary. No service-role key or new server-side duplicate order logic is introduced.
- **No online payment:** checkout creates an order request using `place_enrm_order`; ENRM contacts the customer and manually updates the request status.
- **Product URLs:** slugs include a normalized product description plus the existing product ID, avoiding collisions without changing database IDs.

## Migration inventory

| Existing feature / source                                                                       | Next.js destination                                    | Change made                                                                                                                                        | Risk / limit                                                                                                                                                                              | Verification                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Vite HTML entries and `src/layout/` shared markup                                               | `src/app/`, route layouts, `StorefrontChrome`          | App Router routes and shared shell added; legacy body HTML is generated into a compatibility module                                                | Original content is still HTML; not yet React-native and the old Vite files remain                                                                                                        | Production route table and Worker dry-run                                                                                         |
| `src/storefront/main.ts`, catalogue HTML                                                        | `/catalogue`                                           | Server filters using URL search params, categories and catalogue rows; server-rendered cards; legacy script retains remaining interaction handlers | Interactive filtering/pagination and URL transitions still depend on old DOM code and need browser QA                                                                                     | Existing jsdom filtering/cart tests; typecheck/build                                                                              |
| `product.html?id=...`, `src/storefront/routing.ts`                                              | `/produits/[slug]`, `/product.html` redirect/resolver  | Stable SEO slug with immutable ID suffix; legacy URLs map to the new route                                                                         | Need verify all historical URLs and exact variant transitions in browser                                                                                                                  | URL helper regression tests and static route build                                                                                |
| Product metadata absent from Vite pages                                                         | `generateMetadata`, JSON-LD, `sitemap.ts`, `robots.ts` | Product metadata and schema use live catalogue fields                                                                                              | Search engines and social cards require production domain and real Worker verification                                                                                                    | `next build`, inspect rendered HTML on staging                                                                                    |
| `src/shared/catalogue.ts` and Supabase RLS                                                      | `src/lib/catalogue.ts`, `src/lib/supabase/`            | Added server and public clients; public queries use anon credentials and no-store reads                                                            | Cloudflare variables must be renamed from `VITE_*` to `NEXT_PUBLIC_*` in the hosting dashboard before deployment                                                                          | Typecheck and Worker bundle; verify with non-production Supabase                                                                  |
| `enrm-demo-cart` local storage and checkout RPC                                                 | `/panier`, `/commande`, `CartClient`, `CheckoutClient` | React cart/checkout pages; preserves exact IDs, validates stale items, privacy acknowledgment and idempotent request UUID; no payment              | Existing modal cart and new page cart coexist during transition; run browser QA                                                                                                           | Existing cart/variant tests; 11 tests pass                                                                                        |
| `src/admin/main.ts`, `src/admin/categories.ts`, `src/app/admin/layout.tsx`, `src/middleware.ts` | `/admin` route and admin layout                        | Admin layout checks verified claims and the live `profiles.role`; Edge middleware refreshes cookies for `/admin` and `/login`                      | Admin remains imperative DOM; promotions and shared settings have no backend schema; hosted session expiry/logout remain unverified; Next.js 16 deprecates the Edge middleware convention | CI typecheck/tests/build pass; local Worker admitted admin and blocked a demoted user; hosted staging auth/RLS remains unverified |
| Supabase schema migrations and `place_enrm_order`                                               | Existing Supabase project                              | No database migration or data mutation performed                                                                                                   | Production data and schema remain untouched; test next against staging                                                                                                                    | No production call made                                                                                                           |
| `wrangler.jsonc` static Vite hosting                                                            | OpenNext config and Worker entry/assets                | Worker config now targets `.open-next/worker.js` and `.open-next/assets`                                                                           | Worker build is packaged but has not been run under a local Worker or deployed                                                                                                            | `npm run build`; `wrangler deploy --dry-run`                                                                                      |

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
- Replaced the Node.js `proxy.ts` convention with Next.js Edge `middleware.ts`. A temporary local admin session reached `/admin` with 200, then returned 307 to `/login` after the local profile role changed to customer. The temporary user was deleted and a follow-up count confirmed none remained.
- `npx wrangler deploy --dry-run` — passed after the adapter update; packaged 287 assets (about 7.4 MiB uncompressed) without deploying.
- `npm audit --omit=dev` — zero production dependency advisories. Full `npm audit` reports three moderate findings in OpenNext's build-time `glob` / `minimatch` dependencies; npm reports no compatible automatic fix.
- Local Supabase migration history is applied through `20261111000300`; `npm run backend:lint` reports no schema errors.
- Local SQL checks passed for public catalogue RPCs, anonymous denial of admin/order access, unauthenticated denial of admin dashboard/customer/product/stock functions, and rejection of invalid catalogue pagination. The checks made no data changes.
- GitHub Actions now checks formatting, TypeScript, tests, the OpenNext build, and Wrangler dry-run packaging on Node 22.22.2.
- `git diff --check` — passed.

Not performed: visual browser QA, Supabase staging integration test, DNS/TLS verification, production deployment, Cloudflare dashboard variable changes, or production schema migration. The Worker build no longer emits OpenNext's experimental Node.js middleware warning; Next.js 16 does warn that the Edge `middleware.ts` convention is deprecated.

The OpenNext patch update removed the four high-severity findings from the previous audit. The remaining three moderate findings affect build-time dependencies; npm suggests a breaking downgrade for an automatic fix, so no incompatible downgrade or broad override was applied. Production dependencies have no advisories.

## Remaining migration work before production cutover

1. Continue the admin React migration for categories, overview/analytics, promotions/settings decisions, and product/order editors. Keep the server-side auth gate and existing database contracts.
2. Add targeted UI regression coverage for cart updates across tabs, mobile navigation, catalogue filters, gallery selection, and browser video/reduced-motion behavior.
3. Run a complete local route and security smoke audit for canonical slugs, malformed/legacy URLs, access control, session refresh, logout, and order lifecycle.
4. Use a confirmed non-production Supabase project to verify the live RPC shape, idempotency, stock rollback, and admin status-history behavior. Do not run these checks against production.
5. Confirm Cloudflare build variables and custom-domain routing only when preparing a separately approved release; no deployment or paid-resource changes are part of this migration work.

The original `Cahier_des_Charges_ENRM_Designer_Developpeur.docx` was not present in this repository, so the migration followed the supplied brief and the actual source/migrations rather than treating unavailable specification details as implemented behavior.

## Follow-up verification (2026-11-12): local auth and manual order workflow

All checks below used the local Cloudflare Worker preview and the isolated local Supabase stack (`127.0.0.1`); no hosted Supabase or Cloudflare resource was accessed or changed.

- Requests without a session or with a malformed auth cookie were redirected away from `/admin`; `/login` and `/reset-password` returned 200. Auth responses included CSP and `Cache-Control: private, no-store`.
- A temporary local admin session reached `/admin`; a valid but expired local JWT was refreshed and admitted. A customer session was redirected to `/login?reason=admin`. After sign-out, `/admin` redirected to `/login`. All temporary auth users were deleted.
- The anonymous `place_enrm_order` RPC accepted a disposable local product and created one order with the server-calculated total. Reusing the same request UUID with a different payload returned the original order and did not decrement stock again. The initial status was `À confirmer`; there is no payment-status field. The disposable category, product, order, and items were removed and verified absent.
- With a temporary local admin account, the order update RPC persisted a transition to `En préparation`, then cancellation, tracking number, and internal note. Cancellation restored the two sold units exactly once; an attempt to reactivate the cancelled order was rejected. The temporary account and all order/product fixtures were removed and verified absent.
- Next.js 16 local upgrade guidance says Edge Middleware must remain on the `middleware.ts` convention when Edge runtime is required because `proxy.ts` uses Node.js and does not support Edge. The deprecation notice is therefore retained deliberately rather than changing the runtime and risking Cloudflare Worker compatibility.

These checks validate local auth and order data behavior, not the rendered checkout/admin browser experience or hosted staging configuration. Browser QA, hosted Supabase auth/RLS/recovery checks, production environment configuration, SEO/image fixes, and any production release remain separate work. No deployment was performed.

## Follow-up verification (2026-11-12): checkout and admin browser flow

- In the local Worker browser preview, the catalogue search found the selected reference, Add to Cart updated the cart badge, and `/commande` rendered the delivery form and manual-contact/no-payment summary.
- The browser prevented submission while the required privacy acknowledgement was unchecked. After it was checked, the local request succeeded and showed a reference number, MAD subtotal, and the confirmation that no payment was taken.
- A temporary local admin signed in through `/login`. Overview showed the order and the full admin navigation, including Orders. The Orders list and detail view showed customer contact, delivery destination, item, subtotal, status history, tracking, and internal note. Updating status/tracking/note succeeded in the UI; cancellation appeared in the list and restored stock.
- Browser QA exposed that the Orders route showed “Données indisponibles” while its first request was still pending. Added a dedicated loading state, then rebuilt and retested the route from Overview using a fresh local admin; Orders loaded normally. Failed requests still use the unavailable-data state.
- Local checkout intentionally resolves cart items from the bundled fallback catalogue on localhost, so a disposable database-only product appeared unavailable. The browser test used a fallback catalogue product with its local stock temporarily set to 10, then restored it to 0.
- Removed the browser-test order, product, category, and admin account; restored the touched catalogue product stock to its original zero. A local query verified no temporary order/product/category remained and stock was restored. The local Worker preview was stopped.

No hosted project or production deployment was changed. This browser pass does not cover cross-browser behavior or hosted staging.

## Follow-up implementation (2026-11-12): SEO metadata and media URLs

- Added shared metadata helpers for canonical URLs, page-specific Open Graph/Twitter previews, and a default social image. Public routes now provide their own titles, descriptions, and canonicals.
- Product pages use the actual product image in social metadata and structured data. Relative asset URLs and absolute HTTPS Supabase Storage URLs are both resolved safely for display; unsafe schemes, protocol-relative URLs, and traversal paths are rejected.
- Indexing is opt-in only when `NEXT_PUBLIC_SITE_URL` is HTTPS on `enrm.ma` or `www.enrm.ma`. The default/local and preview builds remain `noindex`; `robots.txt` allows crawlers to fetch pages and observe their `noindex` directive.
- Sitemap URLs now use the normalized site origin. Added tests for URL handling and the production indexing gate; updated one existing storefront assertion for normalized image paths.
- Local checks: `npm run typecheck`, `npm test` (26 tests across 3 files), `npm run format:check`, and `npm run build` all passed. The build emitted existing Next.js middleware-convention and Node `punycode` deprecation warnings; output was generated locally only.

No hosted environment variables, DNS, Supabase project, Cloudflare resources, or production deployment were changed. Production indexing requires `NEXT_PUBLIC_SITE_URL=https://enrm.ma` in the deployment build environment; this was not configured or verified here.

## Follow-up implementation (2026-11-12): first public React page

- Migrated `/a-propos` from generated legacy HTML injection to a native React page, retaining the same content, CSS classes, image alternative text, and route metadata. Added explicit image dimensions and a root-relative asset URL.
- Validation after the change: `npm run typecheck`, `npm test` (26 tests), `npm run format:check`, and `npm run build` all passed.
- Remaining storefront migration includes the other static information pages and the more interactive homepage, catalogue, advice, and contact flows. No hosting or deployment changes were made.

## Follow-up implementation (2026-11-12): service and legal pages

- Migrated `/livraison`, `/retours`, `/confidentialite`, and `/credits` from generated legacy HTML to native React pages. Preserved their French copy, links, and page metadata; external credit links retain safe new-tab attributes.
- Validation: `npm run typecheck`, `npm test` (26 tests), `npm run format:check`, and `npm run build` all passed. The build only created local artifacts.
- At the time of this entry, the static page migration was partly complete; subsequent implementation entries below record the completion of the public React migration.

## Follow-up implementation (2026-11-12): advice and contact pages

- Migrated `/conseil` and `/contact` to native React pages. The advice page keeps its existing `data-advice` trigger, which continues to open the current local-only advice dialog; no contact data is submitted.
- Preserved existing French content, metadata, root-relative image asset, and route links.
- Validation: typecheck, all 26 tests, formatting, and the OpenNext Cloudflare build passed. No hosted service or deployment was touched.

## Follow-up implementation (2026-11-12): React homepage

- Replaced the homepage's generated legacy HTML with native React markup, including its product cards/rails, brand marquee, videos, and editorial sections. The server now renders the product rails; the legacy script no longer replaces those nodes and remains only for shared cart/video/motion behavior.
- Kept the existing product bootstrap for cart behavior and legacy product hash redirects, and corrected the homepage filter links to use valid query separators.
- Validation: `npm run typecheck`, `npm test` (26 tests), `npm run format:check`, `npm run build`, and `git diff --check` passed. The build emitted the existing Next middleware and Node `punycode` deprecation warnings. No deployment or hosted setting was changed.
- The catalogue listing and product view still use legacy rendering/runtime code and remain the next major storefront migration items.

## Follow-up implementation (2026-11-12): React catalogue listing

- Replaced generated legacy HTML for `/catalogue` with native React controls and product cards. Category, brand, range, viscosity, volume, search, sort, empty state, and page navigation are rendered from the server query results; filter submissions use a standard GET form and preserve URL state.
- Extracted a reusable React `ProductCard` for homepage and catalogue listings. Kept the minimal catalogue product bootstrap for existing cart add/open behavior and the shared mobile filter toggle.
- Validation: `npm run typecheck`, `npm test` (26 tests), `npm run format:check`, `npm run build`, and `git diff --check` passed. Local Worker HTTP smoke checks returned 200 for `/catalogue` and a filtered page-two URL; both rendered the filter form, grid, and pagination. The local Worker preview was stopped afterward.
- Product detail rendering and the shared imperative storefront runtime remain. No hosted services, Cloudflare configuration, or deployment were changed.

## Follow-up implementation (2026-11-12): React product detail

- Replaced generated legacy product markup with native React detail, variant links, specifications, related product cards, and server-rendered Product/Breadcrumb JSON-LD. Variant selection now navigates to each variant's canonical URL. Product image sources are resolved safely; catalogue source links are restricted to HTTP(S).
- The shared runtime now supports the detail quantity control and gallery face buttons without replacing the React route. Legacy `/product.html` still uses its compatibility renderer and redirects to the canonical slug.
- Validation: typecheck, all 26 tests, formatting, OpenNext build, and `git diff --check` passed. Local Worker HTTP checks confirmed a product page returns 200 with add/quantity controls and JSON-LD; an alternate product label redirects 308 to the canonical slug; `/product.html?id=...` also redirects. Preview stopped after checks.
- The main public storefront pages are now React-rendered. The imperative script remains for shared cart, menu, gallery, and some legacy compatibility behavior. No hosted setting or production deployment was touched.

## Follow-up cleanup (2026-11-12): obsolete public HTML files

- Removed the old root-level public pages (`index.html`, catalogue/product, advice/contact, and informational pages) after confirming the Next.js routes replace their rendering. Kept `admin.html` because the current admin shell generator still reads it.
- Preserved all old public `.html` URLs through the existing permanent redirect rules, including `/product.html?id=...`; local Worker checks confirmed all 11 sampled URLs return HTTP 308 to the corresponding Next.js route.
- Moved the old catalogue/product markup and shared fragments into `tests/fixtures/` for the remaining compatibility tests. Limited `scripts/generate-legacy-pages.mjs` and `src/generated/legacy-pages.ts` to the admin shell; deleted the now-unused public legacy renderer.
- Validation: typecheck, all 26 tests, formatting, Cloudflare build, `git diff --check`, and local redirect checks passed. Only `admin.html` remains at the repository root. No deployment or hosted settings changed.

## Follow-up implementation (2026-11-12): React storefront runtime and admin shell cleanup

- Centralized cart state in a React provider used by product cards, product detail, cart count, cart page, and checkout. Product add buttons and product image-face selection are now client components.
- Replaced legacy DOM handlers for mobile navigation, catalogue filter visibility, product rails, and home videos with React event handlers/effects. Added local-only feedback for the advice form so it no longer depends on the removed dialog runtime.
- Replaced the generated admin shell with JSX in `src/components/admin/AdminWorkspace.tsx` while preserving the `/admin` server-side authorization boundary and the current admin feature behavior. Admin navigation now renders in React from state events emitted by the existing backend workflow. The remaining individual feature screens, editors, and data-action handlers still use imperative code in `src/admin/main.ts` and `src/admin/views.ts`; their full React migration is not complete.
- Removed `admin.html`, the generated legacy page module/generator, and the shared imperative public storefront runtime. Kept static HTML only as fixtures under `tests/fixtures/`. Preserved the `/admin.html` permanent redirect for old bookmarks.
- Updated build/check commands and current-state documentation. `format` commands no longer expect root HTML pages.
- Validation at this entry: `npm run typecheck` passed. The test suite later passed with 29 tests in 4 files under the supported Node runtime. The default `/usr/local/bin/node` is v22.12.0, below the repo's declared `>=22.22.2`; Vitest's transitive Undici requires newer Node APIs, so run project commands with the installed Homebrew Node 22.23.3. The OpenNext build/package and formatting checks have since passed. React interaction tests (including the admin navigation boundary) and local HTTP route/security checks have also passed. Hosted staging verification remains outstanding. No production service or paid resource was changed.

## Follow-up implementation (2026-11-12): React admin orders screen

- Migrated the admin orders list to `AdminOrdersPanel`, including status badges, customer summaries, totals, paging, loading/error states, export, and demo-only order creation. Existing authenticated order editing/status updates and the database RPC remain the authority for mutations.
- Kept the server-side `/admin` role gate. Other admin screens remain on the existing imperative renderer; the admin feature migration is still partial.
- Updated the admin workflow regression to mount the real JSX shell and React orders list. It still exercises product creation, order creation, and stock deduction using local demo data.

## Final local verification update (2026-11-12)

- `PATH=/opt/homebrew/opt/node@22/bin:$PATH npm run format:check`, `npm run typecheck`, and `npm test` passed. Vitest ran 31 tests across 4 files, including the React admin order screen workflow.
- `npm run build` and `npm run check:build` passed; the Worker package includes all 210 catalogue rows and their public media. `npx wrangler deploy --dry-run` packaged about 6.97 MiB and exited without publishing.
- Read-only local HTTP smoke checks: public routes returned 200; `/admin` redirected unauthenticated access to `/login`; `/admin.html` and old public HTML URLs redirected; a known product route returned 200 with JSON-LD; a wrong label for a valid ID redirected to canonical; unknown/invalid product IDs returned 404; `/product.html?id=...` redirected to canonical.
- A browser opened the local storefront and exposed all expected React-rendered product cards and controls. React jsdom tests verified cart persistence/count, mobile menu state, gallery selection, filter panel state, local-only advice feedback, admin navigation, and the admin order workflow.
- This does not complete admin feature migration or hosted staging verification. No production deployment, production database mutation, or paid service change occurred.

## Follow-up implementation (2026-11-12): React admin data tables and project structure audit

- Migrated the admin products, inventory, and customers tables to React components alongside the existing React orders table. They receive state from the current admin coordinator; existing edits, stock updates, order actions, Supabase RPCs, and RLS policies remain the mutation/security path.
- Updated the admin workflow regression to mount the JSX shell and assert the React-rendered routes. Removed the former HTML shell fixture; there are no physical `.html` source entry pages. Legacy `.html` paths are compatibility redirects, including the TypeScript route handler at `/product.html`.
- Added `PROJECT_STRUCTURE_AUDIT.md` covering source tree, route map, HTML history, slugs, admin rendering split, security boundary, and production readiness limits. Updated README and project description to match current implementation.
- Slug review confirms stable product IDs are part of URLs, only published products resolve, and a valid product ID with a noncanonical description redirects to the canonical product path. Category rows are dynamically loaded and admin-created categories do not require a code change; parent/child editing is not exposed in the current UI.
- Resolved prior audit concern on uploaded Storage URLs: `resolveMediaUrl` preserves safe HTTPS URLs and is used by product detail metadata/rendering and cart; local paths are normalized safely. The current admin product preview is separate and should be checked during future editor migration.
- Remaining imperatively rendered admin areas are category management and overview/analytics/promotions/settings. Editors and some data workflows remain in `src/admin/main.ts`; this is a mixed migration, not a fully React-native admin.
- Local verification and any outstanding commands are recorded in the final status below. No hosted Supabase, Cloudflare dashboard, DNS, production data, or deployment was changed.

# ENRM Admin — Complete Functional & Technical Audit

**Review date:** 2026-11-10 (remediation update)
**Project:** `/Users/othmanemakroum23/Desktop/projects/enrm`
**Branch:** `fix/nextjs-migration`
**Target:** current local working tree, including uncommitted Next.js migration and admin changes
**Decision:** **The core connected admin is implemented, but several data-integrity, slug, failure-state, and release-verification issues remain. Promotions and shared settings are not implemented as live features.**

This report covers all admin areas, authentication, data flows, category/product URLs, connected versus demo behavior, scaling, and feature gaps. The remediation log records local implementation changes; it does not imply hosted deployment or production acceptance.

## 1. Executive summary

The intended operating model is present: shoppers submit guest order requests with a phone number; they do not create accounts or pay online. An administrator reviews the request, contacts the customer, and updates its status. The database stores the request and item snapshot, and applies stock changes transactionally. Admin access is protected at the Next.js route and again at the database layer with Supabase RLS and an admin-only order update function.

Adding categories is supported through the connected admin. Category rows are stored in Supabase and products reference their category by ID, so adding a category does not require a code change. Category slugs are generated from names and used by the catalogue filter. Product detail URLs are generated from the product label plus SKU.

The connected-versus-demo failure path is addressed in source: connected sections now show unavailable states when their live data refresh fails. Product and stock writes now use an admin-checked Postgres function in one transaction, preventing half-saved product/inventory changes. Browser failure-path verification remains outstanding.

Product SKU format and URL generation now share a database/UI contract. Slug generation preserves SKU case, parses the suffix at the first delimiter, supports legacy lowercase-SKU URLs, and redirects noncanonical product paths. Category slug aliases are still not stored, so renamed category links can go stale.

Local admin and database checks are strong evidence for the local build: 42/42 authorization and workflow checks passed; typecheck, schema lint, and the OpenNext Cloudflare build passed. Production behavior is still unverified. Installed Node `v22.12.0` does not meet the package requirement (`>=22.22.2`), so Vitest did not start.

## 2. Admin feature inventory

| Admin area     | Connected behavior                                                                                                            | Demo-only behavior / limits                                         | Assessment                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Authentication | Email/password Supabase login, live profile-role check, sign-out, password recovery/reset                                     | Local demonstration state is not a real account system              | Core path implemented; hosted recovery/MFA settings need confirmation                                |
| Overview       | Live requests, indicative subtotals, status counts, best-requested products, low-stock items, recent requests                 | Sample dashboard data when Supabase is not connected                | Implemented; data-failure fallback can confuse demo and live data                                    |
| Orders         | Reads all requests and line snapshots; admin updates status, tracking number, internal note; status history is shown          | Can create fictitious orders in demo mode; no customer-side payment | Matches manual-contact workflow; transition rules and update audit are limited                       |
| Products       | Reads/writes products, category, price, draft/active visibility, descriptions, and stock; uploads product media               | Local edits and sample products in demo mode                        | Core CRUD is connected; save is not atomic across product and inventory                              |
| Categories     | Add, edit, order, activate/deactivate; generated slug; product counts                                                         | Static fallback category without Supabase                           | Connected and extensible for flat categories; no hierarchy editor or delete action                   |
| Inventory      | Reads current stock; admin can adjust stock; order RPC decrements and cancellation restores stock                             | Sample stock and browser-local alert threshold                      | Core stock path connected; threshold is not a shared setting                                         |
| Customers      | Derived from actual order requests and grouped by normalized phone digits; exports a limited CSV                              | Demo customer CRUD in disconnected demo mode                        | Correctly avoids creating customer accounts; grouping is heuristic                                   |
| Analytics      | Request counts/subtotals by period, city, status, and requested products                                                      | Fictitious sales metrics in demo mode                               | Labels correctly call connected totals indicative; no paid-sales analytics                           |
| Promotions     | Explicitly marked not configured for connected admins                                                                         | Browser-local sample promo CRUD; no discount reaches checkout       | Not implemented as a live feature                                                                    |
| Settings       | Explicitly marked not configured for connected admins                                                                         | Browser-local shop name/email/stock threshold, demo backup/reset    | Not implemented as shared settings                                                                   |
| Search         | Searches products, requests, and derived customers                                                                            | Demo records in demo mode                                           | Useful; client-side search over all fetched records                                                  |
| Exports        | CSV for products, requests, and customer summary; formula-leading values are prefixed to reduce spreadsheet formula execution | Filenames still use `-demo` suffix                                  | Works client-side; export contains PII fields such as customer names and should be handled carefully |
| Alerts         | Dialog with outstanding requests and low-stock counts                                                                         | Uses local threshold setting                                        | Basic on-demand summary, not push/email notifications                                                |

## 3. Authentication and session flow

### What the code does

1. `src/app/admin/layout.tsx` is dynamic and calls `getAdminAuthStatus()` for an admin request.
2. `src/lib/supabase/auth.ts` creates an SSR client, verifies claims with `auth.getClaims()`, extracts the authenticated user ID, then reads the current `profiles.role`. Only `admin` returns an authorized status; all other states redirect to `/login`.
3. `src/proxy.ts` matches `/admin`, `/login`, and `/reset-password`, creates a per-request CSP nonce, and invokes `updateSupabaseSession()`.
4. `src/lib/supabase/proxy.ts` refreshes/verifies the Supabase session, forwards the refreshed cookie, forwards the CSP and nonce, and marks matched responses private/no-store.
5. `/login` uses `AdminLoginForm`. Password sign-in checks `profiles.role`; a non-admin or unverifiable account is signed out. Login errors are generic. The optional `next` target is restricted to `/admin` paths.
6. Password recovery calls `resetPasswordForEmail()` with the current site's `/reset-password` URL and displays a generic success message. The reset form requires a recovery/invite event or recovery session, validates matching passwords, updates the password, and signs out.
7. The legacy admin client checks the session/profile at initialization and again on hash changes. It hides navigation for a rejected session. This check is for UI state; RLS and server route authorization are the actual data controls.

### Authentication assessment

- **Good:** server route gate, claim verification, live database role lookup, non-admin sign-out, server-rendered dynamic route, generic password errors, constrained post-login redirect, and independent RLS.
- **Good:** profile creation defaults to `customer`; no customer account is needed for storefront orders.
- **Needs hosted verification:** Supabase allowed redirect URLs, SMTP delivery, password policy, sign-in/recovery throttles, session expiry/revocation, and MFA enforcement.
- **Local configuration aligned:** `supabase/config.toml` now declares the local site URL on port `3000` and allows the local reset callback. This was applied and checked in the local Auth container. Hosted recovery settings and email delivery remain unverified.
- **MFA:** no app-level MFA enrollment/challenge code was found. Hosted Supabase MFA policy was not inspected; this is an open operational check, not a claim that hosted MFA is disabled.
- **Recovery outcome:** no successful end-to-end recovery email and reset was verified in this audit. The user previously encountered a send-link failure; SMTP and redirect allowlisting remain a likely configuration area to confirm.

## 4. Category and product slug behavior

### Categories

- `src/admin/categories.ts` auto-generates a slug from the category name until the admin manually edits the slug.
- Both automatic and manual values pass through `slugify`: Unicode compatibility decomposition, accent-mark removal, lowercase conversion, spaces/punctuation collapsed to hyphens, and edge hyphens removed.
- The database requires lowercase ASCII kebab-case and a unique slug. Duplicate slugs are rejected by the database.
- Storefront category filtering uses `?category=<category-slug>` and resolves that slug to a category ID. Categories are not currently separate `/categories/<slug>` landing pages.
- Renaming a category can change its slug. No old-slug alias or redirect history is stored; old bookmarks/links can stop selecting that category.
- The schema includes `parent_id`, but the admin form does not set or display parent categories. Current category management is flat. Adding many flat categories is supported; nested category management is not.
- Category records can be activated/deactivated. There is no delete control in the admin UI. The database restricts deleting categories that still have products, which is a sensible safeguard.

### Products

- `src/shared/slugs.ts` builds `/produits/<normalized-label>--<sku>` from brand, product range/name, viscosity, and volume, plus an ID suffix.
- `productIdFromSlug()` uses only the suffix to retrieve a published, visible product. The readable label is not checked against the current product name.
- Legacy `/product.html?id=<sku>` requests look up the product and permanently redirect to the generated product URL.
- Canonical metadata is generated from the current label and current SKU-based slug.

### Slug findings

1. **Resolved locally:** SKU case is preserved and validated by the form and database migration. Legacy lowercase-suffix URLs resolve to the exact SKU and redirect to canonical casing.
2. **Resolved locally:** unsupported SKU punctuation is rejected by the form and database trigger.
3. **Resolved locally:** product label or SKU noncanonical URLs redirect to the current canonical product URL.
4. **Open:** category slug changes have no redirect/alias history; old filter links can stop selecting the category.

**Recommended contract:** either require uppercase SKU IDs in both the form and database, or preserve case consistently end-to-end (the latter makes URLs case-sensitive and complicates normalization). Add the same SKU check to the database. For product labels, redirect a valid SKU suffix to `productSlug(product)` whenever the requested path is not canonical. If category URLs are expected to be durable, keep a slug-alias table or avoid editing slugs after publication.

## 5. Data model and connected/demo separation

### Connected data

- Categories and products are shared Supabase records; products reference `category_id` rather than embedding a category name.
- Stock lives in `product_inventory` and is updated separately from the product row in the current browser workflow.
- Orders store customer name, phone, city, delivery address, order status, indicative total, request UUID, and item snapshots. There are no customer accounts and no payment provider.
- Customer and analytics views are derived from order rows; a user submitting a request does not create an Auth user.
- Remote orders are kept separate from the browser's saved demo orders/customers when `remoteOrdersActive` is true. Real customer/order rows are not intentionally written into the demo localStorage record.

### Demo behavior

- Without a Supabase client, the admin state is sample data stored under a browser localStorage key. Product, inventory, order, customer, promotion, and settings changes are local only.
- The demo seeds fictional `Démo` customers, 48 example orders, sample stock, and promotions.
- In connected mode, promotions/settings are deliberately replaced with explicit “not configured” notices; demo customer create/edit and manual demo order creation are not exposed as connected operations.
- The store admin header may use state-dependent labels, so the most important connected-data safety is the content of each view and error state rather than assuming localStorage state is authoritative.

## 6. Detailed admin operations

### Overview and analytics

Overview calculates order/request counts, non-cancelled subtotals, requests needing attention, low-stock items, top requested items, and a timeline/chart for 7/30/90 days. In connected mode, amounts are explicitly called indicative subtotals because orders are manual requests and no payment is recorded. Analytics also groups by city and status.

These are request analytics, not confirmed revenue. Any future client-facing financial report should distinguish requested, accepted, delivered, cancelled, and paid states. There is no paid state in the current database.

### Orders

The admin list/detail view loads all order rows, item snapshots, and history; admins can update status, tracking number, and internal note through `update_enrm_order`. A status update is stored in Postgres and triggers history. Cancelling an order restores the stock once, and a cancelled order cannot be reactivated. A manual contact by phone is the business step; there is no user checkout account, online payment, email/SMS notification, or carrier integration in the admin.

The connected admin hides its “create order” demo action. That matches the storefront-originated request flow. Status choices are validated in Postgres, but transitions other than reopening a cancelled order are not constrained to a state machine. The UI also allows editing notes/tracking without a separate history event.

### Products and inventory

Product editing includes SKU, name, brand, viscosity, volume, price, category, visibility state, stock, and image upload. SKU uniqueness is checked in the UI and enforced by the product primary key. Product rows and stock rows are persisted with different Supabase calls. Image files are limited in the UI and bucket configuration to JPEG/PNG/WebP up to 1 MiB; uploaded images are public for storefront display.

Inventory adjustment runs through the same product-save helper, then updates stock. Low-stock notifications use a threshold from demo/local state rather than a persisted shared setting. Hiding a product uses draft/unpublished fields. The admin has no product delete/archive action separate from setting draft, and deleting uploaded replacement images is not handled as a complete media lifecycle; repeated image changes can leave unused public objects.

### Categories

Connected category CRUD supports create, edit, sort order, active/inactive visibility, slug uniqueness, and a product count. Product references remain tied to category IDs, so changing a category's name/slug does not orphan the product relation. Inactive categories are excluded from storefront listing and not offered for new product assignment, while a product already tied to an inactive category can retain that association during edit.

### Customers

Connected customer records are derived from guest order requests, not maintained as a separate customer table. Records with the same phone digits are grouped. Formatting differences are normalized, but country-code differences such as `06…` versus `+2126…` may still create separate customer entries. The customer page exports a summary CSV but does not offer real customer edit/create, which is consistent with the manual-order model and avoids inventing a customer-account system.

### Search, exports, and notifications

Global search covers products, requests, and derived customers. List search, status filters, sort selectors, and pagination operate in the browser after records have been loaded. CSV export quotes values and prefixes formula-leading values to reduce spreadsheet formula injection. Orders/customers contain personal information, so exports are sensitive files even though phone/address are not included in the summary CSVs reviewed.

Notifications are an on-demand dialog with counts for requests needing work and stock below the threshold. There are no push, email, or SMS notifications.

## 7. Findings and priorities

### P1 — Failed remote refresh can expose demo data as if it were live admin data — addressed locally, needs runtime failure-path verification

**Evidence before remediation:** demo state is initialized from `loadAdminState()`/`createDemoState()`. Customers, analytics, and global search explicitly show an unavailable message when connected but remote orders fail. The orders and overview views do not have the same `connectedAdmin && !remoteOrdersActive` guard. If a later remote refresh throws/fails after login, the hash-change handler catches it, then renders; those views can show the local sample orders/customers/metrics. Product/inventory refresh failures can similarly leave the seeded client state in memory.

**Impact:** an admin could mistake example orders, sample stock, or fictitious totals for current ENRM data. Local-only demo order edits do not update Supabase, which makes the result especially confusing.

**Remediation:** connected Overview/Orders and Products/Inventory now require their remote-ready flags and show an unavailable state on failed refresh; route refresh errors clear readiness. Sign-out redirects to `/login`. TypeScript passes. The failure path has not yet been forced in a live browser session, so treat runtime confirmation as outstanding.

### P1 — Guest order RPC lacks verified abuse control

The anonymous order RPC is public by design. There is no current per-phone cap, CAPTCHA/siteverify, or verified request rate-limit layer in the reviewed source. New request UUIDs bypass retry idempotency. Automated traffic can generate spam and consume stock. Select an abuse control that does not impose a phone quota before production.

### P1 — Production behavior has not been accepted on a Cloudflare preview

The local app, local Auth, and local Postgres passed checks, but hosted Auth settings, Cloudflare bindings, deployed Proxy behavior, HTTPS headers, and hosted RLS are unknown. OpenNext warns that Node.js Proxy support is experimental. Treat this as a release blocker until tested in a protected preview.

### P2 — Product + stock persistence is atomic locally; exercise the failure path

`saveRemoteProduct()` calls `save_enrm_product_with_stock`, an admin-checked Postgres function that writes product and inventory in one transaction. The migration is applied to the local database and schema lint passes. Hosted migration application and browser success/failure scenarios remain unverified.

**Remaining verification:** confirm create, edit, SKU change, and stock-only save behavior in the admin UI; confirm a forced database failure rolls back both product and stock writes.

### P2 — Product SKU/slug contract — addressed locally; verify full regression suite

The form/database now enforce route-safe SKU values, preserve case in slugs, support old lowercase generated suffixes, and canonicalize paths. Direct cases pass locally; Vitest and full legacy-route regression remain unrun on the supported Node version.

### P2 — Product URL canonicalization — addressed locally

Product lookups use the SKU suffix and redirect valid noncanonical product slugs to the current label/SKU path. Local HTTP checks returned 200 for the canonical path and 308 to the canonical path for a legacy lowercase-SKU URL.

### P2 — Hosted recovery redirect and email remain unverified

Local Supabase Auth now allows the Next.js callback on port `3000`, and the local Auth container reflects the updated URL. Verify the production and Cloudflare preview callbacks and successful recovery email in hosted Auth settings.

### P2 — Admin reads and stores more rows client-side than the visible page needs — partially addressed locally

The Orders, Products, Inventory, and Customers list views now use database-side pagination (12 rows per page), search, and applicable filters. Order history is loaded only for the visible order page. Customer rows are grouped and paged inside a role-checked database function. Product totals are computed in that same database function. Overview and Analytics now use one role-checked database aggregate function for period metrics, status/city breakdowns, best-requested items, low-stock counts, and five recent order details. Admin startup no longer queries the full live catalogue. The Orders list still includes delivery details for each visible row's order query; loading delivery address only when an authorized admin opens an order remains follow-up work. Full CSV export intentionally fetches all matching records.

**Remaining:** fetch delivery address only on authorized order detail open. Keep stable ordering and explicit exact counts for paginated lists.

### P2 — Storefront category and product reads are capped at 1,000 rows

`getPublicCatalogue()` in `src/lib/catalogue.ts` explicitly requests rows `0–999`; `getPublicCategories()` does not paginate. Local Supabase PostgREST is configured with `max_rows = 1000`. Admin browser loaders do paginate, but the Next.js storefront path can omit products/categories beyond the first page.

**Fix:** paginate server-side reads or use an explicit safe maximum with a clearly handled page limit. Keep ordering stable across pages. This matters for long-term product/catalogue growth.

### P2 — Category hierarchy is schema-only

The `categories` table has `parent_id`, but the admin cannot create a child, view a tree, prevent cycles beyond the database's self-parent check, or filter recursively. Current category scalability means adding many flat categories, not managing nested families. If nested categories are in scope, define tree rules and implement them before client data relies on the field.

### P2 — Product/category lifecycle is incomplete

Products can be hidden as drafts and categories can be deactivated, but neither has a delete/archive workflow in the admin. Product label/SKU paths now canonicalize by SKU; category slug changes still do not create redirects/aliases. Define lifecycle rules to avoid stale category links and orphaned media as the client grows.

### P2 — Shared settings do not exist; connected stock threshold is browser-local

Connected Settings is explicitly unconfigured. The stock alert threshold still comes from demo `state.settings.threshold`, stored in localStorage, and drives connected low-stock counts. Different admin browsers can therefore display different warning counts. Persist the threshold in a shared settings table or make it a documented fixed constant until a settings model exists.

### P2 — No app MFA workflow and limited update audit

No MFA flow exists in the app code, and hosted enforcement was not verified. Order history logs status changes only, not internal-note or tracking edits. Confirm MFA with Supabase and define the minimum audit trail for client operations.

### P2 — Defensive HTML attribute escaping is incomplete for product IDs

Some admin templates interpolate product IDs into `data-*` attributes without `esc()`. The form and database now enforce the route-safe SKU alphabet, reducing the current exploitability. Escape every attribute value as defense in depth and inspect other interpolated identifiers/text.

### P3 — Replacing product photos can leave public Storage objects behind

New files use unique paths and are uploaded before the product row update. Failure of the product write triggers cleanup of the new file, but successful image replacement does not remove the prior uploaded file. Define object ownership/path rules and a safe cleanup process; do not delete externally hosted source images.

### P3 — Connected analytics are request analytics, not sales

This is correct for the agreed no-payment flow, but the metric names must remain “demandes”/“sous-total indicatif.” An unconfirmed request is not revenue. The current connected UI mostly reflects this distinction; future report/export changes should preserve it.

## 8. Security summary

The security controls and risks below are also documented in more detail in `ADMIN_SECURITY_AUDIT.md`.

- Admin route authorization checks a verified JWT claim and current profile role on the server.
- Database RLS protects profile roles, hidden products/categories, inventory, order rows/items, and history. Admin order updates use a separate role-checking database function.
- Order creation validates inputs and catalog visibility, uses database prices, locks stock, is transactional, and supports idempotent retry. Guest checkout necessarily exposes the order-creation RPC publicly.
- Local guest signup is disabled in `supabase/config.toml`; this setting has not been applied to hosted Supabase.
- Local headers include CSP nonce, frame protection, nosniff, referrer and permissions policies, HSTS, and private/no-store. HTTPS/HSTS behavior must be verified on preview.
- Public media reads are intentional; admin-only writes are policy-controlled.
- The public order path has no verified CAPTCHA/rate limit. Hosted MFA and password/auth limits are unverified.
- Admin-visible customer PII includes phone and delivery address in order details. Retention, access roster, and export handling need a client policy.

## 9. Verification evidence

| Verification                                                 | Result               | Scope                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin `/admin` direct entry after navigating from storefront | PASS                 | Local Chrome; full navigation and workspace visible.                                                                                                                                                                                                                                                                                                                                           |
| Authorization and order/storage workflow matrix              | PASS, 42/42          | Isolated local Supabase; anonymous/customer denials, admin CRUD, role escalation denial, media controls, order concurrency/idempotency/cancellation.                                                                                                                                                                                                                                           |
| Public signup disabled                                       | PASS                 | One disposable request to local Auth returned HTTP 400; hosted signup untouched.                                                                                                                                                                                                                                                                                                               |
| Local security headers/CSP                                   | PASS                 | `/login` returned 200, all 7 checked headers, script nonce match, private/no-store.                                                                                                                                                                                                                                                                                                            |
| Local TypeScript                                             | PASS                 | `npm run typecheck`.                                                                                                                                                                                                                                                                                                                                                                           |
| Local Supabase schema lint                                   | PASS                 | `npm run backend:lint`; no schema errors.                                                                                                                                                                                                                                                                                                                                                      |
| Cloudflare OpenNext build                                    | PASS                 | `npm run build`; worker bundle generated, with experimental Proxy warning.                                                                                                                                                                                                                                                                                                                     |
| Vitest                                                       | NOT RUN              | Installed Node `v22.12.0` is below package requirement `>=22.22.2`; Vitest previously failed before tests executed.                                                                                                                                                                                                                                                                            |
| Hosted Auth/RLS/Cloudflare preview                           | NOT RUN              | No hosted project or preview was accessed.                                                                                                                                                                                                                                                                                                                                                     |
| Local browser admin/order workflow                           | PASS, partial matrix | Chrome on local Supabase: create category/product, mixed-case SKU edit, atomic product+stock edit, public category filter, stock-only adjustment, guest checkout, order status/tracking/note/history, cancellation stock restoration, cancelled-order transition lock, sign-out and `/admin` redirect. Synthetic QA records remain local (product is draft, category hidden, order cancelled). |
| Cross-browser QA and forced database-failure rollback        | NOT RUN              | Tested one Chrome session; no second browser or deliberate database failure was used.                                                                                                                                                                                                                                                                                                          |

## 10. Recommended order of work

1. Exercise connected-data failure and product/stock transaction rollback from the admin UI.
2. Add guest-order abuse protection without a per-phone quota, then verify it locally and on preview.
3. Complete server-side storefront pagination and move order delivery address into the authorized order detail query.
4. Define category slug history and product/category archive/delete rules; implement category aliases if links should survive renames.
5. Verify hosted recovery email/callback, MFA, role revocation, session expiry, CSV/export policies, and RLS on a protected Cloudflare preview.
6. Decide whether categories remain flat and what settings/promotions are required; those live features are not complete.
7. Run Vitest on a supported Node release and complete end-to-end CRUD, slug, and authorization checks before production release.

## 11. Files reviewed

- `src/admin/{main,views,categories,storage,seed,format}.ts`
- `src/shared/{slugs,catalogue,types,storage,format}.ts`
- `src/lib/supabase/{auth,client,proxy,server}.ts`
- `src/lib/catalogue.ts`
- `src/app/admin/{layout,page}.tsx`
- `src/app/login/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/components/admin/{AdminLoginForm,AdminPasswordResetForm}.tsx`
- `src/app/(storefront)/catalogue/page.tsx`
- `src/app/(storefront)/produits/[slug]/page.tsx`
- `src/app/(storefront)/product.html/page.tsx`
- `src/proxy.ts`, `next.config.ts`, `supabase/config.toml`
- Supabase migrations `20261107000100` through `20261110000200`

## Remediation progress (2026-11-10)

The first high-priority finding, connected-versus-demo data confusion, has been addressed in the current working tree:

- Connected Overview and Orders now render an unavailable state unless the live order dataset loaded successfully.
- Connected Products and Inventory render an unavailable state unless the live product and inventory dataset loaded successfully.
- Remote refresh failures clear the relevant ready state and are caught on route changes; the navigation environment label reflects unavailable data.
- Refreshing live products no longer filters or persists the current order/customer state as a side effect.
- Successful sign-out clears remote-ready flags and redirects to `/login`; it no longer renders the local demo dashboard after logout.
- Product and stock now save in one database transaction through `save_enrm_product_with_stock`; the admin role is checked inside the function. The migration is applied to the local Supabase instance.
- Browser checks confirmed category creation appears in the storefront filter; product create/edit and mixed-case SKU persistence work; stock-only save works; a submitted guest order appears in Orders, status/tracking/note/history persist, cancellation is locked from reopening and restores stock.
- The synthetic order `EN-20261110-00004` was cancelled after testing. The test product remains draft with stock 3; the test category remains hidden because the admin UI has no delete/archive action.
- Sign-out redirects to login; direct `/admin#orders` after logout redirects to `/login#orders`.
- The static admin shell had a missing `environment-tag` ID, so it permanently showed “Démo locale” even after live Supabase data loaded. Added the ID and changed static pre-hydration labels to loading copy. The browser run identified the mismatch; this correction was made after that run and still needs a browser reload check.
- Slug handling now preserves SKU case, accepts legacy lowercase suffix URLs, validates the SKU alphabet in the database, and redirects old product labels/SKU casing to the canonical URL.
- Local Supabase Auth uses port `3000` for site and reset URLs; this local configuration was checked in the running Auth container.
- `npm run typecheck`, `npm run backend:lint`, and `git diff --check` pass. Five direct slug checks pass. Local HTTP checks returned canonical product `200` and legacy slug redirect `308`.
- No hosted Supabase/Cloudflare settings were changed. Vitest was not run because installed Node `v22.12.0` is below the declared minimum. Forced database-failure rollback, connected-data failure simulation, cross-browser QA, and a reload check of the corrected environment badge remain pending.

The admin is not yet complete or production-verified. Remaining work includes a browser reload check of the environment badge fix; connected-data failure and atomic rollback simulations; public order abuse controls that do not impose a per-phone quota; admin and storefront pagination; category slug alias/lifecycle behavior; actual shared settings and promotions; hosted recovery/MFA/RLS checks; and protected Cloudflare preview verification.

## Follow-up verification (2026-11-11)

- Simulated a local PostgREST outage while an authenticated admin was on the Inventory route. The route changed immediately, the connected dataset was replaced by “Données indisponibles,” and no stale inventory rows were shown.
- Restored the isolated local `supabase_rest_enrm-local` service and reloaded the admin. Inventory data returned (211 results; first page displayed), confirming recovery. The local service was left running.
- The static shell now displayed “Espace privé” after reload with connected local Supabase.
- Rechecked anonymous access with the local anon key: reads of orders and order items were denied; inventory/profile reads returned no rows; anonymous product update and the admin product/order RPCs were denied. A local SQL read confirmed the attempted anonymous product update did not change its price.
- The prior full local-stack outage check showed no demo data leakage, but the unavailable profile lookup was initially presented as a role denial. The current working-tree change distinguishes profile-verification outage from a confirmed non-admin profile and retains a previously verified admin session for navigation display; mutation operations still fail closed when role verification cannot be refreshed. The specific full-stack outage copy still merits a browser retest.
- `npm run typecheck` and `git diff --check` passed after the failure-state changes.

Atomic transaction rollback, cross-browser behavior, hosted auth/RLS/MFA, and protected preview checks remain unverified.

## Follow-up verification (2026-11-11): server-side admin pagination

- Added role-checked Supabase functions for paginated product/inventory rows and grouped customer rows. Orders query only the requested page and load history only for those order IDs; exact counts support the page controls.
- Connected Orders, Products, Inventory, and Customers views now request 12 records per page. Search and status/stock filters are sent to the database. CSV exports still fetch the complete authorized dataset so pagination does not silently truncate exports.
- Applied `20261111000100_admin_customer_pagination.sql` to the isolated local Supabase stack. The local browser showed inventory rows 1–12 of 211, then 13–24 of 211 with the expected next product IDs; the Draft product filter returned the single hidden QA product; Orders and Customers both loaded from the paginated queries. The customer rollup correctly excluded the cancelled QA order subtotal.
- `npm run typecheck`, `npm run backend:lint`, and `git diff --check` passed. No hosted Supabase schema was changed.
- Remaining limitations: full CSV exports load all rows by design; customer matching still groups by normalized phone or name/city; cross-browser and hosted-preview checks were not run.

## Follow-up verification (2026-11-11): bounded Overview and Analytics

- Added `get_enrm_admin_dashboard`, a role-checked database function that returns period aggregates, seven chart buckets, status and city rollups, four top requested items, stock summary plus the three lowest-stock products, and only the five most recent order details/history entries.
- Connected Overview and Analytics now render from that summary instead of loading all orders, order items, status history, products, or inventory. Admin startup uses its bundled fallback catalogue for demo-state initialization instead of fetching the full live catalogue.
- Applied `20261111000200_admin_dashboard_aggregates.sql` to isolated local Supabase. Local Chrome showed period counts/subtotals, the recent cancelled QA request, status and city rows, and current stock aggregates. Both routes rendered successfully.
- `npm run typecheck`, `npm run backend:lint`, and `git diff --check` passed. Hosted Supabase was not changed.
- The Orders list still fetches delivery address and internal note for its 12 visible rows. Order-detail-only retrieval remains a privacy/performance improvement. Search and CSV export are unbounded operations and should be reviewed separately for large datasets.

# ENRM Admin Technical & Security Audit

**Review date:** 2026-11-09
**Project:** `/Users/othmanemakroum23/Desktop/projects/enrm`
**Branch:** `fix/nextjs-migration`
**Review target:** current local working tree (including uncommitted migration and hardening changes)
**Overall decision:** **Local security checks pass; production readiness is not established.**

## Executive summary

The admin area now has several strong, independent controls: a server-side `/admin` gate, JWT claim verification, a fresh database role check, Supabase row-level security (RLS), and a restricted database function for admin order updates. Public users can submit an order request but cannot read the resulting order or customer data. Order totals and stock changes are computed transactionally in Postgres. The direct `/admin` entry case was rechecked in Chrome and rendered the full admin navigation.

The local authorization and order workflow matrix passed **42/42 checks**. TypeScript, Supabase schema lint, and the Cloudflare OpenNext build also pass. Local Auth rejects new signup after the local configuration change. The local page returns all seven checked security headers; its inline script tags carry the request CSP nonce, and the admin page rendered without observed CSP console errors.

This is not a production certification. No Cloudflare preview or hosted Supabase runtime was tested in this audit. The largest remaining security exposure is the public order RPC: it intentionally has no per-phone order cap, but the current code also has no verified CAPTCHA or rate limit, so automated traffic could generate order spam or consume stock. The connected admin's Promotions and shared Settings features remain unconfigured rather than persistent operational features.

## Scope and evidence

Reviewed the Next.js server auth helpers, Proxy/session refresh, login and reset flow, legacy admin navigation/data views, Supabase migrations and policies, storage configuration, CSP/security headers, and the admin route rendering. Runtime checks were against the isolated ENRM local Supabase stack and `localhost:3000`; no production domain, hosted Supabase project, DNS record, Cloudflare account setting, or production data was changed.

The local admin dashboard was opened at `/admin#overview` in Chrome. It showed the full sidebar (overview, orders, products, categories, inventory, customers, analytics, promotions, and settings) and the admin workspace. The earlier empty-navigation direct-entry scenario is covered by a remote admin-role check on initialization and route/hash changes, and the direct route was observed rendering correctly.

## Architecture and trust boundaries

- **Browser:** Next.js pages plus legacy admin JavaScript. The browser uses only the Supabase public/anon key. Admin UI checks improve the experience but are not treated as the authorization boundary.
- **Next.js server/Proxy:** `/admin` is dynamic and checks a verified Supabase JWT claim plus the current `profiles.role` on each server request. The Proxy refreshes auth cookies and marks matched responses private/no-store.
- **Supabase Auth:** email/password sign-in and recovery are used for administrators. User profile creation defaults to the `customer` role. Admin roles are provisioned outside the storefront.
- **Postgres:** RLS protects categories, products, inventory, profiles, orders, order items, and status history. `SECURITY DEFINER` functions use an empty `search_path` and have explicit execute grants/revokes.
- **Order entry:** anonymous storefront visitors call a public RPC. It validates the request, uses current published product prices, checks inventory, inserts order/item rows, and decrements stock in one transaction. It does not provide customer accounts or user-side payment.
- **Storage:** the `product-media` bucket is public for product image delivery. Upload, update, and delete require the ENRM admin role.

## Findings by severity

### P1 — Anonymous order submission has no verified abuse throttle

**Evidence:** `place_enrm_order` is executable by `anon` and `authenticated`, as required for guest checkout. The previous phone-based request-limit migration was removed. No Turnstile/siteverify integration or server-side rate-limit check was found in the reviewed app and database code.

**Impact:** automated clients can submit many guest orders, creating PII records and potentially decrementing inventory before an administrator confirms the requests. Idempotency only deduplicates retries that reuse the same request UUID; an attacker can send new UUIDs.

**Current behavior:** there is no per-phone cap. This matches the prior decision to avoid limiting legitimate orders by phone number. That decision does not itself block bot traffic.

**Recommendation:** before production, choose and test an abuse control that does not impose a phone-based customer quota, such as Cloudflare edge rate limiting and/or Turnstile with server-side Siteverify before the database mutation. Also consider reserving stock only at the business-approved point in the manual order lifecycle. No such control was changed in this audit.

### P1 — Hosted auth, RLS, and Worker behavior remain unverified

**Evidence:** all 42 authorization/workflow checks were run against local Supabase. No request was made to hosted Supabase or a Cloudflare preview. OpenNext emits a warning that Node.js Proxy support is experimental and not officially maintained.

**Impact:** hosted migrations, environment bindings, cookie refresh, redirect allowlists, RLS policies, and edge header behavior can differ from local behavior. Source review and local tests cannot prove the deployed project has the same policies or code.

**Recommendation:** run the acceptance matrix in a protected Cloudflare preview wired to a non-production Supabase project before release. Verify actual HTTPS headers and the deployed Proxy behavior, and keep production data out of the test matrix.

### P2 — No admin MFA flow or enforcement was verified

**Evidence:** the reviewed app implements password sign-in and password recovery; no application MFA enrollment/challenge path was found. Hosted Supabase MFA settings were not inspected.

**Impact:** compromise of the administrator mailbox/password can expose customer names, telephone numbers, and delivery addresses and permit product/stock/order changes.

**Recommendation:** enable and enforce an appropriate Supabase MFA policy for admin accounts, then test enrollment, required challenge, recovery, and loss-of-factor procedures in staging. This audit does not assert whether MFA is currently enabled in the hosted dashboard.

### P2 — Product identifiers are constrained in the UI more than in the database

**Evidence:** the product form limits SKUs to `[A-Za-z0-9_-]+`, but the `products.id` database constraint currently checks only trimmed length. Admin table templates interpolate a product ID into `data-stock` and `data-edit-product` attributes without applying the HTML escaping helper, while other displayed values are escaped.

**Impact:** ordinary UI submissions are constrained by the form, and only admins can write products under RLS. However, an admin/API write that bypasses the form could store a quote or markup in an ID and break attribute context when another admin opens product/inventory views. This is a defense-in-depth stored-XSS risk if an admin session or trusted write path is misused.

**Recommendation:** enforce the SKU alphabet in a database `CHECK` constraint and escape product IDs at every HTML attribute interpolation. Keep escaping even after adding the constraint.

### P2 — Order transition rules and audit coverage are limited

**Evidence:** `update_enrm_order` validates allowed status values and prevents an annulled order from being reactivated. Other backward transitions are allowed. `order_status_history` records status changes and actor ID, but edits to the internal note and tracking number are not separately audited.

**Impact:** an authorized admin can move a delivered/expedited order back to an earlier state, and the history does not show who changed a note or tracking value. This limits operational traceability more than it creates an unauthenticated access path.

**Recommendation:** agree on valid transitions with the client and enforce them in the database function if needed. Extend audit events to cover sensitive order-field changes if operational accountability requires it.

### P2 — Admin customer PII has no reviewed retention/export controls

**Evidence:** order records retain customer name, phone, city, and delivery address; these are available to admins through order/customer views. The review found no retention/deletion policy or restricted export workflow. Admin UI supports exporting customer/order information.

**Impact:** more people or longer retention than necessary increases exposure if an admin account or exported file is compromised.

**Recommendation:** define who may administer the project, where exports may be stored, and how long completed/cancelled request details should remain. Avoid exporting real customer data into local browser/demo backups.

### P3 — CSP permits inline styles

**Evidence:** the response CSP uses a per-request nonce and `strict-dynamic` for scripts, while `style-src` includes `unsafe-inline` to support the current legacy admin styling. Dev mode adds `unsafe-eval` for framework development behavior.

**Impact:** a markup injection has more styling capability; inline styles alone do not grant script execution. The production script policy does not include `unsafe-inline` or `unsafe-eval`.

**Recommendation:** retain the current policy only as long as the legacy UI needs inline styling. Recheck the production response separately and remove inline-style allowance when the UI no longer depends on it.

## Controls observed in source and local runtime

### Admin authentication and route handling

- `src/app/admin/layout.tsx` is dynamic and non-revalidated. It redirects every non-admin outcome (unconfigured, unauthenticated, forbidden, or unable to verify) away from the admin shell.
- `getAdminAuthStatus()` calls Supabase `getClaims()` and then checks the current `profiles.role`; a valid session alone is insufficient.
- `src/proxy.ts` applies to `/admin`, `/login`, and `/reset-password`, refreshes/verifies the session through Supabase SSR, and forwards a request-specific nonce/CSP.
- The login handler checks the user's current profile role and signs out any user that is not an admin. User-facing password errors are generic. Password recovery uses a generic success message to avoid account enumeration.
- The `next` redirect accepts only `/admin` paths, blocking protocol-relative and backslash-based open redirects.
- The browser admin entry check queries the current profile role before showing the connected admin navigation. Database RLS remains authoritative if the client UI is stale or bypassed.

### Database authorization and data integrity

- `profiles.role` is restricted to `admin` or `customer`, and profile creation defaults to `customer`. The reviewed grants permit profile reads but not client profile updates, preventing self-service role escalation.
- RLS policies allow public reads only for active categories and published products in active categories. Inventory, order records, order items, and order history are admin-only.
- Admin CRUD policies apply to products, categories, and inventory. The admin predicate reads the protected profile role through a `SECURITY DEFINER` helper.
- `update_enrm_order` independently checks `is_enrm_admin()` inside the database function; it validates fields, locks the order, and restores stock exactly once when first cancelled. A cancelled order cannot be reopened.
- `place_enrm_order` validates customer field lengths and cart shape, rejects unpublished/inactive products, reads authoritative prices from the database, locks inventory in deterministic order, checks available quantities, records order/item snapshots, decrements inventory transactionally, and uses `request_id` idempotency.
- Status history is automatically inserted/updated by a database trigger. Direct client writes to the history table are not granted.
- The public product media bucket allows anonymous reads by design; Storage write/delete policies require admin role. Bucket configuration restricts accepted MIME declarations to JPEG, PNG, and WebP and caps files at 1 MiB. Byte-level image inspection and hosted Storage headers were not tested.

### Browser and HTTP protections

- `next.config.ts` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and HSTS.
- The Proxy CSP sets `default-src 'self'`, a per-request script nonce and `strict-dynamic`, no objects, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`. Supabase is allowed as a connection/image origin where needed.
- Responses checked at local `/login` returned all 7 expected security/cache headers. Every rendered script tag matched the CSP nonce. Local admin rendering showed no observed CSP violations. Inline styles remain allowed.
- HSTS was present in the local response, but local HTTP cannot verify browser HSTS enforcement. Verify it on the HTTPS preview.
- Admin pages are not indexed (`robots` metadata sets `index: false` and `noarchive`). This is a privacy hint, not an access-control mechanism.

## Local verification results

| Check                                              | Result       | Evidence / limit                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin direct URL after authenticated shop browsing | PASS         | Chrome at `localhost:3000/admin#overview`; full nav and workspace rendered.                                                                                                                                                                                                                         |
| Admin-side Supabase authorization/workflow matrix  | PASS, 42/42  | Local isolated Supabase only; tests covered anon/customer denial, own-vs-other profile, role escalation denial, public catalogue visibility, admin category/product/inventory CRUD, order read/update restrictions, history, Storage permissions, order concurrency/idempotency/stock/cancellation. |
| Guest signup disabled                              | PASS locally | After restarting local ENRM Supabase, disposable `/auth/v1/signup` returned HTTP 400. Hosted signup settings were not changed or checked.                                                                                                                                                           |
| Security headers and CSP nonce                     | PASS locally | `/login` returned 200, 7/7 checked headers, script tags matched nonce, private/no-store cache.                                                                                                                                                                                                      |
| Browser CSP/admin rendering                        | PASS locally | Admin dashboard rendered; no CSP console errors were observed in the prior local browser check.                                                                                                                                                                                                     |
| TypeScript                                         | PASS         | `npm run typecheck`.                                                                                                                                                                                                                                                                                |
| Supabase schema lint                               | PASS         | `npm run backend:lint`, no schema errors.                                                                                                                                                                                                                                                           |
| Cloudflare Worker build                            | PASS         | `npm run build`; OpenNext bundle generated. Node Proxy support warning remains.                                                                                                                                                                                                                     |
| Vitest suite                                       | NOT RUN      | Installed Node is `v22.12.0`; the project requires `>=22.22.2`, and Vitest previously failed during Undici worker initialization before tests ran.                                                                                                                                                  |
| Hosted preview / production security               | NOT RUN      | No hosted runtime, Supabase dashboard, Cloudflare preview, or production data was accessed.                                                                                                                                                                                                         |

The 42 local checks used disposable users/orders/media and the test records were removed after the run. No production test record was created. The local app showed zero orders after cleanup. The local Auth signup probe was rejected and left no user.

## Admin feature completeness

- **Connected and persistent:** categories, products, inventory, guest order requests, order status/tracking/internal note, and order status history use Supabase-backed paths and RLS.
- **Derived from actual requests:** customer and analytics views are assembled from guest order records; orders do not create customer login accounts.
- **Not operationally configured:** Promotions have no persistent schema and discounts do not change the checkout/order total. Shared store settings are not stored in an authoritative database; connected admin shows them as unconfigured. These sections should not be presented as functioning business controls until their rules and persistence are defined.
- **No user payment:** the storefront submits a manual order request. Payment is handled offline by the client/admin; the reviewed current schema has no payment status field or customer payment integration.

## Recommended release gate

1. Run the same RLS/auth/order matrix against a Cloudflare preview wired to a separate staging Supabase project.
2. Test admin MFA enforcement, expired sessions, revoked/demoted admin role, password recovery, logout, and recovery redirect allowlists on that preview.
3. Choose bot-abuse controls for anonymous order submission without imposing a per-phone quota; test that rejected traffic creates no order and consumes no stock.
4. Enforce SKU syntax in SQL and escape every SKU used in HTML attributes.
5. Agree on order status transitions, audit coverage for tracking/note edits, and customer-data retention/export handling.
6. Verify HTTPS CSP/HSTS and Supabase Storage headers/content behavior on the preview. Confirm the production Worker receives the intended public Supabase URL/anon key only; never expose a service-role key to browser code.
7. Run the Vitest suite under a supported Node version and retain the test result with the release evidence.
8. Only then review the release decision. This audit itself performed no deployment and no hosted Supabase change.

## Files reviewed

- `src/proxy.ts`
- `src/lib/supabase/{auth,client,proxy,server}.ts`
- `src/app/admin/{layout,page}.tsx`
- `src/app/login/page.tsx`
- `src/components/admin/AdminLoginForm.tsx`
- `src/admin/{main,views,categories,storage}.ts`
- `next.config.ts`
- `supabase/config.toml`
- `supabase/migrations/20261107000100_catalogue_categories.sql`
- `supabase/migrations/20261107000200_product_inventory_media.sql`
- `supabase/migrations/20261107000300_orders.sql`
- `supabase/migrations/20261107000400_admin_order_workflow.sql`
- `supabase/migrations/20261107000500_remove_order_payment_fields.sql`
- `supabase/migrations/20261107000600_order_request_abuse_limits.sql`
- `supabase/migrations/20261107000700_remove_unrequested_request_limits.sql`
- `supabase/migrations/20261107000800_order_status_history.sql`

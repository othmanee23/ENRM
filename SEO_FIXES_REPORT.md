# ENRM SEO fixes and verification report

**Review date:** 17 November 2026. Code review and fixes are in the workspace branch; no deployment occurred.

## Implemented

- Removed the root layout canonical `/` so pages without their own canonical cannot inherit the homepage canonical. Existing public page helper provides canonical, Open Graph and Twitter values; home and informational/catalogue pages use it, and product metadata is generated from product identity fields.
- Product titles now use brand, sub-reference, viscosity and package size; the meta description avoids unsupported technical claims and directs buyers to manufacturer and vehicle specifications.
- Product JSON-LD has SKU/brand/identity and only a verified image. It contains no offer/price, stock availability, ratings or reviews. Breadcrumb JSON-LD remains.
- Missing or generic product artwork is suppressed as a product photo; no incorrect package-size substitution is made.
- Removed customer-facing numeric prices and price sort while values await commercial validation.
- Existing sitemap is dynamic and includes 9 static public paths plus `getPublicCatalogue()` product routes. Existing robots metadata points at the production sitemap and disallows `/api/`.
- Product route uses `notFound()` for absent products and `permanentRedirect()` for a noncanonical slug. Next 16’s installed not-found docs describe not-found responses as 404 before streaming and automatic noindex.
- Existing metadata/robots/sitemap and legacy `.html` redirects were inspected; no redirect rule was changed.

## Live observations

- Search Console screenshot reviewed in this session showed `https://enrm.ma/sitemap.xml` successfully processed on 16 November 2026 with 219 discovered URLs; indexing was still processing and Core Web Vitals had insufficient 90-day data. These are dated observations, not current verified Search Console status.
- Live storefront pages were visually inspected (home, catalogue, a product, advice, contact/about/delivery/returns; cart/checkout behavior was also checked in code and a prior explicitly labeled test request was canceled). A product detail exposed a numeric price despite an indicative disclaimer, and broad-source content/photo gaps were visible.
- The dashboard screenshot supplied by the user showed worker traces/logs enabled, but did not establish an exact source commit match.

## HTTP status and runtime checks

Production HTTP status codes were **not verified**: shell DNS resolution failed for `enrm.ma`, and the web fetch tool returned an internal error. A local `next start` check was also blocked because the sandbox does not permit listening on localhost (`listen EPERM`). Therefore this report makes no claim that live routes currently return 200/301/404 or that the live worker contains this workspace code. Search Console sitemap processing is the only observed remote crawl signal.

`npm run build:next` — passed, including Next compilation, TypeScript, and route generation. `npm run check:build` — passed (OpenNext worker, public assets and all 210 catalogue records). `npm run build` compiled the Next app but failed in OpenNext packaging: the workspace clone uses a symlink to dependencies in the original checkout, and esbuild could not resolve the Darwin Sharp native `.node` modules outside its tracing root. This is an isolated-clone dependency-layout failure; it does not verify a complete Cloudflare bundle. Direct browser/Cloudflare runtime verification is not claimed. Invalid-route, canonical redirect, sitemap response body, robots response body, cache headers, soft-404, and legacy redirect-chain tests remain open.

## Image and performance review

- Local public catalogue references were checked for existence; the known catalogue images are local assets. Generic illustration is now hidden for affected product cards/detail/cart.
- The project config declares Next image formats and Supabase remote image patterns, but storefront product markup currently uses native `<img>` in several places. Cloudflare transformation, response formats, `srcset`, and real LCP/CLS were not measured. No image pipeline was changed without runtime verification.
- Browser performance tools/Lighthouse traces were unavailable in this audit environment. No Lighthouse/Core Web Vitals score is claimed.

## Remaining SEO work

1. Deploy only after review, then verify exact production deployment revision and HTTP statuses for `/`, `/catalogue`, a published product, a missing product, an unknown route, `/robots.txt`, `/sitemap.xml`, and legacy `.html` routes.
2. Recheck Search Console indexing reports and sitemap after deployment; current status is not known.
3. Add brand/viscosity landing pages only when ENRM can provide distinct, useful, technically verified copy; current catalogue filters are not dedicated editorial landing pages.
4. Improve unique product descriptions after manufacturer sources are verified; the proposal CSV is not published copy.
5. Validate social image availability/absolute metadata output and measure image transformation/performance in deployed Cloudflare runtime.
6. Review Content Security Policy coverage on public storefront paths. Current CSP middleware matcher was limited to admin/login/reset in the audited source; expanding CSP requires external font, media, image and Supabase source validation.

## Commands/results

- `npm run typecheck` — passed.
- `npm run format:check` — passed after report formatting.
- `git diff --check` — passed after final source edits.
- `npm run build:next` — passed.
- `npm run check:build` — passed.
- `npm run build` — Next compilation completed; OpenNext packaging failed on Sharp native modules through the external dependency symlink.
- Vitest attempted with `node_modules/.bin/vitest run --configLoader runner --no-file-parallelism` — blocked before tests: installed `undici` throws `Cannot read properties of undefined (reading 'bind')` while Vitest starts worker processes. The environment is Node v22.12.0, below the package’s declared Node `>=22.22.2` requirement. No tests completed; see production checklist.
- `next start --hostname 127.0.0.1` — blocked by sandbox `listen EPERM`; no local HTTP codes claimed.
- `curl` live status checks — unavailable because shell DNS could not resolve `enrm.ma`.

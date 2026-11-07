const params = new URLSearchParams(location.search),
  page = document.body.dataset.page;
export function productUrl(id: string) {
  const url = new URL('product.html', location.href);
  url.searchParams.set('id', id);
  if (page === 'catalogue')
    url.searchParams.set('return', 'catalogue.html' + location.search + '#catalogue');
  else if (page === 'product' && params.get('return')) url.searchParams.set('return', safeReturn());
  return url.pathname.split('/').pop() + url.search;
}
export function safeReturn() {
  const r = params.get('return');
  if (r) {
    try {
      const u = new URL(r, location.href);
      if (u.origin === location.origin && u.pathname.endsWith('/catalogue.html'))
        return u.pathname.split('/').pop() + u.search + u.hash;
    } catch {}
  }
  return 'catalogue.html';
}

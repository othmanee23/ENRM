import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSupabaseSession(
  request: NextRequest,
  security?: { nonce: string; csp: string },
) {
  const requestHeaders = new Headers(request.headers);
  if (security) {
    requestHeaders.set('x-nonce', security.nonce);
    requestHeaders.set('Content-Security-Policy', security.csp);
  }

  const createResponse = () => {
    const next = NextResponse.next({ request: { headers: requestHeaders } });
    next.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    if (security) next.headers.set('Content-Security-Policy', security.csp);
    return next;
  };

  let response = createResponse();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set('cookie', request.cookies.toString());
        response = createResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims verifies the JWT and refreshes an expired/near-expiry session.
  // The admin layout separately checks the current database role on every request.
  await supabase.auth.getClaims();
  return response;
}

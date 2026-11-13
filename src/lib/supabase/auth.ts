import 'server-only';

import { createSupabaseServerClient } from './server';

export type AdminAuthStatus =
  'unconfigured' | 'unauthenticated' | 'forbidden' | 'unavailable' | 'admin';

/** Verify the session signature and the live database role before serving admin HTML. */
export async function getAdminAuthStatus(): Promise<AdminAuthStatus> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 'unconfigured';

  const { data, error } = await supabase.auth.getClaims();
  if (error) return 'unavailable';
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : '';
  if (!userId) return 'unauthenticated';

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) return 'unavailable';
  return profile?.role === 'admin' ? 'admin' : 'forbidden';
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';

export function AdminPasswordResetForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setChecking(false);
      return;
    }

    const recoveryLink =
      new URLSearchParams(window.location.search).has('code') ||
      /(?:^|[&#])type=(?:recovery|invite)(?:&|$)/.test(window.location.hash);
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setAuthorized(true);
      }
    });
    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (recoveryLink && sessionData.session && !sessionError) setAuthorized(true);
      setChecking(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !authorized) {
      setError('Le lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    if (password !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSubmitting(false);
      setError(
        'Le mot de passe n’a pas pu être modifié. Vérifiez les règles de sécurité et réessayez.',
      );
      return;
    }

    await supabase.auth.signOut();
    router.replace('/login?reason=password-updated');
    router.refresh();
  }

  return (
    <main className="admin-login-page">
      <a className="admin-login-brand" href="/" aria-label="Retour au site ENRM">
        ENRM <span>ESPACE DE GESTION</span>
      </a>
      <section className="panel settings-body category-auth" aria-labelledby="reset-title">
        <p className="eyebrow">ACCÈS RÉSERVÉ</p>
        <h1 id="reset-title">Choisir un nouveau mot de passe</h1>
        {!configured ? (
          <p className="admin-login-notice" role="status">
            La connexion Supabase n’est pas configurée.
          </p>
        ) : checking ? (
          <p role="status">Vérification du lien…</p>
        ) : !authorized ? (
          <>
            <p className="admin-login-notice" role="status">
              Ce lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien depuis la
              connexion administrateur.
            </p>
            <a className="btn" href="/login">
              Retour à la connexion
            </a>
          </>
        ) : (
          <form className="form-grid admin-login-form" onSubmit={submit}>
            <label className="field full">
              Nouveau mot de passe
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                required
              />
            </label>
            <label className="field full">
              Confirmer le mot de passe
              <input
                name="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                required
              />
            </label>
            {error && (
              <p className="admin-login-error full" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary full" type="submit" disabled={submitting}>
              {submitting ? 'Modification…' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        )}
      </section>
      <a className="admin-login-back" href="/">
        Revenir à la boutique
      </a>
    </main>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';

export function AdminLoginForm({
  nextPath,
  configured,
  notice,
}: {
  nextPath: string;
  configured: boolean;
  notice: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        'La connexion administrateur n’est pas configurée. Contactez le responsable du site.',
      );
      return;
    }
    const form = new FormData(event.currentTarget);
    const requestedEmail = String(form.get('email') || '').trim();
    setEmail(requestedEmail);
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(requestedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (resetError) {
      setError('Impossible d’envoyer le lien. Vérifiez la configuration Supabase et réessayez.');
      return;
    }
    setMessage(
      'Si un compte correspond à cette adresse, un lien de réinitialisation va être envoyé.',
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        'La connexion administrateur n’est pas configurée. Contactez le responsable du site.',
      );
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    setSubmitting(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !data.user) {
      setSubmitting(false);
      setError('Connexion refusée. Vérifiez vos identifiants ou contactez le responsable du site.');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError(
        profileError
          ? 'Le rôle du compte n’a pas pu être vérifié. Réessayez plus tard.'
          : 'Ce compte ne dispose pas du rôle administrateur ENRM.',
      );
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <main className="admin-login-page">
      <a className="admin-login-brand" href="/" aria-label="Retour au site ENRM">
        ENRM <span>ESPACE DE GESTION</span>
      </a>
      <section className="panel settings-body category-auth" aria-labelledby="login-title">
        <p className="eyebrow">ACCÈS RÉSERVÉ</p>
        <h1 id="login-title">
          {mode === 'login' ? 'Connexion administrateur' : 'Réinitialiser le mot de passe'}
        </h1>
        <p>Connectez-vous avec un compte ENRM autorisé à gérer le catalogue et les demandes.</p>
        {notice && (
          <p className="admin-login-notice" role="status">
            {notice}
          </p>
        )}
        {message && (
          <p className="admin-login-notice" role="status">
            {message}
          </p>
        )}
        {!configured ? (
          <p className="admin-login-notice" role="status">
            La connexion Supabase n’est pas configurée pour cette version du site.
          </p>
        ) : mode === 'forgot' ? (
          <form className="form-grid admin-login-form" onSubmit={requestReset}>
            <p className="full">
              Entrez l’adresse e-mail de votre compte administrateur. Nous enverrons un lien si le
              compte existe.
            </p>
            <label className="field full">
              Adresse e-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            {error && (
              <p className="admin-login-error full" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary full" type="submit" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
            </button>
            <button
              className="text-action full"
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setMessage('');
              }}
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <form className="form-grid admin-login-form" onSubmit={submit}>
            <label className="field full">
              Adresse e-mail
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field full">
              Mot de passe
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
            </label>
            {error && (
              <p className="admin-login-error full" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary full" type="submit" disabled={submitting}>
              {submitting ? 'Vérification…' : 'Se connecter'}
            </button>
            <button
              className="text-action full"
              type="button"
              onClick={() => {
                setMode('forgot');
                setError('');
                setMessage('');
              }}
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}
        <p className="form-note">
          Les comptes et les rôles sont provisionnés par le responsable Supabase du projet.
        </p>
      </section>
      <a className="admin-login-back" href="/">
        Revenir à la boutique
      </a>
    </main>
  );
}

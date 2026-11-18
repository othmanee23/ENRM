'use client';

import { useState, type FormEvent } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Envoi impossible. Réessayez plus tard.');
      form.reset();
      setStatus('Votre message a bien été envoyé. Notre équipe vous répondra bientôt.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Envoi impossible. Réessayez plus tard.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="site-contact-form" onSubmit={submit}>
      <label>
        Votre nom
        <input name="name" autoComplete="name" maxLength={120} required />
      </label>
      <div className="site-contact-row">
        <label>
          Adresse e-mail
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          Téléphone <span>(facultatif)</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={30} />
        </label>
      </div>
      <label>
        Votre message
        <textarea name="message" rows={3} maxLength={4000} required />
      </label>
      <label className="site-contact-consent">
        <input name="consent" type="checkbox" required />
        <span>J’accepte que mes informations soient utilisées pour répondre à ma demande.</span>
      </label>
      <label className="site-contact-honeypot" aria-hidden="true">
        Ne pas remplir <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="button primary" type="submit" disabled={sending}>
        {sending ? 'Envoi en cours…' : 'Envoyer le message'} <span aria-hidden="true">↗</span>
      </button>
      <p className="site-contact-status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}

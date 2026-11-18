import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

const CONTACT_RECIPIENT = 'Nizarafifi1551@gmail.com';
const CONTACT_SENDER = 'contact@enrm.ma';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailBinding = {
  send(message: {
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
};

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Requête refusée.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 12_000) {
      return NextResponse.json({ error: 'Le formulaire est trop volumineux.' }, { status: 413 });
    }
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Formulaire invalide.' }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Formulaire invalide.' }, { status: 400 });
  }

  // Quietly accept bot submissions without sending email.
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === 'string' ? body.name.replace(/[\u0000-\u001f\u007f]/g, ' ').trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (
    !name || name.length > 120 || !EMAIL_PATTERN.test(email) || email.length > 254 ||
    phone.length > 30 || !message || message.length > 4000 || body.consent !== 'on'
  ) {
    return NextResponse.json({ error: 'Vérifiez les champs obligatoires du formulaire.' }, { status: 400 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const cloudflareEnv = env as typeof env & { EMAIL?: EmailBinding };
    if (!cloudflareEnv.EMAIL) {
      return NextResponse.json(
        { error: 'Le formulaire de contact est temporairement indisponible. Appelez-nous au +212 6 61 42 84 06.' },
        { status: 503 },
      );
    }

    await cloudflareEnv.EMAIL.send({
      from: CONTACT_SENDER,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `Message du site ENRM — ${name}`,
      text: `Nom : ${name}\nE-mail : ${email}\nTéléphone : ${phone || 'Non renseigné'}\n\nMessage :\n${message}`,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorCode =
      error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'UNKNOWN';
    console.error('[contact-email-send-failed]', errorCode);

    if (
      ['E_SENDER_DOMAIN_NOT_AVAILABLE', 'E_SENDER_DOMAIN_NOT_CONFIGURED', 'E_EMAIL_SENDING_NOT_READY', 'E_SENDER_NOT_VERIFIED'].includes(errorCode)
    ) {
      return NextResponse.json(
        { error: 'L’envoi des messages n’est pas encore activé pour ENRM dans Cloudflare Email Sending. Appelez-nous au +212 6 61 42 84 06.' },
        { status: 503 },
      );
    }
    if (['E_RECIPIENT_NOT_ALLOWED', 'E_RECIPIENT_PLAN_RESTRICTED'].includes(errorCode)) {
      return NextResponse.json(
        { error: 'La réception des messages n’est pas encore autorisée dans Cloudflare. Appelez-nous au +212 6 61 42 84 06.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'L’envoi a échoué. Réessayez plus tard ou appelez-nous au +212 6 61 42 84 06.' },
      { status: 503 },
    );
  }
}

import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const email = data.get('email')?.toString().trim();
    const phone = data.get('phone')?.toString().trim();
    const service = data.get('service')?.toString().trim();
    const message = data.get('message')?.toString().trim();
    const vehicle = data.get('vehicle')?.toString().trim();

    if (!name || !email || !message) {
      return fail(400, { error: 'Bitte Name, E-Mail und Nachricht ausfüllen.', name, email, phone, service, message, vehicle });
    }

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.CONTACT_TO_EMAIL) {
      console.error('Kontaktformular: SMTP ist noch nicht konfiguriert (lm-motorsport-secret fehlt).');
      return fail(503, {
        error: 'Der Versand ist gerade noch nicht eingerichtet. Bitte kontaktiere uns direkt per E-Mail oder Telefon.',
        name,
        email,
        phone,
        service,
        message,
        vehicle
      });
    }

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
    });

    try {
      await transporter.sendMail({
        from: `"LM Motorsport Website" <${env.CONTACT_TO_EMAIL}>`,
        to: env.CONTACT_TO_EMAIL,
        replyTo: email,
        subject: `Neue Anfrage (${service || 'Sonstiges'}) von ${name}`,
        text: [
          `Name: ${name}`,
          `E-Mail: ${email}`,
          `Telefon: ${phone || '-'}`,
          `Betrifft: ${service || '-'}`,
          `Fahrzeug/Link: ${vehicle || '-'}`,
          '',
          message
        ].join('\n')
      });
    } catch (err) {
      console.error('Kontaktformular: Mailversand fehlgeschlagen', err);
      return fail(502, {
        error: 'Senden hat leider nicht geklappt. Bitte versuch es später nochmal oder ruf uns direkt an.',
        name,
        email,
        phone,
        service,
        message,
        vehicle
      });
    }

    return { success: true };
  }
};

import "server-only";
import { Resend } from "resend";

const FROM = "DevisVéto <contact@devisveto.fr>";

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Mode mock : pas de clé Resend en dev, on journalise au lieu d'envoyer.
    console.log(`[MOCK EMAIL] to=${to} subject="${subject}"`);
    return { mocked: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
  return { mocked: false };
}

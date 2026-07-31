import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";

const FROM = "DevisVéto <contact@devisveto.fr>";
const FROM_DOMAIN = "devisveto.fr";

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
  text: string;
};

function assertVerifiedSenderDomain() {
  const match = FROM.match(/<[^@<>]+@([^<>]+)>$/);
  const domain = match?.[1]?.toLowerCase();
  if (domain !== FROM_DOMAIN) {
    throw new Error("EMAIL_FROM_DOMAIN_INVALID");
  }
}

function safeRecipientHint(to: string) {
  const [local, domain] = to.split("@");
  if (!domain) return "invalid";
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function sendEmail({ to, subject, react, text }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  assertVerifiedSenderDomain();

  if (!apiKey) {
    console.info("[EMAIL_MOCK]", { to: safeRecipientHint(to), subject });
    return { mocked: true };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, react, text });
  if (error) {
    console.error("[EMAIL_SEND_FAILED]", {
      to: safeRecipientHint(to),
      subject,
      message: error.message,
    });
    throw new Error(error.message);
  }

  console.info("[EMAIL_SENT]", { to: safeRecipientHint(to), subject, id: data?.id ?? null });
  return { mocked: false };
}

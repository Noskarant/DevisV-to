import "server-only";
import { documentReceivedEmail } from "@/emails/DocumentReceivedEmail";
import { feedbackRequestEmail } from "@/emails/FeedbackRequestEmail";
import { needsInformationEmail } from "@/emails/NeedsInformationEmail";
import { paymentConfirmedEmail } from "@/emails/PaymentConfirmedEmail";
import { paymentFailedEmail } from "@/emails/PaymentFailedEmail";
import { previewReadyEmail } from "@/emails/PreviewReadyEmail";
import { reportReadyEmail } from "@/emails/ReportReadyEmail";
import { subscriptionActivatedEmail } from "@/emails/SubscriptionActivatedEmail";
import { subscriptionCanceledEmail } from "@/emails/SubscriptionCanceledEmail";
import { dataDeletionConfirmedEmail } from "@/emails/DataDeletionConfirmedEmail";
import { magicLinkEmail } from "@/emails/MagicLinkEmail";
import { welcomeEmail } from "@/emails/WelcomeEmail";
import { appUrl } from "@/emails/utils";
import { sendEmail } from "./resend";

export function sendDocumentReceivedEmail(to: string, petName: string) {
  return sendEmail({ to, ...documentReceivedEmail({ petName }) });
}

export function sendPreviewReadyEmail(to: string, petName: string, previewUrl: string) {
  return sendEmail({ to, ...previewReadyEmail({ petName, previewUrl }) });
}

export function sendPaymentConfirmedEmail(
  to: string,
  petName: string,
  details?: {
    amountCents?: number | null;
    currency?: string | null;
    productLabel?: string | null;
    paidAt?: string | Date | null;
  }
) {
  return sendEmail({
    to,
    ...paymentConfirmedEmail({
      petName,
      amountCents: details?.amountCents,
      currency: details?.currency,
      productLabel: details?.productLabel,
      paidAt: details?.paidAt,
      dashboardUrl: `${appUrl()}/dashboard`,
    }),
  });
}

export function sendNeedsInformationEmail(to: string, petName: string) {
  return sendEmail({
    to,
    ...needsInformationEmail({ petName, dashboardUrl: `${appUrl()}/dashboard` }),
  });
}

export function sendReportReadyEmail(to: string, petName: string, reportUrl: string) {
  return sendEmail({ to, ...reportReadyEmail({ petName, reportUrl }) });
}

export function sendFeedbackRequestEmail(to: string, petName: string) {
  return sendEmail({ to, ...feedbackRequestEmail({ petName }) });
}

export function sendDataDeletionConfirmedEmail(to: string) {
  return sendEmail({ to, ...dataDeletionConfirmedEmail() });
}

export function sendWelcomeEmail(to: string) {
  return sendEmail({
    to,
    ...welcomeEmail({ email: to, dashboardUrl: `${appUrl()}/dashboard` }),
  });
}

export function sendMagicLinkEmail(to: string, loginUrl: string) {
  return sendEmail({ to, ...magicLinkEmail({ loginUrl }) });
}

export function sendSubscriptionActivatedEmail(
  to: string,
  details?: {
    planLabel?: string | null;
    startedAt?: string | Date | null;
    nextBillingAt?: string | Date | null;
  }
) {
  return sendEmail({
    to,
    ...subscriptionActivatedEmail({
      planLabel: details?.planLabel,
      startedAt: details?.startedAt,
      nextBillingAt: details?.nextBillingAt,
      dashboardUrl: `${appUrl()}/dashboard`,
    }),
  });
}

export function sendPaymentFailedEmail(to: string) {
  return sendEmail({
    to,
    ...paymentFailedEmail({ billingPortalUrl: `${appUrl()}/dashboard` }),
  });
}

export function sendSubscriptionCanceledEmail(
  to: string,
  details?: {
    accessEndsAt?: string | Date | null;
  }
) {
  return sendEmail({
    to,
    ...subscriptionCanceledEmail({
      accessEndsAt: details?.accessEndsAt,
      dashboardUrl: `${appUrl()}/dashboard`,
    }),
  });
}

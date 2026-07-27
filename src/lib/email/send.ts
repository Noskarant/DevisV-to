import "server-only";
import { sendEmail } from "./resend";
import {
  documentReceivedTemplate,
  previewReadyTemplate,
  paymentConfirmedTemplate,
  needsInformationTemplate,
  reportReadyTemplate,
  feedbackRequestTemplate,
  dataDeletionConfirmedTemplate,
} from "./templates";

export function sendDocumentReceivedEmail(to: string, petName: string) {
  return sendEmail(to, "Votre devis a bien été reçu", documentReceivedTemplate(petName));
}

export function sendPreviewReadyEmail(to: string, petName: string, previewUrl: string) {
  return sendEmail(
    to,
    `Votre aperçu DevisVéto pour ${petName}`,
    previewReadyTemplate(petName, previewUrl)
  );
}

export function sendPaymentConfirmedEmail(to: string, petName: string) {
  return sendEmail(to, "Paiement confirmé — DevisVéto", paymentConfirmedTemplate(petName));
}

export function sendNeedsInformationEmail(to: string, petName: string) {
  return sendEmail(
    to,
    "Une information nous manque pour terminer votre analyse",
    needsInformationTemplate(petName)
  );
}

export function sendReportReadyEmail(to: string, petName: string, reportUrl: string) {
  return sendEmail(to, "Votre rapport DevisVéto est prêt", reportReadyTemplate(petName, reportUrl));
}

export function sendFeedbackRequestEmail(to: string, petName: string) {
  return sendEmail(to, "Votre avis sur votre rapport DevisVéto", feedbackRequestTemplate(petName));
}

export function sendDataDeletionConfirmedEmail(to: string) {
  return sendEmail(to, "Suppression de vos données — DevisVéto", dataDeletionConfirmedTemplate());
}

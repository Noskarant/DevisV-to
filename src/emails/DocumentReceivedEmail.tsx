import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { appUrl, lines, type EmailTemplateResult } from "./utils";

export type DocumentReceivedEmailProps = {
  petName?: string | null;
};

export function DocumentReceivedEmail({ petName }: DocumentReceivedEmailProps) {
  const animal = petName?.trim() || "votre animal";
  return (
    <EmailLayout appUrl={appUrl()} preview="Votre document a bien été reçu." title="Document reçu">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Nous avons bien reçu le document concernant {animal}. Il est maintenant rattaché à votre
        espace DevisVéto.
      </Text>
      <InfoCard title="Suite du parcours">
        Vous recevrez un message dès que votre analyse ou votre rapport sera disponible.
      </InfoCard>
    </EmailLayout>
  );
}

DocumentReceivedEmail.PreviewProps = { petName: "Nala" } satisfies DocumentReceivedEmailProps;

export default DocumentReceivedEmail;

export function documentReceivedEmail(props: DocumentReceivedEmailProps): EmailTemplateResult {
  const animal = props.petName?.trim() || "votre animal";
  return {
    subject: EMAIL_SUBJECTS.documentReceived,
    react: <DocumentReceivedEmail {...props} />,
    text: lines([
      "Document reçu",
      `Nous avons bien reçu le document concernant ${animal}.`,
      "Il est maintenant rattaché à votre espace DevisVéto.",
    ]),
  };
}

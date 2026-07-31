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
    <EmailLayout appUrl={appUrl()} preview="Votre document a bien ete recu." title="Document recu">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Nous avons bien recu le document concernant {animal}. Il est maintenant rattache a votre
        espace DevisVeto.
      </Text>
      <InfoCard title="Suite du parcours">
        Vous recevrez un message des que votre analyse ou votre rapport sera disponible.
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
      "Document recu",
      `Nous avons bien recu le document concernant ${animal}.`,
      "Il est maintenant rattache a votre espace DevisVeto.",
    ]),
  };
}

import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { appUrl, lines, type EmailTemplateResult } from "./utils";

export type FeedbackRequestEmailProps = {
  petName?: string | null;
};

export function FeedbackRequestEmail({ petName }: FeedbackRequestEmailProps) {
  const animal = petName?.trim() || "votre animal";

  return (
    <EmailLayout appUrl={appUrl()} preview="Votre avis aide a ameliorer DevisVeto." title="Votre avis nous interesse">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Vous avez consulte votre explication du document de {animal}. Votre retour nous aide a rendre
        les analyses plus claires et plus utiles.
      </Text>
      <InfoCard title="Merci">
        Si vous souhaitez nous signaler un point peu clair, vous pouvez le faire depuis votre espace.
      </InfoCard>
    </EmailLayout>
  );
}

FeedbackRequestEmail.PreviewProps = { petName: "Nala" } satisfies FeedbackRequestEmailProps;

export default FeedbackRequestEmail;

export function feedbackRequestEmail(props: FeedbackRequestEmailProps): EmailTemplateResult {
  const animal = props.petName?.trim() || "votre animal";
  return {
    subject: EMAIL_SUBJECTS.feedbackRequest,
    react: <FeedbackRequestEmail {...props} />,
    text: lines([
      "Votre avis sur votre rapport DevisVeto",
      `Vous avez consulte l'explication du document de ${animal}.`,
      "Votre retour nous aide a rendre les analyses plus claires.",
    ]),
  };
}

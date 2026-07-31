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
    <EmailLayout appUrl={appUrl()} preview="Votre avis aide à améliorer DevisVéto." title="Votre avis nous intéresse">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Vous avez consulté votre explication du document de {animal}. Votre retour nous aide à rendre
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
      "Votre avis sur votre rapport DevisVéto",
      `Vous avez consulté l’explication du document de ${animal}.`,
      "Votre retour nous aide à rendre les analyses plus claires.",
    ]),
  };
}

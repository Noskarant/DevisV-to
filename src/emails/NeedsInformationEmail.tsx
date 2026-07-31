import { Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, lines, type EmailTemplateResult } from "./utils";

export type NeedsInformationEmailProps = {
  petName?: string | null;
  dashboardUrl?: string | null;
};

export function NeedsInformationEmail({ petName, dashboardUrl }: NeedsInformationEmailProps) {
  const animal = petName?.trim() || "votre animal";
  const url = absoluteUrl(dashboardUrl, "/dashboard");

  return (
    <EmailLayout appUrl={appUrl()} preview="Une information est necessaire pour terminer votre analyse." title="Information necessaire">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Pour terminer votre analyse du document de {animal}, une information complementaire est
        necessaire.
      </Text>
      <InfoCard title="Suite">
        Connectez-vous a votre espace pour consulter le dossier et completer les informations demandees.
      </InfoCard>
      <EmailButton href={url}>Acceder a mon espace</EmailButton>
    </EmailLayout>
  );
}

NeedsInformationEmail.PreviewProps = {
  petName: "Nala",
  dashboardUrl: "https://www.devisveto.fr/dashboard",
} satisfies NeedsInformationEmailProps;

export default NeedsInformationEmail;

export function needsInformationEmail(props: NeedsInformationEmailProps): EmailTemplateResult {
  const animal = props.petName?.trim() || "votre animal";
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  return {
    subject: EMAIL_SUBJECTS.needsInformation,
    react: <NeedsInformationEmail {...props} dashboardUrl={url} />,
    text: lines([
      "Une information nous manque pour terminer votre analyse",
      `Pour terminer l'analyse du document de ${animal}, une information complementaire est necessaire.`,
      `Acceder a mon espace : ${url}`,
    ]),
  };
}

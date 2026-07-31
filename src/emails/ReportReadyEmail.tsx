import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, lines, type EmailTemplateResult } from "./utils";

export type ReportReadyEmailProps = {
  petName?: string | null;
  reportUrl?: string | null;
};

export function ReportReadyEmail({ petName, reportUrl }: ReportReadyEmailProps) {
  const animal = petName?.trim() || "votre animal";
  const url = absoluteUrl(reportUrl, "/dashboard");

  return (
    <EmailLayout appUrl={appUrl()} preview="Votre rapport DevisVeto est disponible." title="Rapport disponible">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Le rapport lie au document de {animal} est disponible dans votre espace.
      </Text>
      <InfoCard title="Dans le rapport" tone="success">
        Vous retrouverez les explications, les points a confirmer et les questions utiles a poser a
        la clinique.
      </InfoCard>
      <EmailButton href={url}>Consulter mon rapport</EmailButton>
      <Text style={emailSmallText}>
        Lien de secours :{" "}
        <Link href={url} style={{ color: "#0c5b50" }}>
          {url}
        </Link>
      </Text>
    </EmailLayout>
  );
}

ReportReadyEmail.PreviewProps = {
  petName: "Nala",
  reportUrl: "https://www.devisveto.fr/dashboard/dossiers/demo/rapport",
} satisfies ReportReadyEmailProps;

export default ReportReadyEmail;

export function reportReadyEmail(props: ReportReadyEmailProps): EmailTemplateResult {
  const animal = props.petName?.trim() || "votre animal";
  const url = absoluteUrl(props.reportUrl, "/dashboard");
  return {
    subject: EMAIL_SUBJECTS.reportReady,
    react: <ReportReadyEmail {...props} reportUrl={url} />,
    text: lines([
      "Votre rapport DevisVeto est pret",
      `Le rapport lie au document de ${animal} est disponible.`,
      `Consulter mon rapport : ${url}`,
      "DevisVeto ne remplace pas l'avis de votre veterinaire.",
    ]),
  };
}

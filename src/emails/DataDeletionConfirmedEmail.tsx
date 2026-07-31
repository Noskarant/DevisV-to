import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { appUrl, lines, type EmailTemplateResult } from "./utils";

export function DataDeletionConfirmedEmail() {
  return (
    <EmailLayout appUrl={appUrl()} preview="La suppression de vos données DevisVéto est confirmée." title="Données supprimées">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Vos documents et données personnelles ont été supprimés de DevisVéto, conformément à votre
        demande.
      </Text>
      <InfoCard title="Confirmation" tone="success">
        Cette confirmation concerne les données gérées par DevisVéto dans votre espace.
      </InfoCard>
    </EmailLayout>
  );
}

DataDeletionConfirmedEmail.PreviewProps = {};

export default DataDeletionConfirmedEmail;

export function dataDeletionConfirmedEmail(): EmailTemplateResult {
  return {
    subject: EMAIL_SUBJECTS.dataDeletionConfirmed,
    react: <DataDeletionConfirmedEmail />,
    text: lines([
      "Suppression de vos données - DevisVéto",
      "Vos documents et données personnelles ont été supprimés de DevisVéto, conformément à votre demande.",
    ]),
  };
}

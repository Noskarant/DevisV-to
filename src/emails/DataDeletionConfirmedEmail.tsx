import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { appUrl, lines, type EmailTemplateResult } from "./utils";

export function DataDeletionConfirmedEmail() {
  return (
    <EmailLayout appUrl={appUrl()} preview="La suppression de vos donnees DevisVeto est confirmee." title="Donnees supprimees">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Vos documents et donnees personnelles ont ete supprimes de DevisVeto, conformement a votre
        demande.
      </Text>
      <InfoCard title="Confirmation" tone="success">
        Cette confirmation concerne les donnees gerees par DevisVeto dans votre espace.
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
      "Suppression de vos donnees - DevisVeto",
      "Vos documents et donnees personnelles ont ete supprimes de DevisVeto, conformement a votre demande.",
    ]),
  };
}

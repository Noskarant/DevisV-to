import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, formatDate, lines, type EmailTemplateResult } from "./utils";

export type SubscriptionCanceledEmailProps = {
  accessEndsAt?: string | Date | null;
  dashboardUrl?: string | null;
};

export function SubscriptionCanceledEmail(props: SubscriptionCanceledEmailProps) {
  const baseUrl = appUrl();
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  const accessEndsAt = formatDate(props.accessEndsAt);

  return (
    <EmailLayout appUrl={baseUrl} preview="Votre abonnement DevisVeto a ete annule." title="Abonnement annule">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>Votre abonnement DevisVeto a bien ete annule.</Text>
      <InfoCard title="Acces">
        {accessEndsAt
          ? `Votre acces Plus reste disponible jusqu au ${accessEndsAt}.`
          : "Votre espace DevisVeto reste accessible pour retrouver les informations conservees dans votre compte."}
      </InfoCard>
      <EmailButton href={url}>Acceder a mon espace</EmailButton>
      <Text style={emailSmallText}>
        Lien de secours :{" "}
        <Link href={url} style={{ color: "#0c5b50" }}>
          {url}
        </Link>
      </Text>
    </EmailLayout>
  );
}

SubscriptionCanceledEmail.PreviewProps = {
  accessEndsAt: "2026-08-31T10:30:00.000Z",
  dashboardUrl: "https://www.devisveto.fr/dashboard",
} satisfies SubscriptionCanceledEmailProps;

export default SubscriptionCanceledEmail;

export function subscriptionCanceledEmail(props: SubscriptionCanceledEmailProps): EmailTemplateResult {
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  const accessEndsAt = formatDate(props.accessEndsAt);
  return {
    subject: EMAIL_SUBJECTS.subscriptionCanceled,
    react: <SubscriptionCanceledEmail {...props} dashboardUrl={url} />,
    text: lines([
      "Confirmation d'annulation de votre abonnement",
      "Votre abonnement DevisVeto a bien ete annule.",
      accessEndsAt ? `Votre acces Plus reste disponible jusqu'au ${accessEndsAt}.` : null,
      `Acceder a mon espace : ${url}`,
    ]),
  };
}

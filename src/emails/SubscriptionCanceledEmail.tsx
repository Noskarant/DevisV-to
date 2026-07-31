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
    <EmailLayout appUrl={baseUrl} preview="Votre abonnement DevisVéto a été annulé." title="Abonnement annulé">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>Votre abonnement DevisVéto a bien été annulé.</Text>
      <InfoCard title="Acces">
        {accessEndsAt
          ? `Votre accès Plus reste disponible jusqu’au ${accessEndsAt}.`
          : "Votre espace DevisVéto reste accessible pour retrouver les informations conservées dans votre compte."}
      </InfoCard>
      <EmailButton href={url}>Accéder à mon espace</EmailButton>
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
      "Confirmation d’annulation de votre abonnement",
      "Votre abonnement DevisVéto a bien été annulé.",
      accessEndsAt ? `Votre accès Plus reste disponible jusqu’au ${accessEndsAt}.` : null,
      `Accéder à mon espace : ${url}`,
    ]),
  };
}

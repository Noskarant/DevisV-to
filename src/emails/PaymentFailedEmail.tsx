import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, lines, type EmailTemplateResult } from "./utils";

export type PaymentFailedEmailProps = {
  billingPortalUrl?: string | null;
};

export function PaymentFailedEmail({ billingPortalUrl }: PaymentFailedEmailProps) {
  const baseUrl = appUrl();
  const url = absoluteUrl(billingPortalUrl, "/dashboard");

  return (
    <EmailLayout appUrl={baseUrl} preview="Une action est requise pour votre abonnement DevisVéto." title="Action requise">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Stripe nous indique que le dernier paiement de votre abonnement DevisVéto ne peut pas être
        confirmé.
      </Text>
      <InfoCard title="Que faire ?" tone="warning">
        Vous pouvez mettre à jour votre moyen de paiement depuis votre espace de gestion sécurisé.
        Votre espace reste le point de départ pour gérer votre abonnement.
      </InfoCard>
      <EmailButton href={url}>Mettre à jour mon moyen de paiement</EmailButton>
      <Text style={emailSmallText}>
        Lien de secours :{" "}
        <Link href={url} style={{ color: "#0c5b50" }}>
          {url}
        </Link>
      </Text>
    </EmailLayout>
  );
}

PaymentFailedEmail.PreviewProps = {
  billingPortalUrl: "https://www.devisveto.fr/dashboard",
} satisfies PaymentFailedEmailProps;

export default PaymentFailedEmail;

export function paymentFailedEmail(props: PaymentFailedEmailProps): EmailTemplateResult {
  const url = absoluteUrl(props.billingPortalUrl, "/dashboard");
  return {
    subject: EMAIL_SUBJECTS.paymentFailed,
    react: <PaymentFailedEmail {...props} billingPortalUrl={url} />,
    text: lines([
      "Action requise pour votre abonnement DevisVéto",
      "Le dernier paiement de votre abonnement n’a pas pu être confirmé.",
      "Vous pouvez mettre à jour votre moyen de paiement depuis votre espace.",
      `Mettre à jour mon moyen de paiement : ${url}`,
    ]),
  };
}

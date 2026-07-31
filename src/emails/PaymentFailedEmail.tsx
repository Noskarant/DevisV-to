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
    <EmailLayout appUrl={baseUrl} preview="Une action est requise pour votre abonnement DevisVeto." title="Action requise">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Stripe nous indique que le dernier paiement de votre abonnement DevisVeto ne peut pas etre
        confirme.
      </Text>
      <InfoCard title="Que faire ?" tone="warning">
        Vous pouvez mettre a jour votre moyen de paiement depuis votre espace de gestion securise.
        Votre espace reste le point de depart pour gerer votre abonnement.
      </InfoCard>
      <EmailButton href={url}>Mettre a jour mon moyen de paiement</EmailButton>
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
      "Action requise pour votre abonnement DevisVeto",
      "Le dernier paiement de votre abonnement n'a pas pu etre confirme.",
      "Vous pouvez mettre a jour votre moyen de paiement depuis votre espace.",
      `Mettre a jour mon moyen de paiement : ${url}`,
    ]),
  };
}

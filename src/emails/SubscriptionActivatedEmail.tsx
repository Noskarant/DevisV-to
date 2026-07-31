import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, formatDate, lines, type EmailTemplateResult } from "./utils";

export type SubscriptionActivatedEmailProps = {
  planLabel?: string | null;
  startedAt?: string | Date | null;
  nextBillingAt?: string | Date | null;
  dashboardUrl?: string | null;
};

export function SubscriptionActivatedEmail(props: SubscriptionActivatedEmailProps) {
  const baseUrl = appUrl();
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  const startedAt = formatDate(props.startedAt || new Date());
  const nextBillingAt = formatDate(props.nextBillingAt);
  const plan = props.planLabel?.trim() || "DevisVéto Plus";

  return (
    <EmailLayout appUrl={baseUrl} preview="Votre abonnement DevisVéto est actif." title="Abonnement actif">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Votre abonnement {plan} est actif. Vous pouvez continuer à organiser vos animaux et vos
        documents depuis votre espace.
      </Text>
      <InfoCard title="Details" tone="success">
        <Text style={{ margin: "0 0 6px" }}>Formule : {plan}</Text>
        {startedAt ? <Text style={{ margin: "0 0 6px" }}>Début : {startedAt}</Text> : null}
        {nextBillingAt ? <Text style={{ margin: "0" }}>Prochaine échéance : {nextBillingAt}</Text> : null}
      </InfoCard>
      <InfoCard title="Inclus">
        Cette formule permet de conserver vos analyses dans votre espace et d’utiliser les crédits
        prévus par votre abonnement.
      </InfoCard>
      <EmailButton href={url}>Accéder à DevisVéto</EmailButton>
      <Text style={emailSmallText}>
        Lien de secours :{" "}
        <Link href={url} style={{ color: "#0c5b50" }}>
          {url}
        </Link>
      </Text>
    </EmailLayout>
  );
}

SubscriptionActivatedEmail.PreviewProps = {
  planLabel: "DevisVéto Plus",
  startedAt: "2026-07-31T10:30:00.000Z",
  nextBillingAt: "2026-08-31T10:30:00.000Z",
  dashboardUrl: "https://www.devisveto.fr/dashboard",
} satisfies SubscriptionActivatedEmailProps;

export default SubscriptionActivatedEmail;

export function subscriptionActivatedEmail(props: SubscriptionActivatedEmailProps): EmailTemplateResult {
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  const startedAt = formatDate(props.startedAt || new Date());
  const nextBillingAt = formatDate(props.nextBillingAt);
  return {
    subject: EMAIL_SUBJECTS.subscriptionActivated,
    react: <SubscriptionActivatedEmail {...props} dashboardUrl={url} />,
    text: lines([
      "Votre abonnement DevisVéto est actif",
      `Formule : ${props.planLabel?.trim() || "DevisVéto Plus"}`,
      startedAt ? `Début : ${startedAt}` : null,
      nextBillingAt ? `Prochaine échéance : ${nextBillingAt}` : null,
      `Accéder à DevisVéto : ${url}`,
    ]),
  };
}

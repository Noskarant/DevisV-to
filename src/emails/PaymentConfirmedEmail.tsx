import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import {
  absoluteUrl,
  appUrl,
  formatDate,
  formatEuros,
  lines,
  type EmailTemplateResult,
} from "./utils";

export type PaymentConfirmedEmailProps = {
  petName?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  productLabel?: string | null;
  paidAt?: string | Date | null;
  dashboardUrl?: string | null;
};

export function PaymentConfirmedEmail(props: PaymentConfirmedEmailProps) {
  const baseUrl = appUrl();
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  const animal = props.petName?.trim() || "votre animal";
  const amount = formatEuros(props.amountCents, props.currency || "eur");
  const date = formatDate(props.paidAt || new Date());
  const product = props.productLabel?.trim() || "Analyse DevisVeto";

  return (
    <EmailLayout appUrl={baseUrl} preview="Votre paiement DevisVeto est confirme." title="Paiement confirme">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Votre paiement est confirme. Le rapport lie au document de {animal} est rattache a
        votre espace.
      </Text>
      <InfoCard title="Recapitulatif" tone="success">
        <Text style={{ margin: "0 0 6px" }}>Statut : confirme</Text>
        <Text style={{ margin: "0 0 6px" }}>Formule : {product}</Text>
        {amount ? <Text style={{ margin: "0 0 6px" }}>Montant : {amount}</Text> : null}
        {date ? <Text style={{ margin: "0" }}>Date : {date}</Text> : null}
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

PaymentConfirmedEmail.PreviewProps = {
  petName: "Nala",
  amountCents: 890,
  currency: "eur",
  productLabel: "Rapport DevisVeto",
  paidAt: "2026-07-31T10:30:00.000Z",
  dashboardUrl: "https://www.devisveto.fr/dashboard",
} satisfies PaymentConfirmedEmailProps;

export default PaymentConfirmedEmail;

export function paymentConfirmedEmail(props: PaymentConfirmedEmailProps): EmailTemplateResult {
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  const amount = formatEuros(props.amountCents, props.currency || "eur");
  const date = formatDate(props.paidAt || new Date());
  return {
    subject: EMAIL_SUBJECTS.paymentConfirmed,
    react: <PaymentConfirmedEmail {...props} dashboardUrl={url} />,
    text: lines([
      "Paiement confirme - DevisVeto",
      `Statut : confirme`,
      `Formule : ${props.productLabel?.trim() || "Analyse DevisVeto"}`,
      amount ? `Montant : ${amount}` : null,
      date ? `Date : ${date}` : null,
      `Acceder a mon espace : ${url}`,
    ]),
  };
}

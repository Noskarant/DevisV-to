import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, firstNameFromEmail, lines, type EmailTemplateResult } from "./utils";

export type WelcomeEmailProps = {
  email?: string | null;
  dashboardUrl?: string | null;
};

export function WelcomeEmail({ email, dashboardUrl }: WelcomeEmailProps) {
  const baseUrl = appUrl();
  const url = absoluteUrl(dashboardUrl, "/dashboard");
  const name = firstNameFromEmail(email);

  return (
    <EmailLayout appUrl={baseUrl} preview="Votre espace DevisVéto est prêt." title="Bienvenue sur DevisVéto">
      <Text style={emailText}>Bonjour{name ? ` ${name}` : ""},</Text>
      <Text style={emailText}>
        Votre espace est prêt. Vous pouvez y retrouver vos animaux, vos documents et vos analyses
        au même endroit.
      </Text>
      <InfoCard title="Prochaine étape">
        Ajoutez un devis ou une facture vétérinaire pour obtenir une lecture claire des lignes,
        des montants et des points à vérifier avec la clinique.
      </InfoCard>
      <EmailButton href={url}>Accéder à mon espace</EmailButton>
      <Text style={emailSmallText}>
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :{" "}
        <Link href={url} style={{ color: "#0c5b50" }}>
          {url}
        </Link>
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  email: "claire.martin@example.fr",
  dashboardUrl: "https://www.devisveto.fr/dashboard",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;

export function welcomeEmail(props: WelcomeEmailProps): EmailTemplateResult {
  const url = absoluteUrl(props.dashboardUrl, "/dashboard");
  return {
    subject: EMAIL_SUBJECTS.welcome,
    react: <WelcomeEmail {...props} dashboardUrl={url} />,
    text: lines([
      "Bienvenue sur DevisVéto",
      `Bonjour${firstNameFromEmail(props.email) ? ` ${firstNameFromEmail(props.email)}` : ""},`,
      "Votre espace est prêt. Vous pouvez y retrouver vos animaux, vos documents et vos analyses.",
      "Prochaine étape : ajoutez un devis ou une facture vétérinaire.",
      `Accéder à mon espace : ${url}`,
      "DevisVéto explique les documents vétérinaires et ne remplace pas l’avis de votre vétérinaire.",
    ]),
  };
}

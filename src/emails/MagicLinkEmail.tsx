import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, lines, type EmailTemplateResult } from "./utils";

export type MagicLinkEmailProps = {
  loginUrl?: string | null;
};

export function MagicLinkEmail({ loginUrl }: MagicLinkEmailProps) {
  const baseUrl = appUrl();
  const url = absoluteUrl(loginUrl, "/connexion");

  return (
    <EmailLayout appUrl={baseUrl} preview="Votre lien sécurisé DevisVéto est prêt." title="Connexion à votre espace">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Utilisez ce lien pour accéder à votre espace DevisVéto. Aucun mot de passe n’est nécessaire.
      </Text>
      <InfoCard title="Sécurité">
        Si vous n’avez pas demandé ce lien, vous pouvez simplement ignorer cet e-mail.
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

MagicLinkEmail.PreviewProps = {
  loginUrl: "https://www.devisveto.fr/auth/callback?code=demo",
} satisfies MagicLinkEmailProps;

export default MagicLinkEmail;

export function magicLinkEmail(props: MagicLinkEmailProps): EmailTemplateResult {
  const url = absoluteUrl(props.loginUrl, "/connexion");
  return {
    subject: EMAIL_SUBJECTS.magicLink,
    react: <MagicLinkEmail {...props} loginUrl={url} />,
    text: lines([
      "Connexion à votre espace DevisVéto",
      "Utilisez ce lien pour accéder à votre espace DevisVéto. Aucun mot de passe n’est nécessaire.",
      `Accéder à mon espace : ${url}`,
      "Si vous n’avez pas demandé ce lien, vous pouvez simplement ignorer cet e-mail.",
    ]),
  };
}

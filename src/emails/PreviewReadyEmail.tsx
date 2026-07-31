import { Link, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { InfoCard } from "./components/InfoCard";
import { emailSmallText, emailText } from "./styles";
import { EMAIL_SUBJECTS } from "./subjects";
import { absoluteUrl, appUrl, lines, type EmailTemplateResult } from "./utils";

export type PreviewReadyEmailProps = {
  petName?: string | null;
  previewUrl?: string | null;
};

export function PreviewReadyEmail({ petName, previewUrl }: PreviewReadyEmailProps) {
  const baseUrl = appUrl();
  const url = absoluteUrl(previewUrl, "/dashboard");
  const animal = petName?.trim() || "votre animal";

  return (
    <EmailLayout appUrl={baseUrl} preview="Votre analyse DevisVeto est disponible." title="Votre analyse est prete">
      <Text style={emailText}>Bonjour,</Text>
      <Text style={emailText}>
        Votre analyse du document de {animal} est terminee. Les principales lignes ont ete organisees
        pour vous aider a comprendre ce qui est prevu, ce qui manque et les questions utiles a poser.
      </Text>
      <InfoCard title="A retenir" tone="success">
        Cette lecture reste strictement documentaire : elle aide a lire le devis ou la facture, sans
        juger la necessite des soins ni remplacer la clinique.
      </InfoCard>
      <EmailButton href={url}>Voir mon analyse</EmailButton>
      <Text style={emailSmallText}>
        Lien de secours :{" "}
        <Link href={url} style={{ color: "#0c5b50" }}>
          {url}
        </Link>
      </Text>
    </EmailLayout>
  );
}

PreviewReadyEmail.PreviewProps = {
  petName: "Nala",
  previewUrl: "https://www.devisveto.fr/apercu/demo",
} satisfies PreviewReadyEmailProps;

export default PreviewReadyEmail;

export function previewReadyEmail(props: PreviewReadyEmailProps): EmailTemplateResult {
  const animal = props.petName?.trim() || "votre animal";
  const url = absoluteUrl(props.previewUrl, "/dashboard");
  return {
    subject: EMAIL_SUBJECTS.previewReady,
    react: <PreviewReadyEmail {...props} previewUrl={url} />,
    text: lines([
      "Votre analyse DevisVeto est prete",
      `L'analyse du document de ${animal} est terminee.`,
      "Les principales lignes ont ete organisees pour vous aider a comprendre le document et les questions a poser.",
      `Voir mon analyse : ${url}`,
      "DevisVeto ne remplace pas l'avis de votre veterinaire.",
    ]),
  };
}

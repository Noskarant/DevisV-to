import { Link, Text } from "@react-email/components";

const muted = "#718985";

type EmailFooterProps = {
  appUrl: string;
};

export function EmailFooter({ appUrl }: EmailFooterProps) {
  return (
    <>
      <Text
        style={{
          color: muted,
          fontSize: "12px",
          lineHeight: "18px",
          margin: "24px 0 0",
          textAlign: "center",
        }}
      >
        DevisVéto explique et organise les documents vétérinaires. Le service ne remplace pas
        un avis vétérinaire.
      </Text>
      <Text
        style={{
          color: "#8fa29e",
          fontSize: "11px",
          lineHeight: "17px",
          margin: "10px 0 0",
          textAlign: "center",
        }}
      >
        Besoin de support ? Contactez DevisVéto depuis{" "}
        <Link href={`${appUrl}/dashboard`} style={{ color: "#0c5b50", textDecoration: "underline" }}>
          votre espace
        </Link>
        .
      </Text>
    </>
  );
}

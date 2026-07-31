import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { EmailFooter } from "./EmailFooter";

type EmailLayoutProps = {
  appUrl: string;
  preview: string;
  title: string;
  children: ReactNode;
};

export function EmailLayout({ appUrl, preview, title, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f4f8f6",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          padding: "32px 12px",
        }}
      >
        <Container style={{ margin: "0 auto", maxWidth: "600px", width: "100%" }}>
          <Section
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #dbe9e5",
              borderRadius: "18px",
              boxShadow: "0 18px 48px rgba(12, 91, 80, 0.08)",
              padding: "34px 32px",
            }}
          >
            <Text
              style={{
                color: "#0c5b50",
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: "20px",
                margin: "0 0 4px",
              }}
            >
              DevisVéto
            </Text>
            <Text
              style={{
                color: "#79918c",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                lineHeight: "16px",
                margin: "0 0 26px",
                textTransform: "uppercase",
              }}
            >
              Votre devis, en clair
            </Text>
            <Heading
              as="h1"
              style={{
                color: "#123f38",
                fontSize: "26px",
                fontWeight: 800,
                lineHeight: "34px",
                margin: "0 0 16px",
              }}
            >
              {title}
            </Heading>
            {children}
          </Section>
          <EmailFooter appUrl={appUrl} />
        </Container>
      </Body>
    </Html>
  );
}

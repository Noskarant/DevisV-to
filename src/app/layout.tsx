import type { Metadata, Viewport } from "next";
import { Onest, Source_Sans_3 } from "next/font/google";
import { GlobalAccountBar } from "@/components/global-account-bar";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.devisveto.fr";

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "DevisVéto — Votre devis vétérinaire, expliqué clairement",
    template: "%s — DevisVéto",
  },
  description:
    "Comprenez chaque ligne de votre devis vétérinaire et préparez les bonnes questions à poser à votre vétérinaire, sans jugement médical ni comparaison de prix.",
  applicationName: "DevisVéto",
  authors: [{ name: "DevisVéto", url: appUrl }],
  creator: "DevisVéto",
  publisher: "DevisVéto",
  keywords: [
    "devis vétérinaire",
    "comprendre devis vétérinaire",
    "facture vétérinaire",
    "explication soins vétérinaires",
  ],
  category: "pets",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: appUrl,
    siteName: "DevisVéto",
    title: "DevisVéto — Votre devis vétérinaire, expliqué clairement",
    description:
      "Chaque ligne expliquée simplement et les questions utiles à poser à votre vétérinaire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevisVéto — Votre devis vétérinaire, expliqué clairement",
    description:
      "Chaque ligne expliquée simplement et les questions utiles à poser à votre vétérinaire.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fbfaf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DevisVéto",
    alternateName: "DevisVeto",
    url: appUrl,
    inLanguage: "fr-FR",
    description:
      "Service d’explication des devis et factures vétérinaires, sans diagnostic ni comparaison de prix.",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DevisVéto",
    url: appUrl,
    description:
      "DevisVéto aide les propriétaires d’animaux à comprendre les lignes d’un devis ou d’une facture vétérinaire.",
  };

  return (
    <html lang="fr" className={`${onest.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#fbfaf6] font-sans text-[#173b35]">
        <JsonLd data={[websiteJsonLd, organizationJsonLd]} />
        <GlobalAccountBar />
        {children}
      </body>
    </html>
  );
}

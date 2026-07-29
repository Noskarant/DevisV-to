import type { Metadata, Viewport } from "next";
import { Onest, Source_Sans_3 } from "next/font/google";
import { GlobalAccountBar } from "@/components/global-account-bar";
import "./globals.css";

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
  title: {
    default: "DevisVéto — Votre devis vétérinaire, expliqué clairement",
    template: "%s — DevisVéto",
  },
  description:
    "Comprenez chaque ligne de votre devis vétérinaire et préparez les bonnes questions à poser à votre vétérinaire, sans jugement médical ni comparaison de prix.",
  applicationName: "DevisVéto",
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
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "DevisVéto",
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
  return (
    <html lang="fr" className={`${onest.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#fbfaf6] font-sans text-[#173b35]">
        <GlobalAccountBar />
        {children}
      </body>
    </html>
  );
}

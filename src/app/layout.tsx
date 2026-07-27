import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full bg-[#fbfaf6] font-sans text-[#173b35]">{children}</body>
    </html>
  );
}

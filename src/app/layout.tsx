import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevisVéto — Comprenez votre devis vétérinaire",
  description:
    "Chaque ligne de votre devis vétérinaire expliquée simplement, avec les questions utiles à poser à votre vétérinaire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white font-sans">{children}</body>
    </html>
  );
}

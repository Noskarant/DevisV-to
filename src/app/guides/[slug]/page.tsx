import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "@/components/seo/guide-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getGuide, guides } from "@/lib/seo/guides";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.devisveto.fr";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) return {};

  const canonical = `/guides/${guide.slug}`;

  return {
    title: guide.metaTitle,
    description: guide.description,
    alternates: { canonical },
    keywords: [
      guide.metaTitle.toLowerCase(),
      "devis vétérinaire",
      "facture vétérinaire",
      "comprendre soins vétérinaires",
    ],
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url: canonical,
      title: guide.metaTitle,
      description: guide.description,
      siteName: "DevisVéto",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.description,
    },
  };
}

export default async function SeoGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) notFound();

  const pageUrl = `${appUrl}/guides/${guide.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "fr-FR",
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    mainEntityOfPage: pageUrl,
    author: {
      "@type": "Organization",
      name: "DevisVéto",
      url: appUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "DevisVéto",
      url: appUrl,
    },
    about: ["devis vétérinaire", "facture vétérinaire", "information des propriétaires d’animaux"],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: appUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${appUrl}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <GuidePage guide={guide} />
    </>
  );
}

import type { MetadataRoute } from "next";
import { guides } from "@/lib/seo/guides";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.devisveto.fr";
const contentUpdatedAt = new Date("2026-07-31T12:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${appUrl}/`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${appUrl}/analyser`,
      lastModified: contentUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${appUrl}/guides`,
      lastModified: contentUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${appUrl}/ce-que-fait-devisveto`,
      lastModified: contentUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${appUrl}/confidentialite`,
      lastModified: contentUpdatedAt,
      changeFrequency: "yearly",
      priority: 0.35,
    },
  ];

  const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${appUrl}/guides/${guide.slug}`,
    lastModified: new Date(`${guide.updatedAt}T12:00:00Z`),
    changeFrequency: "monthly",
    priority: guide.slug === "comprendre-devis-veterinaire" ? 0.85 : 0.75,
  }));

  return [...coreRoutes, ...guideRoutes];
}

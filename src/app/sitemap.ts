import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://devis-v-to.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1 },
    { path: "/analyser", priority: 0.9 },
    { path: "/guides/comprendre-devis-veterinaire", priority: 0.75 },
    { path: "/ce-que-fait-devisveto", priority: 0.65 },
    { path: "/confidentialite", priority: 0.45 },
  ];

  return routes.map((route) => ({
    url: `${appUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.priority,
  }));
}

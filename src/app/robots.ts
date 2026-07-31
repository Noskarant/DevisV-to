import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://devis-v-to.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/analyser",
          "/ce-que-fait-devisveto",
          "/confidentialite",
          "/guides/comprendre-devis-veterinaire",
        ],
        disallow: ["/admin", "/dashboard", "/apercu", "/api"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

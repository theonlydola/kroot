import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { games } from "@/data/games";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kroot.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Home pages for each locale
  for (const lang of locales) {
    entries.push({
      url: `${BASE_URL}/${lang}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}`])
        ),
      },
    });
  }

  // Game pages for each locale × slug
  for (const lang of locales) {
    for (const game of games) {
      entries.push({
        url: `${BASE_URL}/${lang}/games/${game.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}/games/${game.slug}`])
          ),
        },
      });
    }
  }

  return entries;
}

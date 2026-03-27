import { notFound } from "next/navigation";
import { type Locale } from "@/lib/i18n";
import { hasLocale, getDictionary } from "./dictionaries";
import { games } from "@/data/games";
import { GameCard } from "@/components/game/game-card";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kroot.online";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: dict.meta.siteName,
            url: `${BASE_URL}/${locale}`,
            description: dict.meta.siteDescription,
            inLanguage: locale === "ar" ? "ar-SA" : "en-US",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: dict.home.featuredGames,
            itemListElement: games.map((game, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${BASE_URL}/${locale}/games/${game.slug}`,
              name: game.name[locale],
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {dict.home.hero}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            {dict.home.heroSub}
          </p>
        </div>
      </section>

      {/* Game catalog */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
        <h2 className="mb-8 text-2xl font-bold text-foreground">
          {dict.home.featuredGames}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.slug}
              slug={game.slug}
              name={game.name[locale]}
              description={game.description[locale]}
              icon={game.icon}
              color={game.color}
              minPlayers={game.minPlayers}
              maxPlayers={game.maxPlayers}
              playersLabel={dict.home.players}
              playLabel={dict.home.playNow}
              lang={locale}
            />
          ))}
        </div>
      </section>
    </>
  );
}

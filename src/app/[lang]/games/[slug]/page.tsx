import { notFound } from "next/navigation";
import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { locales, type Locale, getDirection } from "@/lib/i18n";
import { hasLocale, getDictionary } from "@/app/[lang]/dictionaries";
import { games, getGameBySlug, getImposterGame, getTruthOrDareGame } from "@/data/games";
import { GamePlay } from "@/components/game/game-play";
import { ImposterWithMode } from "@/components/game/imposter-with-mode";
import { BadPeopleWithMode } from "@/components/game/bad-people-with-mode";
import { TruthOrDareGame } from "@/components/game/truth-or-dare-game";
import { PlayerIconsProvider } from "@/components/game/shared/player-icons-context";

export async function generateStaticParams() {
  return locales.flatMap((lang) =>
    games.map((game) => ({ lang, slug: game.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const locale = lang as Locale;
  const game = getGameBySlug(slug);
  if (!game) return {};
  const dict = await getDictionary(locale);
  const otherLang = locale === "en" ? "ar" : "en";
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kroot.online";

  return {
    title: game.name[locale],
    description: game.description[locale],
    keywords:
      locale === "ar"
        ? [game.name.ar, "ألعاب ورق", "ألعاب جماعية", "كروت", "ألعاب حفلات"]
        : [game.name.en, "card games", "party games", "kroot", "group games"],
    alternates: {
      canonical: `/${locale}/games/${slug}`,
      languages: {
        [locale]: `/${locale}/games/${slug}`,
        [otherLang]: `/${otherLang}/games/${slug}`,
        "x-default": `/en/games/${slug}`,
      },
    },
    openGraph: {
      title: `${game.name[locale]} | ${dict.meta.siteName}`,
      description: game.description[locale],
      siteName: dict.meta.siteName,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_EG",
      type: "website",
      url: `${BASE_URL}/${locale}/games/${slug}`,
    },
    twitter: {
      card: "summary",
      title: `${game.name[locale]} | ${dict.meta.siteName}`,
      description: game.description[locale],
    },
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();

  const locale = lang as Locale;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const dict = await getDictionary(locale);
  const dir = getDirection(locale);
  const isRtl = dir === "rtl";
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href={`/${locale}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <BackArrow className="size-4" />
        {dict.game.backToGames}
      </Link>

      {/* Game header */}
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">{game.icon}</span>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {game.name[locale]}
        </h1>
        <p className="max-w-lg text-muted-foreground">
          {game.description[locale]}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>
            {game.minPlayers}–{game.maxPlayers} {dict.home.players}
          </span>
        </div>
      </div>

      {/* How to play */}
      <div className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          {dict.game.howToPlay}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {game.howToPlay[locale]}
        </p>
      </div>

      {/* Game play */}
      <PlayerIconsProvider>
      {game.slug === "imposter" ? (
        <ImposterWithMode
          categories={getImposterGame().categories[locale]}
          dict={dict.imposter}
          onlineDict={dict.online}
          slug={slug}
          lang={locale}
        />
      ) : game.slug === "bad-people" ? (
        <BadPeopleWithMode
          cards={game.cards![locale]}
          dict={dict.badPeople}
          onlineDict={dict.online}
          slug={slug}
          lang={locale}
        />
      ) : game.slug === "truth-or-dare" ? (
        <TruthOrDareGame
          truths={getTruthOrDareGame().truths[locale]}
          dares={getTruthOrDareGame().dares[locale]}
          dict={dict.truthOrDare}
          slug={slug}
          lang={locale}
        />
      ) : (
        <GamePlay cards={game.cards![locale]} dict={dict.game} isRtl={isRtl} />
      )}
      </PlayerIconsProvider>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: game.name[locale],
            description: game.description[locale],
            applicationCategory: "GameApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            inLanguage: locale === "ar" ? "ar-SA" : "en-US",
          }),
        }}
      />
    </div>
  );
}

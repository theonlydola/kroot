import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { type Locale, getDirection } from "@/lib/i18n";
import { hasLocale, getDictionary } from "@/app/[lang]/dictionaries";
import { getGameBySlug, getImposterGame } from "@/data/games";
import { getRoomById } from "@/app/[lang]/games/[slug]/online/actions";
import { PlayerIconsProvider } from "@/components/game/shared/player-icons-context";
import { OnlineRoomClient } from "./client";

export default async function OnlineRoomPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string; roomId: string }>;
}) {
  const { lang, slug, roomId } = await params;
  if (!hasLocale(lang)) notFound();

  const locale = lang as Locale;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  // Only imposter supports online for now
  if (slug !== "imposter") notFound();

  const room = await getRoomById(roomId);
  if (!room) notFound();

  const dict = await getDictionary(locale);
  const dir = getDirection(locale);
  const isRtl = dir === "rtl";
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const imposterData = getImposterGame();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href={`/${locale}/games/${slug}`}
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

      {/* Online Game */}
      <PlayerIconsProvider>
        <OnlineRoomClient
          room={room}
          categories={imposterData.categories[locale]}
          dict={dict.imposter}
          onlineDict={dict.online}
          slug={slug}
          lang={locale}
        />
      </PlayerIconsProvider>
    </div>
  );
}

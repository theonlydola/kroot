"use client";

import { useState } from "react";
import type { Room } from "@/lib/room-types";
import { joinRoom } from "@/app/[lang]/games/[slug]/online/actions";
import { OnlineImposterGame, type OnlineImposterGameProps } from "@/components/game/online-imposter-game";
import { JoinRoom } from "@/components/game/shared/join-room";

type CategoryKey = "food" | "animals" | "objects";
type WordPair = { word: string; imposter: string };

type OnlineRoomClientProps = {
  room: Room;
  categories: Record<CategoryKey, WordPair[]>;
  dict: Record<string, string>;
  onlineDict: Record<string, string>;
  slug: string;
  lang: string;
};

const PLAYER_ID_KEY = "kroot-online-player-id";
const PLAYER_ROOM_KEY = "kroot-online-room-id";

export function OnlineRoomClient({
  room,
  categories,
  dict,
  onlineDict,
  slug,
  lang,
}: OnlineRoomClientProps) {
  const [playerId, setPlayerId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const storedPlayerId = sessionStorage.getItem(PLAYER_ID_KEY);
    const storedRoomId = sessionStorage.getItem(PLAYER_ROOM_KEY);
    if (storedPlayerId && storedRoomId === room.id) {
      const isInRoom = room.players.some((p) => p.id === storedPlayerId);
      if (isInRoom) return storedPlayerId;
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const loading = false;

  const handleJoin = async (code: string, name: string) => {
    setError(null);
    const result = await joinRoom(code, name);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    sessionStorage.setItem(PLAYER_ID_KEY, result.playerId);
    sessionStorage.setItem(PLAYER_ROOM_KEY, result.roomId);
    setPlayerId(result.playerId);

    // Reload to get fresh room data with new player
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not in the room yet — show join form
  if (!playerId) {
    return (
      <JoinRoom
        onJoin={handleJoin}
        onBack={() => {
          window.location.href = `/${lang}/games/${slug}`;
        }}
        error={error}
        initialCode={room.code}
        dict={{
          joinRoom: onlineDict.joinRoom,
          enterCode: onlineDict.enterCode,
          enterName: onlineDict.enterName,
          namePlaceholder: onlineDict.namePlaceholder,
          codePlaceholder: onlineDict.codePlaceholder,
          join: onlineDict.join,
        }}
      />
    );
  }

  // In the room — render the game
  return (
    <OnlineImposterGame
      room={room}
      playerId={playerId}
      categories={categories}
      dict={dict as OnlineImposterGameProps["dict"]}
      onlineDict={onlineDict as OnlineImposterGameProps["onlineDict"]}
      slug={slug}
      lang={lang}
    />
  );
}

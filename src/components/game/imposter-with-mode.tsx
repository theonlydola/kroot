"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ModeSelector } from "./shared/mode-selector";
import { JoinRoom } from "./shared/join-room";
import { ImposterGame, type ImposterGameProps } from "./imposter-game";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { createRoom, joinRoom } from "@/app/[lang]/games/[slug]/online/actions";
import type { ImposterGameConfig } from "@/lib/room-types";

type CategoryKey = "food" | "animals" | "objects";
type WordPair = { word: string; imposter: string };

const ROUND_OPTIONS = [3, 5, 7, 10];
const PLAYER_ID_KEY = "kroot-online-player-id";
const PLAYER_ROOM_KEY = "kroot-online-room-id";

type ImposterWithModeProps = {
  categories: Record<CategoryKey, WordPair[]>;
  dict: Record<string, string>;
  onlineDict: {
    playLocal: string;
    playOnline: string;
    localDesc: string;
    onlineDesc: string;
    createRoom: string;
    joinRoom: string;
    enterCode: string;
    enterName: string;
    namePlaceholder: string;
    codePlaceholder: string;
    join: string;
    or: string;
  };
  slug: string;
  lang: string;
};

type OnlineStep = "choose" | "host-setup" | "join";

export function ImposterWithMode({
  categories,
  dict,
  onlineDict,
  slug,
  lang,
}: ImposterWithModeProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"select" | "local" | "online">("select");
  const [onlineStep, setOnlineStep] = useState<OnlineStep>("choose");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Host setup state
  const [hostName, setHostName] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [roundMinutes, setRoundMinutes] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(10);

  const categoryLabels: Record<CategoryKey, string> = {
    food: dict.food,
    animals: dict.animals,
    objects: dict.objects,
  };

  const handleCreateRoom = useCallback(async () => {
    if (!hostName.trim()) return;
    setLoading(true);
    setError(null);

    const config: ImposterGameConfig = {
      category,
      roundMinutes,
      maxPlayers,
    };

    const result = await createRoom(slug, hostName.trim(), config);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Store player ID in sessionStorage
    sessionStorage.setItem(PLAYER_ID_KEY, result.playerId);
    sessionStorage.setItem(PLAYER_ROOM_KEY, result.roomId);

    // Navigate to the room
    router.push(`/${lang}/games/${slug}/online/${result.roomId}`);
  }, [hostName, category, roundMinutes, maxPlayers, slug, lang, router]);

  const handleJoinRoom = useCallback(
    async (code: string, name: string) => {
      setError(null);
      const result = await joinRoom(code, name);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      sessionStorage.setItem(PLAYER_ID_KEY, result.playerId);
      sessionStorage.setItem(PLAYER_ROOM_KEY, result.roomId);
      router.push(`/${lang}/games/${slug}/online/${result.roomId}`);
    },
    [slug, lang, router],
  );

  // ─── Mode Selection ────────────────────────────────────────────
  if (mode === "select") {
    return (
      <ModeSelector
        onSelectLocal={() => setMode("local")}
        onSelectOnline={() => setMode("online")}
        dict={onlineDict}
      />
    );
  }

  // ─── Local Mode — existing game ────────────────────────────────
  if (mode === "local") {
    return (
      <ImposterGame
        categories={categories}
        dict={dict as ImposterGameProps["dict"]}
        slug={slug}
        lang={lang}
      />
    );
  }

  // ─── Online Mode ───────────────────────────────────────────────

  // Online: choose create or join
  if (onlineStep === "choose") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => setMode("select")}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground touch-manipulation"
          >
            <ArrowLeft className="size-4" />
            {dict.newGame || "Back"}
          </button>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setOnlineStep("host-setup")}
            >
              {onlineDict.createRoom}
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">
                {onlineDict.or}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => setOnlineStep("join")}
            >
              {onlineDict.joinRoom}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Online: join an existing room
  if (onlineStep === "join") {
    return (
      <JoinRoom
        onJoin={handleJoinRoom}
        onBack={() => setOnlineStep("choose")}
        error={error}
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

  // Online: host setup — configure game and create room
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlineStep("choose")}
            className="rounded-lg p-1.5 hover:bg-muted touch-manipulation"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="text-xl font-bold">{onlineDict.createRoom}</h2>
        </div>

        {/* Host Name */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {onlineDict.enterName}
          </label>
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder={onlineDict.namePlaceholder}
            maxLength={20}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-foreground">
            {dict.chooseCategory}
          </label>
          <div className="flex flex-wrap gap-2">
            {(["food", "animals", "objects"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all touch-manipulation ${
                  category === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {cat === "food" ? "🍕 " : cat === "animals" ? "🐾 " : "📦 "}
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Round Length */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-foreground">
            {dict.roundLength}
          </label>
          <div className="flex flex-wrap gap-2">
            {ROUND_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setRoundMinutes(mins)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all touch-manipulation ${
                  roundMinutes === mins
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {mins} {dict.minutes}
              </button>
            ))}
          </div>
        </div>

        {/* Max Players */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-foreground">
            {dict.numberOfPlayers} (max)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={maxPlayers <= 3}
              onClick={() => setMaxPlayers((n) => n - 1)}
              className="flex size-10 items-center justify-center rounded-xl border text-lg font-medium transition-all touch-manipulation border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-md font-semibold text-foreground">
              {maxPlayers}
            </span>
            <button
              type="button"
              disabled={maxPlayers >= 10}
              onClick={() => setMaxPlayers((n) => n + 1)}
              className="flex size-10 items-center justify-center rounded-xl border text-lg font-medium transition-all touch-manipulation border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              +
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-3 text-center text-sm text-red-500">{error}</p>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleCreateRoom}
          disabled={!hostName.trim() || loading}
        >
          <Play className="size-4" />
          {loading ? "..." : onlineDict.createRoom}
        </Button>
      </div>
    </div>
  );
}

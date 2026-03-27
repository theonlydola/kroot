"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  ChevronRight,
  Eye,
  Sparkles,
  Check,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  Room,
  RoomPlayer,
  ImposterOnlineState,
  BroadcastEvent,
} from "@/lib/room-types";
import {
  updateRoomState,
  submitVote,
  markPlayerReady,
} from "@/app/[lang]/games/[slug]/online/actions";
import { OnlineLobby } from "./shared/online-lobby";
import { CountdownTimer } from "./shared/countdown-timer";
import { PlayerIconStrip } from "./shared/player-icon-strip";
import { RoundInfo } from "./shared/round-info";
import { PlayerVoteGrid } from "./shared/player-vote-grid";
import { usePlayerIcons } from "./shared/player-icons-context";

type CategoryKey = "food" | "animals" | "objects";
type WordPair = { word: string; imposter: string };

export type OnlineImposterGameProps = {
  room: Room;
  playerId: string;
  categories: Record<CategoryKey, WordPair[]>;
  dict: {
    // Imposter dict
    setupTitle: string;
    chooseCategory: string;
    roundLength: string;
    minutes: string;
    startGame: string;
    food: string;
    animals: string;
    objects: string;
    tapToReveal: string;
    yourWord: string;
    youAreImposter: string;
    allReady: string;
    startRound: string;
    timeUp: string;
    voteNow: string;
    revealImposter: string;
    imposterWas: string;
    theWordWas: string;
    playAgain: string;
    newGame: string;
    round: string;
    player: string;
    whoIsImposter: string;
    imposterGuessTitle: string;
    imposterGuessDesc: string;
    guessCorrect: string;
    guessWrong: string;
    results: string;
    votesLabel: string;
    correct: string;
    wrong: string;
  };
  onlineDict: {
    roomCode: string;
    copyLink: string;
    copied: string;
    scanQR: string;
    waitingForPlayers: string;
    waitingForHost: string;
    playersCount: string;
    startGame: string;
    needMorePlayers: string;
    youAreHost: string;
    kick: string;
    leaveRoom: string;
    endGame: string;
    nextRound: string;
    everyoneReady: string;
    waitingForCards: string;
    cardsSeen: string;
    votesIn: string;
    waitingForVotes: string;
    waitingForImposter: string;
    youVoted: string;
    or: string;
  };
  slug: string;
  lang: string;
};

export function OnlineImposterGame({
  room: initialRoom,
  playerId,
  categories,
  dict,
  onlineDict,
  slug,
  lang,
}: OnlineImposterGameProps) {
  const PLAYER_ICONS = usePlayerIcons();
  const isHost = initialRoom.host_id === playerId;
  const [room, setRoom] = useState<Room>(initialRoom);
  const [gameState, setGameState] = useState<ImposterOnlineState>(
    initialRoom.game_state,
  );
  const [players, setPlayers] = useState<RoomPlayer[]>(initialRoom.players);
  const [connected, setConnected] = useState(true);

  // Local UI state
  const [revealed, setRevealed] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [imposterGuessResult, setImposterGuessResult] = useState<
    boolean | null
  >(null);

  // My player index
  const myIndex = players.findIndex((p) => p.id === playerId);

  // Word assignment: stored per-round so only the host knows all words
  const [myWord, setMyWord] = useState<string | null>(null);
  const [amImposter, setAmImposter] = useState(false);

  const channelRef = useRef<ReturnType<
    ReturnType<typeof getSupabaseBrowserClient>["channel"]
  > | null>(null);

  const getPlayerName = useCallback(
    (index: number) =>
      players[index]?.name || `${dict.player} ${index + 1}`,
    [players, dict.player],
  );

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`game:${room.id}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: "game-event" }, ({ payload }) => {
        const event = payload as BroadcastEvent;
        handleBroadcastEvent(event);
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          setPlayers(updated.players);
          setGameState(updated.game_state);
        },
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  const broadcast = useCallback(
    (event: BroadcastEvent) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "game-event",
        payload: event,
      });
    },
    [],
  );

  const handleBroadcastEvent = useCallback(
    (event: BroadcastEvent) => {
      switch (event.type) {
        case "game:start":
        case "game:phase":
        case "game:reveal":
        case "game:scores":
        case "game:next-round":
        case "game:over":
          setGameState(event.state);
          if (
            event.type === "game:next-round" ||
            event.type === "game:start"
          ) {
            setRevealed(false);
            setHasVoted(false);
            setImposterGuessResult(null);
            setMyWord(null);
            setAmImposter(false);
          }
          if ("players" in event) {
            setPlayers(event.players);
          }
          break;
        case "imposter:guess":
          setImposterGuessResult(event.result);
          setGameState(event.state);
          break;
        case "player:joined":
          setPlayers(event.players);
          break;
        case "player:left":
          setPlayers(event.players);
          break;
        case "player:ready":
        case "player:vote":
          // State will update via postgres_changes
          break;
      }
    },
    [],
  );

  // ─── Host: Start Game ──────────────────────────────────────────
  const startGame = useCallback(async () => {
    if (!isHost) return;

    const category = (room.game_config.category || "food") as CategoryKey;
    const pool = categories[category];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const imposterIdx = Math.floor(Math.random() * players.length);

    const newState: ImposterOnlineState = {
      phase: "dealing",
      round: 1,
      word: pick.word,
      imposterIndex: imposterIdx,
      timerEnd: 0,
      votes: {},
      readyPlayers: [],
      scores: Array(players.length).fill(0),
      imposterGuessResult: null,
      imposterGuessOptions: [],
    };

    await updateRoomState(room.id, playerId, newState, "playing");
    broadcast({ type: "game:start", state: newState, players });
    setGameState(newState);
    setRevealed(false);
    setHasVoted(false);
    setMyWord(null);
    setAmImposter(false);
  }, [isHost, room, categories, players, playerId, broadcast]);

  // ─── Handle card reveal ────────────────────────────────────────
  const handleRevealCard = useCallback(async () => {
    if (revealed) return;

    // Determine my word based on game state
    const isImposter = myIndex === gameState.imposterIndex;
    setAmImposter(isImposter);
    setMyWord(isImposter ? null : gameState.word);
    setRevealed(true);

    // Mark self as ready
    const result = await markPlayerReady(room.id, playerId);
    if (result.success) {
      broadcast({ type: "player:ready", playerId });
    }
  }, [
    revealed,
    myIndex,
    gameState.imposterIndex,
    gameState.word,
    room.id,
    playerId,
    broadcast,
  ]);

  // ─── Host: Start Timer ─────────────────────────────────────────
  const startTimer = useCallback(async () => {
    if (!isHost) return;

    const roundMinutes = room.game_config.roundMinutes || 5;
    const end = Date.now() + roundMinutes * 60 * 1000;
    const newState: ImposterOnlineState = {
      ...gameState,
      phase: "timer",
      timerEnd: end,
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:phase", state: newState });
    setGameState(newState);
  }, [isHost, room, gameState, playerId, broadcast]);

  // ─── Host: Move to Voting ──────────────────────────────────────
  const startVoting = useCallback(async () => {
    if (!isHost) return;

    const newState: ImposterOnlineState = {
      ...gameState,
      phase: "voting",
      votes: {},
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:phase", state: newState });
    setGameState(newState);
    setHasVoted(false);
  }, [isHost, gameState, room.id, playerId, broadcast]);

  // ─── Player: Vote ──────────────────────────────────────────────
  const handleVote = useCallback(
    async (votedForIndex: number) => {
      if (hasVoted) return;

      const result = await submitVote(room.id, playerId, votedForIndex);
      if (result.success) {
        setHasVoted(true);
        broadcast({
          type: "player:vote",
          playerId,
          voteCount: result.voteCount,
        });
      }
    },
    [hasVoted, room.id, playerId, broadcast],
  );

  // ─── Host: Reveal ──────────────────────────────────────────────
  const handleReveal = useCallback(async () => {
    if (!isHost) return;

    // Calculate scores
    const newScores = [...gameState.scores];
    for (const [pId, votedFor] of Object.entries(gameState.votes)) {
      const voterIdx = players.findIndex((p) => p.id === pId);
      if (voterIdx !== gameState.imposterIndex && votedFor === gameState.imposterIndex) {
        newScores[voterIdx] += 1;
      }
    }

    // Generate imposter guess options
    const category = (room.game_config.category || "food") as CategoryKey;
    const pool = categories[category];
    const others = pool.map((p) => p.word).filter((w) => w !== gameState.word);
    const picks = others.sort(() => Math.random() - 0.5).slice(0, 4);
    picks.push(gameState.word);
    const shuffledOptions = picks.sort(() => Math.random() - 0.5);

    const newState: ImposterOnlineState = {
      ...gameState,
      phase: "reveal",
      scores: newScores,
      imposterGuessOptions: shuffledOptions,
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:reveal", state: newState });
    setGameState(newState);
  }, [isHost, gameState, players, room, categories, playerId, broadcast]);

  // ─── Host/Imposter: Move to Imposter Guess ─────────────────────
  const moveToImposterGuess = useCallback(async () => {
    if (!isHost) return;

    const newState: ImposterOnlineState = {
      ...gameState,
      phase: "imposter-guess",
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:phase", state: newState });
    setGameState(newState);
  }, [isHost, gameState, room.id, playerId, broadcast]);

  // ─── Imposter: Guess Word ──────────────────────────────────────
  const handleImposterGuess = useCallback(
    async (guessedWord: string) => {
      const correct = guessedWord === gameState.word;
      setImposterGuessResult(correct);

      const newScores = [...gameState.scores];
      if (correct) {
        newScores[gameState.imposterIndex] += 1;
      }

      const newState: ImposterOnlineState = {
        ...gameState,
        scores: newScores,
        imposterGuessResult: correct,
      };

      // Only host can update server—if imposter is not host, broadcast the guess
      if (isHost) {
        setTimeout(async () => {
          const resultsState = { ...newState, phase: "results" as const };
          await updateRoomState(room.id, playerId, resultsState);
          broadcast({ type: "imposter:guess", result: correct, state: resultsState });
          setGameState(resultsState);
        }, 1500);
      } else {
        // Non-host imposter: ask host to process via broadcast
        // For simplicity, update state directly — host will also see postgres change
        setTimeout(async () => {
          const resultsState = { ...newState, phase: "results" as const };
          await updateRoomState(room.id, initialRoom.host_id, resultsState);
          broadcast({ type: "imposter:guess", result: correct, state: resultsState });
          setGameState(resultsState);
        }, 1500);
      }
    },
    [gameState, isHost, room.id, playerId, initialRoom.host_id, broadcast],
  );

  // ─── Host: Next Round ──────────────────────────────────────────
  const startNextRound = useCallback(async () => {
    if (!isHost) return;

    const category = (room.game_config.category || "food") as CategoryKey;
    const pool = categories[category];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const imposterIdx = Math.floor(Math.random() * players.length);

    const newState: ImposterOnlineState = {
      ...gameState,
      phase: "dealing",
      round: gameState.round + 1,
      word: pick.word,
      imposterIndex: imposterIdx,
      timerEnd: 0,
      votes: {},
      readyPlayers: [],
      imposterGuessResult: null,
      imposterGuessOptions: [],
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:next-round", state: newState });
    setGameState(newState);
    setRevealed(false);
    setHasVoted(false);
    setMyWord(null);
    setAmImposter(false);
    setImposterGuessResult(null);
  }, [isHost, room, categories, players, gameState, playerId, broadcast]);

  // ─── Host: End Game ────────────────────────────────────────────
  const endGame = useCallback(async () => {
    if (!isHost) return;

    const newState: ImposterOnlineState = {
      ...gameState,
      phase: "results",
    };

    await updateRoomState(room.id, playerId, newState, "finished");
    broadcast({ type: "game:over", state: newState });
  }, [isHost, gameState, room.id, playerId, broadcast]);

  // ─── Handle kick ───────────────────────────────────────────────
  const handleKick = useCallback(
    async (targetPlayerId: string) => {
      const { removePlayer } = await import(
        "@/app/[lang]/games/[slug]/online/actions"
      );
      await removePlayer(room.id, playerId, targetPlayerId);
      broadcast({ type: "player:kicked", playerId: targetPlayerId });
    },
    [room.id, playerId, broadcast],
  );

  // ─── Handle leave ──────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/${lang}/games/${slug}`;
    }
  }, [lang, slug]);

  // ─── Connection indicator ──────────────────────────────────────
  const ConnectionBadge = () => (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        connected
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {connected ? (
        <Wifi className="size-3" />
      ) : (
        <WifiOff className="size-3" />
      )}
      {room.code}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER PHASES
  // ═══════════════════════════════════════════════════════════════

  // ─── Lobby Phase ───────────────────────────────────────────────
  if (gameState.phase === "lobby") {
    return (
      <OnlineLobby
        room={room}
        playerId={playerId}
        isHost={isHost}
        onStart={startGame}
        onKick={handleKick}
        onLeave={handleLeave}
        minPlayers={3}
        dict={onlineDict}
        lang={lang}
        slug={slug}
      />
    );
  }

  // ─── Dealing Phase ─────────────────────────────────────────────
  if (gameState.phase === "dealing") {
    const allReady = gameState.readyPlayers.length >= players.length;

    return (
      <div className="flex flex-col items-center gap-6">
        <ConnectionBadge />
        <RoundInfo
          round={gameState.round}
          label={dict.round}
          extra={
            <span className="text-sm text-muted-foreground">
              {gameState.readyPlayers.length}/{players.length}{" "}
              {onlineDict.cardsSeen}
            </span>
          }
        />

        <PlayerIconStrip
          numPlayers={players.length}
          scores={gameState.scores}
          currentIndex={myIndex}
          getPlayerName={getPlayerName}
          variant="progress"
        />

        {!revealed ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="unrevealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <button
                type="button"
                onClick={handleRevealCard}
                className="flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-lg transition-shadow hover:shadow-xl touch-manipulation"
              >
                <span className="text-6xl">
                  {PLAYER_ICONS[myIndex] || "❓"}
                </span>
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  {dict.tapToReveal}
                </p>
                <Eye className="mt-2 size-8 text-muted-foreground/50" />
              </button>
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <div
                className={`flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-border p-6 shadow-lg ${
                  amImposter
                    ? "bg-gradient-to-br from-red-500/10 to-orange-500/10"
                    : "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                }`}
              >
                <span className="text-5xl">
                  {PLAYER_ICONS[myIndex] || "❓"}
                </span>
                {amImposter ? (
                  <p className="mt-4 text-lg font-bold text-red-500">
                    {dict.youAreImposter}
                  </p>
                ) : (
                  <>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {dict.yourWord}
                    </p>
                    <p className="mt-2 text-3xl font-bold">{myWord}</p>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Status: waiting for all to see cards */}
        {revealed && !allReady && (
          <p className="text-sm text-muted-foreground">
            {onlineDict.waitingForCards}
          </p>
        )}

        {/* Host: start round when all ready */}
        {allReady && isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button size="lg" onClick={startTimer}>
              {dict.startRound}
              <ChevronRight className="size-4" />
            </Button>
          </motion.div>
        )}

        {allReady && !isHost && (
          <p className="text-sm text-muted-foreground">
            {onlineDict.everyoneReady}
          </p>
        )}
      </div>
    );
  }

  // ─── Timer Phase ───────────────────────────────────────────────
  if (gameState.phase === "timer") {
    const roundMinutes = room.game_config.roundMinutes || 5;

    return (
      <div className="flex flex-col items-center gap-8">
        <ConnectionBadge />
        <RoundInfo round={gameState.round} label={dict.round} />

        <CountdownTimer
          endTime={gameState.timerEnd}
          totalSeconds={roundMinutes * 60}
          onTimeUp={() => {
            if (isHost) startVoting();
          }}
        />

        <PlayerIconStrip
          numPlayers={players.length}
          scores={gameState.scores}
          variant="vertical"
        />

        {isHost && (
          <Button variant="outline" onClick={startVoting}>
            {dict.voteNow}
          </Button>
        )}
      </div>
    );
  }

  // ─── Voting Phase ──────────────────────────────────────────────
  if (gameState.phase === "voting") {
    const voteCount = Object.keys(gameState.votes).length;
    const allVoted = voteCount >= players.length;

    return (
      <div className="flex flex-col items-center gap-6">
        <ConnectionBadge />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {dict.round} {gameState.round}
          </span>
          <span>•</span>
          <span>
            {voteCount}/{players.length} {onlineDict.votesIn}
          </span>
        </div>

        {!hasVoted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm"
          >
            <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-lg">
              <span className="text-4xl">
                {PLAYER_ICONS[myIndex] || "❓"}
              </span>
              <p className="mt-3 mb-4 text-lg font-bold">
                {dict.whoIsImposter}
              </p>
              <PlayerVoteGrid
                numPlayers={players.length}
                getPlayerName={getPlayerName}
                excludeIndices={[myIndex]}
                onVote={handleVote}
                layout="wrap"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <Check className="size-10 text-green-500" />
            <p className="mt-3 text-lg font-medium">{onlineDict.youVoted}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {onlineDict.waitingForVotes}
            </p>
          </motion.div>
        )}

        {/* Host: reveal when all voted */}
        {allVoted && isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button size="lg" onClick={handleReveal}>
              {dict.revealImposter}
              <ChevronRight className="size-4" />
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // ─── Reveal Phase ──────────────────────────────────────────────
  if (gameState.phase === "reveal") {
    return (
      <div className="flex flex-col items-center gap-6">
        <ConnectionBadge />
        <h2 className="text-2xl font-bold">{dict.revealImposter}</h2>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 px-10 py-6"
        >
          <span className="text-6xl">
            {PLAYER_ICONS[gameState.imposterIndex]}
          </span>
          <p className="text-sm text-muted-foreground">{dict.imposterWas}</p>
          <p className="text-xl font-bold">
            {getPlayerName(gameState.imposterIndex)}
          </p>
        </motion.div>

        {isHost && (
          <Button size="lg" onClick={moveToImposterGuess}>
            <ChevronRight className="size-4" />
            {dict.imposterGuessTitle}
          </Button>
        )}
      </div>
    );
  }

  // ─── Imposter Guess Phase ──────────────────────────────────────
  if (gameState.phase === "imposter-guess") {
    const isImposter = myIndex === gameState.imposterIndex;

    return (
      <div className="flex flex-col items-center gap-6">
        <ConnectionBadge />
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl">
            {PLAYER_ICONS[gameState.imposterIndex]}
          </span>
          <h2 className="text-xl font-bold">{dict.imposterGuessTitle}</h2>
          <p className="text-center text-sm text-muted-foreground">
            {dict.imposterGuessDesc}
          </p>
        </div>

        {isImposter && imposterGuessResult === null ? (
          <div className="flex w-full max-w-sm flex-wrap justify-center gap-3">
            {gameState.imposterGuessOptions.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleImposterGuess(option)}
                className="touch-manipulation rounded-xl border border-border bg-card px-5 py-3 text-lg font-medium transition-all hover:bg-muted active:scale-95"
              >
                {option}
              </button>
            ))}
          </div>
        ) : isImposter && imposterGuessResult !== null ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl p-6 text-center ${
              imposterGuessResult
                ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                : "bg-gradient-to-br from-red-500/10 to-orange-500/10"
            }`}
          >
            {imposterGuessResult ? (
              <Check className="mx-auto mb-2 size-8 text-green-600" />
            ) : (
              <X className="mx-auto mb-2 size-8 text-red-500" />
            )}
            <p className="text-lg font-bold">
              {imposterGuessResult ? dict.guessCorrect : dict.guessWrong}
            </p>
          </motion.div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {onlineDict.waitingForImposter}
          </p>
        )}
      </div>
    );
  }

  // ─── Results Phase ─────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">
      <ConnectionBadge />
      <h2 className="text-2xl font-bold">{dict.results}</h2>

      {/* Imposter reveal */}
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 px-8 py-4">
        <span className="text-4xl">
          {PLAYER_ICONS[gameState.imposterIndex]}
        </span>
        <p className="text-sm text-muted-foreground">{dict.imposterWas}</p>
        <p className="text-lg font-bold">
          {getPlayerName(gameState.imposterIndex)}
        </p>
      </div>

      {/* Word reveal */}
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 px-8 py-4">
        <Sparkles className="size-6 text-primary" />
        <p className="text-sm text-muted-foreground">{dict.theWordWas}</p>
        <p className="text-2xl font-bold">{gameState.word}</p>
      </div>

      {/* Vote breakdown + scores */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-center font-semibold">{dict.votesLabel}</h3>
        <div className="space-y-2">
          {Array.from({ length: players.length }, (_, i) => i)
            .sort(
              (a, b) =>
                (gameState.scores[b] ?? 0) - (gameState.scores[a] ?? 0),
            )
            .map((i) => {
              const isImp = i === gameState.imposterIndex;
              // Find if this player voted correctly
              const playerObj = players[i];
              const votedCorrectly =
                !isImp &&
                playerObj &&
                gameState.votes[playerObj.id] === gameState.imposterIndex;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="text-xl">{PLAYER_ICONS[i]}</span>
                  <span className="flex-1 text-sm font-medium">
                    {getPlayerName(i)}
                    {isImp && " 🕵️"}
                    {i === myIndex && " ★"}
                  </span>
                  {!isImp && (
                    <span
                      className={`text-xs font-medium ${
                        votedCorrectly ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {votedCorrectly ? dict.correct : dict.wrong}
                    </span>
                  )}
                  <span className="min-w-[2rem] text-end text-sm font-bold">
                    {gameState.scores[i] ?? 0}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Action buttons */}
      {isHost && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleLeave}>
            <RotateCcw className="size-4" />
            {dict.newGame}
          </Button>
          <Button onClick={startNextRound}>
            <Play className="size-4" />
            {dict.playAgain}
          </Button>
        </div>
      )}

      {!isHost && (
        <p className="text-sm text-muted-foreground">
          {onlineDict.waitingForHost}
        </p>
      )}
    </div>
  );
}

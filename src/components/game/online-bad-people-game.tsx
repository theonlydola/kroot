"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  ChevronRight,
  Crown,
  Check,
  Wifi,
  WifiOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { shuffle } from "@/lib/game-utils";
import type {
  Room,
  RoomPlayer,
  BadPeopleOnlineState,
  BadPeopleBroadcastEvent,
} from "@/lib/room-types";
import { updateRoomState, submitVote } from "@/app/[lang]/games/[slug]/online/actions";
import { OnlineLobby } from "./shared/online-lobby";
import { PlayerVoteGrid } from "./shared/player-vote-grid";
import { Scoreboard } from "./shared/scoreboard";
import { usePlayerIcons } from "./shared/player-icons-context";

export type OnlineBadPeopleGameProps = {
  room: Room;
  playerId: string;
  questions: string[];
  dict: {
    setupTitle: string;
    startGame: string;
    player: string;
    round: string;
    master: string;
    readsQuestion: string;
    masterVote: string;
    votesFirst: string;
    yourTurn: string;
    tapToVote: string;
    roundResults: string;
    masterChose: string;
    point: string;
    noPoint: string;
    scoreboard: string;
    nextRound: string;
    newGame: string;
    gameOver: string;
    winner: string;
    tied: string;
    playAgain: string;
    questionsLeft: string;
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
    votesIn: string;
    waitingForVotes: string;
    youVoted: string;
    or: string;
    managePlayers: string;
    waitingForMaster: string;
  };
  slug: string;
  lang: string;
};

export function OnlineBadPeopleGame({
  room: initialRoom,
  playerId,
  questions,
  dict,
  onlineDict,
  slug,
  lang,
}: OnlineBadPeopleGameProps) {
  const PLAYER_ICONS = usePlayerIcons();
  const isHost = initialRoom.host_id === playerId;
  const [room, setRoom] = useState<Room>(initialRoom);
  const [gameState, setGameState] = useState<BadPeopleOnlineState>(
    initialRoom.game_state as BadPeopleOnlineState,
  );
  const [players, setPlayers] = useState<RoomPlayer[]>(initialRoom.players);
  const [connected, setConnected] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  const myIndex = players.findIndex((p) => p.id === playerId);

  const channelRef = useRef<ReturnType<
    ReturnType<typeof getSupabaseBrowserClient>["channel"]
  > | null>(null);

  const getPlayerName = useCallback(
    (index: number) => players[index]?.name || `${dict.player} ${index + 1}`,
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
        const event = payload as BadPeopleBroadcastEvent;
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
          setGameState(updated.game_state as BadPeopleOnlineState);
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
    (event: BadPeopleBroadcastEvent) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "game-event",
        payload: event,
      });
    },
    [],
  );

  const handleBroadcastEvent = useCallback(
    (event: BadPeopleBroadcastEvent) => {
      switch (event.type) {
        case "game:start":
        case "game:next-round":
          setGameState(event.state);
          setHasVoted(false);
          if ("players" in event) {
            setPlayers(event.players);
          }
          break;
        case "game:phase":
        case "game:master-vote":
        case "game:round-results":
          setGameState(event.state);
          break;
        case "player:vote":
          setGameState(event.state);
          break;
        case "game:over":
          setGameState(event.state);
          break;
        case "player:joined":
          setPlayers(event.players);
          break;
        case "player:left":
          setPlayers(event.players);
          break;
      }
    },
    [],
  );

  // ─── Host: Start Game ──────────────────────────────────────────
  const startGame = useCallback(async () => {
    if (!isHost) return;

    const shuffledQuestions = shuffle(
      Array.from({ length: questions.length }, (_, i) => i),
    );

    const newState: BadPeopleOnlineState = {
      phase: "master-vote",
      round: 1,
      masterIndex: 0,
      questionIndex: 0,
      shuffledQuestions,
      masterVote: -1,
      votes: {},
      currentVoterIndex: 1,
      scores: Array(players.length).fill(0),
    };

    await updateRoomState(room.id, playerId, newState, "playing");
    broadcast({ type: "game:start", state: newState, players });
    setGameState(newState);
    setHasVoted(false);
  }, [isHost, questions.length, players, room.id, playerId, broadcast]);

  // ─── Host: Submit Master Vote ──────────────────────────────────
  const submitMasterVote = useCallback(
    async (votedForIndex: number) => {
      if (!isHost && myIndex !== gameState.masterIndex) return;

      const firstVoter = getNextNonMasterIndex(
        gameState.masterIndex,
        players.length,
        gameState.masterIndex,
      );

      const newState: BadPeopleOnlineState = {
        ...gameState,
        phase: "player-vote",
        masterVote: votedForIndex,
        votes: { [playerId]: votedForIndex },
        currentVoterIndex: firstVoter,
      };

      await updateRoomState(room.id, initialRoom.host_id, newState);
      broadcast({ type: "game:master-vote", state: newState });
      setGameState(newState);
    },
    [isHost, myIndex, gameState, players.length, room.id, playerId, initialRoom.host_id, broadcast],
  );

  // ─── Player: Submit Vote ───────────────────────────────────────
  const handlePlayerVote = useCallback(
    async (votedForIndex: number) => {
      if (hasVoted) return;

      const result = await submitVote(room.id, playerId, votedForIndex);
      if (result.success) {
        setHasVoted(true);
        // Check if all non-master players have voted
        const totalVoters = players.length; // master's vote is included
        const allVoted = result.voteCount >= totalVoters;

        if (allVoted) {
          // If we're the host (or acting host), compute results
          // Results will come through postgres_changes for non-host
        }

        broadcast({
          type: "player:vote",
          playerId,
          state: {
            ...gameState,
            votes: { ...gameState.votes, [playerId]: votedForIndex },
          },
        });
      }
    },
    [hasVoted, room.id, playerId, players.length, gameState, broadcast],
  );

  // ─── Host: Show Round Results ──────────────────────────────────
  const showRoundResults = useCallback(async () => {
    if (!isHost) return;

    // Fetch latest state from room
    const supabase = getSupabaseBrowserClient();
    const { data: freshRoom } = await supabase
      .from("rooms")
      .select("game_state")
      .eq("id", room.id)
      .single();

    const latestState = (freshRoom?.game_state || gameState) as BadPeopleOnlineState;

    // Calculate scores
    const newScores = [...latestState.scores];
    for (const [pId, votedFor] of Object.entries(latestState.votes)) {
      // Master's vote doesn't earn points; players who match master's choice get +1
      const voterIdx = players.findIndex((p) => p.id === pId);
      if (voterIdx !== latestState.masterIndex && votedFor === latestState.masterVote) {
        newScores[voterIdx] += 1;
      }
    }

    const newState: BadPeopleOnlineState = {
      ...latestState,
      phase: "round-results",
      scores: newScores,
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:round-results", state: newState });
    setGameState(newState);
  }, [isHost, room.id, playerId, gameState, players, broadcast]);

  // ─── Host: Next Round ──────────────────────────────────────────
  const nextRound = useCallback(async () => {
    if (!isHost) return;

    const nextQuestionIdx = gameState.questionIndex + 1;
    if (nextQuestionIdx >= gameState.shuffledQuestions.length) {
      // Game over
      const newState: BadPeopleOnlineState = {
        ...gameState,
        phase: "results",
      };
      await updateRoomState(room.id, playerId, newState, "finished");
      broadcast({ type: "game:over", state: newState });
      setGameState(newState);
      return;
    }

    const newMaster = (gameState.masterIndex + 1) % players.length;
    const newState: BadPeopleOnlineState = {
      ...gameState,
      phase: "master-vote",
      round: gameState.round + 1,
      masterIndex: newMaster,
      questionIndex: nextQuestionIdx,
      masterVote: -1,
      votes: {},
      currentVoterIndex: getNextNonMasterIndex(newMaster, players.length, newMaster),
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:next-round", state: newState });
    setGameState(newState);
    setHasVoted(false);
  }, [isHost, gameState, players.length, room.id, playerId, broadcast]);

  // ─── Host: Back to Lobby ───────────────────────────────────────
  const backToLobby = useCallback(async () => {
    if (!isHost) return;

    const newState: BadPeopleOnlineState = {
      ...gameState,
      phase: "lobby",
      votes: {},
      masterVote: -1,
    };

    await updateRoomState(room.id, playerId, newState);
    broadcast({ type: "game:phase", state: newState });
    setGameState(newState);
    setHasVoted(false);
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

  // ─── Helpers ───────────────────────────────────────────────────
  const questionText =
    gameState.shuffledQuestions.length > 0 &&
    gameState.questionIndex < gameState.shuffledQuestions.length
      ? questions[gameState.shuffledQuestions[gameState.questionIndex]]
      : "";

  const questionsRemaining =
    gameState.shuffledQuestions.length - gameState.questionIndex - 1;

  const iAmMaster = myIndex === gameState.masterIndex;

  // ─── Connection indicator ──────────────────────────────────────
  const ConnectionBadge = () => (
    <div
      className={`fixed top-16 right-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
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

  // ─── Master Vote Phase ─────────────────────────────────────────
  if (gameState.phase === "master-vote") {
    return (
      <div className="flex flex-col items-center gap-6">
        <ConnectionBadge />

        <div className="flex items-center justify-between w-full max-w-md text-sm text-muted-foreground">
          <span>
            {dict.round} {gameState.round}
          </span>
          <span>
            {questionsRemaining} {dict.questionsLeft}
          </span>
        </div>

        {/* Master badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <Crown className="size-4" />
            <span className="text-sm font-medium">
              {dict.master}: {PLAYER_ICONS[gameState.masterIndex]}{" "}
              {getPlayerName(gameState.masterIndex)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getPlayerName(gameState.masterIndex)} {dict.readsQuestion}
          </p>
        </div>

        {/* Question card */}
        <div className="w-full max-w-md rounded-xl border border-border bg-background p-5">
          <p className="text-center text-lg font-medium leading-relaxed text-foreground">
            {questionText}
          </p>
        </div>

        {iAmMaster ? (
          <>
            <p className="text-center text-sm font-medium text-foreground">
              {dict.votesFirst}
            </p>
            <div className="w-full max-w-md">
              <PlayerVoteGrid
                numPlayers={players.length}
                getPlayerName={getPlayerName}
                onVote={submitMasterVote}
                layout="grid"
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {onlineDict.waitingForMaster}
          </p>
        )}
      </div>
    );
  }

  // ─── Player Vote Phase ─────────────────────────────────────────
  if (gameState.phase === "player-vote") {
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

        {/* Question card */}
        <div className="w-full max-w-md rounded-xl border border-border bg-background p-5">
          <p className="text-center text-lg font-medium leading-relaxed text-foreground">
            {questionText}
          </p>
        </div>

        {iAmMaster ? (
          // Master already voted, waiting for others
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
        ) : !hasVoted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-lg">
              <span className="text-4xl">{PLAYER_ICONS[myIndex] || "❓"}</span>
              <p className="mt-3 mb-4 text-lg font-bold">{dict.tapToVote}</p>
              <PlayerVoteGrid
                numPlayers={players.length}
                getPlayerName={getPlayerName}
                onVote={handlePlayerVote}
                layout="grid"
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

        {/* Host: show results when all voted */}
        {allVoted && isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button size="lg" onClick={showRoundResults}>
              {dict.roundResults}
              <ChevronRight className="size-4" />
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // ─── Round Results Phase ───────────────────────────────────────
  if (gameState.phase === "round-results") {
    return (
      <div className="flex flex-col items-center gap-6">
        <ConnectionBadge />

        <h2 className="text-2xl font-bold">{dict.roundResults}</h2>

        {/* Question reminder */}
        <div className="w-full max-w-md rounded-xl border border-border bg-background p-4">
          <p className="text-center text-base leading-relaxed text-foreground">
            {questionText}
          </p>
        </div>

        {/* Master's choice */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-100 px-4 py-3 dark:bg-amber-900/30">
          <Crown className="size-4 text-amber-700 dark:text-amber-300" />
          <span className="text-sm text-amber-800 dark:text-amber-300">
            {dict.masterChose}{" "}
            <span className="font-bold">
              {PLAYER_ICONS[gameState.masterVote]}{" "}
              {getPlayerName(gameState.masterVote)}
            </span>
          </span>
        </div>

        {/* All votes */}
        <div className="w-full max-w-md space-y-2">
          {players.map((player, i) => {
            if (i === gameState.masterIndex) return null;
            const playerVote = gameState.votes[player.id];
            const matched =
              playerVote !== undefined && playerVote === gameState.masterVote;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  matched
                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PLAYER_ICONS[i]}</span>
                  <span className="text-sm font-medium text-foreground">
                    {getPlayerName(i)}
                  </span>
                  {playerVote !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      → {PLAYER_ICONS[playerVote]} {getPlayerName(playerVote)}
                    </span>
                  )}
                </div>
                {matched ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                    <Check className="size-3" />
                    {dict.point}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {dict.noPoint}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-md">
          <Scoreboard
            scores={gameState.scores}
            numPlayers={players.length}
            getPlayerName={getPlayerName}
            title={dict.scoreboard}
          />
        </div>

        {/* Actions */}
        {isHost && (
          <div className="flex gap-3">
            {questionsRemaining > 0 ? (
              <Button size="lg" onClick={nextRound}>
                <ChevronRight className="size-4" />
                {dict.nextRound}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={async () => {
                  const newState: BadPeopleOnlineState = {
                    ...gameState,
                    phase: "results",
                  };
                  await updateRoomState(room.id, playerId, newState, "finished");
                  broadcast({ type: "game:over", state: newState });
                  setGameState(newState);
                }}
              >
                {dict.scoreboard}
              </Button>
            )}
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

  // ─── Results / Game Over Phase ─────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">
      <ConnectionBadge />

      <h2 className="text-2xl font-bold">{dict.gameOver}</h2>

      {/* Winner display */}
      {(() => {
        const maxScore = Math.max(...gameState.scores);
        const winners = gameState.scores
          .map((s, i) => ({ score: s, index: i }))
          .filter((p) => p.score === maxScore);
        const isTied = winners.length > 1;

        return (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 px-10 py-6">
            <div className="flex gap-2 text-5xl">
              {winners.map((w) => (
                <span key={w.index}>{PLAYER_ICONS[w.index]}</span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {isTied ? dict.tied : dict.winner}
            </p>
            {!isTied && (
              <p className="text-xl font-bold">
                {getPlayerName(winners[0].index)}
              </p>
            )}
          </div>
        );
      })()}

      {/* Scoreboard */}
      <div className="w-full max-w-md">
        <Scoreboard
          scores={gameState.scores}
          numPlayers={players.length}
          getPlayerName={getPlayerName}
          title={dict.scoreboard}
        />
      </div>

      {/* Action buttons */}
      {isHost && (
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={handleLeave}>
            <RotateCcw className="size-4" />
            {dict.newGame}
          </Button>
          <Button variant="outline" onClick={backToLobby}>
            <Users className="size-4" />
            {onlineDict.managePlayers}
          </Button>
          <Button onClick={startGame}>
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

// Helper to get next player index that isn't the master
function getNextNonMasterIndex(
  current: number,
  numPlayers: number,
  masterIndex: number,
): number {
  let next = (current + 1) % numPlayers;
  if (next === masterIndex) next = (next + 1) % numPlayers;
  return next;
}

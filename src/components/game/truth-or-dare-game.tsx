"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, ChevronRight, Trophy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────
type TruthOrDareDict = {
  setupTitle: string;
  numberOfPlayers: string;
  enterNames: string;
  startGame: string;
  player: string;
  round: string;
  truth: string;
  dare: string;
  pickACard: string;
  done: string;
  switchCard: string;
  skip: string;
  points: string;
  scoreboard: string;
  nextRound: string;
  newGame: string;
  gameOver: string;
  winner: string;
  tied: string;
  playAgain: string;
  continueGame: string;
  continueGameDesc: string;
  continueBtn: string;
  dismiss: string;
  yourTurn: string;
};

type TruthOrDareGameProps = {
  truths: string[];
  dares: string[];
  dict: TruthOrDareDict;
};

// ─── Constants ───────────────────────────────────────────────────
const PLAYER_ICONS = [
  "🐨", "🦁", "🐯", "🐴", "🐱", "🐶", "🐬", "🐵", "🐦", "🦆",
];
const STORAGE_KEY = "kroot-truth-or-dare-game";
const TOTAL_ROUNDS = 10;

type Phase =
  | "setup"
  | "pick"
  | "first-card"
  | "second-card"
  | "round-result"
  | "game-over";

type GameState = {
  phase: Phase;
  numPlayers: number;
  playerNames: string[];
  scores: number[];
  round: number;
  currentPlayerIndex: number;
  shuffledTruths: number[];
  shuffledDares: number[];
  firstChoice: "truth" | "dare" | null;
  roundPoints: number | null;
};

// ─── LocalStorage helpers ────────────────────────────────────────
function saveGame(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function clearGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Component ───────────────────────────────────────────────────
export function TruthOrDareGame({ truths, dares, dict }: TruthOrDareGameProps) {
  const [savedGame] = useState<GameState | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = loadGame();
    return saved && saved.phase !== "setup" ? saved : null;
  });
  const [showResume, setShowResume] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = loadGame();
    return saved != null && saved.phase !== "setup";
  });

  // Setup state
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  const getPlayerName = useCallback(
    (index: number) =>
      playerNames[index]?.trim() || `${dict.player} ${index + 1}`,
    [playerNames, dict.player],
  );

  // Game state
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [shuffledTruths, setShuffledTruths] = useState<number[]>([]);
  const [shuffledDares, setShuffledDares] = useState<number[]>([]);
  const [firstChoice, setFirstChoice] = useState<"truth" | "dare" | null>(null);
  const [roundPoints, setRoundPoints] = useState<number | null>(null);

  // Persist state
  const persistState = useCallback(
    (overrides: Partial<GameState> = {}) => {
      const state: GameState = {
        phase,
        numPlayers,
        playerNames,
        scores,
        round,
        currentPlayerIndex,
        shuffledTruths,
        shuffledDares,
        firstChoice,
        roundPoints,
        ...overrides,
      };
      saveGame(state);
    },
    [phase, numPlayers, playerNames, scores, round, currentPlayerIndex, shuffledTruths, shuffledDares, firstChoice, roundPoints],
  );

  // Resume saved game
  const resumeGame = useCallback(() => {
    if (!savedGame) return;
    setNumPlayers(savedGame.numPlayers);
    setPlayerNames(savedGame.playerNames);
    setScores(savedGame.scores);
    setRound(savedGame.round);
    setCurrentPlayerIndex(savedGame.currentPlayerIndex);
    setShuffledTruths(savedGame.shuffledTruths);
    setShuffledDares(savedGame.shuffledDares);
    setFirstChoice(savedGame.firstChoice);
    setRoundPoints(savedGame.roundPoints);
    setPhase(savedGame.phase);
    setShowResume(false);
  }, [savedGame]);

  // Start game
  const startGame = useCallback(() => {
    const truthIndices = shuffle(Array.from({ length: truths.length }, (_, i) => i));
    const dareIndices = shuffle(Array.from({ length: dares.length }, (_, i) => i));
    const initScores = Array(numPlayers).fill(0);

    setShuffledTruths(truthIndices);
    setShuffledDares(dareIndices);
    setScores(initScores);
    setRound(1);
    setCurrentPlayerIndex(0);
    setFirstChoice(null);
    setRoundPoints(null);
    setPhase("pick");

    persistState({
      phase: "pick",
      numPlayers,
      playerNames,
      scores: initScores,
      round: 1,
      currentPlayerIndex: 0,
      shuffledTruths: truthIndices,
      shuffledDares: dareIndices,
      firstChoice: null,
      roundPoints: null,
    });
  }, [truths.length, dares.length, numPlayers, playerNames, persistState]);

  // Current round's truth and dare texts
  const truthIdx = shuffledTruths[(round - 1) % shuffledTruths.length];
  const dareIdx = shuffledDares[(round - 1) % shuffledDares.length];
  const currentTruth = truths[truthIdx] ?? "";
  const currentDare = dares[dareIdx] ?? "";

  // Pick a card
  const pickCard = useCallback(
    (choice: "truth" | "dare") => {
      setFirstChoice(choice);
      setPhase("first-card");
      persistState({ phase: "first-card", firstChoice: choice });
    },
    [persistState],
  );

  // Fulfilled first card → +2
  const fulfillFirst = useCallback(() => {
    const newScores = [...scores];
    newScores[currentPlayerIndex] += 2;
    setScores(newScores);
    setRoundPoints(2);
    setPhase("round-result");
    persistState({ phase: "round-result", scores: newScores, roundPoints: 2 });
  }, [scores, currentPlayerIndex, persistState]);

  // Switch to second card
  const switchCard = useCallback(() => {
    setPhase("second-card");
    persistState({ phase: "second-card" });
  }, [persistState]);

  // Fulfilled second card → +1
  const fulfillSecond = useCallback(() => {
    const newScores = [...scores];
    newScores[currentPlayerIndex] += 1;
    setScores(newScores);
    setRoundPoints(1);
    setPhase("round-result");
    persistState({ phase: "round-result", scores: newScores, roundPoints: 1 });
  }, [scores, currentPlayerIndex, persistState]);

  // Skip → 0
  const skipRound = useCallback(() => {
    setRoundPoints(0);
    setPhase("round-result");
    persistState({ phase: "round-result", roundPoints: 0 });
  }, [persistState]);

  // Next round
  const nextRound = useCallback(() => {
    const newRound = round + 1;
    if (newRound > TOTAL_ROUNDS) {
      setPhase("game-over");
      persistState({ phase: "game-over" });
      return;
    }

    const nextPlayer = (currentPlayerIndex + 1) % numPlayers;
    setRound(newRound);
    setCurrentPlayerIndex(nextPlayer);
    setFirstChoice(null);
    setRoundPoints(null);
    setPhase("pick");

    persistState({
      phase: "pick",
      round: newRound,
      currentPlayerIndex: nextPlayer,
      firstChoice: null,
      roundPoints: null,
    });
  }, [round, currentPlayerIndex, numPlayers, persistState]);

  // New game
  const newGame = useCallback(() => {
    clearGame();
    setPhase("setup");
    setRound(1);
    setCurrentPlayerIndex(0);
    setScores([]);
    setFirstChoice(null);
    setRoundPoints(null);
  }, []);

  // ─── Render: Resume Dialog ─────────────────────────────────────
  if (showResume && savedGame) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg"
      >
        <h2 className="mb-2 text-xl font-bold text-foreground">
          {dict.continueGame}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {dict.continueGameDesc}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={resumeGame}>{dict.continueBtn}</Button>
          <Button
            variant="outline"
            onClick={() => {
              clearGame();
              setShowResume(false);
            }}
          >
            {dict.dismiss}
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── Render: Setup Phase ───────────────────────────────────────
  if (phase === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 className="text-center text-xl font-bold text-foreground">
          {dict.setupTitle}
        </h2>

        {/* Number of players */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {dict.numberOfPlayers}
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setNumPlayers(n);
                  setPlayerNames((prev) => {
                    const next = [...prev];
                    next.length = n;
                    return next;
                  });
                }}
                className={`flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  numPlayers === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player names */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {dict.enterNames}
          </label>
          <div className="space-y-2">
            {Array.from({ length: numPlayers }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xl">{PLAYER_ICONS[i]}</span>
                <input
                  type="text"
                  placeholder={`${dict.player} ${i + 1}`}
                  value={playerNames[i] || ""}
                  onChange={(e) => {
                    const next = [...playerNames];
                    next[i] = e.target.value;
                    setPlayerNames(next);
                  }}
                  maxLength={20}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={startGame}>
          <Play className="size-4" />
          {dict.startGame}
        </Button>
      </motion.div>
    );
  }

  // ─── Render: Pick Phase ────────────────────────────────────────
  if (phase === "pick") {
    return (
      <motion.div
        key={`pick-${round}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        {/* Round info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {dict.round} {round}/{TOTAL_ROUNDS}
          </span>
        </div>

        {/* Current player */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">{PLAYER_ICONS[currentPlayerIndex]}</span>
          <span className="text-xl font-bold text-foreground">
            {getPlayerName(currentPlayerIndex)}
          </span>
          <p className="text-sm text-muted-foreground">{dict.yourTurn}</p>
        </div>

        {/* Pick a card prompt */}
        <p className="text-center text-sm font-medium text-foreground">
          {dict.pickACard}
        </p>

        {/* Two face-down cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => pickCard("truth")}
            className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 dark:border-emerald-700 dark:bg-emerald-900/20"
          >
            <Eye className="size-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {dict.truth}
            </span>
          </button>
          <button
            type="button"
            onClick={() => pickCard("dare")}
            className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 dark:border-rose-700 dark:bg-rose-900/20"
          >
            <Eye className="size-8 text-rose-600 dark:text-rose-400" />
            <span className="text-lg font-bold text-rose-700 dark:text-rose-300">
              {dict.dare}
            </span>
          </button>
        </div>

        {/* Mini scoreboard */}
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: numPlayers }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                i === currentPlayerIndex
                  ? "bg-primary/10 font-bold text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{PLAYER_ICONS[i]}</span>
              <span>{scores[i]}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ─── Render: First Card Revealed ───────────────────────────────
  if (phase === "first-card") {
    const isT = firstChoice === "truth";
    const cardText = isT ? currentTruth : currentDare;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`first-${round}`}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
        >
          {/* Round + player */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {dict.round} {round}/{TOTAL_ROUNDS}
            </span>
            <div className="flex items-center gap-1.5">
              <span>{PLAYER_ICONS[currentPlayerIndex]}</span>
              <span className="font-medium text-foreground">
                {getPlayerName(currentPlayerIndex)}
              </span>
            </div>
          </div>

          {/* Card type badge */}
          <div className="flex justify-center">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                isT
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
              }`}
            >
              {isT ? dict.truth : dict.dare}
            </span>
          </div>

          {/* Card content */}
          <div
            className={`rounded-xl border-2 p-5 ${
              isT
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                : "border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-900/10"
            }`}
          >
            <p className="text-center text-lg font-medium leading-relaxed text-foreground">
              {cardText}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={fulfillFirst}
            >
              {dict.done} (+2)
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={switchCard}
            >
              {dict.switchCard}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Render: Second Card Revealed ──────────────────────────────
  if (phase === "second-card") {
    const isT = firstChoice === "dare"; // second card is opposite
    const cardText = isT ? currentTruth : currentDare;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`second-${round}`}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
        >
          {/* Round + player */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {dict.round} {round}/{TOTAL_ROUNDS}
            </span>
            <div className="flex items-center gap-1.5">
              <span>{PLAYER_ICONS[currentPlayerIndex]}</span>
              <span className="font-medium text-foreground">
                {getPlayerName(currentPlayerIndex)}
              </span>
            </div>
          </div>

          {/* Card type badge */}
          <div className="flex justify-center">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                isT
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
              }`}
            >
              {isT ? dict.truth : dict.dare}
            </span>
          </div>

          {/* Card content */}
          <div
            className={`rounded-xl border-2 p-5 ${
              isT
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                : "border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-900/10"
            }`}
          >
            <p className="text-center text-lg font-medium leading-relaxed text-foreground">
              {cardText}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={fulfillSecond}
            >
              {dict.done} (+1)
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={skipRound}
            >
              {dict.skip} (0)
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Render: Round Result ──────────────────────────────────────
  if (phase === "round-result") {
    return (
      <motion.div
        key={`result-${round}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        {/* Points earned */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl">{PLAYER_ICONS[currentPlayerIndex]}</span>
          <span className="text-lg font-bold text-foreground">
            {getPlayerName(currentPlayerIndex)}
          </span>
          <div
            className={`rounded-full px-5 py-2 text-xl font-bold ${
              roundPoints === 2
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : roundPoints === 1
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            +{roundPoints} {dict.points}
          </div>
        </div>

        {/* Scoreboard */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {dict.scoreboard}
          </h3>
          <div className="space-y-1.5">
            {[...Array.from({ length: numPlayers }, (_, i) => i)]
              .sort((a, b) => scores[b] - scores[a])
              .map((i, rank) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    rank === 0
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {rank === 0 && <Trophy className="size-4 text-amber-500" />}
                    <span className="text-lg">{PLAYER_ICONS[i]}</span>
                    <span className="text-sm font-medium text-foreground">
                      {getPlayerName(i)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {scores[i]}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {round < TOTAL_ROUNDS ? (
            <Button className="flex-1" size="lg" onClick={nextRound}>
              <ChevronRight className="size-4" />
              {dict.nextRound}
            </Button>
          ) : (
            <Button
              className="flex-1"
              size="lg"
              onClick={() => {
                setPhase("game-over");
                persistState({ phase: "game-over" });
              }}
            >
              {dict.scoreboard}
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={newGame}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── Render: Game Over ─────────────────────────────────────────
  if (phase === "game-over") {
    const maxScore = Math.max(...scores);
    const winners = scores
      .map((s, i) => (s === maxScore ? i : -1))
      .filter((i) => i >= 0);
    const isTied = winners.length > 1;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 text-center shadow-lg"
      >
        <h2 className="text-2xl font-bold text-foreground">
          🎉 {dict.gameOver}
        </h2>

        {/* Winner */}
        <div className="flex flex-col items-center gap-2">
          <Trophy className="size-10 text-amber-500" />
          <p className="text-sm font-medium text-muted-foreground">
            {isTied ? dict.tied : dict.winner}
          </p>
          <div className="flex items-center gap-3">
            {winners.map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-4xl">{PLAYER_ICONS[i]}</span>
                <span className="text-lg font-bold text-foreground">
                  {getPlayerName(i)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {scores[i]} {dict.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Full scoreboard */}
        <div className="space-y-1.5">
          {[...Array.from({ length: numPlayers }, (_, i) => i)]
            .sort((a, b) => scores[b] - scores[a])
            .map((i, rank) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  rank === 0
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : "bg-background"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{rank + 1}
                  </span>
                  <span className="text-lg">{PLAYER_ICONS[i]}</span>
                  <span className="text-sm font-medium text-foreground">
                    {getPlayerName(i)}
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {scores[i]}
                </span>
              </div>
            ))}
        </div>

        <Button className="w-full" size="lg" onClick={newGame}>
          <RotateCcw className="size-4" />
          {dict.playAgain}
        </Button>
      </motion.div>
    );
  }

  return null;
}

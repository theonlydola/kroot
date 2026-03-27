"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  ChevronRight,
  Timer,
  Eye,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────
type CategoryKey = "food" | "animals" | "objects";

type WordPair = { word: string; imposter: string };

type ImposterDict = {
  setupTitle: string;
  numberOfPlayers: string;
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
  passToNext: string;
  nextPlayer: string;
  allReady: string;
  startRound: string;
  timeUp: string;
  voteNow: string;
  revealImposter: string;
  revealWord: string;
  imposterWas: string;
  theWordWas: string;
  playAgain: string;
  newGame: string;
  round: string;
  continueGame: string;
  continueGameDesc: string;
  continueBtn: string;
  dismiss: string;
  player: string;
  whoIsImposter: string;
  tapToVote: string;
  imposterGuessTitle: string;
  imposterGuessDesc: string;
  guessCorrect: string;
  guessWrong: string;
  results: string;
  votesLabel: string;
  correct: string;
  wrong: string;
};

type ImposterGameProps = {
  categories: Record<CategoryKey, WordPair[]>;
  dict: ImposterDict;
};

// ─── Constants ───────────────────────────────────────────────────
const PLAYER_ICONS = [
  "🐨",
  "🦁",
  "🐯",
  "🐴",
  "🐱",
  "🐶",
  "🐬",
  "🐵",
  "🐦",
  "🦆",
];
const ROUND_OPTIONS = [3, 5, 7, 10];
const STORAGE_KEY = "kroot-imposter-game";

type Phase =
  | "setup"
  | "dealing"
  | "timer"
  | "voting"
  | "reveal"
  | "imposter-guess"
  | "results";

type GameState = {
  phase: Phase;
  numPlayers: number;
  category: CategoryKey;
  roundMinutes: number;
  round: number;
  imposterIndex: number;
  word: string;
  currentCard: number;
  revealed: boolean;
  scores: number[];
  timerEnd: number;
  votes: number[];
  currentVoter: number;
  playerNames: string[];
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

// ─── Component ───────────────────────────────────────────────────
export function ImposterGame({ categories, dict }: ImposterGameProps) {
  const [savedGame, setSavedGame] = useState<GameState | null>(() => {
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
  const [numPlayers, setNumPlayers] = useState(4);
  const [category, setCategory] = useState<CategoryKey>("food");
  const [roundMinutes, setRoundMinutes] = useState(5);
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  const getPlayerName = useCallback(
    (index: number) =>
      playerNames[index]?.trim() || `${dict.player} ${index + 1}`,
    [playerNames, dict.player],
  );

  // Game state
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState(1);
  const [imposterIndex, setImposterIndex] = useState(0);
  const [word, setWord] = useState("");
  const [currentCard, setCurrentCard] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [timerEnd, setTimerEnd] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [votes, setVotes] = useState<number[]>([]);
  const [currentVoter, setCurrentVoter] = useState(0);
  const [voterRevealed, setVoterRevealed] = useState(false);
  const [imposterGuessOptions, setImposterGuessOptions] = useState<string[]>(
    [],
  );
  const [imposterGuessResult, setImposterGuessResult] = useState<
    boolean | null
  >(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (phase !== "timer") return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((timerEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("voting");
      }
    }, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timerEnd]);

  // Persist game state on changes
  useEffect(() => {
    if (phase === "setup") return;
    const state: GameState = {
      phase,
      numPlayers,
      category,
      roundMinutes,
      round,
      imposterIndex,
      word,
      currentCard,
      revealed,
      scores,
      timerEnd,
      votes,
      currentVoter,
      playerNames,
    };
    saveGame(state);
  }, [
    phase,
    numPlayers,
    category,
    roundMinutes,
    round,
    imposterIndex,
    word,
    currentCard,
    revealed,
    scores,
    timerEnd,
    votes,
    currentVoter,
    playerNames,
  ]);

  const resumeGame = useCallback(() => {
    if (!savedGame) return;
    setNumPlayers(savedGame.numPlayers);
    setCategory(savedGame.category);
    setRoundMinutes(savedGame.roundMinutes);
    setRound(savedGame.round);
    setImposterIndex(savedGame.imposterIndex);
    setWord(savedGame.word);
    setCurrentCard(savedGame.currentCard);
    setRevealed(false);
    setScores(savedGame.scores);
    setTimerEnd(savedGame.timerEnd);
    setVotes(savedGame.votes ?? []);
    setCurrentVoter(savedGame.currentVoter ?? 0);
    setPlayerNames(savedGame.playerNames ?? []);
    setVoterRevealed(false);
    setImposterGuessResult(null);
    setPhase(savedGame.phase);
    setShowResume(false);
  }, [savedGame]);

  const dismissSavedGame = useCallback(() => {
    clearGame();
    setSavedGame(null);
    setShowResume(false);
  }, []);

  const startGame = useCallback(() => {
    const pool = categories[category];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const impIdx = Math.floor(Math.random() * numPlayers);

    setWord(pick.word);
    setImposterIndex(impIdx);
    setCurrentCard(0);
    setRevealed(false);
    setScores(Array(numPlayers).fill(0));
    setRound(1);
    setVotes([]);
    setCurrentVoter(0);
    setVoterRevealed(false);
    setImposterGuessResult(null);
    setPhase("dealing");
  }, [categories, category, numPlayers]);

  const startNewRound = useCallback(() => {
    const pool = categories[category];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const impIdx = Math.floor(Math.random() * numPlayers);

    setWord(pick.word);
    setImposterIndex(impIdx);
    setCurrentCard(0);
    setRevealed(false);
    setVotes([]);
    setCurrentVoter(0);
    setVoterRevealed(false);
    setImposterGuessResult(null);
    setRound((r) => r + 1);
    setPhase("dealing");
  }, [categories, category, numPlayers]);

  const handleCardTap = useCallback(() => {
    if (!revealed) {
      setRevealed(true);
    }
  }, [revealed]);

  const handleNext = useCallback(() => {
    if (currentCard < numPlayers - 1) {
      setCurrentCard((c) => c + 1);
      setRevealed(false);
    } else {
      // All players have seen their cards — start timer phase
      const end = Date.now() + roundMinutes * 60 * 1000;
      setTimerEnd(end);
      setPhase("timer");
    }
  }, [currentCard, numPlayers, roundMinutes]);

  const handleVote = useCallback(
    (votedFor: number) => {
      const newVotes = [...votes];
      newVotes[currentVoter] = votedFor;
      setVotes(newVotes);

      if (currentVoter < numPlayers - 1) {
        setCurrentVoter((c) => c + 1);
        setVoterRevealed(false);
      } else {
        // All votes in — award points for correct guesses
        const newScores = [...scores];
        for (let i = 0; i < numPlayers; i++) {
          if (i !== imposterIndex && newVotes[i] === imposterIndex) {
            newScores[i] += 1;
          }
        }
        setScores(newScores);

        // Build word options for imposter guess
        const pool = categories[category];
        const others = pool.map((p) => p.word).filter((w) => w !== word);
        const picks = others.sort(() => Math.random() - 0.5).slice(0, 4);
        picks.push(word);
        setImposterGuessOptions(picks.sort(() => Math.random() - 0.5));
        setImposterGuessResult(null);
        setPhase("reveal");
      }
    },
    [
      votes,
      currentVoter,
      numPlayers,
      scores,
      imposterIndex,
      categories,
      category,
      word,
    ],
  );

  const handleImposterGuess = useCallback(
    (guessedWord: string) => {
      const correct = guessedWord === word;
      setImposterGuessResult(correct);
      if (correct) {
        setScores((prev) => {
          const ns = [...prev];
          ns[imposterIndex] += 1;
          return ns;
        });
      }
      setTimeout(() => setPhase("results"), 1500);
    },
    [word, imposterIndex],
  );

  const resetToSetup = useCallback(() => {
    clearGame();
    setPhase("setup");
    setRound(1);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const categoryLabels: Record<CategoryKey, string> = {
    food: dict.food,
    animals: dict.animals,
    objects: dict.objects,
  };

  // ─── Resume prompt ─────────────────────────────────────────────
  if (showResume) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <h2 className="mb-2 text-xl font-bold">{dict.continueGame}</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {dict.continueGameDesc}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={dismissSavedGame}>
              {dict.dismiss}
            </Button>
            <Button onClick={resumeGame}>{dict.continueBtn}</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Setup Phase ───────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-6 text-center text-xl font-bold">
            {dict.setupTitle}
          </h2>

          {/* Number of Players */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              {dict.numberOfPlayers}
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 7 }, (_, i) => i + 4).map((n) => (
                <button
                  key={n}
                  type="button"
                  onTouchStart={() => setNumPlayers(n)}
                  onClick={() => setNumPlayers(n)}
                  className={`flex size-10 items-center justify-center rounded-xl border text-sm font-medium transition-all touch-manipulation ${
                    numPlayers === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {/* Player names */}
            <div className="mt-3 flex flex-wrap gap-2">
              {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{icon}</span>
                  <input
                    type="text"
                    inputMode="text"
                    placeholder={`${dict.player} ${i + 1}`}
                    value={playerNames[i] ?? ""}
                    onChange={(e) => {
                      setPlayerNames((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      });
                    }}
                    className="w-16 rounded-md border border-border bg-background px-1.5 py-0.5 text-center text-[11px] text-foreground outline-none focus:border-primary touch-manipulation"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              {dict.chooseCategory}
            </label>
            <div className="flex flex-wrap gap-2">
              {(["food", "animals", "objects"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onTouchStart={() => setCategory(cat)}
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
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              {dict.roundLength}
            </label>
            <div className="flex flex-wrap gap-2">
              {ROUND_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onTouchStart={() => setRoundMinutes(mins)}
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

          <Button className="w-full" size="lg" onClick={startGame}>
            <Play className="size-4" />
            {dict.startGame}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Dealing Phase ─────────────────────────────────────────────
  if (phase === "dealing") {
    const isImposter = currentCard === imposterIndex;
    const playerIcon = PLAYER_ICONS[currentCard];

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Round & progress */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {dict.round} {round}
          </span>
          <span className="text-sm text-muted-foreground">
            {getPlayerName(currentCard)} / {numPlayers}
          </span>
        </div>

        {/* Player icons strip */}
        <div className="flex gap-2">
          {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => (
            <span
              key={i}
              className={`text-2xl transition-opacity flex flex-col items-center ${
                i < currentCard
                  ? "opacity-30"
                  : i === currentCard
                    ? "scale-110"
                    : "opacity-60"
              }`}
            >
              {icon}
              <span className="text-xs text-muted-foreground">
                {getPlayerName(i)}
              </span>
              <span className="text-xs text-muted-foreground">{scores[i]}</span>
            </span>
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard}-${revealed}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            <button
              type="button"
              onClick={handleCardTap}
              className={`flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-border p-6 shadow-lg transition-shadow hover:shadow-xl touch-manipulation ${
                revealed
                  ? isImposter
                    ? "bg-gradient-to-br from-red-500/10 to-orange-500/10"
                    : "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                  : "bg-card"
              }`}
            >
              {revealed ? (
                <div className="flex flex-col items-center gap-4">
                  <span className="text-5xl">{playerIcon}</span>
                  {isImposter ? (
                    <>
                      <p className="text-lg font-bold text-red-500">
                        {dict.youAreImposter}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {dict.yourWord}
                      </p>
                      <p className="text-3xl font-bold">{word}</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <span className="text-6xl">{playerIcon}</span>
                  <p className="text-lg font-medium text-muted-foreground">
                    {dict.tapToReveal}
                  </p>
                  <Eye className="size-8 text-muted-foreground/50" />
                </div>
              )}
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <Button size="lg" onClick={handleNext}>
              {currentCard < numPlayers - 1 ? dict.nextPlayer : dict.startRound}
              <ChevronRight className="size-4" />
            </Button>
            {currentCard < numPlayers - 1 && (
              <p className="text-xs text-muted-foreground">{dict.passToNext}</p>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  // ─── Timer Phase ───────────────────────────────────────────────
  if (phase === "timer") {
    const totalSeconds = roundMinutes * 60;
    const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
    const isLow = timeLeft <= 30;

    return (
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {dict.round} {round}
          </span>
        </div>

        <div className="relative flex size-52 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 208 208">
            <circle
              cx="104"
              cy="104"
              r="96"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/30"
            />
            <circle
              cx="104"
              cy="104"
              r="96"
              fill="none"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - progress)}
              strokeLinecap="round"
              className={`transition-all duration-500 ${
                isLow ? "text-red-500" : "text-primary"
              }`}
              stroke="currentColor"
            />
          </svg>
          <div className="flex flex-col items-center">
            <Timer
              className={`mb-1 size-6 ${isLow ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}
            />
            <span
              className={`text-4xl font-bold tabular-nums ${isLow ? "text-red-500" : ""}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Player icons for reference */}
        <div className="flex gap-3">
          {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`text-2xl ${i === imposterIndex ? "" : ""}`}>
                {icon}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {scores[i] ?? 0}
              </span>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={() => setPhase("voting")}>
          {dict.voteNow}
        </Button>
      </div>
    );
  }

  // ─── Voting Phase ───────────────────────────────────────────────
  if (phase === "voting") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {dict.round} {round}
          </span>
          <span>•</span>
          <span>
            {getPlayerName(currentVoter)}
          </span>
        </div>

        {/* Player icons strip */}
        <div className="flex gap-2">
          {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => (
            <span
              key={i}
              className={`text-2xl transition-opacity ${
                i < currentVoter
                  ? "opacity-30"
                  : i === currentVoter
                    ? "scale-110"
                    : "opacity-60"
              }`}
            >
              {icon}
              {}
            </span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`voter-${currentVoter}-${voterRevealed}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            {!voterRevealed ? (
              <button
                type="button"
                onClick={() => setVoterRevealed(true)}
                className="touch-manipulation flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-lg"
              >
                <span className="text-6xl">{PLAYER_ICONS[currentVoter]}</span>
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  {dict.tapToVote}
                </p>
                <Eye className="mt-2 size-8 text-muted-foreground/50" />
              </button>
            ) : (
              <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-lg">
                <span className="text-4xl">{PLAYER_ICONS[currentVoter]}</span>
                <p className="mt-3 mb-4 text-lg font-bold">
                  {dict.whoIsImposter}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => {
                    if (i === currentVoter) return null;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleVote(i)}
                        className="touch-manipulation flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-3 transition-all hover:bg-muted active:scale-95"
                      >
                        <span className="text-3xl">{icon}</span>
                        <span className="text-xs text-muted-foreground">
                          {getPlayerName(i)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ─── Reveal Phase ─────────────────────────────────────────────
  if (phase === "reveal") {
    return (
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold">{dict.revealImposter}</h2>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 px-10 py-6"
        >
          <span className="text-6xl">{PLAYER_ICONS[imposterIndex]}</span>
          <p className="text-sm text-muted-foreground">{dict.imposterWas}</p>
          <p className="text-xl font-bold">{getPlayerName(imposterIndex)}</p>
        </motion.div>

        <Button size="lg" onClick={() => setPhase("imposter-guess")}>
          <ChevronRight className="size-4" />
          {dict.imposterGuessTitle}
        </Button>
      </div>
    );
  }

  // ─── Imposter Guess Phase ──────────────────────────────────────
  if (phase === "imposter-guess") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl">{PLAYER_ICONS[imposterIndex]}</span>
          <h2 className="text-xl font-bold">{dict.imposterGuessTitle}</h2>
          <p className="text-center text-sm text-muted-foreground">
            {dict.imposterGuessDesc}
          </p>
        </div>

        {imposterGuessResult === null ? (
          <div className="flex w-full max-w-sm flex-wrap justify-center gap-3">
            {imposterGuessOptions.map((option, i) => (
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
        ) : (
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
        )}
      </div>
    );
  }

  // ─── Results Phase ─────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold">{dict.results}</h2>

      {/* Imposter reveal */}
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 px-8 py-4">
        <span className="text-4xl">{PLAYER_ICONS[imposterIndex]}</span>
        <p className="text-sm text-muted-foreground">{dict.imposterWas}</p>
        <p className="text-lg font-bold">{getPlayerName(imposterIndex)}</p>
      </div>

      {/* Word reveal */}
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 px-8 py-4">
        <Sparkles className="size-6 text-primary" />
        <p className="text-sm text-muted-foreground">{dict.theWordWas}</p>
        <p className="text-2xl font-bold">{word}</p>
      </div>

      {/* Vote breakdown + scores */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-center font-semibold">{dict.votesLabel}</h3>
        <div className="space-y-2">
          {Array.from({ length: numPlayers }, (_, i) => i)
            .sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))
            .map((i) => {
              const isImp = i === imposterIndex;
              const votedCorrectly = !isImp && votes[i] === imposterIndex;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="text-xl">{PLAYER_ICONS[i]}</span>
                  <span className="flex-1 text-sm font-medium">
                    {getPlayerName(i)}
                    {isImp && " 🕵️"}
                  </span>
                  {!isImp && (
                    <span
                      className={`text-xs font-medium ${votedCorrectly ? "text-green-600" : "text-red-500"}`}
                    >
                      {votedCorrectly ? dict.correct : dict.wrong}
                    </span>
                  )}
                  <span className="min-w-[2rem] text-end text-sm font-bold">
                    {scores[i] ?? 0}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={resetToSetup}>
          <RotateCcw className="size-4" />
          {dict.newGame}
        </Button>
        <Button onClick={startNewRound}>
          <Play className="size-4" />
          {dict.playAgain}
        </Button>
      </div>
    </div>
  );
}

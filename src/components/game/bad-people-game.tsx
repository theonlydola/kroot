"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  ChevronRight,
  Crown,
  Check,
  Eye,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackGameStart, trackGamePlayersNumber } from "@/lib/mixpanel";

// ─── Types ───────────────────────────────────────────────────────
type BadPeopleDict = {
  setupTitle: string;
  numberOfPlayers: string;
  enterNames: string;
  startGame: string;
  player: string;
  round: string;
  master: string;
  readsQuestion: string;
  masterVote: string;
  votesFirst: string;
  yourTurn: string;
  tapToVote: string;
  passPhone: string;
  tapToReveal: string;
  nextVoter: string;
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
  continueGame: string;
  continueGameDesc: string;
  continueBtn: string;
  dismiss: string;
  questionsLeft: string;
};

type BadPeopleGameProps = {
  cards: string[];
  dict: BadPeopleDict;
  slug: string;
  lang: string;
};

// ─── Constants ───────────────────────────────────────────────────
const PLAYER_ICONS = [
  "🐨", "🦁", "🐯", "🐴", "🐱", "🐶", "🐬", "🐵", "🐦", "🦆",
];
const STORAGE_KEY = "kroot-bad-people-game";

type Phase =
  | "setup"
  | "master-vote"
  | "pass-phone"
  | "player-vote"
  | "round-results"
  | "game-over";

type GameState = {
  phase: Phase;
  numPlayers: number;
  playerNames: string[];
  scores: number[];
  round: number;
  masterIndex: number;
  currentQuestion: number;
  masterVote: number;
  votes: number[]; // index = player, value = who they voted for
  currentVoter: number;
  usedQuestions: number[];
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
export function BadPeopleGame({ cards, dict, slug, lang }: BadPeopleGameProps) {
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
  const [numPlayers, setNumPlayers] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  const getPlayerName = useCallback(
    (index: number) =>
      playerNames[index]?.trim() || `${dict.player} ${index + 1}`,
    [playerNames, dict.player],
  );

  // Game state
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState(1);
  const [masterIndex, setMasterIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [masterVote, setMasterVote] = useState(-1);
  const [votes, setVotes] = useState<number[]>([]);
  const [currentVoter, setCurrentVoter] = useState(0);
  const [, setVoterRevealed] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<number[]>([]);

  // Persist state changes
  const persistState = useCallback(
    (overrides: Partial<GameState> = {}) => {
      const state: GameState = {
        phase,
        numPlayers,
        playerNames,
        scores,
        round,
        masterIndex,
        currentQuestion,
        masterVote,
        votes,
        currentVoter,
        usedQuestions: shuffledCards,
        ...overrides,
      };
      saveGame(state);
    },
    [phase, numPlayers, playerNames, scores, round, masterIndex, currentQuestion, masterVote, votes, currentVoter, shuffledCards],
  );

  // Resume saved game
  const resumeGame = useCallback(() => {
    if (!savedGame) return;
    setNumPlayers(savedGame.numPlayers);
    setPlayerNames(savedGame.playerNames);
    setScores(savedGame.scores);
    setRound(savedGame.round);
    setMasterIndex(savedGame.masterIndex);
    setCurrentQuestion(savedGame.currentQuestion);
    setMasterVote(savedGame.masterVote);
    setVotes(savedGame.votes);
    setCurrentVoter(savedGame.currentVoter);
    setShuffledCards(savedGame.usedQuestions);
    setPhase(savedGame.phase);
    setShowResume(false);
  }, [savedGame]);

  // Start game
  const startGame = useCallback(() => {
    const indices = shuffle(Array.from({ length: cards.length }, (_, i) => i));
    setShuffledCards(indices);
    setScores(Array(numPlayers).fill(0));
    setRound(1);
    setMasterIndex(0);
    setCurrentQuestion(0);
    setMasterVote(-1);
    setVotes(Array(numPlayers).fill(-1));
    setVoterRevealed(false);

    // First non-master voter
    const firstVoter = 1 % numPlayers === 0 ? 1 : 1;
    setCurrentVoter(firstVoter);

    setPhase("master-vote");
    trackGameStart(slug, lang);
    trackGamePlayersNumber(slug, numPlayers);
    persistState({
      phase: "master-vote",
      numPlayers,
      playerNames,
      scores: Array(numPlayers).fill(0),
      round: 1,
      masterIndex: 0,
      currentQuestion: 0,
      masterVote: -1,
      votes: Array(numPlayers).fill(-1),
      currentVoter: 1,
      usedQuestions: indices,
    });
  }, [cards.length, numPlayers, playerNames, persistState, slug, lang]);

  // Master submits vote
  const submitMasterVote = useCallback(
    (playerIdx: number) => {
      setMasterVote(playerIdx);

      // Find first non-master voter
      const firstVoter = (masterIndex + 1) % numPlayers;
      setCurrentVoter(firstVoter);
      setVoterRevealed(false);
      setPhase("pass-phone");

      const newVotes = Array(numPlayers).fill(-1);
      newVotes[masterIndex] = playerIdx;
      setVotes(newVotes);

      persistState({
        phase: "pass-phone",
        masterVote: playerIdx,
        votes: newVotes,
        currentVoter: firstVoter,
      });
    },
    [masterIndex, numPlayers, persistState],
  );

  // Get next voter (skip master)
  const getNextVoter = useCallback(
    (current: number) => {
      let next = (current + 1) % numPlayers;
      if (next === masterIndex) next = (next + 1) % numPlayers;
      return next;
    },
    [numPlayers, masterIndex],
  );

  // Player submits vote
  const submitPlayerVote = useCallback(
    (playerIdx: number) => {
      const newVotes = [...votes];
      newVotes[currentVoter] = playerIdx;
      setVotes(newVotes);

      // Check if all non-master players have voted
      const allVoted = newVotes.every((v, i) => i === masterIndex || v !== -1);

      if (allVoted) {
        setPhase("round-results");
        // Award points
        const newScores = [...scores];
        for (let i = 0; i < numPlayers; i++) {
          if (i !== masterIndex && newVotes[i] === masterVote) {
            newScores[i] += 1;
          }
        }
        setScores(newScores);

        persistState({
          phase: "round-results",
          votes: newVotes,
          scores: newScores,
        });
      } else {
        const nextVoter = getNextVoter(currentVoter);
        setCurrentVoter(nextVoter);
        setVoterRevealed(false);
        setPhase("pass-phone");

        persistState({
          phase: "pass-phone",
          votes: newVotes,
          currentVoter: nextVoter,
        });
      }
    },
    [votes, currentVoter, masterIndex, numPlayers, masterVote, scores, getNextVoter, persistState],
  );

  // Next round
  const nextRound = useCallback(() => {
    const nextQuestionIdx = currentQuestion + 1;
    if (nextQuestionIdx >= shuffledCards.length) {
      setPhase("game-over");
      persistState({ phase: "game-over" });
      return;
    }

    const newMaster = (masterIndex + 1) % numPlayers;
    const newRound = round + 1;
    setRound(newRound);
    setMasterIndex(newMaster);
    setCurrentQuestion(nextQuestionIdx);
    setMasterVote(-1);
    setVotes(Array(numPlayers).fill(-1));
    setVoterRevealed(false);
    setPhase("master-vote");

    persistState({
      phase: "master-vote",
      round: newRound,
      masterIndex: newMaster,
      currentQuestion: nextQuestionIdx,
      masterVote: -1,
      votes: Array(numPlayers).fill(-1),
    });
  }, [currentQuestion, shuffledCards.length, masterIndex, numPlayers, round, persistState]);

  // New game
  const newGame = useCallback(() => {
    clearGame();
    setPhase("setup");
    setRound(1);
    setMasterIndex(0);
    setScores([]);
    setMasterVote(-1);
    setVotes([]);
    setCurrentQuestion(0);
  }, []);

  // Get the current question text
  const questionText =
    shuffledCards.length > 0 && currentQuestion < shuffledCards.length
      ? cards[shuffledCards[currentQuestion]]
      : "";

  const questionsRemaining = shuffledCards.length - currentQuestion - 1;

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
            {Array.from({ length: 8 }, (_, i) => i + 3).map((n) => (
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

  // ─── Render: Master Vote Phase ─────────────────────────────────
  if (phase === "master-vote") {
    return (
      <motion.div
        key={`master-vote-${round}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        {/* Round info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {dict.round} {round}
          </span>
          <span>{questionsRemaining} {dict.questionsLeft}</span>
        </div>

        {/* Master badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <Crown className="size-4" />
            <span className="text-sm font-medium">
              {dict.master}: {PLAYER_ICONS[masterIndex]} {getPlayerName(masterIndex)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getPlayerName(masterIndex)} {dict.readsQuestion}
          </p>
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-center text-lg font-medium leading-relaxed text-foreground">
            {questionText}
          </p>
        </div>

        {/* Vote prompt */}
        <p className="text-center text-sm font-medium text-foreground">
          {dict.votesFirst}
        </p>

        {/* Player buttons to vote */}
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: numPlayers }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => submitMasterVote(i)}
              className="flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-start transition-colors hover:bg-muted active:scale-95"
            >
              <span className="text-xl">{PLAYER_ICONS[i]}</span>
              <span className="text-sm font-medium text-foreground">
                {getPlayerName(i)}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  // ─── Render: Pass Phone Phase ──────────────────────────────────
  if (phase === "pass-phone") {
    return (
      <motion.div
        key={`pass-${currentVoter}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 text-center shadow-lg"
      >
        <p className="text-sm text-muted-foreground">
          {dict.passPhone}
        </p>
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">{PLAYER_ICONS[currentVoter]}</span>
          <span className="text-xl font-bold text-foreground">
            {getPlayerName(currentVoter)}
          </span>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setVoterRevealed(false);
            setPhase("player-vote");
          }}
        >
          <Eye className="size-4" />
          {dict.tapToReveal}
        </Button>
      </motion.div>
    );
  }

  // ─── Render: Player Vote Phase ─────────────────────────────────
  if (phase === "player-vote") {
    return (
      <motion.div
        key={`vote-${currentVoter}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        {/* Current voter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{PLAYER_ICONS[currentVoter]}</span>
            <span className="font-medium text-foreground">
              {getPlayerName(currentVoter)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {dict.round} {round}
          </span>
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-center text-lg font-medium leading-relaxed text-foreground">
            {questionText}
          </p>
        </div>

        {/* Vote prompt */}
        <p className="text-center text-sm font-medium text-foreground">
          {dict.tapToVote}
        </p>

        {/* Player buttons */}
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: numPlayers }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => submitPlayerVote(i)}
              className="flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-start transition-colors hover:bg-muted active:scale-95"
            >
              <span className="text-xl">{PLAYER_ICONS[i]}</span>
              <span className="text-sm font-medium text-foreground">
                {getPlayerName(i)}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  // ─── Render: Round Results Phase ───────────────────────────────
  if (phase === "round-results") {
    return (
      <motion.div
        key={`results-${round}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 className="text-center text-xl font-bold text-foreground">
          {dict.roundResults}
        </h2>

        {/* Question reminder */}
        <div className="rounded-xl border border-border bg-background p-4">
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
              {PLAYER_ICONS[masterVote]} {getPlayerName(masterVote)}
            </span>
          </span>
        </div>

        {/* All votes */}
        <div className="space-y-2">
          {Array.from({ length: numPlayers }).map((_, i) => {
            if (i === masterIndex) return null;
            const matched = votes[i] === masterVote;
            return (
              <div
                key={i}
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
                  <span className="text-xs text-muted-foreground">
                    → {PLAYER_ICONS[votes[i]]} {getPlayerName(votes[i])}
                  </span>
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
          {questionsRemaining > 0 ? (
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

  // ─── Render: Game Over Phase ───────────────────────────────────
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
                  {scores[i]} pts
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

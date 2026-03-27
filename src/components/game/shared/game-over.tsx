"use client";

import { motion } from "framer-motion";
import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerIcons } from "./player-icons-context";

type GameOverProps = {
  scores: number[];
  numPlayers: number;
  getPlayerName: (index: number) => string;
  labels: {
    gameOver: string;
    winner: string;
    tied: string;
    playAgain: string;
    points?: string;
  };
  onPlayAgain: () => void;
  children?: React.ReactNode;
};

export function GameOver({
  scores,
  numPlayers,
  getPlayerName,
  labels,
  onPlayAgain,
  children,
}: GameOverProps) {
  const PLAYER_ICONS = usePlayerIcons();
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
        🎉 {labels.gameOver}
      </h2>

      {/* Winner */}
      <div className="flex flex-col items-center gap-2">
        <Trophy className="size-10 text-amber-500" />
        <p className="text-sm font-medium text-muted-foreground">
          {isTied ? labels.tied : labels.winner}
        </p>
        <div className="flex items-center gap-3">
          {winners.map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-4xl">{PLAYER_ICONS[i]}</span>
              <span className="text-lg font-bold text-foreground">
                {getPlayerName(i)}
              </span>
              {labels.points && (
                <span className="text-sm text-muted-foreground">
                  {scores[i]} {labels.points}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {children}

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

      <Button className="w-full" size="lg" onClick={onPlayAgain}>
        <RotateCcw className="size-4" />
        {labels.playAgain}
      </Button>
    </motion.div>
  );
}

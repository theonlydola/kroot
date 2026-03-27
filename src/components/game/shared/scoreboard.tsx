"use client";

import { Trophy } from "lucide-react";
import { usePlayerIcons } from "./player-icons-context";

type ScoreboardProps = {
  scores: number[];
  numPlayers: number;
  getPlayerName: (index: number) => string;
  title?: string;
};

export function Scoreboard({
  scores,
  numPlayers,
  getPlayerName,
  title,
}: ScoreboardProps) {
  const PLAYER_ICONS = usePlayerIcons();
  return (
    <div>
      {title && (
        <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      )}
      <div className="space-y-1.5">
        {[...Array.from({ length: numPlayers }, (_, i) => i)]
          .sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))
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
                {scores[i] ?? 0}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

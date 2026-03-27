"use client";

import { usePlayerIcons } from "./player-icons-context";

type PlayerVoteGridProps = {
  numPlayers: number;
  getPlayerName: (index: number) => string;
  excludeIndices?: number[];
  onVote: (playerIndex: number) => void;
  layout?: "grid" | "wrap";
};

export function PlayerVoteGrid({
  numPlayers,
  getPlayerName,
  excludeIndices = [],
  onVote,
  layout = "grid",
}: PlayerVoteGridProps) {
  const PLAYER_ICONS = usePlayerIcons();
  const excludeSet = new Set(excludeIndices);

  if (layout === "wrap") {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => {
          if (excludeSet.has(i)) return null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onVote(i)}
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
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: numPlayers }).map((_, i) => {
        if (excludeSet.has(i)) return null;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onVote(i)}
            className="flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-start transition-colors hover:bg-muted active:scale-95"
          >
            <span className="text-xl">{PLAYER_ICONS[i]}</span>
            <span className="text-sm font-medium text-foreground">
              {getPlayerName(i)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

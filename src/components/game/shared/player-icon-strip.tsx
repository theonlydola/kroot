"use client";

import { usePlayerIcons } from "./player-icons-context";

type PlayerIconStripProps = {
  numPlayers: number;
  scores?: number[];
  currentIndex?: number;
  getPlayerName?: (index: number) => string;
  variant?: "progress" | "compact" | "vertical";
};

export function PlayerIconStrip({
  numPlayers,
  scores,
  currentIndex,
  getPlayerName,
  variant = "vertical",
}: PlayerIconStripProps) {
  const PLAYER_ICONS = usePlayerIcons();
  if (variant === "compact") {
    return (
      <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 justify-items-center">
        {Array.from({ length: numPlayers }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
              currentIndex !== undefined && i === currentIndex
                ? "bg-primary/10 font-bold text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span>{PLAYER_ICONS[i]}</span>
            {scores && <span>{scores[i] ?? 0}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "progress") {
    return (
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 justify-items-center">
        {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => (
          <span
            key={i}
            className={`text-xl sm:text-2xl transition-opacity flex flex-col items-center ${
              currentIndex !== undefined && i < currentIndex
                ? "opacity-30"
                : currentIndex !== undefined && i === currentIndex
                  ? "scale-110"
                  : "opacity-60"
            }`}
          >
            {icon}
            {getPlayerName && (
              <span className="text-xs text-muted-foreground">
                {getPlayerName(i)}
              </span>
            )}
            {scores && (
              <span className="text-xs text-muted-foreground">
                {scores[i] ?? 0}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  }

  // vertical (default)
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3 justify-items-center">
      {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-xl sm:text-2xl">{icon}</span>
          {scores && (
            <span className="text-[10px] text-muted-foreground">
              {scores[i] ?? 0}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

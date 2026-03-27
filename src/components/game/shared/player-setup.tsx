"use client";

import { usePlayerIcons } from "./player-icons-context";

type PlayerSetupProps = {
  numPlayers: number;
  minPlayers: number;
  maxPlayers: number;
  playerNames: string[];
  onNumPlayersChange: (n: number) => void;
  onPlayerNamesChange: (names: string[]) => void;
  labels: {
    numberOfPlayers: string;
    player: string;
    enterNames?: string;
  };
  variant?: "compact" | "list";
};

export function PlayerSetup({
  numPlayers,
  minPlayers,
  maxPlayers,
  playerNames,
  onNumPlayersChange,
  onPlayerNamesChange,
  labels,
  variant = "list",
}: PlayerSetupProps) {
  const PLAYER_ICONS = usePlayerIcons();
  const handleNameChange = (index: number, value: string) => {
    const next = [...playerNames];
    next[index] = value;
    onPlayerNamesChange(next);
  };

  const handleNumChange = (n: number) => {
    onNumPlayersChange(n);
    // Truncate names array if needed
    if (n < playerNames.length) {
      const next = [...playerNames];
      next.length = n;
      onPlayerNamesChange(next);
    }
  };

  return (
    <>
      {/* Number of Players */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          {labels.numberOfPlayers}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={numPlayers <= minPlayers}
            onClick={() => handleNumChange(numPlayers - 1)}
            className="flex size-10 items-center justify-center rounded-xl border text-lg font-medium transition-all touch-manipulation border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-md font-semibold text-foreground">
            {numPlayers}
          </span>
          <button
            type="button"
            disabled={numPlayers >= maxPlayers}
            onClick={() => handleNumChange(numPlayers + 1)}
            className="flex size-10 items-center justify-center rounded-xl border text-lg font-medium transition-all touch-manipulation border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            +
          </button>
        </div>
      </div>

      {/* Player Name Inputs */}
      {variant === "compact" ? (
        <div className="mt-3 mb-3 flex flex-wrap gap-2">
          {PLAYER_ICONS.slice(0, numPlayers).map((icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{icon}</span>
              <input
                type="text"
                inputMode="text"
                placeholder={`${labels.player} ${i + 1}`}
                value={playerNames[i] ?? ""}
                onChange={(e) => handleNameChange(i, e.target.value)}
                className="w-16 rounded-md border border-border bg-background px-1.5 py-0.5 text-center text-[11px] text-foreground outline-none focus:border-primary touch-manipulation"
              />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {labels.enterNames && (
            <label className="mb-2 block text-sm font-medium text-foreground">
              {labels.enterNames}
            </label>
          )}
          <div className="space-y-2">
            {Array.from({ length: numPlayers }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xl">{PLAYER_ICONS[i]}</span>
                <input
                  type="text"
                  placeholder={`${labels.player} ${i + 1}`}
                  value={playerNames[i] || ""}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  maxLength={20}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

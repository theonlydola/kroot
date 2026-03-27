"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PLAYER_ICONS, shuffle } from "@/lib/game-utils";

const PlayerIconsContext = createContext<string[]>(PLAYER_ICONS);

export function PlayerIconsProvider({ children }: { children: ReactNode }) {
  const [icons, setIcons] = useState(PLAYER_ICONS);

  useEffect(() => {
    setIcons(shuffle(PLAYER_ICONS));
  }, []);

  return (
    <PlayerIconsContext.Provider value={icons}>
      {children}
    </PlayerIconsContext.Provider>
  );
}

export function usePlayerIcons() {
  return useContext(PlayerIconsContext);
}

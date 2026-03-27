"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type GameCardProps = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  minPlayers: number;
  maxPlayers: number;
  playersLabel: string;
  playLabel: string;
  lang: string;
};

export function GameCard({
  slug,
  name,
  description,
  icon,
  color,
  minPlayers,
  maxPlayers,
  playersLabel,
  playLabel,
  lang,
}: GameCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        href={`/${lang}/games/${slug}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
      >
        <div
          className={`flex h-32 items-center justify-center bg-gradient-to-br ${color} sm:h-40`}
        >
          <span className="text-5xl sm:text-6xl">{icon}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
          <h3 className="text-lg font-bold text-foreground">{name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-xs text-muted-foreground">
              {minPlayers}–{maxPlayers} {playersLabel}
            </span>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
              {playLabel}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

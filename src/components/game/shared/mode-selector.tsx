"use client";

import { motion } from "framer-motion";
import { Smartphone, Wifi } from "lucide-react";

type ModeSelectorProps = {
  onSelectLocal: () => void;
  onSelectOnline: () => void;
  dict: {
    playLocal: string;
    playOnline: string;
    localDesc: string;
    onlineDesc: string;
  };
};

export function ModeSelector({
  onSelectLocal,
  onSelectOnline,
  dict,
}: ModeSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onSelectLocal}
          className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-md transition-colors hover:border-primary/50 hover:bg-muted touch-manipulation"
        >
          <Smartphone className="size-10 text-primary" />
          <span className="text-lg font-semibold">{dict.playLocal}</span>
          <span className="text-xs text-muted-foreground text-center">
            {dict.localDesc}
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onSelectOnline}
          className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-md transition-colors hover:border-primary/50 hover:bg-muted touch-manipulation"
        >
          <Wifi className="size-10 text-primary" />
          <span className="text-lg font-semibold">{dict.playOnline}</span>
          <span className="text-xs text-muted-foreground text-center">
            {dict.onlineDesc}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

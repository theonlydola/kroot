"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shuffle } from "@/lib/game-utils";

type GamePlayProps = {
  cards: string[];
  dict: {
    card: string;
    of: string;
    next: string;
    previous: string;
    shuffle: string;
    restart: string;
  };
  isRtl: boolean;
};

export function GamePlay({ cards, dict, isRtl }: GamePlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState(() => shuffle(cards));
  const [direction, setDirection] = useState(0);

  const goNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, deck.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const shuffleDeck = useCallback(() => {
    setDeck((d) => shuffle(d));
    setCurrentIndex(0);
  }, []);

  const restart = useCallback(() => {
    setDeck(cards);
    setCurrentIndex(0);
  }, [cards]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? (isRtl ? -300 : 300) : isRtl ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? (isRtl ? 300 : -300) : isRtl ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card counter */}
      <p className="text-sm text-muted-foreground">
        {dict.card} {currentIndex + 1} {dict.of} {deck.length}
      </p>

      {/* Card display */}
      <div
        className="relative w-full max-w-md overflow-hidden"
        style={{ minHeight: 280 }}
      >
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
          >
            <button
              type="button"
              className={`w-full cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-lg transition-shadow hover:shadow-xl sm:p-8 flex min-h-[280px] items-center justify-center`}
            >
              <p className="whitespace-pre-line text-center text-lg leading-relaxed text-foreground sm:text-xl">
                {deck[currentIndex]}
              </p>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          {isRtl ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
          {dict.previous}
        </Button>

        <Button onClick={goNext} disabled={currentIndex === deck.length - 1}>
          {dict.next}
          {isRtl ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>

        <Button variant="outline" onClick={shuffleDeck}>
          <Shuffle className="size-4" />
          {dict.shuffle}
        </Button>

        <Button variant="outline" onClick={restart}>
          <RotateCcw className="size-4" />
          {dict.restart}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";

type CountdownTimerProps = {
  endTime: number;
  totalSeconds: number;
  onTimeUp: () => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CountdownTimer({
  endTime,
  totalSeconds,
  onTimeUp,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor((endTime - Date.now()) / 1000)),
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        onTimeUpRef.current();
      }
    }, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [endTime]);

  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const isLow = timeLeft <= 30;

  return (
    <div className="relative flex size-52 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 208 208">
        <circle
          cx="104"
          cy="104"
          r="96"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/30"
        />
        <circle
          cx="104"
          cy="104"
          r="96"
          fill="none"
          strokeWidth="6"
          strokeDasharray={2 * Math.PI * 96}
          strokeDashoffset={2 * Math.PI * 96 * (1 - progress)}
          strokeLinecap="round"
          className={`transition-all duration-500 ${
            isLow ? "text-red-500" : "text-primary"
          }`}
          stroke="currentColor"
        />
      </svg>
      <div className="flex flex-col items-center">
        <Timer
          className={`mb-1 size-6 ${isLow ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}
        />
        <span
          className={`text-4xl font-bold tabular-nums ${isLow ? "text-red-500" : ""}`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}

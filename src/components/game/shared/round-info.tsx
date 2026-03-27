"use client";

import type { ReactNode } from "react";

type RoundInfoProps = {
  round: number;
  label: string;
  extra?: ReactNode;
};

export function RoundInfo({ round, label, extra }: RoundInfoProps) {
  return (
    <div className="flex flex-col items-center justify-between text-sm text-muted-foreground">
      <span>
        {label} {round}
      </span>
      {extra}
    </div>
  );
}

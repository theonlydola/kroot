"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type ResumeDialogProps = {
  title: string;
  description: string;
  continueLabel: string;
  dismissLabel: string;
  onResume: () => void;
  onDismiss: () => void;
};

export function ResumeDialog({
  title,
  description,
  continueLabel,
  dismissLabel,
  onResume,
  onDismiss,
}: ResumeDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg"
    >
      <h2 className="mb-2 text-xl font-bold text-foreground">{title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      <div className="flex justify-center gap-3">
        <Button onClick={onResume}>{continueLabel}</Button>
        <Button variant="outline" onClick={onDismiss}>
          {dismissLabel}
        </Button>
      </div>
    </motion.div>
  );
}

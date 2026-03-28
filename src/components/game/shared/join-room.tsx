"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type JoinRoomProps = {
  onJoin: (code: string, name: string) => Promise<void>;
  onBack: () => void;
  error?: string | null;
  initialCode?: string;
  dict: {
    joinRoom: string;
    enterCode: string;
    enterName: string;
    namePlaceholder: string;
    codePlaceholder: string;
    join: string;
  };
};

export function JoinRoom({ onJoin, onBack, error, initialCode, dict }: JoinRoomProps) {
  const [code, setCode] = useState(initialCode || "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setLoading(true);
    try {
      await onJoin(code.trim(), name.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 hover:bg-muted touch-manipulation"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="text-xl font-bold">{dict.joinRoom}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {dict.enterCode}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={dict.codePlaceholder}
              maxLength={6}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] text-foreground placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {dict.enterName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict.namePlaceholder}
              maxLength={20}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!code.trim() || !name.trim() || loading}
          >
            <LogIn className="size-4" />
            {loading ? "..." : dict.join}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

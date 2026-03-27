"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, QrCode, Play, X, Crown, Wifi } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Room, RoomPlayer } from "@/lib/room-types";

type OnlineLobbyProps = {
  room: Room;
  playerId: string;
  isHost: boolean;
  onStart: () => void;
  onKick: (targetPlayerId: string) => void;
  onLeave: () => void;
  minPlayers: number;
  dict: {
    roomCode: string;
    copyLink: string;
    copied: string;
    scanQR: string;
    waitingForPlayers: string;
    waitingForHost: string;
    playersCount: string;
    startGame: string;
    needMorePlayers: string;
    youAreHost: string;
    kick: string;
    leaveRoom: string;
    or: string;
  };
  lang: string;
  slug: string;
};

export function OnlineLobby({
  room,
  playerId,
  isHost,
  onStart,
  onKick,
  onLeave,
  minPlayers,
  dict,
  lang,
  slug,
}: OnlineLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [players, setPlayers] = useState<RoomPlayer[]>(room.players);

  const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";
  const roomUrl = `${BASE_URL}/${lang}/games/${slug}/online/${room.id}`;

  // Subscribe to player changes via Supabase Realtime
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`lobby:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setPlayers(updated.players);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }, [roomUrl]);

  const canStart = players.length >= minPlayers;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Room Code Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-center gap-2">
          <Wifi className="size-5 text-green-500" />
          <span className="text-sm font-medium text-green-600">
            {isHost ? dict.youAreHost : dict.waitingForHost}
          </span>
        </div>

        {/* Room Code */}
        <div className="mb-4 text-center">
          <p className="mb-1 text-sm text-muted-foreground">{dict.roomCode}</p>
          <p className="text-4xl font-mono font-bold tracking-[0.3em] text-foreground">
            {room.code}
          </p>
        </div>

        {/* Actions */}
        <div className="mb-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={copyLink}
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? dict.copied : dict.copyLink}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowQR(!showQR)}
          >
            <QrCode className="size-4" />
          </Button>
        </div>

        {/* QR Code */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 flex flex-col items-center gap-2 overflow-hidden"
            >
              <p className="text-xs text-muted-foreground">{dict.scanQR}</p>
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={roomUrl} size={160} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players List */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-foreground">
            {dict.playersCount} ({players.length}/
            {room.game_config.maxPlayers || 10})
          </p>
          <div className="space-y-2">
            <AnimatePresence>
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="text-xl">
                    {player.id === room.host_id && (
                      <Crown className="inline size-4 text-amber-500" />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {player.name}
                    {player.id === playerId && " (you)"}
                  </span>
                  {isHost && player.id !== playerId && (
                    <button
                      type="button"
                      onClick={() => onKick(player.id)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Waiting indicator */}
        {!canStart && (
          <p className="mb-3 text-center text-xs text-muted-foreground">
            {dict.needMorePlayers.replace("{min}", String(minPlayers))}
          </p>
        )}

        {/* Start / Leave buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onLeave} className="flex-1">
            {dict.leaveRoom}
          </Button>
          {isHost && (
            <Button
              onClick={onStart}
              disabled={!canStart}
              className="flex-1"
            >
              <Play className="size-4" />
              {dict.startGame}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { PresenceState } from "@/lib/realtime";

interface HostControlsProps {
  isHost: boolean;
  players: PresenceState[];
  currentPlayerId: string;
  onKickPlayer: (playerId: string) => void;
  onResetGame: () => void;
  locale: "en" | "no";
}

export function HostControls({
  isHost,
  players,
  currentPlayerId,
  onKickPlayer,
  onResetGame,
  locale,
}: HostControlsProps) {
  const [showControls, setShowControls] = useState(false);

  if (!isHost) return null;

  const labels = {
    host: locale === "no" ? "Vert-kontroller" : "Host Controls",
    kick: locale === "no" ? "Kast ut" : "Kick",
    reset: locale === "no" ? "Tilbakestill spill" : "Reset Game",
    confirm: locale === "no" ? "Sikker?" : "Sure?",
    cancel: locale === "no" ? "Avbryt" : "Cancel",
  };

  const otherPlayers = players.filter((p) => p.playerId !== currentPlayerId);

  return (
    <div className="glass-panel p-4 space-y-3">
      <button
        onClick={() => setShowControls(!showControls)}
        className="w-full text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)] hover:text-white transition px-3 py-2 rounded bg-white/5 hover:bg-white/10"
      >
        ⚙️ {labels.host}
      </button>

      {showControls && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          {otherPlayers.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)] text-center py-2">
              {locale === "no" ? "Ingen andre spillere" : "No other players"}
            </p>
          ) : (
            <div className="space-y-1">
              {otherPlayers.map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between gap-2 text-xs rounded px-2 py-1.5 bg-white/5"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="truncate text-white">{player.playerName}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`${labels.confirm} ${labels.kick.toLowerCase()} ${player.playerName}?`)) {
                        onKickPlayer(player.playerId);
                      }
                    }}
                    className="flex-shrink-0 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 transition text-[10px] font-semibold"
                  >
                    {labels.kick}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (confirm(`${labels.confirm} ${labels.reset.toLowerCase()}?`)) {
                onResetGame();
              }
            }}
            className="w-full text-xs font-semibold px-3 py-2 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-blue-100 transition"
          >
            🔄 {labels.reset}
          </button>
        </div>
      )}
    </div>
  );
}

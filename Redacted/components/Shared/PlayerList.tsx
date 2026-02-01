"use client";

import { useState } from "react";
import type { PresenceState } from "@/lib/realtime";

interface PlayerListProps {
  players: PresenceState[];
  currentPlayerId: string;
  locale: "en" | "no";
}

export function PlayerList({ players, currentPlayerId, locale }: PlayerListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedPlayers = [...players].sort((a, b) => {
    // Current player first
    if (a.playerId === currentPlayerId) return -1;
    if (b.playerId === currentPlayerId) return 1;
    return a.playerName.localeCompare(b.playerName);
  });

  const labels = {
    investigators: locale === "no" ? "Etterforskere" : "Investigators",
    online: locale === "no" ? "på nett" : "online",
    you: locale === "no" ? "(du)" : "(you)",
  };

  // Large screen layout - always visible
  const largeScreenContent = (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">
        👥 {labels.investigators} ({sortedPlayers.length})
      </h3>
      <div className="space-y-2">
        {sortedPlayers.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">{labels.online}</p>
        ) : (
          sortedPlayers.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center gap-2 text-xs text-white rounded px-2 py-1.5 bg-white/5 hover:bg-white/10 transition"
            >
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <span className="flex-1 truncate">{player.playerName}</span>
              {player.playerId === currentPlayerId && (
                <span className="text-[10px] text-[var(--color-gold)]">{labels.you}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Mobile layout - expandable
  const mobileContent = (
    <div className="glass-panel p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)] hover:text-[var(--color-gold)] transition"
      >
        <span>👥 {labels.investigators} ({sortedPlayers.length})</span>
        <span className={`transition ${isExpanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 pt-3 border-t border-white/10">
          {sortedPlayers.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">{labels.online}</p>
          ) : (
            sortedPlayers.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center gap-2 text-xs text-white rounded px-2 py-1.5 bg-white/5"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                />
                <span className="flex-1 truncate">{player.playerName}</span>
                {player.playerId === currentPlayerId && (
                  <span className="text-[10px] text-[var(--color-gold)]">{labels.you}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Hide on mobile, show on lg+ */}
      <div className="hidden lg:block">{largeScreenContent}</div>

      {/* Show on mobile, hide on lg+ */}
      <div className="lg:hidden">{mobileContent}</div>
    </>
  );
}

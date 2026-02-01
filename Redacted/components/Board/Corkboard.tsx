"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { emitSessionEvent, subscribeToSession } from "@/lib/realtime";

type CorkboardNote = {
  id: string;
  text: string;
  x: number;
  y: number;
  createdAt: number;
  createdBy: string;
};

type CorkboardConnection = {
  id: string;
  fromId: string;
  toId: string;
};

export function Corkboard({ locale, sessionId }: { locale: string; sessionId: string }) {
  const [notes, setNotes] = useState<CorkboardNote[]>([]);
  const [connections, setConnections] = useState<CorkboardConnection[]>([]);
  const [value, setValue] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [playerId, setPlayerId] = useState<string>("")
  const boardRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof subscribeToSession> | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastSyncRef = useRef<number>(0);

  // Initialize playerId on client side
  useEffect(() => {
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback for older browsers
      return Math.random().toString(36).substring(2, 11);
    };
    setPlayerId(generateId());
  }, []);

  const canSync = useMemo(() => Boolean(sessionId), [sessionId]);

  const getPlayerColor = (playerId: string) => {
    const colors = [
      "#e8b84d", // gold
      "#6a9fb5", // blue
      "#b57a6a", // rust
      "#8fb56a", // green
      "#b56a9f", // purple
      "#b5926a", // tan
    ];
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const labels = {
    title: locale === "no" ? "Korktavle" : "Corkboard",
    add: locale === "no" ? "Legg til" : "Add",
    placeholder: locale === "no" ? "Skriv en observasjon..." : "Write an observation...",
    helper:
      locale === "no"
        ? "Dra kortene rundt for å lage tidslinje og koblinger. Synkes live mellom spillere."
        : "Drag cards to build timelines and links. Syncs live between players.",
    empty:
      locale === "no"
        ? "Ingen notater ennå. Legg til første observasjon."
        : "No notes yet. Add your first observation.",
  };

  useEffect(() => {
    if (!canSync) return;
    try {
      const client = getSupabaseBrowserClient();
      const channel = subscribeToSession(client, sessionId, (event) => {
        if (event.type === "corkboard.updated") {
          const payload = (event as {
            payload: { payload?: { notes?: CorkboardNote[]; connections?: CorkboardConnection[]; updatedAt?: number } };
          }).payload;
          const remoteNotes = payload?.payload?.notes;
          const remoteConnections = payload?.payload?.connections;
          const updatedAt = payload?.payload?.updatedAt ?? 0;
          if (updatedAt && updatedAt < lastSyncRef.current) return;
          if (updatedAt) lastSyncRef.current = updatedAt;
          if (Array.isArray(remoteNotes)) setNotes(remoteNotes);
          if (Array.isArray(remoteConnections)) setConnections(remoteConnections);
        }
      });
      channelRef.current = channel;
    } catch {
      // Supabase not configured; fall back to local-only
    }

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [canSync, sessionId]);

  const emitNotes = (nextNotes: CorkboardNote[], nextConnections = connections) => {
    if (!channelRef.current) return;
    // eslint-disable-next-line react-hooks/purity -- Date.now() is valid in event handler
    const updatedAt = Date.now();
    lastSyncRef.current = updatedAt;
    emitSessionEvent(channelRef.current, "corkboard.updated", {
      notes: nextNotes,
      connections: nextConnections,
      updatedAt,
    });
  };

  const addNote = () => {
    const trimmed = value.trim();
    if (!trimmed || !playerId) return;
    const board = boardRef.current;
    const bounds = board?.getBoundingClientRect();
    // eslint-disable-next-line react-hooks/purity -- Math.random in event handler is valid
    const x = bounds ? Math.max(8, Math.min(bounds.width - 180, 12 + Math.random() * (bounds.width - 220))) : 12;
    // eslint-disable-next-line react-hooks/purity -- Math.random in event handler is valid
    const y = bounds ? Math.max(8, Math.min(bounds.height - 120, 12 + Math.random() * (bounds.height - 150))) : 12;
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Math.random().toString(36).substring(2, 11);
    };
    const next = [
      // eslint-disable-next-line react-hooks/purity -- Date.now in event handler is valid
      { id: generateId(), text: trimmed, x, y, createdAt: Date.now(), createdBy: playerId },
      ...notes,
    ];
    setNotes(next);
    emitNotes(next, connections);
    setValue("");
  };

  const removeNote = (id: string) => {
    const nextNotes = notes.filter((n) => n.id !== id);
    const nextConnections = connections.filter((c) => c.fromId !== id && c.toId !== id);
    setNotes(nextNotes);
    setConnections(nextConnections);
    emitNotes(nextNotes, nextConnections);
  };

  const startEdit = (note: CorkboardNote) => {
    setEditingId(note.id);
    setEditValue(note.text);
  };

  const saveEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    const nextNotes = notes.map((n) => (n.id === id ? { ...n, text: trimmed } : n));
    setNotes(nextNotes);
    emitNotes(nextNotes, connections);
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const toggleLink = (targetId: string) => {
    if (!linkingFromId) {
      setLinkingFromId(targetId);
      return;
    }
    if (linkingFromId === targetId) {
      setLinkingFromId(null);
      return;
    }
    const [a, b] = [linkingFromId, targetId].sort();
    const existing = connections.find((c) => c.fromId === a && c.toId === b);
    let nextConnections: CorkboardConnection[];
    if (existing) {
      nextConnections = connections.filter((c) => c.id !== existing.id);
    } else {
      nextConnections = [...connections, { id: `${a}-${b}`, fromId: a, toId: b }];
    }
    setConnections(nextConnections);
    emitNotes(notes, nextConnections);
    setLinkingFromId(null);
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("button, input, textarea, [data-no-drag]"));
  };

  const updateDrag = (clientX: number, clientY: number) => {
    if (!draggingId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const nextX = clientX - rect.left - dragOffset.current.x;
    const nextY = clientY - rect.top - dragOffset.current.y;
    const clampedX = Math.max(6, Math.min(rect.width - 180, nextX));
    const clampedY = Math.max(6, Math.min(rect.height - 80, nextY));
    setNotes((prev) =>
      prev.map((n) => (n.id === draggingId ? { ...n, x: clampedX, y: clampedY } : n)),
    );
  };

  const startDrag = (id: string, e: React.PointerEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    if (isInteractiveTarget(e.target)) return;

    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }

    const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
    const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
    
    dragOffset.current = {
      x: clientX - rect.left - note.x,
      y: clientY - rect.top - note.y,
    };
    setDraggingId(id);
    
    if ("pointerId" in e) {
      try {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignore setPointerCapture errors on mobile
      }
    }
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }

    const clientX = "clientX" in e ? e.clientX : (e as React.TouchEvent<HTMLDivElement>).touches[0]?.clientX;
    const clientY = "clientY" in e ? e.clientY : (e as React.TouchEvent<HTMLDivElement>).touches[0]?.clientY;

    if (clientX === undefined || clientY === undefined) return;
    updateDrag(clientX, clientY);
  };

  const endDrag = () => {
    if (!draggingId) return;
    const next = notes.slice();
    emitNotes(next, connections);
    setDraggingId(null);
  };

  useEffect(() => {
    if (!draggingId) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingId || !boardRef.current) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      updateDrag(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = () => {
      if (!draggingId) return;
      const next = notes.slice();
      emitNotes(next, connections);
      setDraggingId(null);
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [draggingId, notes, connections]);

  const noteWidth = 180;
  const noteHeight = 90;
  const boardHeight = useMemo(() => {
    const maxY = notes.reduce((acc, n) => Math.max(acc, n.y), 0);
    return Math.max(360, maxY + noteHeight + 40);
  }, [notes]);

  const getCenter = (note: CorkboardNote) => ({
    x: note.x + noteWidth / 2,
    y: note.y + noteHeight / 2,
  });

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>🧷 {labels.title}</span>
        <span>{notes.length}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={labels.placeholder}
          data-no-drag
          className="w-full rounded-md border border-white/10 bg-[#0b0c10]/60 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-gold)]"
        />
        <button
          type="button"
          onClick={addNote}
          data-no-drag
          className="rounded-md bg-[var(--color-gold)] px-3 py-2 text-sm font-semibold text-[#0a0b0e] hover:bg-[#f5c96a] transition whitespace-nowrap"
        >
          {labels.add}
        </button>
      </div>

      <p className="text-xs text-[var(--color-muted)]">{labels.helper}</p>

      {notes.length === 0 ? (
        <p className="text-xs text-white/70 italic">{labels.empty}</p>
      ) : (
        <div
          ref={boardRef}
          className="corkboard rounded-lg border border-[#8b6a3a]/40 p-4 relative w-full overflow-hidden touch-none"
          style={{ height: boardHeight }}
          onPointerMove={handleMove}
          onTouchMove={(e) => {
            if (e.cancelable) e.preventDefault();
            handleMove(e);
          }}
          onPointerUp={endDrag}
          onTouchEnd={endDrag}
          onPointerLeave={endDrag}
        >
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
              {connections.map((c) => {
                const from = notes.find((n) => n.id === c.fromId);
                const to = notes.find((n) => n.id === c.toId);
                if (!from || !to) return null;
                const a = getCenter(from);
                const b = getCenter(to);
                return (
                  <line
                    key={c.id}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(255, 216, 120, 0.6)"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>

            {notes.map((note) => (
              <div
                key={note.id}
                onPointerDownCapture={(e) => startDrag(note.id, e)}
                onTouchStartCapture={(e) => startDrag(note.id, e)}
                className={`absolute w-[180px] cursor-grab select-none rounded-md border border-white/10 bg-[#14161a]/80 p-3 shadow-md touch-none ${
                  draggingId === note.id ? "cursor-grabbing" : ""
                } ${linkingFromId === note.id ? "ring-2 ring-[var(--color-gold)]" : ""}`}
                style={{ left: note.x, top: note.y, touchAction: "none" }}
              >
                <div
                  className="absolute -top-2 left-3 h-3 w-3 rounded-full shadow"
                  style={{ backgroundColor: getPlayerColor(note.createdBy || playerId) }}
                />
                {editingId === note.id ? (
                  <div className="space-y-2 pr-6">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      data-no-drag
                      className="w-full rounded-md border border-white/10 bg-[#0b0c10]/60 px-2 py-1 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(note.id)}
                        data-no-drag
                        className="rounded-md bg-[var(--color-gold)] px-2 py-1 text-[10px] font-semibold text-[#0a0b0e]"
                      >
                        {locale === "no" ? "Lagre" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        data-no-drag
                        className="rounded-md border border-white/20 px-2 py-1 text-[10px] text-white"
                      >
                        {locale === "no" ? "Avbryt" : "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white pr-6">{note.text}</p>
                )}

                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => toggleLink(note.id)}
                    data-no-drag
                    className="text-[10px] text-white/70 hover:text-white"
                    aria-label={locale === "no" ? "Koble" : "Link"}
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    data-no-drag
                    className="text-[10px] text-white/70 hover:text-white"
                    aria-label={locale === "no" ? "Rediger" : "Edit"}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    data-no-drag
                    className="text-[10px] text-white/50 hover:text-white"
                    aria-label={locale === "no" ? "Fjern notat" : "Remove note"}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
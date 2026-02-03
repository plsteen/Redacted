
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type PresenceState = {
  playerId: string;
  playerName: string;
  color: string;
  updatedAt: number;
};

export type SessionEvent =
  | { type: "progress.updated"; payload: unknown }
  | { type: "progress.request"; payload: unknown }
  | { type: "evidence.unlocked"; payload: unknown }
  | { type: "hint.used"; payload: unknown }
  | { type: "tv.pin.updated"; payload: unknown }
  | { type: "corkboard.updated"; payload: unknown }
  | { type: "presence"; payload: unknown }
  | { type: "presence.announce"; payload: unknown }
  | { type: "join.request"; payload: unknown }
  | { type: "join.approved"; payload: unknown }
  | { type: "join.denied"; payload: unknown }
  | { type: "player.kicked"; payload: unknown }
  | { type: "game.reset"; payload: unknown };

// Subscribes to the session channel to receive realtime events and presence updates.
export function subscribeToSession(
  client: SupabaseClient<Database>,
  sessionId: string,
  onEvent: (event: SessionEvent) => void,
  onPresenceChange?: (presence: PresenceState[]) => void,
  presenceKey?: string,
  onSubscribed?: (channel: RealtimeChannel) => void,
): RealtimeChannel {
  const channel = client.channel(`session:${sessionId}`, {
    config: {
      broadcast: { self: true },
      ...(presenceKey ? { presence: { key: presenceKey } } : {}),
    },
  });
  channel.on("broadcast", { event: "progress.updated" }, (payload) => {
    onEvent({ type: "progress.updated", payload });
  });

  channel.on("broadcast", { event: "progress.request" }, (payload) => {
    onEvent({ type: "progress.request", payload });
  });

  channel.on("broadcast", { event: "evidence.unlocked" }, (payload) => {
    onEvent({ type: "evidence.unlocked", payload });
  });

  channel.on("broadcast", { event: "hint.used" }, (payload) => {
    onEvent({ type: "hint.used", payload });
  });

  channel.on("broadcast", { event: "tv.pin.updated" }, (payload) => {
    onEvent({ type: "tv.pin.updated", payload });
  });

  channel.on("broadcast", { event: "corkboard.updated" }, (payload) => {
    onEvent({ type: "corkboard.updated", payload });
  });

  channel.on("broadcast", { event: "presence" }, (payload) => {
    onEvent({ type: "presence", payload });
  });

  channel.on("broadcast", { event: "presence.announce" }, (payload) => {
    onEvent({ type: "presence.announce", payload });
  });

  channel.on("broadcast", { event: "join.request" }, (payload) => {
    onEvent({ type: "join.request", payload });
  });

  channel.on("broadcast", { event: "join.approved" }, (payload) => {
    onEvent({ type: "join.approved", payload });
  });

  channel.on("broadcast", { event: "join.denied" }, (payload) => {
    onEvent({ type: "join.denied", payload });
  });

  channel.on("broadcast", { event: "player.kicked" }, (payload) => {
    onEvent({ type: "player.kicked", payload });
  });

  channel.on("broadcast", { event: "game.reset" }, (payload) => {
    onEvent({ type: "game.reset", payload });
  });

  if (onPresenceChange) {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, PresenceState[]>;
      const allPresence = Object.values(state).flat();
      onPresenceChange(allPresence);
    });

    channel.on("presence", { event: "join" }, () => {
      const state = channel.presenceState() as Record<string, PresenceState[]>;
      const allPresence = Object.values(state).flat();
      onPresenceChange(allPresence);
    });

    channel.on("presence", { event: "leave" }, () => {
      const state = channel.presenceState() as Record<string, PresenceState[]>;
      const allPresence = Object.values(state).flat();
      onPresenceChange(allPresence);
    });
  }

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      onSubscribed?.(channel);
    }
  });
  return channel;
}

// Send presence data to the session channel
export function updatePresence(
  channel: RealtimeChannel,
  presence: PresenceState,
) {
  return channel.track(presence);
}

// Sends a broadcast event on the session channel.
export function emitSessionEvent(
  channel: RealtimeChannel,
  event: SessionEvent["type"],
  payload: unknown,
) {
  return channel.send({ type: "broadcast", event, payload });
}

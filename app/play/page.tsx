"use client";

import { Suspense, useMemo, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import tasksEn from "@/content/cases/silent-harbour/en/tasks.json";
import tasksNo from "@/content/cases/silent-harbour/no/tasks.json";
import evidenceEn from "@/content/cases/silent-harbour/en/evidence.json";
import evidenceNo from "@/content/cases/silent-harbour/no/evidence.json";
import caseEn from "@/content/cases/silent-harbour/en/case.json";
import caseNo from "@/content/cases/silent-harbour/no/case.json";
import { EvidenceList } from "@/components/Evidence/EvidenceList";
import { TaskView } from "@/components/Tasks/TaskView";
import { ProgressHUD } from "@/components/Shared/ProgressHUD";
import { TopBar } from "@/components/Shared/TopBar";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { Footer } from "@/components/Shared/Footer";
import { getMessagesForLocale } from "@/lib/i18n";
import { PlayerList } from "@/components/Shared/PlayerList";
import { HostControls } from "@/components/Shared/HostControls";
import { ToastContainer, type Toast } from "@/components/Shared/TaskAnsweredToast";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { emitSessionEvent, subscribeToSession, updatePresence, type PresenceState } from "@/lib/realtime";
import { saveGameState, getAutosaveInterval, loadGameState, clearGameState } from "@/lib/autosave";
import type { Evidence, Task } from "@/types/mystery";
import { useLocale } from "@/lib/hooks/useLocale";

// Lazy load heavy components
const Corkboard = dynamic(() => import("@/components/Board/Corkboard").then(m => ({ default: m.Corkboard })), {
  loading: () => <div className="glass-panel p-4 h-64 flex items-center justify-center text-[var(--color-muted)]">Loading board...</div>,
  ssr: false,
});

const RevelationModal = dynamic(() => import("@/components/Evidence/RevelationModal"), {
  ssr: false,
});

const CaseIntroModal = dynamic(() => import("@/components/Shared/CaseIntroModal"), {
  ssr: false,
});

const PlayerNameModal = dynamic(() => import("@/components/Shared/PlayerNameModal"), {
  ssr: false,
});

const CompletionScreen = dynamic(() => import("@/components/Shared/CompletionScreen"), {
  loading: () => <div className="min-h-screen bg-surface flex items-center justify-center">Loading results...</div>,
  ssr: false,
});

const CASE_TITLE = "Silent Harbour (demo)";

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface p-6">Loading...</div>}>
      <PlayPageContent />
    </Suspense>
  );
}

function PlayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();

  const t = getMessagesForLocale(locale);

  const tasks: Task[] = useMemo(() => (locale === "no" ? tasksNo : tasksEn) as Task[], [locale]);
  const evidence: Evidence[] = useMemo(
    () => (locale === "no" ? evidenceNo : evidenceEn) as Evidence[],
    [locale],
  );
  const caseData = useMemo(() => (locale === "no" ? caseNo : caseEn), [locale]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [showRevelation, setShowRevelation] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showNameInput, setShowNameInput] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [completedRevelations, setCompletedRevelations] = useState<Task[]>([]);
  const completedRevelationsRef = useRef<Task[]>([]);
  const [revelationTask, setRevelationTask] = useState<Task | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState(false);
  const [showRevelationsPanel, setShowRevelationsPanel] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [finalTimeElapsed, setFinalTimeElapsed] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [taskStartTime, setTaskStartTime] = useState<number>(() => Date.now());
  const [taskCompletionTimes, setTaskCompletionTimes] = useState<Array<{
    idx: number;
    timeSpent: number;
    hintsUsed: number;
  }>>([]);
  const [playerName, setPlayerName] = useState("");
  const [detectives, setDetectives] = useState<Array<{ id: string; name: string; color: string }>>([
    { id: "player1", name: "", color: "#e8b84d" },
  ]);
  const channelRef = useRef<ReturnType<typeof subscribeToSession> | null>(null);

  const [playerId, setPlayerId] = useState<string>(() => {
    // Generate playerId immediately on client-side, not in useEffect
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 11);
  });
  const [onlinePlayers, setOnlinePlayers] = useState<PresenceState[]>([]);
  const [announcedPlayers, setAnnouncedPlayers] = useState<PresenceState[]>([]);
  const [joinStatus, setJoinStatus] = useState<"pending" | "approved" | "denied">("pending");
  const [kickedPlayerIds, setKickedPlayerIds] = useState<Set<string>>(new Set());
  const joinRequestSentRef = useRef(false);
  const joinAutoApproveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoggedTaskIdxRef = useRef<number | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const hasLoadedAutosaveRef = useRef(false);
  const resumeBroadcastedRef = useRef(false);
  const progressRequestedRef = useRef(false);
  
  const [sessionCode, setSessionCode] = useState<string>("DEMO");
  const isHost = (searchParams?.get("mode") ?? "host") === "host";

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        setUserId(data.user?.id ?? null);
      } catch {
        setUserId(null);
      }
    };

    fetchUserId();
  }, []);

  // Initialize or load session code - must be unique per host
  useEffect(() => {
    // Check if code provided in URL
    const urlSession = searchParams?.get("session") ?? searchParams?.get("code");
    if (urlSession) {
      setSessionCode(urlSession);
      return;
    }

    // Check if we have a stored code in sessionStorage
    const stored = sessionStorage.getItem("sessionCode");
    if (stored) {
      setSessionCode(stored);
      return;
    }

    // Generate new code for host using userId + random
    if (isHost && userId) {
      // Use userId first 4 chars + last 4 chars + random 2 chars
      const userPart = (userId.substring(0, 2) + userId.substring(userId.length - 2)).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase();
      const code = userPart + randomPart;
      sessionStorage.setItem("sessionCode", code);
      setSessionCode(code);
    }
  }, [isHost, userId, searchParams]);

  // Load autosaved progress to avoid restarting on refresh/language change
  useEffect(() => {
    if (hasLoadedAutosaveRef.current) return;
    const saved = loadGameState();
    if (!saved) return;
    if (saved.sessionCode !== sessionCode || saved.caseId !== "silent-harbour") return;

    hasLoadedAutosaveRef.current = true;

    const resolved = tasks.filter((task) => saved.completedTaskIds.includes(task.id));
    setCompletedRevelations(resolved);
    setCurrentIdx(typeof saved.currentIdx === "number" ? saved.currentIdx : resolved.length);
    setHintUsed(Boolean(saved.hintUsed));
    if (typeof saved.hintsUsedCount === "number") {
      setHintsUsed(saved.hintsUsedCount);
    }
    if (typeof saved.timeElapsedSeconds === "number") {
      setStartTime(Date.now() - saved.timeElapsedSeconds * 1000);
      setTimeElapsed(saved.timeElapsedSeconds);
    }
    if (saved.playerName) {
      setPlayerName(saved.playerName);
      setDetectives([{ id: "player1", name: saved.playerName, color: "#e8b84d" }]);
    }
    setShowIntro(false);
    setShowNameInput(false);
    if (resolved.length >= tasks.length) {
      setShowCompletion(true);
      setFinalTimeElapsed(saved.timeElapsedSeconds ?? null);
    }
  }, [sessionCode, tasks, locale]);

  const logActivity = useCallback(
    async (action: string, metadata: Record<string, unknown> = {}) => {
      try {
        const pageUrl = `${window.location.pathname}${window.location.search}`;
        await fetch("/api/admin/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            sessionId: sessionCode,
            action,
            pageUrl,
            metadata: {
              caseId: (caseData as { id?: string })?.id || "silent-harbour",
              ...metadata,
            },
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
          }),
        });
      } catch {
        // Ignore logging errors
      }
    },
    [caseData, sessionCode, userId],
  );

  const persistGameState = useCallback(() => {
    if (!playerName || showCompletion) return;
    saveGameState({
      sessionCode,
      caseId: "silent-harbour",
      playerId: playerId || "local",
      playerName,
      currentIdx,
      completedTaskIds: completedRevelations.map((t) => t.id),
      hintUsed,
      hintsUsedCount: hintsUsed,
      timeElapsedSeconds: timeElapsed,
      timestamp: Date.now(),
    });
  }, [playerName, showCompletion, sessionCode, playerId, currentIdx, completedRevelations, hintUsed, hintsUsed, timeElapsed]);

  useEffect(() => {
    logActivity("page_view", { step: "play" });
  }, [logActivity]);

  useEffect(() => {
    const completedIdx = completedRevelations.length - 1;
    if (completedIdx < 0) return;
    if (lastLoggedTaskIdxRef.current === completedIdx) return;
    lastLoggedTaskIdxRef.current = completedIdx;
    logActivity("task_complete", { taskIndex: completedIdx, step: `Task ${completedIdx + 1}` });
  }, [completedRevelations.length, logActivity]);

  useEffect(() => {
    if (isHost) {
      setJoinStatus("approved");
    } else if (joinStatus === "pending") {
      // Auto-approve non-host players after 5 seconds if still pending
      // This allows them to play even if host doesn't respond immediately
      joinAutoApproveTimeoutRef.current = setTimeout(() => {
        setJoinStatus("approved");
        console.log("[Join] Auto-approved after timeout");
      }, 5000);
      return () => {
        if (joinAutoApproveTimeoutRef.current) {
          clearTimeout(joinAutoApproveTimeoutRef.current);
        }
      };
    }
  }, [isHost, joinStatus]);

  // Start timer when game begins
  useEffect(() => {
    if (!showIntro && startTime === null) {
      setStartTime(Date.now());
    }
  }, [showIntro, startTime]);

  // Track time elapsed
  useEffect(() => {
    if (startTime === null || showCompletion) return;
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, showCompletion]);

  useEffect(() => {
    if (!showCompletion || startTime === null || finalTimeElapsed !== null) return;
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    setFinalTimeElapsed(totalSeconds);
  }, [showCompletion, startTime, finalTimeElapsed]);

  const getPlayerColor = (id: string) => {
    const colors = [
      "#e8b84d",
      "#6a9fb5",
      "#b57a6a",
      "#8fb56a",
      "#b56a9f",
      "#b5926a",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Subscribe to realtime updates for task progress
  useEffect(() => {
    if (!sessionCode || !playerId) return;
    
    try {
      console.log("[Realtime] Setting up subscription for session:", sessionCode, "playerId:", playerId);
      const client = getSupabaseBrowserClient();
      const channel = subscribeToSession(
        client,
        sessionCode,
        (event) => {
          if (event.type === "presence.announce") {
            const raw = event.payload as { payload?: PresenceState } & PresenceState;
            const data = raw.payload ?? raw;
            console.log("[Realtime] Presence announce received:", data);
            if (data?.playerId) {
              setAnnouncedPlayers((prev) => {
                const existing = prev.find((p) => p.playerId === data.playerId);
                if (existing) {
                  return prev.map((p) => (p.playerId === data.playerId ? data : p));
                }
                return [...prev, data];
              });
            }
            return;
          }
          if (event.type === "join.request") {
            console.log("[Join] Received join.request event. isHost=", isHost, "channelRef=", !!channelRef.current);
            if (!isHost || !channelRef.current) {
              console.log("[Join] Skipping join.request - not host or no channel");
              return;
            }
            const raw = event.payload as { payload?: PresenceState } & PresenceState;
            const data = raw.payload ?? raw;
            if (!data?.playerId || data.playerId === playerId) return;
            const confirmMessage = locale === "no"
              ? `Tillat ${data.playerName ?? "(ukjent)"} å bli med?`
              : `Allow ${data.playerName ?? "(unknown)"} to join?`;
            const ok = window.confirm(confirmMessage);
            emitSessionEvent(channelRef.current, ok ? "join.approved" : "join.denied", { playerId: data.playerId });
            if (ok) {
              const completedIds = completedRevelationsRef.current.map((t) => t.id);
              emitSessionEvent(channelRef.current, "progress.updated", {
                currentIdx,
                completedTaskIds: completedIds,
                hintUsed,
              });
            }
            return;
          }
          if (event.type === "join.approved") {
            const raw = event.payload as { payload?: { playerId?: string } } & { playerId?: string };
            const data = raw.payload ?? raw;
            if (data.playerId && data.playerId === playerId) {
              setJoinStatus("approved");
            }
            return;
          }
          if (event.type === "join.denied") {
            const raw = event.payload as { payload?: { playerId?: string } } & { playerId?: string };
            const data = raw.payload ?? raw;
            if (data.playerId && data.playerId === playerId) {
              setJoinStatus("denied");
              setIsLocked(true);
              alert(locale === "no" ? "Verten avslo forespørselen." : "The host declined your request.");
              setTimeout(() => router.push("/"), 300);
            }
            return;
          }
          if (event.type === "player.kicked") {
            const raw = event.payload as { payload?: { playerId?: string } } & { playerId?: string };
            const data = raw.payload ?? raw;
            if (data.playerId) {
              // Add to kicked list so they disappear from investigators
              setKickedPlayerIds((prev) => new Set([...prev, data.playerId as string]));
              // If it's the current player, show alert and redirect
              if (data.playerId === playerId) {
                setIsKicked(true);
                setIsLocked(true);
                alert(locale === "no" ? "Du ble kastet ut av verten." : "You were removed by the host.");
                setTimeout(() => router.push("/"), 300);
              }
            }
            return;
          }
          if (event.type === "progress.request") {
            if (!isHost || !channelRef.current) return;
            const completedIds = completedRevelationsRef.current.map((t) => t.id);
            emitSessionEvent(channelRef.current, "progress.updated", {
              currentIdx,
              completedTaskIds: completedIds,
              hintUsed,
            });
            return;
          }
          if (event.type === "game.reset") {
            setCurrentIdx(0);
            setCompletedRevelations([]);
            setHintUsed(false);
            setHintsUsed(0);
            setPendingCompletion(false);
            setShowRevelation(false);
            setShowCompletion(false);
            setStartTime(null);
            setTimeElapsed(0);
            setFinalTimeElapsed(null);
            setTaskCompletionTimes([]);
            setShowIntro(true);
            setShowNameInput(false);
            clearGameState();
            resumeBroadcastedRef.current = false;
            return;
          }
          if (event.type === "progress.updated") {
            console.log("[Realtime] Progress event received:", event);
            const raw = event.payload as {
              payload?: {
                currentIdx?: number;
                completedTaskIds?: string[];
                completedRevelations?: Task[];
                hintUsed?: boolean;
              };
              currentIdx?: number;
              completedTaskIds?: string[];
              completedRevelations?: Task[];
              hintUsed?: boolean;
            };
            const data = raw.payload ?? raw;
            console.log("[Realtime] Parsed progress data:", data);
            const prevCompleted = completedRevelationsRef.current;
            
            // Update currentIdx - either from explicit value or from completed count
            if (typeof data.currentIdx === "number") {
              setCurrentIdx(data.currentIdx);
            }
            
            if (Array.isArray(data.completedTaskIds)) {
              const resolved = tasks.filter((task) => data.completedTaskIds?.includes(task.id));
              setCompletedRevelations(resolved);
              // If no explicit currentIdx, set it to the number of completed tasks
              if (typeof data.currentIdx !== "number") {
                setCurrentIdx(data.completedTaskIds.length);
              }
              if (data.completedTaskIds.length > prevCompleted.length) {
                const latestId = data.completedTaskIds[data.completedTaskIds.length - 1];
                const latest = tasks.find((task) => task.id === latestId) ?? null;
                if (latest) {
                  setRevelationTask(latest);
                  setShowRevelation(true);
                  // Show toast for other players answering (only if not our own submission)
                  // We detect this by checking if we haven't submitted this task yet
                  if (!completedRevelationsRef.current.some((t) => t.id === latestId)) {
                    const otherPlayerWithTask = announcedPlayers.find(() => {
                      // We'll match by finding an announced player
                      return true; // For now, pick the first other player
                    });
                    if (otherPlayerWithTask && otherPlayerWithTask.playerId !== playerId) {
                      setToasts((prev) => [
                        ...prev.slice(-2), // Keep last 2 toasts
                        {
                          id: `${latestId}-${Date.now()}`,
                          playerName: otherPlayerWithTask.playerName,
                          playerColor: otherPlayerWithTask.color,
                          taskNumber: latest.idx,
                          taskTotal: tasks.length,
                        },
                      ]);
                    }
                  }
                }
                if (data.completedTaskIds.length === tasks.length) {
                  setPendingCompletion(true);
                }
              }
            } else if (Array.isArray(data.completedRevelations)) {
              setCompletedRevelations(data.completedRevelations);
              // If no explicit currentIdx, set it to the number of completed tasks
              if (typeof data.currentIdx !== "number") {
                setCurrentIdx(data.completedRevelations.length);
              }
              if (data.completedRevelations.length > prevCompleted.length) {
                const latest = data.completedRevelations[data.completedRevelations.length - 1];
                setRevelationTask(latest);
                setShowRevelation(true);
                // Show toast for other players answering
                if (!completedRevelationsRef.current.some((t) => t.id === latest.id)) {
                  const otherPlayerWithTask = announcedPlayers.find((p) => p.playerId !== playerId);
                  if (otherPlayerWithTask) {
                    setToasts((prev) => [
                      ...prev.slice(-2), // Keep last 2 toasts
                      {
                        id: `${latest.id}-${Date.now()}`,
                        playerName: otherPlayerWithTask.playerName,
                        playerColor: otherPlayerWithTask.color,
                        taskNumber: latest.idx,
                        taskTotal: tasks.length,
                      },
                    ]);
                  }
                }
                if (data.completedRevelations.length === tasks.length) {
                  setPendingCompletion(true);
                }
              }
            }
            if (typeof data.hintUsed === "boolean") setHintUsed(data.hintUsed);
          }
          if (event.type === "task.answered") {
            // Only host processes task.answered events and broadcasts updated progress
            if (!isHost || !channelRef.current) return;
            
            const raw = event.payload as { playerId?: string; taskId?: string; playerName?: string } & Record<string, any>;
            const data = raw.payload ?? raw;
            
            console.log("[Task] Received task.answered from player:", data?.playerId, "task:", data?.taskId);
            
            // Host adds the completed task to its list if not already there
            const completedIds = completedRevelationsRef.current.map((t) => t.id);
            if (data?.taskId && !completedIds.includes(data.taskId)) {
              const newTask = tasks.find((t) => t.id === data.taskId);
              if (newTask) {
                console.log("[Task] Host broadcasting new completed task:", newTask.id);
                const updated = [...completedRevelationsRef.current, newTask];
                completedRevelationsRef.current = updated;
                const nextIdx = updated.length - 1;
                broadcastProgress(nextIdx, updated, hintUsed);
              }
            }
            return;
          }
        },
        (presence) => {
          console.log("[Realtime] Presence update received:", presence, "count:", presence.length);
          setOnlinePlayers(presence);
        },
        playerId,
        (subscribedChannel) => {
          // Send initial presence immediately after subscribe (with or without playerName)
          const initialPresence = {
            playerId,
            playerName: playerName || "(unnamed)",
            color: getPlayerColor(playerId),
            updatedAt: Date.now(),
          };
          console.log("[Realtime] Sending initial presence via track():", initialPresence);
          updatePresence(subscribedChannel, initialPresence).then(() => {
            console.log("[Realtime] track() succeeded");
            // Also broadcast as fallback
            emitSessionEvent(subscribedChannel, "presence.announce", initialPresence);
          }).catch((e) => {
            console.error("[Realtime] track() failed:", e);
          });
        },
      );
      channelRef.current = channel;
      console.log("[Realtime] Subscription successful");
    } catch (e) {
      console.error("[Realtime] Subscription failed:", e);
    }

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionCode, playerId]);

  useEffect(() => {
    completedRevelationsRef.current = completedRevelations;
  }, [completedRevelations]);

  // Update presence when player name changes
  useEffect(() => {
    if (!playerName || !playerId || !channelRef.current) return;
    const presenceData = {
      playerId,
      playerName,
      color: getPlayerColor(playerId),
      updatedAt: Date.now(),
    };
    console.log("[Realtime] Updating presence with player name:", presenceData);
    try {
      updatePresence(channelRef.current, presenceData);
      emitSessionEvent(channelRef.current, "presence.announce", presenceData);
    } catch (e) {
      console.error("[Realtime] Error updating presence:", e);
    }
  }, [playerName, playerId]);

  // Request host approval for joiners
  useEffect(() => {
    if (isHost) return;
    if (joinStatus !== "pending") return;
    if (!playerId || !playerName || !channelRef.current) return;
    if (joinRequestSentRef.current) return;
    joinRequestSentRef.current = true;
    const presenceData = {
      playerId,
      playerName,
      color: getPlayerColor(playerId),
      updatedAt: Date.now(),
    };
    emitSessionEvent(channelRef.current, "join.request", presenceData);
  }, [isHost, joinStatus, playerId, playerName]);

  // Ask host for current progress after approval
  useEffect(() => {
    if (isHost) return;
    if (joinStatus !== "approved") return;
    if (!channelRef.current) return;
    if (progressRequestedRef.current) return;
    progressRequestedRef.current = true;
    emitSessionEvent(channelRef.current, "progress.request", {});
  }, [isHost, joinStatus]);

  // Presence heartbeat to keep player list in sync
  useEffect(() => {
    if (!playerId || !channelRef.current) return;
    const interval = setInterval(() => {
      if (!channelRef.current) return;
      const presenceData = {
        playerId,
        playerName: playerName || "(unnamed)",
        color: getPlayerColor(playerId),
        updatedAt: Date.now(),
      };
      emitSessionEvent(channelRef.current, "presence.announce", presenceData);
    }, 10000);
    return () => clearInterval(interval);
  }, [playerId, playerName]);

  // Autosave game state periodically
  useEffect(() => {
    if (!playerName || showCompletion) return;

    const interval = setInterval(() => {
      persistGameState();
    }, getAutosaveInterval());

    return () => clearInterval(interval);
  }, [playerName, showCompletion, persistGameState]);

  // Save on important state changes (covers language change and refresh)
  useEffect(() => {
    persistGameState();
  }, [persistGameState]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistGameState();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [persistGameState]);

  // Broadcast current progress once for host after resume
  useEffect(() => {
    if (!isHost) return;
    if (!channelRef.current) return;
    if (resumeBroadcastedRef.current) return;
    if (currentIdx === 0 && completedRevelations.length === 0) return;
    const completedIds = completedRevelations.map((t) => t.id);
    emitSessionEvent(channelRef.current, "progress.updated", {
      currentIdx,
      completedTaskIds: completedIds,
      hintUsed,
    });
    resumeBroadcastedRef.current = true;
  }, [isHost, currentIdx, completedRevelations, hintUsed]);

  useEffect(() => {
    if (showCompletion) {
      clearGameState();
    }
  }, [showCompletion]);

  const currentTask = tasks[currentIdx];
  const isInteractionLocked = isLocked || isKicked || (!isHost && joinStatus !== "approved");
  const activeRevelationTask = revelationTask ?? currentTask;
  const unlockedEvidence = evidence.filter((ev) => ev.unlocked_on_task_idx <= currentTask.idx);
  const culprit = (caseData as { culprit?: { name?: string; image?: string } })?.culprit;

  // Log progress bar state for debugging
  useEffect(() => {
    console.log("[Progress] State update: currentIdx =", currentIdx, "completedRevelations.length =", completedRevelations.length, "joinStatus =", joinStatus, "isInteractionLocked =", isInteractionLocked);
  }, [currentIdx, completedRevelations.length, joinStatus, isInteractionLocked]);

  // Track local player's updatedAt timestamp outside of useMemo
  const localPlayerTimestampRef = useRef(0);
  useEffect(() => {
    localPlayerTimestampRef.current = Date.now();
  }, []);
  
  const effectivePlayers: PresenceState[] = useMemo(() => {
    const localPlayer: PresenceState = {
      playerId,
      playerName: playerName || "(unnamed)",
      color: getPlayerColor(playerId),
      updatedAt: localPlayerTimestampRef.current || 0,
    };

    const merged = new Map<string, PresenceState>();
    if (playerId) merged.set(playerId, localPlayer);
    for (const p of announcedPlayers) merged.set(p.playerId, p);
    for (const p of onlinePlayers) merged.set(p.playerId, p);

    // Filter out kicked players
    const list = Array.from(merged.values()).filter((p) => !kickedPlayerIds.has(p.playerId));
    console.log("[Realtime] effectivePlayers updated:", {
      localPlayer: playerId,
      announcedPlayers: announcedPlayers.length,
      onlinePlayers: onlinePlayers.length,
      total: list.length,
      kicked: kickedPlayerIds.size,
      players: list.map(p => ({ id: p.playerId, name: p.playerName }))
    });
    if (list.length === 0) return [localPlayer];
    return list;
  }, [onlinePlayers, announcedPlayers, playerId, playerName, kickedPlayerIds]);

  // Broadcast task progress changes
  const broadcastProgress = useCallback((idx: number, revelations: Task[], hint: boolean) => {
    console.log("[Progress] Broadcasting:", { idx, completedCount: revelations.length, hint, taskCount: tasks.length });
    if (!channelRef.current) {
      console.warn("[Realtime] Cannot broadcast - no channel");
      return;
    }
    const payload = {
      currentIdx: idx,
      completedTaskIds: revelations.map((task) => task.id),
      hintUsed: hint,
    };
    console.log("[Realtime] Broadcasting progress:", payload);
    try {
      emitSessionEvent(channelRef.current, "progress.updated", payload);
    } catch (e) {
      console.error("[Realtime] Error broadcasting progress:", e);
    }
  }, []);

  const handleSubmit = async (answer: string) => {
    if (isKicked) return false;
    setIsLocked(true);
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedExpected = currentTask.answer.trim().toLowerCase();
    
    // Simple fuzzy matching - allow for small typos
    const similarity = calculateSimilarity(normalizedAnswer, normalizedExpected);
    const correct = similarity > 0.8; // 80% similarity threshold

    setTimeout(() => setIsLocked(false), 400);
    if (correct) {
      // Track task completion time
      // eslint-disable-next-line react-hooks/purity -- Date.now() is valid in event handler
      const taskEndTime = Date.now();
      const taskTime = Math.floor((taskEndTime - taskStartTime) / 1000);
      const taskHints = hintUsed ? 1 : 0;
      
      setTaskCompletionTimes(prev => [
        ...prev,
        {
          idx: currentTask.idx,
          timeSpent: taskTime,
          hintsUsed: taskHints,
        },
      ]);
      
      setShowRevelation(true);
      setRevelationTask(currentTask);
      const nextRevelations = [...completedRevelations, currentTask];
      setCompletedRevelations(nextRevelations);
      if (nextRevelations.length === tasks.length) {
        setPendingCompletion(true);
      }
      // Only host broadcasts progress. Non-host sends task.answered event.
      if (isHost) {
        broadcastProgress(nextRevelations.length - 1, nextRevelations, hintUsed);
      } else if (channelRef.current) {
        emitSessionEvent(channelRef.current, "task.answered", {
          playerId,
          playerName,
          taskId: currentTask.id,
          timestamp: Date.now(),
        });
      }
    }
    return correct;
  };

  // Handle advancing to next task when revelation is closed
  const handleRevelationClose = useCallback(() => {
    setShowRevelation(false);
    setRevelationTask(null);
    if (pendingCompletion) {
      setPendingCompletion(false);
      setShowCompletion(true);
      return;
    }
    // Use completed revelations count to determine next task index (prevents skipping)
    const nextIdx = completedRevelations.length;
    setTaskStartTime(Date.now()); // Reset timer for next task
    console.log("[Progress] handleRevelationClose: nextIdx =", nextIdx, "completed =", completedRevelations.length, "total tasks =", tasks.length);
    if (nextIdx < tasks.length) {
      setCurrentIdx(nextIdx);
      setHintUsed(false);
      if (isHost && channelRef.current) {
        broadcastProgress(nextIdx, completedRevelations, false);
      }
    } else {
      // Game is complete
      setShowCompletion(true);
    }
  }, [pendingCompletion, tasks.length, completedRevelations, broadcastProgress]);

  // Simple Levenshtein distance for fuzzy matching
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const handleUseHint = () => {
    if (!hintUsed) {
      setHintUsed(true);
      setHintsUsed((prev) => prev + 1);
      broadcastProgress(currentIdx, completedRevelations, true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="noise-bg" />
      {!isHost && joinStatus === "pending" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-sm text-center space-y-3">
            <p className="text-sm text-white font-semibold">
              {locale === "no" ? "Venter på godkjenning fra verten" : "Waiting for host approval"}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {locale === "no" ? "Du kan ikke svare før verten har godkjent." : "You cannot answer until approved."}
            </p>
          </div>
        </div>
      )}
      {isKicked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-sm text-center space-y-3">
            <p className="text-sm text-white font-semibold">
              {locale === "no" ? "Du er kastet ut" : "You were removed"}
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition"
            >
              {locale === "no" ? "Til forsiden" : "Back to home"}
            </button>
          </div>
        </div>
      )}
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 space-y-4">
        {/* Top navigation bar */}
        <div className="flex items-center justify-between gap-4">
          <TopBar showLanguageSwitcher={false} />
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-3 py-1.5 rounded border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition"
            >
              {locale === "no" ? "← Hjem" : "← Home"}
            </button>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="glass-panel p-4 text-sm text-[var(--color-muted)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left side: Case info */}
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]">{CASE_TITLE}</p>
              <p className="text-sm text-[var(--color-muted)]">Session: {sessionCode}</p>
            </div>
            
            {/* Right side: Buttons and progress */}
            <div className="flex flex-col gap-3 md:gap-2 md:flex-row md:items-center md:justify-end md:flex-wrap">
              {isHost && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white">
                    <span className="text-[var(--color-muted)]">{t.play.joinCode}:</span>
                    <span className="font-semibold tracking-widest">{sessionCode}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(sessionCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1200);
                        } catch {
                          // ignore
                        }
                      }}
                      className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white hover:border-white/25"
                    >
                      {copied ? t.play.copied : t.play.copy}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const joinUrl = `${window.location.origin}/play?case=silent-harbour&session=${sessionCode}&mode=join`;
                        await navigator.clipboard.writeText(joinUrl);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 1200);
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-xs px-3 py-1 rounded-full border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition"
                  >
                    🔗 {linkCopied ? (locale === 'no' ? 'Kopiert!' : 'Copied!') : (locale === 'no' ? 'Del lenke' : 'Share link')}
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowIntro(true)}
                className="text-xs px-3 py-1 rounded border border-[var(--color-gold)]/30 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 transition w-fit"
              >
                📋 {locale === 'no' ? 'Casebriefing' : 'Case Briefing'}
              </button>
              {completedRevelations.length > 0 && (
                <button
                  onClick={() => setShowRevelationsPanel(!showRevelationsPanel)}
                  className="text-xs px-3 py-1 rounded border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition w-fit"
                >
                  💡 {locale === 'no' ? `Avdekninger (${completedRevelations.length})` : `Revelations (${completedRevelations.length})`}
                </button>
              )}
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white w-fit">
                {t.play.taskSection} {currentIdx + 1}/{tasks.length}
              </span>
            </div>
          </div>
        </div>

        {showRevelationsPanel && completedRevelations.length > 0 && (
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">
                💡 {locale === 'no' ? 'Løste oppgaver & avdekninger' : 'Solved Tasks & Revelations'}
              </h3>
              <button
                onClick={() => setShowRevelationsPanel(false)}
                className="text-xs px-3 py-1 rounded border border-white/20 text-white/60 hover:bg-white/10 transition"
              >
                {locale === 'no' ? 'Skjul' : 'Hide'}
              </button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {completedRevelations.map((task) => (
                <div key={task.id} className="border-l-2 border-[var(--color-accent)]/30 pl-4 py-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-gold)] mb-1">
                    {locale === 'no' ? 'Oppgave' : 'Task'} {task.idx}
                  </p>
                  <p className="text-sm font-medium text-white mb-2">{task.question}</p>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{task.revelation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid min-w-0 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4 min-w-0">
            <TaskView
              task={currentTask}
              onSubmit={handleSubmit}
              onUseHint={handleUseHint}
              hintUsed={hintUsed}
              isLocked={isInteractionLocked}
              locale={locale}
              currentTaskIdx={currentIdx}
            />
            <ProgressHUD tasks={tasks} currentIdx={currentIdx} locale={locale} />
            <Corkboard locale={locale} sessionId={sessionCode} />
          </div>

          <div className="space-y-4 min-w-0">
            <EvidenceList
              items={unlockedEvidence}
              locale={locale}
            />
             <PlayerList
              players={effectivePlayers}
               currentPlayerId={playerId}
               locale={locale}
             />
            {isHost && (
              <HostControls
                isHost={isHost}
                players={effectivePlayers}
                currentPlayerId={playerId}
                onKickPlayer={(playerId) => {
                  // Send kick event to other players
                  if (channelRef.current) {
                    emitSessionEvent(channelRef.current, "player.kicked", { playerId });
                  }
                }}
                onResetGame={() => {
                  // Reset game state
                  setCurrentIdx(0);
                  setCompletedRevelations([]);
                  setHintUsed(false);
                  setHintsUsed(0);
                  setStartTime(null);
                  setTimeElapsed(0);
                  setFinalTimeElapsed(null);
                  setTaskCompletionTimes([]);
                  setShowCompletion(false);
                  setShowIntro(true);
                  setShowNameInput(false);
                  clearGameState();
                  resumeBroadcastedRef.current = false;
                  // Broadcast reset event
                  if (channelRef.current) {
                    emitSessionEvent(channelRef.current, "game.reset", {});
                  }
                }}
                locale={locale}
              />
            )}
          </div>
        </div>
      </div>

      {showRevelation && activeRevelationTask?.revelation && (
        <RevelationModal
          title={activeRevelationTask.question}
          revelation={activeRevelationTask.revelation}
          isCorrect={true}
          onClose={handleRevelationClose}
          locale={locale}
          taskNumber={activeRevelationTask.idx}
          isHost={isHost}
          isFinal={activeRevelationTask.idx === tasks.length}
          culpritName={culprit?.name}
          culpritImage={culprit?.image}
        />
      )}

      {showIntro && (
        <CaseIntroModal
          title={caseData.title}
          location={caseData.location}
          date={caseData.date}
          backstory={caseData.backstory}
          onStart={() => {
            if (!playerName) {
              // First time - show name input after briefing
              setShowIntro(false);
              setShowNameInput(true);
            } else {
              // Already have player name - just close briefing
              setShowIntro(false);
            }
          }}
          locale={locale}
        />
      )}

      {showNameInput && (
        <PlayerNameModal
          locale={locale}
          onSubmit={(name) => {
            setPlayerName(name);
            setDetectives([{ id: "player1", name, color: "#e8b84d" }]);
            setShowNameInput(false);
          }}
        />
      )}

      {showCompletion && (
        <CompletionScreen
          tasks={tasks}
          completedRevelations={completedRevelations}
          hintsUsed={hintsUsed}
          timeElapsed={finalTimeElapsed ?? timeElapsed}
          taskCompletionTimes={taskCompletionTimes}
          locale={locale}
          detectives={detectives}
        />
      )}
      <ToastContainer toasts={toasts} />
      <Footer />
    </div>
  );
}

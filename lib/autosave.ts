/**
 * Game state autosave to localStorage
 */

export interface GameState {
  sessionCode: string;
  caseId: string;
  playerId: string;
  playerName: string;
  currentIdx: number;
  completedTaskIds: string[];
  hintUsed: boolean;
  hintsUsedCount?: number;
  timeElapsedSeconds?: number;
  timestamp: number;
}

const AUTOSAVE_KEY = "game_autosave";
const AUTOSAVE_INTERVAL = 5000; // Save every 5 seconds

/**
 * Save game state to localStorage
 */
export function saveGameState(state: GameState) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    console.log("[Autosave] Game state saved:", {
      sessionCode: state.sessionCode,
      currentIdx: state.currentIdx,
      completed: state.completedTaskIds.length,
    });
  } catch (e) {
    console.error("[Autosave] Failed to save:", e);
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(): GameState | null {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return null;
    const state = JSON.parse(saved) as GameState;
    console.log("[Autosave] Game state loaded:", {
      sessionCode: state.sessionCode,
      currentIdx: state.currentIdx,
      completed: state.completedTaskIds.length,
    });
    return state;
  } catch (e) {
    console.error("[Autosave] Failed to load:", e);
    return null;
  }
}

/**
 * Clear autosaved game state
 */
export function clearGameState() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
    console.log("[Autosave] Game state cleared");
  } catch (e) {
    console.error("[Autosave] Failed to clear:", e);
  }
}

/**
 * Get autosave interval for use in useEffect
 */
export function getAutosaveInterval(): number {
  return AUTOSAVE_INTERVAL;
}

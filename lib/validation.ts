import type { Task } from "@/types/mystery";

// Normalizes answers for lightweight equality checks.
export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

export function isCorrectAnswer(task: Task, submitted: string) {
  if (!submitted) return false;
  return normalizeAnswer(task.answer) === normalizeAnswer(submitted);
}

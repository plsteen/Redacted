export interface ScoreInput {
  isCorrect: boolean;
  usedHint: boolean;
  attemptNumber: number;
}

// Simple scoring: +100 for correct on first attempt without hint; otherwise 0.
export function calculateScore({ isCorrect, usedHint, attemptNumber }: ScoreInput) {
  if (!isCorrect) return 0;
  if (usedHint) return 0;
  if (attemptNumber > 1) return 0;
  return 100;
}

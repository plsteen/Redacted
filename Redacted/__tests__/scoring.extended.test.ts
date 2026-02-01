import { describe, expect, it, vi, beforeEach } from "vitest";
import { calculateScore, type ScoreInput } from "@/lib/scoring";

describe("scoring", () => {
  describe("calculateScore", () => {
    it("awards 100 on first correct attempt without hint", () => {
      const input: ScoreInput = { isCorrect: true, usedHint: false, attemptNumber: 1 };
      expect(calculateScore(input)).toBe(100);
    });

    it("awards 0 when answer is incorrect", () => {
      const input: ScoreInput = { isCorrect: false, usedHint: false, attemptNumber: 1 };
      expect(calculateScore(input)).toBe(0);
    });

    it("awards 0 when hint is used", () => {
      const input: ScoreInput = { isCorrect: true, usedHint: true, attemptNumber: 1 };
      expect(calculateScore(input)).toBe(0);
    });

    it("awards 0 on second attempt", () => {
      const input: ScoreInput = { isCorrect: true, usedHint: false, attemptNumber: 2 };
      expect(calculateScore(input)).toBe(0);
    });

    it("awards 0 on third attempt even without hint", () => {
      const input: ScoreInput = { isCorrect: true, usedHint: false, attemptNumber: 3 };
      expect(calculateScore(input)).toBe(0);
    });

    it("awards 0 when both hint used and multiple attempts", () => {
      const input: ScoreInput = { isCorrect: true, usedHint: true, attemptNumber: 3 };
      expect(calculateScore(input)).toBe(0);
    });

    it("awards 0 when incorrect regardless of other factors", () => {
      const inputs: ScoreInput[] = [
        { isCorrect: false, usedHint: false, attemptNumber: 1 },
        { isCorrect: false, usedHint: true, attemptNumber: 1 },
        { isCorrect: false, usedHint: false, attemptNumber: 5 },
      ];
      inputs.forEach((input) => {
        expect(calculateScore(input)).toBe(0);
      });
    });
  });

  describe("scoring edge cases", () => {
    it("handles attempt number of 0 gracefully", () => {
      const input: ScoreInput = { isCorrect: true, usedHint: false, attemptNumber: 0 };
      // Attempt 0 is less than 1, so it should still work (edge case)
      expect(calculateScore(input)).toBe(100);
    });

    it("handles very large attempt numbers", () => {
      const input: ScoreInput = { isCorrect: true, usedHint: false, attemptNumber: 1000 };
      expect(calculateScore(input)).toBe(0);
    });
  });
});

describe("game scoring scenarios", () => {
  it("calculates total score for a perfect game", () => {
    const tasks = [
      { isCorrect: true, usedHint: false, attemptNumber: 1 },
      { isCorrect: true, usedHint: false, attemptNumber: 1 },
      { isCorrect: true, usedHint: false, attemptNumber: 1 },
      { isCorrect: true, usedHint: false, attemptNumber: 1 },
      { isCorrect: true, usedHint: false, attemptNumber: 1 },
    ];
    const totalScore = tasks.reduce((sum, task) => sum + calculateScore(task), 0);
    expect(totalScore).toBe(500);
  });

  it("calculates total score when some hints are used", () => {
    const tasks = [
      { isCorrect: true, usedHint: false, attemptNumber: 1 }, // 100
      { isCorrect: true, usedHint: true, attemptNumber: 1 },  // 0
      { isCorrect: true, usedHint: false, attemptNumber: 1 }, // 100
      { isCorrect: true, usedHint: true, attemptNumber: 1 },  // 0
      { isCorrect: true, usedHint: false, attemptNumber: 1 }, // 100
    ];
    const totalScore = tasks.reduce((sum, task) => sum + calculateScore(task), 0);
    expect(totalScore).toBe(300);
  });

  it("calculates total score for a struggling player", () => {
    const tasks = [
      { isCorrect: true, usedHint: true, attemptNumber: 3 },  // 0
      { isCorrect: true, usedHint: true, attemptNumber: 2 },  // 0
      { isCorrect: true, usedHint: false, attemptNumber: 2 }, // 0
      { isCorrect: true, usedHint: false, attemptNumber: 1 }, // 100
      { isCorrect: true, usedHint: true, attemptNumber: 1 },  // 0
    ];
    const totalScore = tasks.reduce((sum, task) => sum + calculateScore(task), 0);
    expect(totalScore).toBe(100);
  });
});

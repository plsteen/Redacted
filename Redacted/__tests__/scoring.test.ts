import { describe, expect, it } from "vitest";
import { calculateScore } from "@/lib/scoring";
import { isCorrectAnswer } from "@/lib/validation";

const task = {
  id: "t1",
  idx: 1,
  type: "open" as const,
  question: "",
  options: [],
  answer: "Harbour",
  hint: "",
  is_final: false,
};

describe("scoring", () => {
  it("awards 100 on first correct attempt without hint", () => {
    expect(calculateScore({ isCorrect: true, usedHint: false, attemptNumber: 1 })).toBe(100);
  });

  it("awards 0 when hint used", () => {
    expect(calculateScore({ isCorrect: true, usedHint: true, attemptNumber: 1 })).toBe(0);
  });

  it("awards 0 on second attempt", () => {
    expect(calculateScore({ isCorrect: true, usedHint: false, attemptNumber: 2 })).toBe(0);
  });
});

describe("answer validation", () => {
  it("handles case-insensitive comparison", () => {
    expect(isCorrectAnswer(task, "harbour")).toBe(true);
  });

  it("rejects incorrect answers", () => {
    expect(isCorrectAnswer(task, "pier")).toBe(false);
  });
});

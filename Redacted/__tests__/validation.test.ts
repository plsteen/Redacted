import { describe, expect, it } from "vitest";
import { normalizeAnswer, isCorrectAnswer } from "@/lib/validation";
import type { Task } from "@/types/mystery";

describe("normalizeAnswer", () => {
  it("trims whitespace", () => {
    expect(normalizeAnswer("  hello  ")).toBe("hello");
  });

  it("converts to lowercase", () => {
    expect(normalizeAnswer("HELLO")).toBe("hello");
  });

  it("handles mixed case and whitespace", () => {
    expect(normalizeAnswer("  HeLLo WoRLD  ")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(normalizeAnswer("")).toBe("");
  });

  it("handles special characters", () => {
    expect(normalizeAnswer("Café-Résumé")).toBe("café-résumé");
  });
});

describe("isCorrectAnswer", () => {
  const createTask = (answer: string): Task => ({
    id: "test-task",
    idx: 0,
    type: "open",
    question: "Test question?",
    options: [],
    answer,
    hint: "Test hint",
    is_final: false,
  });

  it("returns true for exact match", () => {
    const task = createTask("Lina Haugen");
    expect(isCorrectAnswer(task, "Lina Haugen")).toBe(true);
  });

  it("returns true for case-insensitive match", () => {
    const task = createTask("Lina Haugen");
    expect(isCorrectAnswer(task, "lina haugen")).toBe(true);
    expect(isCorrectAnswer(task, "LINA HAUGEN")).toBe(true);
  });

  it("returns true when answer has extra whitespace", () => {
    const task = createTask("Lina Haugen");
    expect(isCorrectAnswer(task, "  Lina Haugen  ")).toBe(true);
  });

  it("returns false for incorrect answer", () => {
    const task = createTask("Lina Haugen");
    expect(isCorrectAnswer(task, "Erik Nordahl")).toBe(false);
  });

  it("returns false for partial match", () => {
    const task = createTask("Lina Haugen");
    expect(isCorrectAnswer(task, "Lina")).toBe(false);
  });

  it("returns false for empty string", () => {
    const task = createTask("Lina Haugen");
    expect(isCorrectAnswer(task, "")).toBe(false);
  });

  it("returns false for null-like values", () => {
    const task = createTask("Lina Haugen");
    // @ts-expect-error - testing edge case
    expect(isCorrectAnswer(task, null)).toBe(false);
    // @ts-expect-error - testing edge case
    expect(isCorrectAnswer(task, undefined)).toBe(false);
  });

  it("handles MCQ tasks", () => {
    const task: Task = {
      id: "mcq-task",
      idx: 1,
      type: "mcq",
      question: "Who is the culprit?",
      options: ["Erik Nordahl", "Lina Haugen", "Magnus Voll", "Ingrid Berg"],
      answer: "Lina Haugen",
      hint: "Check the alibi",
      is_final: true,
    };
    expect(isCorrectAnswer(task, "Lina Haugen")).toBe(true);
    expect(isCorrectAnswer(task, "Erik Nordahl")).toBe(false);
  });
});

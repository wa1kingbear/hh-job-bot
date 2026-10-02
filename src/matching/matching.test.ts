import { describe, expect, it } from "vitest";
import type { VacancyCandidate } from "../domain/vacancy.js";
import { calculateCompetitionScore } from "./competition-score.js";
import { calculateFreshnessScore } from "./freshness-score.js";
import { applyHardFilter } from "./hard-filter.js";
import { applyPrimaryStackPenalty, calculateFinalMatchScore } from "./match-score.js";
import { calculatePriorityScore } from "./priority-score.js";

const now = new Date("2026-10-02T00:00:00.000Z");

function candidate(overrides: Partial<VacancyCandidate> = {}): VacancyCandidate {
  return {
    hhId: "1",
    employerId: "10",
    name: "Senior React Developer",
    publishedAt: new Date("2026-10-01T23:50:00.000Z"),
    createdAt: new Date("2026-10-01T23:50:00.000Z"),
    remoteStatus: "confirmed",
    locationCompatible: true,
    seniority: "senior",
    primaryStack: "react",
    roleFocus: "frontend",
    isBlockedEmployer: false,
    isAlreadyProcessed: false,
    ...overrides,
  };
}

describe("hard filter", () => {
  it("accepts a remote Senior React vacancy", () => {
    expect(applyHardFilter(candidate(), { now })).toEqual({ passed: true, reason: "passed" });
  });

  it("rejects Vue as a primary stack", () => {
    expect(applyHardFilter(candidate({ primaryStack: "vue" }), { now })).toEqual({
      passed: false,
      reason: "irrelevant_primary_framework",
    });
  });

  it("allows React Native through the hard filter", () => {
    expect(
      applyHardFilter(candidate({ primaryStack: "react-native" }), { now }).passed,
    ).toBe(true);
  });

  it("rejects unconfirmed remote work", () => {
    expect(applyHardFilter(candidate({ remoteStatus: "unknown" }), { now }).reason).toBe(
      "remote_unconfirmed",
    );
  });
});

describe("scores", () => {
  it("applies a 10 point penalty to a primary React Native role", () => {
    expect(applyPrimaryStackPenalty(82, "react-native")).toBe(72);
  });

  it("ignores a low-confidence LLM result", () => {
    expect(calculateFinalMatchScore(80, { score: 20, confidence: 0.59 })).toBe(80);
  });

  it("uses normalized freshness buckets", () => {
    expect(calculateFreshnessScore(new Date("2026-10-01T23:50:00.000Z"), now)).toBe(100);
    expect(calculateFreshnessScore(new Date("2026-10-01T23:40:00.000Z"), now)).toBe(85);
  });

  it("keeps an unknown competition score as null", () => {
    expect(calculateCompetitionScore(null)).toBeNull();
  });

  it("reweights priority when competition is unavailable", () => {
    expect(calculatePriorityScore(80, 100, null)).toBe(85);
  });
});

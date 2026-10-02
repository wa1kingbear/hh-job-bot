import type { VacancyCandidate } from "../domain/vacancy.js";

export type HardFilterReason =
  | "passed"
  | "not_remote"
  | "remote_unconfirmed"
  | "location_incompatible"
  | "junior_or_middle"
  | "seniority_unconfirmed"
  | "irrelevant_primary_framework"
  | "irrelevant_role"
  | "backend_heavy"
  | "blocked_employer"
  | "already_processed"
  | "too_old";

export interface HardFilterResult {
  passed: boolean;
  reason: HardFilterReason;
}

export interface HardFilterOptions {
  now?: Date;
  maxVacancyAgeHours?: number;
}

const acceptedSeniorities = new Set(["senior", "lead", "staff", "principal"]);
const rejectedStacks = new Set(["vue", "angular", "svelte", "backend"]);

function reject(reason: Exclude<HardFilterReason, "passed">): HardFilterResult {
  return { passed: false, reason };
}

export function applyHardFilter(
  vacancy: VacancyCandidate,
  options: HardFilterOptions = {},
): HardFilterResult {
  if (vacancy.isAlreadyProcessed) return reject("already_processed");
  if (vacancy.isBlockedEmployer) return reject("blocked_employer");
  if (vacancy.remoteStatus === "rejected") return reject("not_remote");
  if (vacancy.remoteStatus === "unknown") return reject("remote_unconfirmed");
  if (vacancy.locationCompatible === false) return reject("location_incompatible");

  if (vacancy.seniority === "junior" || vacancy.seniority === "middle") {
    return reject("junior_or_middle");
  }
  if (!acceptedSeniorities.has(vacancy.seniority)) {
    return reject("seniority_unconfirmed");
  }

  if (rejectedStacks.has(vacancy.primaryStack)) {
    return reject("irrelevant_primary_framework");
  }
  if (vacancy.primaryStack === "unknown") return reject("irrelevant_role");

  if (
    vacancy.roleFocus === "balanced-fullstack" ||
    vacancy.roleFocus === "backend-leaning-fullstack" ||
    vacancy.roleFocus === "backend"
  ) {
    return reject("backend_heavy");
  }
  if (vacancy.roleFocus === "unknown") return reject("irrelevant_role");

  const maxAgeHours = options.maxVacancyAgeHours ?? 24;
  const now = options.now ?? new Date();
  const sourceDate = vacancy.publishedAt ?? vacancy.createdAt;
  if (sourceDate && now.getTime() - sourceDate.getTime() > maxAgeHours * 3_600_000) {
    return reject("too_old");
  }

  return { passed: true, reason: "passed" };
}

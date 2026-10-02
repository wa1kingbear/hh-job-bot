export const seniorityLevels = [
  "junior",
  "middle",
  "senior",
  "lead",
  "staff",
  "principal",
  "unknown",
] as const;

export type Seniority = (typeof seniorityLevels)[number];

export const primaryStacks = [
  "react",
  "nextjs",
  "react-native",
  "vue",
  "angular",
  "svelte",
  "other-frontend",
  "backend",
  "unknown",
] as const;

export type PrimaryStack = (typeof primaryStacks)[number];

export const roleFocuses = [
  "frontend",
  "frontend-leaning-fullstack",
  "balanced-fullstack",
  "backend-leaning-fullstack",
  "backend",
  "unknown",
] as const;

export type RoleFocus = (typeof roleFocuses)[number];

export type RemoteStatus = "confirmed" | "rejected" | "unknown";

export interface VacancyCandidate {
  hhId: string;
  employerId: string | null;
  name: string;
  publishedAt: Date | null;
  createdAt: Date | null;
  remoteStatus: RemoteStatus;
  locationCompatible: boolean | null;
  seniority: Seniority;
  primaryStack: PrimaryStack;
  roleFocus: RoleFocus;
  isBlockedEmployer: boolean;
  isAlreadyProcessed: boolean;
}

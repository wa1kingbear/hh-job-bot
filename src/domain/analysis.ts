import type { RoleFocus, Seniority, RemoteStatus } from "./vacancy.js";

export interface VacancyAnalysis {
  score: number;
  summary: string;
  matches: string[];
  gaps: string[];
  risks: string[];
  roleFocus: RoleFocus;
  seniority: Seniority;
  remoteStatus: RemoteStatus;
  locationCompatible: boolean | null;
  confidence: number;
}

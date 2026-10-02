import { HhClient } from "./hh.client.js";
import { hhVacancyDetailsSchema, type HhVacancyDetails } from "./hh.types.js";

export function getVacancy(client: HhClient, vacancyId: string): Promise<HhVacancyDetails> {
  return client.get(`/vacancies/${encodeURIComponent(vacancyId)}`, hhVacancyDetailsSchema);
}

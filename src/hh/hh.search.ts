import { HhClient } from "./hh.client.js";
import {
  hhVacancySearchResponseSchema,
  type HhVacancyListItem,
  type HhVacancySearchResponse,
} from "./hh.types.js";

export const defaultSearchQueries = [
  "React TypeScript",
  "Senior React",
  "Lead Frontend",
  "Next.js",
  "React Native Senior",
  "Frontend Tech Lead",
] as const;

export interface SearchOptions {
  queries?: readonly string[];
  periodDays?: number;
  perPage?: number;
  maxPagesPerQuery?: number;
}

async function searchPage(
  client: HhClient,
  searchText: string,
  page: number,
  options: Required<Omit<SearchOptions, "queries">>,
): Promise<HhVacancySearchResponse> {
  const query = new URLSearchParams({
    text: searchText,
    schedule: "remote",
    order_by: "publication_time",
    period: String(options.periodDays),
    per_page: String(options.perPage),
    page: String(page),
  });
  query.append("experience", "between3And6");
  query.append("experience", "moreThan6");

  return client.get("/vacancies", hhVacancySearchResponseSchema, query);
}

export async function searchVacancies(
  client: HhClient,
  options: SearchOptions = {},
): Promise<HhVacancyListItem[]> {
  const queries = options.queries ?? defaultSearchQueries;
  const normalizedOptions = {
    periodDays: options.periodDays ?? 1,
    perPage: options.perPage ?? 100,
    maxPagesPerQuery: options.maxPagesPerQuery ?? 20,
  };
  const uniqueVacancies = new Map<string, HhVacancyListItem>();

  for (const searchText of queries) {
    const firstPage = await searchPage(client, searchText, 0, normalizedOptions);
    for (const vacancy of firstPage.items) uniqueVacancies.set(vacancy.id, vacancy);

    const pageCount = Math.min(firstPage.pages, normalizedOptions.maxPagesPerQuery);
    for (let page = 1; page < pageCount; page += 1) {
      const result = await searchPage(client, searchText, page, normalizedOptions);
      for (const vacancy of result.items) uniqueVacancies.set(vacancy.id, vacancy);
    }
  }

  return [...uniqueVacancies.values()].sort(
    (left, right) => Date.parse(right.published_at) - Date.parse(left.published_at),
  );
}

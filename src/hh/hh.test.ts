import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { HhApiError, HhClient } from "./hh.client.js";
import { searchVacancies } from "./hh.search.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function listItem(id: string, publishedAt: string) {
  return {
    id,
    name: "Senior React Developer",
    alternate_url: `https://hh.ru/vacancy/${id}`,
    published_at: publishedAt,
    created_at: publishedAt,
    employer: { id: "42", name: "Example" },
    salary: null,
    schedule: { id: "remote", name: "Удаленная работа" },
    employment: { id: "full", name: "Полная занятость" },
    experience: { id: "between3And6", name: "От 3 до 6 лет" },
    area: { id: "1", name: "Москва" },
  };
}

describe("HhClient", () => {
  it("sends the required user agent and bearer token", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new HhClient({
      userAgent: "test/1.0 (test@example.com)",
      accessToken: "secret",
      fetchImplementation: fetchMock,
    });

    await client.get("/test", z.object({ ok: z.boolean() }));

    const request = fetchMock.mock.calls[0];
    expect(request).toBeDefined();
    const headers = new Headers(request?.[1]?.headers);
    expect(headers.get("hh-user-agent")).toBe("test/1.0 (test@example.com)");
    expect(headers.get("authorization")).toBe("Bearer secret");
  });

  it("raises a typed error for a failed request", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ error: "bad" }, 400));
    const client = new HhClient({
      userAgent: "test/1.0 (test@example.com)",
      fetchImplementation: fetchMock,
      maxRetries: 0,
    });

    await expect(client.get("/test", z.unknown())).rejects.toBeInstanceOf(HhApiError);
  });
});

describe("searchVacancies", () => {
  it("deduplicates vacancies returned by different search profiles", async () => {
    const older = listItem("1", "2026-10-02T01:00:00+03:00");
    const newer = listItem("2", "2026-10-02T02:00:00+03:00");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ items: [older, newer], found: 2, pages: 1, page: 0, per_page: 100 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ items: [newer], found: 1, pages: 1, page: 0, per_page: 100 }),
      );
    const client = new HhClient({
      userAgent: "test/1.0 (test@example.com)",
      fetchImplementation: fetchMock,
    });

    const result = await searchVacancies(client, { queries: ["React", "Senior React"] });

    expect(result.map((vacancy) => vacancy.id)).toEqual(["2", "1"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

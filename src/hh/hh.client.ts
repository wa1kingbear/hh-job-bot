import type { ZodType } from "zod";

const DEFAULT_BASE_URL = "https://api.hh.ru/";

export interface HhClientOptions {
  userAgent: string;
  accessToken?: string;
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
  maxRetries?: number;
}

export class HhApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "HhApiError";
  }
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1_000, 60_000);
  }
  return Math.min(1_000 * 2 ** attempt, 30_000);
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolvePromise) => setTimeout(resolvePromise, milliseconds));

export class HhClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof fetch;
  private readonly maxRetries: number;

  constructor(private readonly options: HhClientOptions) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.maxRetries = options.maxRetries ?? 3;
  }

  async get<T>(path: string, schema: ZodType<T>, query?: URLSearchParams): Promise<T> {
    const url = new URL(path.replace(/^\//, ""), this.baseUrl);
    if (query) url.search = query.toString();

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const response = await this.fetchImplementation(url, {
        headers: this.headers(),
        signal: AbortSignal.timeout(30_000),
      });

      if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
        await wait(retryDelayMs(response, attempt));
        continue;
      }

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new HhApiError(`HH API request failed with status ${response.status}`, response.status, body);
      }

      return schema.parse(body);
    }

    throw new Error("HH API retry loop exhausted unexpectedly");
  }

  private headers(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "HH-User-Agent": this.options.userAgent,
      "User-Agent": this.options.userAgent,
    };
    if (this.options.accessToken) {
      headers.Authorization = `Bearer ${this.options.accessToken}`;
    }
    return headers;
  }
}

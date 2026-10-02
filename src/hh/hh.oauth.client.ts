import { z } from "zod";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1).nullable().optional(),
});

export type HhTokenResponse = z.infer<typeof tokenResponseSchema>;

export class HhOAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "HhOAuthError";
  }
}

export interface HhOAuthClientOptions {
  userAgent: string;
  tokenUrl?: string;
  fetchImplementation?: typeof fetch;
}

export class HhOAuthClient {
  private readonly tokenUrl: string;
  private readonly fetchImplementation: typeof fetch;

  constructor(private readonly options: HhOAuthClientOptions) {
    this.tokenUrl = options.tokenUrl ?? "https://api.hh.ru/token";
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  exchangeAuthorizationCode(input: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    code: string;
    codeVerifier: string;
  }): Promise<HhTokenResponse> {
    return this.requestToken(
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: input.clientId,
        client_secret: input.clientSecret,
        redirect_uri: input.redirectUri,
        code: input.code,
        code_verifier: input.codeVerifier,
      }),
    );
  }

  refreshAccessToken(refreshToken: string): Promise<HhTokenResponse> {
    return this.requestToken(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    );
  }

  private async requestToken(body: URLSearchParams): Promise<HhTokenResponse> {
    const response = await this.fetchImplementation(this.tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "HH-User-Agent": this.options.userAgent,
        "User-Agent": this.options.userAgent,
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      throw new HhOAuthError(
        `HH OAuth token request failed with status ${response.status}`,
        response.status,
        responseBody,
      );
    }
    return tokenResponseSchema.parse(responseBody);
  }
}

import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { HhOAuthConfig } from "../config/env.js";
import { HhOAuthClient } from "./hh.oauth.client.js";
import type {
  OAuthStore,
  PendingAuthorizationRequest,
  StoredOAuthTokens,
} from "./hh.oauth.types.js";
import { HhOAuthService, InvalidOAuthStateError } from "./hh.oauth.js";

class MemoryOAuthStore implements OAuthStore {
  request: PendingAuthorizationRequest | null = null;
  tokens: StoredOAuthTokens | null = null;

  async saveAuthorizationRequest(request: PendingAuthorizationRequest): Promise<void> {
    this.request = request;
  }

  async consumeAuthorizationRequest(stateHash: string, now: Date): Promise<string | null> {
    if (!this.request || this.request.stateHash !== stateHash || this.request.expiresAt <= now) {
      return null;
    }
    const encryptedVerifier = this.request.encryptedCodeVerifier;
    this.request = null;
    return encryptedVerifier;
  }

  async saveTokens(tokens: StoredOAuthTokens): Promise<void> {
    this.tokens = tokens;
  }

  async getTokens(): Promise<StoredOAuthTokens | null> {
    return this.tokens;
  }
}

const config: HhOAuthConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
  redirectUri: "https://example.com/auth/hh/callback",
  userAgent: "test/1.0 (test@example.com)",
  tokenEncryptionKey: Buffer.alloc(32, 7).toString("base64"),
};

function tokenResponse(accessToken: string, refreshToken: string, expiresIn = 3600): Response {
  return new Response(
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: expiresIn,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("HhOAuthService", () => {
  it("uses state and PKCE, then stores encrypted tokens", async () => {
    const store = new MemoryOAuthStore();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      tokenResponse("access-secret", "refresh-secret"),
    );
    const service = new HhOAuthService(
      config,
      store,
      new HhOAuthClient({ userAgent: config.userAgent, fetchImplementation: fetchMock }),
      () => new Date("2026-10-02T00:00:00.000Z"),
    );

    const authorizationUrl = new URL(await service.createAuthorizationUrl());
    const state = authorizationUrl.searchParams.get("state");
    expect(state).toBeTruthy();
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256");

    await service.completeAuthorization("authorization-code", state!);

    const requestBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(requestBody).toBeInstanceOf(URLSearchParams);
    const params = requestBody as URLSearchParams;
    const verifier = params.get("code_verifier");
    const challenge = createHash("sha256").update(verifier!, "ascii").digest("base64url");
    expect(challenge).toBe(authorizationUrl.searchParams.get("code_challenge"));
    expect(params.get("client_secret")).toBe("client-secret");
    expect(store.tokens?.encryptedAccessToken).not.toContain("access-secret");
    await expect(service.getValidAccessToken()).resolves.toBe("access-secret");

    await expect(service.completeAuthorization("another-code", state!)).rejects.toBeInstanceOf(
      InvalidOAuthStateError,
    );
  });

  it("refreshes an expired token and persists the rotated pair", async () => {
    const store = new MemoryOAuthStore();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(tokenResponse("old-access", "old-refresh", 1))
      .mockResolvedValueOnce(tokenResponse("new-access", "new-refresh"));
    let now = new Date("2026-10-02T00:00:00.000Z");
    const service = new HhOAuthService(
      config,
      store,
      new HhOAuthClient({ userAgent: config.userAgent, fetchImplementation: fetchMock }),
      () => now,
    );
    const authorizationUrl = new URL(await service.createAuthorizationUrl());
    await service.completeAuthorization(
      "authorization-code",
      authorizationUrl.searchParams.get("state")!,
    );

    now = new Date("2026-10-02T00:00:02.000Z");
    await expect(service.getValidAccessToken()).resolves.toBe("new-access");

    const refreshBody = fetchMock.mock.calls[1]?.[1]?.body as URLSearchParams;
    expect(Object.fromEntries(refreshBody)).toEqual({
      grant_type: "refresh_token",
      refresh_token: "old-refresh",
    });
    expect(store.tokens?.encryptedRefreshToken).not.toContain("new-refresh");
  });
});

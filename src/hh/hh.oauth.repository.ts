import { and, eq, gt, isNull } from "drizzle-orm";
import type { DatabaseClient } from "../db/client.js";
import { oauthAuthorizationRequests, oauthTokens } from "../db/schema.js";
import type {
  OAuthStore,
  PendingAuthorizationRequest,
  StoredOAuthTokens,
} from "./hh.oauth.types.js";

const SINGLE_USER_TOKEN_ID = 1;

export class HhOAuthRepository implements OAuthStore {
  constructor(private readonly db: DatabaseClient) {}

  async saveAuthorizationRequest(request: PendingAuthorizationRequest): Promise<void> {
    await this.db.insert(oauthAuthorizationRequests).values(request);
  }

  async consumeAuthorizationRequest(stateHash: string, now: Date): Promise<string | null> {
    return this.db.transaction((transaction) => {
      const request = transaction
        .select({
          id: oauthAuthorizationRequests.id,
          encryptedCodeVerifier: oauthAuthorizationRequests.encryptedCodeVerifier,
        })
        .from(oauthAuthorizationRequests)
        .where(
          and(
            eq(oauthAuthorizationRequests.stateHash, stateHash),
            isNull(oauthAuthorizationRequests.consumedAt),
            gt(oauthAuthorizationRequests.expiresAt, now),
          ),
        )
        .get();

      if (!request) return null;

      transaction
        .update(oauthAuthorizationRequests)
        .set({ consumedAt: now })
        .where(eq(oauthAuthorizationRequests.id, request.id))
        .run();

      return request.encryptedCodeVerifier;
    });
  }

  async saveTokens(tokens: StoredOAuthTokens): Promise<void> {
    await this.db
      .insert(oauthTokens)
      .values({ id: SINGLE_USER_TOKEN_ID, ...tokens })
      .onConflictDoUpdate({
        target: oauthTokens.id,
        set: tokens,
      });
  }

  async getTokens(): Promise<StoredOAuthTokens | null> {
    const tokens = await this.db
      .select({
        encryptedAccessToken: oauthTokens.encryptedAccessToken,
        encryptedRefreshToken: oauthTokens.encryptedRefreshToken,
        tokenType: oauthTokens.tokenType,
        expiresAt: oauthTokens.expiresAt,
        updatedAt: oauthTokens.updatedAt,
      })
      .from(oauthTokens)
      .where(eq(oauthTokens.id, SINGLE_USER_TOKEN_ID))
      .get();

    return tokens ?? null;
  }
}

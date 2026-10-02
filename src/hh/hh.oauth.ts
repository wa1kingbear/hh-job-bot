import { createHash, randomBytes } from "node:crypto";
import type { HhOAuthConfig } from "../config/env.js";
import { SecretCipher } from "../security/encryption.js";
import { HhOAuthClient, type HhTokenResponse } from "./hh.oauth.client.js";
import type { OAuthStore, StoredOAuthTokens } from "./hh.oauth.types.js";

const AUTHORIZATION_URL = "https://hh.ru/oauth/authorize";
const AUTHORIZATION_REQUEST_TTL_MS = 10 * 60 * 1_000;

const sha256Base64Url = (value: string): string =>
  createHash("sha256").update(value, "ascii").digest("base64url");

const hashState = (state: string): string =>
  createHash("sha256").update(state, "utf8").digest("hex");

export class InvalidOAuthStateError extends Error {
  constructor() {
    super("OAuth state is invalid, expired, or already used");
    this.name = "InvalidOAuthStateError";
  }
}

export class ReauthorizationRequiredError extends Error {
  constructor() {
    super("HH reauthorization is required");
    this.name = "ReauthorizationRequiredError";
  }
}

export class HhOAuthService {
  private readonly cipher: SecretCipher;
  private refreshInFlight: Promise<string> | null = null;

  constructor(
    private readonly config: HhOAuthConfig,
    private readonly store: OAuthStore,
    private readonly client: HhOAuthClient,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.cipher = new SecretCipher(config.tokenEncryptionKey);
  }

  async createAuthorizationUrl(): Promise<string> {
    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(64).toString("base64url");
    const createdAt = this.now();

    await this.store.saveAuthorizationRequest({
      stateHash: hashState(state),
      encryptedCodeVerifier: this.cipher.encrypt(codeVerifier),
      expiresAt: new Date(createdAt.getTime() + AUTHORIZATION_REQUEST_TTL_MS),
    });

    const url = new URL(AUTHORIZATION_URL);
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      code_challenge: sha256Base64Url(codeVerifier),
      code_challenge_method: "S256",
    }).toString();
    return url.toString();
  }

  async completeAuthorization(code: string, state: string): Promise<void> {
    const encryptedCodeVerifier = await this.store.consumeAuthorizationRequest(
      hashState(state),
      this.now(),
    );
    if (!encryptedCodeVerifier) throw new InvalidOAuthStateError();

    const response = await this.client.exchangeAuthorizationCode({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      code,
      codeVerifier: this.cipher.decrypt(encryptedCodeVerifier),
    });
    await this.saveTokenResponse(response);
  }

  async getValidAccessToken(): Promise<string> {
    const tokens = await this.store.getTokens();
    if (!tokens) throw new ReauthorizationRequiredError();
    if (this.now().getTime() < tokens.expiresAt.getTime()) {
      return this.cipher.decrypt(tokens.encryptedAccessToken);
    }
    if (!tokens.encryptedRefreshToken) throw new ReauthorizationRequiredError();

    if (!this.refreshInFlight) {
      this.refreshInFlight = this.refresh(tokens).finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  async isAuthorized(): Promise<boolean> {
    return (await this.store.getTokens()) !== null;
  }

  private async refresh(tokens: StoredOAuthTokens): Promise<string> {
    const refreshToken = this.cipher.decrypt(tokens.encryptedRefreshToken!);
    const response = await this.client.refreshAccessToken(refreshToken);
    await this.saveTokenResponse(response);
    return response.access_token;
  }

  private async saveTokenResponse(response: HhTokenResponse): Promise<void> {
    const updatedAt = this.now();
    await this.store.saveTokens({
      encryptedAccessToken: this.cipher.encrypt(response.access_token),
      encryptedRefreshToken: response.refresh_token
        ? this.cipher.encrypt(response.refresh_token)
        : null,
      tokenType: response.token_type,
      expiresAt: new Date(updatedAt.getTime() + response.expires_in * 1_000),
      updatedAt,
    });
  }
}

export interface PendingAuthorizationRequest {
  stateHash: string;
  encryptedCodeVerifier: string;
  expiresAt: Date;
}

export interface StoredOAuthTokens {
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
  tokenType: string;
  expiresAt: Date;
  updatedAt: Date;
}

export interface OAuthStore {
  saveAuthorizationRequest(request: PendingAuthorizationRequest): Promise<void>;
  consumeAuthorizationRequest(stateHash: string, now: Date): Promise<string | null>;
  saveTokens(tokens: StoredOAuthTokens): Promise<void>;
  getTokens(): Promise<StoredOAuthTokens | null>;
}

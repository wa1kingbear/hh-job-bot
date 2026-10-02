import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION = "v1";

export class SecretCipher {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, "base64");
    if (this.key.length !== 32) {
      throw new Error("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
    }
  }

  encrypt(value: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [VERSION, iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(":");
  }

  decrypt(payload: string): string {
    const [version, encodedIv, encodedAuthTag, encodedCiphertext] = payload.split(":");
    if (!version || !encodedIv || !encodedAuthTag || !encodedCiphertext || version !== VERSION) {
      throw new Error("Invalid encrypted secret format");
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(encodedIv, "base64url"));
    decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, "base64url")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  }
}

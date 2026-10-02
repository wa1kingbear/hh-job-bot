import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SecretCipher } from "./encryption.js";

describe("SecretCipher", () => {
  it("encrypts and decrypts a secret", () => {
    const cipher = new SecretCipher(randomBytes(32).toString("base64"));
    const encrypted = cipher.encrypt("access-token");

    expect(encrypted).not.toContain("access-token");
    expect(cipher.decrypt(encrypted)).toBe("access-token");
  });

  it("rejects tampered ciphertext", () => {
    const cipher = new SecretCipher(randomBytes(32).toString("base64"));
    const encrypted = cipher.encrypt("access-token");
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;

    expect(() => cipher.decrypt(tampered)).toThrow();
  });

  it("requires a 256-bit key", () => {
    expect(() => new SecretCipher(Buffer.from("short").toString("base64"))).toThrow(
      "base64-encoded 32-byte key",
    );
  });
});

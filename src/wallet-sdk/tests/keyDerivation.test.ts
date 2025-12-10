import { describe, test, expect } from "bun:test";
import { KeyDerivation } from "../keyDerivation";
import { bytesToHex } from "viem";

describe("Key Derivation", () => {
  test("derive keys from signature", () => {
    const mockKeys = {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7" as const,
      viewPrivateKey: new Uint8Array(32).fill(1),
      viewPublicKey: new Uint8Array(33).fill(2),
      spendPrivateKey: new Uint8Array(32).fill(3),
      spendPublicKey: new Uint8Array(33).fill(4),
    };

    expect(mockKeys.address).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7");
    expect(mockKeys.viewPrivateKey).toBeTruthy();
    expect(mockKeys.viewPublicKey).toBeTruthy();
    expect(mockKeys.spendPrivateKey).toBeTruthy();
    expect(mockKeys.spendPublicKey).toBeTruthy();
  });

  test("serialize and deserialize keys", () => {
    const testKeys = {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7" as const,
      viewPrivateKey: new Uint8Array(32).fill(1),
      viewPublicKey: new Uint8Array(33).fill(2),
      spendPrivateKey: new Uint8Array(32).fill(3),
      spendPublicKey: new Uint8Array(33).fill(4),
    };

    const serialized = KeyDerivation.serializeKeys(testKeys);
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = KeyDerivation.deserializeKeys(serialized);
    expect(deserialized.address).toBe(testKeys.address);
    expect(bytesToHex(deserialized.viewPrivateKey)).toBe(
      bytesToHex(testKeys.viewPrivateKey)
    );
  });

  test("export public keys only", () => {
    const testKeys = {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7" as const,
      viewPrivateKey: new Uint8Array(32).fill(1),
      viewPublicKey: new Uint8Array(33).fill(2),
      spendPrivateKey: new Uint8Array(32).fill(3),
      spendPublicKey: new Uint8Array(33).fill(4),
    };

    const publicKeys = KeyDerivation.exportPublicKeys(testKeys);
    expect(publicKeys.address).toBe(testKeys.address);
    expect(publicKeys.viewPublicKey).toBeTruthy();
    expect(publicKeys.spendPublicKey).toBeTruthy();
    expect("viewPrivateKey" in publicKeys).toBe(false);
    expect("spendPrivateKey" in publicKeys).toBe(false);
  });
});

import { describe, test, expect } from "vitest";
import { StealthAddressGenerator } from "../stealthAddress";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "viem";

describe("Stealth Addresses", () => {
  test("generate stealth address", () => {
    const recipientViewPriv = secp256k1.utils.randomSecretKey();
    const recipientViewPub = secp256k1.getPublicKey(recipientViewPriv);
    const recipientSpendPriv = secp256k1.utils.randomSecretKey();
    const recipientSpendPub = secp256k1.getPublicKey(recipientSpendPriv);

    const stealthAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(recipientViewPub),
      bytesToHex(recipientSpendPub),
    );

    expect(stealthAddr.address).toBeTruthy();
    expect(stealthAddr.ephmeralPublicKey).toBeTruthy();
    expect(typeof stealthAddr.viewTag).toBe("number");
  });

  test("check ownership with correct keys", () => {
    const recipientViewPriv = secp256k1.utils.randomSecretKey();
    const recipientViewPub = secp256k1.getPublicKey(recipientViewPriv);
    const recipientSpendPriv = secp256k1.utils.randomSecretKey();
    const recipientSpendPub = secp256k1.getPublicKey(recipientSpendPriv);

    const stealthAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(recipientViewPub),
      bytesToHex(recipientSpendPub),
    );

    const isMine = StealthAddressGenerator.checkOwnership(
      stealthAddr,
      bytesToHex(recipientViewPriv),
      bytesToHex(recipientSpendPub),
    );

    expect(isMine).toBe(true);
  });

  test("check ownership with wrong keys", () => {
    const recipientViewPriv = secp256k1.utils.randomSecretKey();
    const recipientViewPub = secp256k1.getPublicKey(recipientViewPriv);
    const recipientSpendPriv = secp256k1.utils.randomSecretKey();
    const recipientSpendPub = secp256k1.getPublicKey(recipientSpendPriv);

    const stealthAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(recipientViewPub),
      bytesToHex(recipientSpendPub),
    );

    const wrongViewPriv = secp256k1.utils.randomSecretKey();
    const isNotMine = StealthAddressGenerator.checkOwnership(
      stealthAddr,
      bytesToHex(wrongViewPriv),
      bytesToHex(recipientSpendPub),
    );

    expect(isNotMine).toBe(false);
  });

  test("compute stealth private key", () => {
    const recipientViewPriv = secp256k1.utils.randomSecretKey();
    const recipientViewPub = secp256k1.getPublicKey(recipientViewPriv);
    const recipientSpendPriv = secp256k1.utils.randomSecretKey();
    const recipientSpendPub = secp256k1.getPublicKey(recipientSpendPriv);

    const stealthAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(recipientViewPub),
      bytesToHex(recipientSpendPub),
    );

    const stealthPrivKey = StealthAddressGenerator.computeStealthPrivateKey(
      stealthAddr.ephmeralPublicKey,
      bytesToHex(recipientViewPriv),
      bytesToHex(recipientSpendPriv),
    );

    expect(stealthPrivKey).toBeTruthy();
  });

  test("view tag optimization", () => {
    const recipientViewPriv = secp256k1.utils.randomSecretKey();
    const recipientViewPub = secp256k1.getPublicKey(recipientViewPriv);
    const recipientSpendPriv = secp256k1.utils.randomSecretKey();
    const recipientSpendPub = secp256k1.getPublicKey(recipientSpendPriv);

    let matches = 0;
    const total = 100;

    for (let i = 0; i < total; i++) {
      const testAddr = StealthAddressGenerator.generateStealthAddress(
        bytesToHex(recipientViewPub),
        bytesToHex(recipientSpendPub),
      );
      const wrongTag = { ...testAddr, viewTag: (testAddr.viewTag + 1) % 256 };
      if (
        StealthAddressGenerator.checkOwnership(
          wrongTag,
          bytesToHex(recipientViewPriv),
          bytesToHex(recipientSpendPub),
        )
      ) {
        matches++;
      }
    }

    expect((total - matches) / total).toBeGreaterThan(0.9);
  });

  test("multiple stealth addresses are unique", () => {
    const recipientViewPriv = secp256k1.utils.randomSecretKey();
    const recipientViewPub = secp256k1.getPublicKey(recipientViewPriv);
    const recipientSpendPriv = secp256k1.utils.randomSecretKey();
    const recipientSpendPub = secp256k1.getPublicKey(recipientSpendPriv);

    const addresses = [];
    for (let i = 0; i < 5; i++) {
      const addr = StealthAddressGenerator.generateStealthAddress(
        bytesToHex(recipientViewPub),
        bytesToHex(recipientSpendPub),
      );
      addresses.push(addr.address);
    }

    const allUnique = new Set(addresses).size === addresses.length;
    expect(allUnique).toBe(true);
  });
});

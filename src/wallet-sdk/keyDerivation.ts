import {
  type WalletClient,
  type Hex,
  hexToBytes,
  bytesToHex,
  keccak256,
} from "viem";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import type { KeyPair, WalletKeys } from "./types";

const SIGNING_MESSAGES = {
  VIEW_KEY:
    "Sign this message to generate your VIEW KEY for Private Payments.\n\n This allows you to scan for incoming payments.\n\nIMPORTANT: This key does not allow spending.\n\n Nonce: ",
  SPEND_KEY:
    "Sign this message to generate your SPEND KEY for Private Payments.\n\n This allows you to spend your private funds.\n\nWARNING: Keep this signature secure!\n\nNonce: ",
} as const;

export class KeyDerivation {
  static async generateKeysFromWallet(
    walletClient: WalletClient
  ): Promise<WalletKeys> {
    const [address] = await walletClient.getAddresses();
    if (!address) throw new Error("No address found");

    const nonce = Date.now().toString();

    console.log("Please sign to generate VIEW key...");
    const viewMessage = SIGNING_MESSAGES.VIEW_KEY + nonce;
    const viewSignature = await walletClient.signMessage({
      account: address,
      message: viewMessage,
    });
    const viewKeyPair = this.deriveKeyPairFromSignature(viewSignature, "view");

    console.log("Please sign to generate SPEND KEY....");
    const spendMessage = SIGNING_MESSAGES.SPEND_KEY + nonce;
    const spendSignature = await walletClient.signMessage({
      account: address,
      message: spendMessage,
    });
    const spendKeyPair = this.deriveKeyPairFromSignature(
      spendSignature,
      "spend"
    );

    return {
      address,
      viewPrivateKey: viewKeyPair.privateKey,
      viewPublicKey: viewKeyPair.publicKey,
      spendPrivateKey: spendKeyPair.privateKey,
      spendPublicKey: spendKeyPair.publicKey,
    };
  }

  private static deriveKeyPairFromSignature(
    signature: Hex,
    purpose: "view" | "spend"
  ): KeyPair {
    const sigBytes = hexToBytes(signature);

    const purposeBytes = new TextEncoder().encode(purpose);
    const combined = new Uint8Array([...sigBytes, ...purposeBytes]);
    const hash1 = keccak256(bytesToHex(combined));

    const hash2 = keccak256(hash1);
    const seedBytes = hexToBytes(hash2);

    const n =
      0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
    const privateKeyScalar = this.bytesToBigInt(seedBytes) % n;

    if (privateKeyScalar == 0n) {
      throw new Error("Invalid private key derived (zero)");
    }

    const privateKey = this.bigIntToBytes(privateKeyScalar);

    const publicKey = secp256k1.getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  static serializeKeys(keys: WalletKeys): string {
    return JSON.stringify({
      address: keys.address,
      viewPrivateKey: bytesToHex(keys.viewPrivateKey),
      viewPublicKey: bytesToHex(keys.viewPublicKey),
      spendPrivateKey: bytesToHex(keys.spendPrivateKey),
      spendPublicKey: bytesToHex(keys.spendPublicKey),
    });
  }

  static deserializeKeys(serialized: string): WalletKeys {
    const data = JSON.parse(serialized);
    return {
      address: data.address,
      viewPrivateKey: hexToBytes(data.viewPrivateKey),
      viewPublicKey: hexToBytes(data.viewPublicKey),
      spendPrivateKey: hexToBytes(data.spendPrivateKey),
      spendPublicKey: hexToBytes(data.spendPublicKey),
    };
  }

  static exportPublicKeys(keys: WalletKeys): {
    address: string;
    viewPublicKey: Hex;
    spendPublicKey: Hex;
  } {
    return {
      address: keys.address,
      viewPublicKey: bytesToHex(keys.viewPublicKey),
      spendPublicKey: bytesToHex(keys.spendPublicKey),
    };
  }

  private static computeViewTag(sharedSecret: Uint8Array): number {
    const hash = keccak256(bytesToHex(sharedSecret));
    const hashBytes = hexToBytes(hash);

    return hashBytes[0];
  }

  private static bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]);
    }

    return result;
  }

  private static bigIntToBytes(value: bigint): Uint8Array {
    const bytes = new Uint8Array(32);

    let v = value;
    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(v & 0xffn);
      v >>= 8n;
    }

    return bytes;
  }
}

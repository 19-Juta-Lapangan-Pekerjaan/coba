import {
  type Address,
  type Hex,
  keccak256,
  bytesToHex,
  hexToBytes,
} from "viem";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { StealthAddress } from "./types";

export class StealthAddressGenerator {
  static generateStealthAddress(
    recepientViewPublicKey: Hex,
    recipientSpendPublicKey: Hex
  ): StealthAddress {
    const ephemeralPrivateKey = secp256k1.utils.randomSecretKey();

    const ephemeralPublicKey = secp256k1.getPublicKey(ephemeralPrivateKey);

    const viewPubBytes = hexToBytes(recepientViewPublicKey);
    const sharedSecret = secp256k1.getSharedSecret(
      ephemeralPrivateKey,
      viewPubBytes
    );

    const spendPubBytes = hexToBytes(recipientSpendPublicKey);
    const stealthPublicKey = this.deriveStealthPublicKey(
      sharedSecret,
      spendPubBytes
    );

    const address = this.publicKeyToAddress(stealthPublicKey);

    const viewTag = this.computeViewTag(sharedSecret);

    return {
      address,
      ephmeralPublicKey: bytesToHex(ephemeralPublicKey),
      viewTag,
    };
  }

  static checkOwnership(
    stealthAddress: StealthAddress,
    viewPrivateKey: Hex,
    spendPublicKey: Hex
  ): boolean {
    try {
      const ephemeralPubBytes = hexToBytes(stealthAddress.ephmeralPublicKey);
      const viewPrivBytes = hexToBytes(viewPrivateKey);

      const sharedSecret = secp256k1.getSharedSecret(
        viewPrivBytes,
        ephemeralPubBytes
      );

      const expectedTag = this.computeViewTag(sharedSecret);
      if (expectedTag !== stealthAddress.viewTag) {
        return false;
      }

      const spendPubBytes = hexToBytes(spendPublicKey);
      const expectedStealthPub = this.deriveStealthPublicKey(
        sharedSecret,
        spendPubBytes
      );
      const expectedAddress = this.publicKeyToAddress(expectedStealthPub);

      return (
        expectedAddress.toLowerCase() === stealthAddress.address.toLowerCase()
      );
    } catch (error) {
      console.error("Ownership check failed: ", error);
      return false;
    }
  }

  static computeStealthPrivateKey(
    ephemeralPublicKey: Hex,
    viewPrivateKey: Hex,
    spendPrivateKey: Hex
  ): Hex {
    const ephmeralPubBytes = hexToBytes(ephemeralPublicKey);
    const viewPrivBytes = hexToBytes(viewPrivateKey);
    const spendPrivBytes = hexToBytes(spendPrivateKey);

    const sharedSecret = secp256k1.getSharedSecret(
      viewPrivBytes,
      ephmeralPubBytes
    );

    const secretHash = keccak256(bytesToHex(sharedSecret));
    const secretHashBytes = hexToBytes(secretHash);

    const secretScalar = this.bytesToBigInt(secretHashBytes);
    const spendScalar = this.bytesToBigInt(spendPrivBytes);

    const n =
      0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
    const stealthScalar = (secretScalar + spendScalar) % n;

    return bytesToHex(this.bigIntToBytes(stealthScalar));
  }

  private static deriveStealthPublicKey(
    sharedSecret: Uint8Array,
    spendPublicKey: Uint8Array
  ): Uint8Array {
    const secretHash = keccak256(bytesToHex(sharedSecret));
    const secretHashBytes = hexToBytes(secretHash);

    const derivePubKey = secp256k1.getPublicKey(secretHashBytes);

    const derivedPoint = secp256k1.Point.fromHex(bytesToHex(derivePubKey).slice(2));
    const spendPoint = secp256k1.Point.fromHex(bytesToHex(spendPublicKey).slice(2));

    const stealthPoint = derivedPoint.add(spendPoint);

    return stealthPoint.toBytes(false);
  }

  private static publicKeyToAddress(publicKey: Uint8Array): Address {
    const pubKeyWithoutPrefix =
      publicKey.length === 65 ? publicKey.slice(1) : publicKey;

    const hash = keccak256(bytesToHex(pubKeyWithoutPrefix));

    return ("0x" + hash.slice(-40)) as Address;
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

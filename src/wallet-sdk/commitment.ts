import { type Hex, bytesToHex, hexToBytes, keccak256 } from "viem";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import type { Commitment } from "./types";

export class CommitmentGenerator {
  private static _hGenerator: typeof secp256k1.Point.BASE | null = null;

  static createCommitment(amount: bigint): Commitment {
    const blinding = secp256k1.utils.randomSecretKey();

    const commitmentBytes = this.computeCommitment(amount, blinding);

    return {
      commitment: bytesToHex(commitmentBytes),
      amount,
      blinding: bytesToHex(blinding),
    };
  }

  static recomputeCommitment(amount: bigint, blinding: Hex): Hex {
    const blindingBytes = hexToBytes(blinding);
    const commitmentBytes = this.computeCommitment(amount, blindingBytes);
    return bytesToHex(commitmentBytes);
  }

  static verifyCommitment(
    commitment: Hex,
    amount: bigint,
    blinding: Hex
  ): boolean {
    const recomputed = this.recomputeCommitment(amount, blinding);
    return commitment.toLowerCase() === recomputed.toLowerCase();
  }

  private static computeCommitment(
    amount: bigint,
    blinding: Uint8Array
  ): Uint8Array {
    const G = secp256k1.Point.BASE;
    const H = this.getHGenerator();

    // Pedersen commitment: C = r*G + amount*H
    const blindingScalar = this.bytesToBigInt(blinding);
    const rG = G.multiply(blindingScalar);
    const amountH = H.multiply(amount);
    const commitment = rG.add(amountH);

    return commitment.toBytes(true);
  }

  private static getHGenerator(): typeof secp256k1.Point.BASE {
    if (this._hGenerator) {
      return this._hGenerator;
    }

    const G = secp256k1.Point.BASE;

    const gBytes = G.toBytes(true);

    const domainSeparator = new TextEncoder().encode("PEDERSEN_H_GENERATOR_V2");
    const input = new Uint8Array([...domainSeparator, ...gBytes]);

    const hash = keccak256(bytesToHex(input));
    const hashBytes = hexToBytes(hash);

    // secp256k1 curve order
    const n =
      0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
    const hScalar = this.bytesToBigInt(hashBytes) % n;

    const H = G.multiply(hScalar);

    this._hGenerator = H;
    return H;
  }

  static verifyBalance(
    inputCommitments: Hex[],
    outputCommitments: Hex[]
  ): boolean {
    try {
      let inputSum = secp256k1.Point.ZERO;
      for (const c of inputCommitments) {
        const point = secp256k1.Point.fromHex(c.slice(2));
        inputSum = inputSum.add(point);
      }

      let outputSum = secp256k1.Point.ZERO;
      for (const c of outputCommitments) {
        const point = secp256k1.Point.fromHex(c.slice(2));
        outputSum = outputSum.add(point);
      }

      return inputSum.equals(outputSum);
    } catch (error) {
      console.error("Balance verification failed: ", error);
      return false;
    }
  }

  static verifyBalanceWithAmounts(
    inputs: { amount: bigint; blinding: Hex }[],
    outputs: { amount: bigint; blinding: Hex }[]
  ): boolean {
    const inputSum = inputs.reduce((sum, i) => sum + i.amount, 0n);
    const outputSum = outputs.reduce((sum, o) => sum + o.amount, 0n);

    if (inputSum !== outputSum) {
      console.error("Amounts do not balance:", inputSum, "vs", outputSum);
      return false;
    }

    const inputCommitments = inputs.map((i) =>
      this.recomputeCommitment(i.amount, i.blinding)
    );
    const outputCommitments = outputs.map((o) =>
      this.recomputeCommitment(o.amount, o.blinding)
    );

    return this.verifyBalance(inputCommitments, outputCommitments);
  }

  static createBalancedCommitments(
    inputAmount: bigint,
    outputAmounts: bigint[]
  ): {
    inputs: Commitment[];
    outputs: Commitment[];
  } {
    const totalOutput = outputAmounts.reduce((sum, amt) => sum + amt, 0n);
    if (inputAmount !== totalOutput) {
      throw new Error("Amounts do not balance");
    }

    const outputBlindings: Uint8Array[] = [];
    let blindingSum = 0n;

    for (let i = 0; i < outputAmounts.length; i++) {
      const blinding = secp256k1.utils.randomSecretKey();
      outputBlindings.push(blinding);

      const blindingScalar = this.bytesToBigInt(blinding);
      // secp256k1 curve order
      const n =
        0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
      blindingSum = (blindingSum + blindingScalar) % n;
    }

    const inputBlinding = this.bigIntToBytes(blindingSum);

    const inputs = [
      {
        commitment: bytesToHex(
          this.computeCommitment(inputAmount, inputBlinding)
        ),
        amount: inputAmount,
        blinding: bytesToHex(inputBlinding),
      },
    ];

    const outputs = outputAmounts.map((amount, i) => ({
      commitment: bytesToHex(
        this.computeCommitment(amount, outputBlindings[i])
      ),
      amount,
      blinding: bytesToHex(outputBlindings[i]),
    }));

    return { inputs, outputs };
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

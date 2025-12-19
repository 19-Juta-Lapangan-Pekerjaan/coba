import { describe, test, expect } from "vitest";
import { StealthAddressGenerator } from "../stealthAddress";
import { CommitmentGenerator } from "../commitment";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "viem";

describe("Integration Test: Complete Private Payment Flow", () => {
  test("complete payment flow from Alice to Bob to Carol", () => {
    const aliceViewPriv = secp256k1.utils.randomSecretKey();
    const aliceViewPub = secp256k1.getPublicKey(aliceViewPriv);
    const aliceSpendPriv = secp256k1.utils.randomSecretKey();
    const aliceSpendPub = secp256k1.getPublicKey(aliceSpendPriv);

    const bobViewPriv = secp256k1.utils.randomSecretKey();
    const bobViewPub = secp256k1.getPublicKey(bobViewPriv);
    const bobSpendPriv = secp256k1.utils.randomSecretKey();
    const bobSpendPub = secp256k1.getPublicKey(bobSpendPriv);

    expect(aliceViewPriv).toBeTruthy();
    expect(bobViewPriv).toBeTruthy();

    const aliceDeposit = CommitmentGenerator.createCommitment(100n);
    expect(aliceDeposit.commitment).toBeTruthy();

    const bobStealthAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(bobViewPub),
      bytesToHex(bobSpendPub)
    );
    expect(bobStealthAddr.address).toBeTruthy();

    const aliceChangeAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(aliceViewPub),
      bytesToHex(aliceSpendPub)
    );
    expect(aliceChangeAddr.address).toBeTruthy();

    const transaction = CommitmentGenerator.createBalancedCommitments(100n, [
      60n,
      40n,
    ]);
    expect(transaction.inputs[0].commitment).toBeTruthy();
    expect(transaction.outputs[0].commitment).toBeTruthy();
    expect(transaction.outputs[1].commitment).toBeTruthy();

    const txBalanced = CommitmentGenerator.verifyBalance(
      transaction.inputs.map((i) => i.commitment),
      transaction.outputs.map((o) => o.commitment)
    );
    expect(txBalanced).toBe(true);

    const bobCanSpend = StealthAddressGenerator.checkOwnership(
      bobStealthAddr,
      bytesToHex(bobViewPriv),
      bytesToHex(bobSpendPub)
    );
    expect(bobCanSpend).toBe(true);

    const bobStealthPrivKey = StealthAddressGenerator.computeStealthPrivateKey(
      bobStealthAddr.ephmeralPublicKey,
      bytesToHex(bobViewPriv),
      bytesToHex(bobSpendPriv)
    );
    expect(bobStealthPrivKey).toBeTruthy();

    const aliceFoundChange = StealthAddressGenerator.checkOwnership(
      aliceChangeAddr,
      bytesToHex(aliceViewPriv),
      bytesToHex(aliceSpendPub)
    );
    expect(aliceFoundChange).toBe(true);

    const carolViewPriv = secp256k1.utils.randomSecretKey();
    const carolViewPub = secp256k1.getPublicKey(carolViewPriv);
    const carolSpendPriv = secp256k1.utils.randomSecretKey();
    const carolSpendPub = secp256k1.getPublicKey(carolSpendPriv);

    const carolStealthAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(carolViewPub),
      bytesToHex(carolSpendPub)
    );
    const bobChangeAddr = StealthAddressGenerator.generateStealthAddress(
      bytesToHex(bobViewPub),
      bytesToHex(bobSpendPub)
    );

    const bobTransaction = CommitmentGenerator.createBalancedCommitments(60n, [
      30n,
      30n,
    ]);
    expect(bobTransaction.outputs[0].commitment).toBeTruthy();
    expect(bobTransaction.outputs[1].commitment).toBeTruthy();

    const bobTxBalanced = CommitmentGenerator.verifyBalance(
      bobTransaction.inputs.map((i) => i.commitment),
      bobTransaction.outputs.map((o) => o.commitment)
    );
    expect(bobTxBalanced).toBe(true);
  });
});

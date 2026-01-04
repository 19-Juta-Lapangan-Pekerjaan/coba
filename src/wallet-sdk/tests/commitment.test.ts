import { describe, test, expect } from "vitest";
import { CommitmentGenerator } from "../commitment";

describe("Pedersen Commitments", () => {
  test("create commitment", () => {
    const commitment = CommitmentGenerator.createCommitment(100n);
    expect(commitment.amount).toBe(100n);
    expect(commitment.commitment).toBeTruthy();
    expect(commitment.blinding).toBeTruthy();
  });

  test("verify commitment", () => {
    const commitment = CommitmentGenerator.createCommitment(100n);
    const isValid = CommitmentGenerator.verifyCommitment(
      commitment.commitment,
      commitment.amount,
      commitment.blinding,
    );
    expect(isValid).toBe(true);
  });

  test("balanced commitments", () => {
    const { inputs, outputs } = CommitmentGenerator.createBalancedCommitments(
      100n,
      [60n, 40n],
    );
    expect(inputs[0].commitment).toBeTruthy();
    expect(outputs[0].commitment).toBeTruthy();
    expect(outputs[1].commitment).toBeTruthy();
  });

  test("verify balance", () => {
    const { inputs, outputs } = CommitmentGenerator.createBalancedCommitments(
      100n,
      [60n, 40n],
    );
    const balanced = CommitmentGenerator.verifyBalance(
      inputs.map((i) => i.commitment),
      outputs.map((o) => o.commitment),
    );
    expect(balanced).toBe(true);
  });

  test("invalid balance", () => {
    const { outputs: validOutputs } =
      CommitmentGenerator.createBalancedCommitments(100n, [60n, 40n]);
    const invalid = CommitmentGenerator.createBalancedCommitments(100n, [
      50n,
      50n,
    ]);
    const invalidBalanced = CommitmentGenerator.verifyBalance(
      invalid.inputs.map((i) => i.commitment),
      [validOutputs[0].commitment, validOutputs[1].commitment],
    );
    expect(invalidBalanced).toBe(false);
  });
});

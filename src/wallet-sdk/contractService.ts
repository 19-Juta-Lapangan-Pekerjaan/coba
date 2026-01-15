import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  getContract,
  encodeFunctionData,
  decodeEventLog,
  parseEventLogs,
  encodeAbiParameters,
  keccak256,
} from 'viem';

import {
  CONTRACT_ADDRESSES,
  GELAP_SHIELDED_ACCOUNT_ABI,
  ERC20_ABI,
  DEFAULT_CHAIN_ID,
  PROVER_API_URL,
  PROVER_ENDPOINTS,
} from '@/src/lib/constants';

// ============================================================================
// Types
// ============================================================================

export interface DepositParams {
  token: Address;
  amount: bigint;
  commitment: Hex;
  encryptedMemo?: Hex;
}

export interface TransactParams {
  publicInputs: Hex;
  proofBytes: Hex;
}

export interface WithdrawParams {
  publicInputs: Hex;
  proofBytes: Hex;
  receiver: Address;
}

export interface SwapParams {
  publicInputs: Hex;
  proofBytes: Hex;
}

// Event types
export interface AccountUpdatedEvent {
  commitment: Hex;
  encryptedMemo: Hex;
  blockNumber: bigint;
  transactionHash: Hex;
}

export interface TransactionExecutedEvent {
  newRoot: Hex;
  nullifiers: Hex[];
  newCommitments: Hex[];
  blockNumber: bigint;
  transactionHash: Hex;
}

export interface WithdrawExecutedEvent {
  receiver: Address;
  token: Address;
  amount: bigint;
  blockNumber: bigint;
  transactionHash: Hex;
}

// Prover API types
export interface TransactionProofRequest {
  inputNotes: {
    commitment: Hex;
    amount: bigint;
    blinding: Hex;
    leafIndex: number;
    pathElements: Hex[];
    pathIndices: number[];
  }[];
  outputNotes: {
    amount: bigint;
    recipientPublicKey: Hex;
  }[];
  currentRoot: Hex;
}

export interface WithdrawProofRequest {
  inputNotes: {
    commitment: Hex;
    amount: bigint;
    blinding: Hex;
    leafIndex: number;
    pathElements: Hex[];
    pathIndices: number[];
  }[];
  withdrawAmount: bigint;
  receiver: Address;
  token: Address;
  currentRoot: Hex;
}

export interface ProofResponse {
  publicInputs: Hex;
  proofBytes: Hex;
  success: boolean;
  error?: string;
}

// ============================================================================
// Contract Service
// ============================================================================

export class ContractService {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null;
  private chainId: number;
  private contractAddress: Address;

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient | null = null,
    chainId: number = DEFAULT_CHAIN_ID,
  ) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.chainId = chainId;

    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    this.contractAddress = addresses.gelapShieldedAccount;
  }

  // ==========================================================================
  // Read Functions
  // ==========================================================================

  /**
   * Get the current Merkle root
   */
  async getMerkleRoot(): Promise<Hex> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'merkleRoot',
    });
    return result as Hex;
  }

  /**
   * Check if a nullifier has been used
   */
  async isNullifierUsed(nullifier: Hex): Promise<boolean> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'nullifierUsed',
      args: [nullifier],
    });
    return result as boolean;
  }

  /**
   * Get the next leaf index
   */
  async getNextLeafIndex(): Promise<number> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'nextLeafIndex',
    });
    return Number(result);
  }

  /**
   * Get zero hash at a specific level
   */
  async getZeroHash(level: number): Promise<Hex> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'zeroHashes',
      args: [BigInt(level)],
    });
    return result as Hex;
  }

  // ==========================================================================
  // Write Functions
  // ==========================================================================

  /**
   * Approve token spending for the contract
   */
  async approveToken(token: Address, amount: bigint): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations');
    }

    const [account] = await this.walletClient.getAddresses();
    if (!account) {
      throw new Error('No account found in wallet');
    }

    const hash = await this.walletClient.writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [this.contractAddress, amount],
      account,
      chain: this.walletClient.chain,
    });

    return hash;
  }

  /**
   * Check token allowance
   */
  async getTokenAllowance(token: Address, owner: Address): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, this.contractAddress],
    });
    return result as bigint;
  }

  /**
   * Get token balance
   */
  async getTokenBalance(token: Address, account: Address): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    });
    return result as bigint;
  }

  /**
   * Deposit tokens into the shielded pool
   */
  async deposit(params: DepositParams): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations');
    }

    const [account] = await this.walletClient.getAddresses();
    if (!account) {
      throw new Error('No account found in wallet');
    }

    // Use simulateContract first to validate, then execute
    const { request } = await this.publicClient.simulateContract({
      account,
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'deposit',
      args: [params.token, params.amount, params.commitment, params.encryptedMemo || '0x'],
    });

    const hash = await this.walletClient.writeContract(request);

    return hash;
  }

  /**
   * Execute a private transaction
   */
  async transact(params: TransactParams): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations');
    }

    const [account] = await this.walletClient.getAddresses();
    if (!account) {
      throw new Error('No account found in wallet');
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'transact',
      args: [params.publicInputs, params.proofBytes],
      account,
      chain: this.walletClient.chain,
      gas: 5000000n, // High gas limit for ZK proof verification
    });

    return hash;
  }

  /**
   * Withdraw from the shielded pool
   */
  async withdraw(params: WithdrawParams): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations');
    }

    const [account] = await this.walletClient.getAddresses();
    if (!account) {
      throw new Error('No account found in wallet');
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'withdraw',
      args: [params.publicInputs, params.proofBytes, params.receiver],
      account,
      chain: this.walletClient.chain,
      gas: 5000000n, // High gas limit for ZK proof verification
    });

    return hash;
  }

  /**
   * TEST ONLY: Withdraw without proof verification
   * This bypasses all ZK proof checks - for testing only!
   */
  async testWithdraw(token: Address, amount: bigint, receiver: Address): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations');
    }

    const [account] = await this.walletClient.getAddresses();
    if (!account) {
      throw new Error('No account found in wallet');
    }

    // Use simulateContract first for better error handling
    const { request } = await this.publicClient.simulateContract({
      account,
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'testWithdraw',
      args: [token, amount, receiver],
    });

    const hash = await this.walletClient.writeContract(request);
    return hash;
  }

  /**
   * Execute a dark pool swap
   */
  async executeSwap(params: SwapParams): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations');
    }

    const [account] = await this.walletClient.getAddresses();
    if (!account) {
      throw new Error('No account found in wallet');
    }

    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: GELAP_SHIELDED_ACCOUNT_ABI,
      functionName: 'executeSwap',
      args: [params.publicInputs, params.proofBytes],
      account,
      chain: this.walletClient.chain,
      gas: 5000000n, // High gas limit for Swap (verification + order tracking)
    });

    return hash;
  }

  // ==========================================================================
  // Event Fetching
  // ==========================================================================

  /**
   * Fetch AccountUpdated events (new commitments)
   * Note: Mantle Sepolia RPC limits eth_getLogs to 10,000 blocks
   */
  async getAccountUpdatedEvents(
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest',
  ): Promise<AccountUpdatedEvent[]> {
    // Get current block to calculate range
    const currentBlock = await this.publicClient.getBlockNumber();

    // Respect RPC limit of 10,000 blocks
    const MAX_BLOCK_RANGE = 10000n;
    let actualFromBlock = fromBlock;

    // If fromBlock is 0 or query range exceeds limit, adjust
    if (toBlock === 'latest') {
      const rangeStart = currentBlock > MAX_BLOCK_RANGE ? currentBlock - MAX_BLOCK_RANGE : 0n;
      actualFromBlock = fromBlock > rangeStart ? fromBlock : rangeStart;
    }

    const logs = await this.publicClient.getLogs({
      address: this.contractAddress,
      event: {
        type: 'event',
        name: 'AccountUpdated',
        inputs: [
          { type: 'bytes32', name: 'commitment', indexed: false },
          { type: 'bytes', name: 'encryptedMemo', indexed: false },
        ],
      },
      fromBlock: actualFromBlock,
      toBlock,
    });

    return logs.map((log) => ({
      commitment: log.args.commitment as Hex,
      encryptedMemo: log.args.encryptedMemo as Hex,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }));
  }

  /**
   * Fetch TransactionExecuted events
   */
  async getTransactionExecutedEvents(
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest',
  ): Promise<TransactionExecutedEvent[]> {
    const logs = await this.publicClient.getLogs({
      address: this.contractAddress,
      event: {
        type: 'event',
        name: 'TransactionExecuted',
        inputs: [
          { type: 'bytes32', name: 'newRoot', indexed: false },
          { type: 'bytes32[]', name: 'nullifiers', indexed: false },
          { type: 'bytes32[]', name: 'newCommitments', indexed: false },
        ],
      },
      fromBlock,
      toBlock,
    });

    return logs.map((log) => ({
      newRoot: log.args.newRoot as Hex,
      nullifiers: log.args.nullifiers as Hex[],
      newCommitments: log.args.newCommitments as Hex[],
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }));
  }

  /**
   * Fetch WithdrawExecuted events for a specific receiver
   */
  async getWithdrawExecutedEvents(
    receiver?: Address,
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest',
  ): Promise<WithdrawExecutedEvent[]> {
    const logs = await this.publicClient.getLogs({
      address: this.contractAddress,
      event: {
        type: 'event',
        name: 'WithdrawExecuted',
        inputs: [
          { type: 'address', name: 'receiver', indexed: true },
          { type: 'address', name: 'token', indexed: true },
          { type: 'uint256', name: 'amount', indexed: false },
        ],
      },
      args: receiver ? { receiver } : undefined,
      fromBlock,
      toBlock,
    });

    return logs.map((log) => ({
      receiver: log.args.receiver as Address,
      token: log.args.token as Address,
      amount: log.args.amount as bigint,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }));
  }

  /**
   * Get all commitments from events
   */
  async getAllCommitments(fromBlock: bigint = 0n, toBlock: bigint | 'latest' = 'latest'): Promise<Hex[]> {
    const events = await this.getAccountUpdatedEvents(fromBlock, toBlock);
    return events.map((e) => e.commitment);
  }

  // ==========================================================================
  // Prover API (Mock - replace with real implementation)
  // ==========================================================================

  /**
   * Request a transaction proof from the prover service
   */
  async requestTransactionProof(request: TransactionProofRequest): Promise<ProofResponse> {
    try {
      const response = await fetch(`${PROVER_API_URL}${PROVER_ENDPOINTS.generateTransactionProof}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return {
          publicInputs: '0x',
          proofBytes: '0x',
          success: false,
          error: `Prover API error: ${response.status}`,
        };
      }

      return await response.json();
    } catch (error) {
      // Mock response for development
      console.warn('Prover API not available, returning mock proof');
      return this.generateMockProof();
    }
  }

  /**
   * Request a withdrawal proof from the prover service
   */
  async requestWithdrawProof(request: WithdrawProofRequest): Promise<ProofResponse> {
    try {
      const response = await fetch(`${PROVER_API_URL}${PROVER_ENDPOINTS.generateWithdrawProof}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return {
          publicInputs: '0x',
          proofBytes: '0x',
          success: false,
          error: `Prover API error: ${response.status}`,
        };
      }

      return await response.json();
    } catch (error) {
      // Mock response for development
      console.warn('Prover API not available, returning mock withdraw proof');
      return this.generateMockWithdrawProof(request);
    }
  }

  /**
   * Generate a mock proof for development/testing
   * NOTE: This will NOT work on-chain - only for UI testing
   */
  private generateMockProof(): ProofResponse {
    return {
      publicInputs: ('0x' + '00'.repeat(128)) as Hex,
      proofBytes: ('0x' + '00'.repeat(256)) as Hex,
      success: true,
      error: 'MOCK_PROOF - Will not verify on-chain',
    };
  }

  /**
   * Generate a mock WITHDRAW proof with properly encoded publicInputs
   * This allows MockSP1Verifier to pass and contract to decode correctly
   */
  private generateMockWithdrawProof(request: WithdrawProofRequest): ProofResponse {
    // ABI encode WithdrawPublicInputsStruct:
    // struct WithdrawPublicInputsStruct {
    //     bytes32 newRoot;
    //     bytes32[] nullifiers;
    //     address token;
    //     uint256 amount;
    //     address receiver;
    //     bytes32[] newCommitments;
    // }

    const mockNullifier = keccak256(`0x${Date.now().toString(16).padStart(64, '0')}`);
    const newRoot = request.currentRoot || ('0x' + '11'.repeat(32)) as Hex;

    const publicInputs = encodeAbiParameters(
      [
        { name: 'newRoot', type: 'bytes32' },
        { name: 'nullifiers', type: 'bytes32[]' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'receiver', type: 'address' },
        { name: 'newCommitments', type: 'bytes32[]' },
      ],
      [
        newRoot,
        [mockNullifier], // One mock nullifier
        request.token,
        request.withdrawAmount,
        request.receiver,
        [], // No new commitments for simple withdraw
      ]
    );

    return {
      publicInputs,
      proofBytes: ('0x' + '00'.repeat(256)) as Hex, // MockSP1Verifier ignores this
      success: true,
      error: 'MOCK_WITHDRAW_PROOF - For testing only',
    };
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  /**
   * Wait for a transaction to be confirmed
   */
  async waitForTransaction(hash: Hex): Promise<{
    success: boolean;
    blockNumber: bigint;
  }> {
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash,
    });

    return {
      success: receipt.status === 'success',
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Get contract address
   */
  getContractAddress(): Address {
    return this.contractAddress;
  }

  /**
   * Update wallet client (e.g., after wallet connection)
   */
  setWalletClient(walletClient: WalletClient): void {
    this.walletClient = walletClient;
  }
}

/**
 * Create a ContractService instance
 */
export function createContractService(
  publicClient: PublicClient,
  walletClient?: WalletClient,
  chainId?: number,
): ContractService {
  return new ContractService(publicClient, walletClient, chainId);
}

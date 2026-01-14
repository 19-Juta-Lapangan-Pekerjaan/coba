/**
 * Parse wallet/transaction errors into user-friendly messages
 */

// Common error patterns from wallet providers
const ERROR_PATTERNS = {
  // User rejection patterns
  userRejection: [
    "user rejected",
    "user denied",
    "user cancelled",
    "user canceled",
    "rejected the request",
    "denied transaction",
    "transaction was rejected",
    "action_rejected",
    "user disapproved",
  ],

  // Insufficient funds patterns
  insufficientFunds: [
    "insufficient funds",
    "insufficient balance",
    "not enough balance",
    "exceeds balance",
    "insufficient token balance",
  ],

  // Gas related patterns
  gasError: [
    "gas required exceeds",
    "out of gas",
    "gas too low",
    "intrinsic gas too low",
    "max fee per gas",
    "gas limit",
  ],

  // Network/RPC patterns
  networkError: [
    "network error",
    "failed to fetch",
    "connection refused",
    "timeout",
    "could not connect",
    "rpc error",
  ],

  // Contract revert patterns
  contractRevert: [
    "execution reverted",
    "revert",
    "require failed",
    "invalid opcode",
  ],

  // Nonce issues
  nonceError: [
    "nonce too low",
    "nonce too high",
    "replacement transaction",
    "already known",
  ],
} as const;

export interface ParsedError {
  type:
    | "rejection"
    | "insufficient_funds"
    | "gas"
    | "network"
    | "contract"
    | "nonce"
    | "unknown";
  message: string;
  originalMessage: string;
  isUserRejection: boolean;
}

/**
 * Parse an error into a user-friendly format
 */
export function parseTransactionError(error: unknown): ParsedError {
  // Get the original error message
  let originalMessage = "Unknown error";

  if (error instanceof Error) {
    originalMessage = error.message;
  } else if (typeof error === "string") {
    originalMessage = error;
  } else if (error && typeof error === "object") {
    // Handle viem/wagmi error objects
    const errorObj = error as Record<string, unknown>;
    if ("message" in errorObj && typeof errorObj.message === "string") {
      originalMessage = errorObj.message;
    } else if (
      "shortMessage" in errorObj &&
      typeof errorObj.shortMessage === "string"
    ) {
      originalMessage = errorObj.shortMessage;
    } else if ("details" in errorObj && typeof errorObj.details === "string") {
      originalMessage = errorObj.details;
    }
  }

  const lowerMessage = originalMessage.toLowerCase();

  // Check for user rejection
  if (
    ERROR_PATTERNS.userRejection.some((pattern) =>
      lowerMessage.includes(pattern)
    )
  ) {
    return {
      type: "rejection",
      message:
        "Transaction cancelled. You rejected the request in your wallet.",
      originalMessage,
      isUserRejection: true,
    };
  }

  // Check for insufficient funds
  if (
    ERROR_PATTERNS.insufficientFunds.some((pattern) =>
      lowerMessage.includes(pattern)
    )
  ) {
    return {
      type: "insufficient_funds",
      message:
        "Insufficient balance. Please check your token balance and try again.",
      originalMessage,
      isUserRejection: false,
    };
  }

  // Check for gas errors
  if (
    ERROR_PATTERNS.gasError.some((pattern) => lowerMessage.includes(pattern))
  ) {
    return {
      type: "gas",
      message:
        "Transaction failed due to gas estimation. Please try again with a higher gas limit.",
      originalMessage,
      isUserRejection: false,
    };
  }

  // Check for network errors
  if (
    ERROR_PATTERNS.networkError.some((pattern) =>
      lowerMessage.includes(pattern)
    )
  ) {
    return {
      type: "network",
      message:
        "Network connection error. Please check your internet connection and try again.",
      originalMessage,
      isUserRejection: false,
    };
  }

  // Check for contract reverts
  if (
    ERROR_PATTERNS.contractRevert.some((pattern) =>
      lowerMessage.includes(pattern)
    )
  ) {
    // Try to extract revert reason
    const revertMatch =
      originalMessage.match(/reason[:\s]+"?([^"]+)"?/i) ||
      originalMessage.match(/reverted[:\s]+"?([^"]+)"?/i);
    const reason = revertMatch ? revertMatch[1] : null;

    return {
      type: "contract",
      message: reason
        ? `Transaction failed: ${reason}`
        : "Transaction failed. The contract rejected this transaction.",
      originalMessage,
      isUserRejection: false,
    };
  }

  // Check for nonce errors
  if (
    ERROR_PATTERNS.nonceError.some((pattern) => lowerMessage.includes(pattern))
  ) {
    return {
      type: "nonce",
      message:
        "Transaction nonce issue. Please wait for pending transactions to complete.",
      originalMessage,
      isUserRejection: false,
    };
  }

  // Default unknown error
  // Try to provide a cleaner message if possible
  let cleanMessage = originalMessage;

  // Remove common prefixes
  cleanMessage = cleanMessage.replace(/^Error:\s*/i, "");
  cleanMessage = cleanMessage.replace(/^TransactionExecutionError:\s*/i, "");
  cleanMessage = cleanMessage.replace(
    /^ContractFunctionExecutionError:\s*/i,
    ""
  );

  // Truncate if too long
  if (cleanMessage.length > 100) {
    cleanMessage = cleanMessage.substring(0, 100) + "...";
  }

  return {
    type: "unknown",
    message: cleanMessage || "An unexpected error occurred. Please try again.",
    originalMessage,
    isUserRejection: false,
  };
}

/**
 * Get a simple error message string from an error
 */
export function getErrorMessage(error: unknown): string {
  return parseTransactionError(error).message;
}

/**
 * Check if error was caused by user rejection
 */
export function isUserRejectionError(error: unknown): boolean {
  return parseTransactionError(error).isUserRejection;
}

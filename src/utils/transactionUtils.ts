import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { estimateComputeUnits } from './estimateComputeUnits.js';

export const DEFAULT_COMPUTE_UNIT_PRICE = 50000;

export type IMakeTransactionOptions = {
  /**
   * Compute unit limit
   */
  computeUnitLimit?: number;
  /**
   * Compute unit price (microLamports)
   */
  computeUnitPrice?: number;
  /**
   * Whether to automatically add compute budget instructions
   */
  addComputeBudget?: boolean;
} & /**
 * maxFee and exactFee are mutually exclusive type definitions
 * maxFee: Maximum transaction fee (SOL)
 * exactFee: Exact transaction fee (SOL)
 */ (
  | { maxFee: number; exactFee?: never }
  | { maxFee?: never; exactFee: number }
  | { maxFee?: undefined; exactFee?: undefined }
);

export type ISendTransactionOptions = {
  /**
   * Skip preflight
   */
  skipPreflight?: boolean;
  /**
   * Commit level
   */
  preflightCommitment?: 'processed' | 'confirmed' | 'finalized';
  /**
   * Maximum retry times
   */
  maxRetries?: number;
  /**
   * Transaction confirmation timeout (milliseconds)
   */
  confirmationTimeout?: number;
  /**
   * Transaction confirmation retry interval (milliseconds)
   */
  confirmationRetryInterval?: number;
  /**
   * Transaction confirmation retry times
   */
  confirmationRetries?: number;
};

/**
 * Create transaction object
 * @param connection - Solana connection instance
 * @param payerPublicKey - Payer public key
 * @param instructions - Transaction instruction list
 * @param options - Transaction options
 * @param signers - Additional signers (usually new Keypairs created by the program)
 * @returns Transaction object
 */
export async function makeTransaction(params: {
  connection: Connection;
  payerPublicKey: PublicKey;
  instructions: TransactionInstruction[];
  signers?: Signer[];
  options?: IMakeTransactionOptions;
}): Promise<VersionedTransaction> {
  const { connection, payerPublicKey, instructions, options = {}, signers = [] } = params;

  const { computeUnitPrice = DEFAULT_COMPUTE_UNIT_PRICE, addComputeBudget = true, maxFee, exactFee } = options;

  const { blockhash } = await connection.getLatestBlockhash();

  const finalInstructions = [...instructions];

  if (addComputeBudget) {
    const computeUnitLimit =
      options.computeUnitLimit || (await estimateComputeUnits(connection, instructions, payerPublicKey, blockhash));

    console.info(`计算单元限制: ${computeUnitLimit}`);

    // If maxFee is set, check if computeUnitPrice needs to be adjusted
    let finalComputeUnitPrice = computeUnitPrice;

    if (maxFee !== undefined) {
      // Convert maxFee from SOL to microLamports
      // 1 SOL = 10^9 lamports, 1 lamport = 10^6 microLamports
      const maxFeeInMicroLamports = maxFee * 1_000_000_000_000_000;
      // Calculate estimated fee under current settings
      const estimatedFeeInMicroLamports = computeUnitLimit * computeUnitPrice;

      // If estimated fee exceeds the maximum limit, adjust computeUnitPrice
      if (estimatedFeeInMicroLamports > maxFeeInMicroLamports) {
        finalComputeUnitPrice = Math.floor(maxFeeInMicroLamports / computeUnitLimit);
        console.info(`Adjust compute unit price to meet maximum fee limit: ${finalComputeUnitPrice} microLamports`);
      }
    } else if (exactFee !== undefined) {
      // Convert exactFee from SOL to microLamports
      const exactFeeInMicroLamports = exactFee * 1_000_000_000_000_000;
      // Compute unit price = exact fee / compute unit limit
      finalComputeUnitPrice = Math.ceil(exactFeeInMicroLamports / computeUnitLimit);
    }

    finalInstructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: finalComputeUnitPrice })
    );
  }

  // Create transaction message
  const transactionMessage = new TransactionMessage({
    payerKey: payerPublicKey,
    recentBlockhash: blockhash,
    instructions: finalInstructions,
  });

  // Compile to v0 message and create VersionedTransaction
  const transaction = new VersionedTransaction(transactionMessage.compileToV0Message());

  // Sign with additional signers first
  if (signers.length > 0) {
    transaction.sign(signers);
  }

  return transaction;
}

/**
 * Generic function for sending transactions, supporting front-end wallet signatures
 * @param connection - Solana connection instance
 * @param signTx - Method for signing transactions, usually calling the signTransaction method of the plugin wallet and signing with the new Keypair created by the program
 * @param options - Transaction options
 * @returns 交易哈希
 */
export async function sendTransaction(params: {
  connection: Connection;
  signTx: () => Promise<VersionedTransaction>;
  options?: ISendTransactionOptions;
}): Promise<string> {
  const { connection, options = {}, signTx } = params;
  // Set default options
  const {
    skipPreflight = false,
    preflightCommitment = 'confirmed',
    maxRetries = 3,
    confirmationTimeout = 30000,
    confirmationRetryInterval = 2000,
    confirmationRetries = 10,
  } = options;

  const signedTx = await signTx?.();

  // Send transaction
  const txid = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight,
    preflightCommitment,
    maxRetries,
  });

  console.info(`Transaction sent: ${txid}`);

  // Manually poll for transaction confirmation
  const startTime = Date.now();
  let confirmed = false;
  let retries = confirmationRetries;

  while (!confirmed && retries > 0 && Date.now() - startTime < confirmationTimeout) {
    try {
      const status = await connection.getSignatureStatus(txid);
      if (status && status.value && status.value.confirmationStatus === 'confirmed') {
        confirmed = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, confirmationRetryInterval));
        retries--;
      }
    } catch (err: any) {
      console.warn(`Failed to check transaction status, reason: ${err.message}`);
      retries--;
      await new Promise((resolve) => setTimeout(resolve, confirmationRetryInterval));
    }
  }

  if (!confirmed) {
    console.warn(`Transaction may not be confirmed: ${txid}`);
  }

  return txid;
}

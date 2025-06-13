import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

/**
 * Estimate compute units required for a transaction
 * @param connection - Solana connection instance
 * @param transaction - Transaction to estimate
 * @returns Estimated compute unit count
 */
export async function estimateComputeUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payerPublicKey: PublicKey,
  _blockhash?: string
): Promise<number> {
  try {
    // Create a transaction without compute budget instructions for simulation
    const blockhash = _blockhash || (await connection.getLatestBlockhash()).blockhash;

    const messageV0 = new TransactionMessage({
      payerKey: payerPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const simulationTx = new VersionedTransaction(messageV0);

    // Simulate transaction execution
    const simulation = await connection.simulateTransaction(simulationTx);

    // Extract compute units used from simulation result
    if (simulation.value.logs && simulation.value.unitsConsumed) {
      // Get actual consumed CU
      const consumedUnits = simulation.value.unitsConsumed;

      const estimatedUnits = Math.min(
        Math.max(
          consumedUnits + 100_000, // 100k buffer
          Math.ceil(consumedUnits * 1.3) // 30% buffer
        ),
        1_400_000 // Solana transaction max CU limit
      );

      return Math.max(estimatedUnits, 100_000); // Ensure at least 100k CU
    }

    // If unable to get accurate estimate, use default value
    return 400_000;
  } catch (error) {
    console.warn('Estimate compute units failed, using default value:', error);
    return 400_000;
  }
}

/**
 * Calculate the annualized return for different price ranges
 */
import { chain, PoolAddress } from './config.js';

async function main(): Promise<void> {
  // Get the pool information
  const poolInfo = await chain.getRawPoolInfoByPoolId(PoolAddress.SOL_USDC);

  // Mock data
  const volume24h = 71408125; // 24h trading volume (USD), data from server
  const feeRate = 0.0002; // fee rate from server
  const solUsdValue = 170.17; // current sol price in USD, from server
  const usdcUsdValue = 1.0; // current usdc price in USD, from server

  // List of price ranges to calculate
  const percentRanges = [1, 5, 10, 20, 50, -1];

  // Calculate the annualized return for different price ranges
  const rangeAprs = chain.calculateRangeAprs({
    percentRanges,
    volume24h,
    feeRate,
    tokenAPriceUsd: solUsdValue, // TokenA is SOL
    tokenBPriceUsd: usdcUsdValue, // TokenB is USDC
    poolInfo,
  });

  console.log(`Current price: ${solUsdValue} USDC/SOL`);
  console.log('Annualized return for different price ranges:');

  // Print results
  for (const percent of percentRanges) {
    if (percent === -1) {
      const apr = rangeAprs[-1];
      console.log(`Full range: ${apr.toFixed(2)}%`);
      console.log('==================================');
      continue;
    } else {
      const apr = rangeAprs[percent];
      console.log(`±${percent}% range: ${apr.toFixed(2)}%`);

      // Calculate the actual price range
      const lowerPrice = solUsdValue * (1 - percent / 100);
      const upperPrice = solUsdValue * (1 + percent / 100);
      console.log(`  Price range: ${lowerPrice.toFixed(6)} - ${upperPrice.toFixed(6)} USDC/SOL`);
      console.log('==================================');
    }
  }
}

main();

/**
 * Get the on-chain information of the specified pool
 */

import { chain, PoolAddress } from './config.js';

async function main(): Promise<void> {
  // Get the on-chain information of the specified pool
  const poolInfo = await chain.getRawPoolInfoByPoolId(PoolAddress.RAY_USDC);
  console.log(poolInfo);
}

main();

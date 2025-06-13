/**
 * Get the position information corresponding to the NFT mint address (on-chain way)
 */
import { PublicKey } from '@solana/web3.js';

import { chain } from './config.js';

async function main(): Promise<void> {
  // Change to your own NFT mint address
  const nftMint = new PublicKey('4jqtGoJTNrRvJAwxynPUThLvtXgKD1se7Mu95JKvrv73');

  // Get the position information corresponding to the NFT mint address
  const positionInfo = await chain.getRawPositionInfoByNftMint(nftMint);
  console.log(positionInfo);
}

main();

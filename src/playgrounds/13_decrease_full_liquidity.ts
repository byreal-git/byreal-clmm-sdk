/**
 * Remove all liquidity from the position, and close the position
 */

import { PublicKey } from '@solana/web3.js';

import { chain, signerCallback, userAddress } from './config.js';

async function main(): Promise<void> {
  const nftMint = new PublicKey('2Rf4qWa2rNNtxdPxJEwQZr1rENAF28UxfdPnYRhMcT8p');

  const txid = await chain.decreaseFullLiquidity({
    userAddress,
    nftMint,
    signerCallback,
  });

  console.log('Decrease liquidity successfully, txid:', txid);
}

main();

import { PublicKey } from '@solana/web3.js';

import { Chain } from '../chain/index.js';
import { IInstructionReturn } from '../chain/models.js';

export abstract class AbstractLiquidityClient {
  protected _chain: Chain;

  constructor(params: { chain: Chain }) {
    this._chain = params.chain;
  }
  /**
   * Create a position
   * @param opts
   * @returns
   */
  abstract createPosition(opts: any): Promise<IInstructionReturn>;

  /**
   * Add liquidity
   * @param userAddress
   * @param nftMint
   * @returns
   */
  abstract addLiquidity(opts: any): Promise<IInstructionReturn>;

  /**
   * Decrease liquidity
   * @param walletAddress
   * @param nftMint
   * @param decreasePercentage
   * @returns
   */
  abstract decreaseLiquidity(walletAddress: PublicKey, nftMint: string, decreasePercentage: number): Promise<any>;

  /**
   * Remove all liquidity
   * @param userAddress
   * @param nftMint
   */
  abstract removeFullLiquidity(userAddress: string, nftMint: string): Promise<any>;
}

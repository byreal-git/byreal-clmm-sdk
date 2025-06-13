import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

import { Chain } from '../chain/index.js';
import { IAddLiquidityParams } from '../chain/models.js';

import { AbstractLiquidityClient } from './abstract.js';
import { ICLMMCreatePositionOptions } from './types.js';

export class CLMMClient extends AbstractLiquidityClient {
  constructor(params: { chain: Chain }) {
    super(params);
  }

  /**
   * Create a position
   * @param options
   * @returns
   */
  async createPosition(options: ICLMMCreatePositionOptions) {
    return this._chain.createPositionInstructions({
      userAddress: options.walletAddress,
      poolInfo: options.rpcPoolInfo,
      tickLower: options.tickLower,
      tickUpper: options.tickUpper,
      base: options.baseType,
      baseAmount: options.baseTokenAmount,
      otherAmountMax: options.quoteTokenAmount,
    });
  }

  async addLiquidity(options: IAddLiquidityParams) {
    return this._chain.addLiquidityInstructions(options);
  }

  /**
   * Decrease liquidity
   * @param nftMint
   * @returns
   */
  async decreaseLiquidity(walletAddress: PublicKey, nftMint: string, decreasePercentage: number) {
    const _nftMint = new PublicKey(nftMint);
    const positionInfo = await this._chain.getRawPositionInfoByNftMint(_nftMint);

    if (!positionInfo) {
      throw new Error('Position not found');
    }

    const { liquidity } = positionInfo;
    const liquidityToDecrease = liquidity.mul(new BN(decreasePercentage)).div(new BN(100));

    const params = {
      userAddress: walletAddress,
      nftMint: _nftMint,
      liquidity: liquidityToDecrease,
    };

    const { transaction } = await this._chain.decreaseLiquidityInstructions(params);
    return transaction;
  }

  /**
   * Remove all liquidity
   * @param userAddress
   * @param nftMint
   */
  async removeFullLiquidity(userAddress: string, nftMint: string) {
    const _nftMint = new PublicKey(nftMint);

    const { transaction } = await this._chain.decreaseFullLiquidityInstructions({
      userAddress: new PublicKey(userAddress),
      nftMint: _nftMint,
    });
    return transaction;
  }
}

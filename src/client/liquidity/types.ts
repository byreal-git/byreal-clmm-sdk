import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

import { IPoolLayoutWithId } from '../../instructions/index.js';

export interface ICLMMCreatePositionOptions {
  walletAddress: PublicKey;
  rpcPoolInfo: IPoolLayoutWithId;
  baseTokenAmount: BN;
  quoteTokenAmount: BN;
  tickLower: number;
  tickUpper: number;
  baseType: 'MintA' | 'MintB';
}

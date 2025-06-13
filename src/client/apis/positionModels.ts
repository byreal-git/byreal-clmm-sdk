import { PoolInfo } from './poolsModels.js';
export interface IMyPositionsReq {
  userAddress: string;
}

export interface IMyPositionsResp {
  positions: IPosition[];
  poolMap: IPoolMap;
}

export interface IPosition {
  activeBurnNft: boolean; // If the NFT is actively destroyed in the case of non-reduction of liquidity, the position is still there, but the deposit tokens cannot be withdrawn
  lpNftMintAddress: string;
  lpNftTokenAddress: string;
  lpProviderAddress: string;
  personalPositionAddress: string;
  poolAddress: string;
}

export interface IPoolMap {
  [address: string]: PoolInfo;
}

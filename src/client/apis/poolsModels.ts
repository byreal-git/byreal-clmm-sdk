export enum PoolCategory {
  DEFAULT = 'default',
  STABLES = 'stables',
  RESET_LAUNCH_PAD = 'resetLaunchPad',
}
export interface PoolReward {
  address: string;
  apr: string;
  dailyAmount: string;
  decimals: number;
  endTimestamp: number;
  logoURI: string;
  name: string;
  price: string;
  symbol: string;
}

export interface IPoolsReq {
  // ids?: string[];
  category?: PoolCategory;
  sortField?: 'tvl' | 'volumeUsd24h' | 'feeUsd24h' | 'apr24h';
  sortType?: 'asc' | 'desc';
  incentiveOnly?: boolean; // todo: field to be determined, need to confirm with server
  page: number;
  pageSize: number;
}

export interface IPoolsResp {
  list: PoolInfo[];
  total: number;
}

export interface IPoolsByIdsReq {
  ids: string[];
}

export type IPoolsByIdsResp = IPoolsResp;

export interface Mint {
  address: string;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
  programId: string;
  price: string;
  priceChange24h: string;
  tvl: string;
  volumeUsd24h: string;
}

export interface PoolInfo {
  poolAddress: string;
  programId: string;
  feeRate: string;
  mintA: Mint;
  mintB: Mint;
  mintAVaultAddress: string;
  mintBVaultAddress: string;
  mintAmountA: string;
  mintAmountB: string;
  openTime: string;
  config: {
    defaultRange: number;
    defaultRangePoint: number[];
    fundFeeRate: string;
    id: string;
    index: number;
    protocolFeeRate: string;
    tickSpacing: number;
    tradeFeeRate: string;
  };
  apr24h: string;
  apr24hChange: string;
  feeUsd24h: string;
  apr7d: string;
  feeUsd7d: string;
  volumeUsd24h: string;
  tvl: string;
  ratio: string; // tokenB per tokenA
  day: {
    ratioHigh: string;
    ratioLow: string;
  };
  category?: PoolCategory;
  rewards?: PoolReward[];
}

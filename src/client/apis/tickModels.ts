export interface ITickReq {
  poolId: string;
}

export interface ITick {
  tick: number;
  price: string;
  originalPrice: string;
  liquidity: string;
}

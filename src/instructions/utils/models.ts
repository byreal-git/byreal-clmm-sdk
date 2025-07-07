import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Decimal } from 'decimal.js';

export interface ReturnTypeGetPriceAndTick {
  tick: number;
  price: Decimal;
}

export type Tick = {
  tick: number;
  liquidityNet: BN;
  liquidityGross: BN;
  feeGrowthOutsideX64A: BN;
  feeGrowthOutsideX64B: BN;
  rewardGrowthsOutsideX64: BN[];
};

export type TickArray = {
  address: PublicKey;
  poolId: PublicKey;
  startTickIndex: number;
  ticks: Tick[];
  initializedTickCount: number;
};

export type TickState = {
  tick: number;
  liquidityNet: BN;
  liquidityGross: BN;
  feeGrowthOutsideX64A: BN;
  feeGrowthOutsideX64B: BN;
  tickCumulativeOutside: BN;
  secondsPerLiquidityOutsideX64: BN;
  secondsOutside: number;
  rewardGrowthsOutside: BN[];
};

export type TickArrayState = {
  ammPool: PublicKey;
  startTickIndex: number;
  ticks: TickState[];
  initializedTickCount: number;
};

export interface TickArrayBitmapExtensionType {
  poolId: PublicKey;
  exBitmapAddress: PublicKey;
  positiveTickArrayBitmap: BN[][];
  negativeTickArrayBitmap: BN[][];
}

export interface StepComputations {
  sqrtPriceStartX64: BN;
  tickNext: number;
  initialized: boolean;
  sqrtPriceNextX64: BN;
  amountIn: BN;
  amountOut: BN;
  feeAmount: BN;
}

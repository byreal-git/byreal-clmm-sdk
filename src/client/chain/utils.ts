import BN from 'bn.js';
import { Decimal } from 'decimal.js';

import {
  IPoolLayout,
  IPoolLayoutWithId,
  LiquidityMath,
  PoolUtils,
  SqrtPriceMath,
  TickMath,
} from '../../instructions/index.js';

/**
 * Used to round the price to the corresponding tick when creating a position
 * @param price Input price
 * @param poolInfo Pool information
 * @returns Decimal rounded price
 */
export function alignPriceToTickPrice(price: Decimal, poolInfo: IPoolLayout): Decimal {
  const { price: roundedPrice } = TickMath.getTickAlignedPriceDetails(
    price,
    poolInfo.tickSpacing,
    poolInfo.mintDecimalsA,
    poolInfo.mintDecimalsB
  );
  return roundedPrice;
}

/**
 * Calculate the amount of tokenB needed to be invested after the specified tokenA amount has been invested
 * @param params.priceLower Lower price
 * @param params.priceUpper Upper price
 * @param params.amountA Amount of tokenA to be invested
 * @param params.poolInfo Pool information
 * @returns BN amount of tokenB to be invested
 */
export function getAmountBFromAmountA(params: {
  priceLower: Decimal | number | string;
  priceUpper: Decimal | number | string;
  amountA: BN;
  poolInfo: IPoolLayout;
}): BN {
  // console.log('[clmm sdk] getAmountBFromAmountA fn params:', JSON.stringify(params, null, 2));
  const { priceLower, priceUpper, amountA, poolInfo } = params;

  const priceLowerDecimal = alignPriceToTickPrice(new Decimal(priceLower), poolInfo);
  const priceUpperDecimal = alignPriceToTickPrice(new Decimal(priceUpper), poolInfo);

  const sqrtPriceX64A = SqrtPriceMath.priceToSqrtPriceX64(
    priceLowerDecimal,
    poolInfo.mintDecimalsA,
    poolInfo.mintDecimalsB
  );
  const sqrtPriceX64B = SqrtPriceMath.priceToSqrtPriceX64(
    priceUpperDecimal,
    poolInfo.mintDecimalsA,
    poolInfo.mintDecimalsB
  );

  const amountB = LiquidityMath.getAmountBFromAmountA(sqrtPriceX64A, sqrtPriceX64B, poolInfo.sqrtPriceX64, amountA);

  return amountB;
}

/**
 * Calculate the amount of tokenA needed to be invested after the specified tokenB amount has been invested
 * @param params.priceLower Lower price
 * @param params.priceUpper Upper price
 * @param params.amountB Amount of tokenB to be invested
 * @param params.poolInfo Pool information
 * @returns BN amount of tokenA to be invested
 */
export function getAmountAFromAmountB(params: {
  priceLower: Decimal | number | string;
  priceUpper: Decimal | number | string;
  amountB: BN;
  poolInfo: IPoolLayout;
}): BN {
  const { priceLower, priceUpper, amountB, poolInfo } = params;

  const priceLowerDecimal = alignPriceToTickPrice(new Decimal(priceLower), poolInfo);
  const priceUpperDecimal = alignPriceToTickPrice(new Decimal(priceUpper), poolInfo);

  const sqrtPriceX64A = SqrtPriceMath.priceToSqrtPriceX64(
    priceLowerDecimal,
    poolInfo.mintDecimalsA,
    poolInfo.mintDecimalsB
  );
  const sqrtPriceX64B = SqrtPriceMath.priceToSqrtPriceX64(
    priceUpperDecimal,
    poolInfo.mintDecimalsA,
    poolInfo.mintDecimalsB
  );

  return LiquidityMath.getAmountAFromAmountB(sqrtPriceX64A, sqrtPriceX64B, poolInfo.sqrtPriceX64, amountB);
}

/**
 * Calculate the expected annualized return rate of adding liquidity (APR)
 */
export function calculateApr(params: {
  volume24h: number; // 24h volume in USD
  feeRate: number; // Fee rate, e.g. 0.003 means 0.3%
  positionUsdValue: number; // USD value of the tokens invested by the user
  amountA: BN; // Amount of tokenA invested
  amountB: BN; // Amount of tokenB invested
  tickLower: number; // Tick corresponding to the lower price
  tickUpper: number; // Tick corresponding to the upper price
  poolInfo: IPoolLayoutWithId; // Pool information
  existLiquidity?: BN; // Existing liquidity (required when adding liquidity)
  scene?: 'create' | 'add' | 'exist'; // Calculation scenario, create, add, exist
}): number {
  // console.log('[clmm sdk] calculateApr fn params:', JSON.stringify(params, null, 2));
  const {
    volume24h,
    feeRate,
    positionUsdValue,
    amountA,
    amountB,
    tickLower,
    tickUpper,
    poolInfo,
    scene = 'exist',
    existLiquidity = new BN(0),
  } = params;

  return _calculateApr({
    fee24hUsdValue: volume24h * feeRate,
    positionUsdValue,
    amountA,
    amountB,
    tickLower,
    tickUpper,
    poolInfo,
    scene,
    existLiquidity,
  });
}

/**
 * Calculate the expected annualized return rate of reward
 */
export function calculateRewardApr(params: {
  reward24hUsdValue: number; // Reward received in 24h
  positionUsdValue: number; // USD value of the tokens invested by the user
  amountA: BN; // Amount of tokenA invested
  amountB: BN; // Amount of tokenB invested
  tickLower: number; // Tick corresponding to the lower price
  tickUpper: number; // Tick corresponding to the upper price
  poolInfo: IPoolLayoutWithId; // Pool information
  existLiquidity?: BN; // Existing liquidity (required when adding liquidity)
  scene?: 'create' | 'add' | 'exist'; // Calculation scenario, create, add, exist
}): number {
  const {
    reward24hUsdValue,
    positionUsdValue,
    amountA,
    amountB,
    tickLower,
    tickUpper,
    poolInfo,
    scene = 'exist',
    existLiquidity = new BN(0),
  } = params;

  return _calculateApr({
    fee24hUsdValue: reward24hUsdValue,
    positionUsdValue,
    amountA,
    amountB,
    tickLower,
    tickUpper,
    poolInfo,
    scene,
    existLiquidity,
  });
}

/**
 * Calculate the expected annualized return rate of adding liquidity (APR)
 *
 */
export function _calculateApr(params: {
  fee24hUsdValue: number; // 24h fee or reward received
  positionUsdValue: number; // USD value of the tokens invested by the user
  amountA: BN; // Amount of tokenA invested
  amountB: BN; // Amount of tokenB invested
  tickLower: number; // Tick corresponding to the lower price
  tickUpper: number; // Tick corresponding to the upper price
  poolInfo: IPoolLayoutWithId; // Pool information
  existLiquidity?: BN; // Existing liquidity (required when adding liquidity)
  scene?: 'create' | 'add' | 'exist'; // Calculation scenario, create, add, exist
}): number {
  const {
    fee24hUsdValue,
    positionUsdValue,
    amountA,
    amountB,
    tickLower,
    tickUpper,
    poolInfo,
    scene = 'exist',
    existLiquidity = new BN(0),
  } = params;

  // Get the active liquidity of the pool
  const poolActiveLiquidity = poolInfo.liquidity;

  // Calculate the sqrtPrice of the price range
  const sqrtPriceCurrentX64 = poolInfo.sqrtPriceX64;
  const sqrtPriceLowerX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickLower);
  const sqrtPriceUpperX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper);

  // Calculate the active liquidity of the user
  const userActiveLiquidity = LiquidityMath.getLiquidityFromTokenAmounts(
    sqrtPriceCurrentX64,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    amountA,
    amountB
  );

  // Check if the current price is within the user's range
  const isInRange = poolInfo.tickCurrent >= tickLower && poolInfo.tickCurrent < tickUpper;

  // If not in range, active liquidity is 0
  if (!isInRange) {
    return 0;
  }

  if (poolActiveLiquidity.isZero()) {
    return 0;
  }

  // Calculate the annualized return rate
  // Formula source: https://uponly.larksuite.com/wiki/GznTwz3kGi3D0ikaLp8uDlYcsKd?fromScene=spaceOverview
  // For creating liquidity: (Volume * FeeRate / Position) * (userAL / (AL + userAL)) * 365 * 100
  // For adding liquidity: (Volume * FeeRate / Position) * ((userAL + addAL) / (AL + addAL)) * 365 * 100
  // For existing positions: (Volume * FeeRate / Position) * (userAL / AL) * 365 * 100
  const fee24hDec = new Decimal(fee24hUsdValue);
  const positionUsdValueDec = new Decimal(positionUsdValue);
  const userActiveLiquidityDec = new Decimal(userActiveLiquidity.toString());
  const poolActiveLiquidityDec = new Decimal(poolActiveLiquidity.toString());
  const existLiquidityDec = new Decimal(existLiquidity.toString());

  // Daily return rate
  const dailyReturn = fee24hDec.div(positionUsdValueDec);

  // Calculate the liquidity share using Decimal
  let liquidityShare: Decimal;
  if (scene === 'create') {
    liquidityShare = userActiveLiquidityDec.div(poolActiveLiquidityDec.plus(userActiveLiquidityDec));
  } else if (scene === 'add') {
    liquidityShare = existLiquidityDec
      .plus(userActiveLiquidityDec)
      .div(poolActiveLiquidityDec.plus(userActiveLiquidityDec));
  } else {
    liquidityShare = userActiveLiquidityDec.div(poolActiveLiquidityDec);
  }

  // Calculate the annualized return rate
  const apr = dailyReturn.mul(liquidityShare).mul(365).mul(100).toNumber();

  return apr;
}

/**
 * Calculate the annualized return rate for different price ranges
 * Calculate APR for different price ranges based on the percentage offset from the current price
 *
 * @param params Calculation parameters
 * @returns Mapping of annualized return rates for different price ranges, using -1 to represent the full range
 */
export function calculateRangeAprs(params: {
  percentRanges: number[]; // Price range percentage list, e.g. [1, 5, 10, 20, 50]
  volume24h: number; // 24h volume in USD
  feeRate: number; // Fee rate, e.g. 0.003 means 0.3%
  tokenAPriceUsd: number; // USD value of tokenA
  tokenBPriceUsd: number; // USD value of tokenB
  poolInfo: IPoolLayoutWithId; // Pool information
}): Record<number, number> {
  const { percentRanges, volume24h, feeRate, tokenAPriceUsd, tokenBPriceUsd, poolInfo } = params;

  // Get the current price, liquidity and sample liquidity
  const currentPrice = TickMath.getPriceFromTick({
    tick: poolInfo.tickCurrent,
    decimalsA: poolInfo.mintDecimalsA,
    decimalsB: poolInfo.mintDecimalsB,
  });

  const poolLiquidity = poolInfo.liquidity;
  const _sampleLiquidity = poolLiquidity.div(new BN(10000));
  const _minLiquidity = new BN(1000);
  const liquidityToUse = _sampleLiquidity.lt(_minLiquidity) ? _minLiquidity : _sampleLiquidity;

  // Result mapping
  const result: Record<number, number> = {};

  const { minTickBoundary, maxTickBoundary } = PoolUtils.tickRange(poolInfo.tickSpacing);

  // Calculate APR for each range
  for (const range of percentRanges) {
    let tickLower: number;
    let tickUpper: number;

    if (range === -1) {
      tickLower = minTickBoundary;
      tickUpper = maxTickBoundary;
    } else {
      const lowerPriceRatio = new Decimal(1).minus(new Decimal(range).div(100));
      const upperPriceRatio = new Decimal(1).plus(new Decimal(range).div(100));
      const lowerPrice = currentPrice.mul(lowerPriceRatio);
      const upperPrice = currentPrice.mul(upperPriceRatio);

      tickLower = TickMath.getTickWithPriceAndTickspacing(
        lowerPrice,
        poolInfo.tickSpacing,
        poolInfo.mintDecimalsA,
        poolInfo.mintDecimalsB
      );

      tickUpper = TickMath.getTickWithPriceAndTickspacing(
        upperPrice,
        poolInfo.tickSpacing,
        poolInfo.mintDecimalsA,
        poolInfo.mintDecimalsB
      );
    }

    // Ensure that lower and upper are at least 1 tickSpacing apart
    if (tickLower >= tickUpper) {
      tickLower = Math.max(minTickBoundary, poolInfo.tickCurrent - poolInfo.tickSpacing);
      tickUpper = Math.min(maxTickBoundary, poolInfo.tickCurrent + poolInfo.tickSpacing);
    }

    // Calculate the square root of the price (X64 format)
    const sqrtPriceCurrentX64 = poolInfo.sqrtPriceX64;
    const sqrtPriceLowerX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickLower);
    const sqrtPriceUpperX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper);

    // Calculate the corresponding token amounts based on the liquidity
    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceLowerX64,
      sqrtPriceUpperX64,
      liquidityToUse,
      false // Do not round up
    );

    // Calculate the USD value of the tokens
    const tokenAUsdAmount = new Decimal(amountA.toString())
      .div(new Decimal(10).pow(poolInfo.mintDecimalsA))
      .mul(tokenAPriceUsd);

    const tokenBUsdAmount = new Decimal(amountB.toString())
      .div(new Decimal(10).pow(poolInfo.mintDecimalsB))
      .mul(tokenBPriceUsd);

    // Calculate the total investment value
    const positionUsdValue = tokenAUsdAmount.plus(tokenBUsdAmount);

    // If the USD value is too small, set a minimum value to avoid division issues
    const effectivePositionUsdValue = positionUsdValue.lt(0.01) ? new Decimal(0.01) : positionUsdValue;

    // Calculate the actual annualized return rate
    const apr = calculateApr({
      volume24h,
      feeRate,
      positionUsdValue: effectivePositionUsdValue.toNumber(),
      amountA,
      amountB,
      tickLower,
      tickUpper,
      poolInfo,
      scene: 'create',
    });

    result[range] = apr;
  }

  return result;
}

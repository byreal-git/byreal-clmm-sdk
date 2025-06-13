import { TICK_ARRAY_SIZE, EXTENSION_TICKARRAY_BITMAP_SIZE } from '../constants.js';

import {
  blob,
  bool,
  i128,
  i64,
  publicKey,
  s32,
  seq,
  struct,
  u128,
  u16,
  u32,
  u64,
  u8,
} from './libs/marshmallow/index.js';

/**
 * @description Pool configuration layout
 *
 * @example https://solscan.io/account/EdPxg8QaeFSrTYqdWJn6Kezwy9McWncTYueD9eMGCuzR#anchorData
 */
export const AmmConfigLayout = struct([
  blob(8),
  u8('bump'),
  u16('index'),
  publicKey(''),
  u32('protocolFeeRate'),
  u32('tradeFeeRate'),
  u16('tickSpacing'),
]);

export type IAmmConfigLayout = ReturnType<typeof AmmConfigLayout.decode>;

/**
 * @description Observation account layout
 *
 * @example https://solscan.io/account/AA5RaVvyGyZgtmAsJJHT5ZVBxVPtAXuYaMwfgeFJW4Mk#anchorData
 */
export const ObservationLayout = struct([
  blob(8),
  bool('initialized'),
  u64('recentEpoch'),
  u16('observationIndex'),
  publicKey('poolId'),
  seq(struct([u32('blockTimestamp'), i64('tickCumulative'), seq(u64(), 4)]), 100, 'observations'),
]);

export type IObservationLayout = ReturnType<typeof ObservationLayout.decode>;

/**
 * @description Pool information layout
 *
 * @example https://solscan.io/account/CYbD9RaToYMtWKA7QZyoLahnHdWq553Vm62Lh6qWtuxq#anchorData
 */
export const PoolLayout = struct([
  blob(8),
  u8('bump'),
  publicKey('ammConfig'),
  publicKey('creator'),
  publicKey('mintA'),
  publicKey('mintB'),
  publicKey('vaultA'),
  publicKey('vaultB'),
  publicKey('observationId'),
  u8('mintDecimalsA'),
  u8('mintDecimalsB'),
  u16('tickSpacing'),
  u128('liquidity'),
  u128('sqrtPriceX64'),
  s32('tickCurrent'),
  u32(),
  u128('feeGrowthGlobalX64A'),
  u128('feeGrowthGlobalX64B'),
  u64('protocolFeesTokenA'),
  u64('protocolFeesTokenB'),

  u128('swapInAmountTokenA'),
  u128('swapOutAmountTokenB'),
  u128('swapInAmountTokenB'),
  u128('swapOutAmountTokenA'),

  u8('status'),

  seq(u8(), 7, ''),

  seq(
    struct([
      u8('rewardState'),
      u64('openTime'),
      u64('endTime'),
      u64('lastUpdateTime'),
      u128('emissionsPerSecondX64'),
      u64('rewardTotalEmissioned'),
      u64('rewardClaimed'),
      publicKey('tokenMint'),
      publicKey('tokenVault'),
      publicKey('creator'),
      u128('rewardGrowthGlobalX64'),
    ]),
    3,
    'rewardInfos'
  ),
  seq(u64(), 16, 'tickArrayBitmap'),

  u64('totalFeesTokenA'),
  u64('totalFeesClaimedTokenA'),
  u64('totalFeesTokenB'),
  u64('totalFeesClaimedTokenB'),
]);

export type IPoolLayout = ReturnType<typeof PoolLayout.decode>;

/**
 * @description Personal position information layout
 *
 * @example https://solscan.io/account/CLYRosA3oGsx6WjuebDYmEL3kukTCSsncmYU6at8nDsn#anchorData
 */
export const PersonalPositionLayout = struct([
  blob(8),
  u8('bump'),
  publicKey('nftMint'),
  publicKey('poolId'),

  s32('tickLower'),
  s32('tickUpper'),
  u128('liquidity'),
  u128('feeGrowthInsideLastX64A'),
  u128('feeGrowthInsideLastX64B'),
  u64('tokenFeesOwedA'),
  u64('tokenFeesOwedB'),

  seq(struct([u128('growthInsideLastX64'), u64('rewardAmountOwed')]), 3, 'rewardInfos'),
]);

export type IPersonalPositionLayout = ReturnType<typeof PersonalPositionLayout.decode>;

/**
 * @description Protocol position information layout, used to track liquidity within specific price ranges
 *
 * @example https://solscan.io/account/38GUhmh7vPyWStAV3YKEEYPHrLk2Mnw5jvaUQkMGS1hb#anchorData
 */
export const ProtocolPositionLayout = struct([
  blob(8),
  u8('bump'),
  publicKey('poolId'),
  s32('tickLowerIndex'),
  s32('tickUpperIndex'),
  u128('liquidity'),
  u128('feeGrowthInsideLastX64A'),
  u128('feeGrowthInsideLastX64B'),
  u64('tokenFeesOwedA'),
  u64('tokenFeesOwedB'),
  seq(u128(), 3, 'rewardGrowthInside'),
]);

/**
 * @description Price tick array layout
 *
 * @example https://solscan.io/account/4vGLPwfohNUd2o4NwZPMx7q8AH98DQ9Eth5tS1p8dew1#anchorData
 */
export const TickArrayLayout = struct([
  blob(8),
  publicKey('poolId'),
  s32('startTickIndex'),
  seq(
    struct([
      s32('tick'),
      i128('liquidityNet'),
      u128('liquidityGross'),
      u128('feeGrowthOutsideX64A'),
      u128('feeGrowthOutsideX64B'),
      seq(u128(), 3, 'rewardGrowthsOutsideX64'),
      seq(u32(), 13, ''),
    ]),
    TICK_ARRAY_SIZE,
    'ticks'
  ),
  u8('initializedTickCount'),
]);

/**
 * @description Price tick array bitmap extension layout
 *
 * @example https://solscan.io/account/DoPuiZfJu7sypqwR4eiU7C5TMcmmiFoU4HaF5SoD8mRy#anchorData
 */
export const TickArrayBitmapExtensionLayout = struct([
  blob(8),
  publicKey('poolId'),
  seq(seq(u64(), 8), EXTENSION_TICKARRAY_BITMAP_SIZE, 'positiveTickArrayBitmap'),
  seq(seq(u64(), 8), EXTENSION_TICKARRAY_BITMAP_SIZE, 'negativeTickArrayBitmap'),
]);

export const SPLTokenAccountLayout = struct([
  publicKey('mint'),
  publicKey('owner'),
  u64('amount'),
  u32('delegateOption'),
  publicKey('delegate'),
  u8('state'),
  u32('isNativeOption'),
  u64('isNative'),
  u64('delegatedAmount'),
  u32('closeAuthorityOption'),
  publicKey('closeAuthority'),
]);

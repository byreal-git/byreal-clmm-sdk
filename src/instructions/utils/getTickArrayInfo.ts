import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

import { TickArrayLayout } from '../layout.js';
import { IPoolLayoutWithId, TickArrayBitmapExtensionType } from '../models.js';
import { getPdaTickArrayAddress } from '../pda.js';

import { TickArray } from './models';
import { TickUtils } from './tick.js';

/**
 * Get tick array cache
 */
export async function getTickArrayInfo({
  connection,
  poolInfo,
  exBitmapInfo,
  expectedCount = 7, // Default get 7 tick arrays
}: {
  connection: Connection;
  poolInfo: IPoolLayoutWithId;
  exBitmapInfo: TickArrayBitmapExtensionType;
  expectedCount?: number;
}): Promise<{ [key: string]: TickArray }> {
  poolInfo;
  // 1. Calculate the starting index of the tick array where the current tick is located
  const currentTickArrayStartIndex = TickUtils.getTickArrayStartIndexByTick(poolInfo.tickCurrent, poolInfo.tickSpacing);

  // 2. Get the list of tick array start indices that need to be loaded
  const startIndexArray = TickUtils.getInitializedTickArrayInRange(
    poolInfo.tickArrayBitmap,
    exBitmapInfo,
    poolInfo.tickSpacing,
    currentTickArrayStartIndex,
    expectedCount
  );

  // 3. Calculate PDA addresses for all tick arrays
  const tickArrayAddresses: PublicKey[] = [];
  const startIndexToAddress: { [key: number]: PublicKey } = {};

  for (const startIndex of startIndexArray) {
    const { publicKey: tickArrayAddress } = getPdaTickArrayAddress(poolInfo.programId, poolInfo.poolId, startIndex);
    tickArrayAddresses.push(tickArrayAddress);
    startIndexToAddress[startIndex] = tickArrayAddress;
  }

  // 4. Batch fetch on-chain account data
  const accountInfos = await connection.getMultipleAccountsInfo(tickArrayAddresses);

  // 5. Decode and build cache
  const tickArrayCache: { [key: string]: TickArray } = {};

  for (let i = 0; i < accountInfos.length; i++) {
    const accountInfo = accountInfos[i];
    const startIndex = startIndexArray[i];

    if (!accountInfo || !accountInfo.data) {
      console.warn(`Tick array at index ${startIndex} not found`);
      continue;
    }

    try {
      // Use your TickArrayLayout to decode
      const decoded = TickArrayLayout.decode(accountInfo.data);

      tickArrayCache[startIndex.toString()] = {
        address: tickArrayAddresses[i],
        poolId: decoded.poolId,
        startTickIndex: decoded.startTickIndex,
        ticks: decoded.ticks.map((tick: any) => ({
          tick: tick.tick,
          liquidityNet: new BN(tick.liquidityNet.toString()),
          liquidityGross: new BN(tick.liquidityGross.toString()),
          feeGrowthOutsideX64A: new BN(tick.feeGrowthOutsideX64A.toString()),
          feeGrowthOutsideX64B: new BN(tick.feeGrowthOutsideX64B.toString()),
          rewardGrowthsOutsideX64: tick.rewardGrowthsOutsideX64.map((r: any) => new BN(r.toString())),
        })),
        initializedTickCount: decoded.initializedTickCount,
      };
    } catch (error) {
      console.error(`Failed to decode tick array at index ${startIndex}:`, error);
    }
  }

  return tickArrayCache;
}

import { MAX_TICK, MIN_TICK } from '../constants.js';

import { TickQuery, TickUtils } from './tick.js';
import { TickArrayBitmap } from './tickarrayBitmap.js';

export class PoolUtils {
  // Used to check if a set of tickarray start indices exceed the boundary range of the default bitmap
  public static isOverflowDefaultTickarrayBitmap(tickSpacing: number, tickarrayStartIndexs: number[]): boolean {
    const { maxTickBoundary, minTickBoundary } = this._tickRange(tickSpacing);

    for (const tickIndex of tickarrayStartIndexs) {
      const tickarrayStartIndex = TickUtils.getTickArrayStartIndexByTick(tickIndex, tickSpacing);

      if (tickarrayStartIndex >= maxTickBoundary || tickarrayStartIndex < minTickBoundary) {
        return true;
      }
    }

    return false;
  }

  public static _tickRange(tickSpacing: number): {
    maxTickBoundary: number;
    minTickBoundary: number;
  } {
    let maxTickBoundary = TickArrayBitmap.maxTickInTickarrayBitmap(tickSpacing);
    let minTickBoundary = -maxTickBoundary;

    if (maxTickBoundary > MAX_TICK) {
      maxTickBoundary = TickQuery.getArrayStartIndex(MAX_TICK, tickSpacing) + TickQuery.tickCount(tickSpacing);
    }
    if (minTickBoundary < MIN_TICK) {
      minTickBoundary = TickQuery.getArrayStartIndex(MIN_TICK, tickSpacing);
    }
    return { maxTickBoundary, minTickBoundary };
  }

  /**
   * Calculate the maximum and minimum ticks selectable by users in the UI
   * Unlike _tickRange, this method directly returns the available tick value range, not the tickarray boundaries
   *
   * @param tickSpacing tick spacing
   * @returns Maximum and minimum tick values selectable by users
   */
  public static tickRange(tickSpacing: number): {
    maxTickBoundary: number;
    minTickBoundary: number;
  } {
    // Use protocol-defined hard boundaries
    let maxTickBoundary = MAX_TICK;
    let minTickBoundary = MIN_TICK;

    // Ensure returned tick values are divisible by tickSpacing to meet UI selection requirements
    maxTickBoundary = Math.floor(maxTickBoundary / tickSpacing) * tickSpacing;
    minTickBoundary = Math.ceil(minTickBoundary / tickSpacing) * tickSpacing;

    return { maxTickBoundary, minTickBoundary };
  }
}

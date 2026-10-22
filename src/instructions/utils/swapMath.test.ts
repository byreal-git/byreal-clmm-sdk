import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { describe, expect, test, vi } from 'vitest';

import * as sdk from '../../index.js';

const Q64 = 1n << 64n;
const LIQUIDITY = 1_000_000n;
const REQUESTED = 1_000_000n;
const bn = (n: bigint | number) => new BN(String(n));
const key = (n: number) => new PublicKey(Buffer.alloc(32, n));
const ceil = (n: bigint, d: bigint) => (n + d - 1n) / d;

function fixture() {
  const programId = sdk.BYREAL_CLMM_PROGRAM_ID, poolId = key(2), mintA = key(3), mintB = key(4), configId = key(5);
  const bitmap = Array.from({ length: 16 }, () => bn(0));
  bitmap[7].setn(63, true);
  bitmap[8].setn(0, true);
  const extension = {
    poolId, exBitmapAddress: sdk.getPdaExBitmapAccount(programId, poolId).publicKey,
    positiveTickArrayBitmap: Array.from({ length: 14 }, () => Array.from({ length: 8 }, () => bn(0))),
    negativeTickArrayBitmap: Array.from({ length: 14 }, () => Array.from({ length: 8 }, () => bn(0))),
  };
  const pool = {
    programId, poolId, mintA, mintB, ammConfig: configId, mintDecimalsA: 6, mintDecimalsB: 6,
    tickSpacing: 1, tickCurrent: 0, sqrtPriceX64: bn(Q64), liquidity: bn(LIQUIDITY), tickArrayBitmap: bitmap,
    vaultA: key(17), vaultB: key(18), observationId: key(19),
  } as sdk.IPoolLayoutWithId;
  const cache: Record<number, sdk.TickArrayContainer> = {};
  const accounts = new Map<string, Buffer>();
  for (const start of [-60, 0]) {
    const address = sdk.getPdaTickArrayAddress(programId, poolId, start).publicKey;
    const buffer = Buffer.alloc(sdk.TickArrayLayout.span);
    const raw = sdk.TickArrayLayout.decode(buffer);
    Object.assign(raw, { poolId, startTickIndex: start, initializedTickCount: 1 });
    raw.ticks.forEach((tick, i) => { tick.tick = start + i; });
    Object.assign(raw.ticks[start === -60 ? 40 : 20], {
      liquidityGross: bn(LIQUIDITY), liquidityNet: bn(start === -60 ? LIQUIDITY : -LIQUIDITY),
    });
    sdk.TickArrayLayout.encode(raw, buffer);
    Buffer.from('c09b55cd31f9812a', 'hex').copy(buffer);
    cache[start] = { type: 'Fixed', data: { ...raw, address } };
    accounts.set(address.toBase58(), buffer);
  }
  const config = Buffer.alloc(sdk.AmmConfigLayout.span);
  sdk.AmmConfigLayout.encode({ ...sdk.AmmConfigLayout.decode(config), owner: key(6), fundOwner: key(7), tradeFeeRate: 3000, tickSpacing: 1 }, config);
  accounts.set(configId.toBase58(), config);
  const bitmapData = Buffer.alloc(sdk.TickArrayBitmapExtensionLayout.span);
  sdk.TickArrayBitmapExtensionLayout.encode(extension, bitmapData);
  accounts.set(extension.exBitmapAddress.toBase58(), bitmapData);
  const getAccountInfo = vi.fn(async (address: PublicKey) => {
    const data = accounts.get(address.toBase58());
    if (!data) throw new Error(`Unexpected fixture account: ${address.toBase58()}`);
    return { data, owner: programId, lamports: 1, executable: false, rentEpoch: 0 };
  });
  const connection = {
    getAccountInfo,
    getMultipleAccountsInfo: (addresses: PublicKey[]) => Promise.all(addresses.map(address => getAccountInfo(address))),
    getLatestBlockhash: vi.fn(async () => ({ blockhash: key(20).toBase58(), lastValidBlockHeight: 1000 })),
    simulateTransaction: vi.fn(async () => ({ value: { err: null, logs: ['fixture'], unitsConsumed: 100_000 } })),
  } as unknown as Connection;
  const chain = new sdk.Chain({ connection, programId });

  function compute(zeroForOne: boolean, exactOut: boolean, amount: bigint, limit: BN, catches: boolean) {
    const first = sdk.PoolUtils.getFirstInitializedTickArray({ ...pool, exBitmapInfo: extension }, zeroForOne);
    return sdk.SwapMath.swapCompute(programId, poolId, cache, bitmap, extension, zeroForOne, 3000,
      bn(LIQUIDITY), 0, 1, bn(Q64), bn(exactOut ? -amount : amount), first.startIndex, limit, catches);
  }
  function quote(zeroForOne: boolean, exactOut: boolean, amount: bigint, priceLimit: Decimal, catches: boolean) {
    return exactOut
      ? chain.quoteSwapExactOut({ poolInfo: pool, outputTokenMint: zeroForOne ? mintB : mintA, amountOut: bn(amount), priceLimit, catchLiquidityInsufficient: catches })
      : chain.qouteSwap({ poolInfo: pool, inputTokenMint: zeroForOne ? mintA : mintB, amountIn: bn(amount), priceLimit, catchLiquidityInsufficient: catches });
  }
  return { chain, pool, compute, quote };
}

// Independent single-range reserve deltas and fee rounding, not SwapMath's solver.
function capacity(sqrtPrice: BN, zeroForOne: boolean) {
  const p = BigInt(sqrtPrice.toString()), delta = p > Q64 ? p - Q64 : Q64 - p;
  const net = zeroForOne ? ceil(LIQUIDITY * Q64 * delta, Q64 * p) : ceil(LIQUIDITY * delta, Q64);
  const output = zeroForOne ? LIQUIDITY * delta / Q64 : LIQUIDITY * Q64 * delta / (Q64 * p);
  return { input: net + ceil(net * 3000n, 997000n), output };
}

const cases = [true, false].flatMap(zeroForOne => [true, false].flatMap(exactOut =>
  [true, false].map(catches => ({ zeroForOne, exactOut, catches }))));

describe('price-limit completion and remaining amounts', () => {
  test.each(cases)('reports partial fills: %j', async ({ zeroForOne, exactOut, catches }) => {
    const f = fixture();
    const priceLimit = sdk.SqrtPriceMath.sqrtPriceX64ToPrice(sdk.SqrtPriceMath.getSqrtPriceX64FromTick(zeroForOne ? -10 : 10), 6, 6);
    const limit = sdk.SqrtPriceMath.priceToSqrtPriceX64(priceLimit, 6, 6);
    const cap = capacity(limit, zeroForOne);
    const remaining = REQUESTED - (exactOut ? cap.output : cap.input);
    const result = f.compute(zeroForOne, exactOut, REQUESTED, limit, catches);
    expect(result.allTrade).toBe(false);
    expect(result.amountSpecifiedRemaining.toString()).toBe(String(exactOut ? -remaining : remaining));
    expect(result.amountCalculated.toString()).toBe(String(exactOut ? cap.input : -cap.output));
    const quote = await f.quote(zeroForOne, exactOut, REQUESTED, priceLimit, catches);
    expect(quote.allTrade).toBe(false);
    const unfilled = exactOut
      ? (quote as sdk.IQuoteSwapExactOutReturn).amountOutRemaining
      : (quote as sdk.IQouteSwapReturn).amountInRemaining;
    expect(unfilled?.toString()).toBe(String(remaining));
  });

  test.each(cases)('keeps full fills complete: %j', async ({ zeroForOne, exactOut, catches }) => {
    const f = fixture();
    const priceLimit = sdk.SqrtPriceMath.sqrtPriceX64ToPrice(sdk.SqrtPriceMath.getSqrtPriceX64FromTick(zeroForOne ? -10 : 10), 6, 6);
    const limit = sdk.SqrtPriceMath.priceToSqrtPriceX64(priceLimit, 6, 6);
    const cap = capacity(limit, zeroForOne);
    const amount = (exactOut ? cap.output : cap.input) / 2n;
    const result = f.compute(zeroForOne, exactOut, amount, limit, catches);
    expect(result.allTrade).toBe(true);
    expect(result.amountSpecifiedRemaining.isZero()).toBe(true);
    const quote = await f.quote(zeroForOne, exactOut, amount, priceLimit, catches);
    expect(quote.allTrade).toBe(true);
    const unfilled = exactOut
      ? (quote as sdk.IQuoteSwapExactOutReturn).amountOutRemaining
      : (quote as sdk.IQouteSwapReturn).amountInRemaining;
    expect(unfilled?.isZero()).toBe(true);
  });

  test.each([true, false])('preserves insufficient-liquidity behavior, A-to-B=%s', zeroForOne => {
    const f = fixture(), limit = sdk.SqrtPriceMath.getSqrtPriceX64FromTick(zeroForOne ? -30 : 30);
    expect(() => f.compute(zeroForOne, false, REQUESTED, limit, false)).toThrow('LiquidityInsufficient');
    const result = f.compute(zeroForOne, false, REQUESTED, limit, true);
    expect(result.allTrade).toBe(false);
    expect(result.amountSpecifiedRemaining.gtn(0)).toBe(true);
  });

  test('rejects a partial exact-output quote before preparing accounts or a transaction', async () => {
    const f = fixture();
    const priceLimit = sdk.SqrtPriceMath.sqrtPriceX64ToPrice(sdk.SqrtPriceMath.getSqrtPriceX64FromTick(-10), 6, 6);
    const quote = await f.chain.quoteSwapExactOut({ poolInfo: f.pool, outputTokenMint: f.pool.mintB, amountOut: bn(REQUESTED), priceLimit });
    const prepare = vi.spyOn(f.chain, 'handleTokenAccount').mockRejectedValue(new Error('Must not prepare accounts'));
    await expect(f.chain.swapExactOutInstructions({ poolInfo: f.pool, userAddress: key(8), quoteReturn: { ...quote, allTrade: false } })).rejects.toThrow('partial quote');
    expect(prepare).not.toHaveBeenCalled();
  });

  test.each([true, false])('builds full exact-output quotes, A-to-B=%s', async zeroForOne => {
    const f = fixture();
    const quote = await f.chain.quoteSwapExactOut({ poolInfo: f.pool, outputTokenMint: zeroForOne ? f.pool.mintB : f.pool.mintA, amountOut: bn(100) });
    expect(quote.allTrade).toBe(true);
    vi.spyOn(f.chain, 'handleTokenAccount').mockResolvedValue({
      tokenAccountA: key(21), tokenAccountB: key(22),
      tokenProgramIdA: TOKEN_PROGRAM_ID, tokenProgramIdB: TOKEN_PROGRAM_ID,
      preInstructions: [], endInstructions: [],
    });
    const result = await f.chain.swapExactOutInstructions({ poolInfo: f.pool, userAddress: key(8), quoteReturn: quote });
    const instruction = result.instructions.find(ix => ix.programId.equals(f.pool.programId));
    expect(instruction).toBeDefined();
    expect(new BN(instruction!.data.subarray(8, 16), 'le').toString()).toBe('100');
    expect(instruction!.data[40]).toBe(0); // exact output
  });
});

import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { describe, test, expect } from 'vitest';

import { LiquidityMath } from './liquidityMath.js';
import { SqrtPriceMath } from './sqrtPriceMath.js';

describe('LiquidityMath.getLiquidityFromTokenAmounts', () => {
  test('当前价格低于区间下限 - 只考虑 tokenA', () => {
    // 价格: current < A < B
    const sqrtPriceCurrentX64 = new BN('100000');
    const sqrtPriceX64A = new BN('150000');
    const sqrtPriceX64B = new BN('300000');
    const amountA = new BN('1000000');
    const amountB = new BN('500000');

    // 手动计算预期结果
    const expectedLiquidity = LiquidityMath.getLiquidityFromTokenAmountA(sqrtPriceX64A, sqrtPriceX64B, amountA, false);

    const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      amountA,
      amountB
    );

    // 验证结果
    expect(liquidity.toString()).toBe(expectedLiquidity.toString());
  });

  test('当前价格在区间内 - 取两种流动性的最小值', () => {
    // 价格: A < current < B
    const sqrtPriceX64A = new BN('100000');
    const sqrtPriceCurrentX64 = new BN('200000');
    const sqrtPriceX64B = new BN('300000');
    const amountA = new BN('1000000');
    const amountB = new BN('500000');

    // 分别计算两种流动性
    const liquidityA = LiquidityMath.getLiquidityFromTokenAmountA(sqrtPriceCurrentX64, sqrtPriceX64B, amountA, false);

    const liquidityB = LiquidityMath.getLiquidityFromTokenAmountB(sqrtPriceX64A, sqrtPriceCurrentX64, amountB);

    // 预期结果是两者的最小值
    const expectedLiquidity = BN.min(liquidityA, liquidityB);

    const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      amountA,
      amountB
    );

    // 验证结果
    expect(liquidity.toString()).toBe(expectedLiquidity.toString());
  });

  test('当前价格高于区间上限 - 只考虑 tokenB', () => {
    // 价格: A < B < current
    const sqrtPriceX64A = new BN('100000');
    const sqrtPriceX64B = new BN('200000');
    const sqrtPriceCurrentX64 = new BN('300000');
    const amountA = new BN('1000000');
    const amountB = new BN('500000');

    // 手动计算预期结果
    const expectedLiquidity = LiquidityMath.getLiquidityFromTokenAmountB(sqrtPriceX64A, sqrtPriceX64B, amountB);

    const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      amountA,
      amountB
    );

    // 验证结果
    expect(liquidity.toString()).toBe(expectedLiquidity.toString());
  });

  test('价格范围顺序调整 - 确保A始终小于B', () => {
    // 测试价格顺序颠倒的情况: B < A
    const sqrtPriceCurrentX64 = new BN('200000');
    const sqrtPriceX64B = new BN('100000'); // 故意颠倒
    const sqrtPriceX64A = new BN('300000'); // 故意颠倒
    const amountA = new BN('1000000');
    const amountB = new BN('500000');

    // 正确顺序的调用
    const expectedLiquidity = LiquidityMath.getLiquidityFromTokenAmounts(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      amountA,
      amountB
    );

    // 颠倒顺序的调用
    const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
      sqrtPriceCurrentX64,
      sqrtPriceX64B,
      sqrtPriceX64A,
      amountA,
      amountB
    );

    // 验证结果相同
    expect(liquidity.toString()).toBe(expectedLiquidity.toString());
  });
});

describe('LiquidityMath.getAmountsFromLiquidity', () => {
  test('当前价格低于区间下限 - 只返回 tokenA', () => {
    // 价格: current < A < B
    const sqrtPriceCurrentX64 = new BN('100000');
    const sqrtPriceX64A = new BN('150000');
    const sqrtPriceX64B = new BN('300000');
    const liquidity = new BN('10000000');
    const roundUp = true;

    // 手动计算预期 tokenA 数量
    const expectedAmountA = LiquidityMath.getTokenAmountAFromLiquidity(
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );

    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );

    // 验证结果
    expect(amountA.toString()).toBe(expectedAmountA.toString());
    expect(amountB.toString()).toBe('0');
  });

  test('当前价格在区间内 - 返回两种代币', () => {
    // 价格: A < current < B
    const sqrtPriceX64A = new BN('100000');
    const sqrtPriceCurrentX64 = new BN('200000');
    const sqrtPriceX64B = new BN('300000');
    const liquidity = new BN('10000000');
    const roundUp = true;

    // 手动计算预期数量
    const expectedAmountA = LiquidityMath.getTokenAmountAFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );

    const expectedAmountB = LiquidityMath.getTokenAmountBFromLiquidity(
      sqrtPriceX64A,
      sqrtPriceCurrentX64,
      liquidity,
      roundUp
    );

    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );

    // 验证结果
    expect(amountA.toString()).toBe(expectedAmountA.toString());
    expect(amountB.toString()).toBe(expectedAmountB.toString());
  });

  test('当前价格高于区间上限 - 只返回 tokenB', () => {
    // 价格: A < B < current
    const sqrtPriceX64A = new BN('100000');
    const sqrtPriceX64B = new BN('200000');
    const sqrtPriceCurrentX64 = new BN('300000');
    const liquidity = new BN('10000000');
    const roundUp = true;

    // 手动计算预期 tokenB 数量
    const expectedAmountB = LiquidityMath.getTokenAmountBFromLiquidity(
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );

    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );

    // 验证结果
    expect(amountA.toString()).toBe('0');
    expect(amountB.toString()).toBe(expectedAmountB.toString());
  });

  test('舍入行为测试 - roundUp = true vs false', () => {
    const sqrtPriceX64A = new BN('100000');
    const sqrtPriceCurrentX64 = new BN('200000');
    const sqrtPriceX64B = new BN('300000');
    const liquidity = new BN('10000000');

    // 使用 roundUp = true
    const resultRoundUp = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      true
    );

    // 使用 roundUp = false
    const resultRoundDown = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      false
    );

    // 验证向上舍入的值大于等于向下舍入的值
    expect(new BN(resultRoundUp.amountA).gte(new BN(resultRoundDown.amountA))).toBeTruthy();
    expect(new BN(resultRoundUp.amountB).gte(new BN(resultRoundDown.amountB))).toBeTruthy();
  });
});

describe('LiquidityMath.getAmountBFromAmountA', () => {
  test('根据 tokenA 计算 tokenB - 正常情况', () => {
    // 价格: start < current < end
    const startSqrtPriceX64 = new BN('100000');
    const currentSqrtPriceX64 = new BN('200000');
    const endSqrtPriceX64 = new BN('300000');
    const amountA = new BN('1000000');

    const amountB = LiquidityMath.getAmountBFromAmountA(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountA
    );

    // 验证计算过程的正确性
    // 1. 计算流动性
    const liquidity = LiquidityMath.getLiquidityFromTokenAmountA(currentSqrtPriceX64, endSqrtPriceX64, amountA, false);

    // 2. 根据流动性计算 tokenB 数量
    const expectedAmountB = LiquidityMath.getTokenAmountBFromLiquidity(
      startSqrtPriceX64,
      currentSqrtPriceX64,
      liquidity,
      true
    );

    // 验证结果
    expect(amountB.toString()).toBe(expectedAmountB.toString());
  });

  test('当前价格低于区间下限 - 返回0', () => {
    // 价格: current < start < end
    const startSqrtPriceX64 = new BN('200000');
    const currentSqrtPriceX64 = new BN('100000'); // 低于下限
    const endSqrtPriceX64 = new BN('300000');
    const amountA = new BN('1000000');

    const amountB = LiquidityMath.getAmountBFromAmountA(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountA
    );

    // 验证结果为0
    expect(amountB.toString()).toBe('0');
  });

  test('当前价格高于区间上限 - 返回0', () => {
    // 价格: start < end < current
    const startSqrtPriceX64 = new BN('100000');
    const endSqrtPriceX64 = new BN('200000');
    const currentSqrtPriceX64 = new BN('300000'); // 高于上限
    const amountA = new BN('1000000');

    const amountB = LiquidityMath.getAmountBFromAmountA(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountA
    );

    // 验证结果为0
    expect(amountB.toString()).toBe('0');
  });

  test('价格范围顺序调整 - 确保start始终小于end', () => {
    // 测试顺序颠倒的情况: end < start
    const endSqrtPriceX64 = new BN('100000'); // 故意颠倒
    const currentSqrtPriceX64 = new BN('150000');
    const startSqrtPriceX64 = new BN('200000'); // 故意颠倒
    const amountA = new BN('1000000');

    // 正确顺序的调用
    const expectedAmountB = LiquidityMath.getAmountBFromAmountA(
      endSqrtPriceX64,
      startSqrtPriceX64,
      currentSqrtPriceX64,
      amountA
    );

    // 颠倒顺序的调用
    const amountB = LiquidityMath.getAmountBFromAmountA(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountA
    );

    // 验证结果相同
    expect(amountB.toString()).toBe(expectedAmountB.toString());
  });
});

describe('LiquidityMath.getAmountAFromAmountB', () => {
  test('根据 tokenB 计算 tokenA - 正常情况', () => {
    // 价格: start < current < end
    const startSqrtPriceX64 = new BN('100000');
    const currentSqrtPriceX64 = new BN('200000');
    const endSqrtPriceX64 = new BN('300000');
    const amountB = new BN('500000');

    const amountA = LiquidityMath.getAmountAFromAmountB(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountB
    );

    // 验证计算过程的正确性
    // 1. 计算流动性
    const liquidity = LiquidityMath.getLiquidityFromTokenAmountB(startSqrtPriceX64, currentSqrtPriceX64, amountB);

    // 2. 根据流动性计算 tokenA 数量
    const expectedAmountA = LiquidityMath.getTokenAmountAFromLiquidity(
      currentSqrtPriceX64,
      endSqrtPriceX64,
      liquidity,
      true
    );

    // 验证结果
    expect(amountA.toString()).toBe(expectedAmountA.toString());
  });

  test('当前价格低于区间下限 - 返回0', () => {
    // 价格: current < start < end
    const startSqrtPriceX64 = new BN('200000');
    const currentSqrtPriceX64 = new BN('100000'); // 低于下限
    const endSqrtPriceX64 = new BN('300000');
    const amountB = new BN('500000');

    const amountA = LiquidityMath.getAmountAFromAmountB(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountB
    );

    // 验证结果为0
    expect(amountA.toString()).toBe('0');
  });

  test('当前价格高于区间上限 - 返回0', () => {
    // 价格: start < end < current
    const startSqrtPriceX64 = new BN('100000');
    const endSqrtPriceX64 = new BN('200000');
    const currentSqrtPriceX64 = new BN('300000'); // 高于上限
    const amountB = new BN('500000');

    const amountA = LiquidityMath.getAmountAFromAmountB(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountB
    );

    // 验证结果为0
    expect(amountA.toString()).toBe('0');
  });

  test('价格范围顺序调整 - 确保start始终小于end', () => {
    // 测试顺序颠倒的情况: end < start
    const endSqrtPriceX64 = new BN('100000'); // 故意颠倒
    const currentSqrtPriceX64 = new BN('150000');
    const startSqrtPriceX64 = new BN('200000'); // 故意颠倒
    const amountB = new BN('500000');

    // 正确顺序的调用
    const expectedAmountA = LiquidityMath.getAmountAFromAmountB(
      endSqrtPriceX64,
      startSqrtPriceX64,
      currentSqrtPriceX64,
      amountB
    );

    // 颠倒顺序的调用
    const amountA = LiquidityMath.getAmountAFromAmountB(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      amountB
    );

    // 验证结果相同
    expect(amountA.toString()).toBe(expectedAmountA.toString());
  });
});

describe('LiquidityMath 方法之间的一致性测试', () => {
  test('流动性计算和代币数量计算的一致性', () => {
    const startPirce = '1';
    const currentPrice = '2';
    const endPrice = '3';

    const decimalsA = 6;
    const decimalsB = 6;

    // 设置测试参数
    const sqrtPriceX64A = SqrtPriceMath.priceToSqrtPriceX64(new Decimal(startPirce), decimalsA, decimalsB);
    const sqrtPriceCurrentX64 = SqrtPriceMath.priceToSqrtPriceX64(new Decimal(currentPrice), decimalsA, decimalsB);
    const sqrtPriceX64B = SqrtPriceMath.priceToSqrtPriceX64(new Decimal(endPrice), decimalsA, decimalsB);
    const amountA = new BN('1000000');
    const amountB = new BN('500000');

    // 1. 使用代币数量计算流动性
    const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      amountA,
      amountB
    );

    // 2. 使用计算出的流动性计算代币数量
    const { amountA: calculatedAmountA, amountB: calculatedAmountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      false // 不向上舍入以便比较
    );

    // 验证：计算出的代币数量应该小于等于原始代币数量
    // (由于流动性取决于两种代币中提供的较少的量)
    expect(new BN(calculatedAmountA).lte(amountA)).toBeTruthy();
    expect(new BN(calculatedAmountB).lte(amountB)).toBeTruthy();

    // 验证：至少有一种代币的计算值应该接近原始值
    const precisionThreshold = 0.0001; // 允许 0.01% 误差

    const amountADiff = Math.abs(1 - Number(calculatedAmountA.toString()) / Number(amountA.toString()));

    const amountBDiff = Math.abs(1 - Number(calculatedAmountB.toString()) / Number(amountB.toString()));

    expect(amountADiff < precisionThreshold || amountBDiff < precisionThreshold).toBeTruthy();
  });

  test('getAmountBFromAmountA 与 getAmountAFromAmountB 的一致性测试', () => {
    const startPirce = '1';
    const currentPrice = '2';
    const endPrice = '3';

    const decimalsA = 6;
    const decimalsB = 6;

    // 设置测试参数
    const startSqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(new Decimal(startPirce), decimalsA, decimalsB);
    const currentSqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(new Decimal(currentPrice), decimalsA, decimalsB);
    const endSqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(new Decimal(endPrice), decimalsA, decimalsB);
    const initialAmountA = new BN('1000000');

    // 1. A -> B
    const calculatedAmountB = LiquidityMath.getAmountBFromAmountA(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      initialAmountA
    );

    // 2. B -> A
    const calculatedAmountA = LiquidityMath.getAmountAFromAmountB(
      startSqrtPriceX64,
      endSqrtPriceX64,
      currentSqrtPriceX64,
      calculatedAmountB
    );

    // 验证：计算回去的 A 数量应该接近原始值
    // 由于舍入误差，可能不完全相等，所以使用相对误差
    const relativeError =
      Math.abs(Number(initialAmountA.toString()) - Number(calculatedAmountA.toString())) /
      Number(initialAmountA.toString());

    expect(relativeError).toBeLessThan(0.0001); // 允许 0.01% 误差
  });
});

describe('LiquidityMath 边界和特殊情况测试', () => {
  test('零输入测试', () => {
    const sqrtPriceX64A = new BN('100000');
    const sqrtPriceCurrentX64 = new BN('200000');
    const sqrtPriceX64B = new BN('300000');

    // 零流动性
    const zeroLiquidity = new BN(0);
    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      zeroLiquidity,
      true
    );

    expect(amountA.toString()).toBe('0');
    expect(amountB.toString()).toBe('0');

    // 零代币数量
    const zeroAmount = new BN(0);
    const amountAResult = LiquidityMath.getAmountAFromAmountB(
      sqrtPriceX64A,
      sqrtPriceX64B,
      sqrtPriceCurrentX64,
      zeroAmount
    );

    const amountBResult = LiquidityMath.getAmountBFromAmountA(
      sqrtPriceX64A,
      sqrtPriceX64B,
      sqrtPriceCurrentX64,
      zeroAmount
    );

    expect(amountAResult.toString()).toBe('0');
    expect(amountBResult.toString()).toBe('0');
  });

  test('极端流动性值测试', () => {
    const sqrtPriceX64A = new BN('100000');
    const sqrtPriceCurrentX64 = new BN('200000');
    const sqrtPriceX64B = new BN('300000');

    // 非常大的流动性值
    const largeLiquidity = new BN('340282366920938463463374607431768211455'); // MaxUint128 - 1

    // 这个测试主要是确保不会抛出异常或产生溢出
    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      largeLiquidity,
      true
    );

    expect(amountA.toString()).not.toBe('NaN');
    expect(amountB.toString()).not.toBe('NaN');
  });

  test('相等价格点测试', () => {
    // 测试 sqrtPriceX64A = sqrtPriceX64B 的情况
    const sqrtPriceX64 = new BN('200000');
    const sqrtPriceCurrentX64 = new BN('150000');
    const liquidity = new BN('10000000');

    // 调用时价格相等
    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64,
      sqrtPriceX64,
      liquidity,
      true
    );

    // 预期为零或极小值
    expect(amountA.toString()).toBe('0');
    expect(amountB.toString()).toBe('0');
  });

  test('价格点接近现价测试', () => {
    // 测试 current ≈ A 或 current ≈ B 的情况
    const sqrtPriceX64A = new BN('200000');
    const sqrtPriceCurrentX64 = new BN('200001'); // 非常接近 A
    const sqrtPriceX64B = new BN('300000');
    const liquidity = new BN('10000000');

    // 调用函数
    const result = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      true
    );

    // 验证结果
    expect(result.amountA.toString()).not.toBe('NaN');
    expect(result.amountB.toString()).not.toBe('NaN');
  });
});

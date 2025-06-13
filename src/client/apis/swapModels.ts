/**
 * Swap request interface, used to handle token swaps
 *
 * @property {string} inputMint - Input token contract address
 * @property {string} outputMint - Output token contract address
 * @property {string} amount - Swap amount, unit is Lamport
 * @property {('in'|'out')} swapMode - Swap mode, 'in' means fixed input amount, 'out' means fixed output amount
 * @property {string} slippageBps - Slippage tolerance, in basis points (1 basis point = 0.01%)
 * @property {string} computeUnitPriceMicroLamports - Compute unit price, unit is microLamport
 * @property {string} [quoteOnly] - Whether to only get quotes without executing transactions
 * @property {string} [userPublicKey] - User wallet address
 */
export interface ISwapRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  swapMode: 'in' | 'out';
  slippageBps: string;
  computeUnitPriceMicroLamports: string;
  quoteOnly?: string;
  userPublicKey?: string;
}

/**
 * 交换响应接口，包含交换结果信息
 *
 * @property {string} [transaction] - 构建后的交易编码
 * @property {string} inputMint - 输入代币合约地址
 * @property {string} outputMint - 输出代币合约地址
 * @property {string} outMount - 输出数量
 * @property {string} otherAmountThreshold - 最少收到数量
 * @property {number} priceImpactPct - 价格影响百分比
 * @property {string} inMount - 输入数量
 */
export interface ISwapResponse {
  transaction?: string;
  inputMint: string;
  outputMint: string;
  outMount: string;
  otherAmountThreshold: string;
  priceImpactPct: number;
  inMount: string;
}

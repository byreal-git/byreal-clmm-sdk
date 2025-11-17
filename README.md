# Byreal CLMM SDK

Solana concentrated liquidity market maker SDK for Byreal protocol.

## Installation

```bash
npm install @byreal/clmm-sdk
# or
yarn add @byreal/clmm-sdk
# or
pnpm add @byreal/clmm-sdk
```

## Quick Start

### Initialize SDK

```typescript
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Chain, BYREAL_CLMM_PROGRAM_ID } from '@byreal/clmm-sdk';

// Setup connection
const connection = new Connection('https://api.mainnet-beta.solana.com');
const wallet = Keypair.fromSecretKey(/* your secret key */);

// Initialize Chain instance
const chain = new Chain({
  connection,
  programId: BYREAL_CLMM_PROGRAM_ID,
});

// Signer callback for transactions
const signerCallback = async (tx) => {
  tx.sign([wallet]);
  return tx;
};
```

## Core Features

### 1. Get Position Info

Query user positions and view liquidity details.

```typescript
import { PublicKey } from '@solana/web3.js';

// Get all positions for a user
const userAddress = new PublicKey('your-wallet-address');
const positionList = await chain.getRawPositionInfoListByUserAddress(userAddress);

// Get detailed info for specific position
const nftMints = positionList.map((position) => position.nftMint);

for (const nftMint of nftMints) {
  const positionInfo = await chain.getPositionInfoByNftMint(nftMint);

  if (!positionInfo) continue;

  const { uiPriceLower, uiPriceUpper, tokenA, tokenB } = positionInfo;

  console.log(`NFT: ${nftMint.toBase58()}`);
  console.log(`Price Range: ${uiPriceLower} - ${uiPriceUpper}`);
  console.log(`TokenA Amount: ${tokenA.uiAmount}`);
  console.log(`TokenA Fees: ${tokenA.uiFeeAmount}`);
  console.log(`TokenB Amount: ${tokenB.uiAmount}`);
  console.log(`TokenB Fees: ${tokenB.uiFeeAmount}`);
}
```

### 2. Create Position

Create a new liquidity position within a specific price range.

```typescript
import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { TickMath } from '@byreal/clmm-sdk';

// Step 1: Get pool info
const poolId = new PublicKey('your-pool-address');
const poolInfo = await chain.getRawPoolInfoByPoolId(poolId);

// Step 2: Define price range and align to ticks
const userStartPrice = '0.998';
const userEndPrice = '1.002';

const priceInTickLower = TickMath.getTickAlignedPriceDetails(
  new Decimal(userStartPrice),
  poolInfo.tickSpacing,
  poolInfo.mintDecimalsA,
  poolInfo.mintDecimalsB
);

const priceInTickUpper = TickMath.getTickAlignedPriceDetails(
  new Decimal(userEndPrice),
  poolInfo.tickSpacing,
  poolInfo.mintDecimalsA,
  poolInfo.mintDecimalsB
);

// Step 3: Calculate required amounts
const base = 'MintA'; // Which token to use as base
const baseAmount = new BN(2 * 10 ** poolInfo.mintDecimalsA);

// Calculate the amount of TokenB needed
const amountB = chain.getAmountBFromAmountA({
  priceLower: priceInTickLower.price,
  priceUpper: priceInTickUpper.price,
  amountA: baseAmount,
  poolInfo,
});

// Add 2% slippage
const amountBWithSlippage = new BN(amountB).mul(new BN(10000 * (1 + 0.02))).div(new BN(10000));

// Step 4: Create position
const txid = await chain.createPosition({
  userAddress,
  poolInfo,
  tickLower: priceInTickLower.tick,
  tickUpper: priceInTickUpper.tick,
  base,
  baseAmount,
  otherAmountMax: amountBWithSlippage,
  signerCallback,
});

console.log('Position created:', txid);
```

### 3. Remove Liquidity

Remove all liquidity and close the position.

```typescript
import { PublicKey } from '@solana/web3.js';

const nftMint = new PublicKey('your-position-nft-mint');

const txid = await chain.decreaseFullLiquidity({
  userAddress,
  nftMint,
  signerCallback,
});

console.log('Liquidity removed:', txid);
```

### 4. Collect Fees

Collect accumulated fees from a position.

```typescript
import { PublicKey } from '@solana/web3.js';

const nftMint = new PublicKey('your-position-nft-mint');

const txid = await chain.collectFees({
  userAddress,
  nftMint,
  signerCallback,
});

console.log('Fees collected:', txid);
```

### 5. Swap Tokens

Swap tokens using the concentrated liquidity pool.

#### Exact Input Swap

Specify input amount, get estimated output.

```typescript
import BN from 'bn.js';

// Get pool info
const poolInfo = await chain.getRawPoolInfoByPoolId(poolId);

// Define input amount
const amountIn = new BN(1 * 10 ** poolInfo.mintDecimalsA);

// Step 1: Get quote
const quoteReturn = await chain.qouteSwap({
  poolInfo,
  slippage: 0.01, // 1% slippage
  inputTokenMint: poolInfo.mintA, // Swap from TokenA
  amountIn,
});

console.log('Expected output:', quoteReturn.expectedAmountOut.toString());
console.log('Min output:', quoteReturn.minAmountOut.toString());
console.log('Execution price:', quoteReturn.executionPrice.toString());
console.log('Fee:', quoteReturn.feeAmount.toString());

// Step 2: Execute swap
const txid = await chain.swap({
  poolInfo,
  quoteReturn,
  userAddress,
  signerCallback,
});

console.log('Swap executed:', txid);
```

#### Exact Output Swap

Specify desired output amount, get required input.

```typescript
import BN from 'bn.js';

const poolInfo = await chain.getRawPoolInfoByPoolId(poolId);
const amountOut = new BN(1 * 10 ** poolInfo.mintDecimalsB);

// Get quote for exact output
const quoteReturn = await chain.quoteSwapExactOut({
  poolInfo,
  slippage: 0.01,
  outputTokenMint: poolInfo.mintB, // Want to receive TokenB
  amountOut,
});

console.log('Expected input:', quoteReturn.expectedAmountIn.toString());
console.log('Max input:', quoteReturn.maxAmountIn.toString());

// Execute swap
const txid = await chain.swapExactOut({
  poolInfo,
  quoteReturn,
  userAddress,
  signerCallback,
});

console.log('Swap executed:', txid);
```

## Utility Functions

### Price and Tick Conversions

```typescript
import { TickMath, SqrtPriceMath } from '@byreal/clmm-sdk';
import { Decimal } from 'decimal.js';

// Align price to valid tick
const priceDetails = TickMath.getTickAlignedPriceDetails(new Decimal('1.0025'), tickSpacing, decimalsA, decimalsB);
// Returns: { tick, price, sqrtPriceX64 }

// Tick to price
const price = TickMath.getPriceFromTick(tick, decimalsA, decimalsB);

// Price to tick
const tick = SqrtPriceMath.getTickFromPrice(price, decimalsA, decimalsB);

// Get position PDA from NFT mint
import { getPdaPersonalPositionAddress } from '@byreal/clmm-sdk';

const { publicKey: positionPda } = getPdaPersonalPositionAddress(programId, nftMint);
```

## Type Definitions

### SignerCallback

Transaction signing callback for wallet integration.

```typescript
import { Transaction } from '@solana/web3.js';

type SignerCallback = (tx: Transaction) => Promise<Transaction>;
```

### Common Types

```typescript
// Position info with UI-friendly values
interface PositionInfo {
  nftMint: PublicKey;
  poolId: PublicKey;
  uiPriceLower: string; // Human-readable lower price
  uiPriceUpper: string; // Human-readable upper price
  tokenA: {
    address: PublicKey;
    uiAmount: string; // Current liquidity amount
    uiFeeAmount: string; // Accumulated fees
    decimals: number;
  };
  tokenB: {
    address: PublicKey;
    uiAmount: string;
    uiFeeAmount: string;
    decimals: number;
  };
}

// Swap quote result
interface SwapQuoteReturn {
  allTrade: boolean; // Whether full amount can be traded
  expectedAmountOut: BN; // Expected output amount
  minAmountOut: BN; // Min output with slippage
  amountIn: BN; // Input amount
  feeAmount: BN; // Swap fee
  executionPrice: Decimal; // Actual execution price
  remainingAccounts: PublicKey[]; // Required tick array accounts
}
```

## Examples

More examples are available in the [playgrounds](./src/playgrounds) directory:

- Position management: `07_create_position_*.ts`, `15_add_liquidity.ts`
- Liquidity removal: `08_decrease_liquidity.ts`, `13_decrease_full_liquidity.ts`
- Fee collection: `14_collect_fees.ts`, `17_collect_all_fees.ts`
- Swapping: `21_swap_a_to_b.ts`, `22_swap_b_to_a.ts`
- APR calculations: `18_calculate_apr*.ts`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run playground examples
bun run src/playgrounds/03_get_raw_pool_info.ts
```

## License

MIT

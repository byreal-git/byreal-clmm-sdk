# byreal-clmm-sdk

## Install

```bash
yarn
```

## Running Playground Code

```bash
bun run src/playgrounds/xxxx.ts
```

Tips: When running examples in playgrounds, you need to set the private key in .env

## Running Unit Tests

```bash
yarn vitest
```

## Build

<!-- TODO: -->

Run `pnpm nx build clmm-sdk` to build the library.

## Utility functions

```ts
// price -> tick
SqrtPriceMath.getTickFromPrice;
// tick -> sqrtPriceX64
SqrtPriceMath.getSqrtPriceX64FromTick;
// sqrtPriceX64 -> price
SqrtPriceMath.sqrtPriceX64ToPrice;

// price -> sqrtPriceX64
SqrtPriceMath.priceToSqrtPriceX64;

// sqrtPriceX64 -> tick
SqrtPriceMath.getTickFromSqrtPriceX64;

// price -> tick
SqrtPriceMath.getTickFromPrice;

// tick -> price
TickMath.getPriceFromTick;

// price -> tick
// price -> sqrtPriceX64
// price -> roundedPrice
TickMath.getTickAlignedPriceDetails;

// Calculate the position address from the nft address
getPdaPersonalPositionAddress;
```

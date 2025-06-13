import { PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';

// Number of price points contained in each tick array
export const TICK_ARRAY_SIZE = 60;
// Size of tick array bitmap, used to track which tick arrays have been initialized
export const TICK_ARRAY_BITMAP_SIZE = 512;
// Size of extended tick array bitmap, used to handle additional liquidity ranges
export const EXTENSION_TICKARRAY_BITMAP_SIZE = 14;

export const U64_IGNORE_RANGE = new BN('18446744073700000000');

export const RAYDIUM_CLMM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');
export const BYREAL_CLMM_PROGRAM_ID = new PublicKey('45iBNkaENereLKMjLm2LHkF3hpDapf6mnvrM5HWFg9cY');
export const CLMM_PROGRAM_ID = BYREAL_CLMM_PROGRAM_ID;

export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export const RENT_PROGRAM_ID = new PublicKey('SysvarRent111111111111111111111111111111111');
export const CLOCK_PROGRAM_ID = new PublicKey('SysvarC1ock11111111111111111111111111111111');
export const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const INSTRUCTION_PROGRAM_ID = new PublicKey('Sysvar1nstructions1111111111111111111111111');
export const WSOLMint = new PublicKey('So11111111111111111111111111111111111111112');
export const SOLMint = PublicKey.default;
export const SYSTEM_PROGRAM_ID = SystemProgram.programId;

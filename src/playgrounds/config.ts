import path from 'path';

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { SignerCallback } from '../client/chain/models.js';
import { Chain } from '../client/index.js';
import { BYREAL_CLMM_PROGRAM_ID } from '../constants.js';

const endpoint = process.env.SOL_ENDPOINT || clusterApiUrl('mainnet-beta');
const secretKey = process.env.SOL_SECRET_KEY;

if (!secretKey) {
  throw new Error('Please set your SOL_SECRET_KEY in .env');
}

export const connection = new Connection(endpoint);

export const userKeypair = Keypair.fromSecretKey(bs58.decode(secretKey));

export const userAddress = userKeypair.publicKey;

export const chain = new Chain({ connection, programId: BYREAL_CLMM_PROGRAM_ID });

export const signerCallback: SignerCallback = async (tx) => {
  tx.sign([userKeypair]);
  return tx;
};

export const TokenAddress = {
  RAY: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
  JUP: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
  SOL: new PublicKey('So11111111111111111111111111111111111111112'),
};

export const PoolAddress = {
  RAY_USDC: new PublicKey('61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'),
  SOL_USDC: new PublicKey('CYbD9RaToYMtWKA7QZyoLahnHdWq553Vm62Lh6qWtuxq'),
};

// 下面是 byreal 的测试池子和 pool 地址

export const ByrealTokenAddress = {
  TOKEN_A: new PublicKey('9ezwkJ6ERnBthk5AexoWyqLUjtJBHrJE7hbZWsFz1Dmz'),
  TOKEN_B: new PublicKey('FU1f1YnJLuVCHZbAgE2sANU7W9BSzZoqvAFk7GH5n234'),
  TOKEN_C: new PublicKey('iZj2e1RccnTbnAvUCTF31Fx65kP9et6AGuvFMpf3Sm8'),
  TOKEN_MOCK_USDC: new PublicKey('4b26bccjnhv892cVQ5gDnevoBRtUwSe2DnA3Zxm5XRTh'),
  TOKEN_MOCK_USDT: new PublicKey('teAbcuupxNFRQT6aAi1yTT2rmEZHgGmidxM1EtbzS9X'),
  TOKEN_wsolc: new PublicKey('teAbcuupxNFRQT6aAi1yTT2rmEZHgGmidxM1EtbzS9X'),
  TOKEN_bbsolC: new PublicKey('4b26bccjnhv892cVQ5gDnevoBRtUwSe2DnA3Zxm5XRTh'),
};

export const ByrealPoolAddress = {
  POOL_A_B: new PublicKey('3nCxWyprG6HbmXhnWd698DHVLLeTS95DzA3nBQkdQyVx'),
  POOL_B_C: new PublicKey('GuRi1woU7WXjZ9ZGZtcbAW7ZnGW9KE3RfMpwqtYyYNQt'),
  POOL_MOCK_USDC_USDT: new PublicKey('Hsrt63N85oXSWtAG5eg3W4zaBveubPpQknqGHvERsEjf'),
  POOL_wsolc_bbsolC: new PublicKey('Hsrt63N85oXSWtAG5eg3W4zaBveubPpQknqGHvERsEjf'),
};

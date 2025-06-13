import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMint,
  AccountLayout,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

import { isToken2022 } from '../utils/token.js';

export class Token {
  private readonly _connection: Connection;

  constructor(connection: Connection) {
    this._connection = connection;
  }

  async isToken2022(mintAddress: string) {
    return isToken2022(mintAddress, this._connection);
  }

  /**
   * Detect token type and get balance
   * @param walletAddress Wallet address
   * @param tokenMintAddress Token Mint address
   * @returns Promise object containing balance and whether it is Token-2022
   */
  async detectTokenTypeAndGetBalance(
    walletAddress: string,
    tokenMintAddress: string
  ): Promise<{ balance: number; isToken2022: boolean }> {
    const walletPublicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(tokenMintAddress);

    // Compatible with native SOL
    if (tokenMintAddress === 'So11111111111111111111111111111111111111112') {
      const accountInfo = await this._connection.getAccountInfo(walletPublicKey);
      if (accountInfo) {
        const balance = Number(accountInfo.lamports) / Math.pow(10, 9); // SOL精度固定9位
        return { balance, isToken2022: false };
      }
      return { balance: 0, isToken2022: false };
    }

    // First try to query as Token-2022
    try {
      const mint = await getMint(this._connection, mintPublicKey, 'confirmed', TOKEN_2022_PROGRAM_ID);
      const tokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const accountInfo = await this._connection.getAccountInfo(tokenAccount);
      if (accountInfo) {
        // Parse account data to get balance
        const data = AccountLayout.decode(accountInfo.data);
        const balance = Number(data.amount) / Math.pow(10, mint.decimals);
        return { balance, isToken2022: true };
      }
    } catch (error) {
      // If it is not Token-2022, try to query as a standard SPL Token
      console.log('Not a Token-2022, trying standard SPL Token...');
    }

    // Try to query as a standard SPL Token
    try {
      const mint = await getMint(this._connection, mintPublicKey, 'confirmed', TOKEN_PROGRAM_ID);
      const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, walletPublicKey, false, TOKEN_PROGRAM_ID);

      const accountInfo = await this._connection.getAccountInfo(tokenAccount);
      if (accountInfo) {
        const data = AccountLayout.decode(accountInfo.data);
        const balance = Number(data.amount) / Math.pow(10, mint.decimals);
        return { balance, isToken2022: false };
      }
    } catch (error) {
      console.error('Error detecting token type:', error);
    }

    return { balance: 0, isToken2022: false };
  }

  /**
   * Batch detect token type and get balance
   * @param walletAddress Wallet address
   * @param tokenMintAddresses Token Mint address array
   * @returns Promise<{ tokenMintAddress: string; balance: number; isToken2022: boolean }[]>
   */
  async batchDetectTokenTypeAndGetBalance(
    walletAddress: string,
    tokenMintAddresses: string[]
  ): Promise<{ tokenMintAddress: string; balance: number; isToken2022: boolean }[]> {
    // Concurrent processing of all tokens
    const results = await Promise.all(
      tokenMintAddresses.map(async (tokenMintAddress) => {
        const res = await this.detectTokenTypeAndGetBalance(walletAddress, tokenMintAddress);
        return { tokenMintAddress, ...res };
      })
    );
    return results;
  }
}

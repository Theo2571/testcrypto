import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  coingeckoId?: string;
}

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: any[];
}

export interface SwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

export class JupiterAPI {
  private baseUrl = 'https://quote-api.jup.ag/v6';
  
  constructor(private connection: Connection) {}

  /**
   * Fetch list of all tokens supported by Jupiter
   */
  async getTokenList(): Promise<JupiterToken[]> {
    try {
      const response = await fetch('https://token.jup.ag/all');
      if (!response.ok) {
        throw new Error('Failed to fetch token list');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Jupiter token list:', error);
      throw error;
    }
  }

  /**
   * Get a swap quote from Jupiter
   */
  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: string;
    slippageBps?: number;
    onlyDirectRoutes?: boolean;
    asLegacyTransaction?: boolean;
  }): Promise<JupiterQuote> {
    try {
      const searchParams = new URLSearchParams({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: (params.slippageBps || 50).toString(),
        onlyDirectRoutes: (params.onlyDirectRoutes || false).toString(),
        asLegacyTransaction: (params.asLegacyTransaction || false).toString(),
      });

      const response = await fetch(`${this.baseUrl}/quote?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Jupiter quote:', error);
      throw error;
    }
  }

  /**
   * Get the swap transaction from Jupiter
   */
  async getSwapTransaction(params: {
    quoteResponse: JupiterQuote;
    userPublicKey: string;
    wrapAndUnwrapSol?: boolean;
    prioritizationFeeLamports?: number;
    asLegacyTransaction?: boolean;
    dynamicComputeUnitLimit?: boolean;
  }): Promise<SwapTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: params.quoteResponse,
          userPublicKey: params.userPublicKey,
          wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
          prioritizationFeeLamports: params.prioritizationFeeLamports || 'auto',
          asLegacyTransaction: params.asLegacyTransaction ?? false,
          dynamicComputeUnitLimit: params.dynamicComputeUnitLimit ?? true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get swap transaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      throw error;
    }
  }

  /**
   * Deserialize and return the swap transaction
   */
  deserializeTransaction(swapTransactionBase64: string): Transaction | VersionedTransaction {
    const transactionBuf = new Uint8Array(Buffer.from(swapTransactionBase64, 'base64'));
    
    try {
      // Try to deserialize as versioned transaction first
      return VersionedTransaction.deserialize(transactionBuf);
    } catch {
      // Fall back to legacy transaction
      return Transaction.from(transactionBuf);
    }
  }

  /**
   * Get token account info
   */
  async getTokenAccountInfo(walletAddress: string, mintAddress: string): Promise<any> {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get token accounts for the wallet
      const response = await this.connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { mint: mintPublicKey }
      );
      
      if (response.value.length === 0) {
        return null;
      }
      
      return response.value[0].account.data.parsed.info;
    } catch (error) {
      console.error('Error getting token account info:', error);
      throw error;
    }
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSolBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      throw error;
    }
  }
}

// Common token addresses on Solana mainnet
export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
}; 
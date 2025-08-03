import { 
  Connection, 
  PublicKey, 
  Transaction,
} from '@solana/web3.js';
import { 
  TokenBalance, 
  TokenInfo, 
  TokenTransferParams,
  TransactionResult 
} from './types';
import { SolanaWalletManager } from './wallet';

export class SolanaTokenManager {
  private walletManager: SolanaWalletManager;
  private connection: Connection;

  constructor(walletManager: SolanaWalletManager) {
    this.walletManager = walletManager;
    this.connection = walletManager.getConnection();
  }

  /**
   * Get all token balances for the connected wallet
   */
  async getTokenBalances(): Promise<TokenBalance[]> {
    const walletState = this.walletManager.getState();
    
    if (!walletState.connected || !walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // For demo purposes, return mock token balances
      // In a real implementation, you would fetch from the RPC using getTokenAccountsByOwner
      return this.generateMockTokenBalances();
      
    } catch (error) {
      console.error('Error fetching token balances:', error);
      throw error;
    }
  }

  /**
   * Get balance for a specific token
   */
  async getTokenBalance(mint: string): Promise<TokenBalance | null> {
    const balances = await this.getTokenBalances();
    return balances.find(balance => balance.mint === mint) || null;
  }

  /**
   * Transfer tokens to another address
   */
  async transferToken(params: TokenTransferParams): Promise<TransactionResult> {
    const walletState = this.walletManager.getState();
    
    if (!walletState.connected || !walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const mintPubkey = new PublicKey(params.mint);
      const recipientPubkey = new PublicKey(params.recipientAddress);
      const senderPubkey = walletState.publicKey;

      // For demo purposes, simulate a successful token transfer
      // In a real implementation, you would:
      // 1. Find or create associated token accounts
      // 2. Create transfer instruction
      // 3. Sign and send transaction
      
      const signature = this.generateMockSignature();

      return {
        signature,
        success: true
      };

    } catch (error) {
      console.error('Token transfer failed:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get token information by mint address
   */
  async getTokenInfo(mint: string): Promise<TokenInfo | null> {
    try {
      // For demo purposes, return mock token info
      // In a real implementation, you would fetch from a token registry or RPC
      const mockTokens = this.getMockTokenRegistry();
      return mockTokens[mint] || null;
      
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  /**
   * Search for tokens by name or symbol
   */
  async searchTokens(query: string): Promise<TokenInfo[]> {
    try {
      const mockTokens = this.getMockTokenRegistry();
      const allTokens = Object.values(mockTokens);
      
      return allTokens.filter(token => 
        token.name.toLowerCase().includes(query.toLowerCase()) ||
        token.symbol.toLowerCase().includes(query.toLowerCase())
      );
      
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  }

  /**
   * Get popular/trending tokens
   */
  async getPopularTokens(): Promise<TokenInfo[]> {
    try {
      const mockTokens = this.getMockTokenRegistry();
      // Return first 10 tokens as "popular"
      return Object.values(mockTokens).slice(0, 10);
      
    } catch (error) {
      console.error('Error fetching popular tokens:', error);
      return [];
    }
  }

  /**
   * Create associated token account for a mint
   */
  async createTokenAccount(mint: string): Promise<TransactionResult> {
    const walletState = this.walletManager.getState();
    
    if (!walletState.connected || !walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // For demo purposes, simulate successful account creation
      const signature = this.generateMockSignature();

      return {
        signature,
        success: true
      };

    } catch (error) {
      console.error('Token account creation failed:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate mock token balances for demo purposes
   */
  private generateMockTokenBalances(): TokenBalance[] {
    const mockTokens = this.getMockTokenRegistry();
    const tokenMints = Object.keys(mockTokens);
    const balances: TokenBalance[] = [];

    // Add some random balances for demo
    for (let i = 0; i < Math.min(5, tokenMints.length); i++) {
      const mint = tokenMints[i];
      const tokenInfo = mockTokens[mint];
      const amount = Math.floor(Math.random() * 1000000);
      
      balances.push({
        mint,
        amount: amount.toString(),
        decimals: tokenInfo.decimals,
        uiAmount: amount / Math.pow(10, tokenInfo.decimals),
        tokenInfo
      });
    }

    return balances;
  }

  /**
   * Mock token registry for demo purposes
   */
  private getMockTokenRegistry(): Record<string, TokenInfo> {
    return {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
      },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
      },
      'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': {
        mint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
        name: 'Serum',
        symbol: 'SRM',
        decimals: 6,
        logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png'
      },
      'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': {
        mint: 'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a',
        name: 'Rollbit Coin',
        symbol: 'RLB',
        decimals: 6,
        logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a/logo.png'
      },
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
        mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        name: 'Marinade staked SOL',
        symbol: 'mSOL',
        decimals: 9,
        logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png'
      }
    };
  }

  /**
   * Generate a mock transaction signature for demo purposes
   */
  private generateMockSignature(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
} 
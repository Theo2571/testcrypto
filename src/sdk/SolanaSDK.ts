import { SolanaSDKConfig } from './types';
import { SolanaWalletManager } from './wallet';
import { SolanaTransactionManager } from './transaction';
import { SolanaTokenManager } from './token';

/**
 * Main Solana SDK class that provides a unified interface
 * for wallet management, transactions, and token operations
 */
export class SolanaSDK {
  public wallet: SolanaWalletManager;
  public transaction: SolanaTransactionManager;
  public token: SolanaTokenManager;
  private config: SolanaSDKConfig;

  constructor(config: SolanaSDKConfig) {
    this.config = config;
    
    // Initialize managers
    this.wallet = new SolanaWalletManager(config);
    this.transaction = new SolanaTransactionManager(this.wallet);
    this.token = new SolanaTokenManager(this.wallet);
  }

  /**
   * Get current SDK configuration
   */
  getConfig(): SolanaSDKConfig {
    return { ...this.config };
  }

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<SolanaSDKConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize managers with new config
    this.wallet = new SolanaWalletManager(this.config);
    this.transaction = new SolanaTransactionManager(this.wallet);
    this.token = new SolanaTokenManager(this.wallet);
  }

  /**
   * Initialize the SDK and connect to wallet if auto-connect is enabled
   */
  async initialize(autoConnect = false): Promise<void> {
    try {
      if (autoConnect) {
        await this.wallet.connectWallet('demo');
      }
    } catch (error) {
      console.error('SDK initialization failed:', error);
      throw error;
    }
  }

  /**
   * Clean up resources when done
   */
  destroy(): void {
    // Clean up any listeners or resources
    // The individual managers will handle their own cleanup
  }
}

/**
 * Factory function to create a new SDK instance
 */
export function createSolanaSDK(config: SolanaSDKConfig): SolanaSDK {
  return new SolanaSDK(config);
}

/**
 * Default configuration for development
 */
export const defaultConfig: SolanaSDKConfig = {
  network: 'devnet',
  commitment: 'confirmed'
}; 
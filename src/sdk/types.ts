import { PublicKey, Transaction, Connection } from '@solana/web3.js';

// Wallet Types
export interface WalletInfo {
  name: string;
  type: 'phantom' | 'solflare' | 'demo' | 'custom';
}

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  wallet: WalletInfo | null;
}

export interface WalletAdapter {
  name: string;
  icon: string;
  url: string;
  connected: boolean;
  publicKey: PublicKey | null;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
}

// Transaction Types
export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface SendTransactionParams {
  recipientAddress: string;
  amount: number; // in lamports
  memo?: string;
}

// Token Types
export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri?: string;
}

export interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  tokenInfo?: TokenInfo;
}

export interface TokenTransferParams {
  recipientAddress: string;
  amount: number;
  mint: string;
  decimals: number;
}

// SDK Configuration
export interface SolanaSDKConfig {
  network: 'mainnet-beta' | 'testnet' | 'devnet';
  rpcEndpoint?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

// Network Types
export interface NetworkInfo {
  name: string;
  rpcUrl: string;
  chainId: string;
}

// Transaction History
export interface TransactionHistoryItem {
  signature: string;
  slot: number;
  blockTime: number | null;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  err: any;
  memo?: string;
} 
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NetworkInfo } from './types';

// Network configurations
export const NETWORKS: Record<string, NetworkInfo> = {
  'mainnet-beta': {
    name: 'Mainnet Beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    chainId: 'mainnet-beta'
  },
  'testnet': {
    name: 'Testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    chainId: 'testnet'
  },
  'devnet': {
    name: 'Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    chainId: 'devnet'
  }
};

/**
 * Validates if a string is a valid Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Converts lamports to SOL
 */
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

/**
 * Converts SOL to lamports
 */
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

/**
 * Formats SOL amount for display
 */
export const formatSol = (lamports: number, decimals = 4): string => {
  const sol = lamportsToSol(lamports);
  return sol.toFixed(decimals);
};

/**
 * Formats token amount based on decimals
 */
export const formatTokenAmount = (amount: string, decimals: number, displayDecimals = 4): string => {
  const parsedAmount = parseFloat(amount) / Math.pow(10, decimals);
  return parsedAmount.toFixed(displayDecimals);
};

/**
 * Shortens an address for display purposes
 */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Validates if amount is valid
 */
export const isValidAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

/**
 * Formats timestamp for display
 */
export const formatTimestamp = (timestamp: number | null): string => {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Generates a random transaction ID for demo purposes
 */
export const generateTransactionId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Delays execution for specified milliseconds
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Checks if running in mobile environment
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Gets the explorer URL for a transaction
 */
export const getExplorerUrl = (signature: string, network = 'mainnet-beta'): string => {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}; 
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { 
  TransactionResult, 
  SendTransactionParams, 
  TransactionHistoryItem 
} from './types';
import { SolanaWalletManager } from './wallet';

export class SolanaTransactionManager {
  private walletManager: SolanaWalletManager;
  private connection: Connection;

  constructor(walletManager: SolanaWalletManager) {
    this.walletManager = walletManager;
    this.connection = walletManager.getConnection();
  }

  /**
   * Send SOL to another address
   */
  async sendSol(params: SendTransactionParams): Promise<TransactionResult> {
    const walletState = this.walletManager.getState();
    
    if (!walletState.connected || !walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const recipientPubkey = new PublicKey(params.recipientAddress);
      const senderPubkey = walletState.publicKey;

      // Create transaction
      const transaction = new Transaction();
      
      // Add transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: senderPubkey,
        toPubkey: recipientPubkey,
        lamports: params.amount,
      });
      
      transaction.add(transferInstruction);

      // Add memo if provided
      if (params.memo) {
        const memoInstruction = new TransactionInstruction({
          keys: [{ pubkey: senderPubkey, isSigner: true, isWritable: false }],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(params.memo, 'utf8'),
        });
        transaction.add(memoInstruction);
      }

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPubkey;

      // For demo purposes, we'll simulate a successful transaction
      // In a real implementation, you would sign and send the transaction
      const signature = this.generateMockSignature();

      return {
        signature,
        success: true
      };

    } catch (error) {
      console.error('Transaction failed:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get transaction history for the connected wallet
   */
  async getTransactionHistory(limit = 10): Promise<TransactionHistoryItem[]> {
    const walletState = this.walletManager.getState();
    
    if (!walletState.connected || !walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // For demo purposes, return mock transaction history
      // In a real implementation, you would fetch from the RPC
      return this.generateMockTransactionHistory(limit);
      
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(params: SendTransactionParams): Promise<number> {
    try {
      const recipientPubkey = new PublicKey(params.recipientAddress);
      const walletState = this.walletManager.getState();
      
      if (!walletState.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create a mock transaction to estimate fees
      const transaction = new Transaction();
      
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: walletState.publicKey,
        toPubkey: recipientPubkey,
        lamports: params.amount,
      });
      
      transaction.add(transferInstruction);

      if (params.memo) {
        const memoInstruction = new TransactionInstruction({
          keys: [{ pubkey: walletState.publicKey, isSigner: true, isWritable: false }],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(params.memo, 'utf8'),
        });
        transaction.add(memoInstruction);
      }

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletState.publicKey;

      // Estimate fee
      const fee = await this.connection.getFeeForMessage(transaction.compileMessage());
      return fee.value || 5000; // Default to 5000 lamports if estimation fails

    } catch (error) {
      console.error('Error estimating transaction fee:', error);
      return 5000; // Default fee
    }
  }

  /**
   * Get transaction details by signature
   */
  async getTransactionDetails(signature: string): Promise<any> {
    try {
      const transaction = await this.connection.getTransaction(signature);
      return transaction;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }

  /**
   * Check if transaction is confirmed
   */
  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature);
      return !confirmation.value.err;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }
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

  /**
   * Generate mock transaction history for demo purposes
   */
  private generateMockTransactionHistory(limit: number): TransactionHistoryItem[] {
    const transactions: TransactionHistoryItem[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < limit; i++) {
      transactions.push({
        signature: this.generateMockSignature(),
        slot: 200000000 + i,
        blockTime: now - (i * 3600), // One hour apart
        confirmationStatus: 'finalized',
        err: null,
        memo: i % 3 === 0 ? `Demo transaction ${i + 1}` : undefined
      });
    }

    return transactions;
  }
} 
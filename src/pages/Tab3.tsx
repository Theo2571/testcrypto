import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonToast,
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonButtons,
  IonSkeletonText,
  IonText
} from '@ionic/react';
import {
  refresh,
  send,
  download,
  swapHorizontal,
  close,
  time,
  openOutline,
  copy
} from 'ionicons/icons';
import { useSolana } from '../context/SolanaContext';
import { usePrivyAuth } from '../context/PrivyContext';
import { usePrivySolana } from '../hooks/usePrivySolana';
import { TransactionHistoryItem } from '../sdk/types';
import './Tab3.css';

interface Transaction {
  signature: string;
  type: 'send' | 'receive' | 'swap' | 'unknown';
  amount: number;
  token: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: number;
  from?: string;
  to?: string;
}

const Tab3: React.FC = () => {
  const { sdk, walletState } = useSolana();
  const { authenticated } = usePrivyAuth();
  usePrivySolana();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'send' | 'receive' | 'swap'>('all');

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      signature: '3nF7Q8g9L2mK5H8p9WxYzN6v4R7e1TdS2aB8cE9fG3hI4jK5lM6nO7pQ8rS9tU0vW1xY2z',
      type: 'send',
      amount: -0.5,
      token: 'SOL',
      status: 'confirmed',
      timestamp: Date.now() - 3600000, // 1 hour ago
      to: '7xKXtg2CW3UuvBFbEhC1GZGgCCWjB1Z2N8V9QmRpXzHe'
    },
    {
      signature: '2mE6P7f8K1jH4G5d6CxVyM5u3Q6w0RdQ1zA7bD8eF2gH3iJ4kL5mN6oP7qR8sT9uV0wX1y',
      type: 'receive',
      amount: 1.25,
      token: 'SOL',
      status: 'confirmed',
      timestamp: Date.now() - 7200000, // 2 hours ago
      from: '9yMXsg3DX2VuuBGcFhD2HZHgDDXkC2A3O9W0RnSpYzIf'
    },
    {
      signature: '1lD5O6e7J0iG3F4c5BwUxL4t2P5v9QcP0yZ6aE7dE1fG2hH3jK4lM5nN6pP7qR8sT9uV0w',
      type: 'swap',
      amount: 0,
      token: 'USDC',
      status: 'confirmed',
      timestamp: Date.now() - 14400000, // 4 hours ago
    },
    {
      signature: '0kC4N5d6I9hF2E3b4AvTwK3s1O4u8PbO9xY5aD6cD0eF1gG2hJ3kL4mM5oN6pP7qR8sT9u',
      type: 'send',
      amount: -100,
      token: 'USDC',
      status: 'pending',
      timestamp: Date.now() - 1800000, // 30 minutes ago
      to: '5vJWrg1CW2UtvAEaEhB0FYFgBBWiA0Y1M7V8QlQpWzGd'
    },
    {
      signature: '9jB3M4c5H8gE1D2a3ZuSvJ2r0N3t7OaF8wX4aG5bG9dE0fF1gH2iI3kL4mM5nN6oP7qR8s',
      type: 'receive',
      amount: 2500000,
      token: 'BONK',
      status: 'confirmed',
      timestamp: Date.now() - 86400000, // 1 day ago
      from: '3uHWpf2BV1UssZDaChA9EXEgAAViZ9X0L6U7PlPpVzEe'
    }
  ];

  useEffect(() => {
    if (walletState.connected) {
      loadTransactionHistory();
    } else {
      setTransactions([]);
      setFilteredTransactions([]);
    }
  }, [walletState.connected]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, activeFilter]);

  const loadTransactionHistory = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch actual transaction history
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      showToastMessage('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    if (activeFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(tx => tx.type === activeFilter));
    }
  };

  const handleRefresh = async (event: any) => {
    await loadTransactionHistory();
    event.detail.complete();
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('Copied to clipboard');
    } catch (err) {
      showToastMessage('Failed to copy');
    }
  };

  const openInExplorer = (signature: string) => {
    const explorerUrl = `https://explorer.solana.com/tx/${signature}`;
    window.open(explorerUrl, '_blank');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const formatAmount = (amount: number, token: string) => {
    if (amount === 0) return `Swap ${token}`;
    const sign = amount > 0 ? '+' : '';
    return `${sign}${amount.toLocaleString()} ${token}`;
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return send;
      case 'receive': return download;
      case 'swap': return swapHorizontal;
      default: return time;
    }
  };

  const getAmountClass = (amount: number) => {
    if (amount > 0) return 'positive';
    if (amount < 0) return 'negative';
    return 'neutral';
  };

  const calculateStats = () => {
    const total = transactions.length;
    const confirmed = transactions.filter(tx => tx.status === 'confirmed').length;
    const pending = transactions.filter(tx => tx.status === 'pending').length;
    return { total, confirmed, pending };
  };

  const renderTransactionItem = (transaction: Transaction) => (
    <div
      key={transaction.signature}
      className="transaction-item"
      onClick={() => handleTransactionClick(transaction)}
    >
      <div className={`transaction-icon ${transaction.type}`}>
        <IonIcon icon={getTransactionIcon(transaction.type)} />
      </div>
      
      <div className="transaction-info">
        <h3 className="transaction-type">
          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} {transaction.token}
        </h3>
        <p className="transaction-details">
          {transaction.type === 'send' && transaction.to && `To: ${transaction.to.substring(0, 8)}...`}
          {transaction.type === 'receive' && transaction.from && `From: ${transaction.from.substring(0, 8)}...`}
          {transaction.type === 'swap' && 'Token swap transaction'}
          {transaction.type === 'unknown' && 'Unknown transaction'}
        </p>
      </div>
      
      <div className="transaction-meta">
        <div className={`transaction-amount ${getAmountClass(transaction.amount)}`}>
          {formatAmount(transaction.amount, transaction.token)}
        </div>
        <div className="transaction-time">{formatTime(transaction.timestamp)}</div>
        <span className={`transaction-status ${transaction.status}`}>
          {transaction.status}
        </span>
      </div>
    </div>
  );

  const renderLoadingItems = () => (
    Array.from({ length: 5 }, (_, index) => (
      <div key={index} className="loading-item">
        <IonSkeletonText className="loading-icon" animated />
        <div className="loading-content">
          <IonSkeletonText className="loading-text short" animated />
          <IonSkeletonText className="loading-text long" animated />
        </div>
      </div>
    ))
  );

  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">
        <IonIcon icon={time} />
      </div>
      <h3 className="empty-state-title">No Transactions Found</h3>
      <p className="empty-state-description">
        Your transaction history will appear here once you start using your wallet
      </p>
    </div>
  );

  const stats = calculateStats();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>History</IonTitle>
          <IonButtons slot="end">
            {walletState.connected && (
              <IonButton fill="clear" onClick={loadTransactionHistory} disabled={isLoading}>
                <IonIcon icon={refresh} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="history-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">History</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="history-container">
          {/* Connection Status */}
          {!authenticated && (
            <div className="history-connection-banner">
              <h2>Connect Your Wallet</h2>
              <p>Login to view your transaction history and activity</p>
            </div>
          )}

          {authenticated && !walletState.connected && (
            <div className="history-connection-banner">
              <h2>Wallet Not Connected</h2>
              <p>Connect your wallet to view transaction history</p>
            </div>
          )}

          {/* Transaction History */}
          {authenticated && walletState.connected && (
            <>
              {/* Transaction Stats */}
              <div className="history-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.confirmed}</div>
                    <div className="stat-label">Confirmed</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="filter-tabs">
                <h2 className="filter-tabs-header">Filter Transactions</h2>
                <div className="filter-buttons">
                  {(['all', 'send', 'receive', 'swap'] as const).map((filter) => (
                    <IonButton
                      key={filter}
                      className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </IonButton>
                  ))}
                </div>
              </div>

              {/* Transaction List */}
              <div className="history-list">
                <div className="history-list-header">
                  <h2 className="history-list-title">Recent Activity</h2>
                  <span className="history-count">
                    {filteredTransactions.length} transactions
                  </span>
                </div>

                {isLoading ? (
                  renderLoadingItems()
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map(renderTransactionItem)
                ) : (
                  renderEmptyState()
                )}
              </div>
            </>
          )}
        </div>

        {/* Transaction Details Modal */}
        <IonModal isOpen={showTransactionModal} onDidDismiss={() => setShowTransactionModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Transaction Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowTransactionModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="history-content">
            {selectedTransaction && (
              <div className="transaction-modal-content">
                <div className="transaction-detail-row">
                  <span className="transaction-detail-label">Type</span>
                  <span className="transaction-detail-value">
                    {selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}
                  </span>
                </div>
                
                <div className="transaction-detail-row">
                  <span className="transaction-detail-label">Amount</span>
                  <span className="transaction-detail-value">
                    {formatAmount(selectedTransaction.amount, selectedTransaction.token)}
                  </span>
                </div>
                
                <div className="transaction-detail-row">
                  <span className="transaction-detail-label">Status</span>
                  <span className={`transaction-status ${selectedTransaction.status}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                
                <div className="transaction-detail-row">
                  <span className="transaction-detail-label">Time</span>
                  <span className="transaction-detail-value">
                    {new Date(selectedTransaction.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {selectedTransaction.from && (
                  <div className="transaction-detail-row">
                    <span className="transaction-detail-label">From</span>
                    <span className="transaction-detail-value" onClick={() => copyToClipboard(selectedTransaction.from!)}>
                      {selectedTransaction.from}
                    </span>
                  </div>
                )}
                
                {selectedTransaction.to && (
                  <div className="transaction-detail-row">
                    <span className="transaction-detail-label">To</span>
                    <span className="transaction-detail-value" onClick={() => copyToClipboard(selectedTransaction.to!)}>
                      {selectedTransaction.to}
                    </span>
                  </div>
                )}
                
                <div className="transaction-detail-row">
                  <span className="transaction-detail-label">Signature</span>
                  <span className="transaction-detail-value">
                    <a 
                      href="#" 
                      className="signature-link"
                      onClick={(e) => {
                        e.preventDefault();
                        openInExplorer(selectedTransaction.signature);
                      }}
                    >
                      View on Explorer
                    </a>
                  </span>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => copyToClipboard(selectedTransaction.signature)}
                  >
                    <IonIcon icon={copy} slot="start" />
                    Copy Signature
                  </IonButton>
                  <IonButton
                    expand="block"
                    onClick={() => openInExplorer(selectedTransaction.signature)}
                  >
                    <IonIcon icon={openOutline} slot="start" />
                    View Explorer
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        <IonLoading isOpen={isLoading} message="Loading transactions..." />
      </IonContent>
    </IonPage>
  );
};

export default Tab3;

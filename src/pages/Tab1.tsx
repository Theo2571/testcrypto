import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonLabel,
  IonInput,
  IonToast,
  IonLoading,
  IonChip,
  IonModal,
  IonButtons,
  IonAlert,
  IonItem,
  IonSpinner,
  IonText
} from '@ionic/react';
import {
  wallet,
  send,
  copy,
  refresh,
  close,
  swapHorizontal,
  mail,
  person,
  logOut
} from 'ionicons/icons';
import { useSolana } from '../context/SolanaContext';
import { usePrivyAuth } from '../context/PrivyContext';
import { usePrivySolana } from '../hooks/usePrivySolana';
import { formatSol, shortenAddress } from '../sdk/utils';
import './Tab1.css';

const Tab1: React.FC = () => {
  const {
    sdk,
    walletState,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useSolana();

  const { login, logout, authenticated, user, ready } = usePrivyAuth();
  usePrivySolana();

  const [balance, setBalance] = useState<number>(0);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (walletState.connected) {
      fetchBalance();
    } else {
      setBalance(0);
    }
  }, [walletState.connected]);

  const fetchBalance = async () => {
    try {
      const balanceInLamports = await sdk.wallet.getBalance();
      setBalance(balanceInLamports);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      showToastMessage('Failed to fetch balance');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  const handleCopyAddress = async () => {
    if (walletState.publicKey) {
      try {
        await navigator.clipboard.writeText(walletState.publicKey.toString());
        setCopied(true);
        showToastMessage('Address copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        showToastMessage('Failed to copy address');
      }
    }
  };

  const handleSendTransaction = async () => {
    if (!sendAddress || !sendAmount) {
      showToastMessage('Please fill in all required fields');
      return;
    }

    try {
      const amountInLamports = parseFloat(sendAmount) * 1000000000;

      const result = await sdk.transaction.sendSol({
        recipientAddress: sendAddress,
        amount: amountInLamports,
        memo: sendMemo || undefined
      });

      if (result.success) {
        showToastMessage(`Transaction sent! ${result.signature.substring(0, 8)}...`);
        setShowSendModal(false);
        setSendAddress('');
        setSendAmount('');
        setSendMemo('');
        await fetchBalance();
      } else {
        showToastMessage(`Transaction failed: ${result.error}`);
      }
    } catch (err) {
      showToastMessage('Transaction failed');
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const currentNetwork = sdk.wallet.getCurrentNetwork();
  const balanceInSol = balance * 0.000000001;
  const balanceInUsd = balanceInSol * 180; // Mock price

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Wallet</IonTitle>
          <IonButtons slot="end">
            {walletState.connected && (
              <IonButton fill="clear" onClick={handleRefresh} disabled={refreshing}>
                <IonIcon icon={refresh} />
              </IonButton>
            )}
            <IonButton fill="clear" onClick={() => setShowNetworkAlert(true)}>
              <IonChip color="primary">{currentNetwork.name}</IonChip>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="wallet-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Wallet</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="wallet-container">
          {/* Error Display */}
          {error && (
            <div className="connection-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            </div>
          )}

          {/* Login Section */}
          {!authenticated && ready && (
            <div className="login-section">
              <div className="login-title">Welcome to Solana Wallet</div>
              <div className="login-subtitle">Connect your email to access wallet features and manage your Solana assets</div>
              <IonButton
                className="login-button"
                onClick={login}
                disabled={!ready}
              >
                <IonIcon icon={mail} slot="start" />
                {!ready ? 'Loading...' : 'Login with Email'}
              </IonButton>
            </div>
          )}

          {/* User Info */}
          {authenticated && user?.email?.address && (
            <div className="user-info-card">
              <div className="user-header">
                <div className="user-avatar">
                  <IonIcon icon={person} />
                </div>
                <div className="user-details">
                  <h3>Welcome back!</h3>
                  <p>{user.email.address}</p>
                </div>
                <IonButton fill="clear" onClick={logout} color="danger" size="small">
                  <IonIcon icon={logOut} />
                </IonButton>
              </div>
              
              {!walletState.connected && (
                <IonButton
                  className="action-button primary"
                  onClick={() => connectWallet()}
                  disabled={isLoading}
                  expand="block"
                >
                  <IonIcon icon={wallet} slot="start" />
                  {isLoading ? 'Connecting...' : 'Connect Demo Wallet'}
                </IonButton>
              )}
            </div>
          )}

          {/* Wallet Dashboard */}
          {authenticated && walletState.connected && (
            <>
              {/* Balance Card */}
              <div className="wallet-card">
                <div className="balance-section">
                  <div className="balance-label">Your Balance</div>
                  <div className="balance-amount">
                    {refreshing ? (
                      <IonSpinner name="dots" />
                    ) : (
                      `${formatSol(balance)} SOL`
                    )}
                  </div>
                  <div className="balance-usd">
                    ≈ ${refreshing ? '...' : balanceInUsd.toFixed(2)} USD
                  </div>
                </div>

                {/* Wallet Info */}
                <div className="wallet-info">
                  <div className="wallet-address">
                    <span className="wallet-address-label">Wallet Address</span>
                    <span className="wallet-address-value">
                      {walletState.publicKey ? shortenAddress(walletState.publicKey.toString()) : 'Not connected'}
                    </span>
                    {walletState.publicKey && (
                      <IonButton
                        className="copy-button"
                        fill="clear"
                        onClick={handleCopyAddress}
                      >
                        <IonIcon icon={copied ? close : copy} color={copied ? 'success' : 'primary'} />
                      </IonButton>
                    )}
                  </div>
                  
                  <div className="network-info">
                    <span className="network-label">Network</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonChip className="network-chip" color="primary">
                        {currentNetwork.name}
                      </IonChip>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => setShowNetworkAlert(true)}
                      >
                        <IonIcon icon={swapHorizontal} />
                      </IonButton>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <IonButton
                    className="action-button primary"
                    onClick={() => setShowSendModal(true)}
                    disabled={balance === 0}
                  >
                    <IonIcon icon={send} slot="start" />
                    Send SOL
                  </IonButton>
                  <IonButton
                    className="action-button secondary"
                    onClick={() => showToastMessage('Receive functionality coming soon!')}
                  >
                    <IonIcon icon={wallet} slot="start" />
                    Receive
                  </IonButton>
                </div>
              </div>
            </>
          )}

          {/* Quick Actions */}
          {authenticated && walletState.connected && (
            <div className="quick-actions">
              <div className="quick-actions-title">Quick Actions</div>
              <div className="quick-actions-grid">
                <div className="quick-action-item" onClick={handleRefresh}>
                  <div className="quick-action-icon">
                    <IonIcon icon={refresh} />
                  </div>
                  <div className="quick-action-label">Refresh Balance</div>
                </div>
                <div className="quick-action-item" onClick={() => setShowNetworkAlert(true)}>
                  <div className="quick-action-icon">
                    <IonIcon icon={swapHorizontal} />
                  </div>
                  <div className="quick-action-label">Switch Network</div>
                </div>
                <div className="quick-action-item" onClick={handleCopyAddress}>
                  <div className="quick-action-icon">
                    <IonIcon icon={copy} />
                  </div>
                  <div className="quick-action-label">Copy Address</div>
                </div>
                <div className="quick-action-item" onClick={async () => {
                  if (authenticated) await logout();
                  await disconnectWallet();
                }}>
                  <div className="quick-action-icon">
                    <IonIcon icon={logOut} />
                  </div>
                  <div className="quick-action-label">Disconnect</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Send Modal */}
        <IonModal isOpen={showSendModal} onDidDismiss={() => setShowSendModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Send SOL</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSendModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="wallet-content">
            <div className="wallet-container">
              <div className="wallet-card">
                <IonItem>
                  <IonLabel position="stacked">Recipient Address</IonLabel>
                  <IonInput
                    value={sendAddress}
                    onIonChange={(e) => setSendAddress(e.detail.value!)}
                    placeholder="Enter Solana address"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Amount (SOL)</IonLabel>
                  <IonInput
                    type="number"
                    value={sendAmount}
                    onIonChange={(e) => setSendAmount(e.detail.value!)}
                    placeholder="0.00"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Memo (Optional)</IonLabel>
                  <IonInput
                    value={sendMemo}
                    onIonChange={(e) => setSendMemo(e.detail.value!)}
                    placeholder="Transaction memo"
                  />
                </IonItem>
                
                <IonButton
                  className="action-button primary"
                  onClick={handleSendTransaction}
                  disabled={!sendAddress || !sendAmount}
                  expand="block"
                  style={{ marginTop: '20px' }}
                >
                  <IonIcon icon={send} slot="start" />
                  Send Transaction
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Network Selection Alert */}
        <IonAlert
          isOpen={showNetworkAlert}
          onDidDismiss={() => setShowNetworkAlert(false)}
          header="Select Network"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Mainnet',
              handler: () => switchNetwork('mainnet-beta')
            },
            {
              text: 'Testnet',
              handler: () => switchNetwork('testnet')
            },
            {
              text: 'Devnet',
              handler: () => switchNetwork('devnet')
            }
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        <IonLoading isOpen={refreshing} message="Refreshing..." />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;

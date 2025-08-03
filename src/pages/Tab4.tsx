import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonToast,
  IonLoading,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonModal,
  IonList,
  IonSearchbar,
  IonAvatar,
  IonButtons
} from '@ionic/react';
import {
  swapVertical,
  refresh,
  settingsOutline,
  informationCircle,
  chevronDown,
  close,
  checkmark
} from 'ionicons/icons';
import { useSolana } from '../context/SolanaContext';
import { usePrivyAuth } from '../context/PrivyContext';
import { usePrivySolana } from '../hooks/usePrivySolana';
import { PublicKey, Connection } from '@solana/web3.js';
import './Tab4.css';

interface Token {
  symbol: string;
  name: string;
  mintAddress: string;
  decimals: number;
  logoURI?: string;
  balance?: number;
}

const Tab4: React.FC = () => {
  const { sdk, walletState, isLoading: walletLoading } = useSolana();
  const { authenticated, user } = usePrivyAuth();
  usePrivySolana();

  // State for trading
  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string>('');
  
  // Modal states
  const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
  const [selectingTokenType, setSelectingTokenType] = useState<'input' | 'output'>('input');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tokenSearchText, setTokenSearchText] = useState('');
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Popular tokens on Solana - balances will be fetched from wallet
  const defaultTokens: Token[] = [
    {
      symbol: 'SOL',
      name: 'Solana',
      mintAddress: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
      balance: 0
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
      balance: 0
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
      balance: 0
    },
    {
      symbol: 'BONK',
      name: 'Bonk',
      mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      decimals: 5,
      logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
      balance: 0
    },
    {
      symbol: 'JUP',
      name: 'Jupiter',
      mintAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      decimals: 6,
      logoURI: 'https://static.jup.ag/jup/icon.png',
      balance: 0
    }
  ];

  // Fetch SOL balance
  const fetchSolBalance = async (walletAddress: string): Promise<number> => {
    try {
      const connection = sdk?.wallet?.getConnection();
      if (!connection) return 0;
      
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return 0;
    }
  };

  // Fetch token balance for a specific mint
  const fetchTokenBalance = async (walletAddress: string, mintAddress: string, decimals: number): Promise<number> => {
    try {
      const connection = sdk?.wallet?.getConnection();
      if (!connection) return 0;
      
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get token accounts for this mint
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { mint: mintPublicKey }
      );
      
      if (tokenAccounts.value.length === 0) {
        return 0;
      }
      
      // Sum all token account balances for this mint
      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount || 0;
        totalBalance += balance;
      }
      
      return totalBalance;
    } catch (error) {
      console.error(`Error fetching token balance for ${mintAddress}:`, error);
      return 0;
    }
  };

  // Fetch all token balances
  const fetchAllBalances = async () => {
    if (!walletState.connected || !walletState.publicKey) {
      return;
    }

    setIsLoadingBalances(true);
    const walletAddress = walletState.publicKey.toString();
    
    try {
      const updatedTokens = await Promise.all(
        defaultTokens.map(async (token) => {
          let balance = 0;
          
          if (token.symbol === 'SOL') {
            // Fetch SOL balance
            balance = await fetchSolBalance(walletAddress);
          } else {
            // Fetch token balance
            balance = await fetchTokenBalance(walletAddress, token.mintAddress, token.decimals);
          }
          
          return {
            ...token,
            balance
          };
        })
      );
      
      setTokenList(updatedTokens);
      
      // Update current input/output tokens with new balances
      if (inputToken) {
        const updatedInputToken = updatedTokens.find(t => t.mintAddress === inputToken.mintAddress);
        if (updatedInputToken) setInputToken(updatedInputToken);
      }
      
      if (outputToken) {
        const updatedOutputToken = updatedTokens.find(t => t.mintAddress === outputToken.mintAddress);
        if (updatedOutputToken) setOutputToken(updatedOutputToken);
      }
      
    } catch (error) {
      console.error('Error fetching balances:', error);
      setToastMessage('Failed to fetch token balances');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  useEffect(() => {
    setTokenList(defaultTokens);
    setInputToken(defaultTokens[0]); // SOL
    setOutputToken(defaultTokens[1]); // USDC
  }, []);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (walletState.connected && walletState.publicKey && sdk?.wallet?.getConnection()) {
      fetchAllBalances();
    } else {
      // Reset to default tokens with zero balances when wallet disconnects
      setTokenList(defaultTokens);
      if (inputToken) setInputToken({ ...inputToken, balance: 0 });
      if (outputToken) setOutputToken({ ...outputToken, balance: 0 });
    }
  }, [walletState.connected, walletState.publicKey, sdk?.wallet]);

  // Fetch quote from Jupiter
  const fetchQuote = async () => {
    if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) === 0) {
      setOutputAmount('');
      setExchangeRate('');
      setPriceImpact(null);
      return;
    }

    setIsLoadingQuote(true);
    try {
      const inputAmountLamports = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals));
      
      // Simulate Jupiter quote API call
      const response = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputToken.mintAddress}&outputMint=${outputToken.mintAddress}&amount=${inputAmountLamports}&slippageBps=${Math.floor(slippage * 100)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const outAmount = data.outAmount / Math.pow(10, outputToken.decimals);
        setOutputAmount(outAmount.toFixed(6));
        setPriceImpact(data.priceImpactPct || 0);
        
        // Calculate exchange rate
        const rate = outAmount / parseFloat(inputAmount);
        setExchangeRate(`1 ${inputToken.symbol} = ${rate.toFixed(6)} ${outputToken.symbol}`);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Use mock data for demo
      const mockRate = inputToken.symbol === 'SOL' ? 180.5 : 0.0055;
      const mockOutput = parseFloat(inputAmount) * mockRate;
      setOutputAmount(mockOutput.toFixed(6));
      setExchangeRate(`1 ${inputToken.symbol} = ${mockRate.toFixed(6)} ${outputToken.symbol}`);
      setPriceImpact(0.1);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputAmount && inputToken && outputToken) {
        fetchQuote();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputAmount, inputToken, outputToken, slippage]);

  const handleSwap = async () => {
    if (!walletState.connected || !inputToken || !outputToken || !inputAmount) {
      setToastMessage('Please connect wallet and fill all fields');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setIsSwapping(true);
    try {
      // Simulated swap
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setToastMessage(`Successfully swapped ${inputAmount} ${inputToken.symbol} for ${outputAmount} ${outputToken.symbol}`);
      setToastColor('success');
      setShowToast(true);
      
      // Reset form
      setInputAmount('');
      setOutputAmount('');
      setPriceImpact(null);
      setExchangeRate('');
    } catch (error) {
      console.error('Swap error:', error);
      setToastMessage('Swap failed. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsSwapping(false);
    }
  };

  const switchTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setInputAmount(outputAmount);
    setOutputAmount(inputAmount);
  };

  const openTokenSelect = (type: 'input' | 'output') => {
    setSelectingTokenType(type);
    setIsTokenSelectOpen(true);
    setTokenSearchText('');
  };

  const selectToken = (token: Token) => {
    if (selectingTokenType === 'input') {
      setInputToken(token);
    } else {
      setOutputToken(token);
    }
    setIsTokenSelectOpen(false);
  };

  const setMaxAmount = () => {
    if (inputToken?.balance && inputToken.balance > 0) {
      // For SOL, reserve a small amount for transaction fees
      if (inputToken.symbol === 'SOL') {
        const maxAmount = Math.max(0, inputToken.balance - 0.001);
        setInputAmount(maxAmount.toString());
      } else {
        setInputAmount(inputToken.balance.toString());
      }
    } else {
      setToastMessage('Insufficient balance');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const getPriceImpactColor = (impact: number | null) => {
    if (!impact) return 'medium';
    if (impact < 1) return 'success';
    if (impact < 3) return 'warning';
    return 'danger';
  };

  const filteredTokens = tokenList.filter(token =>
    token.symbol.toLowerCase().includes(tokenSearchText.toLowerCase()) ||
    token.name.toLowerCase().includes(tokenSearchText.toLowerCase())
  );

  const isSwapDisabled = !inputAmount || !outputAmount || isLoadingQuote || isSwapping || !walletState.connected;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Swap</IonTitle>
                      <IonButtons slot="end">
              {walletState.connected && (
                <IonButton fill="clear" onClick={fetchAllBalances} disabled={isLoadingBalances}>
                  <IonIcon icon={refresh} />
                </IonButton>
              )}
              <IonButton fill="clear" onClick={() => setIsSettingsOpen(true)}>
                <IonIcon icon={settingsOutline} />
              </IonButton>
            </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="trading-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Swap</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Connection Status */}
        {!authenticated && (
          <div className="connection-banner">
            <IonText color="medium">
              <p>Please login to start trading</p>
            </IonText>
          </div>
        )}

        {authenticated && !walletState.connected && (
          <div className="connection-banner">
            <IonText color="medium">
              <p>Please connect your wallet to trade</p>
            </IonText>
          </div>
        )}

        {/* Trading Interface */}
        <div className="trading-container">
          <div className="swap-card">
            {/* From Token Section */}
            <div className="token-section from-section">
              <div className="section-header">
                <IonLabel>From</IonLabel>
                {inputToken?.balance !== undefined && (
                  <IonText color="medium" className="balance-text">
                    Balance: {isLoadingBalances ? (
                      <>
                        <IonSpinner name="dots" style={{ width: '12px', height: '12px' }} />
                        Loading...
                      </>
                    ) : (
                      inputToken.balance.toFixed(4)
                    )}
                  </IonText>
                )}
              </div>
              
              <div className="token-input-container">
                <div className="amount-input">
                  <IonInput
                    type="number"
                    placeholder="0.0"
                    value={inputAmount}
                    onIonChange={(e) => setInputAmount(e.detail.value!)}
                    className="large-input"
                  />
                  {inputToken?.balance !== undefined && (
                    <IonButton
                      fill="clear"
                      size="small"
                      className="max-button"
                      onClick={setMaxAmount}
                      disabled={isLoadingBalances || !inputToken.balance}
                    >
                      MAX
                    </IonButton>
                  )}
                </div>
                
                <IonButton
                  fill="outline"
                  className="token-select-button"
                  onClick={() => openTokenSelect('input')}
                >
                  {inputToken ? (
                    <>
                      {inputToken.logoURI && (
                        <IonAvatar className="token-avatar">
                          <img src={inputToken.logoURI} alt={inputToken.symbol} />
                        </IonAvatar>
                      )}
                      <span className="token-symbol">{inputToken.symbol}</span>
                      <IonIcon icon={chevronDown} />
                    </>
                  ) : (
                    <>
                      <span>Select token</span>
                      <IonIcon icon={chevronDown} />
                    </>
                  )}
                </IonButton>
              </div>
            </div>

            {/* Swap Button */}
            <div className="swap-button-container">
              <IonButton
                fill="clear"
                className="swap-switch-button"
                onClick={switchTokens}
                disabled={isLoadingQuote || isSwapping}
              >
                <IonIcon icon={swapVertical} />
              </IonButton>
            </div>

            {/* To Token Section */}
            <div className="token-section to-section">
              <div className="section-header">
                <IonLabel>To</IonLabel>
                {outputToken?.balance !== undefined && (
                  <IonText color="medium" className="balance-text">
                    Balance: {isLoadingBalances ? (
                      <>
                        <IonSpinner name="dots" style={{ width: '12px', height: '12px' }} />
                        Loading...
                      </>
                    ) : (
                      outputToken.balance.toFixed(4)
                    )}
                  </IonText>
                )}
              </div>
              
              <div className="token-input-container">
                <div className="amount-input">
                  <IonInput
                    type="number"
                    placeholder="0.0"
                    value={outputAmount}
                    readonly
                    className="large-input output-input"
                  />
                  {isLoadingQuote && (
                    <div className="loading-indicator">
                      <IonSpinner name="dots" />
                    </div>
                  )}
                </div>
                
                <IonButton
                  fill="outline"
                  className="token-select-button"
                  onClick={() => openTokenSelect('output')}
                >
                  {outputToken ? (
                    <>
                      {outputToken.logoURI && (
                        <IonAvatar className="token-avatar">
                          <img src={outputToken.logoURI} alt={outputToken.symbol} />
                        </IonAvatar>
                      )}
                      <span className="token-symbol">{outputToken.symbol}</span>
                      <IonIcon icon={chevronDown} />
                    </>
                  ) : (
                    <>
                      <span>Select token</span>
                      <IonIcon icon={chevronDown} />
                    </>
                  )}
                </IonButton>
              </div>
            </div>

            {/* Trade Details */}
            {exchangeRate && (
              <div className="trade-details">
                <div className="detail-row">
                  <span>Rate</span>
                  <span>{exchangeRate}</span>
                </div>
                {priceImpact !== null && (
                  <div className="detail-row">
                    <span>Price Impact</span>
                    <IonChip color={getPriceImpactColor(priceImpact)} className="impact-chip">
                      {priceImpact.toFixed(2)}%
                    </IonChip>
                  </div>
                )}
                <div className="detail-row">
                  <span>Slippage Tolerance</span>
                  <span>{slippage}%</span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <IonButton
              expand="block"
              size="large"
              className="swap-execute-button"
              onClick={handleSwap}
              disabled={isSwapDisabled}
            >
              {isSwapping ? (
                <>
                  <IonSpinner name="dots" />
                  <span style={{ marginLeft: '8px' }}>Swapping...</span>
                </>
              ) : !walletState.connected ? (
                'Connect Wallet'
              ) : !inputAmount ? (
                'Enter Amount'
              ) : (
                'Swap'
              )}
            </IonButton>
          </div>

          {/* Info Section */}
          <div className="info-section">
            <IonItem lines="none" className="info-item">
              <IonIcon icon={informationCircle} slot="start" color="primary" />
              <IonLabel className="ion-text-wrap">
                <p>Powered by Jupiter - Best price guaranteed</p>
              </IonLabel>
            </IonItem>
          </div>
        </div>

        {/* Token Selection Modal */}
        <IonModal isOpen={isTokenSelectOpen} onDidDismiss={() => setIsTokenSelectOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Token</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsTokenSelectOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonSearchbar
              value={tokenSearchText}
              onIonChange={(e) => setTokenSearchText(e.detail.value!)}
              placeholder="Search tokens"
            />
            <IonList>
              {filteredTokens.map((token) => (
                <IonItem
                  key={token.mintAddress}
                  button
                  onClick={() => selectToken(token)}
                  className="token-list-item"
                >
                  {token.logoURI && (
                    <IonAvatar slot="start">
                      <img src={token.logoURI} alt={token.symbol} />
                    </IonAvatar>
                  )}
                  <IonLabel>
                    <h2>{token.symbol}</h2>
                    <p>{token.name}</p>
                  </IonLabel>
                  {token.balance !== undefined && (
                    <IonText slot="end" color="medium">
                      {isLoadingBalances ? (
                        <IonSpinner name="dots" style={{ width: '12px', height: '12px' }} />
                      ) : (
                        token.balance.toFixed(4)
                      )}
                    </IonText>
                  )}
                </IonItem>
              ))}
            </IonList>
          </IonContent>
        </IonModal>

        {/* Settings Modal */}
        <IonModal isOpen={isSettingsOpen} onDidDismiss={() => setIsSettingsOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Swap Settings</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsSettingsOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="settings-content">
              <IonItem>
                <IonLabel>
                  <h3>Slippage Tolerance</h3>
                  <p>Your transaction will revert if the price changes unfavorably by more than this percentage</p>
                </IonLabel>
              </IonItem>
              
              <div className="slippage-options">
                {[0.1, 0.5, 1.0, 3.0].map((value) => (
                  <IonButton
                    key={value}
                    fill={slippage === value ? 'solid' : 'outline'}
                    onClick={() => setSlippage(value)}
                  >
                    {value}%
                  </IonButton>
                ))}
              </div>
            </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />

        <IonLoading
          isOpen={walletLoading}
          message="Loading..."
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab4; 
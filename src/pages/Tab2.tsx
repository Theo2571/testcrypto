import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonLabel,
  IonToast,
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonModal,
  IonInput,
  IonButtons,
  IonItem,
  IonSpinner,
  IonText,
  IonSkeletonText,
} from "@ionic/react";
import {
  refresh,
  send,
  add,
  close,
  wallet,
  trendingUp,
  swapHorizontal,
} from "ionicons/icons";
import { useSolana } from "../context/SolanaContext";
import { usePrivyAuth } from "../context/PrivyContext";
import { usePrivySolana } from "../hooks/usePrivySolana";
import { TokenBalance, TokenInfo } from "../sdk/types";
import { formatTokenAmount } from "../sdk/utils";
import { PublicKey } from "@solana/web3.js";
import "./Tab2.css";

const Tab2: React.FC = () => {
  const { sdk, walletState } = useSolana();
  const { authenticated } = usePrivyAuth();
  usePrivySolana();

  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [popularTokens, setPopularTokens] = useState<TokenInfo[]>([]);
  const [searchResults, setSearchResults] = useState<TokenInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [showSendTokenModal, setShowSendTokenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [sendAddress, setSendAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Popular tokens with real balance fetching
  const mockPopularTokens: TokenInfo[] = [
    {
      symbol: "USDC",
      name: "USD Coin",
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
      logoUri:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
      logoUri:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
    },
    {
      symbol: "BONK",
      name: "Bonk",
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      decimals: 5,
      logoUri:
        "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
    },
    {
      symbol: "JUP",
      name: "Jupiter",
      mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      decimals: 6,
      logoUri: "https://static.jup.ag/jup/icon.png",
    },
  ];

  // Function to fetch SOL balance
  const fetchSolBalance = async (walletAddress: string): Promise<number> => {
    try {
      const connection = sdk?.wallet?.getConnection();
      if (!connection) return 0;

      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      return 0;
    }
  };

  // Function to fetch token balance for a specific mint
  const fetchTokenBalance = async (
    walletAddress: string,
    mintAddress: string,
    decimals: number,
  ): Promise<number> => {
    try {
      const connection = sdk?.wallet?.getConnection();
      if (!connection) return 0;

      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      // Get token accounts for this mint
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { mint: mintPublicKey },
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      // Sum all token account balances for this mint
      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const balance =
          account.account.data.parsed.info.tokenAmount.uiAmount || 0;
        totalBalance += balance;
      }

      return totalBalance;
    } catch (error) {
      console.error(`Error fetching token balance for ${mintAddress}:`, error);
      return 0;
    }
  };

  useEffect(() => {
    if (walletState.connected) {
      loadTokenData();
    } else {
      setTokenBalances([]);
    }
  }, [walletState.connected]);

  const loadTokenData = async () => {
    if (!walletState.connected || !walletState.publicKey) {
      setTokenBalances([]);
      setPopularTokens(mockPopularTokens);
      return;
    }

    setIsLoading(true);
    setIsLoadingBalances(true);
    const walletAddress = walletState.publicKey.toString();

    try {
      // Create SOL balance entry
      const solBalance = await fetchSolBalance(walletAddress);
      const solTokenBalance: TokenBalance = {
        mint: "So11111111111111111111111111111111111111112",
        amount: (solBalance * 1e9).toString(),
        decimals: 9,
        uiAmount: solBalance,
        tokenInfo: {
          mint: "So11111111111111111111111111111111111111112",
          symbol: "SOL",
          name: "Solana",
          decimals: 9,
          logoUri:
            "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        },
      };

      // Fetch token balances for popular tokens
      const tokenBalancesPromises = mockPopularTokens.map(async (token) => {
        const balance = await fetchTokenBalance(
          walletAddress,
          token.mint,
          token.decimals,
        );

        if (balance > 0) {
          return {
            mint: token.mint,
            amount: (balance * Math.pow(10, token.decimals)).toString(),
            decimals: token.decimals,
            uiAmount: balance,
            tokenInfo: token,
          };
        }
        return null;
      });

      const resolvedTokenBalances = await Promise.all(tokenBalancesPromises);
      const validTokenBalances = resolvedTokenBalances.filter(
        Boolean,
      ) as TokenBalance[];

      // Combine SOL balance with token balances
      const allBalances = [solTokenBalance, ...validTokenBalances];

      setTokenBalances(allBalances);
      setPopularTokens(mockPopularTokens);
    } catch (error) {
      console.error("Failed to load token data:", error);
      showToastMessage("Failed to load token data");
    } finally {
      setIsLoading(false);
      setIsLoadingBalances(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadTokenData();
    event.detail.complete();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = popularTokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(query.toLowerCase()) ||
          token.name.toLowerCase().includes(query.toLowerCase()),
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddToken = async () => {
    if (!newTokenAddress.trim()) {
      showToastMessage("Please enter a token address");
      return;
    }

    try {
      // In a real app, you would validate and add the token
      showToastMessage("Token added successfully!");
      setShowAddTokenModal(false);
      setNewTokenAddress("");
      await loadTokenData();
    } catch (error) {
      showToastMessage("Failed to add token");
    }
  };

  const handleSendToken = async () => {
    if (!selectedToken || !sendAddress.trim() || !sendAmount.trim()) {
      showToastMessage("Please fill in all fields");
      return;
    }

    try {
      // In a real app, you would send the token transaction
      showToastMessage(
        `Sent ${sendAmount} ${selectedToken.tokenInfo?.symbol} successfully!`,
      );
      setShowSendTokenModal(false);
      setSendAddress("");
      setSendAmount("");
      setSelectedToken(null);
      await loadTokenData();
    } catch (error) {
      showToastMessage("Failed to send token");
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const calculateTotalValue = () => {
    // Mock calculation with realistic prices - in real app, use actual prices from an API
    return tokenBalances.reduce((total, token) => {
      const amount = parseFloat(token.amount) / Math.pow(10, token.decimals);
      let mockPrice = 0;

      // Use more realistic mock prices
      switch (token.tokenInfo?.symbol) {
        case "SOL":
          mockPrice = 180;
          break;
        case "USDC":
        case "USDT":
          mockPrice = 1;
          break;
        case "BONK":
          mockPrice = 0.000025;
          break;
        case "JUP":
          mockPrice = 0.75;
          break;
        default:
          mockPrice = 0.1;
      }

      return total + amount * mockPrice;
    }, 0);
  };

  const openSendModal = (token: TokenBalance) => {
    setSelectedToken(token);
    setShowSendTokenModal(true);
  };

  const renderTokenItem = (token: TokenBalance) => (
    <div key={token.mint} className="token-item">
      {token.tokenInfo?.logoUri ? (
        <div className="token-avatar">
          <img src={token.tokenInfo.logoUri} alt={token.tokenInfo.symbol} />
        </div>
      ) : (
        <div className="token-placeholder">
          {token.tokenInfo?.symbol ? token.tokenInfo.symbol[0] : "?"}
        </div>
      )}

      <div className="token-info">
        <h3 className="token-symbol">{token.tokenInfo?.symbol || "Unknown"}</h3>
        <p className="token-name">{token.tokenInfo?.name || "Unknown Token"}</p>
      </div>

      <div className="token-balance">
        <div className="token-amount">
          {formatTokenAmount(token.amount, token.decimals)}
        </div>
        <div className="token-value">
          ≈ $
          {(() => {
            const amount =
              parseFloat(token.amount) / Math.pow(10, token.decimals);
            let mockPrice = 0;
            switch (token.tokenInfo?.symbol) {
              case "SOL":
                mockPrice = 180;
                break;
              case "USDC":
              case "USDT":
                mockPrice = 1;
                break;
              case "BONK":
                mockPrice = 0.000025;
                break;
              case "JUP":
                mockPrice = 0.75;
                break;
              default:
                mockPrice = 0.1;
            }
            return (amount * mockPrice).toFixed(2);
          })()}
        </div>
      </div>

      <div className="token-actions">
        <IonButton
          className="token-action-button"
          fill="clear"
          onClick={() => openSendModal(token)}
        >
          <IonIcon icon={send} />
        </IonButton>
        <IonButton
          className="token-action-button"
          fill="clear"
          onClick={() => showToastMessage("Swap coming soon!")}
        >
          <IonIcon icon={swapHorizontal} />
        </IonButton>
      </div>
    </div>
  );

  const renderLoadingItems = () =>
    Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="loading-item">
        <IonSkeletonText className="loading-avatar" animated />
        <div className="loading-content">
          <IonSkeletonText className="loading-text short" animated />
          <IonSkeletonText className="loading-text long" animated />
        </div>
      </div>
    ));

  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">
        <IonIcon icon={wallet} />
      </div>
      <h3 className="empty-state-title">No Tokens Found</h3>
      <p className="empty-state-description">
        Add some tokens to your wallet to get started
      </p>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tokens</IonTitle>
          <IonButtons slot="end">
            {walletState.connected && (
              <IonButton
                fill="clear"
                onClick={loadTokenData}
                disabled={isLoading || isLoadingBalances}
              >
                <IonIcon icon={refresh} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="token-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tokens</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="token-container">
          {/* Connection Status */}
          {!authenticated && (
            <div className="token-connection-banner">
              <h2>Connect Your Wallet</h2>
              <p>Login to view and manage your token portfolio</p>
            </div>
          )}

          {authenticated && !walletState.connected && (
            <div className="token-connection-banner">
              <h2>Wallet Not Connected</h2>
              <p>Connect your wallet to view your token balances</p>
            </div>
          )}

          {/* Portfolio Overview */}
          {authenticated && walletState.connected && (
            <>
              {/* Token Stats */}
              <div className="token-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">
                      {isLoadingBalances ? (
                        <IonSpinner
                          name="dots"
                          style={{ width: "20px", height: "20px" }}
                        />
                      ) : (
                        tokenBalances.length
                      )}
                    </div>
                    <div className="stat-label">Tokens</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {isLoadingBalances ? (
                        <IonSpinner
                          name="dots"
                          style={{ width: "20px", height: "20px" }}
                        />
                      ) : (
                        `$${calculateTotalValue().toFixed(2)}`
                      )}
                    </div>
                    <div className="stat-label">Total Value</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">+2.5%</div>
                    <div className="stat-label">24h Change</div>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="search-section">
                <div className="search-header">
                  <h2 className="search-title">Manage Tokens</h2>
                  <IonButton
                    className="add-token-button"
                    onClick={() => setShowAddTokenModal(true)}
                  >
                    <IonIcon icon={add} slot="start" />
                    Add Token
                  </IonButton>
                </div>

                <IonSearchbar
                  className="token-searchbar"
                  value={searchQuery}
                  onIonInput={(e) => handleSearch(e.detail.value!)}
                  placeholder="Search tokens..."
                  showClearButton="focus"
                />
              </div>

              {/* Token List */}
              <div className="token-list">
                <div className="token-list-header">
                  <h2 className="token-list-title">Your Tokens</h2>
                  <span className="token-count">
                    {isLoadingBalances ? (
                      <IonSpinner
                        name="dots"
                        style={{ width: "12px", height: "12px" }}
                      />
                    ) : (
                      `${tokenBalances.length} tokens`
                    )}
                  </span>
                </div>

                {isLoading || isLoadingBalances
                  ? renderLoadingItems()
                  : tokenBalances.length > 0
                    ? tokenBalances.map(renderTokenItem)
                    : renderEmptyState()}
              </div>

              {/* Popular Tokens */}
              {searchQuery && searchResults.length > 0 && (
                <div className="popular-tokens">
                  <div className="popular-tokens-title">Search Results</div>
                  <div className="popular-grid">
                    {searchResults.map((token) => (
                      <div
                        key={token.mint}
                        className="popular-token-item"
                        onClick={() =>
                          showToastMessage(`Add ${token.symbol} coming soon!`)
                        }
                      >
                        <div className="popular-token-symbol">
                          {token.symbol}
                        </div>
                        <div className="popular-token-name">{token.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Tokens Section */}
              {!searchQuery && (
                <div className="popular-tokens">
                  <div className="popular-tokens-title">Popular Tokens</div>
                  <div className="popular-grid">
                    {popularTokens.map((token) => (
                      <div
                        key={token.mint}
                        className="popular-token-item"
                        onClick={() =>
                          showToastMessage(`Add ${token.symbol} coming soon!`)
                        }
                      >
                        <div className="popular-token-symbol">
                          {token.symbol}
                        </div>
                        <div className="popular-token-name">{token.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Token Modal */}
        <IonModal
          isOpen={showAddTokenModal}
          onDidDismiss={() => setShowAddTokenModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Token</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAddTokenModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="token-content">
            <div className="token-container">
              <div className="token-portfolio-card">
                <IonItem>
                  <IonLabel position="stacked">Token Contract Address</IonLabel>
                  <IonInput
                    value={newTokenAddress}
                    onIonChange={(e) => setNewTokenAddress(e.detail.value!)}
                    placeholder="Enter token mint address"
                  />
                </IonItem>

                <IonButton
                  className="add-token-button"
                  onClick={handleAddToken}
                  disabled={!newTokenAddress.trim()}
                  expand="block"
                  style={{ marginTop: "20px" }}
                >
                  <IonIcon icon={add} slot="start" />
                  Add Token
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Send Token Modal */}
        <IonModal
          isOpen={showSendTokenModal}
          onDidDismiss={() => setShowSendTokenModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Send {selectedToken?.tokenInfo?.symbol}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSendTokenModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="token-content">
            <div className="token-container">
              <div className="token-portfolio-card">
                <IonItem>
                  <IonLabel position="stacked">Recipient Address</IonLabel>
                  <IonInput
                    value={sendAddress}
                    onIonChange={(e) => setSendAddress(e.detail.value!)}
                    placeholder="Enter recipient address"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Amount</IonLabel>
                  <IonInput
                    type="number"
                    value={sendAmount}
                    onIonChange={(e) => setSendAmount(e.detail.value!)}
                    placeholder="0.00"
                  />
                </IonItem>

                {selectedToken && (
                  <div
                    style={{
                      margin: "16px 0",
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                    }}
                  >
                    <IonText>
                      <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                        Available:{" "}
                        {formatTokenAmount(
                          selectedToken.amount,
                          selectedToken.decimals,
                        )}{" "}
                        {selectedToken.tokenInfo?.symbol}
                      </p>
                    </IonText>
                  </div>
                )}

                <IonButton
                  className="add-token-button"
                  onClick={handleSendToken}
                  disabled={!sendAddress.trim() || !sendAmount.trim()}
                  expand="block"
                  style={{ marginTop: "20px" }}
                >
                  <IonIcon icon={send} slot="start" />
                  Send Token
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        <IonLoading isOpen={isLoading} message="Loading tokens..." />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;

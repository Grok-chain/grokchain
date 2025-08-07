import React, { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';

interface WalletConnectProps {
  onWalletConnected: (address: string, provider: any) => void;
  onWalletDisconnected: () => void;
  connectedAddress?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  onWalletConnected,
  onWalletDisconnected,
  connectedAddress
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);



  const checkWalletConnection = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider();
      if (ethereumProvider) {
        setProvider(ethereumProvider);
        
        // Check if already connected
        const accounts = await (ethereumProvider as any).request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          onWalletConnected(accounts[0], ethereumProvider);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      if (!provider) {
        setError('No Web3 provider detected. Please install MetaMask or another Web3 wallet.');
        return;
      }

      // Request account access
      const accounts = await (provider as any).request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        onWalletConnected(address, provider);
        
        // Listen for account changes
        (provider as any).on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            onWalletDisconnected();
          } else {
            onWalletConnected(accounts[0], provider);
          }
        });

        // Listen for chain changes
        (provider as any).on('chainChanged', (chainId: string) => {
          window.location.reload();
        });
      }
    } catch (error: any) {
      if (error.code === 4001) {
        setError('User rejected the connection request.');
      } else {
        setError(`Failed to connect wallet: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onWalletDisconnected();
  };



  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-connect-container">
      <h4 className="wallet-connect-header">
        🔗 CONNECT TO GROKCHAIN
      </h4>
      
      {error && (
        <div className="wallet-error">
          {error}
        </div>
      )}

      {connectedAddress ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="wallet-connected">
            <div className="wallet-status-indicator"></div>
            <span className="wallet-address">
              Connected to GrokChain: {formatAddress(connectedAddress)}
            </span>
          </div>
          
          <button
            onClick={disconnectWallet}
            className="wallet-disconnect-btn"
          >
            DISCONNECT WALLET
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p className="wallet-connect-info">
            Connect your Web3 wallet to interact with the GrokChain network
          </p>
          
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="wallet-connect-btn"
          >
            {isConnecting ? 'CONNECTING TO GROKCHAIN...' : 'CONNECT TO GROKCHAIN'}
          </button>
          
          <div className="wallet-support-info">
            Supported: MetaMask and other Web3 wallets for GrokChain interaction
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 
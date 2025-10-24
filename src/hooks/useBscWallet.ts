import { useCallback, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useConfig } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export function useBscWallet() {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { data: balanceData } = useBalance({
    address,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Connect to wallet
  const connect = useCallback(async () => {
    setIsLoading(true);
    console.log('Using wagmi to connect BSC wallet');
    try {
      await connectAsync({ connector: metaMask() });
      console.log('Connected to wallet successfully');
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connectAsync]);

  // Disconnect from wallet
  const disconnect = useCallback(async () => {
    console.log('Disconnecting BSC wallet');
    try {
      await disconnectAsync();
      console.log('Disconnected from wallet successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [disconnectAsync]);

  // Format balance for display
  const balance = balanceData ? balanceData.formatted : null;

  return {
    publicKey: address || null, // Similar to Solana's publicKey
    connected: isConnected, // Similar to Solana's connected
    connect,
    disconnect,
    balance,
    isLoading
  };
}

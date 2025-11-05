// This file serves as a compatibility layer to switch from Solana to BSC
// It re-exports our BSC wallet hook with the same interface as Solana's useWallet
import { useBscWallet } from './useBscWallet';

// Re-export the BSC wallet hook as useWallet to maintain compatibility
export const useWallet = useBscWallet;

// Export types that match Solana's useWallet return type
export interface WalletContextState {
  publicKey: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  balance?: string | null;
  isLoading?: boolean;
}

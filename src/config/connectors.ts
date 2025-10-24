import { InjectedConnector } from '@web3-react/injected-connector';
import { ChainId } from './bscChains';

// Injected connector for MetaMask and other browser wallets
export const injected = new InjectedConnector({
  supportedChainIds: [ChainId.BSC, ChainId.BSC_TESTNET],
});

// Wallet connectors
export const connectors = {
  injected: injected,
};

// Helper function to add BSC network to MetaMask
export const setupNetwork = async (chainId: number) => {
  const provider = window.ethereum;
  if (provider) {
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: chainId === ChainId.BSC ? 'Binance Smart Chain' : 'Binance Smart Chain Testnet',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: [
              chainId === ChainId.BSC
                ? 'https://bsc-dataseed.binance.org/'
                : 'https://data-seed-prebsc-1-s1.binance.org:8545/',
            ],
            blockExplorerUrls: [
              chainId === ChainId.BSC
                ? 'https://bscscan.com/'
                : 'https://testnet.bscscan.com/',
            ],
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Failed to setup the network in Metamask:', error);
      return false;
    }
  } else {
    console.error("Can't setup the BSC network on metamask because window.ethereum is undefined");
    return false;
  }
};

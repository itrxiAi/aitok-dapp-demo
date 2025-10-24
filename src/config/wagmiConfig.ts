import { http, createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Configure wagmi with BSC chains and connectors
export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
});

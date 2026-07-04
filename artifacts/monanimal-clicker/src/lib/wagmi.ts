import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  rainbowWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadscan.com" },
  },
});

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        rabbyWallet,
        metaMaskWallet,
        okxWallet,
        rainbowWallet,
        walletConnectWallet,
        coinbaseWallet,
      ],
    },
  ],
  {
    appName: "Monanimal Clicker",
    projectId: "e022ea00c850786ae6763484841eb995", // тот же, что уже используешь
  },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
});

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
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

export const wagmiConfig = getDefaultConfig({
  appName: "Monanimal Clicker",
  projectId: "e022ea00c850786ae6763484841eb995",
  chains: [monadTestnet],
});

// packages/nextjs/utils/customChains.ts
import { defineChain } from "viem";

export const virtualBNB = defineChain({
  id: 97,
  name: "Tenderly BNB Virtual Testnet",
  network: "virtualbnb",
  nativeCurrency: { name: "TBNB", symbol: "TBNB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://virtual.binance-rialto.rpc.tenderly.co/996f58c5-1216-4c97-be7c-5d9612fd53a9"] },
  },
  blockExplorers: {
    default: { name: "Tenderly Dashboard", url: "https://dashboard.tenderly.co/" },
  },
  testnet: true,
  contracts: {
    multicall3: { address: "0xca11bde05977b3631167028862be2a173976ca11" },
  },
});

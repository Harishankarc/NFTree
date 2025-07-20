import { defineChain } from "viem";

export const bnbTestnet = defineChain({
  id: 97,
  name: "BSC Testnet",
  network: "bscTestnet",
  nativeCurrency: { name: "Binance Coin", symbol: "BNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"] } },
  blockExplorers: { default: { name: "BscScan Testnet", url: "https://testnet.bscscan.com/" } },
  testnet: true,
  contracts: { multicall3: { address: "0xca11bde05977b3631167028862be2a173976ca11" } },
});

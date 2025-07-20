"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Heart,
  Leaf,
  Search,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { NextPage } from "next";
import toast from "react-hot-toast";
import { SyncLoader } from "react-spinners";
import { json } from "stream/consumers";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// Contract ABI for the functions we need

const contractABI = [
  {
    name: "getAllTreeTypes",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "treeTypes", type: "uint8[]" },
      { name: "names", type: "string[]" },
      { name: "basePrices", type: "uint256[]" },
      { name: "currentPrices", type: "uint256[]" },
      { name: "baseAppreciations", type: "uint256[]" },
      { name: "produceAppreciations", type: "uint256[]" },
    ],
  },
];

// Replace with your actual contract address

interface TreeData {
  treeType: number;
  name: string;
  basePrice: bigint;
  currentPrice: bigint;
  harvestCycleMonths: number;
  profitRatePerCycle: bigint;
  yearlyAppreciation: number;
  imagePath: string;
  description: string;
  rarity: string;
}

const BuyTree: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [selectedTree, setSelectedTree] = useState<TreeData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"cost" | "return" | "yield">("cost");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [trees, setTrees] = useState<TreeData[]>([]);

  const { data: deployedContractData } = useDeployedContractInfo({
    contractName: "FruitTreeNFT",
  });
  const CONTRACT_ADDRESS = deployedContractData?.address;
  console.log(deployedContractData?.address);
  const { data: ownedTrees } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getTreeDetailsByOwner",
    args: [connectedAddress],
  });
  const { writeContractAsync: mintTree } = useScaffoldWriteContract({
    contractName: "FruitTreeNFT",
  });

  useEffect(() => {
    console.log(connectedAddress);
  }, []);

  async function HandleMintTree() {
    await mintTree({
      functionName: "mintTree",
      args: [selectedTree?.treeType, "https://example.com/token-uri.json"],
      value: selectedTree?.currentPrice,
    });
  }
  // Read contract data
  const {
    data: treeTypesData,
    isLoading,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getAllTreeTypes",
  });

  // Write contract function
  const { writeContract, isPending } = useWriteContract();

  // Tree metadata (images, descriptions, rarity)
  const treeMetadata = {
    0: { 
      imagePath: "/assets/mango.webp", 
      description: "Sweet mango trees with high returns and delicious fruit yields.", 
      rarity: "Rare" 
    },
    1: {
      imagePath: "/assets/coconut.webp",
      description: "Tropical coconut trees with steady yields and excellent drought resistance.",
      rarity: "Common",
    },
    2: {
      imagePath: "/assets/guava.webp",
      description: "Fast-growing guava with quick yields and multiple harvests per year.",
      rarity: "Common",
    },
    3: {
      imagePath: "/assets/rambutan.webp",
      description: "Exotic rambutan trees with premium tropical fruits and consistent returns.",
      rarity: "Epic",
    },
    4: {
      imagePath: "/assets/jackfruit.webp",
      description: "Large jackfruit trees with substantial yields and long-term growth potential.",
      rarity: "Epic",
    },
  };

  // Process contract data into usable format
  useEffect(() => {
    if (treeTypesData) {
      const [treeTypes, names, basePrices, currentPrices, baseAppreciations, produceAppreciations] = treeTypesData as [
        number[],
        string[],
        bigint[],
        bigint[],
        bigint[],
        bigint[],
      ];

      const processedTrees: TreeData[] = (treeTypes as number[]).map((treeType: number, index) => ({
        treeType,
        name: names[index],
        basePrice: basePrices[index],
        currentPrice: currentPrices[index],
        harvestCycleMonths: 6,
        profitRatePerCycle: produceAppreciations[index],
        yearlyAppreciation: Number(baseAppreciations[index]),
        imagePath: treeMetadata[treeType as keyof typeof treeMetadata]?.imagePath || "/assets/default-tree.webp",
        description: treeMetadata[treeType as keyof typeof treeMetadata]?.description || "A beautiful fruit tree.",
        rarity: treeMetadata[treeType as keyof typeof treeMetadata]?.rarity || "Common",
      }));

      setTrees(processedTrees);
    }
  }, [treeTypesData]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-600 bg-gray-100";
      case "Rare":
        return "text-blue-600 bg-blue-100";
      case "Epic":
        return "text-purple-600 bg-purple-100";
      case "Legendary":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const calculateAnnualReturn = (profitRate: bigint, cycleMonths: number) => {
    const cyclesPerYear = 12 / cycleMonths;
    const annualProfit = Number(formatEther(profitRate)) * cyclesPerYear;
    return annualProfit.toFixed(2);
  };

  const filteredTrees = trees
    .filter(tree => tree.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "cost":
          return Number(a.currentPrice - b.currentPrice);
        case "return":
          return b.yearlyAppreciation - a.yearlyAppreciation;
        case "yield":
          return a.harvestCycleMonths - b.harvestCycleMonths;
        default:
          return 0;
      }
    });

  const toggleFavorite = (treeType: number) => {
    setFavorites(prev => (prev.includes(treeType) ? prev.filter(id => id !== treeType) : [...prev, treeType]));
  };

  const handlePurchase = (tree: TreeData) => {
    setSelectedTree(tree);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    if (selectedTree && isConnected) {
      try {
        await mintTree({
          functionName: "mintTree",
          args: [selectedTree.treeType, `https://metadata.example.com/${selectedTree.treeType}.json`],
          value: selectedTree.currentPrice,
        });
        setShowPurchaseModal(false);
        setSelectedTree(null);
      } catch (error: any) {
        console.error("Mint error:", error);

        const message = error?.cause?.reason || "Transaction failed";
        toast.error(message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center">
        <div className="text-center">
          <SyncLoader color={`green`} size={10} aria-label="Loading Spinner" data-testid="loader" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">Error loading tree data</p>
          <p className="text-gray-600">Please make sure your wallet is connected and the contract is deployed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F1]">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-4">Buy Your Fruit Trees</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choose from our collection of fruit tree NFTs and start earning passive income
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trees..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as "cost" | "return" | "yield")}
              >
                <option value="cost">Sort by Cost</option>
                <option value="return">Sort by Appreciation</option>
                <option value="yield">Sort by Harvest Time</option>
              </select>
            </div>

            <div className="text-sm text-green-600">
              Showing {filteredTrees.length} of {trees.length} trees
            </div>
          </div>
        </div>

        {/* Tree Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrees.map(tree => (
            <div
              key={tree.treeType}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:scale-101"
            >
              <div className="relative p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 mr-3 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={tree.imagePath}
                        alt={tree.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Fallback to a default image if the specific fruit image is not found
                          e.currentTarget.src = "/assets/default-tree.webp";
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800">{tree.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(tree.rarity)}`}
                      >
                        {tree.rarity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(tree.treeType)}
                    className={`p-2 rounded-full ${favorites.includes(tree.treeType) ? "text-red-500" : "text-gray-400"} hover:bg-gray-100`}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(tree.treeType) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <p className="text-slate-600 text-sm mb-4">{tree.description}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Current Price</div>
                      <div className="font-semibold text-green-800">
                        {parseFloat(formatEther(tree.currentPrice)).toFixed(3)} tBNB
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Yearly Appreciation</div>
                      <div className="font-semibold text-green-800">{tree.yearlyAppreciation}%</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Harvest Cycle</div>
                      <div className="font-semibold text-green-800">{tree.harvestCycleMonths} months</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Leaf className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Profit/Cycle</div>
                      <div className="font-semibold text-green-800">
                        {parseFloat(formatEther(tree.profitRatePerCycle)).toFixed(3)} tBNB
                      </div>
                    </div>
                  </div>
                </div>

                {/* Annual Return Calculation */}
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Estimated Annual Profit</div>
                  <div className="font-bold text-green-700">
                    {calculateAnnualReturn(tree.profitRatePerCycle, tree.harvestCycleMonths)} tBNB/year
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePurchase(tree)}
                  disabled={!isConnected}
                  className={`w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 ${
                    isConnected
                      ? "bg-green-600 opacity-80 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {!isConnected ? "Connect Wallet" : isPending ? "Processing..." : "Buy Tree NFT"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedTree && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 relative rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={selectedTree.imagePath}
                  alt={selectedTree.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mt-2">{selectedTree.name}</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-semibold">
                  {parseFloat(formatEther(selectedTree.currentPrice)).toFixed(3)} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span>Harvest Cycle:</span>
                <span className="font-semibold">{selectedTree.harvestCycleMonths} months</span>
              </div>
              <div className="flex justify-between">
                <span>Profit per Cycle:</span>
                <span className="font-semibold">
                  {parseFloat(formatEther(selectedTree.profitRatePerCycle)).toFixed(3)} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span>Yearly Appreciation:</span>
                <span className="font-semibold">{selectedTree.yearlyAppreciation}%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={isPending}
                className="flex-1 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isPending ? "Processing..." : "Confirm Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyTree;
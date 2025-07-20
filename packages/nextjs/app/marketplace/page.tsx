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

// Extended Contract ABI including marketplace functions
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
  {
    name: "getMarketplaceGroupedData",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        components: [
          { name: "seller", type: "address" },
          { name: "treeType", type: "uint8" },
          { name: "quantity", type: "uint256" },
          { name: "averagePrice", type: "uint256" },
          { name: "tokenIds", type: "uint256[]" },
        ],
        name: "groups",
        type: "tuple[]",
      },
    ],
  },
  {
    name: "buyTreesFromSeller",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "seller", type: "address" },
      { name: "treeType", type: "uint8" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "listTreesForSale",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenIds", type: "uint256[]" }],
    outputs: [],
  },
  {
    name: "cancelListings",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenIds", type: "uint256[]" }],
    outputs: [],
  },
  {
    name: "getTreeDetailsByOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_owner", type: "address" }],
    outputs: [
      { name: "tokenIds", type: "uint256[]" },
      { name: "treeNames", type: "string[]" },
      { name: "currentValues", type: "uint256[]" },
      { name: "mintTimes", type: "uint256[]" },
    ],
  },
];

interface TreeData {
  treeType: number;
  name: string;
  basePrice: bigint;
  currentPrice: bigint;
  harvestCycleMonths: number;
  profitRatePerCycle: bigint;
  yearlyAppreciation: number;
  imageUrl: string;
  description: string;
  rarity: string;
}

interface MarketplaceListing {
  seller: string;
  treeType: number;
  quantity: number;
  averagePrice: bigint;
  tokenIds: number[];
}

const MarketplacePage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [selectedTree, setSelectedTree] = useState<TreeData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"cost" | "return" | "yield">("cost");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [selectedTokenIds, setSelectedTokenIds] = useState<number[]>([]);

  const { data: deployedContractData } = useDeployedContractInfo({
    contractName: "FruitTreeNFT",
  });
  const CONTRACT_ADDRESS = deployedContractData?.address;

  // Fetch marketplace listings
  const { data: marketplaceListings } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getMarketplaceGroupedData",
  });

  // Fetch user's owned trees
  const { data: ownedTreesData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getTreeDetailsByOwner",
    args: [connectedAddress],
  });

  const { writeContractAsync: buyTrees } = useScaffoldWriteContract({
    contractName: "FruitTreeNFT",
  });

  const { writeContractAsync: listTrees } = useScaffoldWriteContract({
    contractName: "FruitTreeNFT",
  });

  const { writeContractAsync: cancelListings } = useScaffoldWriteContract({
    contractName: "FruitTreeNFT",
  });

  useEffect(() => {
    if (marketplaceListings) {
      const processedListings = marketplaceListings.map((listing: any) => ({
        seller: listing.seller,
        treeType: Number(listing.treeType),
        quantity: Number(listing.quantity),
        averagePrice: BigInt(listing.averagePrice),
        tokenIds: listing.tokenIds.map((id: any) => Number(id)),
      }));
      setListings(processedListings);
    }
  }, [marketplaceListings]);

  // Read contract data for tree types
  const {
    data: treeTypesData,
    isLoading,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getAllTreeTypes",
  });

  // Tree metadata (images, descriptions, rarity)
  const treeMetadata = {
    0: { 
      imageUrl: "/assets/mango.webp", 
      description: "Sweet mango trees with high returns and delicious fruit yields.", 
      rarity: "Rare" 
    },
    1: {
      imageUrl: "/assets/coconut.webp",
      description: "Tropical coconut trees with steady yields and excellent drought resistance.",
      rarity: "Common",
    },
    2: {
      imageUrl: "/assets/guava.webp",
      description: "Fast-growing guava with quick yields and multiple harvests per year.",
      rarity: "Common",
    },
    3: {
      imageUrl: "/assets/rambutan.webp",
      description: "Exotic rambutan trees with premium tropical fruits and consistent returns.",
      rarity: "Epic",
    },
    4: {
      imageUrl: "/assets/jackfruit.webp",
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
        imageUrl: treeMetadata[treeType as keyof typeof treeMetadata]?.imageUrl || "/assets/default-tree.webp",
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

  const filteredListings = listings.filter(listing => {
    const tree = trees.find(t => t.treeType === listing.treeType);
    return tree && tree.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleFavorite = (treeType: number) => {
    setFavorites(prev => (prev.includes(treeType) ? prev.filter(id => id !== treeType) : [...prev, treeType]));
  };

  const handlePurchaseFromMarketplace = async (listing: MarketplaceListing) => {
    try {
      await buyTrees({
        functionName: "buyTreesFromSeller",
        args: [listing.seller, listing.treeType, 1],
        value: listing.averagePrice,
      });
      toast.success("Purchase successful!");
    } catch (error: any) {
      console.error("Purchase error:", error);
      const message = error?.cause?.reason || "Transaction failed";
      toast.error(message);
    }
  };

  const handleListTrees = async () => {
    if (selectedTokenIds.length === 0) {
      toast.error("Please select at least one tree to list");
      return;
    }

    try {
      await listTrees({
        functionName: "listTreesForSale",
        args: [selectedTokenIds],
      });
      toast.success("Trees listed successfully!");
      setSelectedTokenIds([]);
    } catch (error: any) {
      console.error("Listing error:", error);
      const message = error?.cause?.reason || "Transaction failed";
      toast.error(message);
    }
  };

  const handleCancelListings = async (tokenIds: bigint[]) => {
    try {
      await cancelListings({
        functionName: "cancelListings",
        args: [tokenIds],
      });
      toast.success("Listings cancelled successfully!");
    } catch (error: any) {
      console.error("Cancellation error:", error);
      const message = error?.cause?.reason || "Transaction failed";
      toast.error(message);
    }
  };

  const toggleTokenSelection = (tokenId: number) => {
    setSelectedTokenIds(prev => (prev.includes(tokenId) ? prev.filter(id => id !== tokenId) : [...prev, tokenId]));
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grey-50 to-white-50 flex items-center justify-center">
        <div className="text-center">
          <SyncLoader color={`green`} size={10} aria-label="Loading Spinner" data-testid="loader" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">Error loading marketplace data</p>
          <p className="text-gray-600">Please make sure your wallet is connected and the contract is deployed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grey-50 to-white-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-4">Fruit Tree Marketplace</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {activeTab === "buy"
              ? "Browse and purchase fruit tree NFTs from other growers"
              : "List your fruit tree NFTs for sale"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "buy" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("buy")}
          >
            Buy Trees
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "sell" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("sell")}
          >
            Sell Your Trees
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === "buy" ? "Search listings..." : "Search your trees..."}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {activeTab === "buy" && (
                <select
                  className="px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as "cost" | "return" | "yield")}
                >
                  <option value="cost">Sort by Cost</option>
                  <option value="return">Sort by Appreciation</option>
                  <option value="yield">Sort by Harvest Time</option>
                </select>
              )}
            </div>

            <div className="text-sm text-green-600">
              {activeTab === "buy"
                ? `Showing ${filteredListings.length} of ${listings.length} listings`
                : `You have ${ownedTreesData?.[0]?.length || 0} trees`}
            </div>
          </div>
        </div>

        {activeTab === "buy" ? (
          /* BUY TAB CONTENT */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map((listing, index) => {
              const tree = trees.find(t => t.treeType === listing.treeType);
              if (!tree) return null;

              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:scale-101"
                >
                  <div className="relative p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 mr-3 relative">
                          <Image
                            src={tree.imageUrl}
                            alt={tree.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              // Fallback to a default image if the WebP fails to load
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

                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span>Sold by:</span>
                        <Address address={listing.seller} className="ml-2" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Available: {listing.quantity} tree{listing.quantity !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                        <div>
                          <div className="text-xs text-gray-500">Price</div>
                          <div className="font-semibold text-green-800">
                            {parseFloat(formatEther(listing.averagePrice)).toFixed(3)} tBNB
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
                      onClick={() => handlePurchaseFromMarketplace(listing)}
                      disabled={!isConnected}
                      className={`w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 ${
                        isConnected
                          ? "bg-green-600 opacity-80 hover:bg-green-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {!isConnected ? "Connect Wallet" : "Buy Tree"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* SELL TAB CONTENT */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-green-800 mb-4">Your Trees</h2>

              {ownedTreesData && ownedTreesData[0]?.length > 0 ? (
                <div className="space-y-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ownedTreesData[0].map((tokenId, index) => {
                      // Find the corresponding tree data to get the image
                      const treeName = ownedTreesData[1][index];
                      const correspondingTree = trees.find(t => t.name === treeName);
                      
                      return (
                        <div
                          key={tokenId}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedTokenIds.includes(Number(tokenId))
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleTokenSelection(Number(tokenId))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {correspondingTree && (
                                <div className="w-10 h-10 mr-3 relative">
                                  <Image
                                    src={correspondingTree.imageUrl}
                                    alt={correspondingTree.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.src = "/assets/default-tree.webp";
                                    }}
                                  />
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium">{ownedTreesData[1][index]}</h3>
                                <p className="text-sm text-gray-600">Token ID: {tokenId.toString()}</p>
                                <p className="text-sm text-gray-600">
                                  Value: {parseFloat(formatEther(ownedTreesData[2][index])).toFixed(3)} tBNB
                                </p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedTokenIds.includes(Number(tokenId))}
                              onChange={() => toggleTokenSelection(Number(tokenId))}
                              className="h-5 w-5 text-green-600 rounded"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleListTrees}
                      disabled={selectedTokenIds.length === 0 || !isConnected}
                      className={`px-6 py-3 rounded-full font-semibold ${
                        selectedTokenIds.length > 0 && isConnected
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      List Selected Trees
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">You don't own any trees yet.</p>
                  <Link href="/buy" className="text-green-600 hover:underline mt-2 inline-block">
                    Buy your first tree
                  </Link>
                </div>
              )}

              {/* Active Listings Section */}
              {listings.filter(l => l.seller === connectedAddress).length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-bold text-green-800 mb-4">Your Active Listings</h2>
                  <div className="space-y-4">
                    {listings
                      .filter(l => l.seller === connectedAddress)
                      .map((listing, index) => {
                        const tree = trees.find(t => t.treeType === listing.treeType);
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {tree && (
                                  <div className="w-10 h-10 mr-3 relative">
                                    <Image
                                      src={tree.imageUrl}
                                      alt={tree.name}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover rounded-lg"
                                      onError={(e) => {
                                        e.currentTarget.src = "/assets/default-tree.webp";
                                      }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-medium">{tree?.name || "Unknown Tree"}</h3>
                                  <p className="text-sm text-gray-600">
                                    {listing.quantity} tree{listing.quantity !== 1 ? "s" : ""} listed
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Average price: {parseFloat(formatEther(listing.averagePrice)).toFixed(3)} tBNB
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleCancelListings(listing.tokenIds)}
                                className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm font-medium hover:bg-red-200"
                              >
                                Cancel Listing
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketplacePage;
"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const treeMetadata = {
  0: { emoji: "🥭", description: "Sweet mango trees with high returns and delicious fruit yields.", rarity: "Rare" },
  1: {
    emoji: "🥥",
    description: "Tropical coconut trees with steady yields and excellent drought resistance.",
    rarity: "Common",
  },
  2: {
    emoji: "🍈",
    description: "Fast-growing guava with quick yields and multiple harvests per year.",
    rarity: "Common",
  },
  3: {
    emoji: "🌺",
    description: "Exotic rambutan trees with premium tropical fruits and consistent returns.",
    rarity: "Epic",
  },
  4: {
    emoji: "🍈",
    description: "Large jackfruit trees with substantial yields and long-term growth potential.",
    rarity: "Epic",
  },
};

const contractABI = [
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "getTreeDetailsByOwner",
    outputs: [
      { name: "tokenIds", type: "uint256[]" },
      { name: "treeNames", type: "string[]" },
      { name: "currentValues", type: "uint256[]" },
      { name: "mintTimes", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
interface TreeData {
  tokenId: number;
  name: string;
  value: number;
  emoji: string;
  rarity: string;
  description: string;
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: TreeData | null;
  availableQuantity: number;
  onConfirmSell: (tokenId: number, quantity: number) => void;
}

const SellModal = ({ isOpen, onClose, tree, availableQuantity, onConfirmSell }: SellModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen || !tree) return null;

  const handleSell = async () => {
    if (!tree) return;
    setIsConfirming(true);
    // Simulate transaction time
    setTimeout(() => {
      onConfirmSell(tree.tokenId, quantity); // Pass quantity here
      setIsConfirming(false);
      onClose();
    }, 2000);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Epic":
        return "from-indigo-600/10 to-purple-600/10";
      case "Rare":
        return "from-amber-600/10 to-orange-600/10";
      default:
        return "from-emerald-600/10 to-green-600/10";
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "Epic":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Rare":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-md h-[600px] transform transition-all duration-300 scale-100 flex flex-col">
        <div className="p-8 overflow-y-auto flex-1">
          {/* Tree Info */}
          <div className="space-y-4 mb-6">
            <div
              className={`bg-slate-50/80 rounded-2xl p-4 border ${getRarityBadgeColor(tree.rarity)} ${getRarityColor(tree.rarity)}`}
            >
              <h3 className="font-semibold text-slate-800 mb-1">{tree.name}</h3>
              <p className="text-sm text-slate-600">{tree.description}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`bg-gradient-to-br ${getRarityColor(tree.rarity)} rounded-xl p-4 border border-slate-200/40`}
              >
                <div className="text-lg font-bold text-slate-800">{tree.value} ETH</div>
                <div className="text-xs text-slate-600">Current Value</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Token ID</span>
                <span className="text-sm font-semibold text-slate-800">#{tree.tokenId}</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector - Add this entire block */}
          {availableQuantity > 1 && (
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Quantity to Sell</span>
                <span className="text-xs text-slate-500">Available: {availableQuantity}</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 font-semibold"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-bold text-slate-800">{quantity}</span>
                </div>
                <button
                  onClick={() => setQuantity(Math.min(availableQuantity, quantity + 1))}
                  disabled={quantity >= availableQuantity}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 font-semibold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Sale Price Breakdown */}
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-2xl p-4 border border-amber-200/60 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-amber-700">Base Price ({quantity}x)</span>
              <span className="text-sm font-semibold text-amber-800">{(tree.value * quantity).toFixed(4)} ETH</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-amber-700">Platform Fee (2.5%)</span>
              <span className="text-sm font-semibold text-amber-800">
                -{(tree.value * quantity * 0.025).toFixed(4)} ETH
              </span>
            </div>
            <hr className="border-amber-200 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-amber-800">You'll Receive</span>
              <span className="text-lg font-bold text-amber-900">{(tree.value * quantity * 0.975).toFixed(4)} ETH</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSell}
              disabled={isConfirming}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isConfirming ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Selling...</span>
                </div>
              ) : (
                "Confirm Sale"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [treeData, setTreeData] = useState<TreeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTree, setSelectedTree] = useState<TreeData | null>(null);
  const [isSellModalOpen, setSellModalOpen] = useState(false);

  const { data: deployedContractData } = useDeployedContractInfo({
    contractName: "FruitTreeNFT",
  });
  const CONTRACT_ADDRESS = deployedContractData?.address;
  console.log(CONTRACT_ADDRESS);
  const { data: ownedTrees } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getTreeDetailsByOwner",
    args: [connectedAddress],
  });

  useEffect(() => {
    if (ownedTrees) {
      const [tokenIds, treeNames, currentValues, mintTimes] = ownedTrees as [bigint[], string[], bigint[], bigint[]];

      const processedTrees: TreeData[] = tokenIds.map((tokenId, index) => {
        const treeName = treeNames[index];
        let emoji = "🌳";
        let rarity = "Common";
        let description = "A beautiful tree with great potential.";

        // Map tree metadata
        if (treeName.toLowerCase().includes("mango")) {
          emoji = treeMetadata[0].emoji;
          rarity = treeMetadata[0].rarity;
          description = treeMetadata[0].description;
        } else if (treeName.toLowerCase().includes("coconut")) {
          emoji = treeMetadata[1].emoji;
          rarity = treeMetadata[1].rarity;
          description = treeMetadata[1].description;
        } else if (treeName.toLowerCase().includes("guava")) {
          emoji = treeMetadata[2].emoji;
          rarity = treeMetadata[2].rarity;
          description = treeMetadata[2].description;
        } else if (treeName.toLowerCase().includes("rambutan")) {
          emoji = treeMetadata[3].emoji;
          rarity = treeMetadata[3].rarity;
          description = treeMetadata[3].description;
        } else if (treeName.toLowerCase().includes("jackfruit")) {
          emoji = treeMetadata[4].emoji;
          rarity = treeMetadata[4].rarity;
          description = treeMetadata[4].description;
        }

        return {
          tokenId: Number(tokenId),
          name: treeName,
          value: Number(currentValues[index]) / 1e18,
          emoji,
          rarity,
          description,
        };
      });

      setTreeData(processedTrees);
      setIsLoading(false);
    }
  }, [ownedTrees]);

  const handleSellClick = (tree: TreeData) => {
    setSelectedTree(tree);
    setSellModalOpen(true);
  };

  const handleConfirmSell = (tokenId: number, quantity: number) => {
    const treeName = treeData.find(t => t.tokenId === tokenId)?.name;

    if (treeName) {
      // Remove the specified quantity of trees of this type
      const treesOfType = treeData.filter(t => t.name === treeName);
      const treesToRemove = treesOfType.slice(0, quantity).map(t => t.tokenId);

      setTreeData(prev => prev.filter(tree => !treesToRemove.includes(tree.tokenId)));
      console.log(`${quantity} ${treeName}(s) sold successfully!`);
    }
  };

  // Group trees by name for display
  const groupedTrees = treeData.reduce(
    (acc: Record<string, { trees: TreeData[]; emoji: string; rarity: string }>, tree) => {
      if (acc[tree.name]) {
        acc[tree.name].trees.push(tree);
      } else {
        acc[tree.name] = {
          trees: [tree],
          emoji: tree.emoji,
          rarity: tree.rarity,
        };
      }
      return acc;
    },
    {},
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Epic":
        return "from-indigo-600/10 to-purple-600/10";
      case "Rare":
        return "from-amber-600/10 to-orange-600/10";
      default:
        return "from-emerald-600/10 to-green-600/10";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "Epic":
        return "border-indigo-200";
      case "Rare":
        return "border-amber-200";
      default:
        return "border-emerald-200";
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "Epic":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Rare":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
        {/* Subtle Background Patterns */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/3 right-20 w-40 h-40 bg-green-100/40 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-32 left-1/4 w-24 h-24 bg-teal-100/50 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto py-12 my-20">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="xl:col-span-1">
              <div className="group relative">
                <div className="absolute -inset-px bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-3xl blur-sm opacity-0 transition-all duration-700"></div>
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 transition-all duration-500 group-hover:shadow-xl">
                  <div className="text-center mb-8">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg transform transition-transform duration-300 group-hover:scale-105">
                        🌱
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">Orchard Manager</h2>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mx-auto"></div>
                  </div>

                  {isConnected ? (
                    <div className="space-y-6">
                      <div className="transform transition-all duration-300">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                          Cultivator
                        </p>
                        <p className="text-xl font-medium text-slate-800">Guest Farmer</p>
                      </div>

                      <div className="transform transition-all duration-300">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                          Wallet Address
                        </p>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-inner transition-all duration-300">
                          <Address address={connectedAddress} />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-2xl p-6 border border-emerald-200/60 transition-all duration-300 hover:shadow-md group/stat">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
                              Collection Size
                            </p>
                            <p className="text-3xl font-bold text-emerald-800 transition-all duration-300">
                              {treeData.length}
                            </p>
                            <p className="text-sm text-emerald-600/80">Tree NFT{treeData.length !== 1 && "s"}</p>
                          </div>
                          <div className="text-3xl opacity-20 transition-all duration-300 group-hover/stat:opacity-40 group-hover/stat:scale-110">
                            🌳
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                        🔒
                      </div>
                      <p className="text-slate-600 font-medium">Please connect your wallet to view your orchard</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trees Collection */}
            <div className="xl:col-span-2">
              <div className="group relative">
                <div className="absolute -inset-px bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-2xl blur-sm opacity-0 transition-all duration-700"></div>
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 transition-all duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-semibold text-slate-800">Tree Collection</h2>
                    <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200/60">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-emerald-700 font-medium">Live</span>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="relative">
                        <div className="w-12 h-12 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xl">🌱</div>
                        </div>
                      </div>
                    </div>
                  ) : treeData.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl">
                        🌱
                      </div>
                      <h3 className="text-xl font-medium text-slate-700 mb-2">No trees planted yet</h3>
                      <p className="text-slate-500">Start building your digital orchard today</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(groupedTrees).map(([treeName, { trees, emoji, rarity }], index) => (
                        <div
                          key={index}
                          className="group/card relative animate-fade-in-up"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div
                            className={`absolute -inset-px bg-gradient-to-r ${getRarityColor(rarity)} rounded-2xl blur-sm opacity-0 group-hover/card:opacity-100 transition-all duration-500`}
                          ></div>
                          <div
                            className={`relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border ${getRarityBorder(rarity)} shadow-sm transition-all duration-300 group-hover/card:shadow-md group-hover/card:-translate-y-1`}
                          >
                            <div className="text-center">
                              <div className="text-4xl mb-4 transform transition-all duration-300 group-hover/card:scale-110 group-hover/card:rotate-12">
                                {emoji}
                              </div>
                              <div
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${getRarityBadgeColor(rarity)} transition-all duration-300 group-hover/card:shadow-sm`}
                              >
                                {rarity}
                              </div>
                              <h3 className="font-semibold text-slate-800 mb-3 text-base leading-snug transition-colors duration-300 group-hover/card:text-emerald-700">
                                {treeName}
                              </h3>
                              <div className="flex items-center justify-center space-x-3 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl text-white text-sm font-bold shadow-md transition-all duration-300 group-hover/card:shadow-lg">
                                  {trees.length}
                                </div>
                                <span className="text-slate-600 text-sm font-medium">
                                  Tree{trees.length > 1 ? "s" : ""}
                                </span>
                              </div>

                              {/* Sell Button */}
                              <button
                                onClick={() => handleSellClick(trees[0])} // Sell the first tree of this type
                                className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0"
                              >
                                💰 Sell Tree
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          {treeData.length > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 group/stat">
                <div className="text-3xl mb-3 transition-all duration-300 group-hover/stat:scale-110">🌳</div>
                <div className="text-2xl font-bold text-slate-800">{treeData.length}</div>
                <div className="text-slate-600 font-medium">Total Trees</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 group/stat">
                <div className="text-3xl mb-3 transition-all duration-300 group-hover/stat:scale-110">🎯</div>
                <div className="text-2xl font-bold text-slate-800">{Object.keys(groupedTrees).length}</div>
                <div className="text-slate-600 font-medium">Unique Varieties</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 group/stat">
                <div className="text-3xl mb-3 transition-all duration-300 group-hover/stat:scale-110">🌿</div>
                <div className="text-2xl font-bold text-slate-800">Active</div>
                <div className="text-slate-600 font-medium">Garden Status</div>
              </div>
            </div>
          )}
          <SellModal
            isOpen={isSellModalOpen}
            onClose={() => setSellModalOpen(false)}
            tree={selectedTree}
            availableQuantity={selectedTree ? treeData.filter(t => t.name === selectedTree.name).length : 0}
            onConfirmSell={handleConfirmSell}
          />
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
            opacity: 0;
            animation-fill-mode: forwards;
          }
        `}</style>
      </div>
    </>
  );
};

export default ProfilePage;

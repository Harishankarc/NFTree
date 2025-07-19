'use client';
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useReadContract } from "wagmi";

const treeMetadata = {
  0: { emoji: "🥭", description: "Sweet mango trees with high returns and delicious fruit yields.", rarity: "Rare" },
  1: { emoji: "🥥", description: "Tropical coconut trees with steady yields and excellent drought resistance.", rarity: "Common" },
  2: { emoji: "🍈", description: "Fast-growing guava with quick yields and multiple harvests per year.", rarity: "Common" },
  3: { emoji: "🌺", description: "Exotic rambutan trees with premium tropical fruits and consistent returns.", rarity: "Epic" },
  4: { emoji: "🍈", description: "Large jackfruit trees with substantial yields and long-term growth potential.", rarity: "Epic" },
};

const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as const;
const contractABI = [
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "getTreeDetailsByOwner",
    outputs: [
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "string[]", name: "treeNames", type: "string[]" },
      { internalType: "uint256[]", name: "currentValues", type: "uint256[]" },
      { internalType: "uint256[]", name: "availableHarvestsArray", type: "uint256[]" },
      { internalType: "uint256[]", name: "totalHarvestsArray", type: "uint256[]" },
      { internalType: "uint256[]", name: "nextHarvestTimes", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const ProfilePage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [treeNames, setTreeNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: ownedTrees } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getTreeDetailsByOwner",
    args: [connectedAddress],
  });

  useEffect(() => {
    if (ownedTrees) {
      const [, fetchedTreeNames] = ownedTrees as [any[], string[]];
      setTreeNames(fetchedTreeNames);
      setIsLoading(false);
    }
  }, [ownedTrees]);

  // Grouping trees and counting duplicates
  const groupedTrees = treeNames.reduce((acc: Record<string, { count: number; emoji: string; rarity: string }>, treeName) => {
    const metadataEntry = Object.values(treeMetadata).find(meta => treeName.toLowerCase().includes(meta.description.split(" ")[0].toLowerCase()));
    const emoji = metadataEntry?.emoji || "🌳";
    const rarity = metadataEntry?.rarity || "Common";

    if (acc[treeName]) {
      acc[treeName].count += 1;
    } else {
      acc[treeName] = { count: 1, emoji, rarity };
    }

    return acc;
  }, {});

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Epic": return "from-purple-500 to-pink-500";
      case "Rare": return "from-yellow-400 to-orange-500";
      default: return "from-green-400 to-emerald-500";
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "Epic": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Rare": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-16 w-64 h-64 bg-gradient-to-br from-teal-200/30 to-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-16 right-1/4 w-48 h-48 bg-gradient-to-br from-green-200/30 to-emerald-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            Your Digital Orchard
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover and manage your premium fruit tree NFT collection in this immersive dashboard experience
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="xl:col-span-1">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                    🌱
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Orchard Manager</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto"></div>
                </div>

                {isConnected ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Farmer Name</p>
                      <p className="text-xl font-semibold text-gray-800">Guest Cultivator</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Wallet Address</p>
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200/50 shadow-inner">
                        <Address address={connectedAddress} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Collection Size</p>
                          <p className="text-3xl font-bold text-emerald-800">{treeNames.length}</p>
                          <p className="text-sm text-emerald-600">Tree NFT{treeNames.length !== 1 && "s"}</p>
                        </div>
                        <div className="text-4xl opacity-20">🌳</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                      🔒
                    </div>
                    <p className="text-amber-600 font-medium">Please connect your wallet to view your orchard</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trees Collection */}
          <div className="xl:col-span-2">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">My Fruit Trees</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500">Live Collection</span>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-2xl">🌱</div>
                      </div>
                    </div>
                  </div>
                ) : treeNames.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl opacity-50">
                      🌱
                    </div>
                    <p className="text-xl text-gray-500 mb-2">No trees planted yet</p>
                    <p className="text-gray-400">Start building your digital orchard today!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedTrees).map(([treeName, { count, emoji, rarity }], index) => (
                      <div key={index} className="group relative">
                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${getRarityColor(rarity)} rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500`}></div>
                        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 transform group-hover:scale-105 transition duration-300">
                          <div className="text-center">
                            <div className="text-5xl mb-4 transform group-hover:scale-110 transition duration-300">
                              {emoji}
                            </div>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mb-3 ${getRarityBadgeColor(rarity)}`}>
                              {rarity}
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2 text-lg leading-tight">
                              {treeName}
                            </h3>
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {count}
                              </div>
                              <span className="text-gray-600 text-sm">
                                Tree{count > 1 ? "s" : ""}
                              </span>
                            </div>
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
        {treeNames.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 text-center">
              <div className="text-3xl mb-2">🌳</div>
              <div className="text-2xl font-bold text-gray-800">{treeNames.length}</div>
              <div className="text-gray-600">Total Trees</div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-gray-800">{Object.keys(groupedTrees).length}</div>
              <div className="text-gray-600">Unique Varieties</div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
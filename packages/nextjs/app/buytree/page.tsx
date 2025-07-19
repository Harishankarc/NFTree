"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useState, useEffect } from 'react';
import {
  Leaf,
  TreePine,
  Coins,
  TrendingUp,
  Shield,
  Users,
  Wallet,
  CheckCircle,
  ArrowLeft,
  Info,
  Clock,
  DollarSign,
  Calendar,
  Star,
  ShoppingCart,
  Heart,
  Filter,
  Search
} from 'lucide-react';
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const BuyTree: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [selectedTree, setSelectedTree] = useState<TreeType | null>(null);
  const [cart, setCart] = useState<TreeType[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'cost' | 'return' | 'yield'>('cost');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [totalBalance, setTotalBalance] = useState('2.5'); // Mock balance

  type TreeType = {
    id: string;
    name: string;
    emoji: string;
    initialCost: string;
    costInTBNB: number;
    yieldYears: string;
    annualReturn: string;
    description: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    category: 'Tropical' | 'Temperate' | 'Exotic' | 'Premium';
    maturityTime: string;
    expectedLifespan: string;
    climateImpact: string;
    available: number;
    sold: number;
  };

  const treeTypes: TreeType[] = [
    {
      id: '1',
      name: 'Coconut Tree',
      emoji: '🥥',
      initialCost: '0.5 TBNB',
      costInTBNB: 0.5,
      yieldYears: '3-5 years',
      annualReturn: '15-20%',
      description: 'Tropical coconut trees with steady yields and excellent drought resistance.',
      rarity: 'Common',
      category: 'Tropical',
      maturityTime: '3 years',
      expectedLifespan: '60-80 years',
      climateImpact: '2.5 tons CO2/year',
      available: 250,
      sold: 180
    },
    {
      id: '2',
      name: 'Mango Tree',
      emoji: '🥭',
      initialCost: '0.8 TBNB',
      costInTBNB: 0.8,
      yieldYears: '2-4 years',
      annualReturn: '18-25%',
      description: 'Sweet mango trees with high returns and delicious fruit yields.',
      rarity: 'Rare',
      category: 'Tropical',
      maturityTime: '2 years',
      expectedLifespan: '100+ years',
      climateImpact: '3.2 tons CO2/year',
      available: 150,
      sold: 95
    },
    {
      id: '3',
      name: 'Guava Tree',
      emoji: '🍈',
      initialCost: '0.3 TBNB',
      costInTBNB: 0.3,
      yieldYears: '2-3 years',
      annualReturn: '12-18%',
      description: 'Fast-growing guava with quick yields and multiple harvests per year.',
      rarity: 'Common',
      category: 'Tropical',
      maturityTime: '18 months',
      expectedLifespan: '30-40 years',
      climateImpact: '1.8 tons CO2/year',
      available: 300,
      sold: 220
    },
    {
      id: '4',
      name: 'Apple Tree',
      emoji: '🍎',
      initialCost: '1.2 TBNB',
      costInTBNB: 1.2,
      yieldYears: '4-6 years',
      annualReturn: '20-30%',
      description: 'Premium apple trees with excellent returns and premium fruit quality.',
      rarity: 'Epic',
      category: 'Temperate',
      maturityTime: '4 years',
      expectedLifespan: '50-80 years',
      climateImpact: '3.8 tons CO2/year',
      available: 100,
      sold: 45
    },
    {
      id: '5',
      name: 'Dragon Fruit Tree',
      emoji: '🐉',
      initialCost: '2.5 TBNB',
      costInTBNB: 2.5,
      yieldYears: '1-2 years',
      annualReturn: '35-45%',
      description: 'Exotic dragon fruit cactus with premium yields and unique appearance.',
      rarity: 'Legendary',
      category: 'Exotic',
      maturityTime: '1 year',
      expectedLifespan: '20-30 years',
      climateImpact: '1.2 tons CO2/year',
      available: 50,
      sold: 12
    },
    {
      id: '6',
      name: 'Avocado Tree',
      emoji: '🥑',
      initialCost: '1.8 TBNB',
      costInTBNB: 1.8,
      yieldYears: '3-4 years',
      annualReturn: '22-28%',
      description: 'Premium avocado trees with high market demand and consistent yields.',
      rarity: 'Epic',
      category: 'Premium',
      maturityTime: '3 years',
      expectedLifespan: '50-100 years',
      climateImpact: '2.8 tons CO2/year',
      available: 75,
      sold: 31
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-600 bg-gray-100';
      case 'Rare': return 'text-blue-600 bg-blue-100';
      case 'Epic': return 'text-purple-600 bg-purple-100';
      case 'Legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredTrees = treeTypes
    .filter(tree => tree.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'cost': return a.costInTBNB - b.costInTBNB;
        case 'return': return parseFloat(b.annualReturn.split('-')[1]) - parseFloat(a.annualReturn.split('-')[1]);
        case 'yield': return parseFloat(a.yieldYears.split('-')[0]) - parseFloat(b.yieldYears.split('-')[0]);
        default: return 0;
      }
    });

  const addToCart = (tree: TreeType) => {
    setCart(prev => [...prev, tree]);
  };

  const removeFromCart = (treeId: string) => {
    setCart(prev => prev.filter(tree => tree.id !== treeId));
  };

  const toggleFavorite = (treeId: string) => {
    setFavorites(prev =>
      prev.includes(treeId)
        ? prev.filter(id => id !== treeId)
        : [...prev, treeId]
    );
  };

  const handlePurchase = (tree: TreeType) => {
    setSelectedTree(tree);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    if (selectedTree && isConnected) {
      const totalCost = selectedTree.costInTBNB * purchaseQuantity;
      if (totalCost <= parseFloat(totalBalance)) {
        // Here you would integrate with your smart contract
        console.log(`Purchasing ${purchaseQuantity} ${selectedTree.name}(s) for ${totalCost} TBNB`);
        setShowPurchaseModal(false);
        setPurchaseQuantity(1);
        setSelectedTree(null);
        // Update balance (in real implementation, this would come from blockchain)
        setTotalBalance(prev => (parseFloat(prev) - totalCost).toString());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-green-700 hover:text-green-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-semibold">Back to Home</span>
            </Link>

            <div className="flex items-center space-x-4">
              {/* Balance Display */}
              <div className="bg-green-100 px-4 py-2 rounded-full">
                <span className="text-green-700 font-semibold">Balance: {totalBalance} TBNB</span>
              </div>

              {/* Cart */}
              <div className="relative">
                <button className="flex items-center bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart ({cart.length})
                </button>
              </div>

              {/* Wallet Status */}
              {isConnected && connectedAddress ? (
                <div className="flex items-center bg-green-100 px-4 py-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <Address address={connectedAddress} />
                </div>
              ) : (
                <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full">
                  <Wallet className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-yellow-700">Connect Wallet</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-4">Buy Your Trees</h1>
          <p className="text-xl text-green-600 max-w-2xl mx-auto">
            Choose from our collection of virtual trees and start your investment journey today
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trees..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'cost' | 'return' | 'yield')}
              >
                <option value="cost">Sort by Cost</option>
                <option value="return">Sort by Return</option>
                <option value="yield">Sort by Yield Time</option>
              </select>
            </div>

            <div className="text-sm text-green-600">
              Showing {filteredTrees.length} of {treeTypes.length} trees
            </div>
          </div>
        </div>

        {/* Tree Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrees.map((tree) => (
            <div key={tree.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              {/* Tree Card Header */}
              <div className="relative p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <span className="text-4xl mr-3">{tree.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-green-800">{tree.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(tree.rarity)}`}>
                        {tree.rarity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(tree.id)}
                    className={`p-2 rounded-full ${favorites.includes(tree.id) ? 'text-red-500' : 'text-gray-400'} hover:bg-gray-100`}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(tree.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <p className="text-green-600 text-sm mb-4">{tree.description}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Cost</div>
                      <div className="font-semibold text-green-800">{tree.initialCost}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Annual Return</div>
                      <div className="font-semibold text-green-800">{tree.annualReturn}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Yield Time</div>
                      <div className="font-semibold text-green-800">{tree.yieldYears}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Leaf className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">CO2 Impact</div>
                      <div className="font-semibold text-green-800">{tree.climateImpact}</div>
                    </div>
                  </div>
                </div>

                {/* Availability Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Available: {tree.available - tree.sold}</span>
                    <span>{tree.sold} sold</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(tree.sold / tree.available) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePurchase(tree)}
                    disabled={!isConnected || tree.costInTBNB > parseFloat(totalBalance)}
                    className={`flex-1 py-3 px-4 rounded-full font-semibold transition-all duration-300 ${isConnected && tree.costInTBNB <= parseFloat(totalBalance)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {!isConnected ? 'Connect Wallet' : tree.costInTBNB > parseFloat(totalBalance) ? 'Insufficient Balance' : 'Buy Now'}
                  </button>
                  <button
                    onClick={() => addToCart(tree)}
                    className="px-4 py-3 border-2 border-green-600 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
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
              <span className="text-4xl">{selectedTree.emoji}</span>
              <h3 className="text-2xl font-bold text-green-800 mt-2">{selectedTree.name}</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Price per tree:</span>
                <span className="font-semibold">{selectedTree.initialCost}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Quantity:</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{purchaseQuantity}</span>
                  <button
                    onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{(selectedTree.costInTBNB * purchaseQuantity).toFixed(1)} TBNB</span>
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
                className="flex-1 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyTree;
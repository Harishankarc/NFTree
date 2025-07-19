"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useState, useEffect } from 'react';
import { Leaf, TreePine, Coins, TrendingUp, Shield, Users, Wallet, CheckCircle } from 'lucide-react';
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import {gsap} from "gsap";

const Landing: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [selectedTree, setSelectedTree] = useState<TreeType | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  type TreeType = {
    name: string;
    emoji: string;
    initialCost: string;
    yieldYears: string;
    annualReturn: string;
    description: string;
  };

  const treeTypes = [
    {
      name: 'Coconut Tree',
      emoji: '🥥',
      initialCost: '0.5 TBNB',
      yieldYears: '3-5 years',
      annualReturn: '15-20%',
      description: 'Tropical coconut trees with steady yields'
    },
    {
      name: 'Mango Tree',
      emoji: '🥭',
      initialCost: '0.8 TBNB',
      yieldYears: '2-4 years',
      annualReturn: '18-25%',
      description: 'Sweet mango trees with high returns'
    },
    {
      name: 'Guava Tree',
      emoji: '🍈',
      initialCost: '0.3 TBNB',
      yieldYears: '2-3 years',
      annualReturn: '12-18%',
      description: 'Fast-growing guava with quick yields'
    },
    {
      name: 'Apple Tree',
      emoji: '🍎',
      initialCost: '1.2 TBNB',
      yieldYears: '4-6 years',
      annualReturn: '20-30%',
      description: 'Premium apple trees with excellent returns'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Wallet Connection Status */}
          <div className="mb-6">
            {!isMounted ? (
              // Show neutral state during hydration
              <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full px-6 py-3 shadow-sm">
                <div className="h-5 w-5 bg-gray-300 rounded-full mr-2 animate-pulse"></div>
                <span className="text-gray-500 font-medium">Loading wallet status...</span>
              </div>
            ) : isConnected && connectedAddress ? (
              <div className="inline-flex items-center bg-green-100 border border-green-200 rounded-full px-6 py-3 shadow-sm">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-700 font-medium mr-3">Wallet Connected:</span>
                <Address address={connectedAddress} />
              </div>
            ) : (
              <div className="inline-flex items-center bg-yellow-50 border border-yellow-200 rounded-full px-6 py-3 shadow-sm">
                <Wallet className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-700 font-medium">Connect your wallet to start investing</span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-green-800 mb-6 leading-tight">
              Grow Your Wealth,<br />
              <span className="text-green-600">Plant Your Future</span>
            </h1>
            <p className="text-xl text-green-700 max-w-3xl mx-auto leading-relaxed">
              Invest in virtual trees on the BNB blockchain and watch them grow into profitable assets.
              Earn yearly returns when your trees yield, and benefit from increasing NFT values over time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105  ${!isMounted
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : isConnected
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-400 cursor-not-allowed text-white'
                }`}
              disabled={!isMounted || !isConnected}
            >
              {!isMounted
                ? 'Loading... 🔄'
                : isConnected
                  ? 'Start Growing 🌱'
                  : 'Connect Wallet First 🔐'
              }
            </button>
            <button className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300">
              Learn More
            </button>
          </div>

          {/* Stats */}

        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-green-800 mb-12">How TreeVest Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-3">1. Buy Your Tree</h3>
              <p className="text-green-600">Choose from various tree types and pay the initial investment in TBNB</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TreePine className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-3">2. Watch It Grow</h3>
              <p className="text-green-600">Your tree grows in value like an NFT during the initial years</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-3">3. Earn Returns</h3>
              <p className="text-green-600">Start receiving annual yields when your tree begins producing</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-3">4. Sell or Hold</h3>
              <p className="text-green-600">Sell for 60% of tree value or keep earning annual returns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16 px-4 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-green-800 mb-12">Why Choose TreeVest?</h2>

          <div className="grid  grid-rows-3 md:grid-cols-3 gap-8 w-[60vw] md:w-auto mx-[25vw]">
            <div className="bg-white rounded-2xl p-8 ">
              <Shield className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold text-green-800 mb-3">Secure Blockchain</h3>
              <p className="text-green-600">Built on BNB Smart Chain for maximum security and transparency</p>
            </div>

            <div className="bg-white rounded-2xl p-8 ">
              <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold text-green-800 mb-3">Growing Returns</h3>
              <p className="text-green-600">Earn annual yields plus benefit from increasing NFT value</p>
            </div>

            <div className="bg-white rounded-2xl p-8 ">
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold text-green-800 mb-3">Community Driven</h3>
              <p className="text-green-600">Join a growing community of eco-conscious investors</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
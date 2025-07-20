"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    User,
    Star,
    Filter,
    Grid3X3,
    List,
    Plus,
    Eye,
    Calendar,
    Activity,
} from "lucide-react";
import type { NextPage } from "next";
import toast from "react-hot-toast";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { SyncLoader } from "react-spinners";

// Contract ABI for marketplace functions
const marketplaceABI = [
    {
        inputs: [],
        name: "getAllListings",
        outputs: [
            { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
            { internalType: "address[]", name: "sellers", type: "address[]" },
            { internalType: "uint256[]", name: "prices", type: "uint256[]" },
            { internalType: "uint8[]", name: "treeTypes", type: "uint8[]" },
            { internalType: "bool[]", name: "isActive", type: "bool[]" },
            { internalType: "uint256[]", name: "listedAt", type: "uint256[]" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "uint256", name: "price", type: "uint256" },
        ],
        name: "listForSale",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "purchaseTree",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "getTreeStats",
        outputs: [
            { internalType: "uint8", name: "treeType", type: "uint8" },
            { internalType: "uint256", name: "totalHarvested", type: "uint256" },
            { internalType: "uint256", name: "lastHarvest", type: "uint256" },
            { internalType: "uint256", name: "nextHarvest", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
];

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const;

interface MarketplaceListing {
    tokenId: number;
    seller: string;
    price: bigint;
    treeType: number;
    isActive: boolean;
    listedAt: number;
    treeName: string;
    emoji: string;
    rarity: string;
    totalHarvested: bigint;
    lastHarvest: number;
    nextHarvest: number;
    description: string;
}

const Marketplace: NextPage = () => {
    const { address: connectedAddress, isConnected } = useAccount();
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"price" | "newest" | "harvest" | "rarity">("newest");
    const [filterBy, setFilterBy] = useState<"all" | "common" | "rare" | "epic" | "legendary">("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showListModal, setShowListModal] = useState(false);
    const [listPrice, setListPrice] = useState("");

    const { writeContractAsync: purchaseTree } = useScaffoldWriteContract({
        contractName: "FruitTreeMarketplace",
    });

    const { writeContractAsync: listForSale } = useScaffoldWriteContract({
        contractName: "FruitTreeMarketplace",
    });

    // Tree metadata
    const treeMetadata = {
        0: { name: "Mango Tree", emoji: "🥭", description: "Sweet mango trees with high returns", rarity: "Rare" },
        1: { name: "Coconut Tree", emoji: "🥥", description: "Tropical coconut trees with steady yields", rarity: "Common" },
        2: { name: "Guava Tree", emoji: "🍈", description: "Fast-growing guava with quick yields", rarity: "Common" },
        3: { name: "Rambutan Tree", emoji: "🌺", description: "Exotic rambutan with premium fruits", rarity: "Epic" },
        4: { name: "Jackfruit Tree", emoji: "🥭", description: "Jackfruit trees with substantial yields", rarity: "Epic" },
    };

    // Mock data for demonstration (replace with actual contract calls)
    useEffect(() => {
        const fetchMarketplaceData = async () => {
            setIsLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockListings: MarketplaceListing[] = [
                {
                    tokenId: 1,
                    seller: "0x1234567890123456789012345678901234567890",
                    price: parseEther("0.5"),
                    treeType: 0,
                    isActive: true,
                    listedAt: Date.now() - 86400000,
                    treeName: "Mango Tree",
                    emoji: "🥭",
                    rarity: "Rare",
                    totalHarvested: parseEther("2.3"),
                    lastHarvest: Date.now() - 2592000000,
                    nextHarvest: Date.now() + 2592000000,
                    description: "High-yield mango tree with excellent harvest history",
                },
                {
                    tokenId: 2,
                    seller: "0x2345678901234567890123456789012345678901",
                    price: parseEther("0.8"),
                    treeType: 3,
                    isActive: true,
                    listedAt: Date.now() - 172800000,
                    treeName: "Rambutan Tree",
                    emoji: "🌺",
                    rarity: "Epic",
                    totalHarvested: parseEther("4.1"),
                    lastHarvest: Date.now() - 1296000000,
                    nextHarvest: Date.now() + 3888000000,
                    description: "Premium rambutan tree with exceptional yield",
                },
                {
                    tokenId: 3,
                    seller: "0x3456789012345678901234567890123456789012",
                    price: parseEther("0.3"),
                    treeType: 1,
                    isActive: true,
                    listedAt: Date.now() - 259200000,
                    treeName: "Coconut Tree",
                    emoji: "🥥",
                    rarity: "Common",
                    totalHarvested: parseEther("1.7"),
                    lastHarvest: Date.now() - 1728000000,
                    nextHarvest: Date.now() + 2592000000,
                    description: "Reliable coconut tree with consistent monthly harvests",
                },
                {
                    tokenId: 4,
                    seller: "0x4567890123456789012345678901234567890123",
                    price: parseEther("1.2"),
                    treeType: 4,
                    isActive: true,
                    listedAt: Date.now() - 345600000,
                    treeName: "Jackfruit Tree",
                    emoji: "🥭",
                    rarity: "Epic",
                    totalHarvested: parseEther("5.8"),
                    lastHarvest: Date.now() - 2160000000,
                    nextHarvest: Date.now() + 4320000000,
                    description: "Jackfruit trees with record-breaking harvest yields",
                },
            ];

            setListings(mockListings);
            setIsLoading(false);
        };

        fetchMarketplaceData();
    }, []);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "Common":
                return "text-gray-600 bg-gray-100 border-gray-200";
            case "Rare":
                return "text-blue-600 bg-blue-100 border-blue-200";
            case "Epic":
                return "text-purple-600 bg-purple-100 border-purple-200";
            case "Legendary":
                return "text-yellow-600 bg-yellow-100 border-yellow-200";
            default:
                return "text-gray-600 bg-gray-100 border-gray-200";
        }
    };

    const formatTimeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return "Just now";
    };

    const formatTimeUntil = (timestamp: number) => {
        const diff = timestamp - Date.now();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return "Soon";
    };

    const filteredListings = listings
        .filter(listing => {
            const matchesSearch = listing.treeName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterBy === "all" || listing.rarity.toLowerCase() === filterBy;
            return matchesSearch && matchesFilter && listing.isActive;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "price":
                    return Number(a.price - b.price);
                case "newest":
                    return b.listedAt - a.listedAt;
                case "harvest":
                    return Number(b.totalHarvested - a.totalHarvested);
                case "rarity":
                    const rarityOrder = { Common: 1, Rare: 2, Epic: 3, Legendary: 4 };
                    return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
                default:
                    return 0;
            }
        });

    const toggleFavorite = (tokenId: number) => {
        setFavorites(prev =>
            prev.includes(tokenId)
                ? prev.filter(id => id !== tokenId)
                : [...prev, tokenId]
        );
    };

    const handlePurchase = (listing: MarketplaceListing) => {
        setSelectedListing(listing);
        setShowPurchaseModal(true);
    };

    const confirmPurchase = async () => {
        if (selectedListing && isConnected) {
            try {
                await purchaseTree({
                    functionName: "purchaseTree",
                    args: [selectedListing.tokenId],
                    value: selectedListing.price,
                });
                toast.success("Tree purchased successfully!");
                setShowPurchaseModal(false);
                setSelectedListing(null);
                // Refresh listings
            } catch (error: any) {
                console.error("Purchase error:", error);
                const message = error?.cause?.reason || "Transaction failed";
                toast.error(message);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <SyncLoader
                        color="rgb(34 197 94)"
                        size={12}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                    />
                    <p className="mt-4 text-slate-600">Loading marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-20">
                {/* Page Title */}
                <div className="text-center mb-8 animate-fadeIn">
                    <h1 className="text-4xl font-bold text-emerald-600 mb-4">
                        Tree NFT Marketplace
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Buy and sell fruit tree NFTs from other collectors. Find rare trees with proven harvest histories.
                    </p>
                </div>

                {/* Filters and Controls */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-sm border border-white/50 animate-slideUp">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-wrap items-center space-x-4">
                            <div className="relative">
                                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search trees..."
                                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <select
                                className="px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="price">Price: Low to High</option>
                                <option value="harvest">Total Harvested</option>
                                <option value="rarity">Rarity</option>
                            </select>

                            <select
                                className="px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                value={filterBy}
                                onChange={e => setFilterBy(e.target.value as any)}
                            >
                                <option value="all">All Rarities</option>
                                <option value="common">Common</option>
                                <option value="rare">Rare</option>
                                <option value="epic">Epic</option>
                                <option value="legendary">Legendary</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center bg-slate-100 rounded-full p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-full transition-all ${viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-slate-200"
                                        }`}
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-full transition-all ${viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-slate-200"
                                        }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="text-sm text-slate-600">
                                {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listings Grid/List */}
                <div className={viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
                    {filteredListings.map((listing, index) => (
                        <div
                            key={listing.tokenId}
                            className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp ${viewMode === "list" ? "flex items-center p-4" : "p-6"
                                }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {viewMode === "grid" ? (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <span className="text-4xl mr-3 animate-bounce-slow">{listing.emoji}</span>
                                            <div>
                                                <h3 className="text-xl font-bold text-emerald-800">{listing.treeName}</h3>
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRarityColor(listing.rarity)}`}>
                                                    {listing.rarity}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleFavorite(listing.tokenId)}
                                            className={`p-2 rounded-full transition-all ${favorites.includes(listing.tokenId)
                                                ? "text-red-500 bg-red-50"
                                                : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                }`}
                                        >
                                            <Heart className={`h-5 w-5 ${favorites.includes(listing.tokenId) ? "fill-current" : ""}`} />
                                        </button>
                                    </div>

                                    <p className="text-slate-600 text-sm mb-4">{listing.description}</p>

                                    {/* Seller Info */}
                                    <div className="flex items-center mb-4 p-3 bg-slate-50 rounded-lg">
                                        <User className="h-4 w-4 text-slate-500 mr-2" />
                                        <div>
                                            <div className="text-xs text-slate-500">Seller</div>
                                            <div className="font-mono text-sm text-slate-700">
                                                {`${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="flex items-center">
                                            <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                                            <div>
                                                <div className="text-xs text-gray-500">Price</div>
                                                <div className="font-semibold text-green-800">
                                                    {parseFloat(formatEther(listing.price)).toFixed(3)} tBNB
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Activity className="h-4 w-4 text-green-600 mr-2" />
                                            <div>
                                                <div className="text-xs text-gray-500">Total Harvested</div>
                                                <div className="font-semibold text-green-800">
                                                    {parseFloat(formatEther(listing.totalHarvested)).toFixed(2)} tBNB
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 text-green-600 mr-2" />
                                            <div>
                                                <div className="text-xs text-gray-500">Next Harvest</div>
                                                <div className="font-semibold text-green-800">
                                                    {formatTimeUntil(listing.nextHarvest)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-green-600 mr-2" />
                                            <div>
                                                <div className="text-xs text-gray-500">Listed</div>
                                                <div className="font-semibold text-green-800">
                                                    {formatTimeAgo(listing.listedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handlePurchase(listing)}
                                        disabled={!isConnected || listing.seller.toLowerCase() === connectedAddress?.toLowerCase()}
                                        className={`w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 ${isConnected
                                            ? "bg-green-600 opacity-80 hover:bg-green-700 text-white"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            }`}
                                    >
                                        {!isConnected
                                            ? "Connect Wallet"
                                            : listing.seller.toLowerCase() === connectedAddress?.toLowerCase()
                                                ? "Your Listing"
                                                : "Purchase Tree"
                                        }
                                    </button>
                                </>
                            ) : (
                                /* List View */
                                <div className="flex items-center w-full space-x-4">
                                    <span className="text-3xl">{listing.emoji}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="text-lg font-bold text-slate-800">{listing.treeName}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRarityColor(listing.rarity)}`}>
                                                {listing.rarity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{listing.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                                            <span>Seller: {`${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`}</span>
                                            <span>•</span>
                                            <span>Harvested: {parseFloat(formatEther(listing.totalHarvested)).toFixed(2)} tBNB</span>
                                            <span>•</span>
                                            <span>Listed {formatTimeAgo(listing.listedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-medium text-emerald-700 mb-2">
                                            {parseFloat(formatEther(listing.price)).toFixed(3)} tBNB
                                        </div>
                                        <button
                                            onClick={() => handlePurchase(listing)}
                                            disabled={!isConnected || listing.seller.toLowerCase() === connectedAddress?.toLowerCase()}
                                            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${isConnected
                                                ? "bg-green-600 opacity-80 hover:bg-green-700 text-white"
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }`}
                                        >
                                            {!isConnected
                                                ? "Connect Wallet"
                                                : listing.seller.toLowerCase() === connectedAddress?.toLowerCase()
                                                    ? "Your Listing"
                                                    : "Purchase"
                                            }
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => toggleFavorite(listing.tokenId)}
                                        className={`p-2 rounded-full transition-all ${favorites.includes(listing.tokenId)
                                            ? "text-red-500 bg-red-50"
                                            : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            }`}
                                    >
                                        <Heart className={`h-5 w-5 ${favorites.includes(listing.tokenId) ? "fill-current" : ""}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredListings.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🌳</div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No trees found</h3>
                        <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </main>

            {/* Purchase Modal */}
            {showPurchaseModal && selectedListing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <span className="text-4xl">{selectedListing.emoji}</span>
                            <h3 className="text-2xl font-bold text-green-800 mt-2">{selectedListing.treeName}</h3>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between">
                                <span>Price:</span>
                                <span className="font-semibold">
                                    {parseFloat(formatEther(selectedListing.price)).toFixed(3)} tBNB
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Harvested:</span>
                                <span className="font-semibold">
                                    {parseFloat(formatEther(selectedListing.totalHarvested)).toFixed(3)} tBNB
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Next Harvest:</span>
                                <span className="font-semibold">
                                    {formatTimeUntil(selectedListing.nextHarvest)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Seller:</span>
                                <span className="font-mono text-sm">
                                    {`${selectedListing.seller.slice(0, 8)}...${selectedListing.seller.slice(-6)}`}
                                </span>
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

            {/* List Tree Modal */}
            {showListModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slideUp">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">List Your Tree</h3>
                            <p className="text-slate-600 mt-2">Set a price for your fruit tree NFT</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tree to List
                                </label>
                                <select className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                                    <option value="">Select a tree from your collection</option>
                                    <option value="1">🥭 Mango Tree #1 - Harvested: 1.2 tBNB</option>
                                    <option value="2">🥥 Coconut Tree #2 - Harvested: 0.8 tBNB</option>
                                    <option value="3">🌺 Rambutan Tree #3 - Harvested: 2.1 tBNB</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Listing Price (tBNB)
                                </label>
                                <div className="relative">
                                    <DollarSign className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="number"
                                        step="0.001"
                                        placeholder="0.500"
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        value={listPrice}
                                        onChange={e => setListPrice(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Marketplace fee: 2.5% • You'll receive: {listPrice ? (parseFloat(listPrice) * 0.975).toFixed(3) : '0.000'} tBNB
                                </p>
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-emerald-800">Pricing Tips</p>
                                        <ul className="text-emerald-700 mt-1 space-y-1">
                                            <li>• Consider your tree's total harvest history</li>
                                            <li>• Factor in rarity and time until next harvest</li>
                                            <li>• Check similar listings for competitive pricing</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowListModal(false)}
                                className="flex-1 py-3 border-2 border-slate-300 text-slate-600 rounded-full font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!listPrice}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-full font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                List for Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-5px); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default Marketplace;
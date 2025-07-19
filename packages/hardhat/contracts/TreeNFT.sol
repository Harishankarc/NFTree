    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.18;

    import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
    import "@openzeppelin/contracts/access/Ownable.sol";
    import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

    contract FruitTreeNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
        uint256 public nextTokenId = 1;
        uint256 public constant SECONDS_PER_MONTH = 30 * 24 * 60 * 60;

        enum TreeType {
            MANGO,
            COCONUT,
            GUAVA,
            RAMBUTAN,
            JACKFRUIT
        }

        struct TreeInfo {
            string name;
            uint256 basePrice; // Base price in wei
            uint256 harvestCycleMonths; // How often it produces fruit (in months)
            uint256 profitRatePerCycle; // Profit per cycle in wei
            uint256 yearlyAppreciation;
        }

        struct Tree {
            TreeType treeType;
            uint256 mintTime;
            uint256 initialPrice;
            uint256 lastHarvestTime;
            address owner;
            uint256 totalHarvests;
        }

        struct Listing {
            uint256 tokenId;
            address seller;
            uint256 listingTime;
            bool isActive;
        }

        struct MarketplaceGroup {
            address seller;
            TreeType treeType;
            uint256 quantity;
            uint256 averagePrice;
            uint256[] tokenIds;
        }

        struct SellerSummary {
            TreeType treeType;
            uint256 quantity;
            uint256 averagePrice;
        }

        // Tree type configurations
        mapping(TreeType => TreeInfo) public treeTypeInfo;

        // Token ID to Tree mapping
        mapping(uint256 => Tree) public trees;

        // Owner to tree count mapping
        mapping(address => uint256) public ownerTreeCount;

        // User profit balances
        mapping(address => uint256) public profitBalances;

        // Marketplace mappings
        mapping(uint256 => bool) public isListed;
        mapping(uint256 => Listing) public listings;
        mapping(address => mapping(TreeType => uint256[])) public sellerTreesByType;
        mapping(address => TreeType[]) public sellerActiveTreeTypes;
        mapping(address => bool) public hasActiveListings;
        uint256[] public activeListings;

        // Events
        event TreeMinted(uint256 indexed tokenId, address indexed owner, TreeType treeType, uint256 price);
        event HarvestClaimed(uint256 indexed tokenId, address indexed owner, uint256 profit);
        event ProfitWithdrawn(address indexed owner, uint256 amount);
        event TreesListed(uint256[] tokenIds, address indexed seller);
        event TreesSold(uint256[] tokenIds, address indexed seller, address indexed buyer, uint256 totalPrice);
        event ListingsCancelled(uint256[] tokenIds, address indexed seller);

        constructor() ERC721("FruitTreeNFT", "FTREE") Ownable(msg.sender) {
            // Initialize tree type information
            treeTypeInfo[TreeType.MANGO] = TreeInfo({
                name: "Mango Tree",
                basePrice: 0.05 ether,
                harvestCycleMonths: 6,
                profitRatePerCycle: 0.008 ether,
                yearlyAppreciation: 12 // 12% yearly
            });

            treeTypeInfo[TreeType.COCONUT] = TreeInfo({
                name: "Coconut Tree",
                basePrice: 0.08 ether,
                harvestCycleMonths: 12,
                profitRatePerCycle: 0.015 ether,
                yearlyAppreciation: 8 // 8% yearly
            });

            treeTypeInfo[TreeType.GUAVA] = TreeInfo({
                name: "Guava Tree",
                basePrice: 0.03 ether,
                harvestCycleMonths: 4,
                profitRatePerCycle: 0.004 ether,
                yearlyAppreciation: 15 // 15% yearly
            });

            treeTypeInfo[TreeType.RAMBUTAN] = TreeInfo({
                name: "Rambutan Tree",
                basePrice: 0.04 ether,
                harvestCycleMonths: 4,
                profitRatePerCycle: 0.006 ether,
                yearlyAppreciation: 10 // 10% yearly
            });

            treeTypeInfo[TreeType.JACKFRUIT] = TreeInfo({
                name: "Jackfruit Tree",
                basePrice: 0.06 ether,
                harvestCycleMonths: 8,
                profitRatePerCycle: 0.012 ether,
                yearlyAppreciation: 9 // 9% yearly
            });
        }

        function mintTree(TreeType _treeType, string memory tokenURI) external payable nonReentrant {
            TreeInfo memory treeInfo = treeTypeInfo[_treeType];
            uint256 currentPrice = getCurrentTreePrice(_treeType);

            require(msg.value >= currentPrice, "Insufficient payment");

            uint256 tokenId = nextTokenId++;
            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, tokenURI);

            trees[tokenId] = Tree({
                treeType: _treeType,
                mintTime: block.timestamp,
                initialPrice: msg.value,
                lastHarvestTime: block.timestamp,
                owner: msg.sender,
                totalHarvests: 0
            });

            ownerTreeCount[msg.sender]++;

            emit TreeMinted(tokenId, msg.sender, _treeType, msg.value);

            // Refund excess payment
            if (msg.value > currentPrice) {
                payable(msg.sender).transfer(msg.value - currentPrice);
            }
        }

        function getCurrentTreePrice(TreeType _treeType) public view returns (uint256) {
            TreeInfo memory treeInfo = treeTypeInfo[_treeType];
            // Price increases based on total supply and appreciation rate
            uint256 totalSupply = nextTokenId - 1;
            uint256 priceIncrease = (treeInfo.basePrice * totalSupply * treeInfo.yearlyAppreciation) / (100 * 1000);
            return treeInfo.basePrice + priceIncrease;
        }

        function getTreeValue(uint256 tokenId) public view returns (uint256) {
            require(_ownerOf(tokenId) != address(0), "Tree does not exist");

            Tree memory tree = trees[tokenId];
            TreeInfo memory treeInfo = treeTypeInfo[tree.treeType];

            uint256 yearsElapsed = (block.timestamp - tree.mintTime) / (365 * 24 * 60 * 60);
            uint256 appreciationFactor = 100 + treeInfo.yearlyAppreciation * yearsElapsed;

            return (tree.initialPrice * appreciationFactor) / 100;
        }

        function getAvailableHarvests(uint256 tokenId) public view returns (uint256) {
            require(_ownerOf(tokenId) != address(0), "Tree does not exist");

            Tree memory tree = trees[tokenId];
            TreeInfo memory treeInfo = treeTypeInfo[tree.treeType];

            uint256 timeSinceLastHarvest = block.timestamp - tree.lastHarvestTime;
            uint256 cycleDuration = treeInfo.harvestCycleMonths * SECONDS_PER_MONTH;

            return timeSinceLastHarvest / cycleDuration;
        }

        function claimHarvest(uint256 tokenId) external nonReentrant {
            require(ownerOf(tokenId) == msg.sender, "Not the owner of this tree");

            uint256 availableHarvests = getAvailableHarvests(tokenId);
            require(availableHarvests > 0, "No harvests available");

            Tree storage tree = trees[tokenId];
            TreeInfo memory treeInfo = treeTypeInfo[tree.treeType];

            uint256 totalProfit = availableHarvests * treeInfo.profitRatePerCycle;

            // Update tree state
            tree.lastHarvestTime = block.timestamp;
            tree.totalHarvests += availableHarvests;

            // Add profit to user's balance
            profitBalances[msg.sender] += totalProfit;

            emit HarvestClaimed(tokenId, msg.sender, totalProfit);
        }

        function claimMultipleHarvests(uint256[] calldata tokenIds) external nonReentrant {
            uint256 totalProfit = 0;

            for (uint256 i = 0; i < tokenIds.length; i++) {
                uint256 tokenId = tokenIds[i];
                require(ownerOf(tokenId) == msg.sender, "Not the owner of this tree");

                uint256 availableHarvests = getAvailableHarvests(tokenId);
                if (availableHarvests > 0) {
                    Tree storage tree = trees[tokenId];
                    TreeInfo memory treeInfo = treeTypeInfo[tree.treeType];

                    uint256 profit = availableHarvests * treeInfo.profitRatePerCycle;
                    totalProfit += profit;

                    tree.lastHarvestTime = block.timestamp;
                    tree.totalHarvests += availableHarvests;

                    emit HarvestClaimed(tokenId, msg.sender, profit);
                }
            }

            require(totalProfit > 0, "No harvests available");
            profitBalances[msg.sender] += totalProfit;
        }

        function withdrawProfits() external nonReentrant {
            uint256 amount = profitBalances[msg.sender];
            require(amount > 0, "No profits to withdraw");
            require(address(this).balance >= amount, "Insufficient contract balance");

            profitBalances[msg.sender] = 0;
            payable(msg.sender).transfer(amount);

            emit ProfitWithdrawn(msg.sender, amount);
        }

        // MARKETPLACE FUNCTIONS

        function listTreesForSale(uint256[] calldata tokenIds) external nonReentrant {
            require(tokenIds.length > 0, "No tokens provided");

            for (uint256 i = 0; i < tokenIds.length; i++) {
                uint256 tokenId = tokenIds[i];
                require(ownerOf(tokenId) == msg.sender, "Not the owner of this tree");
                require(!isListed[tokenId], "Tree already listed");

                // Add to listings
                listings[tokenId] = Listing({
                    tokenId: tokenId,
                    seller: msg.sender,
                    listingTime: block.timestamp,
                    isActive: true
                });

                isListed[tokenId] = true;
                activeListings.push(tokenId);

                // Add to seller's tree type mapping
                TreeType treeType = trees[tokenId].treeType;
                sellerTreesByType[msg.sender][treeType].push(tokenId);

                // Add tree type to seller's active types if not already present
                if (sellerTreesByType[msg.sender][treeType].length == 1) {
                    sellerActiveTreeTypes[msg.sender].push(treeType);
                }

                hasActiveListings[msg.sender] = true;
            }

            emit TreesListed(tokenIds, msg.sender);
        }

        function buyTreesFromSeller(address seller, TreeType treeType, uint256 quantity) external payable nonReentrant {
            require(quantity > 0, "Quantity must be greater than 0");
            require(hasActiveListings[seller], "Seller has no active listings");

            uint256[] memory availableTokens = sellerTreesByType[seller][treeType];
            require(availableTokens.length >= quantity, "Not enough trees available from this seller");

            // Sort tokens by price (cheapest first) and select the required quantity
            uint256[] memory selectedTokens = new uint256[](quantity);
            uint256 totalCost = 0;
            uint256 selectedCount = 0;

            // Simple selection of first 'quantity' available tokens
            // In a more advanced version, you could sort by price first
            for (uint256 i = 0; i < availableTokens.length && selectedCount < quantity; i++) {
                uint256 tokenId = availableTokens[i];
                if (isListed[tokenId] && listings[tokenId].isActive) {
                    selectedTokens[selectedCount] = tokenId;
                    totalCost += getTreeValue(tokenId);
                    selectedCount++;
                }
            }

            require(selectedCount == quantity, "Not enough active listings available");
            require(msg.value >= totalCost, "Insufficient payment");

            // Process the purchases
            for (uint256 i = 0; i < quantity; i++) {
                uint256 tokenId = selectedTokens[i];
                _removeListing(tokenId, seller, treeType);
                _transfer(seller, msg.sender, tokenId);
            }

            // Transfer payment to seller
            payable(seller).transfer(totalCost);

            // Refund excess payment
            if (msg.value > totalCost) {
                payable(msg.sender).transfer(msg.value - totalCost);
            }

            emit TreesSold(selectedTokens, seller, msg.sender, totalCost);
        }

        function cancelListings(uint256[] calldata tokenIds) external nonReentrant {
            require(tokenIds.length > 0, "No tokens provided");

            for (uint256 i = 0; i < tokenIds.length; i++) {
                uint256 tokenId = tokenIds[i];
                require(ownerOf(tokenId) == msg.sender, "Not the owner of this tree");
                require(isListed[tokenId], "Tree not listed");

                TreeType treeType = trees[tokenId].treeType;
                _removeListing(tokenId, msg.sender, treeType);
            }

            emit ListingsCancelled(tokenIds, msg.sender);
        }

        function _removeListing(uint256 tokenId, address seller, TreeType treeType) private {
            // Remove from general listings
            isListed[tokenId] = false;
            listings[tokenId].isActive = false;

            // Remove from active listings array
            for (uint256 i = 0; i < activeListings.length; i++) {
                if (activeListings[i] == tokenId) {
                    activeListings[i] = activeListings[activeListings.length - 1];
                    activeListings.pop();
                    break;
                }
            }

            // Remove from seller's tree type array
            uint256[] storage sellerTrees = sellerTreesByType[seller][treeType];
            for (uint256 i = 0; i < sellerTrees.length; i++) {
                if (sellerTrees[i] == tokenId) {
                    sellerTrees[i] = sellerTrees[sellerTrees.length - 1];
                    sellerTrees.pop();
                    break;
                }
            }

            // If seller has no more trees of this type, remove from active tree types
            if (sellerTreesByType[seller][treeType].length == 0) {
                TreeType[] storage activeTypes = sellerActiveTreeTypes[seller];
                for (uint256 i = 0; i < activeTypes.length; i++) {
                    if (activeTypes[i] == treeType) {
                        activeTypes[i] = activeTypes[activeTypes.length - 1];
                        activeTypes.pop();
                        break;
                    }
                }
            }

            // Check if seller has any active listings left
            bool hasListings = false;
            TreeType[] memory activeTypes = sellerActiveTreeTypes[seller];
            for (uint256 i = 0; i < activeTypes.length; i++) {
                if (sellerTreesByType[seller][activeTypes[i]].length > 0) {
                    hasListings = true;
                    break;
                }
            }
            hasActiveListings[seller] = hasListings;
        }

        // MARKETPLACE QUERY FUNCTIONS

        function getMarketplaceGroupedData() external view returns (MarketplaceGroup[] memory groups) {
            // Get all sellers with active listings
            address[] memory sellers = getAllSellersWithListings();

            // Count total groups needed
            uint256 totalGroups = 0;
            for (uint256 i = 0; i < sellers.length; i++) {
                totalGroups += sellerActiveTreeTypes[sellers[i]].length;
            }

            groups = new MarketplaceGroup[](totalGroups);
            uint256 groupIndex = 0;

            for (uint256 i = 0; i < sellers.length; i++) {
                address seller = sellers[i];
                TreeType[] memory activeTypes = sellerActiveTreeTypes[seller];

                for (uint256 j = 0; j < activeTypes.length; j++) {
                    TreeType treeType = activeTypes[j];
                    uint256[] memory tokenIds = sellerTreesByType[seller][treeType];

                    if (tokenIds.length > 0) {
                        uint256 totalValue = 0;
                        uint256 activeCount = 0;
                        uint256[] memory activeTokenIds = new uint256[](tokenIds.length);

                        for (uint256 k = 0; k < tokenIds.length; k++) {
                            if (isListed[tokenIds[k]] && listings[tokenIds[k]].isActive) {
                                activeTokenIds[activeCount] = tokenIds[k];
                                totalValue += getTreeValue(tokenIds[k]);
                                activeCount++;
                            }
                        }

                        if (activeCount > 0) {
                            // Resize array to actual active count
                            uint256[] memory finalTokenIds = new uint256[](activeCount);
                            for (uint256 l = 0; l < activeCount; l++) {
                                finalTokenIds[l] = activeTokenIds[l];
                            }

                            groups[groupIndex] = MarketplaceGroup({
                                seller: seller,
                                treeType: treeType,
                                quantity: activeCount,
                                averagePrice: totalValue / activeCount,
                                tokenIds: finalTokenIds
                            });
                            groupIndex++;
                        }
                    }
                }
            }

            // Resize groups array to actual count
            MarketplaceGroup[] memory finalGroups = new MarketplaceGroup[](groupIndex);
            for (uint256 i = 0; i < groupIndex; i++) {
                finalGroups[i] = groups[i];
            }

            return finalGroups;
        }

        function getAllSellersWithListings() public view returns (address[] memory sellers) {
            // This is a simplified version - in production, you might want to maintain a separate array
            uint256 sellerCount = 0;
            address[] memory tempSellers = new address[](activeListings.length);

            for (uint256 i = 0; i < activeListings.length; i++) {
                address seller = listings[activeListings[i]].seller;
                bool found = false;

                for (uint256 j = 0; j < sellerCount; j++) {
                    if (tempSellers[j] == seller) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    tempSellers[sellerCount] = seller;
                    sellerCount++;
                }
            }

            sellers = new address[](sellerCount);
            for (uint256 i = 0; i < sellerCount; i++) {
                sellers[i] = tempSellers[i];
            }
        }

        function getSellerTreesByType(
            address seller,
            TreeType treeType
        ) external view returns (uint256[] memory tokenIds, uint256[] memory prices, uint256[] memory listingTimes) {
            uint256[] memory allTokens = sellerTreesByType[seller][treeType];
            uint256 activeCount = 0;

            // Count active listings
            for (uint256 i = 0; i < allTokens.length; i++) {
                if (isListed[allTokens[i]] && listings[allTokens[i]].isActive) {
                    activeCount++;
                }
            }

            tokenIds = new uint256[](activeCount);
            prices = new uint256[](activeCount);
            listingTimes = new uint256[](activeCount);

            uint256 index = 0;
            for (uint256 i = 0; i < allTokens.length; i++) {
                uint256 tokenId = allTokens[i];
                if (isListed[tokenId] && listings[tokenId].isActive) {
                    tokenIds[index] = tokenId;
                    prices[index] = getTreeValue(tokenId);
                    listingTimes[index] = listings[tokenId].listingTime;
                    index++;
                }
            }
        }

        function getSellerListingsSummary(address seller) external view returns (SellerSummary[] memory summary) {
            TreeType[] memory activeTypes = sellerActiveTreeTypes[seller];
            summary = new SellerSummary[](activeTypes.length);

            for (uint256 i = 0; i < activeTypes.length; i++) {
                TreeType treeType = activeTypes[i];
                uint256[] memory tokenIds = sellerTreesByType[seller][treeType];

                uint256 totalValue = 0;
                uint256 activeCount = 0;

                for (uint256 j = 0; j < tokenIds.length; j++) {
                    if (isListed[tokenIds[j]] && listings[tokenIds[j]].isActive) {
                        totalValue += getTreeValue(tokenIds[j]);
                        activeCount++;
                    }
                }

                summary[i] = SellerSummary({
                    treeType: treeType,
                    quantity: activeCount,
                    averagePrice: activeCount > 0 ? totalValue / activeCount : 0
                });
            }
        }

        // EXISTING FUNCTIONS (keeping all original functionality)

        function getTreeDetails(
            uint256 tokenId
        )
            public
            view
            returns (
                string memory treeName,
                uint256 currentValue,
                uint256 availableHarvests,
                uint256 totalHarvests,
                uint256 nextHarvestTime
            )
        {
            require(_ownerOf(tokenId) != address(0), "Tree does not exist");

            Tree memory tree = trees[tokenId];
            TreeInfo memory treeInfo = treeTypeInfo[tree.treeType];

            treeName = treeInfo.name;
            currentValue = getTreeValue(tokenId);
            availableHarvests = getAvailableHarvests(tokenId);
            totalHarvests = tree.totalHarvests;

            uint256 cycleDuration = treeInfo.harvestCycleMonths * SECONDS_PER_MONTH;
            uint256 timeSinceLastHarvest = block.timestamp - tree.lastHarvestTime;
            uint256 timeUntilNextHarvest = cycleDuration - (timeSinceLastHarvest % cycleDuration);
            nextHarvestTime = block.timestamp + timeUntilNextHarvest;
        }

        function getTreeDetailsByOwner(
            address _owner
        )
            public
            view
            returns (
                uint256[] memory tokenIds,
                string[] memory treeNames,
                uint256[] memory currentValues,
                uint256[] memory availableHarvestsArray,
                uint256[] memory totalHarvestsArray,
                uint256[] memory nextHarvestTimes
            )
        {
            uint256 count = ownerTreeCount[_owner];
            tokenIds = new uint256[](count);
            treeNames = new string[](count);
            currentValues = new uint256[](count);
            availableHarvestsArray = new uint256[](count);
            totalHarvestsArray = new uint256[](count);
            nextHarvestTimes = new uint256[](count);

            uint256 index = 0;
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (_ownerOf(i) == _owner) {
                    tokenIds[index] = i;

                    (
                        string memory treeName,
                        uint256 currentValue,
                        uint256 availableHarvests,
                        uint256 totalHarvests,
                        uint256 nextHarvestTime
                    ) = getTreeDetails(i);

                    treeNames[index] = treeName;
                    currentValues[index] = currentValue;
                    availableHarvestsArray[index] = availableHarvests;
                    totalHarvestsArray[index] = totalHarvests;
                    nextHarvestTimes[index] = nextHarvestTime;

                    index++;
                }
            }
        }

        function getAllTreeTypes()
            external
            view
            returns (
                uint8[] memory treeTypes,
                string[] memory names,
                uint256[] memory basePrices,
                uint256[] memory currentPrices,
                uint256[] memory harvestCycleMonths,
                uint256[] memory profitRatesPerCycle,
                uint256[] memory yearlyAppreciations
            )
        {
            treeTypes = new uint8[](5);
            names = new string[](5);
            basePrices = new uint256[](5);
            currentPrices = new uint256[](5);
            harvestCycleMonths = new uint256[](5);
            profitRatesPerCycle = new uint256[](5);
            yearlyAppreciations = new uint256[](5);

            for (uint i = 0; i < 5; i++) {
                TreeType treeType = TreeType(i);
                TreeInfo memory info = treeTypeInfo[treeType];

                treeTypes[i] = uint8(treeType);
                names[i] = info.name;
                basePrices[i] = info.basePrice;
                currentPrices[i] = getCurrentTreePrice(treeType);
                harvestCycleMonths[i] = info.harvestCycleMonths;
                profitRatesPerCycle[i] = info.profitRatePerCycle;
                yearlyAppreciations[i] = info.yearlyAppreciation;
            }
        }

        function getTreeTypeInfo(TreeType _treeType) external view returns (TreeInfo memory) {
            return treeTypeInfo[_treeType];
        }

        // Override transfer functions to update owner tree count and handle listings
        function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
            address from = _ownerOf(tokenId);

            if (from != address(0) && to != address(0) && from != to) {
                ownerTreeCount[from]--;
                ownerTreeCount[to]++;
                trees[tokenId].owner = to;

                // If tree is listed, remove it from marketplace when transferred
                if (isListed[tokenId]) {
                    TreeType treeType = trees[tokenId].treeType;
                    _removeListing(tokenId, from, treeType);
                }
            }

            return super._update(to, tokenId, auth);
        }

        // Owner functions
        function updateTreeTypeInfo(
            TreeType _treeType,
            string memory _name,
            uint256 _basePrice,
            uint256 _harvestCycleMonths,
            uint256 _profitRatePerCycle,
            uint256 _yearlyAppreciation
        ) external onlyOwner {
            treeTypeInfo[_treeType] = TreeInfo({
                name: _name,
                basePrice: _basePrice,
                harvestCycleMonths: _harvestCycleMonths,
                profitRatePerCycle: _profitRatePerCycle,
                yearlyAppreciation: _yearlyAppreciation
            });
        }

        function fundContract() external payable onlyOwner {}

        function withdrawContractFunds() external onlyOwner {
            uint256 balance = address(this).balance;
            require(balance > 0, "No funds to withdraw");

            (bool success, ) = owner().call{ value: balance }("");
            require(success, "Withdraw failed");
        }

        function emergencyWithdraw() external onlyOwner {
            payable(owner()).transfer(address(this).balance);
        }

        receive() external payable {}
    }

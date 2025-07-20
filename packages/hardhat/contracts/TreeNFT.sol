// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FruitTreeNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextTokenId = 1;

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
        uint256 baseAppreciation; // Base yearly appreciation (e.g., 5%)
        uint256 produceAppreciation; // Additional appreciation from produce (e.g., 2-4%)
    }

    struct Tree {
        TreeType treeType;
        uint256 mintTime;
        uint256 initialPrice;
        address owner;
    }

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 listingTime;
        uint256 price;
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

    // Marketplace mappings
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(TreeType => uint256[])) public sellerTreesByType;
    mapping(address => TreeType[]) public sellerActiveTreeTypes;
    mapping(address => bool) public hasActiveListings;
    uint256[] public activeListings;

    // Events
    event TreeMinted(uint256 indexed tokenId, address indexed owner, TreeType treeType, uint256 price);
    event TreesListed(uint256[] tokenIds, address indexed seller);
    event TreesSold(uint256[] tokenIds, address indexed seller, address indexed buyer, uint256 totalPrice);
    event ListingsCancelled(uint256[] tokenIds, address indexed seller);

    constructor() ERC721("FruitTreeNFT", "FTREE") Ownable(msg.sender) {
        // Initialize tree type information with new appreciation model
        treeTypeInfo[TreeType.MANGO] = TreeInfo({
            name: "Mango Tree",
            basePrice: 0.05 ether,
            baseAppreciation: 5, // 5% yearly base appreciation
            produceAppreciation: 3 // 3% yearly produce appreciation
        });

        treeTypeInfo[TreeType.COCONUT] = TreeInfo({
            name: "Coconut Tree",
            basePrice: 0.08 ether,
            baseAppreciation: 5, // 5% yearly base appreciation
            produceAppreciation: 2 // 2% yearly produce appreciation
        });

        treeTypeInfo[TreeType.GUAVA] = TreeInfo({
            name: "Guava Tree",
            basePrice: 0.003 ether,
            baseAppreciation: 5, // 5% yearly base appreciation
            produceAppreciation: 4 // 4% yearly produce appreciation
        });

        treeTypeInfo[TreeType.RAMBUTAN] = TreeInfo({
            name: "Rambutan Tree",
            basePrice: 0.04 ether,
            baseAppreciation: 5, // 5% yearly base appreciation
            produceAppreciation: 3 // 3% yearly produce appreciation
        });

        treeTypeInfo[TreeType.JACKFRUIT] = TreeInfo({
            name: "Jackfruit Tree",
            basePrice: 0.06 ether,
            baseAppreciation: 5, // 5% yearly base appreciation
            produceAppreciation: 2 // 2% yearly produce appreciation
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
            owner: msg.sender
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
        uint256 totalAppreciation = treeInfo.baseAppreciation + treeInfo.produceAppreciation;
        uint256 priceIncrease = (treeInfo.basePrice * totalSupply * totalAppreciation) / (100 * 1000);
        return treeInfo.basePrice + priceIncrease;
    }

    function getTreeValue(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Tree does not exist");

        Tree memory tree = trees[tokenId];
        TreeInfo memory treeInfo = treeTypeInfo[tree.treeType];

        // Calculate years elapsed (using 365 days per year)
        uint256 yearsElapsed = (block.timestamp - tree.mintTime) / (365 * 24 * 60 * 60);

        // Calculate total appreciation (base + produce)
        uint256 totalAppreciation = treeInfo.baseAppreciation + treeInfo.produceAppreciation;

        // Apply compound appreciation: price * (1 + rate)^years
        // Simplified to: price * (100 + rate * years) / 100
        uint256 appreciationFactor = 100 + totalAppreciation * yearsElapsed;

        return (tree.initialPrice * appreciationFactor) / 100;
    }

    // MARKETPLACE FUNCTIONS

    function listTreesForSale(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "No tokens provided");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Not the owner of this tree");
            require(!isListed[tokenId], "Tree already listed");

            uint256 currentPrice = getTreeValue(tokenId);

            // Add to listings
            listings[tokenId] = Listing({
                tokenId: tokenId,
                seller: msg.sender,
                listingTime: block.timestamp,
                price: currentPrice,
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

        // Select the required quantity of tokens
        uint256[] memory selectedTokens = new uint256[](quantity);
        uint256 totalCost = 0;
        uint256 selectedCount = 0;

        for (uint256 i = 0; i < availableTokens.length && selectedCount < quantity; i++) {
            uint256 tokenId = availableTokens[i];
            if (isListed[tokenId] && listings[tokenId].isActive) {
                selectedTokens[selectedCount] = tokenId;
                totalCost += listings[tokenId].price; // Use stored listing price
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
                            totalValue += listings[tokenIds[k]].price;
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
                prices[index] = listings[tokenId].price;
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
                    totalValue += listings[tokenIds[j]].price;
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

    // OWNER PROFILE FUNCTIONS

    function getOwnerTreesByType(
        address owner
    )
        external
        view
        returns (
            TreeType[] memory treeTypes,
            uint256[] memory quantities,
            uint256[][] memory tokenIdsByType,
            uint256[][] memory valuesByType
        )
    {
        // First, count unique tree types owned
        bool[5] memory hasType;
        uint256 typeCount = 0;

        for (uint256 i = 1; i < nextTokenId; i++) {
            if (_ownerOf(i) == owner) {
                TreeType treeType = trees[i].treeType;
                if (!hasType[uint8(treeType)]) {
                    hasType[uint8(treeType)] = true;
                    typeCount++;
                }
            }
        }

        treeTypes = new TreeType[](typeCount);
        quantities = new uint256[](typeCount);
        tokenIdsByType = new uint256[][](typeCount);
        valuesByType = new uint256[][](typeCount);

        // Fill the arrays
        uint256 currentIndex = 0;
        for (uint8 t = 0; t < 5; t++) {
            if (hasType[t]) {
                TreeType treeType = TreeType(t);
                treeTypes[currentIndex] = treeType;

                // Count tokens of this type
                uint256 count = 0;
                for (uint256 i = 1; i < nextTokenId; i++) {
                    if (_ownerOf(i) == owner && trees[i].treeType == treeType) {
                        count++;
                    }
                }

                quantities[currentIndex] = count;
                tokenIdsByType[currentIndex] = new uint256[](count);
                valuesByType[currentIndex] = new uint256[](count);

                // Fill token IDs and values
                uint256 tokenIndex = 0;
                for (uint256 i = 1; i < nextTokenId; i++) {
                    if (_ownerOf(i) == owner && trees[i].treeType == treeType) {
                        tokenIdsByType[currentIndex][tokenIndex] = i;
                        valuesByType[currentIndex][tokenIndex] = getTreeValue(i);
                        tokenIndex++;
                    }
                }
                currentIndex++;
            }
        }
    }

    // UTILITY FUNCTIONS

    function getTreeDetails(
        uint256 tokenId
    ) public view returns (string memory treeName, uint256 currentValue, uint256 mintTime, address treeOwner) {
        require(_ownerOf(tokenId) != address(0), "Tree does not exist");

        Tree memory tree = trees[tokenId];
        TreeInfo memory treeInfo = treeTypeInfo[tree.treeType];

        treeName = treeInfo.name;
        currentValue = getTreeValue(tokenId);
        mintTime = tree.mintTime;
        treeOwner = tree.owner;
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
        uint256[] memory mintTimes
    )
{
    uint256 count = 0;
    // First, count only unlisted trees
    for (uint256 i = 1; i < nextTokenId; i++) {
        if (_ownerOf(i) == _owner && !isListed[i]) {
            count++;
        }
    }

    tokenIds = new uint256[](count);
    treeNames = new string[](count);
    currentValues = new uint256[](count);
    mintTimes = new uint256[](count);

    uint256 index = 0;
    for (uint256 i = 1; i < nextTokenId; i++) {
        if (_ownerOf(i) == _owner && !isListed[i]) {
            tokenIds[index] = i;

            (string memory treeName, uint256 currentValue, uint256 mintTime, ) = getTreeDetails(i);

            treeNames[index] = treeName;
            currentValues[index] = currentValue;
            mintTimes[index] = mintTime;

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
            uint256[] memory baseAppreciations,
            uint256[] memory produceAppreciations
        )
    {
        treeTypes = new uint8[](5);
        names = new string[](5);
        basePrices = new uint256[](5);
        currentPrices = new uint256[](5);
        baseAppreciations = new uint256[](5);
        produceAppreciations = new uint256[](5);

        for (uint i = 0; i < 5; i++) {
            TreeType treeType = TreeType(i);
            TreeInfo memory info = treeTypeInfo[treeType];

            treeTypes[i] = uint8(treeType);
            names[i] = info.name;
            basePrices[i] = info.basePrice;
            currentPrices[i] = getCurrentTreePrice(treeType);
            baseAppreciations[i] = info.baseAppreciation;
            produceAppreciations[i] = info.produceAppreciation;
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
        uint256 _baseAppreciation,
        uint256 _produceAppreciation
    ) external onlyOwner {
        treeTypeInfo[_treeType] = TreeInfo({
            name: _name,
            basePrice: _basePrice,
            baseAppreciation: _baseAppreciation,
            produceAppreciation: _produceAppreciation
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

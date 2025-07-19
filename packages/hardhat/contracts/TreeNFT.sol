// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FruitTreeNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextTokenId = 1;
    uint256 public constant SECONDS_PER_MONTH = 30 * 24 * 60 * 60; // Approximate seconds in a month

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
        uint256 yearlyAppreciation; // Yearly price increase percentage (e.g., 10 = 10%)
    }

    struct Tree {
        TreeType treeType;
        uint256 mintTime;
        uint256 initialPrice;
        uint256 lastHarvestTime;
        address owner;
        uint256 totalHarvests;
    }

    // Tree type configurations
    mapping(TreeType => TreeInfo) public treeTypeInfo;

    // Token ID to Tree mapping
    mapping(uint256 => Tree) public trees;

    // Owner to tree count mapping
    mapping(address => uint256) public ownerTreeCount;

    // Events
    event TreeMinted(uint256 indexed tokenId, address indexed owner, TreeType treeType, uint256 price);
    event HarvestClaimed(uint256 indexed tokenId, address indexed owner, uint256 profit);
    event ProfitWithdrawn(address indexed owner, uint256 amount);

    // User profit balances
    mapping(address => uint256) public profitBalances;

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

    // NEW FUNCTION: Get all tree types data for frontend
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

    // Override transfer functions to update owner tree count
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0) && from != to) {
            ownerTreeCount[from]--;
            ownerTreeCount[to]++;
            trees[tokenId].owner = to;
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

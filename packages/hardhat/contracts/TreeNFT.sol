// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TreeNFT is ERC721URIStorage, Ownable {
    uint256 public basePrice = 0.01 ether;
    uint256 public nextTokenId = 1;

    struct Tree {
        uint256 mintTime;
        uint256 initialPrice;
    }

    mapping(uint256 => Tree) public trees;

    constructor() ERC721("TreeNFT", "TREE") Ownable(msg.sender) {}

    function mintTree(string memory tokenURI) external payable {
        require(msg.value >= basePrice, "Not enough ETH sent");

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        trees[tokenId] = Tree(block.timestamp, msg.value);
    }

    function getTreeValue(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Tree does not exist");

        Tree memory tree = trees[tokenId];
        uint256 yearsElapsed = (block.timestamp - tree.mintTime) / 365 days;

        return tree.initialPrice * (1 + yearsElapsed); // Increases linearly every year
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{ value: address(this).balance }("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZenGardenFlower is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Minter 角色
    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event FlowerMinted(address indexed to, uint256 indexed tokenId, string uri);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not a minter");
        _;
    }

    constructor() ERC721("ZenGarden Flower", "ZENF") Ownable(msg.sender) {
        // Owner 默认是 minter
        minters[msg.sender] = true;
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    function mint(address to, string memory uri) external onlyMinter returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit FlowerMinted(to, tokenId, uri);
        return tokenId;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // Override 函数
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
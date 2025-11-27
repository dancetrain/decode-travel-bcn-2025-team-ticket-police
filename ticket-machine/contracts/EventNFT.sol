// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EventNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId = 1;

    struct TokenInfo {
        address originalSeller;
        bool canBeResold;
        uint16 resaleCommissionBps; // basis points, 500 = 5%
        uint256 eventDate;          // unix timestamp
    }

    mapping(uint256 => TokenInfo) public tokenInfo;
    mapping(address => uint256) public credits;

    uint16 public platformFeeBps = 200; // 2.00%
    address public platformFeeRecipient;
    address public marketplace;

    event Minted(uint256 indexed tokenId, address indexed originalSeller);
    event Resold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event Buyback(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price, bool grantedCredit);
    event CreditUsed(address indexed user, uint256 amount);

    constructor(address _platformFeeRecipient) 
        ERC721("EventNFT", "EVNFT")
        Ownable(msg.sender)
    {
        platformFeeRecipient = _platformFeeRecipient;
    }

    // =========================
    // Mint (onlyOwner or change as needed)
    // =========================
    function mint(
        address to,
        bool _canBeResold,
        uint16 _resaleCommissionBps,
        uint256 _eventDate
    ) external onlyOwner returns (uint256) {
        require(_resaleCommissionBps <= 10000, "Commission too high");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        tokenInfo[tokenId] = TokenInfo({
            originalSeller: to,
            canBeResold: _canBeResold,
            resaleCommissionBps: _resaleCommissionBps,
            eventDate: _eventDate
        });

        emit Minted(tokenId, to);
        return tokenId;
    }

    // =========================
    // Resell – marketplace style
    // =========================
    function resell(uint256 tokenId, address expectedSeller) external payable nonReentrant {
        // Basic checks
        require(ownerOf(tokenId) == expectedSeller, "Not owner");
        require(expectedSeller == msg.sender || getApproved(tokenId) == address(this) || isApprovedForAll(expectedSeller, address(this)), "Not approved");
        require(tokenInfo[tokenId].canBeResold, "Resale not allowed");
        require(msg.value > 0, "No payment");

        TokenInfo memory info = tokenInfo[tokenId];
        uint256 price = msg.value;

        // Fee calculations
        uint256 commission = (price * info.resaleCommissionBps) / 10_000;
        uint256 platformFee = (price * platformFeeBps) / 10_000;
        uint256 sellerProceeds = price - commission - platformFee;

        // Transfer token first
        _transfer(expectedSeller, msg.sender, tokenId);

        // Pay everyone (reentrancy-safe)
        if (commission > 0) {
            (bool ok1, ) = info.originalSeller.call{value: commission}("");
            require(ok1, "Commission failed");
        }
        if (platformFee > 0) {
            (bool ok2, ) = platformFeeRecipient.call{value: platformFee}("");
            require(ok2, "Platform fee failed");
        }
        (bool ok3, ) = expectedSeller.call{value: sellerProceeds}("");
        require(ok3, "Payment to seller failed");

        emit Resold(tokenId, expectedSeller, msg.sender, price);
    }

    // =========================
    // Buyback by original seller
    // =========================
    function sellerBuyback(uint256 tokenId, uint256 creditAmount) external payable nonReentrant {
        TokenInfo memory info = tokenInfo[tokenId];
        address originalSeller = info.originalSeller;
        require(msg.sender == originalSeller, "Only original seller");

        address currentOwner = ownerOf(tokenId);
        require(currentOwner != originalSeller, "Already owns");

        require(currentOwner == msg.sender || getApproved(tokenId) == address(this) || isApprovedForAll(currentOwner, address(this)), "Not approved");

        uint256 price = msg.value;
        require(price > 0 || creditAmount > 0, "No payment or credit");

        bool afterEvent = block.timestamp > info.eventDate;

        // Transfer token back to original seller
        _transfer(currentOwner, originalSeller, tokenId);

        // Pay current owner
        if (price > 0) {
            (bool ok, ) = currentOwner.call{value: price}("");
            require(ok, "Payment failed");
        }

        // Grant credit if event passed
        bool grantedCredit = false;
        if (afterEvent && creditAmount > 0) {
            credits[originalSeller] += creditAmount;
            grantedCredit = true;
        }

        emit Buyback(tokenId, originalSeller, currentOwner, price, grantedCredit);
    }

    // =========================
    // Credit usage (admin only)
    // =========================
    function useCredit(address user, uint256 amount) external onlyOwner {
        require(credits[user] >= amount, "Insufficient credit");
        credits[user] -= amount;
        emit CreditUsed(user, amount);
    }

    // =========================
    // Admin setters
    // =========================
    function setPlatformFeeBps(uint16 bps) external onlyOwner {
        require(bps <= 1000, "Max 10%");
        platformFeeBps = bps;
    }

    function setPlatformFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Zero address");
        platformFeeRecipient = recipient;
    }

    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
    }

    function setCanBeResold(uint256 tokenId, bool allowed) external {
        require(ownerOf(tokenId) != address(0), "Token doesn't exist");
        require(msg.sender == tokenInfo[tokenId].originalSeller, "Only original seller");
        tokenInfo[tokenId].canBeResold = allowed;
    }

    function setResaleCommissionBps(uint256 tokenId, uint16 bps) external {
        require(ownerOf(tokenId) != address(0), "Token doesn't exist");
        require(msg.sender == tokenInfo[tokenId].originalSeller, "Only original seller");
        require(bps <= 10000, "Invalid bps");
        tokenInfo[tokenId].resaleCommissionBps = bps;
    }

    function setEventDate(uint256 tokenId, uint256 newDate) external {
        require(ownerOf(tokenId) != address(0), "Token doesn't exist");
        require(msg.sender == tokenInfo[tokenId].originalSeller, "Only original seller");
        tokenInfo[tokenId].eventDate = newDate;
    }

    // =========================
    // Transfer Restrictions (OZ v5 style)
    // =========================
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = super._update(to, tokenId, auth); // this calls the real transfer

        // Skip checks on mint (from == 0) and burn (to == 0)
        if (from != address(0) && to != address(0)) {
            TokenInfo memory info = tokenInfo[tokenId];
            if (!info.canBeResold) {
                address sender = _msgSender();
                require(
                    sender == owner() ||
                    sender == marketplace ||
                    sender == address(this),
                    "Transfer blocked: resale not allowed"
                );
            }
        }

        return from;
    }

    // Optional: keep this for compatibility with older tools
    //function _transfer(address from, address to, uint256 tokenId) internal override {
    //    super._transfer(from, to, tokenId);
    //}

    receive() external payable {}
}
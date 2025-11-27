// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EventNFT – Secondary Market Controlled Event Tickets
 * @notice This is a soulbound-by-default ERC721 ticket with powerful resale controls:
 *         - Tickets can be non-transferable unless explicitly allowed
 *         - Resale goes through a built-in marketplace function (no external marketplace needed)
 *         - Original seller gets a commission on every resale
 *         - Original seller can buy back the ticket (even after event → gets credit instead of ticket)
 *         - Platform takes a small fee on every resale
 */
contract EventNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId = 1; // Auto-incrementing token ID counter

    /**
     * @dev Per-token metadata that controls resale behavior
     */
    struct TokenInfo {
        address originalSeller;        // Who minted / first received the ticket → gets resale commission + buyback right
        bool canBeResold;              // If false → token is soulbound (non-transferable except via contract)
        uint16 resaleCommissionBps;    // Commission in basis points (500 = 5%) paid to originalSeller on resale
        uint256 eventDate;             // Unix timestamp of the event → used for post-event buyback logic
    }

    // Token ID → TokenInfo
    mapping(uint256 => TokenInfo) public tokenInfo;

    // Address → credit balance (in wei) – used when buyback happens after event date
    mapping(address => uint256) public credits;

    // Platform settings
    uint16 public platformFeeBps = 200;        // Default 2.00% platform fee on resale (200 bps)
    address public platformFeeRecipient;       // Where platform fees are sent
    address public marketplace;                // Trusted marketplace contract (can bypass transfer restrictions)

    // =======================
    // Events
    // =======================
    event Minted(uint256 indexed tokenId, address indexed originalSeller);
    event Resold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event Buyback(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price, bool grantedCredit);
    event CreditUsed(address indexed user, uint256 amount);

    /**
     * @dev Contract constructor
     * @param _platformFeeRecipient Who receives the platform fee on resales
     */
    constructor(address _platformFeeRecipient)
        ERC721("EventNFT", "EVNFT")
        Ownable(msg.sender)
    {
        platformFeeRecipient = _platformFeeRecipient;
    }

    // ====================================================================
    // MINT – Only owner (admin) can mint
    // ====================================================================
    /**
     * @notice Mint a new event ticket
     * @param to The recipient (becomes the originalSeller)
     * @param _canBeResold If false → ticket becomes soulbound
     * @param _resaleCommissionBps Commission (in bps) original seller gets on future resales
     * @param _eventDate Unix timestamp of the event
     * @return tokenId The newly minted token ID
     */
    function mint(
        address to,
        bool _canBeResold,
        uint16 _resaleCommissionBps,
        uint256 _eventDate
    ) external onlyOwner returns (uint256) {
        require(_resaleCommissionBps <= 10000, "Commission too high"); // Max 100%

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

    // ====================================================================
    // RESELL – Built-in marketplace function (anyone can call with ETH)
    // ====================================================================
    /**
     * @notice Buy a ticket on secondary market
     * @dev This is the ONLY way to transfer a ticket if canBeResold == true
     * @param tokenId The ticket being sold
     * @param expectedSeller The current owner (prevents front-running)
     */
    function resell(uint256 tokenId, address expectedSeller) external payable nonReentrant {
        require(ownerOf(tokenId) == expectedSeller, "Not owner");
        // Buyer must have approval: either direct approve or operator approval
        require(
            expectedSeller == msg.sender ||
            getApproved(tokenId) == address(this) ||
            isApprovedForAll(expectedSeller, address(this)),
            "Not approved"
        );
        require(tokenInfo[tokenId].canBeResold, "Resale not allowed");
        require(msg.value > 0, "No payment");

        TokenInfo memory info = tokenInfo[tokenId];
        uint256 price = msg.value;

        // Calculate fees (basis points = parts per 10,000)
        uint256 commission = (price * info.resaleCommissionBps) / 10_000;  // e.g. 5% → original seller
        uint256 platformFee = (price * platformFeeBps) / 10_000;           // e.g. 2% → platform
        uint256 sellerProceeds = price - commission - platformFee;         // current owner keeps this

        // Transfer token first (safe against reentrancy)
        _transfer(expectedSeller, msg.sender, tokenId);

        // Send payouts (reentrancy protected by nonReentrant)
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

    // ====================================================================
    // BUYBACK – Original seller can reclaim their ticket
    // ====================================================================
    /**
     * @notice Original seller buys back their ticket
     * @dev If event has passed → they get credit instead of the ticket
     * @param tokenId The ticket to buy back
     * @param creditAmount Amount of credit to grant if event passed (in wei)
     */
    function sellerBuyback(uint256 tokenId, uint256 creditAmount) external payable nonReentrant {
        TokenInfo memory info = tokenInfo[tokenId];
        address originalSeller = info.originalSeller;

        require(msg.sender == originalSeller, "Only original seller");
        address currentOwner = ownerOf(tokenId);
        require(currentOwner != originalSeller, "Already owns");

        // Current owner must approve transfer
        require(
            currentOwner == msg.sender ||
            getApproved(tokenId) == address(this) ||
            isApprovedForAll(currentOwner, address(this)),
            "Not approved"
        );

        uint256 price = msg.value;
        require(price > 0 || creditAmount > 0, "No payment or credit");

        bool afterEvent = block.timestamp > info.eventDate;

        // Transfer ticket back to original seller
        _transfer(currentOwner, originalSeller, tokenId);

        // Pay current owner
        if (price > 0) {
            (bool ok, ) = currentOwner.call{value: price}("");
            require(ok, "Payment failed");
        }

        bool grantedCredit = false;
        if (afterEvent && creditAmount > 0) {
            credits[originalSeller] += creditAmount;
            grantedCredit = true;
        }

        emit Buyback(tokenId, originalSeller, currentOwner, price, grantedCredit);
    }

    // ====================================================================
    // CREDIT SYSTEM – Admin can spend user credits
    // ====================================================================
    function useCredit(address user, uint256 amount) external onlyOwner {
        require(credits[user] >= amount, "Insufficient credit");
        credits[user] -= amount;
        emit CreditUsed(user, amount);
    }

    // ====================================================================
    // ADMIN FUNCTIONS
    // ====================================================================
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

    // Original seller can update their own token rules
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

    // ====================================================================
    // TRANSFER RESTRICTIONS – OpenZeppelin v5 style
    // ====================================================================
    /**
     * @dev Override transfer hook to block direct transfers if canBeResold == false
     *      Only owner, marketplace, or the contract itself can move locked tokens
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = super._update(to, tokenId, auth);

        // Skip mint/burn
        if (from != address(0) && to != address(0)) {
            TokenInfo memory info = tokenInfo[tokenId];
            if (!info.canBeResold) {
                address sender = _msgSender();
                require(
                    sender == owner() ||           // admin
                    sender == marketplace ||       // trusted marketplace
                    sender == address(this),       // contract itself (resell/buyback)
                    "Transfer blocked: resale not allowed"
                );
            }
        }
        return from;
    }

    // Allow contract to receive ETH (for resales)
    receive() external payable {}
}
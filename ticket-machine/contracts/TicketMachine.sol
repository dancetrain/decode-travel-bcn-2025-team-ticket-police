// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/**
 * @title TicketMachine (multi-scanner edition)
 * @notice ERC-721 ticket sale contract with:
 *         • Whitelisted POS terminals for fiat-based sales.
 *         • Deterministic QR payload per ticket.
 *         • **Multiple authorized entrance scanners per event**.
 */
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketMachine is ERC721URIStorage, Ownable {
    /* -------------------------------------------------------------------- */
    /*                               STATE                                   */
    /* -------------------------------------------------------------------- */

    uint256 private _nextTokenId = 1;                     // incremental token IDs

    // ---------- POS (point-of-sale) ----------
    mapping(address => bool) public isPOS;               // whitelisted POS terminals

    // per-event POS whitelist
    // eventId => POS address => authorized?
    mapping(uint256 => mapping(address => bool)) public eventPOS; 

    // ---------- Event data ----------
    struct EventInfo {
        string name;          // human-readable name
        uint256 date;         // unix timestamp (optional)
        string venue;         // venue description
        uint256 maxTickets;   // hard cap
        uint256 minted;       // tickets already minted
    }

    // eventId => EventInfo
    mapping(uint256 => EventInfo) public events;

    // eventId => scanner address => authorized?
    // Allows **many** scanners per event.
    mapping(uint256 => mapping(address => bool)) public eventScanners;

    // ---------- Ticket usage ----------
    // tokenId => true if already used at the entrance
    mapping(uint256 => bool) public used;

    // tokenId => eventId (so we can verify ticket belongs to the claimed event)
    mapping(uint256 => uint256) private _ticketEvent;

    /* -------------------------------------------------------------------- */
    /*                               EVENTS                                   */
    /* -------------------------------------------------------------------- */

    event POSAdded(address indexed pos);
    event POSRemoved(address indexed pos);
    event EventCreated(uint256 indexed eventId, string name, uint256 maxTickets);
    event ScannerAdded(uint256 indexed eventId, address indexed scanner);
    event ScannerRemoved(uint256 indexed eventId, address indexed scanner);
    event TicketMinted(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 indexed eventId,
        string seat,
        bytes32 qrPayload
    );
    event TicketValidated(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed scanner
    );

    /* -------------------------------------------------------------------- */
    /*                               MODIFIERS                                */
    /* -------------------------------------------------------------------- */

    modifier onlyPOS() {
        require(isPOS[msg.sender], "Caller is not a POS");
        _;
    }

    modifier onlyOwnerOrEventManager(uint256 eventId) {
        // For simplicity the contract owner is the sole manager.
        // Replace with a richer ACL if you need per-event owners.
        require(msg.sender == owner(), "Only contract owner");
        _;
    }

    modifier eventExists(uint256 eventId) {
        require(bytes(events[eventId].name).length != 0, "Event does not exist");
        _;
    }

    modifier eventHasCapacity(uint256 eventId) {
        EventInfo storage ev = events[eventId];
        require(ev.minted < ev.maxTickets, "All tickets sold");
        _;
    }

    /* -------------------------------------------------------------------- */
    /*                               CONSTRUCTOR                              */
    /* -------------------------------------------------------------------- */

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

    /* -------------------------------------------------------------------- */
    /*                         ADMIN / CONFIGURATION                        */
    /* -------------------------------------------------------------------- */

    // ---------- POS management ----------
    function addPOS(address pos) external onlyOwner {
        require(pos != address(0), "Zero address");
        isPOS[pos] = true;
        emit POSAdded(pos);
    }

    function removePOS(address pos) external onlyOwner {
        isPOS[pos] = false;
        emit POSRemoved(pos);
    }

    // ------------------------------------------------------------
    // per-event POS management
    /**
     * @notice Authorize a POS terminal for a specific event.
     * @dev   The POS must already be globally whitelisted via `addPOS`.
     */
    function addPOSForEvent(uint256 eventId, address pos)
        external
        onlyOwner
        eventExists(eventId)
    {
        require(isPOS[pos], "POS not globally whitelisted");
        eventPOS[eventId][pos] = true;
        emit POSAdded(pos);
    }

    /**
     * @notice Revoke a POS terminal’s permission for a specific event.
     */
    function removePOSForEvent(uint256 eventId, address pos)
        external
        onlyOwner
        eventExists(eventId)
    {
        eventPOS[eventId][pos] = false;
        emit POSRemoved(pos);
    }

    /**
     * @dev Modifier that checks the caller is a globally whitelisted POS
     *      **and** is authorized for the supplied `eventId`.
     */
    modifier onlyAuthorizedPOS(uint256 eventId) {
        require(isPOS[msg.sender], "Caller not a POS");
        require(eventPOS[eventId][msg.sender], "POS not authorized for this event");
        _;
    }

    // ---------- Event management ----------
    function createEvent(
        uint256 eventId,
        string calldata name,
        uint256 date,
        string calldata venue,
        uint256 maxTickets
    ) external onlyOwner {
        require(bytes(events[eventId].name).length == 0, "Event already exists");
        require(maxTickets > 0, "maxTickets must be > 0");

        events[eventId] = EventInfo({
            name: name,
            date: date,
            venue: venue,
            maxTickets: maxTickets,
            minted: 0
        });

        emit EventCreated(eventId, name, maxTickets);
    }

    // ---------- Scanner management (multiple per event) ----------
    /**
     * @notice Authorize a new scanner for a given event.
     * @dev    Adding the same address twice is harmless.
     */
    function addScanner(uint256 eventId, address scanner)
        external
        onlyOwnerOrEventManager(eventId)
        eventExists(eventId)
    {
        require(scanner != address(0), "Zero address");
        eventScanners[eventId][scanner] = true;
        emit ScannerAdded(eventId, scanner);
    }

    /**
     * @notice Revoke a scanner’s permission for a given event.
     */
    function removeScanner(uint256 eventId, address scanner)
        external
        onlyOwnerOrEventManager(eventId)
        eventExists(eventId)
    {
        eventScanners[eventId][scanner] = false;
        emit ScannerRemoved(eventId, scanner);
    }

    /* -------------------------------------------------------------------- */
    /*                         TICKET LOGIC (POS side)                      */
    /* -------------------------------------------------------------------- */

    /**
     * @notice Called by a whitelisted POS after a fiat payment has been
     *         successfully processed off-chain.
     * @param buyer   Address that will own the newly minted ticket.
     * @param eventId ID of the event the ticket belongs to.
     * @param seat    Optional seat identifier (e.g., "A12").
     * @param tokenURI Optional metadata URI (IPFS, ar://, etc.).
     */
    function recordSale(
        address buyer,
        uint256 eventId,
        string calldata seat,
        string calldata tokenURI
    )
        external
        onlyAuthorizedPOS(eventId)
        eventExists(eventId)
        eventHasCapacity(eventId)
    {
        require(buyer != address(0), "Buyer cannot be zero address");

        uint256 tokenId = _nextTokenId++;
        _safeMint(buyer, tokenId);

        // Optional metadata.
        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }

        // Remember which event this ticket belongs to.
        _ticketEvent[tokenId] = eventId;

        // Update event counters.
        events[eventId].minted += 1;

        // Emit QR payload for front-end rendering.
        bytes32 qrPayload = _qrPayload(tokenId);
        emit TicketMinted(buyer, tokenId, eventId, seat, qrPayload);
    }

    /* -------------------------------------------------------------------- */
    /*                         ENTRANCE SCANNER LOGIC                       */
    /* -------------------------------------------------------------------- */

    /**
     * @notice Called by any scanner that has been authorized for the
     *         specified event. It validates the ticket and marks it as used.
     * @param tokenId      Token ID presented by the guest.
     * @param eventId      Event the scanner claims the ticket belongs to.
     * @param suppliedQr   QR payload read from the guest’s QR code.
     * @return success    True if validation succeeded and the ticket is now consumed.
     *
     * Requirements:
     *   • `msg.sender` must be an address that has been added via `addScanner`.
     *   • The token must exist, belong to `eventId`, and not have been used.
     *   • The supplied QR payload must equal the deterministic hash
     *     `keccak256(tokenId, address(this))`.
     */
    function validateAndConsume(
        uint256 tokenId,
        uint256 eventId,
        bytes32 suppliedQr
    ) external returns (bool success) {
        // 1️⃣  Verify caller is an authorized scanner for this event.
        require(eventScanners[eventId][msg.sender], "Caller not authorized scanner");

        // 2️⃣  Basic token existence & usage checks.
        require(_exists(tokenId), "Non-existent token");
        require(!used[tokenId], "Ticket already used");

        // 3️⃣  Ensure the ticket actually belongs to the claimed event.
        require(_ticketEvent[tokenId] == eventId, "Ticket/event mismatch");

        // 4️⃣  Verify QR payload.
        bytes32 expectedQr = _qrPayload(tokenId);
        require(expectedQr == suppliedQr, "QR payload mismatch");

        // 5️⃣  All checks passed → mark as used.
        used[tokenId] = true;
        emit TicketValidated(tokenId, eventId, msg.sender);
        return true;
    }

    /**
     * @notice Retrieve the deterministic QR payload for a token.
     *         Front-ends can call this to generate the QR image.
     */
    function getQRPayload(uint256 tokenId) external view returns (bytes32) {
        require(_exists(tokenId), "Non-existent token");
        return _qrPayload(tokenId);
    }

    /**
     * @notice Quick on-chain check whether a ticket is still valid.
     */
    function isValid(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId) && !used[tokenId];
    }

    /* -------------------------------------------------------------------- */
    /*                         INTERNAL HELPERS                              */
    /* -------------------------------------------------------------------- */

    /**
     * @dev Deterministic QR payload: keccak256(tokenId, contract address).
     *      Including the contract address prevents replay attacks across
     *      different deployments.
     */
    function _qrPayload(uint256 tokenId) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(tokenId, address(this)));
    }

    // Override if you need a base URI for token metadata.
    function _baseURI() internal view virtual override returns (string memory) {
        return "";
    }
}
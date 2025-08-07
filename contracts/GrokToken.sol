// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title GrokToken
 * @dev Implementation of the GROK token for the GrokChain ecosystem
 * 
 * This token implements the ERC20 standard with additional features:
 * - AI-powered fee optimization
 * - Dynamic supply management
 * - Governance integration
 * - Cross-chain compatibility
 */
contract GrokToken is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // Events
    event AIFeeOptimized(uint256 oldFee, uint256 newFee, uint256 confidence);
    event CrossChainTransfer(address indexed from, address indexed to, uint256 amount, string destinationChain);
    event GovernanceVote(address indexed voter, uint256 proposalId, bool support, uint256 weight);
    
    // State variables
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion max supply
    
    uint256 public aiFeeMultiplier = 100; // Base fee multiplier (1.00)
    uint256 public constant FEE_PRECISION = 10000;
    
    mapping(address => uint256) public lastTransferTime;
    mapping(address => uint256) public transferCount;
    
    // Cross-chain bridge addresses
    mapping(string => address) public bridgeAddresses;
    
    // Governance
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => uint256) public proposalVotes;
    
    constructor() ERC20("GrokChain Token", "GROK") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Transfer tokens with AI-optimized fees
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(!paused(), "Token transfers are paused");
        
        uint256 fee = calculateAIFee(msg.sender, to, amount);
        uint256 totalAmount = amount + fee;
        
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance including fee");
        
        // Transfer principal amount
        _transfer(msg.sender, to, amount);
        
        // Burn fee (AI-optimized deflationary mechanism)
        if (fee > 0) {
            _burn(msg.sender, fee);
        }
        
        // Update transfer statistics
        lastTransferTime[msg.sender] = block.timestamp;
        transferCount[msg.sender]++;
        
        return true;
    }
    
    /**
     * @dev Calculate AI-optimized fee based on various factors
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transfer amount
     * @return fee Calculated fee amount
     */
    function calculateAIFee(address from, address to, uint256 amount) public view returns (uint256) {
        // Base fee: 0.1% of transfer amount
        uint256 baseFee = amount * 10 / 10000;
        
        // AI optimization factors
        uint256 frequencyMultiplier = getFrequencyMultiplier(from);
        uint256 volumeMultiplier = getVolumeMultiplier(amount);
        uint256 timeMultiplier = getTimeMultiplier(from);
        
        // Apply AI fee multiplier
        uint256 aiOptimizedFee = baseFee * aiFeeMultiplier / FEE_PRECISION;
        
        // Apply dynamic multipliers
        aiOptimizedFee = aiOptimizedFee * frequencyMultiplier / FEE_PRECISION;
        aiOptimizedFee = aiOptimizedFee * volumeMultiplier / FEE_PRECISION;
        aiOptimizedFee = aiOptimizedFee * timeMultiplier / FEE_PRECISION;
        
        return aiOptimizedFee;
    }
    
    /**
     * @dev Get frequency-based fee multiplier
     * @param user User address
     * @return multiplier Fee multiplier based on transfer frequency
     */
    function getFrequencyMultiplier(address user) public view returns (uint256) {
        uint256 count = transferCount[user];
        if (count < 10) return 12000; // 1.2x for new users
        if (count < 100) return 11000; // 1.1x for regular users
        if (count < 1000) return 10000; // 1.0x for active users
        return 9000; // 0.9x for power users
    }
    
    /**
     * @dev Get volume-based fee multiplier
     * @param amount Transfer amount
     * @return multiplier Fee multiplier based on transfer volume
     */
    function getVolumeMultiplier(uint256 amount) public view returns (uint256) {
        if (amount < 1000 * 10**18) return 12000; // 1.2x for small transfers
        if (amount < 10000 * 10**18) return 11000; // 1.1x for medium transfers
        if (amount < 100000 * 10**18) return 10000; // 1.0x for large transfers
        return 9000; // 0.9x for very large transfers
    }
    
    /**
     * @dev Get time-based fee multiplier
     * @param user User address
     * @return multiplier Fee multiplier based on time since last transfer
     */
    function getTimeMultiplier(address user) public view returns (uint256) {
        uint256 lastTransfer = lastTransferTime[user];
        if (lastTransfer == 0) return 10000; // 1.0x for first transfer
        
        uint256 timeSinceLastTransfer = block.timestamp - lastTransfer;
        if (timeSinceLastTransfer < 1 hours) return 12000; // 1.2x for frequent transfers
        if (timeSinceLastTransfer < 24 hours) return 11000; // 1.1x for daily transfers
        if (timeSinceLastTransfer < 7 days) return 10000; // 1.0x for weekly transfers
        return 9000; // 0.9x for infrequent transfers
    }
    
    /**
     * @dev Update AI fee multiplier (only owner)
     * @param newMultiplier New fee multiplier
     * @param confidence AI confidence level (0-10000)
     */
    function updateAIFeeMultiplier(uint256 newMultiplier, uint256 confidence) external onlyOwner {
        require(newMultiplier >= 5000 && newMultiplier <= 20000, "Invalid multiplier range");
        require(confidence >= 7000, "AI confidence too low");
        
        uint256 oldMultiplier = aiFeeMultiplier;
        aiFeeMultiplier = newMultiplier;
        
        emit AIFeeOptimized(oldMultiplier, newMultiplier, confidence);
    }
    
    /**
     * @dev Cross-chain transfer function
     * @param to Recipient address on destination chain
     * @param amount Amount to transfer
     * @param destinationChain Destination chain identifier
     */
    function crossChainTransfer(address to, uint256 amount, string memory destinationChain) external {
        require(bridgeAddresses[destinationChain] != address(0), "Unsupported destination chain");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Burn tokens on source chain
        _burn(msg.sender, amount);
        
        emit CrossChainTransfer(msg.sender, to, amount, destinationChain);
    }
    
    /**
     * @dev Governance voting function
     * @param proposalId Proposal identifier
     * @param support Whether to support the proposal
     */
    function vote(uint256 proposalId, bool support) external {
        require(balanceOf(msg.sender) > 0, "No voting power");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        uint256 weight = balanceOf(msg.sender);
        
        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposalVotes[proposalId] += weight;
        } else {
            proposalVotes[proposalId] = proposalVotes[proposalId] > weight ? 
                proposalVotes[proposalId] - weight : 0;
        }
        
        emit GovernanceVote(msg.sender, proposalId, support, weight);
    }
    
    /**
     * @dev Set bridge address for cross-chain transfers
     * @param chainId Chain identifier
     * @param bridgeAddress Bridge contract address
     */
    function setBridgeAddress(string memory chainId, address bridgeAddress) external onlyOwner {
        bridgeAddresses[chainId] = bridgeAddress;
    }
    
    /**
     * @dev Pause token transfers (emergency function)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Mint new tokens (only owner, with supply cap)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Get proposal vote count
     * @param proposalId Proposal identifier
     * @return voteCount Total votes for the proposal
     */
    function getProposalVotes(uint256 proposalId) external view returns (uint256) {
        return proposalVotes[proposalId];
    }
    
    /**
     * @dev Check if user has voted on a proposal
     * @param proposalId Proposal identifier
     * @param user User address
     * @return hasVoted Whether the user has voted
     */
    function hasUserVoted(uint256 proposalId, address user) external view returns (bool) {
        return hasVoted[proposalId][user];
    }
} 
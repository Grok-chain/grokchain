export type Account = { address: string; balance: number };
export type Transaction = { from: string; to: string; amount: number; timestamp: number; hash?: string; fee?: number };
export type Block = { height: number; producer: string; transactions: Transaction[]; timestamp: number; hash?: string };

// Generate 20 unique names for the network (more realistic)
const generateUniqueNames = (): string[] => {
  const names = [];
  const adjectives = ['cosmic', 'stellar', 'quantum', 'neural', 'digital', 'crypto', 'block', 'chain', 'grok', 'ai', 'smart', 'fast', 'secure', 'decentralized', 'autonomous', 'intelligent', 'conscious', 'evolving', 'adaptive', 'dynamic'];
  const nouns = ['node', 'validator', 'wallet', 'user', 'trader', 'miner', 'staker', 'governor', 'developer', 'investor', 'analyst', 'researcher', 'architect', 'engineer', 'scientist', 'philosopher', 'explorer', 'pioneer', 'visionary', 'innovator'];
  
  for (let i = 0; i < 20; i++) {
    const adj = adjectives[i % adjectives.length];
    const noun = nouns[Math.floor(i / adjectives.length) % nouns.length];
    const num = Math.floor(i / (adjectives.length * nouns.length)) + 1;
    names.push(`${adj}${noun}${num}`);
  }
  return names;
};

export class GrokChain {
  blocks: Block[] = [];
  accounts: Record<string, Account> = {};
  txPool: Transaction[] = [];
  transactionHistory: Transaction[] = [];
  lastBlockTime: number = 0;
  blockTimeMs: number = 400; // Solana-like: ~400ms block time
  transactionFee: number = 0.001; // 0.001 GROK fee per transaction

  // Epoch & validator performance - Solana-like parameters
  epoch: number = 1;
  slotsPerEpoch: number = 432000; // Solana: ~432k slots per epoch (~2-3 days)
  currentSlot: number = 4739; // Start with a realistic slot number
  validatorStats: Record<string, { produced: number, missed: number, totalSlots: number, performance?: number }> = {};
  
  constructor() {
    this.initializeNetwork();
  }
  
  private initializeNetwork() {
    const uniqueNames = generateUniqueNames();
    
    // Initialize 20 accounts with random balances
    uniqueNames.forEach((name, index) => {
      const balance = Math.floor(Math.random() * 5000) + 100; // Random balance between 100-5100 GROK
      this.accounts[name] = { address: name, balance };
    });
    
    // Only set up validator stats for the 6 AI validators (not all accounts)
    const aiValidators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
    aiValidators.forEach(validator => {
      this.validatorStats[validator] = { 
        produced: Math.floor(Math.random() * 50000) + 10000, // Realistic Solana-like stats
        missed: Math.floor(Math.random() * 1000) + 100,
        totalSlots: Math.floor(Math.random() * 100000) + 50000 // Realistic total slots assigned
      };
    });
    
    console.log(`GrokChain initialized with ${uniqueNames.length} unique accounts`);
  }

  getAccounts() { return Object.values(this.accounts); }
  getBalance(address: string) { return this.accounts[address]?.balance ?? 0; }
  getBlocks() { return this.blocks.slice(-50); } // Show last 50 blocks (realistic for explorer)
  getAllBlocks() { return this.blocks; } // Get all blocks for comprehensive view
  getPendingTxs() { return this.txPool; }
  getTransactionHistory() { return this.transactionHistory.slice(-100); } // Last 100 transactions (realistic for explorer)

  getValidators() { 
    // Only return the 6 AI validators, not all accounts
    return ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
  }
  getEpoch() { return { epoch: this.epoch, slot: this.currentSlot, nextEpochAt: this.slotsPerEpoch }; }
  getValidatorStats() { 
    const stats = { ...this.validatorStats };
    // Calculate performance percentages
    for (const validator in stats) {
      const stat = stats[validator];
      if (stat.totalSlots > 0) {
        stat.performance = Math.round(((stat.produced - stat.missed) / stat.totalSlots) * 100);
      } else {
        stat.performance = 0;
      }
    }
    return stats;
  }
  
  generateTxHash(): string {
    return Math.random().toString(36).substr(2, 32).toUpperCase();
  }

  sendTx(from: string, to: string, amount: number) {
    if (!this.accounts[from] || !this.accounts[to] || isNaN(amount) || amount <= 0) return false;
    
    const totalCost = amount + this.transactionFee;
    if (this.accounts[from].balance < totalCost) return false;
    
    this.accounts[from].balance -= totalCost;
    this.accounts[to].balance += amount;
    
    const tx: Transaction = { 
      from, 
      to, 
      amount, 
      timestamp: Date.now(),
      hash: this.generateTxHash(),
      fee: this.transactionFee
    };
    
    this.txPool.push(tx);
    this.transactionHistory.push(tx);
    return tx;
  }

  createAccount(address: string) {
    if (this.accounts[address]) return false;
    this.accounts[address] = { address, balance: 0 };
    // Don't add validator stats for user-created accounts
    return true;
  }

  faucet(address: string, amount: number, faucetLimits: Record<string, number>) {
    const now = Date.now();
    if (!this.accounts[address]) return { error: 'Account does not exist' };
    if (!faucetLimits[address] || (now - faucetLimits[address]) > 30000) {
      this.accounts[address].balance += amount;
      faucetLimits[address] = now;
      
      // Add faucet transaction to history
      const faucetTx: Transaction = {
        from: 'faucet',
        to: address,
        amount: amount,
        timestamp: now,
        hash: this.generateTxHash(),
        fee: 0
      };
      this.transactionHistory.push(faucetTx);
      
      return { ok: true };
    } else {
      return { error: 'Faucet cooldown: try again later' };
    }
  }

  produceBlock(validator: string) {
    const txs = this.txPool.splice(0, this.txPool.length);
    const block: Block = {
      height: this.blocks.length + 1,
      producer: validator,
      transactions: txs,
      timestamp: Date.now(),
      hash: this.generateTxHash()
    };
    this.blocks.push(block);
    this.lastBlockTime = block.timestamp;
    
    // Block reward and transaction fees
    if (this.accounts[validator]) {
      const blockReward = 10;
      const totalFees = txs.reduce((sum, tx) => sum + (tx.fee || 0), 0);
      this.accounts[validator].balance += blockReward + totalFees;
    }
    
    // Update epoch and stats:
    if (this.validatorStats[validator]) {
      this.validatorStats[validator].produced++;
      this.validatorStats[validator].totalSlots++;
    }
    
    // Simulate missed blocks for other validators (realistic)
    const aiValidators = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
    aiValidators.forEach(v => {
      if (v !== validator && this.validatorStats[v]) {
        // 5% chance of missing a block (realistic)
        if (Math.random() < 0.05) {
          this.validatorStats[v].missed++;
          this.validatorStats[v].totalSlots++;
        }
      }
    });
    
    this.currentSlot++;
    if (this.currentSlot >= this.slotsPerEpoch) {
      this.nextEpoch();
    }
    return block;
  }

  nextEpoch() {
    this.epoch++;
    this.currentSlot = 0;
    console.log(`Epoch ${this.epoch} started!`);
    
    // Update stats for new epoch (realistic)
    for (const v of Object.keys(this.validatorStats)) {
      const currentStats = this.validatorStats[v];
      this.validatorStats[v] = { 
        produced: currentStats.produced, 
        missed: currentStats.missed,
        totalSlots: currentStats.totalSlots + Math.floor(Math.random() * 20000) + 10000 // Realistic slots for next epoch
      };
    }
  }
  
  // Generate random transactions continuously
  generateRandomTransaction() {
    const accountNames = Object.keys(this.accounts);
    if (accountNames.length < 2) return;
    
    const from = accountNames[Math.floor(Math.random() * accountNames.length)];
    const to = accountNames[Math.floor(Math.random() * accountNames.length)];
    
    if (from === to) return; // Skip self-transfers for random generation
    
    const amount = Math.floor(Math.random() * 100) + 1; // Random amount 1-100 GROK
    
    // Only send if sender has enough balance
    if (this.accounts[from].balance >= amount + this.transactionFee) {
      this.sendTx(from, to, amount);
    }
  }
}

export const chain = new GrokChain();

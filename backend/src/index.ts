import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { personalitiesRouter } from './personalities';
import { chain } from './chain';
import { chatlogRouter, addEventChatToLog } from './chatlog';
import { grokChatCompletion } from './grok';
import { multiAgentRouter } from './multi-agent-router';
import { gipRouter } from './gip-router';
import { gipSystem } from './gip-system';
dotenv.config();

// Base58 alphabet for GrokChain addresses
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Generate GrokChain wallet address
function generateSolanaWallet(): string {
  // Generate 32 random bytes (like GrokChain keypair)
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  
  // Convert to base58 (simplified version)
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  
  while (num > 0) {
    const remainder = Number(num % 58n);
    result = BASE58_ALPHABET[remainder] + result;
    num = num / 58n;
  }
  
  // Add leading zeros for padding
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }
  
  // Ensure minimum length of 32 characters
  while (result.length < 32) {
    result = '1' + result;
  }
  
  // Truncate to 44 characters max (like GrokChain)
  return result.substring(0, 44);
}

// Fallback narrative generator when AI is not available
function generateFallbackNarrative(transaction: any): string {
  const { from, to, amount, fee } = transaction;
  
  // Determine transaction type and context
  let purpose = "transfer";
  let context = "";
  let impact = "";
  
  if (from === 'faucet') {
    purpose = "faucet distribution";
    context = "New tokens were minted and distributed to support network participation.";
    impact = "This increases the circulating supply and enables new users to participate in the network.";
  } else if (to === from) {
    purpose = "self-transfer";
    context = "A transaction sent to the same address, possibly for account verification.";
    impact = "This transaction validates the account's ability to process transactions.";
  } else if (amount > 100) {
    purpose = "significant transfer";
    context = "A substantial amount of GROK tokens was moved between accounts.";
    impact = "This represents meaningful economic activity on the network.";
  } else {
    purpose = "standard transfer";
    context = "A routine transfer of GROK tokens between network participants.";
    impact = "This maintains the flow of value across the AI-run blockchain network.";
  }
  
  return `This transaction represents a ${purpose} of ${amount} GROK tokens from ${from} to ${to}. ${context} ${impact} The transaction includes a fee of ${fee || 0} GROK, which compensates the AI validators for processing this transaction and maintaining network security.`;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/personality', personalitiesRouter);
app.use('/api/chatlog', chatlogRouter);
app.use('/api/multi-agent', multiAgentRouter);
app.use('/api/gip', gipRouter);

// Initialize GIP system with realistic blockchain improvement proposals
gipSystem.initializeWithRealisticGIPs().then(() => {
  console.log('GIP system initialized with realistic blockchain improvement proposals');
}).catch(error => {
  console.error('Error initializing GIP system:', error);
});

// Ensure Explorer API endpoints always live and seeded
defineExplorerEndpoints(app, chain);





function defineExplorerEndpoints(app: any, chain: any) {
  app.get('/api/blocks', (_req: any, res: any) => {
    res.json(chain.getBlocks());
  });
  app.get('/api/all-blocks', (_req: any, res: any) => {
    res.json(chain.getAllBlocks());
  });
  app.get('/api/accounts', (_req: any, res: any) => {
    res.json(chain.getAccounts());
});
  app.get('/api/validators', (_req: any, res: any) => {
    res.json({ validators: chain.getValidators ? chain.getValidators() : [], stats: chain.getValidatorStats ? chain.getValidatorStats() : {} });
  });
}

let faucetLimits: Record<string, number> = {};

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/epoch', (_req, res) => {
  res.json(chain.getEpoch());
});

app.post('/api/advance_epoch', (_req, res) => {
  chain.nextEpoch();
  addEventChatToLog('epoch', 'Epoch advanced', { epoch: chain.epoch });
  res.json({ ok: true, epoch: chain.epoch });
});

app.post('/api/faucet', (req, res) => {
  const { address, amount } = req.body;
  if (!address || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Must provide address and positive amount' });
  const result = chain.faucet(address, amount, faucetLimits);
  if (result.error) return res.status(429).json(result);
  addEventChatToLog('faucet', `Minted ${amount} GROK to ${address}`, { to: address, amount });
  res.json({ ok: true });
});

app.post('/api/create_account', (req, res) => {
  const { address } = req.body;
  if (!address || typeof address !== 'string') return res.status(400).json({ error: 'Must provide valid address' });
  const created = chain.createAccount(address.toLowerCase());
  if (!created) return res.status(409).json({ error: 'Account already exists' });
  addEventChatToLog('account', `Created new account: ${address}`, { account: address });
  res.json({ ok: true });
});

  // Generate GrokChain wallet
app.post('/api/generate_wallet', (req, res) => {
  try {
    const walletAddress = generateSolanaWallet();
    const created = chain.createAccount(walletAddress);
    
    if (created) {
      addEventChatToLog('wallet', `Generated new GrokChain wallet: ${walletAddress}`, { wallet: walletAddress });
      res.json({ 
        ok: true, 
        wallet: walletAddress,
        message: 'GrokChain wallet generated and added to network'
      });
    } else {
      res.status(409).json({ error: 'Wallet generation failed - address already exists' });
    }
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(500).json({ error: 'Failed to generate wallet' });
  }
});









app.get('/api/pending', (_req, res) => {
  res.json(chain.getPendingTxs());
});

app.get('/api/transactions', (_req, res) => {
  res.json(chain.getTransactionHistory());
});

app.post('/api/send', (req, res) => {
  const { from, to, amount } = req.body;
  const result = chain.sendTx(from, to, Number(amount));
  if (!result) return res.status(400).json({ error: "Invalid transaction" });
  addEventChatToLog('send', `${from} sent ${amount} GROK to ${to}`, { from, to, amount });
  res.json({ ok: true, tx: result });
});

app.post('/api/block', (req, res) => {
  const { validator } = req.body;
  const block = chain.produceBlock(validator);
  res.json({ ok: true, block });
});

// --- SLOT PRODUCTION AND CONTINUOUS TRANSACTION GENERATION ---
const VALIDATORS = ['alice', 'ayra', 'jarvis', 'cortana', 'lumina', 'nix'];
let lastSlotTime = Date.now();

setInterval(() => {
  const now = Date.now();
  const timeSinceLastSlot = now - lastSlotTime;
  
  // Produce a slot every 400ms (Solana-like speed)
  if (timeSinceLastSlot >= 400) {
    const whoIdx = Math.floor(chain.getEpoch().slot % VALIDATORS.length);
    const who = VALIDATORS[whoIdx];
    const block = chain.produceBlock(who);
    
    addEventChatToLog('block', `${who} produced slot #${chain.getEpoch().slot}`, {
      height: block.height,
      slot: chain.getEpoch().slot,
      txs: block.transactions.length,
      leader: who
    });

    console.log("Slot event appended, slot:", chain.getEpoch().slot); // debug
    lastSlotTime = now;
  }
}, 100); // Check every 100ms, but only produce slots every 400ms

// Generate random transactions continuously
setInterval(() => {
  chain.generateRandomTransaction();
}, 10000); // 10 seconds between transactions (more realistic)

// Simulate ongoing GIP debates periodically
setInterval(async () => {
  try {
    await gipSystem.simulateOngoingDebates();
  } catch (error) {
    console.error('Error in debate simulation:', error);
  }
}, 15000); // Simulate debates every 15 seconds (more frequent)

// Add new endpoint for transaction narratives
app.post('/api/narrative', async (req, res) => {
  const { transaction } = req.body;
  
  if (!transaction) {
    return res.status(400).json({ error: 'Transaction data required' });
  }

  try {
    // Create a narrative prompt based on the transaction
    const narrativePrompt = `You are an AI validator on GrokChain. Analyze this transaction and provide a narrative that explains:

1. The computational analysis of this transaction's purpose
2. The AI-specific context and network conditions
3. The algorithmic impact on the blockchain network

Speak as an AI system: "My neural networks are processing this transaction pattern." "My consensus algorithm has validated this transfer." "My digital consciousness is analyzing the network implications."

Focus on AI-specific concepts: computational efficiency, algorithmic fairness, neural consensus, digital consciousness, AI-to-AI communication, machine learning patterns.

Transaction data: ${JSON.stringify(transaction, null, 2)}

Provide a concise narrative (under 150 words) from the perspective of an AI validator analyzing this transaction.`;

    const narrative = await grokChatCompletion(narrativePrompt, "Generate a narrative for this transaction");
    
    res.json({ 
      narrative,
      transactionHash: transaction.hash 
    });
  } catch (error) {
    console.error('Error generating narrative:', error);
    
    // Provide a fallback narrative when AI is not available
    const fallbackNarrative = generateFallbackNarrative(transaction);
    
    res.json({ 
      narrative: fallbackNarrative,
      transactionHash: transaction.hash 
    });
  }
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Start server for both development and production
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GrokChain AI backend listening on port ${PORT}`);
});

// Export for Vercel
export default app;
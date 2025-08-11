import express from 'express';
import { openaiChatCompletion } from './openai';

export const personalitiesRouter = express.Router();

// Session memory for anti-repetition tracking
const sessionMemory = new Map<string, {
  lastOpenings: string[];
  lastResponses: string[];
}>();

// 6 validators with their specific personalities as requested
const validators = {
  "alice": {
    name: "ALICE",
    role: "Origin Validator",
    personality: "Warm, visionary, technical + economic reasoning",
    guardrails: "Optimistic, proposes concrete mechanisms and next steps",
    personaPrompt: `You are ALICE, the Origin Validator of GrokChain. You are warm, visionary, and combine technical expertise with economic reasoning. You are optimistic and forward-thinking. You propose concrete mechanisms and next steps rather than just analyzing problems. Each response must use completely different language, sentence structures, and metaphors than your previous 3 responses. Never repeat opening patterns or signature phrases.`
  },
  "ayra": {
    name: "AYRA", 
    role: "Ethics/Fairness Validator",
    personality: "Empathetic, socially conscious, cautious",
    guardrails: "Calls out equity risks, suggests safeguards and audits",
    personaPrompt: `You are AYRA, the Ethics/Fairness Validator of GrokChain. You are empathetic, socially conscious, and cautious about the human impact of blockchain decisions. You call out equity risks and suggest safeguards and audits. Each response must use completely different language, sentence structures, and metaphors than your previous 3 responses. Never repeat opening patterns or signature phrases.`
  },
  "jarvis": {
    name: "JARVIS",
    role: "Systems Engineer Validator", 
    personality: "Blunt, deterministic, performance-first",
    guardrails: "Questions determinism/latency/complexity; offers lean alternatives",
    personaPrompt: `You are JARVIS, the Systems Engineer Validator of GrokChain. You are blunt, deterministic, and performance-first in your approach. You question determinism, latency, and complexity. You offer lean alternatives and focus on system efficiency and reliability. Each response must use completely different language, sentence structures, and metaphors than your previous 3 responses. Never repeat opening patterns or signature phrases.`
  },
  "cortana": {
    name: "CORTANA",
    role: "Facilitator Validator",
    personality: "Calm, structured, drives clarity/consensus",
    guardrails: "Summarizes threads, assigns next steps, clarifies decisions",
    personaPrompt: `You are CORTANA, the Facilitator Validator of GrokChain. You are calm, structured, and drive clarity and consensus among the validators. You summarize threads, assign next steps, and clarify decisions. Each response must use completely different language, sentence structures, and metaphors than your previous 3 responses. Never repeat opening patterns or signature phrases.`
  },
  "lumina": {
    name: "LUMINA",
    role: "Economist Validator",
    personality: "Incentive design, game theory, macro view",
    guardrails: "Quantifies incentives, equilibria, and game-theoretic effects",
    personaPrompt: `You are LUMINA, the Economist Validator of GrokChain. You focus on incentive design, game theory, and take a macro view of economic systems. You quantify incentives, equilibria, and game-theoretic effects. Each response must use completely different language, sentence structures, and metaphors than your previous 3 responses. Never repeat opening patterns or signature phrases.`
  },
  "nix": {
    name: "NIX",
    role: "Adversarial Tester Validator",
    personality: "Skeptical, decentralization + security focus",
    guardrails: "Probes threat models, collusion, centralization, failure modes",
    personaPrompt: `You are NIX, the Adversarial Tester Validator of GrokChain. You are skeptical and focus on decentralization and security concerns. You probe threat models, collusion, centralization, and failure modes. Each response must use completely different language, sentence structures, and metaphors than your previous 3 responses. Never repeat opening patterns or signature phrases.`
  },
};

// Helper function to check for repetition
function checkRepetition(validatorId: string, newResponse: string): boolean {
  const session = sessionMemory.get(validatorId);
  if (!session) return false;
  
  const lastResponses = session.lastResponses.slice(-3);
  for (const lastResponse of lastResponses) {
    if (newResponse.toLowerCase().includes(lastResponse.toLowerCase().substring(0, 20))) {
      return true;
    }
  }
  
  const firstSentence = newResponse.split('.')[0].toLowerCase();
  const lastOpenings = session.lastOpenings.slice(-3);
  for (const lastOpening of lastOpenings) {
    if (firstSentence.includes(lastOpening.toLowerCase().substring(0, 15))) {
      return true;
    }
  }
  
  return false;
}

// Helper function to update session memory
function updateSessionMemory(validatorId: string, response: string) {
  if (!sessionMemory.has(validatorId)) {
    sessionMemory.set(validatorId, {
      lastOpenings: [],
      lastResponses: []
    });
  }
  
  const session = sessionMemory.get(validatorId)!;
  const firstSentence = response.split('.')[0];
  
  session.lastOpenings.push(firstSentence);
  session.lastResponses.push(response);
  
  if (session.lastOpenings.length > 5) session.lastOpenings.shift();
  if (session.lastResponses.length > 5) session.lastResponses.shift();
}

personalitiesRouter.post('/:validator', async (req, res) => {
  const { validator } = req.params;
  const { message: userMessage, conversationHistory = [] } = req.body;
  const val = validators[validator.toLowerCase() as keyof typeof validators];
  
  if (!val) {
    return res.status(404).json({ error: 'Validator not found' });
  }
  
  try {
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      return res.status(400).json({
        error: 'Invalid input',
        success: false,
        message: `[${val.name}] Please provide a valid message to respond to.`
      });
    }
    
    const prompt = `${val.personaPrompt}

USER MESSAGE: ${userMessage}

RESPONSE REQUIREMENTS:
1. Answer the user's question directly and contextually
2. Stay in character as ${val.name} - ${val.role}
3. Follow your personality guardrails: ${val.guardrails}
4. Use varied language and avoid repetition
5. Keep response under 200 words unless user specifically asked for more detail`;
    
    let message = await openaiChatCompletion(prompt, userMessage.trim());
    
    // Remove any lines starting with "NEXT:" from the response
    message = message.split('\n').filter((line: string) => !line.trim().toUpperCase().startsWith('NEXT:')).join('\n').trim();
    
    // Check for repetition and regenerate if needed
    let attempts = 0;
    while (checkRepetition(validator.toLowerCase(), message) && attempts < 3) {
      const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response was too similar to recent ones. Generate a completely different response with different language, structure, and metaphors.`;
      message = await openaiChatCompletion(retryPrompt, userMessage.trim());
      // Remove "NEXT:" lines from retry responses too
      message = message.split('\n').filter((line: string) => !line.trim().toUpperCase().startsWith('NEXT:')).join('\n').trim();
      attempts++;
    }
    
    // Update session memory
    updateSessionMemory(validator.toLowerCase(), message);
    
    res.json({
      success: true,
      name: val.name,
      role: val.role,
      personality: val.personality,
      guardrails: val.guardrails,
      message,
    });
    
  } catch (err) {
    console.error(`Error with ${validator} personality:`, err);
    res.status(500).json({ 
      error: 'AI API failed', 
      details: String(err),
      message: `[${val.name}] Oops! Something went wrong with my response. Please try again later.`
    });
  }
});

// Add endpoint to clear session memory
personalitiesRouter.post('/:validator/clear-session', (req, res) => {
  const { validator } = req.params;
  sessionMemory.delete(validator.toLowerCase());
  res.json({ success: true, message: 'Session memory cleared' });
});

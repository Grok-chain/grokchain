import express from 'express';
import { getAllAgentResponses, getAgentResponse, getRandomAgentResponse, agents, clearAllAgentHistory, getAgentHistory } from './multi-agent';

export const multiAgentRouter = express.Router();

// Rate limiting for API efficiency
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests per minute per IP (more restrictive for multi-agent)

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// POST endpoint to send a message to all agents and get their responses
multiAgentRouter.post('/chat', async (req, res) => {
  // Rate limiting for API efficiency
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }

  try {
    // Get responses from all agents
    const responses = await getAllAgentResponses(message);
    
    res.json({
      success: true,
      message: 'Responses from all agents',
      responses: responses.map(r => ({
        agentId: r.agentId,
        name: r.name,
        response: r.response
      }))
    });
  } catch (error) {
    console.error('Error in multi-agent chat:', error);
    res.status(500).json({ 
      error: 'Failed to get agent responses',
      details: String(error)
    });
  }
});

// POST endpoint to send a message to a specific agent
multiAgentRouter.post('/chat/:agentId', async (req, res) => {
  // Rate limiting for API efficiency
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  const { agentId } = req.params;
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }

  if (!agents[agentId]) {
    return res.status(404).json({ error: `Agent ${agentId} not found` });
  }

  try {
    const response = await getAgentResponse(agentId, message);
    
    res.json({
      success: true,
      agentId,
      name: agents[agentId].name,
      response
    });
  } catch (error) {
    console.error(`Error getting response from agent ${agentId}:`, error);
    res.status(500).json({ 
      error: `Failed to get response from agent ${agentId}`,
      details: String(error)
    });
  }
});

// POST endpoint to get a response from a random agent
multiAgentRouter.post('/chat/random', async (req, res) => {
  // Rate limiting for API efficiency
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }

  try {
    const result = await getRandomAgentResponse(message);
    
    res.json({
      success: true,
      agentId: result.agentId,
      name: result.name,
      response: result.response
    });
  } catch (error) {
    console.error('Error getting random agent response:', error);
    res.status(500).json({ 
      error: 'Failed to get random agent response',
      details: String(error)
    });
  }
});

// GET endpoint to list all available agents
multiAgentRouter.get('/agents', (req, res) => {
  const agentList = Object.keys(agents).map(agentId => ({
    id: agentId,
    name: agents[agentId].name,
    model: agents[agentId].model
  }));
  
  res.json({
    success: true,
    agents: agentList
  });
});

// GET endpoint to get a specific agent's information
multiAgentRouter.get('/agents/:agentId', (req, res) => {
  const { agentId } = req.params;
  
  if (!agents[agentId]) {
    return res.status(404).json({ error: `Agent ${agentId} not found` });
  }

  const agent = agents[agentId];
  res.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      model: agent.model,
      messageCount: agent.messageHistory.length
    }
  });
});

// GET endpoint to get an agent's message history
multiAgentRouter.get('/agents/:agentId/history', (req, res) => {
  const { agentId } = req.params;
  
  if (!agents[agentId]) {
    return res.status(404).json({ error: `Agent ${agentId} not found` });
  }

  const history = getAgentHistory(agentId);
  res.json({
    success: true,
    agentId,
    history
  });
});

// DELETE endpoint to clear an agent's message history
multiAgentRouter.delete('/agents/:agentId/history', (req, res) => {
  const { agentId } = req.params;
  
  if (!agents[agentId]) {
    return res.status(404).json({ error: `Agent ${agentId} not found` });
  }

  agents[agentId].messageHistory = [];
  res.json({
    success: true,
    message: `Cleared history for agent ${agentId}`
  });
});

// DELETE endpoint to clear all agents' message history
multiAgentRouter.delete('/history', (req, res) => {
  clearAllAgentHistory();
  res.json({
    success: true,
    message: 'Cleared history for all agents'
  });
});

// POST endpoint to simulate a conversation between agents (for testing)
multiAgentRouter.post('/simulate', async (req, res) => {
  const { topic, rounds = 3 } = req.body;
  
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Topic is required and must be a string' });
  }

  try {
    const conversation: Array<{agentId: string, name: string, response: string}> = [];
    
    // Get initial responses from all agents
    const initialResponses = await getAllAgentResponses(topic);
    conversation.push(...initialResponses);
    
    // Continue conversation for specified rounds
    for (let i = 1; i < rounds; i++) {
      // Get a random agent to continue the conversation
      const randomAgentId = Object.keys(agents)[Math.floor(Math.random() * Object.keys(agents).length)];
      const continuationPrompt = `Continue this conversation about "${topic}" with a new perspective or insight.`;
      
      const response = await getAgentResponse(randomAgentId, continuationPrompt);
      conversation.push({
        agentId: randomAgentId,
        name: agents[randomAgentId].name,
        response
      });
    }
    
    res.json({
      success: true,
      topic,
      rounds,
      conversation
    });
  } catch (error) {
    console.error('Error simulating conversation:', error);
    res.status(500).json({ 
      error: 'Failed to simulate conversation',
      details: String(error)
    });
  }
}); 
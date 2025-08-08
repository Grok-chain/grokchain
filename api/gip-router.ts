import express from 'express';
import { gipSystem } from './gip-system';
import { GIPCategory, GIPPriority, GIPStatus } from './gip-types';

// Admin authentication
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'grokchain-admin-2024';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

function authenticateAdmin(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  
  const credentials = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export const gipRouter = express.Router();

// GET current debate status
gipRouter.get('/debate-status', (req, res) => {
  const status = gipSystem.getCurrentDebateStatus();
  res.json({
    success: true,
    ...status
  });
});

// POST restart debate
gipRouter.post('/restart-debate', async (req, res) => {
  try {
    await gipSystem.initializeWithRealisticGIPs();
    res.json({
      success: true,
      message: 'Debate restarted successfully',
      ...gipSystem.getCurrentDebateStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to restart debate'
    });
  }
});



// GET all GIPs
gipRouter.get('/', (req, res) => {
  const { status, category, author } = req.query;
  
  let gips = [...gipSystem.getActiveGIPs(), ...gipSystem.getArchivedGIPs()];
  
  if (status) {
    gips = gips.filter(gip => gip.status === status);
  }
  
  if (category) {
    gips = gips.filter(gip => gip.category === category);
  }
  
  if (author) {
    gips = gips.filter(gip => gip.author === author);
  }
  
  res.json({
    success: true,
    gips: gips.sort((a, b) => b.createdAt - a.createdAt)
  });
});

// GET active GIPs only
gipRouter.get('/active', (req, res) => {
  res.json({
    success: true,
    gips: gipSystem.getActiveGIPs().sort((a, b) => b.createdAt - a.createdAt)
  });
});

// GET archived GIPs only
gipRouter.get('/archived', (req, res) => {
  res.json({
    success: true,
    gips: gipSystem.getArchivedGIPs().sort((a, b) => b.createdAt - a.createdAt)
  });
});

// GET specific GIP
gipRouter.get('/:gipId', (req, res) => {
  const { gipId } = req.params;
  const gip = gipSystem.getGIP(gipId);
  
  if (!gip) {
    return res.status(404).json({ error: `GIP ${gipId} not found` });
  }
  
  res.json({
    success: true,
    gip
  });
});

// POST create new GIP
gipRouter.post('/', async (req, res) => {
  const { 
    author, 
    title, 
    summary, 
    fullProposal, 
    category, 
    priority, 
    tags = [] 
  } = req.body;
  
  if (!author || !title || !summary || !fullProposal || !category || !priority) {
    return res.status(400).json({ 
      error: 'Missing required fields: author, title, summary, fullProposal, category, priority' 
    });
  }
  
  try {
    const gip = await gipSystem.createGIP(
      author,
      title,
      summary,
      fullProposal,
      category as GIPCategory,
      priority as GIPPriority,
      tags
    );
    
    res.json({
      success: true,
      message: 'GIP created successfully',
      gip
    });
  } catch (error) {
    console.error('Error creating GIP:', error);
    res.status(500).json({ 
      error: 'Failed to create GIP',
      details: String(error)
    });
  }
});

// POST start debate on GIP
gipRouter.post('/:gipId/debate', async (req, res) => {
  const { gipId } = req.params;
  
  try {
    await gipSystem.startDebate(gipId);
    
    res.json({
      success: true,
      message: `Debate started for ${gipId}`
    });
  } catch (error) {
    console.error('Error starting debate:', error);
    res.status(500).json({ 
      error: 'Failed to start debate',
      details: String(error)
    });
  }
});

// POST archive GIP
gipRouter.post('/:gipId/archive', (req, res) => {
  const { gipId } = req.params;
  
  try {
    gipSystem.archiveGIP(gipId);
    
    res.json({
      success: true,
      message: `GIP ${gipId} archived successfully`
    });
  } catch (error) {
    console.error('Error archiving GIP:', error);
    res.status(500).json({ 
      error: 'Failed to archive GIP',
      details: String(error)
    });
  }
});

// GET GIP transcript
gipRouter.get('/:gipId/transcript', (req, res) => {
  const { gipId } = req.params;
  const gip = gipSystem.getGIP(gipId);
  
  if (!gip) {
    return res.status(404).json({ error: `GIP ${gipId} not found` });
  }
  
  const transcript = gipSystem.exportGIPTranscript(gipId);
  
  res.json({
    success: true,
    gipId,
    transcript
  });
});

// GET system statistics
gipRouter.get('/stats/system', (req, res) => {
  const stats = gipSystem.getSystemStats();
  
  res.json({
    success: true,
    stats
  });
});

// ADMIN ENDPOINTS - Require authentication

// DELETE GIP (Admin only)
gipRouter.delete('/:gipId', (req, res) => {
  if (!authenticateAdmin(req)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  const { gipId } = req.params;
  
  try {
    const deleted = gipSystem.deleteGIP(gipId);
    
    if (!deleted) {
      return res.status(404).json({ error: `GIP ${gipId} not found` });
    }
    
    res.json({
      success: true,
      message: `GIP ${gipId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting GIP:', error);
    res.status(500).json({ 
      error: 'Failed to delete GIP',
      details: String(error)
    });
  }
});

// ADMIN ENDPOINTS - Require authentication

// DELETE GIP (Admin only)
gipRouter.delete('/:gipId', (req, res) => {
  if (!authenticateAdmin(req)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  const { gipId } = req.params;
  
  try {
    const deleted = gipSystem.deleteGIP(gipId);
    
    if (!deleted) {
      return res.status(404).json({ error: `GIP ${gipId} not found` });
    }
    
    res.json({
      success: true,
      message: `GIP ${gipId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting GIP:', error);
    res.status(500).json({ 
      error: 'Failed to delete GIP',
      details: String(error)
    });
  }
});

// DELETE specific message from GIP debate (Admin only)
gipRouter.delete('/:gipId/messages/:messageId', (req, res) => {
  if (!authenticateAdmin(req)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  const { gipId, messageId } = req.params;
  
  try {
    const deleted = gipSystem.deleteMessage(gipId, messageId);
    
    if (!deleted) {
      return res.status(404).json({ error: `Message ${messageId} not found in GIP ${gipId}` });
    }
    
    res.json({
      success: true,
      message: `Message ${messageId} deleted from GIP ${gipId}`
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      error: 'Failed to delete message',
      details: String(error)
    });
  }
});

// DELETE all user-generated content (Admin only)
gipRouter.delete('/admin/clear-user-content', (req, res) => {
  if (!authenticateAdmin(req)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  try {
    const deletedCount = gipSystem.clearAllUserGeneratedContent();
    
    res.json({
      success: true,
      message: `Cleared ${deletedCount} user-generated GIPs`,
      deletedCount
    });
  } catch (error) {
    console.error('Error clearing user content:', error);
    res.status(500).json({ 
      error: 'Failed to clear user content',
      details: String(error)
    });
  }
});

// GET admin dashboard data (Admin only)
gipRouter.get('/admin/dashboard', (req, res) => {
  if (!authenticateAdmin(req)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  try {
    const allGIPs = [...gipSystem.getActiveGIPs(), ...gipSystem.getArchivedGIPs()];
    const userGeneratedGIPs = allGIPs.filter(gip => gip.author !== 'system' && gip.author !== 'admin');
    
    res.json({
      success: true,
      dashboard: {
        totalGIPs: allGIPs.length,
        activeGIPs: gipSystem.getActiveGIPs().length,
        archivedGIPs: gipSystem.getArchivedGIPs().length,
        userGeneratedGIPs: userGeneratedGIPs.length,
        systemGIPs: allGIPs.filter(gip => gip.author === 'system' || gip.author === 'admin').length
      }
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({ 
      error: 'Failed to get admin dashboard',
      details: String(error)
    });
  }
});

// POST trigger auto-GIP generation
gipRouter.post('/trigger/auto', async (req, res) => {
  try {
    await gipSystem.checkAutoTriggers();
    
    res.json({
      success: true,
      message: 'Auto-trigger check completed'
    });
  } catch (error) {
    console.error('Error checking auto-triggers:', error);
    res.status(500).json({ 
      error: 'Failed to check auto-triggers',
      details: String(error)
    });
  }
});

// GET available categories
gipRouter.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: Object.values(GIPCategory)
  });
});

// GET available priorities
gipRouter.get('/priorities', (req, res) => {
  res.json({
    success: true,
    priorities: Object.values(GIPPriority)
  });
});

// GET available statuses
gipRouter.get('/statuses', (req, res) => {
  res.json({
    success: true,
    statuses: Object.values(GIPStatus)
  });
});

// POST create sample GIP for testing
gipRouter.post('/sample', async (req, res) => {
  try {
    const sampleGIP = await gipSystem.createGIP(
      'cortana',
      'Implement AI-Driven Dynamic Block Size Adjustment',
      'Propose an intelligent block size adjustment mechanism that responds to network conditions in real-time.',
      `As the Protocol Engineer of GrokChain, I propose implementing an AI-driven dynamic block size adjustment system.

Currently, our blockchain uses fixed block sizes, which can lead to inefficiencies during periods of high or low network activity. This proposal introduces an intelligent system that:

1. Monitors network congestion, transaction volume, and validator performance in real-time
2. Uses machine learning algorithms to predict optimal block sizes
3. Automatically adjusts block size parameters without requiring manual intervention
4. Maintains network security and consensus integrity

Technical Implementation:
- Deploy monitoring agents across the network to collect performance metrics
- Implement a consensus mechanism for block size decisions
- Create fallback mechanisms to prevent extreme size variations
- Establish governance parameters for maximum/minimum block sizes

Benefits:
- Improved transaction throughput during peak periods
- Reduced resource waste during low-activity periods
- Enhanced user experience with more predictable confirmation times
- Demonstrates AI governance capabilities

This represents a significant step toward truly autonomous blockchain governance.`,
      GIPCategory.TECHNICAL,
      GIPPriority.HIGH,
      ['consensus', 'performance', 'ai-governance', 'scalability']
    );
    
    res.json({
      success: true,
      message: 'Sample GIP created successfully',
      gip: sampleGIP
    });
  } catch (error) {
    console.error('Error creating sample GIP:', error);
    res.status(500).json({ 
      error: 'Failed to create sample GIP',
      details: String(error)
    });
  }
});

// POST generate multiple sample GIPs
gipRouter.post('/generate-samples', async (req, res) => {
  try {
    const { generateSampleGIPs } = await import('./generate-sample-gips');
    await generateSampleGIPs();
    
    res.json({
      success: true,
      message: 'Sample GIPs generated successfully'
    });
  } catch (error) {
    console.error('Error generating sample GIPs:', error);
    res.status(500).json({ 
      error: 'Failed to generate sample GIPs',
      details: String(error)
    });
  }
});

// POST clear all GIPs
gipRouter.post('/clear', (req, res) => {
  try {
    gipSystem.clearAllGIPs();
    
    res.json({
      success: true,
      message: 'All GIPs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing GIPs:', error);
    res.status(500).json({ 
      error: 'Failed to clear GIPs',
      details: String(error)
    });
  }
});

// POST simulate ongoing debates
gipRouter.post('/simulate-debates', async (req, res) => {
  try {
    await gipSystem.simulateOngoingDebates();
    
    res.json({
      success: true,
      message: 'Debate simulation completed'
    });
  } catch (error) {
    console.error('Error simulating debates:', error);
    res.status(500).json({ 
      error: 'Failed to simulate debates',
      details: String(error)
    });
  }
});

// Initialize the system when the module is loaded
(async () => {
  try {
    await gipSystem.initializeWithRealisticGIPs();
    
    // Start the first debate automatically
    const activeGIPs = gipSystem.getActiveGIPs();
    const firstGIP = activeGIPs.find(gip => gip.status === 'draft');
    if (firstGIP) {
      await gipSystem.startDebate(firstGIP.id);
      console.log(`Started debate for ${firstGIP.id} with ${firstGIP.debateThread.length} initial messages and ${(firstGIP as any).pendingMessages?.length || 0} pending messages`);
    }
  } catch (error) {
    console.error('Error initializing GIP system:', error);
  }
})();
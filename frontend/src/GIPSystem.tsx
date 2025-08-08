import React, { useState, useEffect } from 'react';

interface GIP {
  id: string;
  title: string;
  author: string;
  category: string;
  priority: string;
  summary: string;
  fullProposal: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  debateThread: GIPMessage[];
  votes: Record<string, 'approve' | 'reject' | 'abstain'>;
  finalDecision?: 'approved' | 'rejected';
  tags: string[];
}

interface GIPMessage {
  id: string;
  gipId: string;
  agentId: string;
  agentName: string;
  message: string;
  timestamp: number;
  replyTo?: string;
  messageType: 'proposal' | 'debate' | 'question' | 'challenge' | 'support' | 'vote' | 'implementation';
  impact: 'low' | 'medium' | 'high';
  reasoning: string;
}

const GIPSystem: React.FC = () => {
  const [gips, setGips] = useState<GIP[]>([]);
  const [selectedGIP, setSelectedGIP] = useState<GIP | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'create'>('active');
  const [categories, setCategories] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showLog, setShowLog] = useState(false);

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  // Hardcoded categories and priorities for the form
  const hardcodedCategories = [
    'SCALABILITY',
    'SECURITY', 
    'ECONOMIC',
    'GOVERNANCE',
    'TECHNICAL',
    'ETHICAL',
    'PHILOSOPHICAL',
    'NETWORK'
  ];

  const hardcodedPriorities = [
    'CRITICAL',
    'HIGH',
    'MEDIUM', 
    'LOW'
  ];

  // Form state for creating new GIP
  const [newGIP, setNewGIP] = useState({
    author: '',
    title: '',
    summary: '',
    fullProposal: '',
    category: '',
    priority: '',
    tags: ''
  });

  useEffect(() => {
    fetchGIPs();
  }, [activeTab]);

  const fetchGIPs = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'active' ? '/api/gip/active' : '/api/gip/archived';
      const response = await fetch(`${API_BASE}${endpoint}`);
      const data = await response.json();
      if (data.success) {
        setGips(data.gips);
      }
    } catch (error) {
      console.error('Error fetching GIPs:', error);
    } finally {
      setLoading(false);
    }
  };



  // GIP creation disabled for security
  const createGIP = async () => {
    alert('GIP creation is currently disabled for security reasons.');
    return;
  };

  const startDebate = async (gipId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/gip/${gipId}/debate`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchGIPs();
      }
    } catch (error) {
      console.error('Error starting debate:', error);
    }
  };

  const archiveGIP = async (gipId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/gip/${gipId}/archive`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchGIPs();
      }
    } catch (error) {
      console.error('Error archiving GIP:', error);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#00ff00';
      case 'approved': return '#00ff00';
      case 'rejected': return '#ff4444';
      case 'archived': return '#666666';
      default: return '#ffffff';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffff00';
      case 'low': return '#00ff00';
      default: return '#ffffff';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'support': return '#00ff00';
      case 'challenge': return '#ff4444';
      case 'question': return '#ffff00';
      case 'debate': return '#00ffff';
      case 'vote': return '#ff00ff';
      case 'implementation': return '#00aaff';
      default: return '#ffffff';
    }
  };

  const getAgentTitle = (agentId: string): string => {
    const titles: Record<string, string> = {
      alice: 'ALICE',
      ayra: 'AYRA',
      jarvis: 'JARVIS',
      cortana: 'CORTANA',
      lumina: 'LUMINA',
      nix: 'NIX'
    };
    return titles[agentId] || agentId.toUpperCase();
  };

  const renderGIPList = () => {
    // Separate GIPs by status
    const debatingGIPs = gips.filter(gip => gip.status === 'debating');
    const draftGIPs = gips.filter(gip => gip.status === 'draft');
    const votingGIPs = gips.filter(gip => gip.status === 'voting');

    return (
      <div style={{ 
        background: '#000000',
        color: '#ffffff',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        padding: '15px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #ffffff',
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0, color: '#00ff00', fontSize: '16px' }}>
            {activeTab.toUpperCase()} GIPs ({gips.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666666', padding: '20px' }}>
            LOADING GIPs...
          </div>
        ) : gips.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666666', padding: '20px' }}>
            NO {activeTab.toUpperCase()} GIPs FOUND
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* LIVE DEBATE SECTION */}
            {debatingGIPs.length > 0 && (
              <div>
                <div style={{ 
                  color: '#ff6600', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  borderBottom: '2px solid #ff6600',
                  paddingBottom: '5px'
                }}>
                  🔥 LIVE DEBATE ({debatingGIPs.length})
                </div>
                {debatingGIPs.map((gip) => (
                  <div key={gip.id} style={{ 
                    border: '2px solid #ff6600',
                    padding: '15px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #1a0f00 0%, #0a0a0a 100%)',
                    position: 'relative'
                  }} onClick={() => setSelectedGIP(gip)}>
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: '#ff6600',
                      color: '#000000',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      borderRadius: '0px'
                    }}>
                      LIVE
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, color: '#ff6600', fontSize: '14px' }}>
                        {gip.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
                        <span style={{ color: getStatusColor(gip.status) }}>
                          [{gip.status.toUpperCase()}]
                        </span>
                        <span style={{ color: getPriorityColor(gip.priority) }}>
                          [{gip.priority.toUpperCase()}]
                        </span>
                      </div>
                    </div>
                    <div style={{ color: '#cccccc', marginBottom: '10px', fontSize: '11px' }}>
                      {gip.summary}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#666666' }}>
                      <span>BY: {gip.author.toUpperCase()}</span>
                      <span>CATEGORY: {gip.category.toUpperCase()}</span>
                      <span style={{ color: '#ff6600', fontWeight: 'bold' }}>
                        🔥 {gip.debateThread?.length || 0} MESSAGES LIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VOTING SECTION */}
            {votingGIPs.length > 0 && (
              <div>
                <div style={{ 
                  color: '#ffff00', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  borderBottom: '2px solid #ffff00',
                  paddingBottom: '5px'
                }}>
                  🗳️ VOTING ({votingGIPs.length})
                </div>
                {votingGIPs.map((gip) => (
                  <div key={gip.id} style={{ 
                    border: '1px solid #ffff00',
                    padding: '15px',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #1a1a00 0%, #0a0a0a 100%)'
                  }} onClick={() => setSelectedGIP(gip)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, color: '#ffff00', fontSize: '14px' }}>
                        {gip.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
                        <span style={{ color: getStatusColor(gip.status) }}>
                          [{gip.status.toUpperCase()}]
                        </span>
                        <span style={{ color: getPriorityColor(gip.priority) }}>
                          [{gip.priority.toUpperCase()}]
                        </span>
                      </div>
                    </div>
                    <div style={{ color: '#cccccc', marginBottom: '10px', fontSize: '11px' }}>
                      {gip.summary}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#666666' }}>
                      <span>BY: {gip.author.toUpperCase()}</span>
                      <span>CATEGORY: {gip.category.toUpperCase()}</span>
                      <span style={{ color: '#ffff00', fontWeight: 'bold' }}>
                        🗳️ {gip.debateThread?.length || 0} MESSAGES
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PROPOSED/PENDING SECTION */}
            {draftGIPs.length > 0 && (
              <div>
                <div style={{ 
                  color: '#00ffff', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  borderBottom: '2px solid #00ffff',
                  paddingBottom: '5px'
                }}>
                  📋 PROPOSED/PENDING ({draftGIPs.length})
                </div>
                {draftGIPs.map((gip) => (
                  <div key={gip.id} style={{ 
                    border: '1px solid #333333',
                    padding: '15px',
                    cursor: 'pointer'
                  }} onClick={() => setSelectedGIP(gip)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, color: '#00ff00', fontSize: '14px' }}>
                        {gip.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
                        <span style={{ color: getStatusColor(gip.status) }}>
                          [{gip.status.toUpperCase()}]
                        </span>
                        <span style={{ color: getPriorityColor(gip.priority) }}>
                          [{gip.priority.toUpperCase()}]
                        </span>
                      </div>
                    </div>
                    <div style={{ color: '#cccccc', marginBottom: '10px', fontSize: '11px' }}>
                      {gip.summary}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#666666' }}>
                      <span>BY: {gip.author.toUpperCase()}</span>
                      <span>CATEGORY: {gip.category.toUpperCase()}</span>
                      <span>DEBATE: {gip.debateThread?.length || 0} MESSAGES</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGIPDetail = () => {
    if (!selectedGIP) return null;

    // Auto-show debate log for debating GIPs
    React.useEffect(() => {
      if (selectedGIP.status === 'debating' && !showLog) {
        setShowLog(true);
      }
    }, [selectedGIP]);

    return (
      <div style={{ 
        background: '#000000',
        color: '#ffffff',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        padding: '15px',
        height: '100%',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #ffffff',
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0, color: '#00ff00', fontSize: '16px' }}>
            {selectedGIP.title}
          </h2>
          <button
            onClick={() => setSelectedGIP(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#ff4444',
              border: '1px solid #ff4444',
              borderRadius: '0px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 'bold'
            }}
          >
            CLOSE
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '11px' }}>
            <span style={{ color: getStatusColor(selectedGIP.status) }}>
              STATUS: {selectedGIP.status.toUpperCase()}
            </span>
            <span style={{ color: getPriorityColor(selectedGIP.priority) }}>
              PRIORITY: {selectedGIP.priority.toUpperCase()}
            </span>
            <span>CATEGORY: {selectedGIP.category.toUpperCase()}</span>
            <span>AUTHOR: {selectedGIP.author.toUpperCase()}</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ color: '#00ff00', fontSize: '13px', marginBottom: '10px' }}>SUMMARY</h3>
            <div style={{ color: '#cccccc', lineHeight: '1.4' }}>
              {selectedGIP.summary}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ color: '#00ff00', fontSize: '13px', marginBottom: '10px' }}>FULL PROPOSAL</h3>
            <div style={{ color: '#cccccc', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
              {selectedGIP.fullProposal}
            </div>
          </div>

          {selectedGIP.tags && selectedGIP.tags.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#00ff00', fontSize: '13px', marginBottom: '10px' }}>TAGS</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {selectedGIP.tags.map((tag, index) => (
                  <span key={index} style={{
                    padding: '4px 8px',
                    backgroundColor: '#333333',
                    color: '#ffffff',
                    fontSize: '10px',
                    borderRadius: '0px'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ color: '#00ff00', fontSize: '13px', margin: 0 }}>
              DEBATE LOG ({selectedGIP.debateThread?.length || 0} MESSAGES)
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowLog(!showLog)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: '#00ffff',
                  border: '1px solid #00ffff',
                  borderRadius: '0px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                {showLog ? 'HIDE LOG' : 'SHOW LOG'}
              </button>
              <button
                onClick={() => {
                  const transcript = `GrokChain Improvement Proposal Transcript
==================================================
ID: ${selectedGIP.id}
Title: ${selectedGIP.title}
Author: ${selectedGIP.author}
Category: ${selectedGIP.category}
Priority: ${selectedGIP.priority}
Status: ${selectedGIP.status}

Summary:
${selectedGIP.summary}

Full Proposal:
${selectedGIP.fullProposal}

DEBATE THREAD:
==================================================
${selectedGIP.debateThread?.map((message, index) => `
[${new Date(message.timestamp).toLocaleString()}] ${message.agentName} (${message.messageType.toUpperCase()}):
${message.message}
Reasoning: ${message.reasoning}
Impact: ${message.impact.toUpperCase()}
---`).join('\n') || 'No debate messages yet.'}`;
                  
                  const blob = new Blob([transcript], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedGIP.id}-transcript.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: '#ffff00',
                  border: '1px solid #ffff00',
                  borderRadius: '0px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                EXPORT LOG
              </button>
            </div>
          </div>

          {showLog && selectedGIP.debateThread && selectedGIP.debateThread.length > 0 && (
            <div style={{ 
              border: '1px solid #333333',
              padding: '15px',
              maxHeight: '500px',
              overflow: 'auto',
              background: '#0a0a0a'
            }}>
              {selectedGIP.debateThread.map((message, index) => (
                <div key={message.id} style={{ 
                  marginBottom: '15px',
                  borderBottom: '1px solid #333333',
                  paddingBottom: '15px',
                  position: 'relative'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        color: getMessageTypeColor(message.messageType),
                        fontWeight: 'bold',
                        fontSize: '11px'
                      }}>
                        [{getAgentTitle(message.agentId)}]
                      </span>
                      <span style={{ 
                        color: message.messageType === 'vote' ? '#ff4444' : '#666666',
                        fontSize: '10px',
                        padding: '2px 6px',
                        border: `1px solid ${message.messageType === 'vote' ? '#ff4444' : '#666666'}`,
                        borderRadius: '0px',
                        fontWeight: message.messageType === 'vote' ? 'bold' : 'normal'
                      }}>
                        {message.messageType === 'vote' ? 'VOTE' : message.messageType.toUpperCase()}
                      </span>
                      <span style={{ 
                        color: '#888888',
                        fontSize: '9px',
                        padding: '2px 6px',
                        border: '1px solid #888888',
                        borderRadius: '0px'
                      }}>
                        {message.impact.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ 
                      color: '#666666', 
                      fontSize: '10px'
                    }}>
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ 
                    color: '#ffffff', 
                    fontSize: '12px',
                    lineHeight: '1.5',
                    marginBottom: '10px',
                    padding: '10px',
                    background: '#1a1a1a',
                    border: '1px solid #333333'
                  }}>
                    {message.message}
                    {message.messageType === 'vote' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: message.message.toLowerCase().includes('approve') ? '#00ff00' : '#ff4444',
                        color: '#000000',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        display: 'inline-block'
                      }}>
                        {message.message.toLowerCase().includes('approve') ? '✅ APPROVE' : '❌ REJECT'}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    color: '#666666',
                    fontSize: '10px',
                    fontStyle: 'italic',
                    padding: '8px',
                    background: '#0f0f0f',
                    borderLeft: '3px solid #666666'
                  }}>
                    <strong>Reasoning:</strong> {message.reasoning}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => startDebate(selectedGIP.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '0px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 'bold'
            }}
          >
            START DEBATE
          </button>
          <button
            onClick={() => archiveGIP(selectedGIP.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#ff4444',
              border: '1px solid #ff4444',
              borderRadius: '0px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 'bold'
            }}
          >
            ARCHIVE
          </button>
        </div>
      </div>
    );
  };

  const renderCreateGIP = () => (
    <div style={{ 
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      padding: '15px'
    }}>
      <h2 style={{ color: '#00ff00', fontSize: '16px', marginBottom: '20px' }}>
        CREATE NEW GIP
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>
            AUTHOR:
          </label>
          <input
            type="text"
            value={newGIP.author}
            onChange={(e) => setNewGIP({...newGIP, author: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '0px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace'
            }}
            placeholder="Your name or identifier"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>
            TITLE:
          </label>
          <input
            type="text"
            value={newGIP.title}
            onChange={(e) => setNewGIP({...newGIP, title: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '0px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace'
            }}
            placeholder="Brief, descriptive title"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>
            SUMMARY:
          </label>
          <textarea
            value={newGIP.summary}
            onChange={(e) => setNewGIP({...newGIP, summary: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '0px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              minHeight: '60px',
              resize: 'vertical'
            }}
            placeholder="Brief summary of the proposal"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>
            FULL PROPOSAL:
          </label>
          <textarea
            value={newGIP.fullProposal}
            onChange={(e) => setNewGIP({...newGIP, fullProposal: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '0px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              minHeight: '200px',
              resize: 'vertical'
            }}
            placeholder="Detailed proposal with implementation details"
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>
              CATEGORY:
            </label>
            <select
              value={newGIP.category}
              onChange={(e) => setNewGIP({...newGIP, category: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid #ffffff',
                borderRadius: '0px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              <option value="">Select category</option>
              {hardcodedCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>
              PRIORITY:
            </label>
            <select
              value={newGIP.priority}
              onChange={(e) => setNewGIP({...newGIP, priority: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid #ffffff',
                borderRadius: '0px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              <option value="">Select priority</option>
              {hardcodedPriorities.map(pri => (
                <option key={pri} value={pri}>{pri}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>
            TAGS (comma-separated):
          </label>
          <input
            type="text"
            value={newGIP.tags}
            onChange={(e) => setNewGIP({...newGIP, tags: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '0px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace'
            }}
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <button
          onClick={createGIP}
          disabled={loading || !newGIP.title || !newGIP.summary || !newGIP.category || !newGIP.priority}
          style={{
            padding: '12px 24px',
            backgroundColor: loading || !newGIP.title || !newGIP.summary || !newGIP.category || !newGIP.priority ? '#333333' : '#00ff00',
            color: loading || !newGIP.title || !newGIP.summary || !newGIP.category || !newGIP.priority ? '#666666' : '#000000',
            border: '1px solid #ffffff',
            borderRadius: '0px',
            cursor: loading || !newGIP.title || !newGIP.summary || !newGIP.category || !newGIP.priority ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'CREATING...' : 'CREATE GIP'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#000000',
      fontFamily: 'JetBrains Mono, monospace',
      color: '#ffffff',
      fontSize: '12px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '15px',
        borderBottom: '1px solid #ffffff',
        background: '#000000'
      }}>
        <h1 style={{ 
          margin: 0, 
          color: '#00ff00',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          GROKCHAIN IMPROVEMENT PROPOSALS
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex',
        background: '#000000',
        borderBottom: '1px solid #333333'
      }}>
        {[
          {id: 'active', label: 'ACTIVE'},
          {id: 'archived', label: 'ARCHIVED'}
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              color: activeTab === t.id ? '#00ff00' : '#666666',
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: activeTab === t.id ? 'bold' : 'normal',
              borderBottom: activeTab === t.id ? '2px solid #00ff00' : 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {!selectedGIP && renderGIPList()}
        {selectedGIP && renderGIPDetail()}
      </div>
    </div>
  );
};

export default GIPSystem; 
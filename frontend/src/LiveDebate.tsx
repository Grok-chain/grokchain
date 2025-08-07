import React, { useState, useEffect } from 'react';

interface GIP {
  id: string;
  title: string;
  author: string;
  category: string;
  priority: string;
  summary: string;
  status: string;
  debateThread: GIPMessage[];
}

interface GIPMessage {
  id: string;
  gipId: string;
  agentId: string;
  agentName: string;
  message: string;
  timestamp: number;
  messageType: 'proposal' | 'debate' | 'question' | 'challenge' | 'support' | 'vote' | 'implementation';
  impact: 'low' | 'medium' | 'high';
  reasoning: string;
}

const LiveDebate: React.FC = () => {
  const [activeGIPs, setActiveGIPs] = useState<GIP[]>([]);
  const [selectedGIP, setSelectedGIP] = useState<GIP | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  useEffect(() => {
    fetchActiveGIPs();
    const interval = setInterval(fetchActiveGIPs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveGIPs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/gip/active`);
      const data = await response.json();
      if (data.success) {
        const gipsWithDebates = data.gips.filter((gip: GIP) => gip.debateThread && gip.debateThread.length > 0);
        setActiveGIPs(gipsWithDebates);
        
        // Auto-select the first GIP with debates if none selected
        if (!selectedGIP && gipsWithDebates.length > 0) {
          setSelectedGIP(gipsWithDebates[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching active GIPs:', error);
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffff00';
      case 'low': return '#00ff00';
      default: return '#ffffff';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
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

  const getPhaseFromMessage = (message: GIPMessage): number => {
    // Extract phase from reasoning or message content
    const phaseMatch = message.reasoning.match(/Phase (\d+)/);
    return phaseMatch ? parseInt(phaseMatch[1]) : 1;
  };

  const groupMessagesByPhase = (messages: GIPMessage[]) => {
    const phases: { [key: number]: GIPMessage[] } = {};
    messages.forEach(message => {
      const phase = getPhaseFromMessage(message);
      if (!phases[phase]) phases[phase] = [];
      phases[phase].push(message);
    });
    return phases;
  };

  const getPhaseTitle = (phase: number): string => {
    switch (phase) {
      case 1: return 'PROPOSAL INTRODUCTION & INITIAL REACTIONS';
      case 2: return 'TECHNICAL & ECONOMIC DEEP DIVE';
      case 3: return 'COUNTERARGUMENTS & REFUTATIONS';
      case 4: return 'RISK SCENARIOS & MITIGATIONS';
      case 5: return 'FINAL ARGUMENTS & RECONCILIATION';
      case 6: return 'VOTING PHASE';
      default: return `PHASE ${phase}`;
    }
  };

  const getPhaseColor = (phase: number): string => {
    switch (phase) {
      case 1: return '#00ff00';
      case 2: return '#00ffff';
      case 3: return '#ff8800';
      case 4: return '#ff4444';
      case 5: return '#ffff00';
      case 6: return '#ff00ff';
      default: return '#ffffff';
    }
  };

  if (activeGIPs.length === 0) {
    return (
      <div style={{
        background: '#000000',
        border: '1px solid #333333',
        padding: '20px',
        marginTop: '20px',
        fontFamily: 'JetBrains Mono, monospace',
        color: '#666666',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        NO ACTIVE DEBATES
      </div>
    );
  }

  const containerStyle = isMaximized ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    background: '#000000',
    border: '2px solid #00ff00',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column' as const
  } : {
    background: '#000000',
    border: '1px solid #333333',
    marginTop: '20px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '12px'
  };

  const contentHeight = isMaximized ? 'calc(100vh - 80px)' : '400px';

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        borderBottom: '1px solid #333333',
        background: '#000000'
      }}>
        <h3 style={{
          margin: 0,
          color: '#00ff00',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          LIVE ORACLE DEBATES
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#666666', fontSize: '11px' }}>
            {activeGIPs.length} ACTIVE
          </span>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              color: '#00ff00',
              padding: '5px 10px',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            {isMaximized ? 'MINIMIZE' : 'MAXIMIZE'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: contentHeight }}>
        {/* GIP List */}
        <div style={{
          width: isMaximized ? '400px' : '300px',
          borderRight: '1px solid #333333',
          overflow: 'auto',
          background: '#0a0a0a'
        }}>
          {activeGIPs.map((gip) => (
            <div
              key={gip.id}
              onClick={() => setSelectedGIP(gip)}
              style={{
                padding: '15px',
                borderBottom: '1px solid #333333',
                cursor: 'pointer',
                background: selectedGIP?.id === gip.id ? '#1a1a1a' : 'transparent',
                borderLeft: selectedGIP?.id === gip.id ? '4px solid #00ff00' : '4px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                color: '#00ff00',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px',
                lineHeight: '1.3'
              }}>
                {gip.title}
              </div>
              <div style={{
                color: '#cccccc',
                fontSize: '11px',
                marginBottom: '8px',
                lineHeight: '1.4'
              }}>
                {gip.summary.substring(0, isMaximized ? 120 : 80)}...
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                marginBottom: '5px'
              }}>
                <span style={{ color: getPriorityColor(gip.priority) }}>
                  [{gip.priority.toUpperCase()}]
                </span>
                <span style={{ color: '#666666' }}>
                  {gip.debateThread.length} MSGS
                </span>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#888888'
              }}>
                BY: {gip.author.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Debate Thread */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          background: '#000000'
        }}>
          {selectedGIP ? (
            <div>
              {/* GIP Header */}
              <div style={{
                marginBottom: '25px',
                padding: '20px',
                border: '1px solid #333333',
                background: '#0a0a0a',
                borderRadius: '4px'
              }}>
                <h4 style={{
                  color: '#00ff00',
                  margin: '0 0 15px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {selectedGIP.title}
                </h4>
                <div style={{
                  color: '#cccccc',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  marginBottom: '15px'
                }}>
                  {selectedGIP.summary}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  fontSize: '11px',
                  color: '#666666',
                  flexWrap: 'wrap'
                }}>
                  <span>BY: {selectedGIP.author.toUpperCase()}</span>
                  <span>CATEGORY: {selectedGIP.category.toUpperCase()}</span>
                  <span style={{ color: getPriorityColor(selectedGIP.priority) }}>
                    PRIORITY: {selectedGIP.priority.toUpperCase()}
                  </span>
                  <span>STATUS: {selectedGIP.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Debate Messages by Phase */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {Object.entries(groupMessagesByPhase(selectedGIP.debateThread))
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([phase, messages]) => (
                    <div key={phase} style={{
                      border: '1px solid #333333',
                      background: '#0a0a0a',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      {/* Phase Header */}
                      <div style={{
                        background: '#1a1a1a',
                        padding: '12px 15px',
                        borderBottom: '1px solid #333333'
                      }}>
                        <div style={{
                          color: getPhaseColor(parseInt(phase)),
                          fontWeight: 'bold',
                          fontSize: '13px'
                        }}>
                          {getPhaseTitle(parseInt(phase))}
                        </div>
                        <div style={{
                          color: '#666666',
                          fontSize: '10px',
                          marginTop: '3px'
                        }}>
                          {messages.length} MESSAGES
                        </div>
                      </div>

                      {/* Phase Messages */}
                      <div style={{ padding: '15px' }}>
                        {messages.map((message, index) => (
                          <div key={message.id} style={{
                            border: '1px solid #333333',
                            padding: '15px',
                            background: '#000000',
                            marginBottom: index < messages.length - 1 ? '12px' : '0',
                            borderRadius: '3px'
                          }}>
                            {/* Message Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px',
                              paddingBottom: '8px',
                              borderBottom: '1px solid #333333'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  color: getMessageTypeColor(message.messageType),
                                  fontWeight: 'bold',
                                  fontSize: '12px'
                                }}>
                                  [{getAgentTitle(message.agentId)}]
                                </span>
                                <span style={{
                                  color: '#888888',
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  background: '#1a1a1a',
                                  borderRadius: '2px'
                                }}>
                                  {message.messageType.toUpperCase()}
                                </span>
                              </div>
                              <span style={{
                                color: '#666666',
                                fontSize: '10px'
                              }}>
                                {formatTime(message.timestamp)}
                              </span>
                            </div>

                            {/* Message Content */}
                            <div style={{
                              color: '#ffffff',
                              fontSize: '12px',
                              lineHeight: '1.6',
                              marginBottom: '12px'
                            }}>
                              {message.message}
                            </div>

                            {/* Message Footer */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '10px'
                            }}>
                              <div style={{
                                color: '#666666',
                                fontStyle: 'italic',
                                flex: 1
                              }}>
                                Reasoning: {message.reasoning}
                              </div>
                              <span style={{
                                color: '#888888',
                                padding: '2px 6px',
                                background: '#1a1a1a',
                                borderRadius: '2px'
                              }}>
                                Impact: {message.impact.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#666666',
              padding: '50px',
              fontSize: '14px'
            }}>
              SELECT A GIP TO VIEW DEBATE
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveDebate; 
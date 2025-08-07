import React, { useState, useRef, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  model: string;
}

interface AgentResponse {
  agentId: string;
  agentName: string;
  response: string;
}

const personas: Record<string, {name:string, color:string}> = {
  alice: {name:"ALICE", color:"#ffffff"},
  ayra: {name:"AYRA", color:"#cccccc"},
  jarvis: {name:"JARVIS", color:"#ffffff"},
  cortana: {name:"CORTANA", color:"#cccccc"},
  lumina: {name:"LUMINA", color:"#ffffff"},
  nix: {name:"NIX", color:"#cccccc"},
  user:  {name:"You", color:"#00ff00"}
};

const MultiAgentChat: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/multi-agent/agents`);
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    const newResponses: AgentResponse[] = [];

    try {
      let endpoint = '/api/multi-agent/chat';
      if (selectedAgent !== 'all') {
        endpoint = `/api/multi-agent/chat/${selectedAgent}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await response.json();
      if (data.success) {
        if (selectedAgent === 'all') {
          setResponses(prev => [...prev, ...data.responses]);
        } else {
          setResponses(prev => [...prev, data.response]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
      setUserInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = async () => {
    try {
      await fetch(`${API_BASE}/api/multi-agent/history`, {
        method: 'DELETE',
      });
      setResponses([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        <h2 style={{ 
          margin: 0, 
          color: '#00ff00',
          fontSize: '16px',
          fontWeight: 'bold',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          ORACLE COUNCIL
        </h2>
        <button 
          onClick={clearHistory}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#ff4444',
            border: '1px solid #ff4444',
            borderRadius: '0px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 'bold'
          }}
        >
          CLEAR HISTORY
        </button>
      </div>

      {/* Agent Selection */}
      <div style={{ 
        padding: '15px',
        borderBottom: '1px solid #333333',
        background: '#000000'
      }}>
        <div style={{ 
          color: '#ffffff', 
          marginBottom: '10px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          SELECT ORACLE:
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedAgent('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedAgent === 'all' ? '#00ff00' : 'transparent',
              color: selectedAgent === 'all' ? '#000000' : '#ffffff',
              border: '1px solid #ffffff',
              borderRadius: '0px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: selectedAgent === 'all' ? 'bold' : 'normal'
            }}
          >
            ALL ORACLES
          </button>
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedAgent === agent.id ? '#00ff00' : 'transparent',
                color: selectedAgent === agent.id ? '#000000' : '#ffffff',
                border: '1px solid #ffffff',
                borderRadius: '0px',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: selectedAgent === agent.id ? 'bold' : 'normal'
              }}
            >
              {agent.name.split(' – ')[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        background: '#000000',
        padding: '15px'
      }}>
        {responses.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666666', 
            marginTop: '50px',
            fontSize: '12px'
          }}>
            START A CONVERSATION WITH THE ORACLE COUNCIL...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {responses.map((response, index) => (
              <div key={index} style={{ 
                borderBottom: '1px solid #333333',
                paddingBottom: '15px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ 
                    color: '#00ff00', 
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    [{response.agentName}]
                  </span>
                  <span style={{ 
                    color: '#666666', 
                    fontSize: '11px'
                  }}>
                    ORACLE
                  </span>
                </div>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  {response.response}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ 
                textAlign: 'center',
                padding: '15px',
                color: '#00ff00',
                fontSize: '12px'
              }}>
                ORACLES ARE DELIBERATING...
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        background: '#000000', 
        borderTop: '1px solid #ffffff',
        padding: '15px'
      }}>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask the Oracle Council..."
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'transparent',
            color: '#ffffff',
            border: '1px solid #ffffff',
            borderRadius: '0px',
            resize: 'none',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            minHeight: '40px',
            maxHeight: '100px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !userInput.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: loading || !userInput.trim() ? '#333333' : '#00ff00',
            color: loading || !userInput.trim() ? '#666666' : '#000000',
            border: '1px solid #ffffff',
            borderRadius: '0px',
            cursor: loading || !userInput.trim() ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'JetBrains Mono, monospace',
            minWidth: '80px'
          }}
        >
          {loading ? 'SENDING...' : 'SEND'}
        </button>
      </div>
    </div>
  );
};

export default MultiAgentChat; 
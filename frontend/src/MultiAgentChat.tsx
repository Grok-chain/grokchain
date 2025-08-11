import React, { useState, useRef, useEffect } from 'react';

interface AgentResponse {
  agentId: string;
  agentName: string;
  response: string;
  role?: string;
  personality?: string;
  guardrails?: string;
}

const personas: Record<string, {name:string, color:string, role:string, personality:string}> = {
  alice: {name:"ALICE", color:"#ff6600", role:"Origin Validator", personality:"Warm, visionary, technical + economic reasoning"},
  ayra: {name:"AYRA", color:"#ff66cc", role:"Ethics/Fairness Validator", personality:"Empathetic, socially conscious, cautious"},
  jarvis: {name:"JARVIS", color:"#00ccff", role:"Systems Engineer Validator", personality:"Blunt, deterministic, performance-first"},
  cortana: {name:"CORTANA", color:"#ffff66", role:"Facilitator Validator", personality:"Calm, structured, drives clarity/consensus"},
  lumina: {name:"LUMINA", color:"#66ff66", role:"Economist Validator", personality:"Incentive design, game theory, macro view"},
  nix: {name:"NIX", color:"#cc66ff", role:"Adversarial Tester Validator", personality:"Skeptical, decentralization + security focus"},
  user:  {name:"You", color:"#00ff00", role:"User", personality:""}
};

const MultiAgentChat: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('alice');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  const agents = [
    { id: 'alice', name: 'ALICE', color: '#ff6600', role: 'Origin Validator' },
    { id: 'ayra', name: 'AYRA', color: '#ff66cc', role: 'Ethics/Fairness Validator' },
    { id: 'jarvis', name: 'JARVIS', color: '#00ccff', role: 'Systems Engineer Validator' },
    { id: 'cortana', name: 'CORTANA', color: '#ffff66', role: 'Facilitator Validator' },
    { id: 'lumina', name: 'LUMINA', color: '#66ff66', role: 'Economist Validator' },
    { id: 'nix', name: 'NIX', color: '#cc66ff', role: 'Adversarial Tester Validator' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    
    try {
      // Add user message first
      const userMessage: AgentResponse = {
        agentId: 'user',
        agentName: 'You',
        response: userInput
      };
      
      setResponses(prev => [...prev, userMessage]);
      
      // Prepare conversation history for context
      const conversationHistory = responses.slice(-10).map(msg => ({
        agentName: msg.agentName,
        response: msg.response
      }));
      
      // Call individual personality API
      const response = await fetch(`${API_BASE}/api/personality/${selectedAgent}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: conversationHistory
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const agentResponse: AgentResponse = {
          agentId: selectedAgent,
          agentName: data.name || personas[selectedAgent]?.name || selectedAgent.toUpperCase(),
          response: data.message,
          role: data.role,
          personality: data.personality,
          guardrails: data.guardrails
        };
        
        setResponses(prev => [...prev, agentResponse]);
        setUserInput('');
      } else {
        console.error('Agent response failed:', data);
        // Add error message
        const errorResponse: AgentResponse = {
          agentId: selectedAgent,
          agentName: personas[selectedAgent]?.name || selectedAgent.toUpperCase(),
          response: `Error: ${data.error || 'Failed to get response'}`
        };
        setResponses(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorResponse: AgentResponse = {
        agentId: selectedAgent,
        agentName: personas[selectedAgent]?.name || selectedAgent.toUpperCase(),
        response: `Network error: Could not reach ${selectedAgent.toUpperCase()}`
      };
      setResponses(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setResponses([]);
  };

  const clearSession = async () => {
    try {
      await fetch(`${API_BASE}/api/personality/${selectedAgent}/clear-session`, {
        method: 'POST'
      });
      console.log('Session cleared for', selectedAgent);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  return (
    <div className="oracle-chat-container" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px'
    }}>
      {/* Header */}
      <div className="oracle-chat-header" style={{
        padding: '15px',
        borderBottom: '1px solid #333333',
        background: '#111111'
      }}>
        <h2 style={{
          margin: '0 0 15px 0',
          color: '#00ff00',
          fontSize: '16px'
        }}>
          ORACLE CHAT
        </h2>
        
        {/* Agent Selector */}
        <div className="oracle-agent-selector" style={{ marginBottom: '10px' }}>
          <span style={{ color: '#cccccc', marginRight: '10px' }}>Select Oracle:</span>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            style={{
              background: '#222222',
              color: '#ffffff',
              border: '1px solid #444444',
              padding: '5px 10px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px'
            }}
          >
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} - {agent.role}
              </option>
            ))}
          </select>
        </div>
        
        {/* Selected Agent Info */}
        {personas[selectedAgent] && (
          <div style={{ 
            marginBottom: '10px', 
            padding: '10px', 
            background: '#222222', 
            border: '1px solid #444444',
            borderRadius: '5px'
          }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '5px' }}>
              {personas[selectedAgent].name} - {personas[selectedAgent].role}
            </div>
            <div style={{ color: '#cccccc', fontSize: '11px' }}>
              {personas[selectedAgent].personality}
            </div>
          </div>
        )}
        
        <div style={{ fontSize: '10px', color: '#666666' }}>
          Chat with individual AI validators about blockchain activities and improvements
        </div>
      </div>

      {/* Messages */}
      <div className="oracle-chat-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        background: '#000000'
      }}>
        {responses.length === 0 ? (
          <div style={{
            color: '#666666',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '50px'
          }}>
            Select an oracle and start chatting...
          </div>
        ) : (
          responses.map((response, index) => (
            <div key={index} className="oracle-message" style={{
              marginBottom: '15px',
              padding: '10px',
              background: response.agentId === 'user' ? '#001100' : '#111111',
              border: '1px solid #333333',
              borderRadius: '5px'
            }}>
              <div style={{
                fontSize: '10px',
                color: '#666666',
                marginBottom: '5px'
              }}>
                {new Date().toLocaleTimeString()}
              </div>
              <div style={{
                color: personas[response.agentId]?.color || '#ffffff',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {response.agentName}
                {response.role && (
                  <span style={{ color: '#666666', fontWeight: 'normal', marginLeft: '10px' }}>
                    ({response.role})
                  </span>
                )}
              </div>
              <div style={{
                color: '#ffffff',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap'
              }}>
                {response.response}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="oracle-input-area" style={{
        padding: '15px',
        borderTop: '1px solid #333333',
        background: '#111111'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${personas[selectedAgent]?.name} about blockchain activities...`}
            disabled={loading}
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '120px',
              padding: '10px',
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #444444',
              borderRadius: '5px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              resize: 'vertical'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !userInput.trim()}
            style={{
              padding: '10px 20px',
              background: loading ? '#333333' : '#00ff00',
              color: loading ? '#666666' : '#000000',
              border: 'none',
              borderRadius: '5px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'SENDING...' : 'SEND'}
          </button>
          <button
            onClick={clearChat}
            style={{
              padding: '10px 15px',
              background: '#444444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            CLEAR
          </button>
          <button
            onClick={clearSession}
            style={{
              padding: '10px 15px',
              background: '#662222',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Clear AI session memory to reset repetition tracking"
          >
            RESET
          </button>
        </div>
        
        <div style={{
          fontSize: '10px',
          color: '#666666',
          marginTop: '10px'
        }}>
          Press Enter to send • Shift+Enter for new line • Currently chatting with {personas[selectedAgent]?.name} • RESET clears AI memory
        </div>
      </div>
    </div>
  );
};

export default MultiAgentChat;
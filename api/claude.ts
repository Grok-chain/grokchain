import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

if (!CLAUDE_API_KEY) {
  console.warn('Warning: CLAUDE_API_KEY not set. Claude personality features will be disabled.');
}

export async function claudeChatCompletion(
  personaPrompt: string, 
  message: string, 
  model: 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229' = 'claude-3-5-haiku-20241022'
) {
  // Check if we have a valid API key
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is required. Please set a valid Claude API key in your .env file.');
  }
  
  // Add explicit instruction to avoid "As a validator" phrases and repetition
  const enhancedPrompt = `${personaPrompt}\n\nCRITICAL INSTRUCTIONS:
- Never start your response with "As a validator" or "As an AI validator" or similar phrases
- Speak naturally about your work without explicitly stating your role or title
- Speak in FIRST PERSON - use "I", "we", "our" - never speak about yourself in third person
- Each response must be completely unique and different from any previous response
- Never repeat the same sentence structure, cadence, or examples
- Vary your language, tone, and approach dramatically
- Make each response feel natural and conversational, not robotic
- If you're continuing a conversation, bring a completely different perspective or angle`;
  
  const body = {
    model: model,
    max_tokens: 150, // Reduced from 200 to save tokens
    temperature: 0.95, // Higher temperature for more randomness
    top_p: 0.95, // Higher top_p for more variety
    messages: [
      { role: 'user', content: `${enhancedPrompt}\n\nUser message: ${message}` }
    ]
  };

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errTxt = await response.text();
      console.error('Claude API error:', errTxt);
      throw new Error(`Claude API request failed: ${errTxt}`);
    }
    
    const data = await response.json();
    const aiResponse = (data as any).content?.[0]?.text?.trim() || '(no response)';
    
    return aiResponse;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}
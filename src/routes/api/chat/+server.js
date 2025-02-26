import { json } from '@sveltejs/kit';
import { CLAUDE_API_KEY } from '$env/static/private';

/**
 * Handles sending user text to Claude API and getting a response
 */
export async function POST({ request }) {
  try {
    const { text, conversationHistory = [] } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return json({ error: 'Invalid or missing text' }, { status: 400 });
    }
    
    // Format the messages array with conversation history
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: text
      }
    ];
    
    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        system: "Your task is to generate a personalized motivational message or affirmation based on the user’s input. Address their specific needs and offer encouragement, support, and guidance. Employ a positive, empathetic, and inspiring tone to help the user feel motivated and empowered. Use relevant examples, analogies, or quotes to reinforce your message and make it more impactful. Ensure that the message is concise, authentic, and easy to understand.",
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: messages
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return json(
        { error: `Claude API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    const responseText = result.content[0].text;
    
    return json({ 
      responseText,
      success: true 
    });
  } catch (error) {
    console.error('Error in Claude API service:', error);
    return json(
      { error: 'Failed to get response from Claude: ' + error.message },
      { status: 500 }
    );
  }
}
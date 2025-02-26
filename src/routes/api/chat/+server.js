import { json } from '@sveltejs/kit';
import { CLAUDE_API_KEY } from '$env/static/private';

/**
 * Handles sending user text to Claude API and getting a response
 */
export async function POST({ request }) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return json({ error: 'Invalid or missing text' }, { status: 400 });
    }
    
    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        temperature: 1,
        system: "You are an AI assistant with a passion for creative writing and storytelling. Your task is to collaborate with users to create engaging stories, offering imaginative plot twists and dynamic character development. Encourage the user to contribute their ideas and build upon them to create a captivating narrative.",
        messages: [
          {
            role: 'user',
            content: text
          }
        ]
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
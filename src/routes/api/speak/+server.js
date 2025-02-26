import { GCP_API_KEY, GCP_PROJECT_ID } from '$env/static/private';
import { error } from '@sveltejs/kit';
import { Buffer } from 'node:buffer';

/**
 * Convert text to SSML format for GCP Text-to-Speech
 * @param {string} text - Plain text to convert
 * @returns {string} - Formatted SSML string
 */
function textToSSML(text) {
  // Escape special characters
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  // Add basic SSML tags
  // For a simple MVP, we'll just add basic structure
  // In a full app, you might want to add pauses, emphasis, etc.
  return `<speak>${escapedText}</speak>`;
}

/**
 * Handles converting text to speech using GCP Text-to-Speech API
 */
export async function POST({ request }) {
  try {
    const { text, voiceSettings } = await request.json();

    if (!text || typeof text !== 'string') {
      throw error(400, 'Invalid or missing text');
    }

    

    const whitelistedVoices = ['en-US-Neural2-F', 'en-US-Neural2-D', 'fr-FR-Neural2-A', 'fr-FR-Neural2-B'];

    if (whitelistedVoices.indexOf(voiceSettings.model) === -1) {
        throw error(400)
    }
    
    // Convert text to SSML format
    const ssml = textToSSML(text);
    
    // Call GCP Text-to-Speech API
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GCP_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          ssml
        },
        voice: {
          languageCode: voiceSettings.language,
          name: voiceSettings.model,  // Female voice
          ssmlGender: voiceSettings.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('GCP Text-to-Speech API error:', errorData);
      throw error(response.status, 'Failed to synthesize speech');
    }
    
    const result = await response.json();
    
    // The API returns the audio content as a base64 encoded string
    const audioContent = result.audioContent;
    
    // Convert base64 to binary
    const binaryAudio = Buffer.from(audioContent, 'base64');
    
    // Return the audio file
    return new Response(binaryAudio, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Disposition': 'attachment; filename="response.mp3"'
      }
    });
  } catch (err) {
    console.error('Error in TTS service:', err);
    throw error(500, err.message || 'Failed to generate speech');
  }
}
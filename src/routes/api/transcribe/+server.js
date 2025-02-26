import { json } from '@sveltejs/kit';

/**
 * Handles the transcription of audio using Cloudflare Workers AI Whisper model
 */
export async function POST({ request, platform }) {
  try {
    // Extract audio blob from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const url = new URL(request.url)
    const params = new URLSearchParams(url.searchParams)

    console.log(url)

    console.log("Selected gender", params.get("gender"), "Selected language", params.get("language"))
    
    if (!audioFile) {
      return json({ error: 'No audio file provided' }, { status: 400 });
    }

    const blob = await audioFile.arrayBuffer()
    
    const input = {
        audio: [...new Uint8Array(blob)]
    }

    const response = await platform.env.AI.run(
        "@cf/openai/whisper",
        input
    )
    
    // Convert the audio to a format Whisper accepts if needed
    // Whisper typically works with WAV or MP3
    // For MVP we'll send the audio as is (WebM from browser recording)
    // In production, you might want to convert to MP3/WAV first
    
    // Send to Cloudflare Workers AI
    
    if (!response.text) {
      console.error('Cloudflare Whisper API error:', response);
      return json(
        { error: `Transcription failed: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }
    
    console.log("Matched text", response.text)
    
    // Return the transcribed text
    return json({ 
      text: response.text,
      success: true 
    });
  } catch (error) {
    console.error('Error in transcription service:', error);
    return json(
      { error: 'Failed to transcribe audio: ' + error.message },
      { status: 500 }
    );
  }
}
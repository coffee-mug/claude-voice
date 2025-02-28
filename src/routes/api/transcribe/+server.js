import { json } from '@sveltejs/kit';
import { calculateWhisperUsage, trackUsage, checkUsageLimit } from '$lib/utils/usage-tracker';

/**
 * Handles the transcription of audio using Cloudflare Workers AI Whisper model
 */
export async function POST({ request, platform }) {
  try {
    // First check if we're within usage limits
    const usageStatus = await checkUsageLimit(platform);
    if (!usageStatus.withinLimit) {
      return json({ 
        error: 'Daily usage limit reached. Please try again tomorrow.',
        usageStatus 
      }, { status: 429 });
    }
    
    // Extract audio blob from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const url = new URL(request.url);
    const params = new URLSearchParams(url.searchParams);

    console.log(url);
    console.log("Selected gender", params.get("gender"), "Selected language", params.get("language"));
    
    if (!audioFile) {
      return json({ error: 'No audio file provided' }, { status: 400 });
    }

    const blob = await audioFile.arrayBuffer();
    
    // Estimate audio duration in seconds (rough approximation)
    // WebM audio is typically ~20KB per second, so we'll use that for now
    const estimatedDurationSeconds = blob.byteLength / 20000;
    
    const input = {
        audio: [...new Uint8Array(blob)]
    };

    const response = await platform.env.AI.run(
        "@cf/openai/whisper",
        input
    );
    
    if (!response.text) {
      console.error('Cloudflare Whisper API error:', response);
      return json(
        { error: `Transcription failed: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }
    
    console.log("Matched text", response.text);
    
    // Track whisper usage
    const usageData = calculateWhisperUsage(estimatedDurationSeconds);
    await trackUsage(usageData, platform);
    
    // Return the transcribed text along with usage info
    return json({ 
      text: response.text,
      success: true,
      usage: {
        service: 'whisper',
        durationSeconds: estimatedDurationSeconds,
        cost: usageData.totalCost
      }
    });
  } catch (error) {
    console.error('Error in transcription service:', error);
    return json(
      { error: 'Failed to transcribe audio: ' + error.message },
      { status: 500 }
    );
  }
}
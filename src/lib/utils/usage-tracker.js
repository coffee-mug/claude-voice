/**
 * Utility functions for tracking API usage
 */

// Placeholder pricing
const PRICING = {
  // Claude API pricing (per 1M tokens)
  CLAUDE: {
    INPUT: 3.00,   // $3.00 per 1M input tokens
    OUTPUT: 15.00  // $15.00 per 1M output tokens
  },
  // Google Cloud TTS pricing
  GCP_TTS: {
    STANDARD: 4.00,      // $4.00 per 1M characters
    NEURAL: 16.00        // $16.00 per 1M characters
  },
  // Cloudflare Workers AI pricing
  CLOUDFLARE: {
    WHISPER: 0.00033     // $0.00033 per second of audio
  },
};

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
function getTodayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate Claude API usage cost
 * @param {object} result - Claude API response
 * @returns {object} - Cost breakdown
 */
export function calculateClaudeUsage(result) {
  // Get token counts from the Claude API response
  const inputTokens = result.usage.input_tokens || 0;
  const outputTokens = result.usage.output_tokens || 0;
  
  // Calculate costs (convert to dollars)
  const inputCost = (inputTokens / 1000000) * PRICING.CLAUDE.INPUT;
  const outputCost = (outputTokens / 1000000) * PRICING.CLAUDE.OUTPUT;
  const totalCost = inputCost + outputCost;
  
  return {
    service: 'claude',
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost
  };
}

/**
 * Calculate GCP TTS usage cost
 * @param {string} text - Text that was converted to speech
 * @param {object} voiceSettings - Voice settings used
 * @returns {object} - Cost breakdown
 */
export function calculateTTSUsage(text, voiceSettings) {
  // Count characters in text
  const characters = text.length;
  
  // Determine if using standard or neural voice
  const isNeural = voiceSettings.model.includes('Neural');
  const rate = isNeural ? PRICING.GCP_TTS.NEURAL : PRICING.GCP_TTS.STANDARD;
  
  // Calculate cost (convert to dollars)
  const totalCost = (characters / 1000000) * rate;
  
  return {
    service: 'gcp-tts',
    characters,
    isNeural,
    totalCost
  };
}

/**
 * Calculate Cloudflare Whisper usage cost
 * @param {number} audioDurationSeconds - Duration of audio in seconds
 * @returns {object} - Cost breakdown
 */
export function calculateWhisperUsage(audioDurationSeconds) {
  // Calculate cost based on duration
  const totalCost = audioDurationSeconds * PRICING.CLOUDFLARE.WHISPER;
  
  return {
    service: 'whisper',
    audioDurationSeconds,
    totalCost
  };
}

/**
 * Track API usage in KV store
 * @param {object} usageData - Usage data for an API call
 * @param {object} platform - Cloudflare platform object
 * @returns {Promise<object>} - Updated usage data
 */
export async function trackUsage(usageData, platform) {
  const today = getTodayString();
  const key = `usage_${today}`;
  
  try {
    // Get existing usage data for today
    let usageRecord = await platform.env.USAGE_STORE.get(key, { type: 'json' });
    
    if (!usageRecord) {
      // Initialize new usage record if none exists
      usageRecord = {
        date: today,
        totalCost: 0,
        services: {
          claude: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
          'gcp-tts': { calls: 0, characters: 0, cost: 0 },
          whisper: { calls: 0, seconds: 0, cost: 0 }
        }
      };
    }
    
    // Update usage record based on the service
    switch (usageData.service) {
      case 'claude':
        usageRecord.services.claude.calls++;
        usageRecord.services.claude.inputTokens += usageData.inputTokens;
        usageRecord.services.claude.outputTokens += usageData.outputTokens;
        usageRecord.services.claude.cost += usageData.totalCost;
        break;
      case 'gcp-tts':
        usageRecord.services['gcp-tts'].calls++;
        usageRecord.services['gcp-tts'].characters += usageData.characters;
        usageRecord.services['gcp-tts'].cost += usageData.totalCost;
        break;
      case 'whisper':
        usageRecord.services.whisper.calls++;
        usageRecord.services.whisper.seconds += usageData.audioDurationSeconds;
        usageRecord.services.whisper.cost += usageData.totalCost;
        break;
    }
    
    // Update total cost
    usageRecord.totalCost = 
      usageRecord.services.claude.cost + 
      usageRecord.services['gcp-tts'].cost + 
      usageRecord.services.whisper.cost;
    
    // Store updated record
    await platform.env.USAGE_STORE.put(key, JSON.stringify(usageRecord));
    
    return usageRecord;
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
}

/**
 * Check if usage is within daily limits
 * @param {object} platform - Cloudflare platform object
 * @returns {Promise<object>} - Usage status
 */
export async function checkUsageLimit(platform) {
  const today = getTodayString();
  const key = `usage_${today}`;
  
  try {
    // Get today's usage record
    const usageRecord = await platform.env.USAGE_STORE.get(key, { type: 'json' });
    
    if (!usageRecord) {
      // No usage yet today
      return { 
        withinLimit: true, 
        currentUsage: 0, 
        limit: parseFloat(platform.env.DAILY_USAGE_LIMIT || '20.00'),
        remaining: parseFloat(platform.env.DAILY_USAGE_LIMIT || '20.00')
      };
    }
    
    const limit = parseFloat(platform.env.DAILY_USAGE_LIMIT || '20.00');
    const remaining = limit - usageRecord.totalCost;
    
    return {
      withinLimit: usageRecord.totalCost < limit,
      currentUsage: usageRecord.totalCost,
      limit,
      remaining
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // If there's an error, assume we're within limits
    return { withinLimit: true, error: error.message };
  }
}

/**
 * Get usage statistics for today
 * @param {object} platform - Cloudflare platform object
 * @returns {Promise<object>} - Usage statistics
 */
export async function getUsageStats(platform) {
  const today = getTodayString();
  const key = `usage_${today}`;
  
  try {
    // Get today's usage record
    const usageRecord = await platform.env.USAGE_STORE.get(key, { type: 'json' });
    
    if (!usageRecord) {
      // No usage yet today
      return {
        date: today,
        totalCost: 0,
        limit: parseFloat(platform.env.DAILY_USAGE_LIMIT || '20.00'),
        remaining: parseFloat(platform.env.DAILY_USAGE_LIMIT || '20.00'),
        percentUsed: 0,
        services: {
          claude: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
          'gcp-tts': { calls: 0, characters: 0, cost: 0 },
          whisper: { calls: 0, seconds: 0, cost: 0 }
        }
      };
    }
    
    const limit = parseFloat(platform.env.DAILY_USAGE_LIMIT || '20.00');
    const remaining = limit - usageRecord.totalCost;
    const percentUsed = (usageRecord.totalCost / limit) * 100;
    
    return {
      ...usageRecord,
      limit,
      remaining,
      percentUsed
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}
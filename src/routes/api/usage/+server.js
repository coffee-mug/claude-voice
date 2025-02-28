import { json } from '@sveltejs/kit';
import { getUsageStats } from '$lib/utils/usage-tracker';

/**
 * GET handler to retrieve current usage statistics
 */
export async function GET({ platform }) {
  try {
    const usageStats = await getUsageStats(platform);
    
    return json({
      success: true,
      stats: usageStats
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
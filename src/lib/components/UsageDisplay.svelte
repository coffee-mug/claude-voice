<script>
  import { onMount } from 'svelte';
  
  // State using runes
  let usageStats = $state(null);
  let loading = $state(true);
  let error = $state(null);
  
  // Fetch usage stats on component mount and every 60 seconds
  onMount(() => {
    fetchUsageStats();
    
    // Set up a timer to refresh the usage stats every minute
    const interval = setInterval(fetchUsageStats, 60000);
    
    // Clean up the interval when the component is destroyed
    return () => clearInterval(interval);
  });
  
  // Function to fetch usage statistics
  async function fetchUsageStats() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch('/api/usage');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage stats: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error fetching usage stats');
      }
      
      usageStats = data.stats;
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  // Helper function to format currency
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  }
  
  // Helper function to format large numbers
  function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
  }
</script>

<div class="bg-white shadow-md rounded-lg p-4 my-4">
  <h2 class="text-lg font-semibold text-gray-800 mb-3">Daily API Usage</h2>
  
  {#if loading && !usageStats}
    <div class="flex justify-center p-4">
      <svg class="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {:else if error}
    <div class="p-3 bg-red-100 text-red-700 rounded-md mb-3">
      <p>{error}</p>
    </div>
  {:else if usageStats}
    <div class="mb-4">
      <div class="flex justify-between text-sm text-gray-600 mb-1">
        <span>Usage: {formatCurrency(usageStats.totalCost)}</span>
        <span>Limit: {formatCurrency(usageStats.limit)}</span>
      </div>
      
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          class="h-2.5 rounded-full" 
          style="width: {Math.min(usageStats.percentUsed, 100)}%; background-color: {usageStats.percentUsed > 90 ? '#ef4444' : usageStats.percentUsed > 70 ? '#f59e0b' : '#22c55e'}"
        ></div>
      </div>
      
      <p class="text-sm mt-1 text-gray-600">
        {usageStats.remaining < 0 
          ? 'Daily limit reached. Service temporarily unavailable.' 
          : `Remaining: ${formatCurrency(usageStats.remaining)}`}
      </p>
    </div>
    
    <div class="space-y-3 text-sm">
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-blue-50 p-3 rounded-md">
          <h3 class="font-medium text-blue-700 mb-1">Claude AI</h3>
          <p>Calls: {usageStats.services.claude.calls}</p>
          <p>Input tokens: {formatNumber(usageStats.services.claude.inputTokens)}</p>
          <p>Output tokens: {formatNumber(usageStats.services.claude.outputTokens)}</p>
          <p>Cost: {formatCurrency(usageStats.services.claude.cost)}</p>
        </div>
        
        <div class="bg-green-50 p-3 rounded-md">
          <h3 class="font-medium text-green-700 mb-1">Google TTS</h3>
          <p>Calls: {usageStats.services['gcp-tts'].calls}</p>
          <p>Characters: {formatNumber(usageStats.services['gcp-tts'].characters)}</p>
          <p>Cost: {formatCurrency(usageStats.services['gcp-tts'].cost)}</p>
        </div>
      </div>
      
      <div class="bg-purple-50 p-3 rounded-md">
        <h3 class="font-medium text-purple-700 mb-1">Cloudflare Whisper</h3>
        <p>Calls: {usageStats.services.whisper.calls}</p>
        <p>Audio processed: {formatNumber(Math.round(usageStats.services.whisper.seconds))} seconds</p>
        <p>Cost: {formatCurrency(usageStats.services.whisper.cost)}</p>
      </div>
    </div>
    
    <button 
      class="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
      on:click={fetchUsageStats}
    >
      Refresh
    </button>
  {/if}
</div>
<script>
  // Props
  const { show = false, usageStats = null } = $props();
  
  // State
  let email = $state('');
  let submitting = $state(false);
  let subscriptionResult = $state(null);
  
  // Subscribe to waiting list
  async function handleSubscribe() {
    if (!email) return;
    
    try {
      submitting = true;
      
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      subscriptionResult = {
        success: result.success,
        message: result.message
      };
      
      if (result.success) {
        email = '';
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      subscriptionResult = {
        success: false,
        message: 'Failed to subscribe. Please try again later.'
      };
    } finally {
      submitting = false;
    }
  }
  
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
</script>

{#if show}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-auto">
    <div class="text-center mb-4">
      <svg class="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-xl font-bold text-gray-900 mt-2">Daily Usage Limit Reached</h2>
    </div>
    
    <div class="mb-4 text-gray-700">
      <p>Our free tier has reached its daily usage limit of {usageStats?.limit ? formatCurrency(usageStats.limit) : '$20.00'}.</p>
      <p class="mt-2">Please try again tomorrow or subscribe below to get notified when individual subscriptions launch.</p>
    </div>
    
    <div class="mt-6">
      <h3 class="font-medium text-gray-900 mb-2">Get notified when subscriptions launch</h3>
      
      <form onsubmit={ (event) => event.preventDefault()} class="space-y-3">
        <div>
          <label for="email" class="sr-only">Email address</label>
          <input 
            id="email" 
            type="email" 
            placeholder="Enter your email address" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            bind:value={email}
            disabled={submitting}
          />
        </div>
        
        {#if subscriptionResult}
          <div class={`p-2 text-sm rounded ${subscriptionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {subscriptionResult.message}
          </div>
        {/if}
        
        <button 
          type="submit" 
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onclick={handleSubscribe}
          disabled={!email || submitting}
        >
          {#if submitting}
            <span class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Subscribing...
            </span>
          {:else}
            Subscribe
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>
{/if}
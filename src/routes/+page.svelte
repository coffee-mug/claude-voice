<script>
    import { onMount } from 'svelte';
    import AudioRecorder from '$lib/components/AudioRecorder.svelte';
    import ResponsePlayer from '$lib/components/ResponsePlayer.svelte';
    import ConversationHistory from '$lib/components/ConversationHistory.svelte';
    import VoiceSelector from '$lib/components/VoiceSelector.svelte';
    import UsageDisplay from '$lib/components/UsageDisplay.svelte';
    import UsageLimitPopup from '$lib/components/UsageLimitPopup.svelte';
    
    // Using runes for state management
    let transcribedText = $state('');
    let responseText = $state('');
    let audioSrc = $state(null);
    let processingError = $state(null);
    let viewTranscript = $state(false);
    let showUsage = $state(false);
    let usageStats = $state(null);
    let showLimitPopup = $state(false);
    let email = $state('');
    let submitting = $state(false);
    let subscriptionResult = $state(null);
    
    // Voice settings
    let voiceSettings = $state({
      language: 'en-US',
      gender: 'FEMALE',
      model: 'en-US-Chirp-HD-F'
    });
    
    // Check usage status on mount and periodically
    onMount(() => {
      fetchUsageStats();
      
      // Check usage every 2 minutes
      const interval = setInterval(fetchUsageStats, 120000);
      
      return () => clearInterval(interval);
    });
    
    // Function to fetch usage stats
    async function fetchUsageStats() {
      try {
        const response = await fetch('/api/usage');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.stats) {
            usageStats = data.stats;
            
            // Show popup if usage limit is exceeded
            if (usageStats.remaining <= 0) {
              showLimitPopup = true;
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
      }
    }
    
    // Update voice settings
    function handleVoiceSettingsUpdate(settings) {
      // Create a completely new object to avoid reference issues
      voiceSettings = { ...settings };
      console.log('Voice settings updated:', voiceSettings);
    }
    
    // Conversation history using runes
    let conversationHistory = $state([]);
    
    // Function to add messages to conversation history
    function addMessage(role, content) {
      conversationHistory = [...conversationHistory, { role, content }];
    }
    
    function clearConversation() {
      conversationHistory = [];
    }
    
    function handleProcessingComplete(event) {
      const { transcribedText: text, responseText: response, audioSrc: audio } = event.detail;
      transcribedText = text;
      responseText = response;
      audioSrc = audio;
      processingError = null;
      
      // Add messages to conversation history
      addMessage('user', text);
      addMessage('assistant', response);
      
      // Refresh usage stats after processing
      fetchUsageStats();
    }
    
    function handleProcessingError(event) {
      processingError = event.detail.error;
      
      // Check if the error is due to usage limits
      if (event.detail.error && event.detail.error.includes('usage limit')) {
        showLimitPopup = true;
      }
      
      // Refresh usage stats
      fetchUsageStats();
    }
    
    // Function for sharing conversation history with API calls
    function getConversationHistory() {
      return conversationHistory;
    }
    
    // Function to get voice settings
    function getVoiceSettings() {
      return {
        language: voiceSettings.language,
        gender: voiceSettings.gender,
        model: voiceSettings.model
      };
    }
    
    // Toggle usage display
    function toggleUsageDisplay() {
      showUsage = !showUsage;
    }
    
    // Handle email subscription
    async function handleSubscribe() {
      if (!email) return;
      
      try {
        submitting = true;
        subscriptionResult = null;
        
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
  </script>
  
  <svelte:head>
    <title>Claude Voice</title>
  </svelte:head>
  
  <main class="min-h-screen bg-gray-100 py-8 px-4">
    <div class="max-w-lg mx-auto">
      <header class="text-center mb-4 relative">
        <div class="absolute top-0 right-0">
          <a href="https://github.com/coffee-mug/claude-voice" target="_blank" rel="noopener noreferrer" class="text-gray-700 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </a>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Claude Voice</h1>
        <p class="text-gray-600">Speak to me, and I'll respond with my voice</p>
        <div class="mt-2 flex justify-center space-x-2">
          <button 
            onclick={toggleUsageDisplay}
            class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            {showUsage ? 'Hide Usage Stats' : 'Show Usage Stats'}
          </button>
        </div>
      </header>
      
      {#if showUsage}
        <UsageDisplay />
      {/if}
      
      <VoiceSelector 
        language={voiceSettings.language}
        gender={voiceSettings.gender}
        onUpdate={handleVoiceSettingsUpdate}
      />
      
      <AudioRecorder 
        on:processingComplete={handleProcessingComplete}
        on:processingError={handleProcessingError}
        {getConversationHistory}
        voiceSettings={voiceSettings}
      />
      
      {#if processingError}
        <div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p class="font-medium">Error processing your request:</p>
          <p>{processingError}</p>
        </div>
      {/if}
      
      <ResponsePlayer 
        {transcribedText}
        {responseText}
        {audioSrc}
      />

      {#if responseText}
        <button class="my-4 font-bold text-blue-600" onclick={() => viewTranscript = !viewTranscript}>{ viewTranscript ? "Hide Transcript" : "View Transcript"}</button>
      {/if}
      
      {#if viewTranscript}
      <ConversationHistory 
        history={conversationHistory} 
        {clearConversation}
      />
      {/if}
      
      <div class="mt-8 p-4 bg-blue-50 rounded-lg text-center">
        <h3 class="font-medium text-blue-800 mb-2">Get notified when subscriptions launch</h3>
        <p class="text-sm text-blue-600 mb-3">Sign up to be notified when individual subscriptions become available.</p>
        <form class="space-y-3" onsubmit={ (event) => event.preventDefault()}>
          <div>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
  </main>

  <!-- Usage limit popup -->
  <UsageLimitPopup show={showLimitPopup} {usageStats} />
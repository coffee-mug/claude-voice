<script>
    import AudioRecorder from '$lib/components/AudioRecorder.svelte';
    import ResponsePlayer from '$lib/components/ResponsePlayer.svelte';
    import ConversationHistory from '$lib/components/ConversationHistory.svelte';
    import VoiceSelector from '$lib/components/VoiceSelector.svelte';
    
    // Using runes for state management
    let transcribedText = $state('');
    let responseText = $state('');
    let audioSrc = $state(null);
    let processingError = $state(null);
    let viewTranscript = $state(false);
    
    // Voice settings
    let voiceSettings = $state({
      language: 'en-US',
      gender: 'FEMALE',
      model: 'en-US-Neural2-F'
    });
    
    // Update voice settings
    function handleVoiceSettingsUpdate(settings) {
      // Create a completely new object to avoid reference issues
      voiceSettings = { ...settings };
      console.log('Voice settings updated:', voiceSettings);
    }
    
    // Debug helper to check runes functionality
    function handleDebugClick() {
      console.log("Debug button clicked");
      console.log("Current voice settings:", voiceSettings);
      console.log("Conversation history:", conversationHistory);
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
    }
    
    function handleProcessingError(event) {
      processingError = event.detail.error;
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
  </script>
  
  <svelte:head>
    <title>Voice Assistant MVP</title>
  </svelte:head>
  
  <main class="min-h-screen bg-gray-100 py-8 px-4">
    <div class="max-w-lg mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Voice Assistant MVP</h1>
        <p class="text-gray-600">Speak to me, and I'll respond with my voice</p>
        <p class="text-sm text-blue-600 mt-2">Just click the blue button to start recording, then click the square to stop</p>
        <button 
          onclick={handleDebugClick}
          class="mt-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
        >
          Debug Check
        </button>
      </header>
      
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
    </div>
  </main>
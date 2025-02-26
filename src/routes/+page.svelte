<script>
    import AudioRecorder from '$lib/components/AudioRecorder.svelte';
    import ResponsePlayer from '$lib/components/ResponsePlayer.svelte';
    import ConversationHistory from '$lib/components/ConversationHistory.svelte';
    
    // Using runes for state management
    let transcribedText = $state('');
    let responseText = $state('');
    let audioSrc = $state(null);
    let processingError = $state(null);
    let showTranscript = $state(false);
    
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
      </header>
      
      <AudioRecorder 
        on:processingComplete={handleProcessingComplete}
        on:processingError={handleProcessingError}
        {getConversationHistory}
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
      
      {#if conversationHistory.length}
        <button class="font-bold text-blue-600 my-4" onclick={() => showTranscript = !showTranscript}>{ showTranscript ? "Hide transcript" : "Show transcript" }</button>
      {/if}
      {#if showTranscript}
        <ConversationHistory 
            history={conversationHistory} 
            {clearConversation}
        />
      {/if}
    </div>
  </main>
<script>
    import AudioRecorder from '$lib/components/AudioRecorder.svelte';
    import ResponsePlayer from '$lib/components/ResponsePlayer.svelte';
    
    let transcribedText = '';
    let responseText = '';
    let audioSrc = null;
    let processingError = null;
    
    function handleProcessingComplete(event) {
      const { transcribedText: text, responseText: response, audioSrc: audio } = event.detail;
      transcribedText = text;
      responseText = response;
      audioSrc = audio;
      processingError = null;
    }
    
    function handleProcessingError(event) {
      processingError = event.detail.error;
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
      </header>
      
      <AudioRecorder 
        on:processingComplete={handleProcessingComplete}
        on:processingError={handleProcessingError}
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
    </div>
  </main>
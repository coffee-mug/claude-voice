<script>
    import { onMount, onDestroy } from 'svelte';
    import { createEventDispatcher } from 'svelte';
  
    // Function to get conversation history from parent
    export let getConversationHistory;
  
    const dispatch = createEventDispatcher();
  
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let recordingTime = 0;
    let timer;
    let audioBlob = null;
    let audioUrl = null;
    let isProcessing = false;
  
    onMount(() => {
      // Request microphone permission when component mounts
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunks.push(event.data);
              }
            };
  
            mediaRecorder.onstop = () => {
              audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              audioUrl = URL.createObjectURL(audioBlob);
              dispatch('recordingComplete', { audioBlob, audioUrl });
              
              // Automatically start processing after recording stops
              processAudio();
            };
          })
          .catch(error => {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
          });
      } else {
        alert('Audio recording is not supported in this browser.');
      }
    });
  
    onDestroy(() => {
      if (timer) clearInterval(timer);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    });
  
    function startRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'recording') {
        audioChunks = [];
        mediaRecorder.start();
        isRecording = true;
        recordingTime = 0;
        
        timer = setInterval(() => {
          recordingTime += 1;
        }, 1000);
        
        dispatch('recordingStart');
      }
    }
  
    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        isRecording = false;
        if (timer) clearInterval(timer);
        
        dispatch('recordingStop');
      }
    }
  
    async function processAudio() {
      if (!audioBlob) return;
      
      isProcessing = true;
      dispatch('processingStart');
      
      try {
        // Create a FormData object to send the audio file
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        // Send to our API endpoint for processing
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const { text } = await response.json();
        
        // Send text to Claude and get response
        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text,
            conversationHistory: getConversationHistory()
          })
        });
        
        if (!chatResponse.ok) {
          throw new Error(`Chat API responded with ${chatResponse.status}`);
        }
        
        const { responseText } = await chatResponse.json();
        
        // Convert response to speech
        const speakResponse = await fetch('/api/speak', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: responseText })
        });
        
        if (!speakResponse.ok) {
          throw new Error(`Speak API responded with ${speakResponse.status}`);
        }
        
        // Get the audio blob from the response
        const audioData = await speakResponse.blob();
        const audioSrc = URL.createObjectURL(audioData);
        
        dispatch('processingComplete', {
          transcribedText: text,
          responseText,
          audioSrc
        });
      } catch (error) {
        console.error('Error processing audio:', error);
        dispatch('processingError', { error: error.message });
      } finally {
        isProcessing = false;
      }
    }
  </script>
  
  <div class="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
    <div class="flex flex-col items-center space-y-4">
      <div class="w-full flex justify-center">
        {#if isRecording}
          <button 
            on:click={stopRecording}
            class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            aria-label="Stop Recording"
          >
            <div class="w-6 h-6 bg-white rounded"></div>
          </button>
        {:else}
          <button 
            on:click={startRecording}
            class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
            aria-label="Start Recording"
          >
            <div class="w-6 h-6 bg-white rounded-full"></div>
          </button>
        {/if}
      </div>
      
      {#if isRecording}
        <div class="text-center">
          <p class="text-red-500 animate-pulse font-medium">Recording...</p>
          <p class="text-gray-600">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</p>
        </div>
      {/if}
      
      {#if audioUrl && !isRecording}
        <div class="w-full">
          <audio controls src={audioUrl} class="w-full hidden"></audio>
          
          {#if isProcessing}
            <div class="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Got it, let me think...
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
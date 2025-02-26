<script>
    export let transcribedText = '';
    export let responseText = '';
    export let audioSrc = null;
    
    let audioPlayer;
    let isPlaying = false;
    
      // Watch for changes to audioSrc and autoplay when it becomes available
  $: if (audioSrc && audioPlayer) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      audioPlayer.play().catch(err => {
        console.error('Auto-play failed:', err);
      });
    }, 100);
  }

    function togglePlay() {
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    }
    
    function onPlay() {
      isPlaying = true;
    }
    
    function onPause() {
      isPlaying = false;
    }
    
    function onEnded() {
      isPlaying = false;
    }
  </script>
  
  {#if transcribedText || responseText}
    <div class="w-full max-w-md mx-auto p-4 mt-4 bg-white rounded-lg shadow-md">
    {#if audioSrc}
        <div class="mt-4">
          <audio 
            bind:this={audioPlayer} 
            src={audioSrc} 
            on:play={onPlay}
            on:pause={onPause}
            on:ended={onEnded}
            class="hidden"
          ></audio>
          
          <div class="flex flex-col space-y-2">
            {#if isPlaying}
            <div class="text-center text-sm text-green-600 mb-2 animate-pulse">
                <span>▶ Playing audio response...</span>
              </div>
            {/if}
              <button
                on:click={togglePlay}
                class="w-full py-2 px-4 bg-purple-500 text-white rounded-md shadow hover:bg-purple-600 transition-colors flex items-center justify-center"
              >
                {#if isPlaying}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  Pause
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                  </svg>
                  Play Response
                {/if}
              </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
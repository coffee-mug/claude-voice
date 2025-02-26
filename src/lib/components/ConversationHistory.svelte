<script>
    // Using props instead of importing the store
    export let history = [];
    export let clearConversation;
    
    // Function to handle clearing the conversation
    function handleClearConversation() {
      if (confirm('Are you sure you want to clear the conversation?')) {
        clearConversation();
      }
    }
  </script>
  
  {#if history.length > 0}
    <div class="w-full max-w-md mx-auto p-4 mt-4 bg-white rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-800">Conversation History</h2>
        <button 
          on:click={handleClearConversation}
          class="text-sm text-red-500 hover:text-red-700"
        >
          Clear
        </button>
      </div>
      
      <div class="space-y-4">
        {#each history as message, i}
          <div class={`p-3 rounded-lg ${message.role === 'user' ? 'bg-gray-100 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-purple-500'}`}>
            <p class="text-xs font-medium text-gray-500 mb-1">
              {message.role === 'user' ? 'You' : 'Claude'}
            </p>
            <p class="text-gray-800">{message.content}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
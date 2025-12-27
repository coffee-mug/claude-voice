<script>
    // Use $props for reactive props
    const { language = 'en-US', gender = 'FEMALE', onUpdate } = $props();
    
    // Define available languages and voices
    const languages = [
      { code: 'en-US', name: 'English' },
      { code: 'fr-FR', name: 'French' }
    ];
    
    const genders = [
      { code: 'FEMALE', name: 'Female' },
      { code: 'MALE', name: 'Male' }
    ];
    
    // Voice models for each combination
    const voiceModels = {
      'en-US': {
        'FEMALE': 'en-US-Chirp-HD-F',
        'MALE': 'en-US-Chirp-HD-D'
      },
      'fr-FR': {
        'FEMALE': 'fr-FR-Chirp-HD-F',
        'MALE': 'fr-FR-Chirp-HD-D'
      }
    };
    
    // Local state for selections
    let selectedLanguage = $state(language);
    let selectedGender = $state(gender);
    
    // Computed voice model based on selections
    let voiceModel = $derived(voiceModels[selectedLanguage][selectedGender]);
    
    // Track previous values to avoid unnecessary updates
    let previousLanguage = language;
    let previousGender = gender;
    
    // Only notify parent when values actually change and not on initial render
    function handleLanguageChange() {
      if (selectedLanguage !== previousLanguage || selectedGender !== previousGender) {
        previousLanguage = selectedLanguage;
        previousGender = selectedGender;
        
        if (onUpdate) {
          onUpdate({
            language: selectedLanguage,
            gender: selectedGender,
            model: voiceModel
          });
        }
      }
    }
    
    function handleGenderChange() {
      if (selectedLanguage !== previousLanguage || selectedGender !== previousGender) {
        previousLanguage = selectedLanguage;
        previousGender = selectedGender;
        
        if (onUpdate) {
          onUpdate({
            language: selectedLanguage,
            gender: selectedGender,
            model: voiceModel
          });
        }
      }
    }
  </script>
  
  <div class="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md mb-4">
    <h2 class="text-lg font-semibold text-gray-800 mb-3">Voice Settings</h2>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="language-select" class="block text-sm font-medium text-gray-700 mb-1">
          Language
        </label>
        <select 
          id="language-select"
          bind:value={selectedLanguage}
          on:change={handleLanguageChange}
          class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each languages as language}
            <option value={language.code}>{language.name}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="gender-select" class="block text-sm font-medium text-gray-700 mb-1">
          Voice Gender
        </label>
        <select 
          id="gender-select"
          bind:value={selectedGender}
          on:change={handleGenderChange}
          class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each genders as gender}
            <option value={gender.code}>{gender.name}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="mt-3 text-sm text-gray-500">
      Selected voice: {voiceModel}
    </div>
  </div>
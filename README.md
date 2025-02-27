# What's this?

A POC of a voice assistant for Claude AI models. Instead of typing, record yourself to talk to Claude and get its response in voice format instead of text. 

It leverages Cloudflare Pages for hosting, Workers AI for sound transcription and GCP Text-To-Speech models to speak Claude's response with a voice.

# Get started

Requirements:
- A Cloudflare account
- An Anthropic API Key
- a GCP account with billing account attached. 

## Create the GCP project and enable necessary APIs. 
- Ask Claude on how to create a project and enable Text-To-Speech API... just kidding

### GCP
- Head over console.cloud.google.com
- Pick your desired project or create a new one. 
- In the search bar, go to "Text-To-Speech" and click Enable. Caution: this is paid API, you can check pricing [https://cloud.google.com/text-to-speech/pricing?hl=en](here)
- Then go to "APIs & Services" page > Credentials and Click "Create Credentials". Pick "API Key"
- Apply "Application Restrictions" as desired.
- Under "API restrictions", select "Restrict Key" and choose "Cloud Text-to-Speech API"
- Save and keep the API key nearby

### Claude
- Go to https://console.anthropic.com/settings/keys and create a new key
- Note the API key

## Configure env & secrets
- For local development, save your keys in .env at the root of your project
    - CLAUDE_API_KEY=REPLACE_WITH_YOUR_CLAUDE_API_KEY
    - GCP_PROJECT_ID=REPLACE_WITH_YOUR_GCP_PROJECT_ID
    - GCP_API_KEY=REPLACE_WITH_YOUR_GCP_API_KEY
- Create the secrets for production
   - npx wrangler secret put CLAUDE_API_KEY
   - npx wrangler secret put GCP_PROJECT_ID
   - npx wrangler secret put GCP_API_KEY

## Test locally
- npm run dev

## Deploy
- npm run deploy (on first deploy, you'll be prompted to create a project on Cloudflare Pages, accept)

# Price consideration
- The model used is opus-3.5, which is a still powerful model but cheaper than Sonnet. 
- TTS model is using the Neural2 family of voices, which offer great voice quality for accessible pricing
- You can check your current Anthropic API usage at https://console.anthropic.com/settings/usage
- Monitor your GCP usage closely 

# Security consideration
- This is a POC and so the deployed version is publicly accessible to anyone, making it possible for anonymous user to make your usage increase and cost you.
- You *should* implement an authorization / authentication mechanism to block illegitimate users to abuse the service.
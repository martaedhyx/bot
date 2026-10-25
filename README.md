# Edhy Robot

Edhy Robot uses Gemini with Google Search grounding for answers based on current public web information. The API key must stay on the server; it must never be placed in `index.html`.

## Deploy (required before chat can work)

1. Import `martaedhyx/bot` into a Vercel project and deploy it. The repository contains `api/chat.js`, which Vercel runs as a serverless function.
2. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/apikey
3. In Vercel, open **Project Settings → Environment Variables** and add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
   - Environments: Production (and Preview if you need it)
4. Redeploy after saving the environment variable.
5. Open the Vercel deployment URL (ending in `.vercel.app`). The frontend automatically calls `/api/chat` when hosted on Vercel.

If you want to keep using GitHub Pages for the frontend, replace `API_ENDPOINT` in `index.html` with the full HTTPS URL of the deployed Vercel endpoint, for example `https://YOUR-PROJECT.vercel.app/api/chat`. Do not use the example URL literally. The endpoint allows requests from `https://martaedhyx.github.io` and Vercel preview/production domains.

## Notes

- The key is not included in this repository. You must add your own key in Vercel; no key was supplied or created as part of these code changes.
- Google Search grounding searches public web information; it is not a private or universal database and may not access content behind logins or paywalls.
- API usage limits and charges depend on Google's current plan and usage. Check your Google AI Studio project before relying on it for continuous use.
- This is an AI chat plus live-search grounding foundation, not yet a fully autonomous agent that can safely operate other accounts, devices, or websites. Add individual tools with explicit permissions and confirmation before consequential actions.

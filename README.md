# Merge Poker Prototype

Mobile merge poker puzzle prototype.

## Global leaderboard setup

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL Editor.
3. Open `backend-config.js` and set the project URL and publishable key.
4. Commit the configuration change and wait for GitHub Pages to redeploy.

The publishable key is intended for browser use with RLS. Never commit a Supabase secret or service-role key. If the backend configuration is empty or unavailable, the game falls back to the browser-local leaderboard.

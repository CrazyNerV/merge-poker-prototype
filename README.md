# Merge Poker Prototype

Mobile merge poker puzzle prototype.

## Global leaderboard setup

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL Editor. Run it again after updates; it safely adds the stage column to existing deployments and assigns legacy scores to Stage 7.
3. Open `backend-config.js` and set the project URL and publishable key.
4. Commit the configuration change and wait for GitHub Pages to redeploy.

The publishable key is intended for browser use with RLS. Never commit a Supabase secret or service-role key. Rankings are queried independently for each stage and capped at Top 100. If the backend configuration is empty, unavailable, or has not received the latest schema migration, the game falls back to a stage-specific browser-local leaderboard.

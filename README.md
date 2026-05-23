# Discord Bot

10 slash commands, HTTP interactions (serverless-ready), channel + role restricted.

## Commands
`/ping` `/roll` `/flip` `/8ball` `/choose` `/joke` `/fact` `/reverse` `/countdown` `/avatar`

## Railway Setup
1. Connect this repo in Railway
2. Set these env vars in Railway → Variables:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_PUBLIC_KEY`
   - `DISCORD_CHANNEL_ID`
   - `DISCORD_ROLE_IDS` (comma-separated)
3. Start command: `npm start`
4. Set Interactions Endpoint URL in Discord Developer Portal:
   `https://your-app.up.railway.app/api/discord/interactions`

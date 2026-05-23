import express from "express";
import { registerCommands } from "./commands.js";
import { discordRouter } from "./routes.js";
import { startGateway } from "./gateway.js";

const PORT = process.env.PORT ?? "8080";
const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is not set");
  process.exit(1);
}

// Register slash commands on startup
registerCommands(TOKEN).catch((err) => {
  console.error("Failed to register commands:", err);
});

// Start gateway for member join events
startGateway(TOKEN);

const app = express();

// Discord route MUST come before express.json() — raw body needed for sig verification
app.use("/api", discordRouter);

app.use(express.json());

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(Number(PORT), () => {
  console.log(`Server listening on port ${PORT}`);
});

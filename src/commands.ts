import { REST, Routes, SlashCommandBuilder } from "discord.js";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "1507630327424745472";

export const commandDefinitions = [
  // ── Original fun commands ──────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency"),
  new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a dice")
    .addIntegerOption((o) =>
      o.setName("sides").setDescription("Number of sides (default: 6)").setRequired(false).setMinValue(2).setMaxValue(1000),
    ),
  new SlashCommandBuilder()
    .setName("flip")
    .setDescription("Flip a coin — heads or tails?"),
  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball a question")
    .addStringOption((o) => o.setName("question").setDescription("Your yes/no question").setRequired(true)),
  new SlashCommandBuilder()
    .setName("choose")
    .setDescription("Pick a random option from a list")
    .addStringOption((o) =>
      o.setName("options").setDescription("Comma-separated options (e.g. pizza, sushi, tacos)").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Get a random joke"),
  new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Get a random fun fact"),
  new SlashCommandBuilder()
    .setName("reverse")
    .setDescription("Reverse a piece of text")
    .addStringOption((o) => o.setName("text").setDescription("Text to reverse").setRequired(true)),
  new SlashCommandBuilder()
    .setName("countdown")
    .setDescription("Count down from a number")
    .addIntegerOption((o) =>
      o.setName("from").setDescription("Start counting from (max 10)").setRequired(true).setMinValue(1).setMaxValue(10),
    ),
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a user's avatar")
    .addUserOption((o) => o.setName("user").setDescription("User (defaults to you)").setRequired(false)),

  // ── Management commands ────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Show bot uptime, gateway connection, and auto-role stats"),
  new SlashCommandBuilder()
    .setName("botstats")
    .setDescription("Show Node.js version, memory usage, and process information"),
  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Show server statistics (members, boosts, creation date)"),
  new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Show total and approximate online member count"),
  new SlashCommandBuilder()
    .setName("rolelist")
    .setDescription("List all roles in the server with their positions"),
  new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Check auto-role system health, config, and recent assignment events"),
  new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Show recent bot activity logs (admin only)")
    .addIntegerOption((o) =>
      o.setName("count").setDescription("Number of log entries to show (default: 15, max: 25)").setRequired(false).setMinValue(1).setMaxValue(25),
    ),
  new SlashCommandBuilder()
    .setName("permissions")
    .setDescription("Show the bot's current permissions in this channel"),
  new SlashCommandBuilder()
    .setName("auditlog")
    .setDescription("Show recent server audit log entries (requires View Audit Log permission)")
    .addIntegerOption((o) =>
      o.setName("count").setDescription("Number of entries to show (default: 10, max: 15)").setRequired(false).setMinValue(1).setMaxValue(15),
    ),
  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show detailed information about a user")
    .addUserOption((o) => o.setName("user").setDescription("User to look up (defaults to you)").setRequired(false)),
].map((c) => c.toJSON());

export async function registerCommands(token: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  console.log(`[COMMANDS] Registering ${commandDefinitions.length} slash commands globally...`);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefinitions });
  console.log(`[COMMANDS] All ${commandDefinitions.length} commands registered successfully.`);
}

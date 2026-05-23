import { REST, Routes, SlashCommandBuilder } from "discord.js";

const CLIENT_ID = "1507630327424745472";

export const commandDefinitions = [
  new SlashCommandBuilder().setName("ping").setDescription("Check the bot's latency"),
  new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a dice")
    .addIntegerOption((o) =>
      o.setName("sides").setDescription("Number of sides (default: 6)").setRequired(false).setMinValue(2).setMaxValue(1000)
    ),
  new SlashCommandBuilder().setName("flip").setDescription("Flip a coin — heads or tails?"),
  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball a question")
    .addStringOption((o) => o.setName("question").setDescription("Your yes/no question").setRequired(true)),
  new SlashCommandBuilder()
    .setName("choose")
    .setDescription("Pick a random option from a list")
    .addStringOption((o) =>
      o.setName("options").setDescription("Comma-separated options (e.g. pizza, sushi, tacos)").setRequired(true)
    ),
  new SlashCommandBuilder().setName("joke").setDescription("Get a random joke"),
  new SlashCommandBuilder().setName("fact").setDescription("Get a random fun fact"),
  new SlashCommandBuilder()
    .setName("reverse")
    .setDescription("Reverse a piece of text")
    .addStringOption((o) => o.setName("text").setDescription("Text to reverse").setRequired(true)),
  new SlashCommandBuilder()
    .setName("countdown")
    .setDescription("Count down from a number")
    .addIntegerOption((o) =>
      o.setName("from").setDescription("Start counting from (max 10)").setRequired(true).setMinValue(1).setMaxValue(10)
    ),
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a user's avatar")
    .addUserOption((o) => o.setName("user").setDescription("User (defaults to you)").setRequired(false)),
].map((c) => c.toJSON());

export async function registerCommands(token: string) {
  const rest = new REST({ version: "10" }).setToken(token);
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefinitions });
  console.log("Slash commands registered.");
}

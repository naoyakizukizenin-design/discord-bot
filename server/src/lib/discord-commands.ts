import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { logger } from "./logger";

const CLIENT_ID = "1507630327424745472";

export const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency"),

  new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a dice")
    .addIntegerOption((opt) =>
      opt
        .setName("sides")
        .setDescription("Number of sides (default: 6)")
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(1000),
    ),

  new SlashCommandBuilder()
    .setName("flip")
    .setDescription("Flip a coin — heads or tails?"),

  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball a question")
    .addStringOption((opt) =>
      opt
        .setName("question")
        .setDescription("Your yes/no question")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("choose")
    .setDescription("Pick a random option from a list")
    .addStringOption((opt) =>
      opt
        .setName("options")
        .setDescription("Comma-separated options (e.g. pizza, sushi, tacos)")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Get a random programming or dad joke"),

  new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Get a random fun fact"),

  new SlashCommandBuilder()
    .setName("reverse")
    .setDescription("Reverse a piece of text")
    .addStringOption((opt) =>
      opt.setName("text").setDescription("Text to reverse").setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("countdown")
    .setDescription("Count down from a number")
    .addIntegerOption((opt) =>
      opt
        .setName("from")
        .setDescription("Start counting from (max 10)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10),
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a user's avatar")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("User to show avatar for (defaults to you)")
        .setRequired(false),
    ),
].map((cmd) => cmd.toJSON());

export async function registerCommands(token: string) {
  const rest = new REST({ version: "10" }).setToken(token);
  logger.info("Registering slash commands...");
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  logger.info("Slash commands registered.");
}

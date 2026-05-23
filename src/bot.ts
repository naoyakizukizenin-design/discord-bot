import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  type Interaction,
  type ChatInputCommandInteraction,
} from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = "1507630327424745472";

const commands = [
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
        .setMaxValue(1000)
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
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("choose")
    .setDescription("Pick a random option from a list")
    .addStringOption((opt) =>
      opt
        .setName("options")
        .setDescription("Comma-separated options (e.g. pizza, sushi, tacos)")
        .setRequired(true)
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
      opt.setName("text").setDescription("Text to reverse").setRequired(true)
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
        .setMaxValue(10)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a user's avatar")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("User to show avatar for (defaults to you)")
        .setRequired(false)
    ),
].map((cmd) => cmd.toJSON());

const EIGHT_BALL_RESPONSES = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes, definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
  "Why did the developer go broke? Because he used up all his cache.",
  "How many programmers does it take to change a light bulb? None — that's a hardware problem.",
  "Why do Java developers wear glasses? Because they don't C#.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why can't your nose be 12 inches long? Because then it'd be a foot.",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "What do you call fake spaghetti? An impasta.",
  "Why don't scientists trust atoms? Because they make up everything.",
];

const FACTS = [
  "Honey never spoils — archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "A group of flamingos is called a flamboyance.",
  "Octopuses have three hearts, blue blood, and nine brains.",
  "The shortest war in history was between Britain and Zanzibar in 1896 — it lasted 38 minutes.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "Bananas are technically berries, but strawberries are not.",
  "There are more possible iterations of a chess game than atoms in the observable universe.",
  "A day on Venus is longer than a year on Venus.",
  "The mantis shrimp can punch with the force of a bullet and sees 16 types of color receptors (humans have 3).",
  "Nintendo was founded in 1889 — originally as a playing card company.",
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log("Slash commands registered.");
}

async function handleCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;

  if (commandName === "ping") {
    const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(
      `🏓 Pong! Latency: **${latency}ms** | API: **${interaction.client.ws.ping}ms**`
    );
  } else if (commandName === "roll") {
    const sides = interaction.options.getInteger("sides") ?? 6;
    const result = Math.floor(Math.random() * sides) + 1;
    await interaction.reply(`🎲 You rolled a **${result}** (d${sides})`);
  } else if (commandName === "flip") {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    await interaction.reply(`🪙 **${result}!**`);
  } else if (commandName === "8ball") {
    const question = interaction.options.getString("question", true);
    const answer = EIGHT_BALL_RESPONSES[Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)];
    await interaction.reply(`🎱 **Q:** ${question}\n**A:** ${answer}`);
  } else if (commandName === "choose") {
    const raw = interaction.options.getString("options", true);
    const choices = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (choices.length < 2) {
      await interaction.reply({ content: "❌ Please provide at least 2 comma-separated options.", ephemeral: true });
      return;
    }
    const pick = choices[Math.floor(Math.random() * choices.length)];
    await interaction.reply(`🎯 I choose: **${pick}**`);
  } else if (commandName === "joke") {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    await interaction.reply(`😄 ${joke}`);
  } else if (commandName === "fact") {
    const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
    await interaction.reply(`💡 ${fact}`);
  } else if (commandName === "reverse") {
    const text = interaction.options.getString("text", true);
    const reversed = text.split("").reverse().join("");
    await interaction.reply(`🔄 \`${reversed}\``);
  } else if (commandName === "countdown") {
    const from = interaction.options.getInteger("from", true);
    const nums = Array.from({ length: from }, (_, i) => from - i).join(" → ");
    await interaction.reply(`⏱️ ${nums} → 🚀 **Blast off!**`);
  } else if (commandName === "avatar") {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const url = target.displayAvatarURL({ size: 512 });
    await interaction.reply(`🖼️ **${target.username}'s avatar**\n${url}`);
  }
}

async function main() {
  if (!TOKEN) {
    console.error("DISCORD_BOT_TOKEN is not set.");
    process.exit(1);
  }

  await registerCommands();

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      await handleCommand(interaction);
    } catch (err) {
      console.error("Error handling command:", err);
      const msg = { content: "❌ Something went wrong.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  });

  await client.login(TOKEN);
}

main();

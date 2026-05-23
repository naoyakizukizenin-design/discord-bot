import { InteractionType, InteractionResponseType } from "discord.js";
import { logger } from "./logger";

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

const ALLOWED_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;
const ALLOWED_ROLE_IDS = (process.env.DISCORD_ROLE_IDS ?? "").split(",").filter(Boolean);

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getOption(options: any[], name: string) {
  return options?.find((o: any) => o.name === name)?.value;
}

function hasAllowedRole(member: any): boolean {
  if (!ALLOWED_ROLE_IDS.length) return true;
  const memberRoles: string[] = member?.roles ?? [];
  return ALLOWED_ROLE_IDS.some((id) => memberRoles.includes(id));
}

export function handleInteraction(body: any): object {
  const { type, channel_id, member, data } = body;

  if (type === InteractionType.Ping) {
    return { type: InteractionResponseType.Pong };
  }

  if (type === InteractionType.ApplicationCommand) {
    if (channel_id !== ALLOWED_CHANNEL_ID) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "❌ This bot can only be used in the designated channel.",
          flags: 64,
        },
      };
    }

    if (!hasAllowedRole(member)) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "❌ You don't have permission to use this bot.",
          flags: 64,
        },
      };
    }

    const commandName: string = data?.name;
    const options: any[] = data?.options ?? [];

    logger.info({ commandName }, "Handling command");

    if (commandName === "ping") {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: "🏓 Pong!" },
      };
    }

    if (commandName === "roll") {
      const sides = getOption(options, "sides") ?? 6;
      const result = Math.floor(Math.random() * sides) + 1;
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `🎲 You rolled a **${result}** (d${sides})` },
      };
    }

    if (commandName === "flip") {
      const result = Math.random() < 0.5 ? "Heads" : "Tails";
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `🪙 **${result}!**` },
      };
    }

    if (commandName === "8ball") {
      const question = getOption(options, "question");
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `🎱 **Q:** ${question}\n**A:** ${rand(EIGHT_BALL_RESPONSES)}`,
        },
      };
    }

    if (commandName === "choose") {
      const raw = getOption(options, "options") ?? "";
      const choices = (raw as string).split(",").map((s: string) => s.trim()).filter(Boolean);
      if (choices.length < 2) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "❌ Please provide at least 2 comma-separated options.",
            flags: 64,
          },
        };
      }
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `🎯 I choose: **${rand(choices)}**` },
      };
    }

    if (commandName === "joke") {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `😄 ${rand(JOKES)}` },
      };
    }

    if (commandName === "fact") {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `💡 ${rand(FACTS)}` },
      };
    }

    if (commandName === "reverse") {
      const text = getOption(options, "text") ?? "";
      const reversed = (text as string).split("").reverse().join("");
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `🔄 \`${reversed}\`` },
      };
    }

    if (commandName === "countdown") {
      const from = getOption(options, "from") ?? 5;
      const nums = Array.from({ length: from }, (_, i) => from - i).join(" → ");
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `⏱️ ${nums} → 🚀 **Blast off!**` },
      };
    }

    if (commandName === "avatar") {
      const resolvedUsers = body?.data?.resolved?.users ?? {};
      const targetId = getOption(options, "user") ?? member?.user?.id ?? body?.user?.id;
      const user = resolvedUsers[targetId] ?? member?.user ?? body?.user;
      const avatarHash = user?.avatar;
      const userId = user?.id;
      const url = avatarHash
        ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=512`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: `🖼️ **${user?.username ?? "User"}'s avatar**\n${url}` },
      };
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "❓ Unknown command." },
    };
  }

  return { type: InteractionResponseType.Pong };
}

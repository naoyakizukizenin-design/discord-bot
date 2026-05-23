const EIGHT_BALL = [
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.", "Yes.",
  "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.",
];

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "A SQL query walks into a bar and asks two tables: 'Can I join you?'",
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
  "Honey never spoils — 3,000-year-old honey found in Egyptian tombs was still edible.",
  "A group of flamingos is called a flamboyance.",
  "Octopuses have three hearts, blue blood, and nine brains.",
  "The shortest war in history lasted 38 minutes (Britain vs Zanzibar, 1896).",
  "Cleopatra lived closer to the Moon landing than to the Great Pyramid's construction.",
  "Bananas are technically berries, but strawberries are not.",
  "There are more chess game iterations than atoms in the observable universe.",
  "A day on Venus is longer than a year on Venus.",
  "The mantis shrimp can punch with the force of a bullet.",
  "Nintendo was founded in 1889 as a playing card company.",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getOpt(options: any[], name: string) {
  return options?.find((o: any) => o.name === name)?.value;
}

export function handleInteraction(body: any): object {
  const { type, channel_id, member, data } = body;

  const ALLOWED_CHANNEL = process.env.DISCORD_CHANNEL_ID ?? "";
  const ALLOWED_ROLES = (process.env.DISCORD_ROLE_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  console.log("Interaction:", { type, channel_id, ALLOWED_CHANNEL, memberRoles: member?.roles });

  // PING — Discord verification handshake
  if (type === 1) return { type: 1 };

  // Application command
  if (type === 2) {
    if (ALLOWED_CHANNEL && channel_id !== ALLOWED_CHANNEL) {
      return { type: 4, data: { content: "❌ This bot can only be used in the designated channel.", flags: 64 } };
    }

    const memberRoles: string[] = member?.roles ?? [];
    if (ALLOWED_ROLES.length && !ALLOWED_ROLES.some((id) => memberRoles.includes(id))) {
      return { type: 4, data: { content: "❌ You don't have permission to use this bot.", flags: 64 } };
    }

    const name: string = data?.name ?? "";
    const opts: any[] = data?.options ?? [];

    if (name === "ping") return { type: 4, data: { content: "🏓 Pong!" } };

    if (name === "roll") {
      const sides = getOpt(opts, "sides") ?? 6;
      return { type: 4, data: { content: `🎲 You rolled a **${Math.floor(Math.random() * sides) + 1}** (d${sides})` } };
    }

    if (name === "flip") {
      return { type: 4, data: { content: `🪙 **${Math.random() < 0.5 ? "Heads" : "Tails"}!**` } };
    }

    if (name === "8ball") {
      const q = getOpt(opts, "question");
      return { type: 4, data: { content: `🎱 **Q:** ${q}\n**A:** ${rand(EIGHT_BALL)}` } };
    }

    if (name === "choose") {
      const choices = (getOpt(opts, "options") as string ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
      if (choices.length < 2) return { type: 4, data: { content: "❌ Provide at least 2 comma-separated options.", flags: 64 } };
      return { type: 4, data: { content: `🎯 I choose: **${rand(choices)}**` } };
    }

    if (name === "joke") return { type: 4, data: { content: `😄 ${rand(JOKES)}` } };

    if (name === "fact") return { type: 4, data: { content: `💡 ${rand(FACTS)}` } };

    if (name === "reverse") {
      const text = getOpt(opts, "text") as string ?? "";
      return { type: 4, data: { content: `🔄 \`${text.split("").reverse().join("")}\`` } };
    }

    if (name === "countdown") {
      const from = getOpt(opts, "from") as number ?? 5;
      const nums = Array.from({ length: from }, (_, i) => from - i).join(" → ");
      return { type: 4, data: { content: `⏱️ ${nums} → 🚀 **Blast off!**` } };
    }

    if (name === "avatar") {
      const resolved = body?.data?.resolved?.users ?? {};
      const targetId = getOpt(opts, "user") ?? member?.user?.id;
      const user = resolved[targetId] ?? member?.user;
      const url = user?.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      return { type: 4, data: { content: `🖼️ **${user?.username ?? "User"}'s avatar**\n${url}` } };
    }
  }

  return { type: 1 };
}

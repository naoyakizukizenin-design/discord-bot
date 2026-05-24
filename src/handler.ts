import { botState, addLog } from "./state.js";

// ── Fun command data ───────────────────────────────────────────────────────
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

// ── Utility helpers ────────────────────────────────────────────────────────
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getOpt(options: any[], name: string) {
  return options?.find((o: any) => o.name === name)?.value;
}

function formatUptime(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/** Convert a Discord snowflake ID to its creation Date */
function snowflakeToDate(id: string): Date {
  return new Date(Number(BigInt(id) >> 22n) + 1420070400000);
}

/** Check if a permission bit is set in a Discord permissions string */
function hasPerm(permissions: string | undefined, bit: bigint): boolean {
  if (!permissions) return false;
  try { return (BigInt(permissions) & bit) !== 0n; } catch { return false; }
}

const isAdmin = (member: any) =>
  hasPerm(member?.permissions, 8n); // ADMINISTRATOR

const canViewAudit = (member: any) =>
  hasPerm(member?.permissions, 8n) ||   // ADMINISTRATOR
  hasPerm(member?.permissions, 128n);   // VIEW_AUDIT_LOG

// ── Discord REST helper ────────────────────────────────────────────────────
async function dRest<T>(method: string, path: string): Promise<T> {
  const token = process.env.DISCORD_BOT_TOKEN ?? "";
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API ${method} ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "1502426379940008107";

// ── Audit log action type names ────────────────────────────────────────────
const AUDIT_ACTIONS: Record<number, string> = {
  1: "Server Update",
  10: "Channel Create", 11: "Channel Update", 12: "Channel Delete",
  20: "Member Kick", 21: "Member Prune", 22: "Member Ban+", 23: "Member Ban−",
  24: "Member Update", 25: "Member Role Update", 26: "Member Move", 27: "Member Disconnect",
  30: "Bot Add",
  40: "Role Create", 41: "Role Update", 42: "Role Delete",
  50: "Invite Create", 51: "Invite Update", 52: "Invite Delete",
  60: "Webhook Create", 61: "Webhook Update", 62: "Webhook Delete",
  72: "Message Delete", 73: "Bulk Message Delete", 74: "Message Pin", 75: "Message Unpin",
  80: "Emoji Create", 81: "Emoji Update", 82: "Emoji Delete",
  90: "Integration Create", 91: "Integration Update", 92: "Integration Delete",
};

// ── Management command implementations (all return embeds) ─────────────────

async function cmdStatus(): Promise<object> {
  const uptime = Date.now() - botState.startTime;
  return {
    type: 4,
    data: {
      embeds: [{
        title: "🤖 Bot Status",
        color: 0x5865f2,
        fields: [
          { name: "Process Uptime", value: formatUptime(uptime), inline: true },
          {
            name: "Gateway",
            value: botState.gatewayConnected
              ? `✅ Online as \`${botState.gatewayTag}\``
              : "❌ Offline / Disconnected",
            inline: true,
          },
          {
            name: "Auto-Role Stats",
            value: `✅ ${botState.roleAssignments.success} assigned\n❌ ${botState.roleAssignments.failed} failed`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

async function cmdBotstats(): Promise<object> {
  const mem = process.memoryUsage();
  return {
    type: 4,
    data: {
      embeds: [{
        title: "📊 Bot Process Stats",
        color: 0x57f287,
        fields: [
          { name: "Node.js", value: process.version, inline: true },
          { name: "Platform", value: process.platform, inline: true },
          { name: "Process Uptime", value: formatUptime(process.uptime() * 1000), inline: true },
          { name: "RSS Memory", value: formatBytes(mem.rss), inline: true },
          { name: "Heap Used", value: formatBytes(mem.heapUsed), inline: true },
          { name: "Heap Total", value: formatBytes(mem.heapTotal), inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

async function cmdServerinfo(): Promise<object> {
  const guild = await dRest<any>("GET", `/guilds/${GUILD_ID}?with_counts=true`);
  const created = snowflakeToDate(guild.id);
  return {
    type: 4,
    data: {
      embeds: [{
        title: `🏠 ${guild.name}`,
        color: 0xfee75c,
        thumbnail: guild.icon
          ? { url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` }
          : undefined,
        fields: [
          { name: "Server ID", value: `\`${guild.id}\``, inline: true },
          { name: "Owner", value: `<@${guild.owner_id}>`, inline: true },
          { name: "Approx. Members", value: `${guild.approximate_member_count ?? "N/A"}`, inline: true },
          { name: "Approx. Online", value: `${guild.approximate_presence_count ?? "N/A"}`, inline: true },
          { name: "Boost Tier", value: `Tier ${guild.premium_tier} (${guild.premium_subscription_count ?? 0} boosts)`, inline: true },
          { name: "Verification Level", value: `${guild.verification_level}`, inline: true },
          { name: "Created", value: `<t:${Math.floor(created.getTime() / 1000)}:F>`, inline: false },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

async function cmdMembercount(): Promise<object> {
  const guild = await dRest<any>("GET", `/guilds/${GUILD_ID}?with_counts=true`);
  const total = guild.approximate_member_count ?? 0;
  const online = guild.approximate_presence_count ?? 0;
  return {
    type: 4,
    data: {
      embeds: [{
        title: `👥 Member Count — ${guild.name}`,
        color: 0xeb459e,
        fields: [
          { name: "Total Members", value: `**${total}**`, inline: true },
          { name: "~Online", value: `**${online}**`, inline: true },
          { name: "~Offline", value: `**${Math.max(0, total - online)}**`, inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

async function cmdRolelist(): Promise<object> {
  const roles = await dRest<any[]>("GET", `/guilds/${GUILD_ID}/roles`);
  const sorted = roles
    .filter((r) => r.name !== "@everyone")
    .sort((a, b) => b.position - a.position);
  const lines = sorted
    .slice(0, 30)
    .map((r) => {
      const color = r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "default";
      return `**${r.name}** \`${r.id}\` — pos ${r.position} | color ${color}`;
    })
    .join("\n");
  return {
    type: 4,
    data: {
      embeds: [{
        title: `🎭 Server Roles (${sorted.length} total)`,
        color: 0xed4245,
        description: lines.slice(0, 4096) || "No roles found.",
        footer: sorted.length > 30 ? { text: `Showing top 30 of ${sorted.length} roles` } : undefined,
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

async function cmdAutorole(): Promise<object> {
  const roleId = process.env.DISCORD_DEFAULT_ROLE_ID ?? "1507690539775033416";
  let roleStatus = "⚠️ Unverified";

  try {
    const roles = await dRest<any[]>("GET", `/guilds/${GUILD_ID}/roles`);
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      roleStatus = `✅ Found — **"${role.name}"** (pos ${role.position})`;
    } else {
      roleStatus = `❌ NOT FOUND — role ID \`${roleId}\` does not exist in this server`;
    }
  } catch (err: any) {
    roleStatus = `❌ Error checking role: ${err.message}`;
  }

  const recent = botState.recentLogs
    .filter((l) => l.msg.includes("GuildMemberAdd") || l.msg.includes("role") || l.msg.includes("FAILED") || l.msg.includes("SUCCESS"))
    .slice(-6)
    .map((l) => {
      const time = new Date(l.ts).toISOString().slice(11, 19);
      const icon = l.level === "ERROR" ? "🔴" : l.level === "WARN" ? "🟡" : "🟢";
      return `${icon} \`${time}\` ${l.msg.slice(0, 85)}`;
    })
    .join("\n") || "No auto-role events recorded yet.";

  return {
    type: 4,
    data: {
      embeds: [{
        title: "🎭 Auto-Role System Health",
        color: botState.roleAssignments.failed > 0 ? 0xed4245 : 0x57f287,
        fields: [
          { name: "Role ID", value: `\`${roleId}\``, inline: true },
          { name: "Guild ID", value: `\`${GUILD_ID}\``, inline: true },
          { name: "Gateway", value: botState.gatewayConnected ? "✅ Connected" : "❌ Disconnected", inline: true },
          { name: "Role Status", value: roleStatus, inline: false },
          { name: "Assignment Stats", value: `✅ ${botState.roleAssignments.success} success | ❌ ${botState.roleAssignments.failed} failed`, inline: false },
          { name: "Recent Events", value: recent, inline: false },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

async function cmdLogs(count: number): Promise<object> {
  const entries = botState.recentLogs.slice(-Math.min(count, 25));
  if (!entries.length) {
    return { type: 4, data: { content: "📋 No logs recorded yet.", flags: 64 } };
  }
  const lines = entries
    .map((l) => {
      const time = new Date(l.ts).toISOString().slice(11, 19);
      const icon = l.level === "ERROR" ? "🔴" : l.level === "WARN" ? "🟡" : "🟢";
      return `${icon} \`${time}\` ${l.msg.slice(0, 90)}`;
    })
    .join("\n");
  return {
    type: 4,
    data: {
      embeds: [{
        title: `📋 Recent Bot Logs (last ${entries.length})`,
        color: 0x5865f2,
        description: lines.slice(0, 4096),
        timestamp: new Date().toISOString(),
      }],
      flags: 64, // ephemeral — only visible to the invoker
    },
  };
}

async function cmdPermissions(body: any): Promise<object> {
  // app_permissions is the bot's computed permission bitfield for this channel
  const appPerms = BigInt(body.app_permissions ?? "0");
  const checks: Array<[string, bigint]> = [
    ["Administrator", 8n],
    ["Manage Roles", 0x10000000n],
    ["Manage Guild", 0x20n],
    ["Kick Members", 0x400n],
    ["Ban Members", 0x800n],
    ["View Audit Log", 0x80n],
    ["Manage Messages", 0x2000n],
    ["Manage Channels", 0x10n],
    ["Mention Everyone", 0x20000n],
    ["Manage Webhooks", 0x20000000n],
    ["Send Messages", 0x800n],
    ["Embed Links", 0x4000n],
  ];
  const lines = checks
    .map(([name, bit]) => `${(appPerms & bit) !== 0n ? "✅" : "❌"} ${name}`)
    .join("\n");
  return {
    type: 4,
    data: {
      embeds: [{
        title: "🔐 Bot Permissions (this channel)",
        color: 0xfee75c,
        description: lines,
        timestamp: new Date().toISOString(),
      }],
      flags: 64,
    },
  };
}

async function cmdAuditlog(body: any, count: number): Promise<object> {
  if (!canViewAudit(body.member)) {
    return {
      type: 4,
      data: { content: "❌ You need **View Audit Log** or **Administrator** permission to use this command.", flags: 64 },
    };
  }

  const limit = Math.min(Math.max(count, 1), 15);
  const data = await dRest<any>("GET", `/guilds/${GUILD_ID}/audit-logs?limit=${limit}`);

  if (!data.audit_log_entries?.length) {
    return { type: 4, data: { content: "📋 No audit log entries found.", flags: 64 } };
  }

  const lines = data.audit_log_entries.map((e: any) => {
    const action = AUDIT_ACTIONS[e.action_type] ?? `Action #${e.action_type}`;
    const user = data.users?.find((u: any) => u.id === e.user_id);
    const name = user?.username ?? "Unknown";
    // Snowflake → unix timestamp in seconds
    const ts = Math.floor((Number(BigInt(e.id) >> 22n) + 1420070400000) / 1000);
    const reason = e.reason ? ` — *${e.reason.slice(0, 40)}*` : "";
    return `**${action}** by \`${name}\` <t:${ts}:R>${reason}`;
  });

  return {
    type: 4,
    data: {
      embeds: [{
        title: `📋 Audit Log (last ${data.audit_log_entries.length})`,
        color: 0xed4245,
        description: lines.join("\n").slice(0, 4096),
        timestamp: new Date().toISOString(),
      }],
      flags: 64,
    },
  };
}

async function cmdUserinfo(body: any): Promise<object> {
  const opts: any[] = body.data?.options ?? [];
  const targetId: string = opts.find((o: any) => o.name === "user")?.value ?? body.member?.user?.id ?? "";
  const resolved = body.data?.resolved ?? {};
  const user = resolved.users?.[targetId] ?? body.member?.user;
  const mem = resolved.members?.[targetId] ?? (targetId === body.member?.user?.id ? body.member : null);

  if (!user) {
    return { type: 4, data: { content: "❌ Could not resolve user.", flags: 64 } };
  }

  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.id) % 5n)}.png`;

  const created = snowflakeToDate(user.id);
  const joined = mem?.joined_at ? new Date(mem.joined_at) : null;
  const roles: string[] = mem?.roles ?? [];
  const roleDisplay = roles.length
    ? roles.slice(0, 10).map((id: string) => `<@&${id}>`).join(" ") + (roles.length > 10 ? ` +${roles.length - 10} more` : "")
    : "None";

  return {
    type: 4,
    data: {
      embeds: [{
        title: `👤 ${user.global_name ?? user.username}`,
        color: 0x5865f2,
        thumbnail: { url: avatar },
        fields: [
          { name: "Username", value: `\`${user.username}\``, inline: true },
          { name: "User ID", value: `\`${user.id}\``, inline: true },
          { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
          { name: "Account Created", value: `<t:${Math.floor(created.getTime() / 1000)}:F>`, inline: false },
          ...(joined ? [{ name: "Joined Server", value: `<t:${Math.floor(joined.getTime() / 1000)}:F>`, inline: false }] : []),
          { name: `Roles (${roles.length})`, value: roleDisplay, inline: false },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

// ── Main interaction dispatcher ────────────────────────────────────────────
export async function handleInteraction(body: any): Promise<object> {
  const { type, channel_id, member, data } = body;

  const ALLOWED_CHANNEL = process.env.DISCORD_CHANNEL_ID ?? "";
  const ALLOWED_ROLES = (process.env.DISCORD_ROLE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log("Interaction:", { type, name: data?.name, channel_id, userId: member?.user?.id });

  // Type 1 — Discord PING verification handshake
  if (type === 1) return { type: 1 };

  // Type 2 — Application (slash) command
  if (type === 2) {
    // Channel restriction check
    if (ALLOWED_CHANNEL && channel_id !== ALLOWED_CHANNEL) {
      return {
        type: 4,
        data: { content: "❌ This bot can only be used in the designated channel.", flags: 64 },
      };
    }

    // Role restriction check
    const memberRoles: string[] = member?.roles ?? [];
    if (ALLOWED_ROLES.length && !ALLOWED_ROLES.some((id) => memberRoles.includes(id))) {
      return {
        type: 4,
        data: { content: "❌ You don't have permission to use this bot.", flags: 64 },
      };
    }

    const name: string = data?.name ?? "";
    const opts: any[] = data?.options ?? [];

    // ── Original fun commands ──────────────────────────────────────────
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
      const choices = ((getOpt(opts, "options") as string) ?? "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (choices.length < 2) {
        return { type: 4, data: { content: "❌ Provide at least 2 comma-separated options.", flags: 64 } };
      }
      return { type: 4, data: { content: `🎯 I choose: **${rand(choices)}**` } };
    }

    if (name === "joke") return { type: 4, data: { content: `😄 ${rand(JOKES)}` } };
    if (name === "fact") return { type: 4, data: { content: `💡 ${rand(FACTS)}` } };

    if (name === "reverse") {
      const text = (getOpt(opts, "text") as string) ?? "";
      return { type: 4, data: { content: `🔄 \`${text.split("").reverse().join("")}\`` } };
    }

    if (name === "countdown") {
      const from = (getOpt(opts, "from") as number) ?? 5;
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

    // ── Management commands ────────────────────────────────────────────
    if (name === "status") return cmdStatus();
    if (name === "botstats") return cmdBotstats();

    if (name === "serverinfo") {
      try { return await cmdServerinfo(); }
      catch (e: any) { return { type: 4, data: { content: `❌ Failed to fetch server info: ${e.message}`, flags: 64 } }; }
    }

    if (name === "membercount") {
      try { return await cmdMembercount(); }
      catch (e: any) { return { type: 4, data: { content: `❌ Failed to fetch member count: ${e.message}`, flags: 64 } }; }
    }

    if (name === "rolelist") {
      try { return await cmdRolelist(); }
      catch (e: any) { return { type: 4, data: { content: `❌ Failed to fetch roles: ${e.message}`, flags: 64 } }; }
    }

    if (name === "autorole") {
      try { return await cmdAutorole(); }
      catch (e: any) { return { type: 4, data: { content: `❌ Failed to check auto-role: ${e.message}`, flags: 64 } }; }
    }

    if (name === "logs") {
      if (!isAdmin(member)) {
        return { type: 4, data: { content: "❌ Administrator permission required.", flags: 64 } };
      }
      const count = (getOpt(opts, "count") as number) ?? 15;
      return cmdLogs(count);
    }

    if (name === "permissions") {
      return cmdPermissions(body);
    }

    if (name === "auditlog") {
      try {
        const count = (getOpt(opts, "count") as number) ?? 10;
        return await cmdAuditlog(body, count);
      } catch (e: any) {
        return { type: 4, data: { content: `❌ Failed to fetch audit log: ${e.message}`, flags: 64 } };
      }
    }

    if (name === "userinfo") {
      try { return await cmdUserinfo(body); }
      catch (e: any) { return { type: 4, data: { content: `❌ Failed to fetch user info: ${e.message}`, flags: 64 } }; }
    }
  }

  return { type: 1 };
}

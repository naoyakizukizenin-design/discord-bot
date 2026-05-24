import { Client, GatewayIntentBits, Events, type GuildMember } from "discord.js";
import { botState, addLog } from "./state.js";

// Read from env with hardcoded fallbacks so the bot works without extra config
const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "1502426379940008107";
const DEFAULT_ROLE_ID = process.env.DISCORD_DEFAULT_ROLE_ID ?? "1507690539775033416";

// ── Role assignment with retry + detailed logging ──────────────────────────
async function assignRoleWithRetry(
  member: GuildMember,
  roleId: string,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      addLog(
        "INFO",
        `Attempt ${attempt}/${maxRetries}: assigning role ${roleId} to ${member.user.tag} (${member.user.id})`,
      );

      // On retries, re-fetch the member so we have a fresh object
      let target = member;
      if (attempt > 1) {
        try {
          target = await member.guild.members.fetch(member.user.id);
          addLog("INFO", `Re-fetched member ${member.user.tag} for retry`);
        } catch {
          addLog("WARN", `Could not re-fetch member on retry ${attempt} — using cached object`);
        }
      }

      await target.roles.add(roleId, "Auto-role: assigned on server join");

      addLog(
        "INFO",
        `✅ SUCCESS: role ${roleId} assigned to ${member.user.tag} (${member.user.id})`,
      );
      botState.roleAssignments.success++;
      return;
    } catch (err: any) {
      const code = err?.code ?? "unknown";
      const status = err?.status ?? err?.httpStatus ?? "";
      const msg = err?.message ?? String(err);
      addLog(
        "ERROR",
        `❌ Attempt ${attempt}/${maxRetries} FAILED — user=${member.user.tag} role=${roleId} code=${code} status=${status} msg=${msg}`,
      );

      // 50013 = Missing Permissions, 10011 = Unknown Role, 10007 = Unknown Member
      if (code === 50013) addLog("ERROR", "PERMISSION DENIED — bot is missing Manage Roles or role hierarchy is wrong");
      if (code === 10011) addLog("ERROR", `Role ${roleId} does not exist in the server — check DEFAULT_ROLE_ID`);
      if (code === 10007) addLog("WARN", "Unknown Member — Discord may not have finished processing the join yet");

      if (attempt < maxRetries) {
        const delay = attempt * 1500;
        addLog("WARN", `Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  botState.roleAssignments.failed++;
  addLog(
    "ERROR",
    `🚫 ALL ${maxRetries} ATTEMPTS FAILED for ${member.user.tag} (${member.user.id}) — role NOT assigned`,
  );
}

// ── Gateway startup ────────────────────────────────────────────────────────
export function startGateway(token: string): void {
  // Startup config validation — fail loudly, not silently
  addLog("INFO", `Starting gateway — guild=${GUILD_ID} defaultRole=${DEFAULT_ROLE_ID}`);

  if (!token) {
    addLog("ERROR", "AUTO ROLE CONFIG ERROR: DISCORD_BOT_TOKEN is missing — gateway will not start");
    return;
  }
  if (!GUILD_ID) {
    addLog("ERROR", "AUTO ROLE CONFIG ERROR: DISCORD_GUILD_ID is missing — gateway will not start");
    return;
  }
  if (!DEFAULT_ROLE_ID) {
    addLog("ERROR", "AUTO ROLE CONFIG ERROR: DISCORD_DEFAULT_ROLE_ID is missing — gateway will not start");
    return;
  }

  // IMPORTANT: GatewayIntentBits.GuildMembers is a PRIVILEGED intent.
  // You MUST enable "Server Members Intent" in the Discord Developer Portal:
  //   discord.com/developers/applications → your app → Bot → Privileged Gateway Intents
  // If this is not enabled, GuildMemberAdd will NEVER fire — the bot connects but does nothing.
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  // ── Ready: run startup health checks ──────────────────────────────────
  client.once(Events.ClientReady, async (c) => {
    botState.gatewayConnected = true;
    botState.gatewayTag = c.user.tag;
    botState.gatewayUserId = c.user.id;
    addLog("INFO", `Gateway READY — connected as ${c.user.tag} (${c.user.id})`);

    // Validate guild access
    let guild = c.guilds.cache.get(GUILD_ID);
    if (!guild) {
      addLog("WARN", `Guild ${GUILD_ID} not in cache on ready — attempting to fetch`);
      try {
        guild = await c.guilds.fetch(GUILD_ID);
        addLog("INFO", `Guild fetched: ${guild.name} (${guild.id})`);
      } catch (err: any) {
        addLog(
          "ERROR",
          `Cannot access guild ${GUILD_ID}: ${err?.message} — bot may not be a member of this server`,
        );
        return;
      }
    } else {
      addLog("INFO", `Guild found: ${guild.name} (${guild.id})`);
    }

    // Validate the target role exists
    const role = guild.roles.cache.get(DEFAULT_ROLE_ID);
    if (!role) {
      addLog(
        "ERROR",
        `Target role ${DEFAULT_ROLE_ID} NOT FOUND in "${guild.name}" — verify DISCORD_DEFAULT_ROLE_ID is correct`,
      );
    } else {
      addLog("INFO", `Target role found: "${role.name}" (${role.id}) position=${role.position}`);

      // Check role hierarchy — bot must be above the role it assigns
      const botMember = guild.members.me;
      if (botMember) {
        const botHighest = botMember.roles.highest;
        addLog("INFO", `Bot's highest role: "${botHighest.name}" position=${botHighest.position}`);

        if (botHighest.position <= role.position) {
          addLog(
            "ERROR",
            `ROLE HIERARCHY ERROR: Bot role position (${botHighest.position}) is NOT above target role position (${role.position}). ` +
              `Move the bot's role above "${role.name}" in Server Settings → Roles.`,
          );
        } else {
          addLog("INFO", `Role hierarchy OK ✅ (bot pos ${botHighest.position} > role pos ${role.position})`);
        }

        // Check Manage Roles permission
        if (!botMember.permissions.has("ManageRoles")) {
          addLog(
            "ERROR",
            `PERMISSION ERROR: Bot is missing MANAGE ROLES permission in "${guild.name}" — auto-role will fail every time`,
          );
        } else {
          addLog("INFO", "ManageRoles permission OK ✅");
        }
      } else {
        addLog("WARN", "Could not find bot's own member object in guild for permission check");
      }
    }

    addLog("INFO", "Startup health checks complete — listening for GuildMemberAdd events");
  });

  // ── GuildMemberAdd: the core auto-role event ───────────────────────────
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    addLog(
      "INFO",
      `📥 GuildMemberAdd fired — user=${member.user.tag} (${member.user.id}) guild=${member.guild.id}`,
    );

    if (member.guild.id !== GUILD_ID) {
      addLog("WARN", `Ignoring join from unexpected guild ${member.guild.id} (expected ${GUILD_ID})`);
      return;
    }

    // Small delay — gives Discord time to fully register the member before we
    // attempt role assignment (prevents "Unknown Member" errors on fast joins)
    addLog("INFO", `Waiting 750ms before assigning role to ${member.user.tag}...`);
    await new Promise((r) => setTimeout(r, 750));

    await assignRoleWithRetry(member, DEFAULT_ROLE_ID);
  });

  // ── Client lifecycle events ────────────────────────────────────────────
  client.on(Events.Error, (err) => {
    addLog("ERROR", `Discord client error: ${err.message}`);
  });

  client.on(Events.Warn, (info) => {
    addLog("WARN", `Discord client warning: ${info}`);
  });

  client.on(Events.ShardDisconnect, (_event, shardId) => {
    botState.gatewayConnected = false;
    addLog("WARN", `Gateway disconnected (shard ${shardId}) — discord.js will auto-reconnect`);
  });

  client.on(Events.ShardReconnecting, (shardId) => {
    addLog("INFO", `Gateway reconnecting (shard ${shardId})...`);
  });

  client.on(Events.ShardResume, (shardId, replayedEvents) => {
    botState.gatewayConnected = true;
    addLog("INFO", `Gateway resumed (shard ${shardId}) — replayed ${replayedEvents} events ✅`);
  });

  client.login(token).catch((err: Error) => {
    botState.gatewayConnected = false;
    addLog("ERROR", `Gateway login FAILED: ${err.message}`);
  });
}

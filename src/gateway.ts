import { Client, GatewayIntentBits, Events, type GuildMember } from "discord.js";

const GUILD_ID = "1502426379940008107";
const DEFAULT_ROLE_ID = "1507690539775033416";

export function startGateway(token: string) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`Gateway connected as ${c.user.tag}`);
  });

  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    if (member.guild.id !== GUILD_ID) return;
    try {
      await member.roles.add(DEFAULT_ROLE_ID);
      console.log(`Assigned S0meR4andomM3mber role to ${member.user.tag}`);
    } catch (err) {
      console.error(`Failed to assign role to ${member.user.tag}:`, err);
    }
  });

  client.login(token).catch((err) => {
    console.error("Gateway login failed:", err);
  });
}

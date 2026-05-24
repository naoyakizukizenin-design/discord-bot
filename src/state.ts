export interface LogEntry {
  ts: number;
  level: "INFO" | "WARN" | "ERROR";
  msg: string;
}

export const botState = {
  startTime: Date.now(),
  gatewayConnected: false,
  gatewayTag: "",
  gatewayUserId: "",
  roleAssignments: { success: 0, failed: 0 },
  recentLogs: [] as LogEntry[],
};

export function addLog(level: "INFO" | "WARN" | "ERROR", msg: string): void {
  const entry: LogEntry = { ts: Date.now(), level, msg };
  botState.recentLogs.push(entry);
  if (botState.recentLogs.length > 200) botState.recentLogs.shift();
  const prefix = `[${new Date(entry.ts).toISOString()}] [${level}] [BOT]`;
  if (level === "ERROR") console.error(`${prefix} ${msg}`);
  else console.log(`${prefix} ${msg}`);
}

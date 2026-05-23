import express, { Router, type Request, type Response } from "express";
import { verifyDiscordRequest } from "../lib/discord-verify";
import { handleInteraction } from "../lib/discord-handler";
import { logger } from "../lib/logger";

const router = Router();

router.post(
  "/discord/interactions",
  express.raw({ type: "*/*" }),
  (req: Request, res: Response) => {
    const signature = req.headers["x-signature-ed25519"] as string;
    const timestamp = req.headers["x-signature-timestamp"] as string;
    const rawBody = req.body as Buffer;

    if (!signature || !timestamp || !Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      logger.warn("Missing or invalid signature headers / body");
      res.status(401).json({ error: "Missing signature headers" });
      return;
    }

    const rawBodyStr = rawBody.toString("utf-8");
    const publicKey = process.env.DISCORD_PUBLIC_KEY ?? "";

    const isValid = verifyDiscordRequest(signature, timestamp, rawBodyStr, publicKey);
    if (!isValid) {
      logger.warn("Invalid Discord request signature");
      res.status(401).json({ error: "Invalid request signature" });
      return;
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBodyStr);
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }

    logger.info({ body }, "Discord interaction body");

    const response = handleInteraction(body);
    res.json(response);
  },
);

export default router;

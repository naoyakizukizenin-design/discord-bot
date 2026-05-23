import { Router, type Request, type Response } from "express";
import { verifyDiscordRequest } from "../lib/discord-verify";
import { handleInteraction } from "../lib/discord-handler";

const router = Router();

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

router.post(
  "/discord/interactions",
  (req: Request, res: Response) => {
    const signature = req.headers["x-signature-ed25519"] as string;
    const timestamp = req.headers["x-signature-timestamp"] as string;
    const rawBody = (req as any).rawBody as string;

    if (!signature || !timestamp || !rawBody) {
      res.status(401).json({ error: "Missing signature headers" });
      return;
    }

    const isValid = verifyDiscordRequest(signature, timestamp, rawBody, PUBLIC_KEY);
    if (!isValid) {
      res.status(401).json({ error: "Invalid request signature" });
      return;
    }

    const response = handleInteraction(req.body);
    res.json(response);
  },
);

export default router;

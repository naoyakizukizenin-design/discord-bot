import { Router } from "express";
import nacl from "tweetnacl";
import { handleInteraction } from "./handler.js";

export const discordRouter = Router();

discordRouter.post(
  "/discord/interactions",
  (req, res) => {
    const signature = req.headers["x-signature-ed25519"] as string;
    const timestamp = req.headers["x-signature-timestamp"] as string;

    // Collect raw body
    let rawBody = "";
    req.on("data", (chunk: Buffer) => { rawBody += chunk.toString(); });
    req.on("end", () => {
      const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY ?? "";

      // Verify signature
      try {
        const isValid = nacl.sign.detached.verify(
          Buffer.from(timestamp + rawBody),
          Buffer.from(signature, "hex"),
          Buffer.from(PUBLIC_KEY, "hex"),
        );
        if (!isValid) {
          res.status(401).json({ error: "Invalid signature" });
          return;
        }
      } catch {
        res.status(401).json({ error: "Signature verification failed" });
        return;
      }

      let body: unknown;
      try {
        body = JSON.parse(rawBody);
      } catch {
        res.status(400).json({ error: "Invalid JSON" });
        return;
      }

      const response = handleInteraction(body);
      res.json(response);
    });
  }
);

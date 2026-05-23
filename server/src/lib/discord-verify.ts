import nacl from "tweetnacl";

export function verifyDiscordRequest(
  signature: string,
  timestamp: string,
  body: string,
  publicKey: string,
): boolean {
  try {
    const sig = Buffer.from(signature, "hex");
    const msg = Buffer.from(timestamp + body);
    const key = Buffer.from(publicKey, "hex");
    return nacl.sign.detached.verify(
      new Uint8Array(msg),
      new Uint8Array(sig),
      new Uint8Array(key),
    );
  } catch {
    return false;
  }
}

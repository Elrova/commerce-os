import {
  handleEbayChallenge,
  handleEbayDeletionNotification,
} from "@/lib/ebay/account-deletion";
import { SupabaseEbayDeletionStore } from "@/lib/ebay/account-deletion-store";

const MAX_NOTIFICATION_BYTES = 64 * 1024;
const BODY_TIMEOUT_MS = 3_000;

export async function GET(request: Request) {
  const challengeCode = new URL(request.url).searchParams.get("challenge_code");
  return handleEbayChallenge(challengeCode, {
    verificationToken: process.env.EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN,
    endpoint: process.env.EBAY_ACCOUNT_DELETION_ENDPOINT,
  });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_NOTIFICATION_BYTES) {
    return Response.json({ error: "payload-too-large" }, { status: 413 });
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let payload: unknown;
  try {
    payload = await Promise.race([
      request.json(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("request-timeout")), BODY_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  try {
    return await handleEbayDeletionNotification(payload, {
      store: new SupabaseEbayDeletionStore(),
      logger: { info: (message, context) => console.info(message, context) },
    });
  } catch {
    return Response.json({ error: "notification-processing-unavailable" }, { status: 503 });
  }
}

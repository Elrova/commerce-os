import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

export const EBAY_ACCOUNT_DELETION_TOPIC = "MARKETPLACE_ACCOUNT_DELETION" as const;

export const ebayAccountDeletionNotificationSchema = z.object({
  metadata: z.object({
    topic: z.string().min(1),
  }).passthrough(),
  notification: z.object({
    notificationId: z.string().min(1),
    data: z.object({
      userId: z.string().min(1),
      eiasToken: z.string().min(1).optional(),
      username: z.string().min(1).optional(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

export type EbayAccountDeletionNotification = z.infer<typeof ebayAccountDeletionNotificationSchema>;
export type EbayDeletionProcessingStatus = "acknowledged-not-linked";

export interface EbayDeletionIdempotencyStore {
  claim(notificationIdHash: string, topic: string): Promise<boolean>;
  complete(notificationIdHash: string, status: EbayDeletionProcessingStatus): Promise<void>;
}

export interface SafeDeletionLogger {
  info(message: string, context: { notificationId: string; topic: string; status: string }): void;
}

export function createChallengeResponse(challengeCode: string, verificationToken: string, endpoint: string) {
  return createHash("sha256")
    .update(challengeCode)
    .update(verificationToken)
    .update(endpoint)
    .digest("hex");
}

export function hashNotificationId(notificationId: string) {
  return createHash("sha256").update(notificationId).digest("hex");
}

export function maskNotificationId(notificationId: string) {
  if (notificationId.length <= 8) return "********";
  return `${notificationId.slice(0, 4)}…${notificationId.slice(-4)}`;
}

export function handleEbayChallenge(
  challengeCode: string | null,
  configuration: { verificationToken?: string; endpoint?: string },
) {
  if (!challengeCode) {
    return Response.json({ error: "challenge-code-required" }, { status: 400 });
  }
  if (!configuration.verificationToken || !configuration.endpoint) {
    return Response.json({ error: "account-deletion-not-configured" }, { status: 503 });
  }

  return Response.json({
    challengeResponse: createChallengeResponse(
      challengeCode,
      configuration.verificationToken,
      configuration.endpoint,
    ),
  });
}

export async function anonymizeOrDeleteLinkedEbayUserData(
  data: EbayAccountDeletionNotification["notification"]["data"],
): Promise<EbayDeletionProcessingStatus> {
  void data;
  // Aucun identifiant utilisateur eBay n'est encore relié aux tables ELROVA.
  // Cette fonction constitue le point d'extension du futur traitement irréversible.
  return "acknowledged-not-linked";
}

export async function handleEbayDeletionNotification(
  payload: unknown,
  dependencies: {
    store: EbayDeletionIdempotencyStore;
    logger?: SafeDeletionLogger;
    process?: typeof anonymizeOrDeleteLinkedEbayUserData;
  },
) {
  const parsed = ebayAccountDeletionNotificationSchema.safeParse(payload);
  if (!parsed.success || parsed.data.metadata.topic !== EBAY_ACCOUNT_DELETION_TOPIC) {
    return Response.json({ error: "invalid-notification" }, { status: 400 });
  }

  const notification = parsed.data;
  const notificationIdHash = hashNotificationId(notification.notification.notificationId);
  const safeLogContext = {
    notificationId: maskNotificationId(notification.notification.notificationId),
    topic: notification.metadata.topic,
  };
  const claimed = await dependencies.store.claim(notificationIdHash, notification.metadata.topic);

  if (!claimed) {
    dependencies.logger?.info("[ebay-account-deletion] notification", {
      ...safeLogContext,
      status: "duplicate",
    });
    return new Response(null, { status: 204 });
  }

  const status = await (dependencies.process ?? anonymizeOrDeleteLinkedEbayUserData)(
    notification.notification.data,
  );
  await dependencies.store.complete(notificationIdHash, status);
  dependencies.logger?.info("[ebay-account-deletion] notification", {
    ...safeLogContext,
    status,
  });

  return new Response(null, { status: 204 });
}

export function verifyEbayNotificationSignature(input: {
  signature: string | null;
  rawBody: string;
}): { verified: false; reason: "not-implemented" } {
  void input;
  // Point d'extension isolé. La vérification ECC via la clé publique eBay doit
  // être implémentée avant de traiter réellement des suppressions utilisateur.
  return { verified: false, reason: "not-implemented" };
}

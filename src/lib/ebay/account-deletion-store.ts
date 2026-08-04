import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  EbayDeletionIdempotencyStore,
  EbayDeletionProcessingStatus,
} from "./account-deletion";

const DATABASE_TIMEOUT_MS = 4_000;

async function withTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("ebay-deletion-store-timeout")), DATABASE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export class SupabaseEbayDeletionStore implements EbayDeletionIdempotencyStore {
  async claim(notificationIdHash: string, topic: string) {
    const supabase = await createClient();
    const { data, error } = await withTimeout(
      supabase.rpc("claim_ebay_account_deletion_notification", {
        p_notification_id_hash: notificationIdHash,
        p_topic: topic,
      }),
    );
    if (error) throw new Error("ebay-deletion-claim-failed");
    return data === true;
  }

  async complete(notificationIdHash: string, status: EbayDeletionProcessingStatus) {
    const supabase = await createClient();
    const { error } = await withTimeout(
      supabase.rpc("complete_ebay_account_deletion_notification", {
        p_notification_id_hash: notificationIdHash,
        p_status: status,
      }),
    );
    if (error) throw new Error("ebay-deletion-completion-failed");
  }
}

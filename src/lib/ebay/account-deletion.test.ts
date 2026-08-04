import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import {
  createChallengeResponse,
  handleEbayChallenge,
  handleEbayDeletionNotification,
  type EbayDeletionIdempotencyStore,
  type EbayDeletionProcessingStatus,
} from "./account-deletion";

const endpoint = "https://www.elrova.fr/api/ebay/account-deletion";
const verificationToken = "fixture_token_with_more_than_32_chars_123";
const validPayload = {
  metadata: { topic: "MARKETPLACE_ACCOUNT_DELETION" },
  notification: {
    notificationId: "12345678-abcd-efgh-ijkl-123456789012",
    data: {
      userId: "sensitive-user-id",
      username: "sensitive-username",
      eiasToken: "sensitive-eias-token",
    },
  },
};

class MemoryStore implements EbayDeletionIdempotencyStore {
  readonly claimed = new Set<string>();
  readonly completed = new Map<string, EbayDeletionProcessingStatus>();
  async claim(notificationIdHash: string) {
    if (this.claimed.has(notificationIdHash)) return false;
    this.claimed.add(notificationIdHash);
    return true;
  }
  async complete(notificationIdHash: string, status: EbayDeletionProcessingStatus) {
    this.completed.set(notificationIdHash, status);
  }
}

describe("eBay account deletion challenge", () => {
  it("returns a valid JSON challenge", async () => {
    const response = handleEbayChallenge("challenge-123", { endpoint, verificationToken });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.deepEqual(await response.json(), {
      challengeResponse: createChallengeResponse("challenge-123", verificationToken, endpoint),
    });
  });

  it("rejects a missing challenge code", () => {
    assert.equal(handleEbayChallenge(null, { endpoint, verificationToken }).status, 400);
  });

  it("rejects a missing verification token", () => {
    assert.equal(handleEbayChallenge("challenge", { endpoint }).status, 503);
  });

  it("rejects a missing endpoint", () => {
    assert.equal(handleEbayChallenge("challenge", { verificationToken }).status, 503);
  });

  it("hashes challenge, token and endpoint in the required order", () => {
    const expected = createHash("sha256")
      .update("challenge")
      .update(verificationToken)
      .update(endpoint)
      .digest("hex");
    assert.equal(createChallengeResponse("challenge", verificationToken, endpoint), expected);
    assert.notEqual(createChallengeResponse("challenge", verificationToken, endpoint), createHash("sha256").update(endpoint).update(verificationToken).update("challenge").digest("hex"));
  });
});

describe("eBay account deletion notification", () => {
  it("acknowledges a valid payload with 204", async () => {
    const response = await handleEbayDeletionNotification(validPayload, { store: new MemoryStore() });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
  });

  it("rejects an unexpected topic", async () => {
    const response = await handleEbayDeletionNotification(
      { ...validPayload, metadata: { topic: "OTHER_TOPIC" } },
      { store: new MemoryStore() },
    );
    assert.equal(response.status, 400);
  });

  it("does not process a duplicate notification twice", async () => {
    const store = new MemoryStore();
    let processingCount = 0;
    const process = async (): Promise<EbayDeletionProcessingStatus> => {
      processingCount += 1;
      return "acknowledged-not-linked";
    };
    assert.equal((await handleEbayDeletionNotification(validPayload, { store, process })).status, 204);
    assert.equal((await handleEbayDeletionNotification(validPayload, { store, process })).status, 204);
    assert.equal(processingCount, 1);
  });

  it("never includes personal data in structured logs", async () => {
    const captured: unknown[] = [];
    await handleEbayDeletionNotification(validPayload, {
      store: new MemoryStore(),
      logger: { info: (message, context) => captured.push(message, context) },
    });
    const serialized = JSON.stringify(captured);
    assert.doesNotMatch(serialized, /sensitive-user-id|sensitive-username|sensitive-eias-token/);
    assert.doesNotMatch(serialized, /12345678-abcd-efgh-ijkl-123456789012/);
    assert.match(serialized, /1234…9012/);
  });
});

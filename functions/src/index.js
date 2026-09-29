const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { randomUUID } = require("node:crypto");

initializeApp();
const githubPublishToken = defineSecret("GITHUB_PUBLISH_TOKEN");
const ownerUid = defineString("OWNER_UID");
const allowedRepository = "Hyeur/hyeur.github.io";

exports.requestPublish = onCall({ region: "asia-southeast1", secrets: [githubPublishToken] }, async (request) => {
  if (!request.auth || request.auth.uid !== ownerUid.value() || request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Owner access is required.");
  }

  const { entryId, action } = request.data || {};
  if (typeof entryId !== "string" || !/^[A-Za-z0-9_-]{1,150}$/.test(entryId) || !["publish", "unpublish"].includes(action)) {
    throw new HttpsError("invalid-argument", "Invalid publish request.");
  }

  const db = getFirestore();
  const ref = db.collection("entries").doc(entryId);
  const lockRef = db.collection("_system").doc("publish-lock");
  const requestId = randomUUID();
  const reservation = await db.runTransaction(async (transaction) => {
    const [snapshot, lockSnapshot] = await Promise.all([transaction.get(ref), transaction.get(lockRef)]);
    if (!snapshot.exists) throw new HttpsError("not-found", "Entry not found.");
    const entry = snapshot.data();
    if (!Number.isInteger(entry.revision) || entry.revision < 1) {
      throw new HttpsError("failed-precondition", "Save a valid content revision before publishing.");
    }
    const revision = entry.revision;
    const lock = lockSnapshot.exists ? lockSnapshot.data() : null;
    const leaseActive = lock?.status === "queued" && lock.expiresAt?.toMillis?.() > Date.now();
    if (leaseActive) {
      if (lock.entryId === entryId && lock.revision === revision && lock.action === action && lock.requestId === entry.publishRequest?.requestId) {
        return { queued: false, requestId: lock.requestId };
      }
      throw new HttpsError("failed-precondition", "Another site build is already running. Try again when it finishes.");
    }
    const previousRequest = entry.publishRequest;
    const targetStatus = action === "publish" ? "published" : "draft";
    if (previousRequest?.status === "succeeded" && previousRequest.action === action && previousRequest.revision === revision && previousRequest.deployedRevision === revision && entry.status === targetStatus) {
      return { queued: false, succeeded: true, requestId: previousRequest.requestId };
    }
    const expiresAt = Timestamp.fromMillis(Date.now() + 40 * 60 * 1000);
    transaction.update(ref, {
      status: targetStatus,
      updatedAt: FieldValue.serverTimestamp(),
      publishRequest: { status: "queued", action, revision, requestId, requestedAt: FieldValue.serverTimestamp() },
    });
    transaction.set(lockRef, { status: "queued", entryId, action, revision, requestId, expiresAt });
    return { queued: true, requestId };
  });
  if (!reservation.queued) return { status: reservation.succeeded ? "succeeded" : "queued", duplicate: true, requestId: reservation.requestId };

  try {
    const response = await fetch(`https://api.github.com/repos/${allowedRepository}/dispatches`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubPublishToken.value()}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "publish-content",
        client_payload: { entryId, action, revision, requestId: reservation.requestId, requestedBy: request.auth.uid },
      }),
    });
    if (!response.ok) throw new Error(`GitHub dispatch returned ${response.status}`);
    return { status: "queued" };
  } catch (error) {
    await db.runTransaction(async (transaction) => {
      const [snapshot, lockSnapshot] = await Promise.all([transaction.get(ref), transaction.get(lockRef)]);
      if (snapshot.exists && snapshot.data().publishRequest?.requestId === reservation.requestId) {
        transaction.update(ref, { "publishRequest.status": "failed", "publishRequest.error": String(error.message).slice(0, 300) });
      }
      if (lockSnapshot.exists && lockSnapshot.data().requestId === reservation.requestId) transaction.delete(lockRef);
    });
    throw new HttpsError("unavailable", "Could not queue the site build.");
  }
});

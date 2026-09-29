import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import publishState from "../functions/src/publish-state.cjs";

const [entryId, jobResult, revisionValue, requestId, runUrl = ""] = process.argv.slice(2);
const revision = Number(revisionValue);
if (!entryId || !/^[A-Za-z0-9_-]{1,150}$/.test(entryId) || !["success", "failure", "cancelled"].includes(jobResult) || !Number.isInteger(revision) || revision < 1 || !/^[0-9a-f-]{36}$/i.test(requestId || "")) {
  throw new Error("Usage: node scripts/update-publish-status.mjs <entry-id> <success|failure|cancelled> <revision> <request-id> [run-url]");
}
const projectId = process.env.FIREBASE_PROJECT_ID || "sounddesignportfolio";
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const ref = db.collection("entries").doc(entryId);
const lockRef = db.collection("_system").doc("publish-lock");
const status = jobResult === "success" ? "succeeded" : "failed";
await db.runTransaction(async (transaction) => {
  const [snapshot, lockSnapshot] = await Promise.all([transaction.get(ref), transaction.get(lockRef)]);
  const entry = snapshot.exists ? snapshot.data() : null;
  const lock = lockSnapshot.exists ? lockSnapshot.data() : null;
  if (entry?.publishRequest?.requestId === requestId && entry.publishRequest.revision === revision) {
    const update = {
      "publishRequest.status": status,
      "publishRequest.completedAt": FieldValue.serverTimestamp(),
      "publishRequest.runUrl": runUrl,
    };
    if (status === "succeeded") {
      update["publishRequest.deployedRevision"] = revision;
      if (entry.status === "published") update.publishedContent = publishState.publishedSnapshot(entry);
    }
    const restoreStatus = publishState.restoreStatusAfterFailure(entry.publishRequest, status);
    if (restoreStatus) update.status = restoreStatus;
    transaction.update(ref, update);
  }
  if (lock?.requestId === requestId) transaction.delete(lockRef);
});
console.log(`Recorded ${status} for publish request ${requestId}.`);

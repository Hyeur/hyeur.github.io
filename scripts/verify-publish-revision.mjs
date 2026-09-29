import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const [entryId, revisionValue, action, requestId] = process.argv.slice(2);
const revision = Number(revisionValue);
if (!entryId || !/^[A-Za-z0-9_-]{1,150}$/.test(entryId) || !Number.isInteger(revision) || revision < 1 || !["publish", "unpublish"].includes(action) || !/^[0-9a-f-]{36}$/i.test(requestId || "")) {
  throw new Error("Usage: node scripts/verify-publish-revision.mjs <entry-id> <revision> <publish|unpublish> <request-id>");
}
initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || "sounddesignportfolio" });
const snapshot = await getFirestore().collection("entries").doc(entryId).get();
if (!snapshot.exists) throw new Error(`Entry ${entryId} no longer exists.`);
const entry = snapshot.data();
const expectedStatus = action === "publish" ? "published" : "draft";
if (entry.revision !== revision || entry.publishRequest?.revision !== revision || entry.publishRequest?.action !== action || entry.publishRequest?.requestId !== requestId || entry.status !== expectedStatus) {
  throw new Error("The content changed during this build. Deployment cancelled; request a new publish for the latest revision.");
}
console.log(`Verified ${entryId} revision ${revision} for ${action}.`);

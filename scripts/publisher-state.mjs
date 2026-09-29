import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { releaseChanged } from "./release-manifest.mjs";

const STATE_COLLECTION = "_publisherState";
const STATE_DOCUMENT = "current";

export async function readPublisherState(db) {
  const snapshot = await db.collection(STATE_COLLECTION).doc(STATE_DOCUMENT).get();
  if (!snapshot.exists) return { fingerprint: null, publishedEntryRevisions: {} };
  const data = snapshot.data() || {};
  return {
    fingerprint: typeof data.fingerprint === "string" ? data.fingerprint : null,
    publishedEntryRevisions: data.publishedEntryRevisions && typeof data.publishedEntryRevisions === "object"
      ? data.publishedEntryRevisions
      : {},
  };
}

export async function recordSuccessfulDeployment(db, manifest) {
  await db.collection(STATE_COLLECTION).doc(STATE_DOCUMENT).set({
    fingerprint: manifest.fingerprint,
    publishedEntryRevisions: manifest.publishedEntryRevisions,
  });
}

async function runCommand(action) {
  const manifestPath = process.env.PUBLISH_MANIFEST_PATH;
  if (!manifestPath) throw new Error("PUBLISH_MANIFEST_PATH is required.");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (typeof manifest.fingerprint !== "string" || !manifest.publishedEntryRevisions || typeof manifest.publishedEntryRevisions !== "object") {
    throw new Error("The release manifest is malformed.");
  }
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "sounddesignportfolio";
  initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore();

  if (action === "check") {
    const state = await readPublisherState(db);
    const changed = releaseChanged(manifest, state.fingerprint);
    console.log(changed ? "Release changed; Hosting deploy is required." : "Release unchanged; skipping Hosting deploy.");
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, "utf8");
    return;
  }
  if (action === "record") {
    await recordSuccessfulDeployment(db, manifest);
    console.log("Recorded successful Hosting deployment.");
    return;
  }
  throw new Error("Usage: node scripts/publisher-state.mjs <check|record>");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await runCommand(process.argv[2]);
}

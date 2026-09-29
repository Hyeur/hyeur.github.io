import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const projectId = "demo-portfolio-rules";
let env;
const entry = (status = "draft") => ({ type: "portfolio", status, slug: "sample", revision: 1, createdAt: new Date(), updatedAt: new Date(), year: 2024, tags: [], en: { title: "English", body: "Body" }, vi: { title: "Vietnamese", body: "Body" } });

before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") } });
});
after(async () => env?.cleanup());

test("only the custom-claim owner can read entries or create drafts", async () => {
  const owner = env.authenticatedContext("owner", { admin: true }).firestore();
  const other = env.authenticatedContext("other").firestore();
  const signedOut = env.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(owner, "entries/new"), entry()));
  await assertFails(getDoc(doc(other, "entries/new")));
  await assertFails(getDoc(doc(signedOut, "entries/new")));
  await assertFails(setDoc(doc(other, "entries/other"), entry()));
  await assertFails(setDoc(doc(signedOut, "entries/signed-out"), entry()));
  await assertFails(setDoc(doc(owner, "entries/published-create"), entry("published")));
  await assertFails(updateDoc(doc(other, "entries/new"), { status: "published" }));
  await assertFails(updateDoc(doc(signedOut, "entries/new"), { status: "published" }));
});

test("owner can publish and unpublish entries by changing status", async () => {
  const owner = env.authenticatedContext("owner", { admin: true }).firestore();
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "entries/status"), entry()));
  await assertSucceeds(updateDoc(doc(owner, "entries/status"), { status: "published", revision: 2, updatedAt: new Date() }));
  await assertSucceeds(updateDoc(doc(owner, "entries/status"), { status: "draft", revision: 3, updatedAt: new Date() }));
});

test("browser clients cannot access private publisher state", async () => {
  const owner = env.authenticatedContext("owner", { admin: true }).firestore();
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "_publisherState/current"), { fingerprint: "old", publishedEntryRevisions: {} }));
  await assertFails(getDoc(doc(owner, "_publisherState/current")));
  await assertFails(setDoc(doc(owner, "_publisherState/current"), { fingerprint: "forged", publishedEntryRevisions: {} }));
});

test("deleting a draft waits until it is absent from the last deployed map", async () => {
  const owner = env.authenticatedContext("owner", { admin: true }).firestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "entries/live"), entry());
    await setDoc(doc(ctx.firestore(), "_publisherState/current"), { fingerprint: "old", publishedEntryRevisions: { live: 1 } });
  });
  await assertFails(deleteDoc(doc(owner, "entries/live")));
  await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), "_publisherState/current"), { publishedEntryRevisions: {} }));
  await assertSucceeds(deleteDoc(doc(owner, "entries/live")));
});

test("deletion is blocked during an active publisher lease even before the first deployment", async () => {
  const owner = env.authenticatedContext("owner", { admin: true }).firestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "entries/first-publish"), entry());
    await setDoc(doc(ctx.firestore(), "_publisherState/inFlight"), { expiresAt: new Date(Date.now() + 60_000) });
  });
  await assertFails(deleteDoc(doc(owner, "entries/first-publish")));
  await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), "_publisherState/inFlight"), { expiresAt: new Date(Date.now() - 60_000) }));
  await assertSucceeds(deleteDoc(doc(owner, "entries/first-publish")));
});

import test from "node:test";
import assert from "node:assert/strict";
import { beginPublisherRun, clearPublisherRun, readPublisherState, recordSuccessfulDeployment } from "./publisher-state.mjs";
import { releaseChanged } from "./release-manifest.mjs";

function fakeDb(initial) {
  const docs = new Map(initial === undefined ? [] : [["current", structuredClone(initial)]]);
  return {
    collection: (name) => {
      assert.equal(name, "_publisherState");
      return { doc: (id) => {
        assert.ok(["current", "inFlight"].includes(id));
        return {
          get: async () => ({ exists: docs.has(id), data: () => docs.get(id) }),
          set: async (value) => { docs.set(id, structuredClone(value)); },
          delete: async () => { docs.delete(id); },
        };
      } };
    },
    state: { docs, get value() { return docs.get("current"); } },
  };
}

test("missing publisher state reads as an empty deployment", async () => {
  assert.deepEqual(await readPublisherState(fakeDb(undefined)), { fingerprint: null, publishedEntryRevisions: {} });
});

test("state fingerprint determines whether the release changed", async () => {
  const manifest = { fingerprint: "new", publishedEntryRevisions: { a: 3 } };
  const db = fakeDb({ fingerprint: "old", publishedEntryRevisions: { a: 2 } });
  const state = await readPublisherState(db);
  assert.equal(releaseChanged(manifest, state.fingerprint), true);
  assert.equal(releaseChanged({ ...manifest }, "new"), false);
});

test("successful deployment replaces the prior fingerprint and deployed entry map", async () => {
  const db = fakeDb({ fingerprint: "old", publishedEntryRevisions: { removed: 1 } });
  const manifest = { fingerprint: "new", publishedEntryRevisions: { current: 4 } };
  await recordSuccessfulDeployment(db, manifest);
  assert.deepEqual(db.state.value, manifest);
});

test("publisher run creates an expiring deletion lease and can clear it", async () => {
  const db = fakeDb(undefined);
  const now = new Date("2026-09-29T00:00:00.000Z");
  await beginPublisherRun(db, now);
  const lease = db.state.docs.get("inFlight");
  assert.equal(lease.startedAt.valueOf(), now.valueOf());
  assert.equal(lease.expiresAt.valueOf() - now.valueOf(), 45 * 60 * 1000);
  await clearPublisherRun(db);
  assert.equal(db.state.docs.has("inFlight"), false);
});

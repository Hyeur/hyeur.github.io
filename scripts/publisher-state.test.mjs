import test from "node:test";
import assert from "node:assert/strict";
import { readPublisherState, recordSuccessfulDeployment } from "./publisher-state.mjs";
import { releaseChanged } from "./release-manifest.mjs";

function fakeDb(initial) {
  const state = { value: initial };
  const ref = { get: async () => ({ exists: state.value !== undefined, data: () => state.value }), set: async (value) => { state.value = structuredClone(value); } };
  return { collection: (name) => { assert.equal(name, "_publisherState"); return { doc: (id) => { assert.equal(id, "current"); return ref; } }; }, state };
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

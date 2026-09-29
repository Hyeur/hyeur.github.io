import test from "node:test";
import assert from "node:assert/strict";
import { createReleaseManifest, releaseChanged, selectPublishedEntries } from "./release-manifest.mjs";

test("selects only entries with exactly published status", () => {
  const entries = [{ id: "live", status: "published" }, { id: "draft", status: "draft" }, { id: "legacy" }, { id: "bad", status: "Published" }];
  assert.deepEqual(selectPublishedEntries(entries), [entries[0]]);
});

test("an empty snapshot produces an empty deployed map", () => {
  const manifest = createReleaseManifest({ commitSha: "abc", entries: [], files: [] });
  assert.deepEqual(manifest.publishedEntryRevisions, {});
  assert.equal(releaseChanged(manifest, undefined), true);
});

test("fingerprints are deterministic across file ordering and normalize paths", () => {
  const input = { commitSha: "abc", entries: [{ id: "z", status: "published", revision: 3 }, { id: "a", status: "draft", revision: 8 }], files: [{ path: "b.md", content: "B" }, { path: ".\\a.md", content: "A" }] };
  const reverse = { ...input, files: [...input.files].reverse() };
  assert.deepEqual(createReleaseManifest(input), createReleaseManifest(reverse));
  assert.deepEqual(createReleaseManifest(input).publishedEntryRevisions, { z: 3 });
});

test("content and source commit changes produce a changed release", () => {
  const base = { commitSha: "abc", entries: [{ id: "x", status: "published", revision: 1 }], files: [{ path: "a.md", content: "one" }] };
  const manifest = createReleaseManifest(base);
  assert.equal(releaseChanged(manifest, manifest.fingerprint), false);
  assert.equal(releaseChanged(createReleaseManifest({ ...base, files: [{ path: "a.md", content: "two" }] }), manifest.fingerprint), true);
  assert.equal(releaseChanged(createReleaseManifest({ ...base, commitSha: "def" }), manifest.fingerprint), true);
});

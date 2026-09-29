const test = require("node:test");
const assert = require("node:assert/strict");
const { entryForExport, publishedSnapshot, restoreStatusAfterFailure } = require("./publish-state.cjs");

test("failed publish restores the prior draft state", () => {
  assert.equal(restoreStatusAfterFailure({ action: "publish", previousStatus: "draft" }), "draft");
});

test("failed unpublish restores the prior published state", () => {
  assert.equal(restoreStatusAfterFailure({ action: "unpublish", previousStatus: "published" }), "published");
});

test("successful requests do not restore prior state", () => {
  assert.equal(restoreStatusAfterFailure({ status: "queued", previousStatus: "draft" }, "succeeded"), undefined);
});

test("later builds use the last deployed snapshot after a failed edit publish", () => {
  const entry = { status: "published", revision: 2, title: "Edited", publishedContent: { status: "published", revision: 1, title: "Live" }, publishRequest: { status: "failed", action: "publish" } };
  assert.equal(entryForExport(entry).title, "Live");
});

test("the queued publish build uses the requested revision", () => {
  const entry = { status: "published", revision: 2, title: "Edited", publishedContent: { status: "published", revision: 1, title: "Live" }, publishRequest: { status: "queued", action: "publish", revision: 2, requestId: "request-2" } };
  assert.equal(entryForExport(entry, "request-2").title, "Edited");
});

test("another build cannot export a different queued publish revision", () => {
  const entry = { status: "published", revision: 2, title: "Edited", publishRequest: { status: "queued", action: "publish", revision: 2, requestId: "request-2" } };
  assert.equal(entryForExport(entry, "request-3"), undefined);
});

test("drafts remain excluded even if they have an older deployed snapshot", () => {
  const entry = { status: "draft", publishedContent: { status: "published", title: "Live" } };
  assert.equal(entryForExport(entry), undefined);
});

test("published snapshots omit request metadata", () => {
  const snapshot = publishedSnapshot({ status: "published", revision: 2, title: "Live", publishRequest: { status: "queued" }, publishedContent: { title: "Old" } });
  assert.deepEqual(snapshot, { status: "published", revision: 2, title: "Live" });
});

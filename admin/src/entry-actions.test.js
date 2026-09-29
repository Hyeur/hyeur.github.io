import test from "node:test";
import assert from "node:assert/strict";
import { canDeleteEntry } from "./entry-actions.js";

test("published entries must be unpublished before deletion", () => {
  assert.equal(canDeleteEntry({ status: "published" }), false);
});

test("queued entries cannot be deleted before the build completes", () => {
  assert.equal(canDeleteEntry({ status: "draft", publishRequest: { status: "queued" } }), false);
});

test("draft entries can be deleted after publish work finishes", () => {
  assert.equal(canDeleteEntry({ status: "draft", publishRequest: { status: "succeeded" } }), true);
});

test("a failed unpublish must be retried before deleting the still-public entry", () => {
  assert.equal(canDeleteEntry({ status: "draft", publishRequest: { status: "failed", action: "unpublish" } }), false);
});

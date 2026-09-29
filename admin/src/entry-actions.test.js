import test from "node:test";
import assert from "node:assert/strict";
import { canDeleteEntry, deleteHelpText } from "./entry-actions.js";

test("published entries must be unpublished before deletion", () => {
  assert.equal(canDeleteEntry({ status: "published" }), false);
  assert.match(deleteHelpText({ status: "published" }), /Unpublish/);
});

test("draft entries can be deleted after the publisher sync removes them", () => {
  assert.equal(canDeleteEntry({ status: "draft" }), true);
  assert.match(deleteHelpText({ status: "draft" }), /GitHub Actions sync/);
});

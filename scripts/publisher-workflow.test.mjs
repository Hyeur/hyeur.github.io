import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/publish-content.yml", import.meta.url), "utf8");

test("production publishing only checks out and deploys main", () => {
  assert.match(workflow, /^\s{4}if: github\.ref == ['"]refs\/heads\/main['"]$/m);
});

test("checkout includes Blowfish and the build fails if its layout is missing", () => {
  assert.match(workflow, /uses: actions\/checkout@v4\s+with:\s+submodules: recursive/);
  assert.match(workflow, /test -f themes\/blowfish\/layouts\/_default\/baseof\.html/);
});

test("the deletion lease wraps export, build, deploy, and successful state recording", () => {
  const steps = [
    "name: Acquire publisher deletion lock",
    "name: Export published Firestore entries and release manifest",
    "name: Build Hugo site",
    "name: Build custom editor",
    "name: Compare release with last successful deployment",
    "name: Deploy Firebase Hosting",
    "name: Record successful deployment state",
    "name: Release publisher deletion lock",
  ].map((name) => workflow.indexOf(name));
  assert.ok(steps.every((index) => index >= 0), "every coordination step must exist");
  assert.deepEqual(steps, [...steps].sort((a, b) => a - b));
  assert.match(workflow, /if: always\(\) && steps\.lock\.outcome == 'success'/);
});

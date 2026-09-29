# GitHub Scheduled Publishing Without Cloud Functions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Firebase Functions publish bridge with owner-only Firestore status changes and a GitHub Actions publisher that needs no Cloud Functions billing plan.

**Architecture:** The owner publishes by changing an entry's Firestore status in the editor. GitHub Actions runs on pushes to `main`, every ten minutes at offset minutes, or manually; it exports published entries and deploys Hugo plus the editor to Firebase Hosting. After a successful deploy, the workflow writes a private publisher-state document containing the release fingerprint and deployed entry revisions, which Firestore rules use to prevent deleting content until it has been removed from the live site.

**Tech Stack:** Hugo 0.166.x, Blowfish, React/TypeScript, Firebase Authentication, Cloud Firestore, Firebase Admin SDK, GitHub Actions, Firebase Hosting, Node.js 22.

**Spec:** `docs/superpowers/specs/2026-09-29-github-scheduled-publishing-design.md`

## Global Constraints

- Only the configured owner with the `admin: true` custom claim may read or mutate editor records.
- Firestore remains the editor source of truth; only records with `status = published` enter the public Hugo build.
- The public site remains static and does not read Firestore at runtime.
- Firebase Hosting serves Hugo's generated `public/` directory, with the `/admin/**` rewrite only.
- Admin and publishing credentials stay server-side and out of Git and browser bundles.
- Use only Hieu's approved public copy and media; add no unapproved client, employer, or project details.
- Preserve English and Vietnamese portfolio content.
- Embedded media remains limited to validated YouTube and SoundCloud templates without autoplay.
- Do not overwrite the user's existing modified `public/` HTML or `config/_default/params.toml` during local verification.

## Review Focus

- **Draft leakage:** draft or malformed-status entries never enter generated output; test the exporter with mixed statuses.
- **Unpublish/delete race:** Firestore rejects deletion while an entry is still in the last successful deployment manifest; test this with the Firestore Emulator.
- **Unauthorized publication:** signed-out and non-owner clients cannot change status or read/write publisher state; test these rule cases in the emulator.
- **Failed deployment bookkeeping:** a failed build or Hosting deploy leaves the previous fingerprint and deployed-entry map intact; test publisher-state helpers and verify workflow ordering.
- **Repeated unchanged schedules:** an unchanged commit/content fingerprint skips Hosting deploy; test both changed and unchanged manifest results.

---

### Task 1: Export only published records and build a release manifest

**Files:**
- Create: `scripts/release-manifest.mjs`
- Create: `scripts/release-manifest.test.mjs`
- Modify: `scripts/export-firestore-content.mjs`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- `selectPublishedEntries(entries)` returns only validated entries whose status is exactly `published`.
- `createReleaseManifest({ commitSha, entries, files })` returns `{ fingerprint, publishedEntryRevisions }`; `files` is an array of `{ path, content }`, sorted by normalized relative path before hashing.
- `releaseChanged(manifest, previousFingerprint)` returns `true` only when the fingerprint differs.
- The exporter writes the manifest to `PUBLISH_MANIFEST_PATH`, defaulting to ignored `.publish-manifest.json` for local use.

- [x] **Step 1: Write failing tests** for draft exclusion, empty and mixed records, deterministic ordering, content changes, commit-SHA changes, and deployed entry ID/revision values.
- [x] **Step 2: Run `node --test scripts/release-manifest.test.mjs`** and confirm the tests fail because the manifest API is missing.
- [x] **Step 3: Implement the manifest module** using SHA-256 over the commit SHA and sorted path/content pairs; record only published entry IDs and revisions.
- [x] **Step 4: Update the exporter** to use the published-status filter, ignore legacy `publishRequest`/`publishedContent` fields, and write the manifest after complete validation and page generation.
- [x] **Step 5: Add `.publish-manifest.json` to `.gitignore`; run `node --test scripts/release-manifest.test.mjs` and `npm run export:content`.** Expected: tests pass, drafts are absent, and the exporter reports the published-entry count without changing `public/`.
- [ ] **Step 6: Commit** as `refactor: export published content without function state`.

### Task 2: Allow owner publication and guard deletion with deployed state

**Files:**
- Create: `scripts/firestore-rules.test.mjs`
- Modify: `firebase.json`
- Modify: `package.json`, `package-lock.json`
- Modify: `firestore.rules`
- Modify: `admin/src/content.ts`
- Modify: `admin/src/firebase.ts`
- Modify: `admin/src/main.tsx`
- Modify: `admin/src/entry-actions.js`, `admin/src/entry-actions.test.js`

**Interfaces:**
- `setEntryStatus(id, status)` writes `status`, increments `revision`, and updates `updatedAt` in one Firestore update.
- Publisher state is `_publisherState/current`, with `fingerprint` and `publishedEntryRevisions` fields. The browser has no direct access to this document.
- `isInLastDeployment(entryId)` in Firestore Rules checks the publisher-state map using `exists()`/`get()`; deletion is allowed only for owner-owned draft entries absent from the last deployed map.

- [ ] **Step 1: Add emulator tests** for signed-out, non-owner, and owner reads/writes; owner draft creation; draft-to-published and published-to-draft transitions; publisher-state denial; and delete denial until the deployed map no longer contains the entry.
- [ ] **Step 2: Run the rules tests** against the Firestore Emulator and confirm they fail against the current rules.
- [ ] **Step 3: Update Firestore Rules** to allow only owner status changes, deny all browser publisher-state access, preserve legacy server-owned fields if present, and reject deletion while the last successful deployment still includes the entry.
- [ ] **Step 4: Replace callable publication in the editor** with direct `setEntryStatus` updates; remove Firebase Functions SDK initialization, queued-request locks, retry controls, and callback status UI. Show the scheduled-sync explanation and a link to GitHub Actions.
- [ ] **Step 5: Update deletion UX** to explain that a recently unpublished entry can be deleted after a successful sync; preserve Firestore's deployed-map rule as the authority when a user tries early.
- [ ] **Step 6: Run emulator rule tests and `npm --prefix admin test`.** Expected: unauthorized requests and premature deletion are denied; the owner can publish, unpublish, and edit records; admin tests pass.
- [ ] **Step 7: Commit** as `feat: publish entries through owner firestore status`.

### Task 3: Add the scheduled, manual, and source-push publisher

**Files:**
- Create: `scripts/publisher-state.mjs`
- Create: `scripts/publisher-state.test.mjs`
- Modify: `.github/workflows/publish-content.yml`
- Modify: `scripts/export-firestore-content.mjs`
- Modify: `package.json`

**Interfaces:**
- `readPublisherState(db)` reads `_publisherState/current` and returns its last successful fingerprint and deployed entry map, or an empty state if absent.
- `recordSuccessfulDeployment(db, manifest)` replaces the fingerprint and deployed entry map only after Hosting deploy succeeds.
- GitHub Actions sets `PUBLISH_MANIFEST_PATH` under `$RUNNER_TEMP`; comparison and record steps consume the same manifest.

- [ ] **Step 1: Write failing state-helper tests** for missing state, equal/different fingerprints, and correct deployed-map replacement.
- [ ] **Step 2: Run `node --test scripts/publisher-state.test.mjs`** and confirm expected failures before the helper exists.
- [ ] **Step 3: Implement publisher-state helpers** with Firebase Admin and a narrow injected Firestore document reference for testability.
- [ ] **Step 4: Add workflow triggers** for pushes to `main`, cron `7,17,27,37,47,57 * * * *`, and `workflow_dispatch`; retain non-canceling publish concurrency.
- [ ] **Step 5: Order workflow steps** as authenticate, install, Firestore export/manifest, Hugo build, admin build, compare state, conditional Hosting deploy, and conditional state update guarded by successful Hosting deployment. A failed earlier step must not deploy or change state.
- [ ] **Step 6: Use only the existing `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` secret** for Firestore export/state and Hosting deploy; remove request payload environment variables and repository-dispatch assumptions.
- [ ] **Step 7: Run state tests, inspect the workflow trigger/step order, and run local Hugo/admin builds to ignored `.superpowers/` destinations.** Expected: unchanged fingerprints skip deploy; changed content or commit deploys; local checks leave modified `public/` files untouched.
- [ ] **Step 8: Commit** as `feat: deploy firestore content on scheduled workflow`.

### Task 4: Remove Functions publishing and update operations docs

**Files:**
- Delete: `functions/`
- Delete: `scripts/update-publish-status.mjs`
- Delete: `scripts/verify-publish-revision.mjs`
- Modify: `firebase.json`
- Modify: `README.md`
- Modify: `docs/content-model.md`
- Modify: `docs/maintenance-plan.md`

**Interfaces:**
- Root `npm run build` remains the local export + Hugo + admin build command.
- Production publishing uses `Hyeur/hyeur.github.io` GitHub Actions with the existing Firebase service-account secret; no Firebase Functions, repository-dispatch token, or Secret Manager GitHub token is needed.

- [ ] **Step 1: Remove obsolete Functions config, source, tests, and callback/revision-verification scripts** after Tasks 1–3 have no imports or workflow references to them.
- [ ] **Step 2: Update documentation** for Firestore status publishing, normal schedule delay, manual Actions run, public-repository schedule reactivation, deployed-state deletion guard, account setup, and the existing service-account secret.
- [ ] **Step 3: Run repository searches** for `requestPublish`, `repository_dispatch`, `GITHUB_PUBLISH_TOKEN`, `firebase/functions`, `update-publish-status`, and `verify-publish-revision`; expected: no active Functions publish flow or token setup remains (historical design docs may mention it). Legacy `publishRequest`/`publishedContent` strings may remain only in Firestore Rules to prevent old server-owned fields from being modified.
- [ ] **Step 4: Run `npm --prefix admin test`, `node --test scripts/release-manifest.test.mjs scripts/publisher-state.test.mjs`, `firebase emulators:exec --only firestore --project demo-portfolio "node --test scripts/firestore-rules.test.mjs"`, exporter verification, Hugo build to `.superpowers/`, admin build to `.superpowers/`, `git diff --check`, and inspect the final Git status.** Expected: all checks pass, public routes and `/admin/` output build, and the pre-existing dirty `public/` HTML plus `params.toml` remain unchanged.
- [ ] **Step 5: Commit** as `docs: remove cloud functions publishing setup`.

## Release completion

- Deploy the restrictive Firestore rules/indexes and Hosting workflow from the authenticated project; no Functions or billing upgrade is part of release.
- Verify `/` serves the Hugo site and `/admin/` serves the editor, then verify owner and non-owner access and one publish/unpublish cycle in GitHub Actions.
- Firestore currently has zero published entries. Add only approved portfolio/blog records and media URLs through `/admin/`; keep the legacy root `index.html` until the Hugo homepage is confirmed live.

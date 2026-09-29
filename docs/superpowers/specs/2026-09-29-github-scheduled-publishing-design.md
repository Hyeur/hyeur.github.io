# GitHub Scheduled Publishing Without Cloud Functions

## Goal

Keep the single-owner Hugo portfolio editor while removing Cloud Functions and the Firebase Secret Manager GitHub token. The owner should continue to write and manage entries in `/admin/`; published changes should reach Firebase Hosting without storing a GitHub credential in the browser or requiring a paid Cloud Functions deployment.

## Current state

The editor writes content to Firestore. Its Publish and Unpublish actions call the `requestPublish` Firebase callable, which validates the owner, reserves a request, and sends a `repository_dispatch` event to `Hyeur/hyeur.github.io` using `GITHUB_PUBLISH_TOKEN`. GitHub Actions exports published records, builds Hugo and the editor, deploys Hosting, then calls back to update request status and deployed content snapshots. The Cloud Functions API is disabled in `sounddesignportfolio`, and the project has no linked billing account. Firebase Hosting, Authentication, and Firestore are still usable without Functions.

## Chosen approach

Use a GitHub Actions publisher triggered by pushes to `main`, a schedule every ten minutes at offset minutes (`7,17,27,37,47,57 UTC`), and `workflow_dispatch`. The offset avoids the top of the hour. GitHub may delay scheduled runs, and automatically disables schedules in public repositories after 60 days without repository activity. If that happens, the owner can re-enable the workflow in the Actions page and run it manually; the editor links directly to workflow history.

When the owner chooses Publish or Unpublish, the editor writes `status: published` or `status: draft` directly to the entry in Firestore. Firestore rules permit those changes only for the authenticated owner custom claim and continue to deny other client access. A static Hosting page is updated only after a successful GitHub Actions deployment; the editor must describe a published entry as queued for the next sync rather than claim that it is already live. The owner can check build completion and failures in GitHub Actions.

Each triggered workflow authenticates with the existing `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` repository secret, exports published Firestore entries, builds the Hugo site and admin app, and deploys Hosting only after every validation/build step passes. The workflow computes a deterministic release fingerprint from the current `main` commit and generated published content, then compares it with the last successfully deployed fingerprint in a private Firestore publisher-state document. It skips Hosting deployment when that fingerprint is unchanged and updates the stored fingerprint only after a successful deploy. No per-entry callback, Firebase Function, repository dispatch, or Secret Manager GitHub token is used.

The Firebase Admin service account needs Firestore data read/write access for entries and the publisher-state record, and Firebase Hosting deployment permission. Browser access to the state record remains denied by Firestore rules. The custom owner claim and existing localized schema remain in use. Draft records remain excluded from the static public output.

## User experience and limits

- The owner signs in at `/admin/`, edits or creates bilingual content, and saves it as draft.
- Publish and Unpublish save the Firestore status immediately. The public site normally syncs on the next scheduled run, approximately ten minutes later; GitHub schedule events can be delayed. Pushing code to `main` starts a deployment run immediately.
- The editor links to GitHub Actions for the current run history. It does not claim a deploy succeeded until the run is visible as successful there.
- If a scheduled workflow is delayed, the owner can run **Publish portfolio content** from the repository Actions page. If GitHub has automatically disabled the schedule, first re-enable the workflow there, then run it. Either run builds the current Firestore published set; neither exposes a credential in the editor.
- A build/export failure leaves the currently deployed Firebase Hosting release in place. The failed run is visible in Actions; after the content is corrected, the next scheduled run or a manual run can publish it.
- Firestore records can be saved on the current no-billing plan within its quotas. GitHub Actions uses the already configured deployment service-account secret. Cloud Functions and its billing requirement are removed from this publishing flow.

## Other options considered

1. **Manual GitHub Actions only:** avoids a schedule delay but requires visiting GitHub after every editor publish. Keep `workflow_dispatch` as a fallback, not the primary flow.
2. **GitHub token in the browser:** rejected because anyone who can inspect the admin bundle or browser traffic could recover the token. There is no secure direct way for a static browser app to dispatch GitHub Actions without a server-side credential holder.

## Scope of implementation after spec approval

- Remove the callable request flow and `functions/` deployment configuration/code.
- Update Firestore rules and the editor so only the owner can set `status` to `draft` or `published`; retain schema validation and deletion constraints that protect published output.
- Replace `repository_dispatch` with offset schedule and `workflow_dispatch` triggers; retain export, validation, Hugo/admin build, and Hosting deploy ordering.
- Add deterministic deployed-content hashing and a private Firestore publisher-state record to avoid repeated unchanged deploys.
- Remove request locks, callback status handling, Secret Manager token setup, and stale-request retry UX. Show the latest publish workflow link and the scheduled-sync explanation in the editor.
- Update README, content model, and maintenance instructions to explain direct publish state, normal sync delay, workflow status, schedule reactivation, and the no-Functions deployment path.

## Acceptance checks

- A signed-out and non-owner client cannot read or mutate entries or publisher state.
- The owner can save drafts, publish, update published entries, unpublish, and delete only after unpublishing.
- Export includes only `published` records, with both English and Vietnamese page bundles; drafts never appear in Hugo output.
- Push, scheduled, and manual workflow runs produce identical content and deploy only after export/build validation succeeds.
- A source commit triggers a deploy even when Firestore content is unchanged; repeated scheduled runs with unchanged code and content skip deploy.
- A successful unchanged hash skips deploy; a failed build does not alter the live Hosting release or the last successful hash.
- No browser bundle, Firestore record, workflow, or Firebase configuration contains a GitHub publishing token.
- `/admin/` remains a scoped Hosting rewrite, while Hugo public routes continue to resolve without a catch-all rewrite.

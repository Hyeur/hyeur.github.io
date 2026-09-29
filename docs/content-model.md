# Firestore content model and publishing

Each document in `entries` has `type` (`blog`, `portfolio`, `project`, `credit`), `status` (`draft` or `published`), lowercase hyphenated `slug`, integer `revision`, English and Vietnamese objects with `title`, optional `summary`, and Markdown `body`, plus Firestore `createdAt` and `updatedAt` timestamps. Blog entries require a `date` in `YYYY-MM-DD` format; portfolio/project entries require integer `year`; credits require `role`. Optional fields include `sortOrder`, `featureimage` (a local site path or HTTPS URL), `medium`, `category`, HTTPS `externalUrl`, `tags`, `youtubeUrl`, and `soundcloudUrl`. Media embeds accept supported HTTPS YouTube and SoundCloud links without autoplay.

The owner editor at `/admin/` reads and writes Firestore directly. The exporter includes only records whose status is exactly `published`, then writes paired English and Vietnamese Markdown pages under exporter-owned `content/<section>/cms/` folders. `blog` maps to `blog`, `portfolio` to `portfolio`, `project` to `projects`, and `credit` to `credits`. Drafts stay in Firestore and are not included in the public Hugo build. Do not hand-edit the `cms` folders.

## Owner account setup

The custom editor signs in with Email/Password, configured in `firebase.json` and deployed with `firebase deploy --only auth --project sounddesignportfolio`. Create the one owner account in Firebase Authentication, then grant its Auth UID the `admin: true` custom claim with `GOOGLE_APPLICATION_CREDENTIALS=... OWNER_UID=... npm run set:owner-claim`. The Admin SDK script preserves other claims. The owner must sign out and sign back in to refresh the ID token. Access fails closed until the claim is present; other signed-in accounts cannot read or change entries.

## Scheduled publishing

Click **Publish** or **Unpublish** in `/admin/` to save the status directly to Firestore. GitHub Actions runs on pushes to `main`, on a ten-minute schedule at minutes 7, 17, 27, 37, 47, and 57 of each hour, and when manually started with `workflow_dispatch`. The schedule can start late during GitHub load. In a public repository, GitHub may disable scheduled workflows after 60 days without repository activity; re-enable the workflow in the Actions tab before relying on its schedule or starting it manually.

The workflow authenticates with the existing `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` repository Actions secret, exports published content, builds Hugo and the editor, then compares a release fingerprint with Firestore's private `_publisherState/current` document. An unchanged release skips the Hosting deploy. After a successful deploy, the workflow replaces that private document with the release fingerprint and the map of published entry IDs and revisions. The browser cannot read or write publisher state.

Unpublishing changes the entry to a draft immediately. The Firestore rules still reject deleting it while its ID remains in the last successful deployment map, so wait until a successful Actions run removes it from the live site before deleting. If you try early, the editor explains that it is still deployed. Firestore Emulator tests cover the owner-only rules and this deletion guard.

## Credentials and deployment

The GitHub workflow uses the service-account JSON stored as `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` in `Hyeur/hyeur.github.io` → Settings → Secrets and variables → Actions. That service account needs `roles/datastore.user` for Firestore data and permission to deploy Firebase Hosting for `sounddesignportfolio`. Keep the JSON key in GitHub Secrets; never commit it or include it in the editor bundle. No Cloud Functions, Secret Manager GitHub token, repository-dispatch token, or Blaze-plan upgrade is needed for publishing.

Deploy the restrictive rules and indexes with `firebase deploy --only firestore:rules,firestore:indexes --project sounddesignportfolio --non-interactive`. Hosting publishes through the GitHub Actions workflow. The Firebase Admin SDK uses Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS`; set `FIREBASE_PROJECT_ID` if using a different project. For local emulator exports, set `FIRESTORE_EMULATOR_HOST`. Run checks with `npm --prefix admin test`, `node --test scripts/release-manifest.test.mjs scripts/publisher-state.test.mjs`, and `firebase emulators:exec --only firestore --project demo-portfolio "node --test scripts/firestore-rules.test.mjs"`.

# Firestore content model

Each document in `entries` has `type` (`blog`, `portfolio`, `project`, `credit`), `status` (`draft` or `published`), lowercase hyphenated `slug`, `en` and `vi` objects with `title`, optional `summary`, and Markdown `body`, plus Firestore `createdAt` and `updatedAt` timestamps. Portfolio/project entries require integer `year`; credits require `role`. Optional shared fields include `tags`, `category`, and HTTPS `youtubeUrl` or `soundcloudUrl` links from the supported platform host.

Firestore permits access only to authenticated users with the `admin: true` custom claim. Grant it to the owner's existing Auth UID with `GOOGLE_APPLICATION_CREDENTIALS=... OWNER_UID=... npm run set:owner-claim`. The Admin SDK script preserves other claims; the owner signs out and back in to refresh the ID token. Until then, access fails closed.

The exporter includes published entries only and writes paired English and Vietnamese Markdown files under exporter-owned `content/<section>/cms/` folders. `blog` maps to `blog`, `portfolio` to `portfolio`, `project` to `projects`, and `credit` to `credits`. Drafts remain private in Firestore. Do not hand-edit the `cms` subfolders. Firebase Admin SDK uses Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS`; set `FIREBASE_PROJECT_ID` if the project differs from `sounddesignportfolio`. For local emulator exports set `FIRESTORE_EMULATOR_HOST`.

Publishing automation still requires a server-side GitHub dispatch credential and a configured repository allowlist. Do not put such a credential in the browser app.

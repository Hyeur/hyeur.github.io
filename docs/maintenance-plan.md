# Portfolio Maintenance Plan

## Routine refresh

Review copy, contact links, and selected samples every three to six months. Replace older material when an approved public sample communicates the role more clearly. Edit blog, portfolio, project, and credit records in the owner-only editor at `/admin/`; Firestore is the source of truth for editor-managed entries.

## Before every publish

1. Confirm every new audio and video item is approved for public use.
2. Use generic filenames, captions, and descriptions.
3. Do not include employer or client names, project names, internal work references, source paths, pull requests, review information, or unapproved media.
4. Verify each referenced local media file exists.
5. Check English and Vietnamese copy, navigation, metadata, media titles, captions, and direct links. Test embeds at desktop and mobile widths and confirm video does not autoplay.
6. Publish or unpublish through the editor, then check the GitHub Actions workflow for the next successful run. The normal schedule is every ten minutes; it may be delayed during GitHub load. A run can also be started manually from the repository Actions tab.
7. Confirm the public page responds at https://sounddesignportfolio.web.app/ after deployment. Confirm `/admin/` remains available and the public site does not expose drafts.
8. After unpublishing, wait for a successful deployment before deleting the entry. Firestore rules block deletion while the last deployed state still contains that entry.

## Deployment

Firebase Hosting is the production host. GitHub Actions builds from published Firestore content and deploys the generated Hugo site plus editor. It runs on pushes to `main`, the ten-minute schedule, or a manual workflow run. The workflow uses the `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` GitHub Actions secret; no Cloud Function or GitHub token in Firebase is used. Setup and owner provisioning are in [docs/content-model.md](content-model.md). Do not deploy the checked-in or local `public/` output directly. The retired GitHub Pages workflow is not a production deployment path. In a public repository, re-enable the schedule in Actions if GitHub disabled it after 60 days without repository activity.

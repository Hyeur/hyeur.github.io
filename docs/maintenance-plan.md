# Portfolio Maintenance Plan

## Routine refresh

Review copy, contact links, and selected samples every three to six months. Replace older material only when an approved public sample communicates the role more clearly. Edit blog, portfolio, project, and credit records in the owner-only editor at `/admin/`; Firestore is the source of truth for editor-managed entries.

## Before every publish

1. Confirm every new audio and video item is approved for public use.
2. Use generic filenames, captions, and descriptions.
3. Do not include employer or client names, project names, internal work references, source paths, pull requests, review information, or unapproved media.
4. Verify each referenced local media file exists.
5. Check English and Vietnamese copy, navigation, metadata, media titles, captions, and direct links. Test embedded media at desktop and mobile widths and confirm video does not autoplay.
6. For editor-managed content, publish through the editor and wait for its build status. If a queued request remains for more than 41 minutes, use **Retry expired build**; verify whether the requested action was publish or unpublish.
7. Confirm the public page responds at https://sounddesignportfolio.web.app/ after the GitHub Actions deployment succeeds. Confirm `/admin/` remains available and the public site does not expose draft records.

## Deployment

Firebase Hosting is the production host. GitHub Actions deploys the generated `public/` directory after a fixed-repository `repository_dispatch` from the Firebase callable. The callable reads `GITHUB_PUBLISH_TOKEN` from Firebase Secret Manager; the workflow uses the `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` GitHub Actions secret. Setup, owner provisioning, and deployment commands are in [docs/content-model.md](content-model.md). Do not deploy the checked-in or local `public/` output directly; rebuild it from Hugo content and published Firestore records through the workflow. The retired GitHub Pages workflow is not a production deployment path.

# Nguyen Ngoc Hieu - Sound Design Portfolio

Public static portfolio: https://sounddesignportfolio.web.app/

## Local preview

Run `npm ci` and `npx hugo server` from the repository root, then open the local URL printed by Hugo. To build the static site, use `npm run build:site`.

## Site structure

- `content/` contains the English and Vietnamese homepage, portfolio, reel, credits, blog, biography, and contact content.
- `layouts/` contains the portfolio-first Hugo homepage and safe media embeds.
- `audio/` and `video/` are copied to the generated site while existing samples are migrated to SoundCloud and YouTube embeds.
- `themes/blowfish/` provides the shared theme and article layouts.

## Updating portfolio content

1. Sign in at `/admin/` using the Firebase Authentication owner account. Firestore access requires the `admin: true` custom claim; see [docs/content-model.md](docs/content-model.md) for owner and deployment setup.
2. Create an English and Vietnamese entry and save it as a draft. Add approved YouTube or SoundCloud share URLs.
3. Save a draft or use Publish/Unpublish. The callable function dispatches a build only to `Hyeur/hyeur.github.io`; status and workflow links appear on the entry. Media URLs must use YouTube or SoundCloud. Unlisted and private-share media links are visible to anyone who can access the public page.
4. Before first use, configure the owner custom claim and `OWNER_UID`, store `GITHUB_PUBLISH_TOKEN` in Firebase Secret Manager, and configure the `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` GitHub Actions secret as documented in [docs/content-model.md](docs/content-model.md). Firebase Hosting serves the generated `public/` directory.
5. Use generic, external-audience wording and follow [docs/maintenance-plan.md](docs/maintenance-plan.md) before publishing.

## Deployment

Publishing from `/admin/` is the production deployment path. GitHub Actions exports published Firestore entries, builds Hugo and the editor, verifies the requested revision, and deploys Firebase Hosting. A Hosting deploy runs only after every build and validation step succeeds. Changes to the repository alone do not trigger a production deploy; use a publish or unpublish action in the editor.

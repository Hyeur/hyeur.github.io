# Nguyen Ngoc Hieu — Sound Design Portfolio

Public portfolio and blog: https://sounddesignportfolio.web.app/

## Local preview and build

Install dependencies with `npm ci` and `npm ci --prefix admin`. Run `npm run build` for a complete local build; generated files go under the ignored `.superpowers/build/` folder so the checked-in `public/` directory is left alone. Run `npm run build:site -- --destination .superpowers/preview` for a Hugo-only build, or `npm --prefix admin run build -- --outDir ../.superpowers/admin-preview` for the editor. The live Hosting workflow uses `public/` as its deployment output.

## Site structure

- `content/` contains the English and Vietnamese pages and hand-authored content.
- `layouts/` contains the portfolio-first homepage and safe media embeds.
- `themes/blowfish/` provides the Hugo theme and article layouts.
- `admin/` contains the private owner editor. Firestore is its content source; the public site is a static Hugo build.

## Editing and publishing

1. Sign in at `/admin/` with the Firebase Authentication owner account. The account needs the `admin: true` custom claim; see [docs/content-model.md](docs/content-model.md) for setup.
2. Create an English and Vietnamese entry, save it as a draft, and add approved YouTube or SoundCloud links where needed.
3. Use **Publish** or **Unpublish** to change the Firestore status. GitHub Actions checks for updates on its ten-minute schedule and publishes the next successful build. A push to `main` also starts a build, and you can start one from the repository’s Actions tab. See [docs/content-model.md](docs/content-model.md) for schedule limits and the delete-after-unpublish behavior.
4. Use generic, external-audience wording and follow [docs/maintenance-plan.md](docs/maintenance-plan.md) before publishing. Unlisted or private-share media links are visible to anyone who can access the public page.

For the complete owner workflow—including first-time account setup, bilingual entry fields, media embeds, publishing, and safe deletion—see the [Owner's Guide](docs/owner-guide.md).

## Deployment services

Firebase Hosting serves the Hugo site and `/admin/`. GitHub Actions reads published Firestore entries, builds Hugo and the editor, and deploys Hosting using the existing `FIREBASE_SERVICE_ACCOUNT_SOUNDDESIGNPORTFOLIO` repository secret. Cloud Functions and a GitHub publishing token are not used. The production workflow and service-account setup are documented in [docs/content-model.md](docs/content-model.md).

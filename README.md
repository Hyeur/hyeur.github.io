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

1. Sign in at `/admin/` using the Firebase Authentication owner account. Firestore access requires the `admin: true` custom claim; see [docs/content-model.md](docs/content-model.md) for owner setup.
2. Create an English and Vietnamese entry and save it as a draft. Add approved YouTube or SoundCloud share URLs.
3. Run `npm run export:content` with Firebase Admin credentials, then build Hugo. The export includes only published entries.
4. Firebase Hosting serves the generated `public/` directory. Configure deployment credentials in GitHub Actions before enabling automated releases.
5. Use generic, external-audience wording and follow [docs/maintenance-plan.md](docs/maintenance-plan.md) before publishing.

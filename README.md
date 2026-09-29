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
3. Save a draft or use Publish/Unpublish. The callable function dispatches a build to the fixed GitHub repository; status and workflow links appear on the entry.
4. Set up the owner claim, Functions secret, and GitHub service-account secret as documented in [docs/content-model.md](docs/content-model.md). Firebase Hosting serves the generated `public/` directory.
5. Use generic, external-audience wording and follow [docs/maintenance-plan.md](docs/maintenance-plan.md) before publishing.

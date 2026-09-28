# Nguyen Ngoc Hieu - Sound Design Portfolio

Public static portfolio: https://sounddesignportfolio.web.app/

## Local preview

Run `npm ci` and `npx hugo server` from the repository root, then open the local URL printed by Hugo.

## Site structure

- `content/` contains the English and Vietnamese homepage, portfolio, reel, credits, blog, biography, and contact content.
- `layouts/` contains the portfolio-first Hugo homepage and safe media embeds.
- `audio/` and `video/` are copied to the generated site while existing samples are migrated to SoundCloud and YouTube embeds.
- `themes/blowfish/` provides the shared theme and article layouts.

## Updating portfolio content

1. Use the private `/admin/` editor to create an English and Vietnamese entry and save it as a draft.
2. Add approved YouTube or SoundCloud share URLs and preview the embeds.
3. Publish from the editor; GitHub Actions builds Hugo and deploys the generated `public/` directory to Firebase Hosting.
4. Use generic, external-audience wording and do not include unapproved employer or client details.
5. Follow [docs/maintenance-plan.md](docs/maintenance-plan.md) before publishing.

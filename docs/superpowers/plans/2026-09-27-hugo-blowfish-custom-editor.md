# Hugo + Blowfish Portfolio and Custom Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-built root page with a portfolio-first Hugo + Blowfish site and a private, single-owner editor that publishes Firestore content to Firebase Hosting.

**Architecture:** Hugo builds all public pages as static output. A React + TypeScript admin app uses Firebase Authentication and Firestore; a server-side Firebase Function verifies the owner's UID and dispatches a GitHub Actions build, which exports published Firestore records to Hugo content and deploys the result to Firebase Hosting.

**Tech Stack:** Hugo Extended 0.166.x, Blowfish Git submodule, Firebase Hosting, Firebase Authentication, Cloud Firestore, Firebase Functions, GitHub Actions, Vite, React, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-27-hugo-blowfish-cms-design.md`

## Global Constraints

- Only the configured owner's Firebase Authentication UID may read or mutate editor records or invoke publishing.
- Firestore records are the editor source of truth; only records with `status = published` enter the public Hugo build.
- The public site remains static and must not read Firestore at runtime.
- Firebase Hosting deploys Hugo's generated `public/` directory.
- Admin and publishing credentials stay server-side and out of Git and browser bundles.
- The production page must use Hieu's approved public copy and media; do not add unapproved client, employer, or project details.
- Keep English and Vietnamese versions of the current portfolio copy during migration.
- Embedded URLs are accepted only from YouTube and SoundCloud; render them with controlled templates, with no autoplay.

## Review Focus

- **Draft leakage:** a draft, scheduled, or malformed-status record must never appear in generated public pages; manually inspect the build output after export.
- **Admin authorization:** signed-out and signed-in non-owner users must be denied editor reads/writes and publish calls; manually verify using a second test account.
- **Publishing failure:** an invalid record or failed GitHub dispatch must show failure and leave the currently live Hosting release intact; manually inspect the editor status and live URL.
- **Embed input:** malformed, lookalike, and unsupported host URLs must be rejected; manually verify validation and confirm no arbitrary HTML is rendered.
- **Routing and language:** public page routes, `/admin/`, and English/Vietnamese navigation must resolve correctly at mobile and desktop widths.

---

### Task 1: Make Hugo the public site and migrate the portfolio structure

**Files:**
- Modify: `config/_default/hugo.toml`, `config/_default/languages.en.toml`, `config/_default/menus.en.toml`, `config/_default/params.toml`
- Create: `config/_default/languages.vi.toml`, `config/_default/menus.vi.toml`
- Create: `content/_index.en.md`, `content/_index.vi.md`, `content/reel/_index.en.md`, `content/reel/_index.vi.md`, `content/credits/_index.en.md`, `content/credits/_index.vi.md`, `content/portfolio/_index.en.md`, `content/portfolio/_index.vi.md`, `content/projects/_index.en.md`, `content/projects/_index.vi.md`, `content/blog/_index.en.md`, `content/blog/_index.vi.md`, `content/bio/index.en.md`, `content/bio/index.vi.md`, `content/contact/index.en.md`, `content/contact/index.vi.md`
- Create: `layouts/index.html`, `layouts/partials/home/portfolio.html`, `layouts/shortcodes/youtube.html`, `layouts/shortcodes/soundcloud.html`, `assets/css/custom.css`
- Modify: `README.md`

**Interfaces:** Hugo sections and routes are `/`, `/reel/`, `/credits/`, `/portfolio/`, `/projects/`, `/blog/`, `/bio/`, and `/contact/`. Media shortcodes accept a validated platform URL or platform ID plus an accessible title. Keep bilingual copy in matching `.en.md` and `.vi.md` files.

- [ ] Create the English and Vietnamese section landing pages and navigation entries for the routes above.
- [ ] Build the homepage partials in this order: introduction, featured reel, selected portfolio, personal projects, recent posts, contact links.
- [ ] Add YouTube and SoundCloud shortcodes that validate the host/ID, emit responsive embeds with titles, and do not autoplay.
- [ ] Move approved public copy and section content from root `index.html` into Hugo content; set Hugo as the only production source for `/` and update README deployment instructions.
- [ ] Run `npm ci` and `npx hugo --minify`; inspect generated routes and verify both language roots and section listings locally.
- [ ] Commit the Hugo site migration as `feat: migrate portfolio to Hugo and Blowfish`.

### Task 2: Define Firestore content and generate Hugo pages from published entries

**Files:**
- Modify: `firestore.rules`, `firestore.indexes.json`, `package.json`, `package-lock.json`
- Create: `scripts/export-firestore-content.mjs`, `scripts/content-schema.mjs`, `docs/content-model.md`
- Create: `content/portfolio/`, `content/projects/`, `content/blog/`, `content/credits/` generated output paths

**Interfaces:** Firestore collection `entries` uses document fields `type` (`blog`, `portfolio`, `project`, `credit`), `status` (`draft`, `published`), `slug`, `createdAt`, `updatedAt`, and localized `en`/`vi` content. Export command: `npm run export:content`; it validates records and writes Hugo page bundles only for published entries.

- [ ] Document required fields per type, slug rules, localized fields, and publish state in `docs/content-model.md`.
- [ ] Replace the temporary allow-all rules with owner-UID-only read/write rules for `entries`; deny all other client access by default.
- [ ] Add Firestore indexes required to order published entries by type, status, and date/weight.
- [ ] Implement shared record validation for required fields, supported content types, localized values, unique slugs, dates, and media host allowlists.
- [ ] Implement the export command using Firebase Admin credentials from the CI environment; clear only generated output and write English/Vietnamese Hugo page bundles for published entries.
- [ ] Add `export:content` and `build:site` scripts; manually run the exporter against Firestore Emulator data containing drafts, published entries, malformed data, and duplicate slugs, and inspect that invalid records stop the build.
- [ ] Commit the content schema, restrictive rules, and exporter as `feat: export published Firestore content to Hugo`.

### Task 3: Build the single-owner admin editor

**Files:**
- Create: `admin/package.json`, `admin/package-lock.json`, `admin/index.html`, `admin/vite.config.ts`, `admin/tsconfig.json`
- Create: `admin/src/main.tsx`, `admin/src/firebase.ts`, `admin/src/auth.ts`, `admin/src/content.ts`, `admin/src/routes.tsx`
- Create: `admin/src/pages/LoginPage.tsx`, `admin/src/pages/EntryListPage.tsx`, `admin/src/pages/EntryEditorPage.tsx`
- Create: `admin/src/components/EntryForm.tsx`, `admin/src/components/MarkdownEditor.tsx`, `admin/src/components/MediaUrlField.tsx`, `admin/src/styles.css`
- Modify: `firebase.json`, `.gitignore`

**Interfaces:** The editor reads and writes the Task 2 `entries` schema through the Firebase client SDK. Routes are `/admin/login`, `/admin/entries`, `/admin/entries/new`, and `/admin/entries/:id`. Vite outputs to `public/admin/`; Firebase Hosting rewrites only `/admin/**` to `/admin/index.html`.

- [ ] Scaffold the Vite React + TypeScript app and add the Firebase web SDK using public Firebase client configuration.
- [ ] Implement sign-in/sign-out and a route guard; query no entry data until the signed-in user UID matches the configured owner UID.
- [ ] Implement an entry list with type/status filters and create, edit, and delete controls.
- [ ] Implement localized English/Vietnamese forms for blog, portfolio, project, and credit entries, with Markdown body editing and a content preview.
- [ ] Validate required fields, slug format, dates, and YouTube/SoundCloud hostnames before saving; show Firestore authorization and network errors inline.
- [ ] Configure the admin build output and Hosting rewrite without adding a catch-all rewrite for public Hugo routes.
- [ ] Build with `npm --prefix admin run build`; manually verify signed-out, owner, and non-owner flows against the Firebase Emulator Suite.
- [ ] Commit the admin app as `feat: add single-owner content editor`.

### Task 4: Connect publish actions to a safe Firebase Hosting build

**Files:**
- Create: `functions/package.json`, `functions/package-lock.json`, `functions/src/index.js`
- Create: `.github/workflows/publish-content.yml`
- Modify: `firebase.json`, `package.json`, `package-lock.json`
- Modify: `admin/src/content.ts`, `admin/src/pages/EntryEditorPage.tsx`
- Modify: `docs/content-model.md`, `README.md`

**Interfaces:** Callable function `requestPublish({ entryId, action })` accepts `action` `publish` or `unpublish`, verifies the Firebase caller UID and entry, writes the requested state, and dispatches repository event `publish-content`. Workflow exports published documents, builds Hugo plus admin assets into `public/`, deploys `public/` to Hosting, and writes request status (`queued`, `succeeded`, `failed`) to the entry.

- [ ] Implement `requestPublish` with owner UID verification, payload validation, idempotency by entry revision, and server-side GitHub dispatch credentials stored in Firebase secrets.
- [ ] Implement the Actions workflow for `publish-content`; authenticate Firestore export with a least-privilege service account and Firebase Hosting deploy with the existing deployment secret.
- [ ] Order the build steps as dependency install, content export, Hugo build, admin build/copy, and Hosting deploy; remove the current nonexistent `npm run build` assumption by defining the root build command.
- [ ] Return workflow completion status to the entry and expose pending/success/failure state in the admin editor.
- [ ] Confirm a failed export/build does not run the deploy step, and that drafts are absent from generated output.
- [ ] Build against emulator/preview data, inspect Hosting preview routing for Hugo pages and `/admin/`, then manually verify publish and unpublish in a Firebase Hosting preview channel.
- [ ] Commit publish automation as `feat: publish CMS content through Firebase Hosting`.

### Task 5: Migrate initial content and close the release checklist

**Files:**
- Create: initial Firestore entries for approved portfolio, credits, projects, and blog content
- Modify: `README.md`, `docs/maintenance-plan.md`
- Remove from production source: root `index.html` after the Hugo homepage is confirmed live

**Interfaces:** Initial Firestore entries conform to `docs/content-model.md`. The production URL is served by Firebase Hosting; GitHub Actions is the only automated production deploy path.

- [ ] Enter the approved current portfolio content, YouTube reel URLs, and SoundCloud private-share URLs through the admin editor.
- [ ] Verify public pages in English and Vietnamese, media embeds on mobile/desktop, all navigation links, 404 behavior, and page metadata.
- [ ] Verify one owner can edit/publish/unpublish while an unrelated Firebase account is denied; verify Firestore anonymous access is denied.
- [ ] Confirm the production GitHub Actions workflow deploys Hugo output to Firebase Hosting and the README/maintenance guide describe the editor and publishing workflow.
- [ ] After confirming the Hugo homepage is the production page, remove the obsolete root hand-authored `index.html` source and commit as `feat: launch Hugo portfolio and CMS publishing flow`.

## Execution notes

- Keep current user modifications to `config/_default/params.toml`, npm manifests, and generated `public/` files intact while implementing; review and reconcile them deliberately in the relevant tasks.
- Validate Firebase Function deployment prerequisites and any billing-plan requirement before deploying the callable function.
- Use Firebase Emulator Suite and Hosting preview channels during implementation; reserve production deployment for the final reviewed release.
- Do not run broad formatters or theme updates as part of this work.

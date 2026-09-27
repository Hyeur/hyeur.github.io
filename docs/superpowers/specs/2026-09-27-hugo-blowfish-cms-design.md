# Hugo, Blowfish, and Firebase portfolio design

## Goal

Replace the outdated hand-written root page with a Hugo site using Blowfish. The site presents Nguyen Ngoc Hieu's sound-design portfolio and blog, with a portfolio-first flow inspired by Matt Jacobson's site. The owner wants a custom editor with sign-in and a single authorized account. YouTube hosts video reels and SoundCloud hosts sound samples; the public site embeds them.

## Agreed direction

- Adapt the reference site's information architecture and portfolio-first emphasis, while using Hieu's identity, content, and visual choices.
- Use Hugo and Blowfish for all public pages and Firebase Hosting for deployment.
- Provide a custom `/admin` editor. Only the owner's Firebase Authentication account can create, edit, publish, unpublish, or delete content.
- Use YouTube and SoundCloud embeds for hosted media.
- Preserve the repository as the code and deployment source. Public pages are generated as static Hugo output.

## Site structure

- **Home:** brief introduction, prominent video reel, selected portfolio entries, selected personal projects, recent blog posts, and contact links.
- **Reel:** curated video work with YouTube embeds.
- **Credits:** searchable or grouped project credits with role, year, and medium.
- **Portfolio:** project detail pages that can combine description, responsibilities, and SoundCloud audio embeds.
- **Personal Projects:** a separate list and detail pages for self-directed work.
- **Blog:** article list and individual posts.
- **Bio / Contact:** biography, relevant background, and contact or professional links.
- **Admin:** private editor route, excluded from public navigation and search indexing.

Shared navigation should expose Home, Reel, Credits, Portfolio, Personal Projects, Blog, Bio, and Contact. On small screens it should use Blowfish's responsive navigation. The homepage may use a custom Blowfish layout; content pages should use Blowfish's standard templates where they fit.

## Content and editor

The editor is a small, purpose-built admin app served by Firebase Hosting at `/admin`. Firebase Authentication provides sign-in. Firestore stores editable content as structured documents, including drafts. Public Hugo pages do not query Firestore at runtime.

The editor supports these initial content types:

- **Blog post:** title, slug, publication date, summary, body, tags, featured image, and draft/published state.
- **Portfolio or personal project:** title, slug, category, year, role, summary, body, thumbnail, sort order, YouTube URL, SoundCloud URL, and draft/published state.
- **Credit:** project title, year, medium, role, and optional external URL.

The editor provides create, edit, preview, save draft, publish, unpublish, and delete actions. Form validation checks required fields and accepts media links only from supported YouTube and SoundCloud hosts. Media rendering uses controlled templates/shortcodes rather than arbitrary HTML supplied by an editor field.

## Authorization and data flow

1. The owner signs in through Firebase Authentication.
2. Firestore rules and the publishing backend permit mutations only for the configured owner UID. Hiding `/admin` is not treated as access control.
3. Draft and published content remain in Firestore as the editor's source of truth. The public site receives only published content during a build.
4. On publish or unpublish, the editor calls a trusted Firebase function. The function verifies the caller's UID and dispatches a GitHub Actions build; credentials for dispatching are kept on the server, never in the browser.
5. GitHub Actions reads published documents with a restricted server credential, converts them to Hugo content files, builds into `public/`, then deploys that output to Firebase Hosting.
6. The workflow records success or failure for the publish request so the editor can show its status. A failed build leaves the previous Hosting release live and reports the failure.

The Firebase Hosting catch-all rewrite must be removed because it would route Hugo page URLs to one HTML file. Any rewrite needed by the editor must be limited to `/admin/**`; normal public routes resolve to generated Hugo files.

## Media behavior

Store media URLs and descriptive metadata, not the source video/audio files, in the content records. Render responsive YouTube and SoundCloud players on the relevant project or reel pages. Videos should not autoplay. Provide titles/captions and a direct link to the hosted media as a fallback. Unlisted or private-share media links are accessible to visitors who can view the public page and should not be considered confidential.

## Deployment and migration

The current Firebase GitHub workflow runs `npm run build`, but the root package manifest has no build script. Replace this with an explicit Hugo build and content-materialization step. Firebase Hosting should deploy only Hugo's generated `public/` directory. Choose Firebase Hosting as the canonical production host; update README deployment instructions that currently describe GitHub Pages from the repository root.

Migrate the existing portfolio copy and approved media references from root `index.html` into Hugo content, then retire the old root page as a source of production output. Preserve the current portfolio's public wording and approval constraints during migration. Do not carry over unapproved project/client details.

## Error handling and operational requirements

- Invalid media URLs, missing required fields, duplicate slugs, and invalid publication dates are rejected in the editor before publishing.
- A publish request has a visible pending, success, or failure state. Repeated submissions should not create duplicate content or deployments for the same unchanged revision.
- Drafts are never emitted into the public Hugo build.
- Firestore access is closed to anonymous writes and limited to the owner. The existing broad temporary read/write rule must be replaced before enabling the custom editor.
- No admin or publishing secrets are shipped to the browser or checked into Git.

## Out of scope for the first release

- Multiple authors or role management.
- Uploading video/audio to Firebase Storage.
- Public comments, visitor accounts, likes, or other database-driven public interactions.
- A general-purpose page builder or arbitrary HTML editing.
- Replacing YouTube or SoundCloud as media hosts.

## Acceptance criteria

- The production homepage and all public sections are generated by Hugo/Blowfish; the legacy root `index.html` is no longer the published homepage source.
- Portfolio, credits, personal projects, and blog entries have stable public URLs and are included in navigation or relevant listings.
- The owner can sign in, create and preview a draft, publish it, verify the generated public page, then unpublish it.
- A non-owner cannot read or mutate editor data or invoke publishing, even if they know the admin URL.
- Published media embeds work on desktop and mobile without autoplay; invalid or unsupported URLs cannot inject arbitrary markup.
- A GitHub Actions build materializes only published content, runs Hugo, and deploys `public/` to Firebase Hosting. Build failures do not replace the currently live release.
- Existing project changes are preserved, and deployment instructions describe the selected Firebase Hosting flow.

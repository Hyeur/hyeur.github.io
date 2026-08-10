# Public Portfolio Maintenance Design

## Purpose

Keep the public sound-design portfolio easy to update while ensuring every published change remains appropriate for an external audience.

## Documentation layout

- `README.md` is the entry point for maintainers. It explains local preview, the published URL, the public folder layout, and routine content updates.
- `docs/maintenance-plan.md` is the operational reference. It contains the release checklist, recurring refresh cadence, and public-content safeguards.

## Publishing boundary

Documentation must use generic portfolio language. It must not include employer or client names, internal project names, source locations, pull requests, review material, or unapproved media.

## Validation

Before pushing a maintenance update:

1. Confirm every newly referenced audio or video file is present in the repository.
2. Check the page locally and verify English and Vietnamese content still render correctly.
3. Search changed text for internal identifiers and local machine or share-drive paths.
4. Review the staged file list so unrelated local media is not published.

## Deployment

GitHub Pages deploys from the `main` branch at the repository root. A successful deployment is confirmed by the public URL returning the portfolio page.

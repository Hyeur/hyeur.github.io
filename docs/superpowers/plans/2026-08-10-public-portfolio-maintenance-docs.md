# Public Portfolio Maintenance Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add concise, public-safe documentation that lets a future maintainer update and publish the static portfolio safely.

**Architecture:** `README.md` is the public repository entry point. `docs/maintenance-plan.md` holds the recurring release process and content safeguards. Both documents point to the static site root and use generic language only.

**Tech Stack:** Markdown, GitHub Pages, static HTML, PowerShell or Python local HTTP server.

---

### Task 1: Write maintainer entry point

**Files:**
- Create: `README.md`
- Test: one-off public-content scan

- [ ] **Step 1: Verify that README does not yet exist**

Run: `Test-Path README.md`

Expected: `False`

- [ ] **Step 2: Create `README.md`**

Include these sections:

```markdown
# Nguyen Ngoc Hieu - Sound Design Portfolio

Public static portfolio: https://hyeur.github.io/

## Local preview

Run `python -m http.server 8000` from the repository root, then open `http://localhost:8000/`.

## Site structure

- `index.html` contains layout, bilingual copy, sample labels, and the language toggle.
- `audio/` contains public sound-design samples referenced by `index.html`.
- `video/listening-guide.mp4` is the abstract visual companion.
- `video/featured/` contains the featured censored visual studies.

## Updating portfolio content

1. Use generic, external-audience wording.
2. Add a new media file under the matching `audio/` or `video/` folder.
3. Reference it from `index.html` with a generic filename and matching English/Vietnamese label.
4. Test media playback and the language toggle locally.
5. Run the release checklist in `docs/maintenance-plan.md` before pushing.
```

- [ ] **Step 3: Run the public-content scan**

Run: `Select-String -Path README.md -Pattern '\\\\|[A-Za-z]:\\' -CaseSensitive:$false`

Expected: no matches.

- [ ] **Step 4: Commit the entry point**

```bash
git add README.md
git commit -m "Add portfolio maintenance README"
```

### Task 2: Write operational maintenance plan

**Files:**
- Create: `docs/maintenance-plan.md`
- Test: one-off documentation and media-reference scan

- [ ] **Step 1: Verify that the maintenance-plan file does not yet exist**

Run: `Test-Path docs/maintenance-plan.md`

Expected: `False`

- [ ] **Step 2: Create `docs/maintenance-plan.md`**

Include these sections:

```markdown
# Portfolio Maintenance Plan

## Routine refresh

Review copy, contact links, and selected samples every three to six months. Replace older material only when an approved public sample communicates the role more clearly.

## Before every publish

1. Confirm every new audio and video item is approved for public use.
2. Use generic filenames, captions, and descriptions.
3. Do not include employer or client names, project names, internal work references, source paths, pull requests, review information, or unapproved media.
4. Verify each referenced local media file exists.
5. Test English and Vietnamese text, all sample playback, and the single-media playback behavior locally.
6. Inspect `git status` and stage only the intended files.
7. Confirm the public site responds after GitHub Pages builds.

## Deployment

GitHub Pages deploys the repository root from the `main` branch. The public URL is https://hyeur.github.io/.
```

- [ ] **Step 3: Run the document checks**

Run:

```powershell
Select-String -Path 'docs/maintenance-plan.md' -Pattern '\\\\|[A-Za-z]:\\' -CaseSensitive:$false
Test-Path 'index.html'
Test-Path 'audio'
Test-Path 'video'
```

Expected: no text matches; all three `Test-Path` commands return `True`.

- [ ] **Step 4: Commit the operational plan**

```bash
git add docs/maintenance-plan.md
git commit -m "Add portfolio maintenance plan"
```

### Task 3: Publish and verify documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/maintenance-plan.md`

- [ ] **Step 1: Check staged changes before publishing**

Run:

```bash
git diff --cached --name-status
git diff --cached --check
```

Expected: only the two documentation files; no whitespace errors.

- [ ] **Step 2: Push the documented change**

Run: `git push origin main`

Expected: `main -> main` succeeds.

- [ ] **Step 3: Verify public deployment**

Run: `Invoke-WebRequest -UseBasicParsing https://hyeur.github.io/ -TimeoutSec 20`

Expected: HTTP `200`.

# Nguyen Ngoc Hieu - Sound Design Portfolio

Public static portfolio: https://hyeur.github.io/

## Local preview

Run `python -m http.server 8000` from the repository root, then open `http://localhost:8000/`.

## Site structure

- `index.html` contains the layout, bilingual copy, sample labels, and language toggle.
- `audio/` contains public sound-design samples referenced by `index.html`.
- `video/listening-guide.mp4` is the abstract visual companion.
- `video/featured/` contains the featured censored visual studies.

## Updating portfolio content

1. Use generic, external-audience wording.
2. Add a new media file under the matching `audio/` or `video/` folder.
3. Reference it from `index.html` with a generic filename and matching English/Vietnamese label.
4. Test media playback and the language toggle locally.
5. Run the release checklist in [docs/maintenance-plan.md](docs/maintenance-plan.md) before pushing.

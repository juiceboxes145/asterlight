# Asterlight — Start Here

Live website: https://asterlight-observatory.vercel.app/
Project write-up: https://asterlight-observatory.vercel.app/project.html
GitHub source and resources: https://github.com/juiceboxes145/asterlight

## What is in this folder?

| Location | Contents |
| --- | --- |
| `dist/` | Website UI, original logo, browser modules, saved real SPHEREx example and public documentation |
| `api/`, `lib/` | Archive access and FITS image processing |
| `docs/` | Complete write-up, demo script, credits and submission text |
| `scripts/` | Documentation, live data verification and deployment helpers |
| `tests/` | Automated tests, real FITS fixture and independent reference values |
| `resources/branding/` | Website logo and optional AI-generated team illustration |
| `resources/presentations/` | Editable seven-slide PowerPoint, PDF, slide images and session backup |
| `resources/screenshots/` | App screenshots and details used in the slideshow |
| `resources/science/` | Scientific reference data and verification record |
| `archive/` | Earlier version, old exports, original Git history and development working files; local only |
| `local-config/` | Existing hosting configuration; local only |

## Run the project

Install Node.js 22 or newer. Open a terminal in this folder and run:

```sh
npm start
```

Open http://127.0.0.1:4173/. No npm dependencies or API key are required.

Run `npm test` to check the offline test suite. Live searches require internet access and NASA/IPAC IRSA availability. The opening saved example also works when the archive is busy.

## Present or share

Open `resources/presentations/Asterlight-User-Guide.pptx` to edit or present the walkthrough. The PDF is a fixed visual copy. For a team profile image, use the original website logo in `resources/branding/`.

The archive and hosting configuration stay out of GitHub through `.gitignore`. The original working folder has not been moved or deleted. `FILE-INVENTORY.json` records the packaged files and their SHA-256 checksums.

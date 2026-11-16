# Asterlight — SPHEREx through time

A public sky-image explorer built for the **2026 NASA Space Apps challenge: Planet X and SPHEREx**.

Live app: https://asterlight-observatory.vercel.app/

Source and project resources: https://github.com/juiceboxes145/asterlight

Project brief: https://asterlight-observatory.vercel.app/project.html

## What it does

- Accepts decimal or sexagesimal RA / declination and shares field settings through URLs.
- Queries real SPHEREx DR1 and QR3 observations through NASA/IPAC IRSA SIA.
- Retrieves FITS cutouts and aligns them on a common north-up, east-left sky grid using TAN-SIP WCS.
- Offers chronological playback, reference blinking, and guarded visual subtraction.
- Displays observing dates, central wavelength/bandwidth, coverage, quality flags, and original FITS links.
- Includes the five challenge targets, a clearly labeled saved Barnard’s Star example, image downloads, and an observation log with notes.

## Run locally

Requires Node.js 22 or later. There are no npm runtime dependencies.

    npm start

Open http://127.0.0.1:4173/. The local server serves both static files and the same API handlers deployed to Vercel. Use this server rather than opening index.html as a file: live searches need the API routes.

## Verify

    npm test
    node scripts/verify-targets.mjs

The numerical tests work offline. They include a real cutout fixture and independent Astropy 8.0.2 reference coordinates/wavelengths. The live target check requires IRSA availability and writes its results to work/target-verification.json. Set ASTERLIGHT_BASE to a deployed URL to check that environment.

    node scripts/build-preview.mjs
    npm run brief

The first command refreshes the saved real-data example from the running app/API. It preserves the existing snapshot if fewer than two valid images load. The second rebuilds the seven-section HTML brief from docs/PROJECT.md and copies the downloadable documents into dist/.

## Layout

- dist/: browser UI, original FITS/WCS modules, coordinates, presets, viewer logic, generated brief, and saved example.
- api/archive.js: validates positions and queries DR1 / QR3 metadata.
- api/frame.js: validates an archive path, retrieves its FITS cutout, and returns aligned display pixels plus provenance.
- lib/: bounded archive requests, VOTable parsing, metadata normalization, and frame processing.
- tests/: independent regression reference, real FITS fixture, and behavior tests.
- docs/: project write-up and presentation script.
- scripts/: document generation, live verification, snapshot refresh, deployment-file preparation.

## Deploy to Vercel

Use the existing asterlight-observatory project, framework Other, output directory dist, and empty install/build commands. Root-level api/*.js files are Node.js functions with a 60-second maximum duration. Deploy dist, api, lib, package.json, and vercel.json together. Static-only hosting without these functions cannot perform live searches.

The functions use public NASA/IPAC IRSA services; no API token or secret is required. A legacy classify.html URL redirects to the rebuilt homepage. Previous-version files, local work artifacts, and test fixtures are excluded from deployment.

## Scientific processing and limits

The IMAGE extension is resampled with bilinear interpolation on a 128 × 128 tangent grid. The coordinate implementation includes forward SIP distortion inversion. Approximate center wavelengths come from the product’s WCS-WAVE table. Flag masks exclude selected suspect bits while retaining SOURCE and FULLSAMPLE. Masking may remove real source pixels and is reversible in the interface.

Ordinary images retain their zodiacal background and use an asinh stretch. Shared stretch is the default; a frame-specific scale is optional. Visual differences require overlapping center bandpasses and remove a median background per image. They do not match PSFs or perform calibrated photometry. Wavelength varies across the field, so matching centers is only a first screening step.

Up to 24 exposures are selected across the requested date range; this is not a complete time series. The server bounds upstream response sizes and timeouts. DR1/QR3 availability is reported separately when one collection fails. Empty coverage, failed cutouts, and archive outages are explicit states. The saved example is never passed off as a live search.

The app does not identify or confirm planets, fit proper motion, measure calibrated variability, or detect objects automatically. WISE 0855 may be too faint in individual exposures, and Epsilon Indi B’s components are not resolved. Presets are fixed field reference coordinates, not continuously propagated source positions.

## Privacy

Coordinate searches and file paths are transmitted to Vercel and NASA/IPAC IRSA. Notes and review markers remain in the browser tab until exported. This app requires no user account and contains no advertising analytics or external AI inference calls.

## Sources and attribution

The authoritative challenge is https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/.

Data services and documentation: https://irsa.ipac.caltech.edu/Missions/spherex.html, https://irsa.ipac.caltech.edu/ibe/sia.html, https://caltech-ipac.github.io/irsa-tutorials/spherex/.

Reference coordinates: SIMBAD/CDS and the challenge’s WISE 0855 coordinates. The test fixture originates from DR1 observation 2025W34_2B_0090_4, detector 2, processing l2b-v27-2026-229. It retains the source scientific headers and selected extensions.

SPHEREx is a joint JPL/Caltech mission funded by NASA. Its data are served by NASA/IPAC IRSA. This independent educational interface does not imply NASA endorsement.

## Project resources

See [Start Here](START-HERE.md) for the full folder guide, [credits](docs/CREDITS.md) for sources and tools, and [the seven-slide walkthrough](resources/presentations/Asterlight-User-Guide.pptx) for usage instructions.

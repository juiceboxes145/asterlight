# Asterlight demonstration — 2026 Planet X and SPHEREx

Allow about five minutes. Open https://asterlight-observatory.vercel.app/.

1. Introduce the problem: the same patch of sky can look different at different times, but instruments and wavelengths can also cause differences. Asterlight lets the public compare SPHEREx observations and preserve enough context to investigate.
2. Open the Sky explorer. Explain that the opening Barnard’s Star sequence is a saved sample of real NASA data, with an explicit retrieval date. Point to a frame’s observing date and DR1 or QR3 label.
3. Press Play, then Pause. Step between observations. Dates are irregular even though playback steps are equally spaced. North is up and east is left for every frame.
4. Inspect the metadata: the wavelength at field center changes between exposures. Keep shared brightness scale enabled. Purple areas are suspect pixels masked using the source quality flags; dark empty edges have no valid coverage.
5. Set a frame as reference A. Select another frame and use Blink A / B. Try Similar wavelength only. If there are no other matching frames in the saved sample, explain that limitation rather than implying a comparison exists.
6. Try Difference. Disjoint central bandpasses are rejected with an explanation. Overlapping bands permit a median-background-subtracted visual difference. This does not establish a variable source, moving object, or planet.
7. Choose another of the five challenge targets or enter decimal/sexagesimal coordinates. Click Find observations. The live service may take 20–60 seconds. If it fails, show the error and use Load saved Barnard example; do not describe saved data as a successful live query.
8. If the live search succeeds, set a date range and load it. Explain that up to 24 exposures are sampled across the range and that failed cutouts are reported.
9. Mark a point in the sky image, add an observing note, and download the observation log. Show that the export contains sky coordinates, observing dates, wavelengths, original FITS links, quality metadata, failures, and the note.
10. Close with the complete project brief: this is a tool for the 2026 Planet X and SPHEREx image-sequence challenge. The next step after noticing a candidate change is scientific follow-up using the source data.

Do not claim that WISE 0855 must be visible, that Epsilon Indi B’s components are resolved, that image brightness alone measures variability, or that a marker is an automated detection. The interface deliberately shows those distinctions.

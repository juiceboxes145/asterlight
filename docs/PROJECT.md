# Asterlight — SPHEREx through time

## 1. Project summary

Asterlight is a public web observatory for exploring how a patch of infrared sky changes between SPHEREx observations. A visitor enters right ascension and declination, chooses a field size and detector, and watches real mission exposures on a common sky grid. Frame dates, wavelengths, coverage, and quality information stay visible alongside the images.

The project addresses the **2026 NASA Space Apps challenge, Planet X and SPHEREx**. Its central workflow is sky-image comparison across observing dates. It is an independent educational project, not an official NASA product or a claim of discovering a new object.

The problem is practical: an archive contains scientific images and extensive metadata, but comparing a sequence requires data access, coordinate alignment, image display, and attention to instrumental differences. Asterlight brings those steps into one browser workflow and gives a curious observer a record they can take to a more detailed investigation.

## 2. Demo and project links

- [Live sky explorer](https://asterlight-observatory.vercel.app/)
- [Complete project brief](https://asterlight-observatory.vercel.app/project.html)
- [Official 2026 challenge](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/)
- [Demo script](DEMO-SCRIPT.md)
- [Developer setup and reproducibility](../README.md)

The opening Barnard’s Star example contains saved, real SPHEREx observations. It is explicitly labeled as a fixed sample, with its retrieval date. It is available immediately even when IRSA is busy. **Find observations** starts a live archive query; it never silently substitutes another target or synthetic images.

A short demonstration starts by playing this saved sequence, checking a frame’s central wavelength, selecting a reference A, and using Blink A / B. Then a visitor enters coordinates, runs a live search, filters the observing dates, marks a position worth reviewing, and exports the observation log.

## 3. The experience

### Search a patch of sky

Right ascension accepts decimal degrees or hours/minutes/seconds. Declination accepts decimal degrees or signed degrees/minutes/seconds. Inputs are validated before archive requests. Search links preserve coordinates, detector, and field size so another person can open the same field.

Users can choose square fields of 2, 4, 8, 12, or 20 arcminutes and any of SPHEREx’s six detectors. Each detector covers a wavelength range; an individual image pixel samples a narrower band within it. The app displays the approximate wavelength and bandwidth at the field center for each loaded exposure.

### Start with the challenge’s named targets

The selector includes Barnard’s Star, Epsilon Indi B, WISE 0855, RW Aurigae, and R Draconis. Coordinates are fixed reference field centers. They are not automatically propagated positions at every observation date. Barnard’s Star uses a wider 12-arcminute field to include its motion since the reference epoch. WISE 0855 starts with the longer-wavelength detector D6.

These presets are investigation starting points, not guaranteed detections. Epsilon Indi B’s two components are not resolved in this viewer. WISE 0855 may not be visible in an individual exposure. A variable source’s apparent brightness can also depend on the sampled wavelength and instrument response.

### Play, compare, and keep evidence

Sequence playback steps through individual exposures in chronological order. The timeline and thumbnails support direct frame selection. Playback can be paused, stepped, or slowed down. Dates remain visible because the interval between exposures is irregular; equal playback time does not mean equal elapsed observing time.

Blink A / B alternates the selected frame with a reference chosen by the observer. A similar-wavelength filter keeps loaded images within 0.03 micrometers of that reference. Difference mode subtracts reference A from the selected frame only when their central bandpasses overlap. It removes each image’s median background before subtraction and labels positive and negative residuals with different colors.

An observer can mark a position, write a note, save the displayed image, or export a JSON observation log containing field settings, metadata, source links, failed-frame information, and the note. A marker is a selected sky coordinate, not an automatically detected object.

## 4. Data and methodology

### Archive discovery

The server queries NASA/IPAC IRSA’s documented Simple Image Access service for the SPHEREx DR1 and QR3 collections. It searches image footprints around the requested coordinate, selects the requested detector, removes duplicate observation/detector entries with preference for DR1, and sorts by observation time. If one collection fails, the result clearly reports partial coverage. A failed request is not treated as evidence that the sky contains no objects.

The user can limit the date range. Up to 24 exposures are sampled across it, preserving the earliest and latest selected records. This limits network traffic and keeps the interface responsive. It is a visual sample, not a complete time series. Extremely large archive results are limited to 1,500 evenly sampled records and marked accordingly.

### Image access and alignment

Each selected observation is retrieved using IRSA’s spatial FITS cutout service. The server reads the calibrated IMAGE extension, pixel FLAGS, and the WCS-WAVE lookup table. It preserves the original cutout URL so users can inspect the source product.

All displayed frames use the same 128 × 128 ICRS tangent-plane grid, with north up and east left. The implementation converts each display pixel to a sky coordinate, inverts the source image’s TAN-SIP registration, and bilinearly samples the science image. The display grid is a resampling choice; it does not increase the instrument’s angular resolution. Areas without valid source coverage remain blank.

The approximate wavelength and bandwidth at the requested center are interpolated from the product’s spectral WCS table. These are center values, not a constant wavelength for every pixel in the field. Observation dates come from observing metadata, not the later file-processing date.

### Pixel quality and display

The mask excludes display pixels whose contributing source pixels carry selected problematic flags, including missing data, unusable or hot/cold pixels, overflow, nonlinear response, persistence, and known artifacts. SOURCE and FULLSAMPLE are not considered invalid flags. Purple areas identify masked data; blank dark areas identify missing coverage. Quality counts refer to the original cutout, while the masked fraction refers to the display grid.

Images use a percentile-based asinh display stretch. By default, loaded frames share a brightness scale. A per-frame scale and contrast adjustment are available for exploration. Zodiacal background is not removed from the ordinary images. Difference mode removes a median background but does not match point-spread functions, perform calibrated photometry, or normalize the spectral response.

### Reliability and privacy

Archive queries and cutouts pass through bounded Vercel functions. Only validated SPHEREx DR1 / QR3 file paths can be requested; arbitrary upstream URLs and path traversal are rejected. Upstream requests have time and size limits, transient errors get one bounded retry, and the browser limits concurrent cutout requests. Successful responses can be cached. Users can cancel loading and retry failed frames.

Field coordinates and image requests are sent to Vercel and NASA/IPAC IRSA. Observation notes and review markers stay in the browser tab until the user downloads them. No account, advertising tracker, or external AI service is required.

## 5. Validation and limitations

The automated suite checks coordinate units and boundaries, RA wraparound, tangent projection behavior, real FITS parsing, quality masks, chronological sampling, wavelength restrictions for subtraction, archive metadata parsing, and API input validation.

Spatial registration and center wavelengths are checked against independently generated Astropy 8.0.2 outputs from a real SPHEREx cutout. On those reference points, the spatial results agree within 0.00002 pixel and the spectral results within 0.0000001 micrometer. This is a numerical regression check, not a claim of equivalent astrometric accuracy for an astronomical source.

The test fixture is a reduced copy of an actual DR1 product with IMAGE, FLAGS, and WCS-WAVE extensions. Tests do not require the live archive. A separate target-verification script exercises current archive searches and one cutout for each of the five target presets, recording successes, empty coverage, partial responses, or failures without inventing results.

The November 15, 2026 verification retrieved usable real images for all five named targets. One Barnard’s Star query had partial release coverage because DR1 was temporarily unavailable; the other four checks returned without a collection warning. [The machine-readable verification record](https://asterlight-observatory.vercel.app/data/verification.json) preserves these results. Upstream availability can change after a successful check.

Important limits: archive coverage and service availability vary; exposures are sampled; matched central bands do not guarantee matched wavelengths across the whole field; masks can hide real source pixels; detector edges and artifacts can resemble changes; and the viewer does not model proper motion, fit source centroids, subtract a PSF, or establish a discovery. It is a first-look tool for deciding what deserves closer inspection.

No machine-learning model makes astronomical decisions in this version. AI-assisted software development helped produce the code and documentation; the scientific display uses explicit archive queries, coordinate transformations, masks, and image arithmetic. A successful display or bright residual is not a planet classification.

## 6. Challenge alignment and impact

The 2026 brief’s central requirement is a public tool that accepts sky coordinates and displays SPHEREx images of that location as a time sequence. Asterlight implements that workflow directly, with a dedicated observing interface and the five named target presets.

The implementation also addresses several optional considerations: adjustable field size, current DR1 / QR3 archive discovery, shareable coordinate URLs, quality information, and image subtraction. Central wavelength labels and a wavelength filter help users avoid treating spectral changes as time variability.

Full spectral extraction, band coaddition, external Gaia/WISE overlays, a citizen-science classification backend, and automatic moving-object detection are future extensions. They are not presented as existing capabilities. The current scope prioritizes an understandable and inspectable image sequence.

Students can learn what an astronomical observation contains, educators can demonstrate why image context matters, and interested members of the public can record candidate changes for follow-up. The intended outcome is better observation and documentation, rather than an unsupported claim of identifying Planet X.

## 7. Sources and acknowledgements

- [2026 Planet X and SPHEREx challenge](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/) — the project’s objectives and named target list.
- [NASA/IPAC IRSA SPHEREx archive](https://irsa.ipac.caltech.edu/Missions/spherex.html) — mission products, release information, and archive tools.
- [SPHEREx data-access documentation](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/) — public collections and access methods.
- [IRSA SIA service](https://irsa.ipac.caltech.edu/ibe/sia.html) — spatial queries and collection filtering.
- [IRSA spectral-image tutorial](https://caltech-ipac.github.io/irsa-tutorials/spherex-intro/) — scientific extensions, spatial and spectral WCS, and quality flags.
- [IRSA cutout tutorial](https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts/) — spatial cutouts and metadata interpretation.
- [SIMBAD astronomical database](https://simbad.cds.unistra.fr/simbad/) — fixed reference coordinates for the stellar presets. WISE 0855 uses the coordinates in the challenge brief.
- [Astropy WCS documentation](https://docs.astropy.org/en/stable/wcs/) — independent reference calculations used in verification.

This project uses SPHEREx data products from the joint Jet Propulsion Laboratory and California Institute of Technology mission, funded by NASA, and served by NASA/IPAC IRSA. It also uses reference information from SIMBAD, operated at CDS, Strasbourg. Data remain attributed to their original providers; Asterlight supplies the interface and documented processing.

Implementation: original HTML, CSS, JavaScript, a FITS/WCS processing module, and Vercel Node.js functions. The source package includes the implementation, reproducible tests, a saved real-data example, and this write-up.

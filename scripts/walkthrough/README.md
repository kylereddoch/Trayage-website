# Homepage walkthrough — October 2026 edit

38 seconds, 1920 × 1080, 30 fps, H.264, silent. Publication approved October 29, 2026.

## Edit

- Nine scenes including the closing card; 3–5.5 seconds per scene instead of the earlier long holds.
- Glance and Quick Review appear as moving native app captures with sample data.
- Animated headline/detail entrances, panel transitions, focused camera moves, and chapter progress.
- Original app footage runs at 1–1.6× depending on the scene. The confirmation is shown; no completed move is claimed.
- `storyboard.json` supplies the renderer, generated captions, and homepage transcript. Edit copy there.
- The original `trayage-review-v1-1` export remains available; new filenames avoid stale video/poster caches.

## Sources

Run from the repository root on macOS with the Swift toolchain. AppKit and AVFoundation are provided by macOS; no third-party renderer is required.

These original recordings are local and excluded from Git:

- `output/demo-v1.1/raw/review.mov` — recorded Trayage 1.1, sample Downloads folder.
- `output/demo-v1.1/raw/confirmation.mov` — sample installer selection and confirmation, ending before a move.

Tracked image inputs:

- `public/assets/brand-violet/trayage-app-icon.png`
- `public/assets/product-views/menu-glance-dark.png`
- `public/assets/product-views/menu-quickReview-dark.png`

Native menu captures are labeled sample data and retain their Preview labels. They are not presented as recordings of interactions. The older-file clip ends before the suggestion disappears. The hide scene begins at 47 seconds in the source, includes its disappearance, and retains the full window for context.

## Render

```sh
mkdir -p output/walkthrough-2026-10-26
swiftc scripts/walkthrough/render.swift -o output/walkthrough-2026-10-26/render
output/walkthrough-2026-10-26/render --stills
output/walkthrough-2026-10-26/render
```

`--stills` writes nine review JPGs into `output/walkthrough-2026-10-26/` and the poster into `public/assets/media/`. The full render writes the MP4 and English VTT captions there under `trayage-walkthrough-2026-10`. The renderer refuses to overwrite an existing MP4; preserve or explicitly remove an earlier draft before rendering again.

Build the website after the render finishes so that the export and captions are copied together:

```sh
npm run build
node scripts/serve.mjs --port 4192
```

Review `http://127.0.0.1:4192/#walkthrough`. The comparison page uses the same export. Playback is user initiated, with no sound required and a text transcript on the homepage.

## Verified locally

- AVFoundation reports 38.0 seconds and one video track; export is silent.
- Chromium played the full export to the end with no media error and zero dropped frames in this run.
- Homepage and comparison player both load the 1920 × 1080 export and all nine caption cues.
- Nine scene previews and encoded frames inspected; 390 px mobile page has no horizontal overflow.
- Four existing root/subpath and light/dark accessibility tests passed. Website build and `git diff --check` passed.
- Detailed logs and screenshots: `output/walkthrough-2026-10-26/` (local, excluded from Git).
- Preview server now supports MP4 byte-range requests, allowing timeline scrubbing. Initial, suffix, and open-ended ranges plus unsatisfiable ranges were checked.

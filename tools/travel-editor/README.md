# Travel Post Workspace

A browser-only editor for a local Jekyll blog checkout. The interface uses the Nord palette. The `pic` and `map` tabs share the selected travel post.

## Run

Use a recent Chromium-based browser and Node.js 20.19+ or 22.12+. The editor includes its compiled EXIF module. All photo and file processing runs in the browser.

```sh
cd tools/travel-editor
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Choose **Open blog folder…**, select the checkout containing `assets/src` and `_posts/travel`, and grant read/write access. Select a post from the dropdown. `npm run build` builds the static tool into `dist/`, which can be served on localhost or HTTPS. Jekyll excludes the editor from the blog.

## Workflow

- **pic** scans `assets/src/<slug>/pic/` as you open a post. A new gallery starts in recorded capture-time order, with undated files last. An existing gallery retains its order and appends new files. **Import photos…** copies JPEGs and AVIFs into `pic/`, skipping duplicate filenames. Select an entry to edit its EXIF and gallery fields. Missing entries can be removed from the gallery.
- **Convert** compares the JPEG with the actual AVIF candidate, with configurable quality, speed, and chroma subsampling. Replacement writes and verifies the AVIF, updates the matching gallery entries and exact image path references in the post Markdown, and then permanently deletes the JPEG. Separate photo deletion removes it from the gallery and shows Markdown references that may need manual review.
- **map** edits named spots, visit-order paths, and GPX tracks. It can show photo positions using the same precedence as the blog. Use **Save map** to copy staged tracks into `track/` and write `map.json`. When removing a track, deleting its managed GPX file is optional.
- The map basemap uses OpenStreetMap tiles. The editor reads and writes photos and post files locally and uses no upload endpoint.

AVIF metadata-only editing supports still images with standard ISO BMFF item layouts. The editor verifies the edited metadata and image decoding before replacing a file. Save operations check for external JSON changes, and photo and GPX deletion use the browser's permanent file removal API.

To rebuild the checked-in EXIF module after changing `codec/`, install [Rust](https://rustup.rs/), run `rustup target add wasm32-unknown-unknown`, then run `npm run codec`.

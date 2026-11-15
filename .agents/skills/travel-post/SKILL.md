---
name: travel-post
description: Use when creating, resuming, or reviewing a travel post in this blog, including when the author has added photos or GPX tracks and wants to continue the post.
---

# Travel post workflow

Start with the publication date and destination or trip topic. For an ongoing post, use the slug to find its Markdown, assets, and configuration. Photos, day-by-day stops, GPX tracks, and the author's notes can arrive in stages. Complete the steps the available inputs support and tell the author what is still needed and where to put it.

## 1. Create the post

Use the publication date in the filename and record actual travel dates separately when provided. Use the author's title and subtitle if available. Ask for the publication date if it cannot be determined from the available information. Look at similar posts before proposing a title or slug. Create `_posts/travel/YYYY-MM-DD-<slug>.md`. Use the same slug for its asset directory. For example, `2026-11-07-a-cycle-travel-at-mizumoto.md` uses `a-cycle-travel-at-mizumoto`.

Set `layout: post/travel`, `title`, and `tags: 旅行`. Add `subtitle` and other tags as appropriate. Put known trip details under `travel.time`, `travel.people`, `travel.cost`, `travel.transport`, and `travel.distance`. Each entry uses `text` and can include `note`. Set `cover` once the photo is available. Write the travel notes in the Markdown body. The layout supplies the Routes, Scenery, and Summary headings.

## 2. Set up the asset directory

Create `pic/` under `assets/src/<slug>/`. Create `track/` if the post will use GPX tracks. Add `pic.json` and `map.json` at the asset directory root in step 4. When resuming an existing post, follow its actual directory and naming conventions.

```text
_posts/travel/YYYY-MM-DD-<slug>.md
assets/src/<slug>/
  pic/       Exported photos
  track/     Exported GPX tracks, if any
  pic.json   Gallery entries
  map.json   Map configuration
```

## 3. Collect the exported assets

The author selects and edits photos, exports them with EXIF capture time and any GPS they want shown on the map, and places the exports in `pic/`. Collect any cover choice and known photo locations. For the map, use the author's stops in visit order, grouped by day when provided. If the author exports GPX files, collect the tracks and their transport modes.

## 4. Configure the map and gallery

Build or update the JSON from the actual files. Preserve confirmed order, text, and metadata when updating existing entries. See [Photo and map features](../../../docs/photo-and-map.md) for field definitions and examples.

- Keep the exported photo filenames and rename files only when the author explicitly asks. Follow the author's order when specified. Otherwise, order the entries in `pic.json` from earliest to latest by EXIF capture time. Set each `src` to the actual filename. Fill in `loc` and `title` from known information. Use `[]` if there are no photos. Set `cover` to the selected image path, or suggest candidates if the author has yet to choose one.
- If a photo lacks a usable EXIF capture time and its place in the gallery order is unclear, identify it by filename and ask the author to replace it or provide an approximate capture time. Use the author's estimate to place it in the gallery order.
- Include at least one confirmed `spot` in `map.json`, using `[latitude, longitude]`. Use existing coordinates or a reliable map source. Ask the author about ambiguous locations. Each `path` subarray lists the stops of one section in order, and each name must match a `spot` key exactly. Group actual GPX files under `track` by transport mode, such as `🚴` or `🚃`. Omit `path` or `track` when the post has no corresponding data. Route lines use GPX `trkseg` and `trkpt` elements.
- Use site-root-relative URLs for photos, covers, and tracks, such as `/assets/src/<slug>/pic/IMG_9035.avif`. Photo markers use GPS from the original image or confirmed `exif.latitude` and `exif.longitude` values. `loc` supplies display text.
- Jekyll generates `assets/json/maps.json` and `assets/json/album.json`. Edit `assets/json/spots.json` only when adding an independent footprint entry.

## 5. Write the travel notes

Work from the author's draft, fragments, or notes. Follow their requested level of editing. Base experiences, impressions, dialogue, durations, and costs on details supplied by the author. Use route and photo data to check place names, chronology, and references. Verify uncertain external details, such as weather events or transport disruptions, when they matter to the text. Flag details that require the author's confirmation.

Use a Markdown link such as `[晚霞](#gallery-7)` to direct readers to an inline photo. The number is one-based and follows the display order in `pic.json`. Check existing links if the gallery is reordered.

When reviewing a draft, preserve the author's written register, narrative order, and deliberate turns of phrase. Focus on word choice and collocation, repetition, unclear references, and factual accuracy. Present each proposed edit in the format **原句 + 建议 + 原因**, quoting the original text, giving a specific replacement, and briefly explaining why it helps. Leave the author to choose which suggestions to apply unless they request direct edits.

## 6. Review the post

Review the diff for this post. Check that the post and asset slugs agree and that `cover`, `src`, optional `preview` and `thumb`, and GPX paths resolve with the correct case. Parse both JSON files. Check stop references, coordinate order, photo order, and whether the GPX files contain renderable segments. Review internal links, place names, chronology, and trip details in the text. Check that each `#gallery-N` link points to the intended photo.

Run `bundle exec jekyll build`, or `bundle exec jekyll build --unpublished` for a draft. Open the local preview and check the cover, map markers, tracks by transport mode, section switching, gallery, and narrative. If there are geotagged photos, enable the photo layer and select a photo to check that it opens the matching gallery position. When reviewing site-wide listings, check that the album index and footprint page link to the post.

Report the post and configuration paths, which checks ran, and what still needs the author's confirmation.

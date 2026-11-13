# Sass architecture

`assets/main.scss` is the only compiled stylesheet entry. Jekyll resolves its modules from `_sass/` and emits `assets/main.css` and its source map. Pico and other third-party stylesheets are loaded separately by `_includes/head.html`; this tree contains the site's adaptations and custom styles.

## Layers and ownership

| Directory | Responsibility | Examples |
| --- | --- | --- |
| `abstracts/` | Sass variables and mixins; emits no CSS on its own | Breakpoints, input capabilities, interaction feedback |
| `base/` | Global defaults, native elements, article typography, Pico theme mapping | Root defaults, code, figures, heading counters |
| `layout/` | Site-wide and template-level structure | Page widths, site header, post hero and navigation |
| `components/` | Independent interface or content units | Cards, dialogs, callouts, footnotes |
| `features/` | Complete functionality composed of several cooperating parts | Photo browsing, maps, travel-map layers |
| `pages/` | Page-specific composition and page-type styles | Home article list, books, profile, archive, footprint dashboard, travel article sections |
| `utilities/` | Small helpers that emit CSS | Accessibility, attribute decorations, typography, lists |

Archive tag chips, their count/color/interaction states, the tag cloud, and the article timeline live together in `pages/_archive.scss`: these selectors serve only the archive page. Home and article templates render tags as breadcrumb links and do not use these chip styles.

Home article cards (`.post-card`, `.post-cover`, and `.post-header` with its title, note, and metadata) and pagination (`.post-paginator`) live together in `pages/_home.scss`. Only `_layouts/home.html` renders these elements, including subsequent list pages. The home module imports the shared card mixin from `components/card`; general card styles remain in `components/`.

Ownership follows responsibility rather than the first page that uses a style. A photo timeline remains part of the photo feature because summary posts use it too. Footprint statistics, journey tickets, filters, map/detail composition, and recent journeys belong together under the footprint page. A component can have a single current consumer if its responsibility is independent.

These are source-code ownership layers, not CSS `@layer` declarations. Introducing cascade layers would change precedence and is outside this refactor.

## Naming rules

- Use lowercase English and kebab-case for directories and files.
- Every file in `_sass/` is a partial named `_name.scss`; only `assets/main.scss` is a compilation entry.
- Name components after their independent unit, usually singular (`_card.scss`, `_modal.scss`). Use established collection names where appropriate (`_footnotes.scss`, `_koboyo-icons.scss`).
- Name page files after the page or page type (`_books.scss`, `_profile.scss`, `_archive.scss`, `_travel.scss`).
- Let directories supply context: `features/map/_maximize.scss`, not `_map-maximize.scss`.
- Describe a file's concrete responsibility. Avoid catch-all `custom`, `common`, `misc`, and module-local `base` files.
- Reserve `_index.scss` for `@forward` aggregation only; put selectors, variables, functions, and mixins in named modules.
- Omit the leading underscore and `.scss` extension in `@use` and `@forward`. Use explicit namespaces for Sass helpers, such as `@use "../abstracts" as utils`.
- Preserve existing CSS selectors and HTML/JavaScript contracts when moving files. Filesystem naming does not require renaming classes.

## Directory tree

```text
assets/main.scss                   Compilation entry and layer order
_sass/
  abstracts/
    _index.scss                    Helper exports; no CSS output
    _breakpoints.scss              Thresholds and complementary media mixins
    _interaction.scss              Input capabilities, hover, press, focus
    _utility-control.scss          Shared navigation/floating-button mixin
    _decoration-icon.scss          Attribute decoration icon mixin
  base/
    _index.scss                    Layer aggregation
    _pico-theme.scss               Site palette to Pico variable mappings
    _defaults.scss                 Root typography, tokens, HTML behavior
    _elements.scss                 Links, math, code, ruby
    _media.scss                    Tables, figures, captions, embedded frames
    _view-transitions.scss         Cross-document transition opt-in
    _article-content.scss          Article heading counters and body animation
  layout/
    _index.scss                    Layer aggregation
    _page.scss                     Footer alignment, page widths, main container
    _site-header.scss              Brand, navigation, responsive menu
    post/
      _index.scss                  Post structure aggregation
      _hero.scss                   Cover header
      _metadata.scss               Article metadata line
      _navigation.scss             Previous/next article links
  components/
    _index.scss                    Layer aggregation
    _breadcrumb.scss               Breadcrumb alignment and separator
    _callout.scss                  Blockquote defaults and tip/info/warn/error
    _card.scss                     Card classes and card mixins
    _floating-controls.scss        Fixed utility button group
    _footnotes.scss                Footnote section
    _koboyo-icons.scss             Local SVG masks and icon variants
    _literature.scss               Literary quotation blocks
    _modal.scss                    Native dialog transitions and scroll lock
    _post-toc.scss                 Article contents disclosure
    _site-cursor.scss              Custom cursor appearance
  features/
    _index.scss                    Layer aggregation
    map/
      _index.scss                  Shared and travel map aggregation
      _leaflet.scss                Leaflet compatibility overrides
      _maximize.scss               Expanded map overlay and controls
      travel/
        _index.scss                Travel map aggregation
        _photos.scss               Photo markers, popups, status
        _container.scss            Embedded travel map dimensions
        _layer-controls.scss       Layer groups and native inputs
        _stop-markers.scss         Numbered route-stop markers
    photo/
      _index.scss                  Photo feature aggregation
      _preview.scss                Shared preview mixin and fullscreen hint
      _gallery.scss                Inline travel gallery and responsive stage
      _lightbox.scss               lightGallery viewer, metadata and controls
      album/
        _index.scss                Album aggregation
        _thumbnails.scss           Shared grid, cards, captions, status
        _collection.scss           Collection layout and ordering controls
        _device-dialog.scss        Devices overview dialog
        _timeline.scss             Monthly chart, filters and date grouping
  pages/
    _index.scss                    Layer aggregation
    _home.scss                     Home/paginated article cards and navigation
    _archive.scss                  Tag chips, tag cloud and archive article timeline
    _books.scss                    Books page and reading shelves
    _profile.scss                  Profile page sections
    _travel.scss                   Travel article headings and information
    footprint/
      _index.scss                  Footprint page aggregation
      _dashboard.scss              Dashboard defaults
      _journeys.scss               Recent journeys and responsive grid
      _ticket.scss                 Journey ticket and compact variant
      _filters.scss                Date filter, reset and statistics
      _map.scss                    Map/detail layout and residence markers
      _detail-panel.scss           Selected location, visits and records
      _clusters.scss               Marker cluster colors and counts
  utilities/
    _index.scss                    Layer aggregation
    _breakpoints.scss              Exports Sass thresholds as CSS variables
    _decorations.scss              Ribbon and mark/edit/heart attributes
    _typography.scss               Drop caps, small capitals, captions
    _outline.scss                  Attribute-based outlined content box
    _lists.scss                    Item and tree list attributes
    _accessibility.scss            Shared visually-hidden class
```

## Dependencies and CSS order

`abstracts/_index.scss` exports reusable Sass APIs without emitting CSS. Most consuming modules import that API as `utils`. `utilities/_breakpoints.scss` separately emits the matching `--breakpoint-*` properties consumed by JavaScript. Keep those properties tied to the Sass variables.

Some component and feature modules intentionally export mixins alongside CSS: `components/_card.scss` provides card mixins to the home article cards in `pages/_home.scss`; `features/photo/_preview.scss` provides the preview interaction mixin and shared fullscreen hint to galleries and albums. Dependencies stay within their component/feature boundary or use `abstracts`; shared features do not import page composition.

`assets/main.scss` loads only directory entries, in this order:

```scss
@use "base";
@use "components";
@use "layout";
@use "features";
@use "pages";
@use "utilities";
```

1. **Base** establishes theme mappings, global defaults, native elements and article typography.
2. **Components** defines independent units and their default appearance.
3. **Layout** composes those units into site and article structures. It follows components so `.post-hero` retains its background override when combined with `.card`.
4. **Features** supplies map and photo modules, keeping each feature's internal dependency order.
5. **Pages** adds page-specific composition after shared components, layout and features. Profile quotation overrides follow the literature component; travel headings follow article heading numbering; footprint map sizing follows Leaflet defaults.
6. **Utilities** supplies explicit attribute/class helpers and exported breakpoint properties. Keep utility selectors narrowly scoped and check their interaction with components when adding a helper.

Each layer's `_index.scss` lists its modules explicitly with `@forward`. Feature and page indexes keep nested concerns together; no CSS-emitting module imports another CSS layer's aggregate entry. Modules consume only the specific helpers or mixins they need. `abstracts` remains a dependency of its consumers, not an extra CSS entry.

Sass emits each module once on its first load, including through `@forward`. Keep dependencies deliberate: a dependency that emits CSS can affect order. Do not alphabetize indexes without reviewing overrides. No leaf imports or historical interleaving belong in `main.scss`.

Directory aggregation changes rule order compared with the earlier per-file entry. Selectors, declarations, media/container conditions, animations and URLs remain unchanged; regression checks compare rule inventories and browser-computed styles rather than requiring byte-identical CSS.

## Choosing a file for a change

| Change | Location |
| --- | --- |
| Site/Pico theme mapping | `base/_pico-theme.scss` |
| Shared breakpoints or input behavior | `abstracts/`; CSS breakpoint export in `utilities/_breakpoints.scss` |
| Main width or header/menu | `layout/_page.scss`, `layout/_site-header.scss` |
| Article typography or template structure | `base/_article-content.scss`, `layout/post/` |
| Reusable content or interface unit | `components/` |
| Photo viewer, thumbnails or gallery | `features/photo/` |
| Shared map behavior or travel-map layers | `features/map/` |
| Footprint page composition and specialized map | `pages/footprint/` |
| Home article cards and pagination | `pages/_home.scss` |
| Page-specific sections | Matching file under `pages/` |
| Small attribute/class helper with CSS output | `utilities/` |

See [Photo and map features](photo-and-map.md) for the corresponding templates, scripts and interaction checks.

## Build and regression verification

```bash
bundle exec jekyll build --destination /tmp/blog-sass-site
bundle exec jekyll build --baseurl /sass-check --destination /tmp/blog-sass-baseurl-site
```

For a structural refactor, retain a baseline build before editing. Compare parsed CSS rule inventories (including enclosing media/container conditions and keyframes) to confirm that no selectors or declarations were added or lost. Byte comparison is useful when preserving exact rule order, but is not an acceptance requirement for directory aggregation.

Compare computed styles before and after changing the entry across home, books, profile, archive, footprint, album, travel, summary and ordinary article templates. Include narrow/wide viewports, light/dark themes, collapsed/expanded disclosures, and overlapping component/layout classes such as `.card.post-hero`. Freeze animations and transitions during comparisons so timing does not appear as a cascade difference. Test interactive photo/map states separately when changing their selectors or internal module order.

Source-map entries are relative to the source `assets/` directory and should resolve to existing files under `_sass/`; Jekyll includes source contents in the map. See [Photo and map features](photo-and-map.md) for functional checks.

The directory aggregation was checked across nine generated page templates at 390px and 1280px, in both themes and with disclosures collapsed/expanded (72 combinations). The browser compared 44 layout, color, typography and decoration properties on elements and their `::before`/`::after` pseudo-elements, including a `.card.post-hero` overlap probe; no differences were found. This isolated CSS-order check disabled page scripts, external stylesheets, images, animations and transitions (including `::details-content`) to keep the DOM and timing deterministic. It does not replace functional testing of dynamically populated photo/map views.

import L from 'leaflet';
import { readExif, samePoint, validPoint, type Point } from './images';
import { effectiveLocation, gpxSegments, type MapDocument, type Post, type TrackDraft } from './project';
import { button, confirmAction, control, makeMap, notice, pin, showError, textSpan } from './ui';

type Mode = 'spot' | 'path' | 'track';
type Run = (message: string, work: () => Promise<void>) => Promise<void>;
const trackColors: Record<string, string> = { '🚴': '#5e81ac', '🚶': '#51805d', '🚃': '#b46038', '🚗': '#8a5592' };

export class MapPanel {
  private mode: Mode = 'spot';
  private map: L.Map | null = null;
  private mapResize: ResizeObserver | null = null;
  private spotLayer = L.layerGroup();
  private trackLayer = L.layerGroup();
  private photoLayer = L.layerGroup();
  private selectedSpot: string | null = null;
  private spotBefore: { name: string; point: Point } | null = null;
  private pendingPinSelected = false;
  private activePath = -1;
  private spots: Map<string, Point>;
  private paths: string[][];
  private tracks: Map<string, string[]>;
  private imported = new Map<string, TrackDraft>();
  private removeFiles = new Set<string>();
  private photosVisible = false;
  private trackRevision = 0;
  private photoRevision = 0;

  constructor(private root: HTMLElement, private post: Post, private run: Run, private selectPhoto: (index: number) => void) {
    this.spots = new Map(Object.entries(structuredClone(post.map.spot ?? {})));
    this.paths = structuredClone(post.map.path ?? []);
    this.tracks = new Map(Object.entries(structuredClone(post.map.track ?? {})));
    this.activePath = this.paths.length ? 0 : -1;
    root.innerHTML = `
      <div class="panel-toolbar">
        <div><h2>Map</h2><p class="muted">Spots, visit order, and GPX tracks · map.json</p></div>
        <div class="actions"><label class="check"><input data-photo-layer type="checkbox">Show photo locations</label>
          <button type="button" data-fit>Fit map</button><button type="button" class="primary" data-save-map>Save map</button></div>
      </div>
      <div class="workspace map-workspace">
        <aside class="inspector">
          <div class="segmented" aria-label="Map action">
            <button type="button" data-mode="spot" aria-pressed="true">Spot</button>
            <button type="button" data-mode="path" aria-pressed="false">Path</button>
            <button type="button" data-mode="track" aria-pressed="false">Track</button>
          </div>
          <div class="form-stack" data-mode-panel="spot">
            <div class="section-heading"><h3>Spots</h3><button type="button" data-new-spot>New spot</button></div>
            <p class="muted">Click the map to place or reposition a new spot. Select a marker before dragging it.</p>
            <ol class="spot-list" data-spots></ol>
            <p class="muted" data-spots-empty hidden>No saved spots.</p>
            <div class="form-stack edit-card" data-spot-form hidden>
              <label>Name<input data-spot-name type="text" required></label>
              <div class="field-row">
                <label>Latitude<input data-spot-lat type="number" step="any" min="-90" max="90"></label>
                <label>Longitude<input data-spot-lon type="number" step="any" min="-180" max="180"></label>
              </div>
              <div class="actions"><button type="button" class="primary" data-apply-spot>Apply spot</button>
                <button type="button" class="danger" data-delete-spot>Delete spot…</button></div>
            </div>
          </div>
          <div class="form-stack" data-mode-panel="path" hidden>
            <div class="section-heading"><h3>Itinerary sections</h3><button type="button" data-new-path>New path</button></div>
            <p class="muted">Select a path, then click spots in visit order. Drag the path handles to reorder sections.</p>
            <ol class="path-list" data-paths></ol>
            <div class="form-stack edit-card" data-path-editor hidden>
              <h4>Visit order</h4>
              <ol class="stop-list" data-stops></ol>
              <button type="button" class="danger" data-delete-path>Delete selected path</button>
            </div>
          </div>
          <div class="form-stack" data-mode-panel="track" hidden>
            <h3>Recorded tracks</h3>
            <label>Transport<select data-transport aria-label="Transport">
              <option value="🚴">🚴 Cycling</option><option value="🚶">🚶 Walking</option>
              <option value="🚗">🚗 Driving</option><option value="🚃">🚃 Train</option>
            </select></label>
            <label class="file-button">Import GPX… <input type="file" data-gpx accept=".gpx,application/gpx+xml" multiple></label>
            <p class="muted">Imported tracks are copied to <code>track/</code> when you save.</p>
            <ul class="track-list" data-tracks></ul>
          </div>
        </aside>
        <div class="visual map-visual">
          <div class="leaflet-view travel-map" data-map-view aria-label="Travel map"></div>
          <div class="map-legend"><span><i class="spot-dot"></i>Spot</span><span><i class="photo-dot"></i>Photo</span><span><i class="track-dot"></i>GPX track</span></div>
        </div>
      </div>`;
    this.$('[data-fit]').addEventListener('click', () => this.fit());
    this.$('[data-save-map]').addEventListener('click', () => void this.save());
    this.$('[data-photo-layer]').addEventListener('change', () => {
      this.photosVisible = this.input('[data-photo-layer]').checked;
      void this.refreshPhotos();
    });
    for (const mode of ['spot', 'path', 'track'] as const) {
      this.$(`[data-mode="${mode}"]`).addEventListener('click', () => void this.changeMode(mode));
    }
    this.$('[data-new-spot]').addEventListener('click', () => void this.requestSpot(null));
    this.$('[data-apply-spot]').addEventListener('click', () => {
      try { this.applySpot(); } catch (error) { showError(error); }
    });
    this.$('[data-delete-spot]').addEventListener('click', () => void this.deleteSpot());
    this.$('[data-new-path]').addEventListener('click', () => {
      this.activePath = this.paths.push([]) - 1;
      this.renderPaths();
      this.drawSpots();
    });
    this.$('[data-delete-path]').addEventListener('click', () => {
      if (this.activePath < 0) return;
      this.paths.splice(this.activePath, 1);
      this.activePath = Math.min(this.activePath, this.paths.length - 1);
      this.renderPaths();
      this.drawSpots();
    });
    this.$('[data-gpx]').addEventListener('change', () => {
      const input = this.input('[data-gpx]');
      const files = Array.from(input.files ?? []);
      input.value = '';
      if (files.length) void this.importTracks(files);
    });
    this.renderSpots();
    this.renderPaths();
    this.renderTracks();
  }

  private $<T extends HTMLElement = HTMLElement>(selector: string): T { return control<T>(this.root, selector); }
  private input(selector: string): HTMLInputElement { return this.$(selector); }

  visible() {
    if (!this.map) {
      const container = this.$('[data-map-view]');
      this.map = makeMap(container);
      this.mapResize = new ResizeObserver(() => {
        if (container.clientWidth && container.clientHeight) this.map?.invalidateSize({ pan: false });
      });
      this.mapResize.observe(container);
      for (const layer of [this.trackLayer, this.spotLayer, this.photoLayer]) layer.addTo(this.map);
      this.map.on('click', ({ latlng }: L.LeafletMouseEvent) => {
        if (this.mode === 'spot') void this.requestSpot(null, [latlng.lat, latlng.wrap().lng]);
      });
      this.drawSpots();
      void this.refreshTracks(true);
    }
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  destroy() {
    this.trackRevision += 1;
    this.photoRevision += 1;
    this.mapResize?.disconnect();
    this.map?.remove();
  }

  private async changeMode(mode: Mode) {
    if (mode === this.mode) return;
    if (this.spotFormDirty() && !(await this.discardSpot())) return;
    this.closeSpotForm();
    this.mode = mode;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    }
    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-mode-panel]')) {
      panel.hidden = panel.dataset.modePanel !== mode;
    }
    this.drawSpots();
  }

  private drawSpots() {
    if (!this.map) return;
    this.spotLayer.clearLayers();
    const visits = this.paths[this.activePath] ?? [];
    let number = 0;
    for (const [name, point] of this.spots) {
      number += 1;
      const indexes = this.mode === 'path' ? visits.flatMap((stop, index) => stop === name ? [String(index + 1)] : []) : [];
      const selected = this.mode === 'spot' && this.selectedSpot === name;
      const marker = L.marker(point, {
        draggable: selected,
        icon: pin(indexes.join('·') || (this.mode === 'path' ? '•' : String(number)), 'spot', selected),
        title: name, alt: name, zIndexOffset: this.mode === 'track' ? 0 : 1000,
      }).addTo(this.spotLayer);
      marker.bindTooltip(textSpan(name));
      marker.on('click', () => {
        if (this.mode === 'path') {
          if (this.activePath < 0) this.activePath = this.paths.push([]) - 1;
          this.paths[this.activePath].push(name);
          this.renderPaths();
          this.drawSpots();
        } else if (this.mode === 'spot') void this.requestSpot(name);
      });
      marker.on('dragend', () => {
        const point = marker.getLatLng().wrap();
        const next: Point = [point.lat, point.lng];
        this.spots.set(name, next);
        if (this.selectedSpot === name && this.spotBefore) {
          this.spotBefore.point = next;
          this.setSpotPoint(next);
        }
      });
    }
    if (this.spotBefore && this.selectedSpot === null && this.mode === 'spot') {
      const point = this.spotFromFields(false) ?? this.spotBefore.point;
      const marker = L.marker(point, {
        icon: pin('+', 'pending', this.pendingPinSelected), title: 'New spot',
        draggable: this.pendingPinSelected, zIndexOffset: 1500,
      }).addTo(this.spotLayer);
      marker.on('click', () => {
        if (this.pendingPinSelected) return;
        this.pendingPinSelected = true;
        this.drawSpots();
      });
      marker.on('dragend', () => {
        const next = marker.getLatLng().wrap();
        this.setSpotPoint([next.lat, next.lng]);
      });
    }
  }

  private setSpotPoint(point: Point) {
    this.input('[data-spot-lat]').value = String(point[0]);
    this.input('[data-spot-lon]').value = String(point[1]);
  }

  private spotFromFields(required: boolean): Point | null {
    const lat = this.input('[data-spot-lat]');
    const lon = this.input('[data-spot-lon]');
    const point = [lat.valueAsNumber, lon.valueAsNumber];
    if (validPoint(point)) return point;
    if (required) throw new Error('Enter both coordinates within latitude ±90 and longitude ±180.');
    return null;
  }

  private spotFormDirty() {
    if (!this.spotBefore) return false;
    const point = this.spotFromFields(false);
    return this.selectedSpot === null || this.input('[data-spot-name]').value !== this.spotBefore.name
      || !samePoint(point, this.spotBefore.point);
  }

  private async discardSpot() {
    return (await confirmAction({
      title: 'Discard spot fields?', body: 'Apply the spot to keep its pending name or coordinates.', action: 'Discard fields',
    })).accepted;
  }

  private async requestSpot(name: string | null, coordinates?: Point) {
    if (name === null && this.selectedSpot === null && this.spotBefore) {
      if (coordinates && validPoint(coordinates)) {
        this.pendingPinSelected = false;
        this.setSpotPoint(coordinates);
        this.drawSpots();
      }
      return;
    }
    if (name !== null && name === this.selectedSpot) {
      this.input('[data-spot-name]').focus();
      return;
    }
    if (this.spotFormDirty() && !(await this.discardSpot())) return;
    const center = this.map?.getCenter().wrap();
    const point = coordinates ?? (name === null ? [center?.lat ?? 35.68, center?.lng ?? 139.77] : this.spots.get(name));
    if (!point || !validPoint(point)) return;
    this.selectedSpot = name;
    this.pendingPinSelected = false;
    this.spotBefore = { name: name ?? '', point };
    this.input('[data-spot-name]').value = name ?? '';
    this.setSpotPoint(point);
    this.$('[data-spot-form]').hidden = false;
    this.$('[data-delete-spot]').hidden = name === null;
    this.renderSpots();
    this.drawSpots();
    if (name && !this.map?.getBounds().contains(point)) this.map?.panTo(point);
    this.input('[data-spot-name]').focus();
  }

  private closeSpotForm() {
    this.pendingPinSelected = false;
    this.spotBefore = null;
    this.selectedSpot = null;
    this.$('[data-spot-form]').hidden = true;
    this.renderSpots();
  }

  private applySpot() {
    if (!this.spotBefore) return;
    const name = this.input('[data-spot-name]').value.trim();
    const point = this.spotFromFields(true)!;
    if (!name || (name !== this.selectedSpot && this.spots.has(name))) throw new Error('Enter a unique spot name.');
    if (this.selectedSpot && name !== this.selectedSpot) {
      this.spots = new Map([...this.spots].map(([old, position]) => [old === this.selectedSpot ? name : old, position]));
      this.paths = this.paths.map(section => section.map(stop => stop === this.selectedSpot ? name : stop));
    }
    this.spots.set(name, point);
    this.selectedSpot = name;
    this.spotBefore = { name, point };
    this.input('[data-spot-name]').value = name;
    this.$('[data-delete-spot]').hidden = false;
    this.renderSpots();
    this.renderPaths();
    this.drawSpots();
    notice('');
  }

  private async deleteSpot() {
    const spot = this.selectedSpot;
    if (!spot) return;
    const affected = this.paths.flatMap((path, index) => path.includes(spot) ? [String(index + 1)] : []);
    const body = `Remove ${spot} from this map?` + (affected.length
      ? ` Paths ${affected.join(', ')} will lose this stop. Paths left empty will be removed.` : '');
    if (!(await confirmAction({ title: 'Delete spot?', body, action: 'Delete spot' })).accepted) return;
    this.spots.delete(spot);
    this.paths = this.paths.map(path => path.filter(stop => stop !== spot)).filter(path => path.length);
    this.activePath = Math.min(this.activePath, this.paths.length - 1);
    this.closeSpotForm();
    this.renderPaths();
    this.drawSpots();
  }

  private renderSpots() {
    const list = this.$('[data-spots]');
    list.replaceChildren();
    this.$('[data-spots-empty]').hidden = this.spots.size > 0;
    for (const name of this.spots.keys()) {
      const item = button(name, () => void this.requestSpot(name));
      item.setAttribute('aria-pressed', String(name === this.selectedSpot));
      const row = document.createElement('li');
      row.append(item);
      list.append(row);
    }
  }

  private reorderPaths(from: number, to: number) {
    if (from === to || to < 0 || to >= this.paths.length) return;
    const active = this.paths[this.activePath];
    const [path] = this.paths.splice(from, 1);
    this.paths.splice(to, 0, path);
    this.activePath = this.paths.indexOf(active);
    this.renderPaths();
    this.drawSpots();
  }

  private renderPaths() {
    const list = this.$('[data-paths]');
    list.replaceChildren();
    this.paths.forEach((path, index) => {
      const row = document.createElement('li');
      row.dataset.pathIndex = String(index);
      const select = button(path.join(' → ') || 'Add stops on the map', () => {
        this.activePath = index;
        this.renderPaths();
        this.drawSpots();
      }, 'path-name');
      select.setAttribute('aria-pressed', String(index === this.activePath));
      const drag = textSpan('⠿', 'drag-handle');
      drag.setAttribute('aria-label', 'Drag to reorder path');
      drag.addEventListener('pointerdown', event => {
        if (event.button === 0) drag.setPointerCapture(event.pointerId);
      });
      const target = (event: PointerEvent) => document.elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-path-index]');
      const clear = () => list.querySelector('.drop-target')?.classList.remove('drop-target');
      drag.addEventListener('pointermove', event => {
        if (!drag.hasPointerCapture(event.pointerId)) return;
        clear();
        target(event)?.classList.add('drop-target');
      });
      drag.addEventListener('pointerup', event => {
        if (!drag.hasPointerCapture(event.pointerId)) return;
        clear();
        const next = target(event);
        if (next) this.reorderPaths(index, Number(next.dataset.pathIndex));
      });
      drag.addEventListener('lostpointercapture', clear);
      const up = button('↑', () => this.reorderPaths(index, index - 1));
      const down = button('↓', () => this.reorderPaths(index, index + 1));
      up.setAttribute('aria-label', 'Move path up');
      down.setAttribute('aria-label', 'Move path down');
      up.disabled = index === 0;
      down.disabled = index === this.paths.length - 1;
      row.append(select, drag, up, down);
      list.append(row);
    });
    const path = this.paths[this.activePath];
    this.$('[data-path-editor]').hidden = !path;
    const stops = this.$('[data-stops]');
    stops.replaceChildren();
    path?.forEach((stop, index) => {
      const row = document.createElement('li');
      const remove = button('Remove', () => {
        path.splice(index, 1);
        this.drawSpots();
        this.renderPaths();
      });
      remove.setAttribute('aria-label', `Remove stop ${index + 1}: ${stop}`);
      row.append(textSpan(stop + (this.spots.has(stop) ? '' : ' · missing spot')), remove);
      stops.append(row);
    });
  }

  private trackEntries() {
    return [...this.tracks].flatMap(([type, urls]) => urls.map((src, index) => ({ src, type, index })));
  }

  private renderTracks(unavailable = new Set<string>()) {
    const list = this.$('[data-tracks]');
    list.replaceChildren();
    for (const { src, type, index } of this.trackEntries()) {
      const row = document.createElement('li');
      const name = this.post.localPath(src)?.at(-1) ?? src.split('/').at(-1) ?? src;
      const label = document.createElement('div');
      label.append(textSpan(`${type} ${name}`));
      if (this.imported.has(src)) label.append(textSpan('Pending import', 'muted track-status'));
      else if (unavailable.has(src)) label.append(textSpan('Preview unavailable', 'muted track-status'));
      const remove = button('Delete…', () => void this.removeTrack(src, type, index, name), 'danger');
      remove.setAttribute('aria-label', `Delete track ${name}`);
      row.append(label, remove);
      list.append(row);
    }
  }

  private async importTracks(files: File[]) {
    await this.run('Validating GPX…', async () => {
      const transport = this.input('[data-transport]').value;
      const skipped: string[] = [];
      let count = 0;
      for (const file of files) {
        try {
          if (!/\.gpx$/i.test(file.name)) throw new Error('expected a .gpx file');
          const src = this.post.assetUrl('track', file.name);
          const duplicate = this.trackEntries().some(track =>
            this.post.localPath(track.src)?.join('/').toLowerCase() === `track/${file.name.toLowerCase()}`);
          if (duplicate || await this.post.localAsset(src)) throw new Error('filename already exists');
          const segments = gpxSegments(await file.text());
          this.imported.set(src, { file, segments });
          this.tracks.set(transport, [...(this.tracks.get(transport) ?? []), src]);
          count += 1;
        } catch (error) {
          skipped.push(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      await this.refreshTracks(!!count);
      notice([count ? `Staged ${count} GPX file(s).` : '', ...skipped].filter(Boolean).join(' · '));
    });
  }

  private async removeTrack(src: string, type: string, index: number, name: string) {
    const local = this.post.localPath(src);
    const canDeleteFile = local?.length === 2 && local[0] === 'track' && !this.imported.has(src);
    const result = await confirmAction({
      title: 'Delete track from map?', body: `${name} will be removed from map.json when you save.`,
      action: 'Remove track', extra: canDeleteFile ? 'Permanently delete the local GPX file if unused' : undefined,
    });
    if (!result.accepted) return;
    const files = this.tracks.get(type)!;
    files.splice(index, 1);
    if (!files.length) this.tracks.delete(type);
    if (!this.trackEntries().some(track => track.src === src)) this.imported.delete(src);
    if (result.checked) this.removeFiles.add(src);
    this.renderTracks();
    await this.refreshTracks();
  }

  private async refreshTracks(fit = false) {
    const revision = ++this.trackRevision;
    const unavailable = new Set<string>();
    const collected = await Promise.all(this.trackEntries().map(async ({ src, type }) => {
      try {
        const pending = this.imported.get(src);
        const asset = pending ? null : await this.post.localAsset(src);
        const segments = pending?.segments ?? (asset ? gpxSegments(await asset.file.text()) : null);
        if (!segments) unavailable.add(src);
        return { type, segments };
      } catch { unavailable.add(src); return { type, segments: null }; }
    }));
    if (revision !== this.trackRevision) return;
    this.trackLayer.clearLayers();
    for (const { type, segments } of collected) {
      if (segments) L.polyline(segments, { color: trackColors[type] ?? '#5e81ac', weight: 4, interactive: false,
        dashArray: type === '🚃' ? '8 6' : undefined }).addTo(this.trackLayer);
    }
    this.renderTracks(unavailable);
    if (fit) this.fit();
  }

  async refreshPhotos() {
    const revision = ++this.photoRevision;
    this.photoLayer.clearLayers();
    if (!this.photosVisible) return;
    const entries = await Promise.all(this.post.gallery.map(async (entry, index) => {
      const asset = await this.post.localAsset(entry.src).catch(() => null);
      const exif = asset ? await readExif(asset.file).catch(() => null) : null;
      return { point: effectiveLocation(entry, exif?.location ?? null), entry, index };
    }));
    if (revision !== this.photoRevision) return;
    for (const { point, entry, index } of entries) {
      if (!point) continue;
      const name = this.post.localPath(entry.src)?.at(-1) ?? entry.src.split('/').at(-1) ?? entry.src;
      const marker = L.marker(point, { icon: pin('P', 'photo'), title: name, alt: name }).addTo(this.photoLayer);
      const content = document.createElement('div');
      content.className = 'photo-popup';
      content.append(textSpan(name), button('Open in pic', () => this.selectPhoto(index)));
      marker.bindPopup(content);
    }
    if (entries.some(entry => entry.point)) this.fit();
  }

  private fit() {
    if (!this.map) return;
    const bounds = L.featureGroup([...this.spotLayer.getLayers(), ...this.trackLayer.getLayers(), ...this.photoLayer.getLayers()]).getBounds();
    if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }

  private document(): MapDocument {
    const data = { ...this.post.map, spot: Object.fromEntries(this.spots) };
    if (this.paths.length) data.path = this.paths.map(path => [...path]);
    else delete data.path;
    if (this.tracks.size) data.track = Object.fromEntries([...this.tracks].map(([type, files]) => [type, [...files]]));
    else delete data.track;
    return data;
  }

  isDirty(): boolean {
    const saved = { ...this.post.map, spot: this.post.map.spot ?? {} };
    if (!saved.path?.length) delete saved.path;
    if (!Object.keys(saved.track ?? {}).length) delete saved.track;
    return this.spotFormDirty() || JSON.stringify(this.document()) !== JSON.stringify(saved);
  }

  private async save() {
    await this.run('Saving map…', async () => {
      if (this.spotFormDirty()) this.applySpot();
      if (this.paths.some(path => !path.length || path.some(spot => !this.spots.has(spot)))) {
        throw new Error('Each path needs at least one existing spot. Edit or remove incomplete paths.');
      }
      const data = this.document();
      const kept = await this.post.saveMap(data, [...this.imported.values()], [...this.removeFiles]);
      this.imported.clear();
      this.removeFiles.clear();
      await this.refreshTracks();
      const messages = ['Saved map.json.'];
      if (!this.spots.size) messages.push('The blog map needs at least one spot to display.');
      if (kept.length) messages.push(`Kept referenced or unavailable GPX files: ${kept.join(', ')}.`);
      notice(messages.join(' '));
    });
  }
}

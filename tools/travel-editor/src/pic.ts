import L from 'leaflet';
import {
  convertPhoto, editExif, equipmentFields, jpegFile, localTime, offsetMinutes, photoFile, readExif, sameExifValue, samePoint, utcOffset, validPoint,
  type Encoding, type ExifChanges, type PhotoExif, type Point,
} from './images';
import { captureText, effectiveLocation, type PhotoEntry, type Post } from './project';
import { button, confirmAction, control, isoInput, kib, makeMap, notice, pin, showError, textSpan } from './ui';

type Run = (message: string, work: () => Promise<void>) => Promise<void>;
const emptyExif: PhotoExif = { time: null, offset: null, location: null };
const fields = ['loc', 'title', 'caption', 'alt', 'link', 'preview', 'thumb', 'width', 'height', 'lightboxCaption', 'lightboxLink'] as const;
const numeric = (field: string) => field === 'width' || field === 'height';
const labels = {
  loc: 'Location label', title: 'Title', caption: 'Caption', alt: 'Alternative text', link: 'Location link',
  preview: 'Preview path', thumb: 'Thumbnail path', width: 'Width', height: 'Height',
  lightboxCaption: 'Lightbox caption', lightboxLink: 'Lightbox link',
};

interface Picture { file: File | null; exif: PhotoExif; entry: PhotoEntry; url: string | null }
interface Preview { blob: Blob; size: [number, number]; options: Encoding; url: string }

export class PicPanel {
  private selected = -1;
  private picture: Picture | null = null;
  private location: Point | null = null;
  private mode: 'convert' | 'details' = 'details';
  private map: L.Map | null = null;
  private mapResize: ResizeObserver | null = null;
  private marker: L.Marker | null = null;
  private pinSelected = false;
  private preview: Preview | null = null;
  private thumbnails: string[] = [];
  private generation = 0;
  private browseMode = false;

  constructor(private root: HTMLElement, private post: Post, private run: Run, private onChange: () => void) {
    root.innerHTML = `
      <div class="panel-toolbar">
        <div><h2>Photos</h2><p class="muted" data-count></p></div>
        <div class="actions">
          <button type="button" data-sync>Sync folder</button>
          <label class="file-button primary">Import photos… <input data-import type="file" accept=".jpg,.jpeg,.avif,image/jpeg,image/avif" multiple></label>
        </div>
      </div>
      <div class="gallery-strip" data-gallery aria-label="Gallery order"></div>
      <div class="empty-state" data-empty><h3>No photos in this post</h3><p>Import JPEG or AVIF files to begin.</p></div>
      <div class="workspace" data-editor hidden>
        <aside class="inspector">
          <div class="segmented" aria-label="Photo action">
            <button type="button" data-mode="convert" aria-pressed="false">Convert</button>
            <button type="button" data-mode="details" aria-pressed="true">Info</button>
          </div>
          <div class="form-stack" data-convert hidden>
            <h3>JPEG to AVIF</h3>
            <div class="field-row">
              <label>Quality <input type="number" data-quality min="0" max="100" value="60" required></label>
              <label>Speed <input type="number" data-speed min="0" max="9" value="5" required></label>
            </div>
            <label>Chroma subsampling
              <select data-chroma><option value="420">4:2:0</option><option value="444">4:4:4</option></select>
            </label>
            <p class="muted" data-size-change></p>
            <div class="actions">
              <button type="button" data-generate>Update preview</button>
              <button type="button" class="primary" data-replace disabled>Replace JPEG…</button>
            </div>
          </div>
          <div class="form-stack" data-fields>
            <h3>Photo EXIF</h3>
            <label>Capture time <input data-time type="datetime-local" step="1"></label>
            <div class="field-row">
              <label>UTC offset<input data-offset type="text" placeholder="+09:00" spellcheck="false" maxlength="6"></label>
              <label>On offset change<select data-time-mode><option value="clock">Keep local time</option><option value="instant">Keep instant</option></select></label>
            </div>
            <div class="field-row">
              <label>Camera model<input data-exif="camera"></label>
              <label>Lens model<input data-exif="lens"></label>
            </div>
            <details>
              <summary>Exposure details</summary>
              <div class="form-stack advanced">
                <div class="field-row">
                  <label>Aperture (f-number)<input data-exif="aperture" type="number" step="any" min="0"></label>
                  <label>Shutter (seconds)<input data-exif="shutter" placeholder="1/250" spellcheck="false"></label>
                </div>
                <div class="field-row">
                  <label>ISO<input data-exif="iso" type="number" min="1" max="65535" step="1"></label>
                  <label>Focal length (mm)<input data-exif="focalLength" type="number" step="any" min="0"></label>
                </div>
                <div class="field-row">
                  <label>Exposure compensation (EV)<input data-exif="exposureBias" type="number" step="any"></label>
                  <label>Metering mode<select data-exif="metering">
                    <option value="">Unset</option><option value="0">Unknown</option>
                    <option value="1">Average</option><option value="2">Center-weighted average</option>
                    <option value="3">Spot</option><option value="4">Multi-spot</option>
                    <option value="5">Pattern</option><option value="6">Partial</option><option value="255">Other</option>
                  </select></label>
                </div>
              </div>
            </details>
            <hr class="info-divider">
            <h3>Gallery fields</h3>
            <div class="field-row">
              <label>Location label<input data-field="loc"></label><label>Title<input data-field="title"></label>
            </div>
            <label>Caption<textarea data-field="caption" rows="2"></textarea></label>
            <label>Alternative text<input data-field="alt"></label>
            <details>
              <summary>Additional gallery fields</summary>
              <div class="form-stack advanced">
                <label>Location link<input data-field="link"></label>
                <label>Preview path<input data-field="preview"></label>
                <label>Thumbnail path<input data-field="thumb"></label>
                <label>Lightbox caption<input data-field="lightboxCaption"></label>
                <label>Lightbox link<input data-field="lightboxLink"></label>
                <div class="field-row">
                  <label>Width<input data-field="width" type="number" min="1" step="1"></label>
                  <label>Height<input data-field="height" type="number" min="1" step="1"></label>
                </div>
                <label>EXIF overrides in pic.json<textarea data-overrides rows="4" spellcheck="false" placeholder="{ }"></textarea></label>
              </div>
            </details>
            <button type="button" class="primary" data-save>Save photo</button>
          </div>
          <div class="inspector-footer"><button type="button" class="danger" data-remove>Delete photo…</button></div>
        </aside>
        <div class="visual">
          <div class="visual-header"><h3 data-name></h3><span class="muted" data-metadata></span></div>
          <div data-compare hidden>
            <div class="compare-images" data-compare-images>
              <figure><div class="photo-frame"><img data-before alt="Original JPEG"></div><figcaption>Original JPEG <strong data-before-size></strong></figcaption></figure>
              <figure><div class="photo-frame"><img data-after alt="AVIF preview" hidden><p data-preview-empty>Generate a preview to compare.</p></div><figcaption>AVIF preview <strong data-after-size>—</strong></figcaption></figure>
            </div>
            <label class="check"><input type="checkbox" data-zoom>Zoom both images</label>
          </div>
          <div data-detail-visual>
            <div class="section-heading"><h3>Capture location</h3><button type="button" data-clear>Clear GPS</button></div>
            <div class="leaflet-view photo-map" data-photo-map aria-label="Photo GPS map"></div>
            <div class="coordinates"><label>Latitude<input data-lat type="number" step="any" min="-90" max="90"></label><label>Longitude<input data-lon type="number" step="any" min="-180" max="180"></label></div>
            <p class="muted" data-effective></p>
          </div>
        </div>
      </div>`;

    this.on<HTMLInputElement>('[data-import]', 'change', event => {
      const input = event.currentTarget as HTMLInputElement;
      const files = Array.from(input.files ?? []);
      input.value = '';
      if (files.length) void this.importFiles(files);
    });
    this.on('[data-sync]', 'click', () => void this.sync());
    this.on('[data-mode="details"]', 'click', () => this.setMode('details'));
    this.on('[data-mode="convert"]', 'click', () => this.setMode('convert'));
    this.on('[data-zoom]', 'change', () => this.$('[data-compare-images]').classList.toggle('zoom', this.input('[data-zoom]').checked));
    this.on('[data-clear]', 'click', () => this.setPoint(null));
    for (const selector of ['[data-lat]', '[data-lon]']) {
      this.on(selector, 'change', () => {
        try { this.setPoint(this.pointFromInputs(), true); } catch (error) { showError(error); }
      });
    }
    const offset = this.input('[data-offset]');
    this.on('[data-offset]', 'focus', () => { offset.dataset.previous = offset.value; });
    this.on('[data-offset]', 'change', () => {
      try { this.changeOffset(offset.dataset.previous ?? this.picture?.exif.offset ?? ''); }
      catch (error) { showError(error); }
    });
    for (const selector of ['[data-quality]', '[data-speed]', '[data-chroma]']) {
      this.on(selector, 'input', () => this.renderPreview());
    }
    this.on('[data-overrides]', 'input', () => this.showEffectivePoint());
    this.on('[data-generate]', 'click', () => void this.generate());
    this.on('[data-replace]', 'click', () => void this.replace());
    this.on('[data-save]', 'click', () => void this.save());
    this.on('[data-remove]', 'click', () => void this.remove());
  }

  private $<T extends HTMLElement = HTMLElement>(selector: string): T { return control<T>(this.root, selector); }
  private input(selector: string): HTMLInputElement { return this.$(selector); }
  private on<T extends HTMLElement = HTMLElement>(selector: string, type: string, listener: EventListener) {
    this.$<T>(selector).addEventListener(type, listener);
  }

  async open() {
    await this.renderGallery();
    await this.select(this.post.gallery.length ? 0 : -1);
  }

  visible() {
    this.browseMode = true;
    if (this.picture && this.mode === 'details') this.ensureMap();
  }

  hidden() { this.browseMode = false; }

  destroy() {
    this.generation += 1;
    this.mapResize?.disconnect();
    this.map?.remove();
    this.disposePhotos();
    this.disposePreview();
  }

  private disposePhotos() {
    for (const url of this.thumbnails) URL.revokeObjectURL(url);
    this.thumbnails = [];
    if (this.picture?.url) URL.revokeObjectURL(this.picture.url);
  }

  private disposePreview() {
    if (this.preview) URL.revokeObjectURL(this.preview.url);
    this.preview = null;
  }

  private async renderGallery() {
    for (const url of this.thumbnails) URL.revokeObjectURL(url);
    this.thumbnails = [];
    const generation = ++this.generation;
    this.$('[data-count]').textContent = `${this.post.gallery.length} ${this.post.gallery.length === 1 ? 'photo' : 'photos'} · pic.json`;
    const gallery = this.$('[data-gallery]');
    gallery.replaceChildren();
    this.post.gallery.forEach((entry, i) => {
      const path = this.post.localPath(entry.src);
      const filename = path?.at(-1) ?? entry.src.split('/').at(-1) ?? entry.src;
      const tile = button('', () => void this.requestSelect(i), 'gallery-photo');
      tile.dataset.index = String(i);
      tile.setAttribute('aria-label', `Photo ${i + 1}: ${filename}`);
      const frame = document.createElement('span');
      frame.className = 'thumbnail';
      tile.append(frame, textSpan(filename));
      gallery.append(tile);
      void this.post.localAsset(entry.src).then(asset => {
        if (generation !== this.generation) return;
        if (asset) {
          const image = document.createElement('img');
          image.alt = '';
          image.loading = 'lazy';
          image.decoding = 'async';
          const url = URL.createObjectURL(asset.file);
          this.thumbnails.push(url);
          image.src = url;
          frame.append(image);
        } else {
          frame.append(textSpan(path ? 'Missing' : 'External'));
        }
      }).catch(() => { if (generation === this.generation) frame.append(textSpan('Unavailable')); });
    });
  }

  async requestSelect(index: number) {
    if (index === this.selected) return;
    if (this.isDirty() && !(await confirmAction({
      title: 'Discard this photo’s changes?', body: 'Unsaved EXIF and gallery fields will be lost.',
      action: 'Discard changes',
    })).accepted) return;
    await this.run('Loading photo…', async () => { await this.select(index); notice(''); });
  }

  private async select(index: number, preserveMode = false) {
    if (this.picture?.url) URL.revokeObjectURL(this.picture.url);
    this.disposePreview();
    const entry = this.post.gallery[index];
    this.selected = index;
    for (const tile of this.root.querySelectorAll<HTMLButtonElement>('[data-index]')) {
      tile.setAttribute('aria-pressed', String(Number(tile.dataset.index) === index));
    }
    this.$('[data-editor]').hidden = !entry;
    this.$('[data-empty]').hidden = !!entry;
    if (!entry) {
      this.picture = null;
      return;
    }
    const asset = await this.post.localAsset(entry.src);
    const file = asset?.file ?? null;
    const exif = file ? await readExif(file).catch(() => emptyExif) : emptyExif;
    const url = file ? URL.createObjectURL(file) : null;
    this.picture = { file, exif, entry, url };
    this.location = exif.location;
    this.pinSelected = false;
    if (!preserveMode) this.mode = file && jpegFile(file.name) ? 'convert' : 'details';
    this.$('[data-name]').textContent = file?.name ?? this.post.localPath(entry.src)?.at(-1) ?? entry.src;
    this.$('[data-metadata]').textContent = [captureText(entry, exif.time), file ? kib(file.size) : ''].filter(Boolean).join(' · ');
    for (const selector of ['[data-time]', '[data-offset]', '[data-lat]', '[data-lon]', '[data-clear]']) {
      this.$<HTMLButtonElement>(selector).disabled = !file || !photoFile(file.name);
    }
    const before = this.$<HTMLImageElement>('[data-before]');
    if (url) before.src = url;
    else before.removeAttribute('src');
    this.$('[data-before-size]').textContent = file ? kib(file.size) : '—';
    this.input('[data-time]').value = exif.time ?? '';
    this.input('[data-offset]').value = exif.offset ?? '';
    this.input('[data-offset]').dataset.previous = exif.offset ?? '';
    const metering = this.$<HTMLSelectElement>('[data-exif="metering"]');
    metering.querySelector('[data-extra-metering]')?.remove();
    if (exif.metering != null && !Array.from(metering.options).some(option => option.value === String(exif.metering))) {
      const option = new Option(`Unrecognized (${exif.metering})`, String(exif.metering));
      option.dataset.extraMetering = '';
      metering.add(option);
    }
    for (const key of equipmentFields) {
      const input = this.input(`[data-exif="${key}"]`);
      input.disabled = !this.canEditExif();
      const value = exif[key];
      const denominator = key === 'shutter' && typeof value === 'number' && value > 0 && value < 1 ? Math.round(1 / value) : 0;
      input.value = denominator && typeof value === 'number' && sameExifValue(value, 1 / denominator)
        ? `1/${denominator}` : String(value ?? '');
    }
    for (const key of fields) {
      const value = entry[key];
      this.input(`[data-field="${key}"]`).value =
        typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    }
    this.input('[data-overrides]').value = entry.exif ? JSON.stringify(entry.exif, null, 2) : '';
    this.$('[data-remove]').textContent = this.canEditExif() ? 'Delete photo…' : 'Remove gallery entry…';
    this.setMode(this.mode);
    this.setPoint(exif.location, true);
  }

  private setMode(mode: 'convert' | 'details') {
    const convertible = this.picture?.file && jpegFile(this.picture.file.name);
    this.$<HTMLButtonElement>('[data-mode="convert"]').disabled = !convertible;
    this.mode = convertible ? mode : 'details';
    const showPreview = this.mode === 'convert';
    const editor = this.$('[data-editor]');
    editor.classList.toggle('photo-details', !showPreview);
    this.$('[data-mode="convert"]').setAttribute('aria-pressed', String(showPreview));
    this.$('[data-mode="details"]').setAttribute('aria-pressed', String(!showPreview));
    this.$('[data-convert]').hidden = !showPreview;
    this.$('[data-compare]').hidden = !showPreview;
    this.$('[data-fields]').hidden = showPreview;
    this.$('[data-detail-visual]').hidden = showPreview;
    if (!showPreview && this.browseMode) this.ensureMap();
    this.renderPreview();
  }

  private ensureMap() {
    if (!this.map) {
      const container = this.$('[data-photo-map]');
      this.map = makeMap(container);
      this.mapResize = new ResizeObserver(() => {
        if (container.clientWidth && container.clientHeight) this.map?.invalidateSize({ pan: false });
      });
      this.mapResize.observe(container);
      this.map.on('click', ({ latlng }: L.LeafletMouseEvent) => {
        if (!this.canEditExif()) return;
        this.pinSelected = false;
        this.setPoint([latlng.lat, latlng.wrap().lng]);
      });
      this.drawPin(true);
    }
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  private canEditExif() { return !!this.picture?.file && photoFile(this.picture.file.name); }

  private drawPin(recenter: boolean) {
    if (!this.map) return;
    this.marker?.remove();
    this.marker = null;
    if (!this.location) return;
    this.marker = L.marker(this.location, {
      draggable: this.pinSelected && this.canEditExif(),
      icon: pin('P', 'photo', this.pinSelected), title: 'Photo GPS',
    }).addTo(this.map);
    this.marker.on('click', () => {
      if (this.pinSelected || !this.canEditExif()) return;
      this.pinSelected = true;
      this.drawPin(false);
      this.showEffectivePoint();
    });
    this.marker.on('dragend', () => {
      const point = this.marker!.getLatLng().wrap();
      this.setPoint([point.lat, point.lng]);
    });
    if (recenter) this.map.setView(this.location, 13);
  }

  private pointFromInputs(): Point | null {
    const a = this.input('[data-lat]').value;
    const b = this.input('[data-lon]').value;
    if (!a && !b) return null;
    const point = [Number(a), Number(b)];
    if (!a || !b || !validPoint(point)) throw new Error('Enter both coordinates within latitude ±90 and longitude ±180.');
    return point;
  }

  private setPoint(point: Point | null, recenter = false) {
    this.location = point;
    if (!point) this.pinSelected = false;
    this.input('[data-lat]').value = point ? String(Number(point[0].toFixed(9))) : '';
    this.input('[data-lon]').value = point ? String(Number(point[1].toFixed(9))) : '';
    this.drawPin(recenter);
    this.showEffectivePoint();
  }

  private showEffectivePoint() {
    let text = 'No GPS in the photo. Click the map to add it.';
    if (this.location) text = this.pinSelected ? 'Drag the selected pin to move it.' : 'Click the pin to select it before dragging.';
    try {
      const exif = this.readOverrides();
      if (exif?.latitude != null || exif?.longitude != null) {
        const point = effectiveLocation({ src: '', exif }, this.location);
        text = 'pic.json overrides the photo GPS. Blog marker: ' + (point ? point.map(v => v.toFixed(6)).join(', ') : 'none') + '.';
      }
    } catch { text = 'EXIF overrides must be a JSON object.'; }
    this.$('[data-effective]').textContent = this.canEditExif() ? text : '';
  }

  private changeOffset(previous: string) {
    const offset = this.input('[data-offset]');
    offset.value = offset.value.trim();
    if (offset.value && !utcOffset(offset.value)) throw new Error('Enter an offset such as +09:00 or leave it blank.');
    const time = this.input('[data-time]');
    if (this.input('[data-time-mode]').value === 'instant' && previous !== offset.value && time.value) {
      if (!utcOffset(previous) || !utcOffset(offset.value)) {
        offset.value = previous;
        throw new Error('Both offsets are needed to preserve the same instant.');
      }
      const date = new Date(isoInput(time.value) + previous);
      time.value = new Date(date.getTime() + offsetMinutes(offset.value) * 60_000).toISOString().slice(0, 19);
    }
    offset.dataset.previous = offset.value;
  }

  private readOverrides(): Record<string, unknown> | undefined {
    const raw = this.input('[data-overrides]').value.trim();
    if (!raw) return undefined;
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new Error('EXIF overrides are not valid JSON.'); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('EXIF overrides must be a JSON object.');
    return value as Record<string, unknown>;
  }

  private galleryFields(): PhotoEntry {
    const entry = { ...this.picture!.entry };
    for (const key of fields) {
      const input = this.input(`[data-field="${key}"]`);
      const value = input.value.trim();
      const original = entry[key];
      const shownOriginal = typeof original === 'string' || typeof original === 'number' ? String(original) : '';
      if (input.value === shownOriginal && input.validity.valid) continue;
      if (!input.validity.valid) throw new Error(`Enter a positive whole number for ${labels[key]}.`);
      if (!value) delete entry[key];
      else entry[key] = numeric(key) ? Number(value) : value;
    }
    const overrides = this.readOverrides();
    if (overrides) entry.exif = overrides;
    else delete entry.exif;
    return entry;
  }

  private changes(): ExifChanges {
    if (!this.canEditExif()) return {};
    const value = this.input('[data-time]').value;
    const time = value ? localTime(isoInput(value)) : null;
    if (value && !time) throw new Error('Enter a valid capture time.');
    const offset = this.input('[data-offset]').value.trim() || null;
    if (offset && !utcOffset(offset)) throw new Error('Enter an offset such as +09:00 or leave it blank.');
    const parsedPoint = this.pointFromInputs();
    const existing = this.picture!.exif;
    const point = samePoint(parsedPoint, this.location) ? this.location : parsedPoint;
    const result: ExifChanges = {};
    if (time !== existing.time) result.time = time;
    if (offset !== existing.offset) result.offset = offset;
    if (!samePoint(point, existing.location)) result.location = point;
    for (const key of equipmentFields) {
      const input = this.input(`[data-exif="${key}"]`);
      const raw = input.value.trim();
      const fraction = key === 'shutter' ? raw.match(/^(\d+)\s*\/\s*(\d+)$/) : null;
      const value = !raw ? null : key === 'camera' || key === 'lens' ? raw
        : fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(raw);
      if (sameExifValue(value, existing[key])) continue;
      if (!input.validity.valid || (typeof value === 'number' && (!Number.isFinite(value)
        || (['aperture', 'shutter', 'focalLength'].includes(key) && value <= 0)))) {
        throw new Error(`Enter a valid value for ${input.labels?.[0]?.textContent?.trim() || key}.`);
      }
      result[key] = value;
    }
    return result;
  }

  isDirty(): boolean {
    if (!this.picture) return false;
    try {
      return !!Object.keys(this.changes()).length
        || JSON.stringify(this.galleryFields()) !== JSON.stringify(this.picture.entry);
    } catch { return true; }
  }

  private renderPreview() {
    const preview = this.preview;
    const after = this.$<HTMLImageElement>('[data-after]');
    after.hidden = !preview;
    this.$('[data-preview-empty]').hidden = !!preview;
    if (preview) after.src = preview.url;
    else after.removeAttribute('src');
    const size = this.picture?.file?.size ?? 0;
    this.$('[data-after-size]').textContent = preview ? kib(preview.blob.size) : '—';
    const stale = preview ? JSON.stringify(preview.options) !== JSON.stringify(this.encoding(false)) : false;
    this.$('[data-size-change]').textContent = preview && size
      ? `${((preview.blob.size / size - 1) * 100).toFixed(1)}% file size change${stale ? ' · settings changed' : ''}` : '';
    this.$<HTMLButtonElement>('[data-replace]').disabled = !preview || stale;
  }

  private encoding(validate = true): Encoding {
    const quality = this.input('[data-quality]');
    const speed = this.input('[data-speed]');
    if (validate && (!quality.reportValidity() || !speed.reportValidity())) throw new Error('Check the encoder settings.');
    return { quality: quality.valueAsNumber, speed: speed.valueAsNumber, chroma: this.input('[data-chroma]').value as Encoding['chroma'] };
  }

  private async generate() {
    const file = this.picture?.file;
    if (!file || !jpegFile(file.name)) return;
    await this.run('Encoding AVIF preview…', async () => {
      const options = this.encoding();
      const { blob, size } = await convertPhoto(file, options);
      this.disposePreview();
      this.preview = { blob, size, options, url: URL.createObjectURL(blob) };
      this.renderPreview();
      notice('AVIF preview is ready.');
    });
  }

  private async replace() {
    const file = this.picture?.file;
    const preview = this.preview;
    if (!file || !preview || !jpegFile(file.name) || JSON.stringify(preview.options) !== JSON.stringify(this.encoding(false))) return;
    if (!(await confirmAction({
      title: 'Replace JPEG permanently?',
      body: `${file.name} will be removed after the AVIF and its references are verified. ${this.isDirty() ? 'Unsaved EXIF and gallery edits will be discarded. Save them first if you want them included.' : 'This action cannot be undone.'}`,
      action: 'Replace JPEG',
    })).accepted) return;
    await this.run('Replacing JPEG…', async () => {
      const previous = this.picture!.entry.src;
      try {
        const filename = await this.post.replacePhoto(this.selected, file, preview.blob, preview.size);
        notice(`Saved ${filename} and updated its references.`);
      } finally {
        if (this.post.gallery[this.selected]?.src !== previous) {
          await this.renderGallery();
          await this.select(this.selected);
          this.onChange();
        }
      }
    });
  }

  private async save() {
    const picture = this.picture;
    if (!picture) return;
    await this.run('Saving photo…', async () => {
      const entry = this.galleryFields();
      const changes = this.changes();
      const img = picture.file && Object.keys(changes).length ? await editExif(picture.file, changes) : undefined;
      await this.post.savePhoto(this.selected, entry, picture.file ?? undefined, img);
      await this.renderGallery();
      await this.select(this.selected, true);
      this.onChange();
      notice('Saved photo and its pic.json entry.');
    });
  }

  private async remove() {
    if (!this.picture) return;
    const file = this.canEditExif() ? this.picture.file : null;
    const impact = await this.post.photoRemovalImpact(this.selected).catch(error => { showError(error); return null; });
    if (impact === null) return;
    if (!(await confirmAction({
      title: file ? 'Delete photo permanently?' : 'Remove gallery entry?',
      body: [file ? `${file.name} will be deleted from disk and its gallery entries removed.` : 'This entry will be removed from pic.json.', impact].filter(Boolean).join('\n'),
      action: file ? 'Delete photo' : 'Remove entry',
    })).accepted) return;
    await this.run('Removing photo…', async () => {
      await this.post.deletePhoto(this.selected, file);
      await this.renderGallery();
      await this.select(Math.min(this.selected, this.post.gallery.length - 1));
      this.onChange();
      notice(file ? 'Deleted photo and updated pic.json.' : 'Removed gallery entry.');
    });
  }

  private async importFiles(files: File[]) {
    await this.run('Importing photos…', async () => {
      const { imported, skipped } = await this.post.importPhotos(files);
      await this.renderGallery();
      if (!this.picture && this.post.gallery.length) await this.select(0);
      else this.$(`[data-index="${this.selected}"]`).setAttribute('aria-pressed', 'true');
      this.onChange();
      notice([imported ? `Imported ${imported} into pic/ and updated pic.json.` : 'No photos imported.',
        skipped.length ? `Skipped: ${skipped.join(', ')}.` : ''].filter(Boolean).join(' '));
    });
  }

  private async sync() {
    await this.run('Synchronizing photos…', async () => {
      const count = await this.post.synchronize();
      await this.renderGallery();
      if (this.picture) this.$(`[data-index="${this.selected}"]`).setAttribute('aria-pressed', 'true');
      else if (this.post.gallery.length) await this.select(0);
      this.onChange();
      notice(count ? `Added ${count} photo entries.` : 'pic.json is up to date.');
    });
  }
}

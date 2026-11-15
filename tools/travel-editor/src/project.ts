import { localTime, photoFile, readExif, validPoint, type Point } from './images';

export interface PhotoEntry extends Record<string, unknown> {
  src: string;
  exif?: Record<string, unknown>;
}

export interface MapDocument extends Record<string, unknown> {
  spot?: Record<string, Point>;
  path?: string[][];
  track?: Record<string, string[]>;
}

export interface PostChoice { slug: string; filename: string; title: string }
export interface TrackDraft { file: File; segments: Point[][] }

interface FileWrite {
  previous: string | null;
  next: string;
  directory: FileSystemDirectoryHandle;
  name: string;
}

type DirectoryEntry = [string, FileSystemHandle];
type Directory = FileSystemDirectoryHandle & { entries(): AsyncIterable<DirectoryEntry> };

export async function directoryEntries(handle: FileSystemDirectoryHandle): Promise<DirectoryEntry[]> {
  const result: DirectoryEntry[] = [];
  for await (const entry of (handle as Directory).entries()) result.push(entry);
  return result;
}

function missing(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotFoundError';
}

async function fileOrNull(directory: FileSystemDirectoryHandle, name: string): Promise<File | null> {
  try {
    return await (await directory.getFileHandle(name)).getFile();
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
}

async function readText(directory: FileSystemDirectoryHandle, name: string): Promise<string | null> {
  return (await fileOrNull(directory, name))?.text() ?? null;
}

async function writeFile(handle: FileSystemFileHandle, data: string | Blob) {
  const options: FileSystemCreateWritableOptions & { mode: 'exclusive' } = { mode: 'exclusive' };
  const stream = await handle.createWritable(options);
  try {
    await stream.write(data);
    await stream.close();
  } catch (error) {
    await stream.abort().catch(() => {});
    throw error;
  }
}

async function saveText(write: FileWrite) {
  const { directory, name, previous, next } = write;
  if (await readText(directory, name) !== previous) throw new Error(`${name} changed on disk. Reopen the post before saving.`);
  const handle = await directory.getFileHandle(name, { create: previous === null });
  try {
    await writeFile(handle, next);
  } catch (error) {
    if (previous === null && (await handle.getFile()).size === 0) await directory.removeEntry(name).catch(() => {});
    throw error;
  }
}

async function applyWrites(writes: FileWrite[]) {
  const applied: FileWrite[] = [];
  try {
    for (const write of writes) {
      if (write.previous === write.next) continue;
      await saveText(write);
      applied.push(write);
    }
  } catch (error) {
    try {
      for (const write of applied.reverse()) {
        if (await readText(write.directory, write.name) !== write.next) throw Error();
        if (write.previous === null) await write.directory.removeEntry(write.name);
        else await saveText({ ...write, previous: write.next, next: write.previous });
      }
    } catch {
      throw new Error('A file changed during recovery. Reopen the post and review the changes on disk.');
    }
    throw error;
  }
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 4) + '\n';
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseJson(source: string | null, fallback: unknown, name: string): unknown {
  if (source === null) return fallback;
  try { return JSON.parse(source); }
  catch { throw new Error(`${name} is invalid JSON. Fix it before editing this post.`); }
}

function galleryFrom(source: string | null): PhotoEntry[] {
  const value = parseJson(source, [], 'pic.json');
  if (!Array.isArray(value) || value.some(entry => !object(entry) || typeof entry.src !== 'string')) {
    throw new Error('pic.json must be an array of entries with a source path.');
  }
  return value;
}

function mapFrom(source: string | null): MapDocument {
  const value = parseJson(source, {}, 'map.json');
  if (!object(value)
    || (value.spot !== undefined && (!object(value.spot) || !Object.values(value.spot).every(validPoint)))
    || (value.path !== undefined && (!Array.isArray(value.path)
      || !value.path.every(path => Array.isArray(path) && path.every(stop => typeof stop === 'string'))))
    || (value.track !== undefined && (!object(value.track)
      || !Object.values(value.track).every(files => Array.isArray(files) && files.every(file => typeof file === 'string'))))) {
    throw new Error('map.json contains invalid spot, path, or track fields.');
  }
  return value as MapDocument;
}

function fileMatches(before: File, after: File): boolean {
  return before.lastModified === after.lastModified && before.size === after.size;
}

async function identical(before: Blob, after: Blob): Promise<boolean> {
  if (before.size !== after.size) return false;
  const [left, right] = (await Promise.all([before.arrayBuffer(), after.arrayBuffer()])).map(bytes => new Uint8Array(bytes));
  return left.every((byte, i) => byte === right[i]);
}

async function storeNew(directory: FileSystemDirectoryHandle, name: string, data: Blob) {
  if (await fileOrNull(directory, name)) throw new Error(`${name} already exists. Choose another source filename.`);
  const handle = await directory.getFileHandle(name, { create: true });
  try {
    if ((await handle.getFile()).size !== 0) throw new Error(`${name} appeared during import. Refresh and try again.`);
    await writeFile(handle, data);
    if (!await identical(await handle.getFile(), data)) throw new Error(`Saved bytes differ from the preview for ${name}.`);
  } catch (error) {
    const current = await handle.getFile().catch(() => null);
    if (current && (current.size === 0 || await identical(current, data))) await directory.removeEntry(name).catch(() => {});
    throw error;
  }
}

async function takeBack(directory: FileSystemDirectoryHandle, files: { name: string; data: Blob }[]) {
  for (const { name, data } of files) {
    const current = await fileOrNull(directory, name);
    if (current && await identical(current, data)) await directory.removeEntry(name);
  }
}

async function travelTitle(handle: FileSystemFileHandle, slug: string): Promise<string> {
  const contents = await (await handle.getFile()).text();
  const matter = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return matter?.[1].match(/^title:\s*([^\r\n]*)/m)?.[1].trim().replace(/^(['"])(.*)\1$/, '$2') || slug;
}

export class Blog {
  private constructor(
    readonly assets: FileSystemDirectoryHandle, readonly travel: FileSystemDirectoryHandle, readonly posts: PostChoice[],
  ) {}

  static async open(root: FileSystemDirectoryHandle): Promise<Blog> {
    const assets = await (await root.getDirectoryHandle('assets')).getDirectoryHandle('src');
    const travel = await (await root.getDirectoryHandle('_posts')).getDirectoryHandle('travel');
    const posts: PostChoice[] = [];
    for (const [filename, handle] of (await directoryEntries(travel)).sort(([a], [b]) => b.localeCompare(a))) {
      const slug = /^\d{4}-\d{2}-\d{2}-(.+)\.(?:md|markdown)$/i.exec(filename)?.[1];
      if (slug && handle.kind === 'file') posts.push({ slug, filename, title: await travelTitle(handle as FileSystemFileHandle, slug) });
    }
    if (!posts.length) throw new Error('No travel posts found under _posts/travel.');
    return new Blog(assets, travel, posts);
  }
}

export class Post {
  private constructor(
    readonly blog: Blog, readonly choice: PostChoice, readonly folder: FileSystemDirectoryHandle,
    readonly pictures: FileSystemDirectoryHandle, private galleryText: string | null, private mapText: string | null,
    public gallery: PhotoEntry[], public map: MapDocument,
  ) {}

  static async open(blog: Blog, choice: PostChoice): Promise<Post> {
    const folder = await blog.assets.getDirectoryHandle(choice.slug, { create: true });
    const [galleryText, mapText] = await Promise.all([readText(folder, 'pic.json'), readText(folder, 'map.json')]);
    const gallery = galleryFrom(galleryText);
    const map = mapFrom(mapText);
    const pictures = await folder.getDirectoryHandle('pic', { create: true });
    const post = new Post(blog, choice, folder, pictures, galleryText, mapText, gallery, map);
    await post.synchronize();
    return post;
  }

  get prefix(): string { return `/assets/src/${encodeURIComponent(this.choice.slug)}/`; }

  assetUrl(...path: string[]): string { return this.prefix + path.map(encodeURIComponent).join('/'); }

  localPath(src: unknown): string[] | null {
    if (typeof src !== 'string') return null;
    const root = `/assets/src/${this.choice.slug}/`;
    const tail = src.startsWith(this.prefix) ? src.slice(this.prefix.length)
      : src.startsWith(root) ? src.slice(root.length) : null;
    if (!tail) return null;
    try {
      const parts = tail.split('/').map(decodeURIComponent);
      return parts.every(part => part && part !== '.' && part !== '..' && !/[\/\\\u0000]/.test(part)) ? parts : null;
    } catch { return null; }
  }

  private sameAsset(left: unknown, right: string): boolean {
    const a = this.localPath(left);
    const b = this.localPath(right);
    return !!a && !!b && a.length === b.length && a.every((part, i) => part === b[i]);
  }

  async localAsset(src: string): Promise<{ file: File; directory: FileSystemDirectoryHandle } | null> {
    const path = this.localPath(src);
    if (!path) return null;
    let directory = this.folder;
    try {
      for (const part of path.slice(0, -1)) directory = await directory.getDirectoryHandle(part);
      const file = await fileOrNull(directory, path.at(-1)!);
      return file ? { file, directory } : null;
    } catch (error) {
      if (missing(error)) return null;
      throw error;
    }
  }

  private galleryWrite(gallery: PhotoEntry[]): FileWrite {
    const next = this.galleryText !== null && JSON.stringify(gallery) === JSON.stringify(this.gallery)
      ? this.galleryText : formatJson(gallery);
    return { directory: this.folder, name: 'pic.json', previous: this.galleryText, next };
  }

  private gallerySaved(gallery: PhotoEntry[], text: string) {
    this.gallery = gallery;
    this.galleryText = text;
  }

  private async sortedPhotos(files: { file: File; src: string }[]): Promise<PhotoEntry[]> {
    const timed = await Promise.all(files.map(async item => ({
      src: item.src,
      time: (await readExif(item.file).catch(() => null))?.time ?? '',
    })));
    return timed.sort((a, b) => (a.time || '\uffff').localeCompare(b.time || '\uffff')
      || a.src.localeCompare(b.src, undefined, { numeric: true })).map(({ src }) => ({ src }));
  }

  async synchronize(): Promise<number> {
    const files: { file: File; src: string }[] = [];
    for (const [name, handle] of await directoryEntries(this.pictures)) {
      if (handle.kind !== 'file' || !photoFile(name)) continue;
      const src = this.assetUrl('pic', name);
      if (!this.gallery.some(entry => this.sameAsset(entry.src, src))) {
        files.push({ src, file: await (handle as FileSystemFileHandle).getFile() });
      }
    }
    const gallery = [...this.gallery, ...await this.sortedPhotos(files)];
    const write = this.galleryWrite(gallery);
    await applyWrites([write]);
    this.gallerySaved(gallery, write.next);
    return files.length;
  }

  async importPhotos(files: File[]): Promise<{ imported: number; skipped: string[] }> {
    if (await readText(this.folder, 'pic.json') !== this.galleryText) throw new Error('pic.json changed on disk. Reopen the post.');
    const imported: { name: string; data: Blob; file: File; src: string }[] = [];
    const skipped: string[] = [];
    try {
      for (const file of files) {
        const src = this.assetUrl('pic', file.name);
        if (!photoFile(file.name) || await fileOrNull(this.pictures, file.name)
          || this.gallery.some(entry => this.sameAsset(entry.src, src))) { skipped.push(file.name); continue; }
        try {
          const image = await createImageBitmap(file);
          image.close();
        } catch { skipped.push(file.name); continue; }
        await storeNew(this.pictures, file.name, file);
        imported.push({ name: file.name, data: file, file, src });
      }
      const gallery = [...this.gallery, ...await this.sortedPhotos(imported)];
      const write = this.galleryWrite(gallery);
      await applyWrites([write]);
      this.gallerySaved(gallery, write.next);
    } catch (error) {
      await takeBack(this.pictures, imported);
      throw error;
    }
    return { imported: imported.length, skipped };
  }

  async savePhoto(index: number, fields: PhotoEntry, original?: File, image?: Blob) {
    const gallery = this.gallery.map((entry, i) => i === index ? fields : entry);
    const galleryWrite = this.galleryWrite(gallery);
    if (image && original) {
      const asset = await this.localAsset(this.gallery[index].src);
      if (!asset || !fileMatches(original, asset.file) || !await identical(original, asset.file)) {
        throw new Error('The photo changed on disk. Reopen it before saving.');
      }
      if (await readText(this.folder, 'pic.json') !== this.galleryText) throw new Error('pic.json changed on disk. Reopen the post.');
      const handle = await asset.directory.getFileHandle(original.name);
      const backup = new Blob([await asset.file.arrayBuffer()]);
      await writeFile(handle, image);
      try {
        if (!await identical(await handle.getFile(), image)) throw new Error('Could not verify the saved photo.');
        await applyWrites([galleryWrite]);
      } catch (error) {
        if (await identical(await handle.getFile(), image)) await writeFile(handle, backup);
        throw error;
      }
    } else {
      await applyWrites([galleryWrite]);
    }
    this.gallerySaved(gallery, galleryWrite.next);
  }

  async replacePhoto(index: number, original: File, converted: Blob, size: [number, number]): Promise<string> {
    const src = this.gallery[index].src;
    const asset = await this.localAsset(src);
    const path = this.localPath(src);
    if (!asset || !path || !fileMatches(original, asset.file) || !await identical(original, asset.file)) {
      throw new Error('The JPEG changed on disk. Generate a new preview.');
    }
    if (await readText(this.folder, 'pic.json') !== this.galleryText) throw new Error('pic.json changed on disk. Reopen the post.');
    const filename = original.name.replace(/\.jpe?g$/i, '.avif');
    const nextSrc = this.assetUrl(...path.slice(0, -1), filename);
    const gallery = this.gallery.map(entry => {
      const updated = { ...entry };
      for (const key of ['src', 'preview', 'thumb', 'link', 'lightboxLink']) {
        if (this.sameAsset(updated[key], src)) updated[key] = nextSrc;
      }
      if (updated.src === nextSrc) {
        if (typeof updated.width === 'number') updated.width = size[0];
        if (typeof updated.height === 'number') updated.height = size[1];
      }
      return updated;
    });
    const markdown = await readText(this.blog.travel, this.choice.filename);
    const mdWrite = this.markdownReferences(markdown, src, nextSrc);
    const write = this.galleryWrite(gallery);
    await storeNew(asset.directory, filename, converted);
    try {
      await applyWrites([write, ...mdWrite]);
    } catch (error) {
      // Keep a verified AVIF if a failed restore left a reference pointing to it.
      if (await readText(this.folder, 'pic.json') === this.galleryText
        && await readText(this.blog.travel, this.choice.filename) === markdown) {
        await takeBack(asset.directory, [{ name: filename, data: converted }]);
      }
      throw error;
    }
    this.gallerySaved(gallery, write.next);
    try {
      const current = await (await asset.directory.getFileHandle(original.name)).getFile();
      if (!fileMatches(original, current) || !await identical(original, current)) throw new Error();
      await asset.directory.removeEntry(original.name);
    } catch {
      throw new Error(`${filename} and its references were saved, but the original JPEG could not be removed. Review the folder before syncing.`);
    }
    return filename;
  }

  private markdownReferences(markdown: string | null, src: string, target: string): FileWrite[] {
    if (!markdown) return [];
    const path = this.localPath(src);
    const possible = [...new Set([src, path && this.assetUrl(...path), path && decodeURIComponent(this.assetUrl(...path))])];
    let next = markdown;
    for (const candidate of possible) {
      if (!candidate) continue;
      const suffix = /(?=[\s"'<>()[\]?#]|$)/;
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      next = next.replace(new RegExp(escaped + suffix.source, 'g'), target);
    }
    return next === markdown ? [] : [{ directory: this.blog.travel, name: this.choice.filename, previous: markdown, next }];
  }

  async photoRemovalImpact(index: number): Promise<string> {
    const src = this.gallery[index].src;
    const markdown = await readText(this.blog.travel, this.choice.filename);
    const removedIndexes = this.gallery.map((entry, i) => this.sameAsset(entry.src, src) ? i + 1 : 0).filter(Boolean);
    const first = removedIndexes[0] ?? index + 1;
    const links = [...new Set([...(markdown ?? '').matchAll(/#gallery-(\d+)/g)]
      .filter(match => Number(match[1]) >= first).map(match => match[0]))];
    const direct = this.markdownReferences(markdown, src, 'remove-preview').length > 0;
    return [
      direct ? 'The post directly references this photo. Review its cover and image links.' : '',
      links.length ? `Review links to ${links.join(', ')} after deletion.` : '',
    ].filter(Boolean).join(' ');
  }

  async deletePhoto(index: number, expected: File | null) {
    const src = this.gallery[index].src;
    const asset = expected ? await this.localAsset(src) : null;
    if (expected && (!asset || !photoFile(asset.file.name) || !fileMatches(expected, asset.file)
      || !await identical(expected, asset.file))) {
      throw new Error('The photo changed on disk or is in an unsupported format. Reopen it first.');
    }
    const gallery = this.gallery.flatMap((entry, i) => {
      if (i === index || (asset && this.sameAsset(entry.src, src))) return [];
      const updated = { ...entry };
      if (asset) for (const key of ['preview', 'thumb', 'link', 'lightboxLink']) {
        if (this.sameAsset(updated[key], src)) delete updated[key];
      }
      return [updated];
    });
    const write = this.galleryWrite(gallery);
    await applyWrites([write]);
    try {
      if (asset && expected) {
        const current = await (await asset.directory.getFileHandle(asset.file.name)).getFile();
        if (!fileMatches(expected, current) || !await identical(expected, current)) {
          throw new Error('The photo changed on disk during deletion. The gallery was restored.');
        }
        await asset.directory.removeEntry(asset.file.name);
      }
    } catch (error) {
      await saveText({ ...write, previous: write.next, next: write.previous! });
      throw error;
    }
    this.gallerySaved(gallery, write.next);
  }

  async saveMap(data: MapDocument, imports: TrackDraft[], filesToDelete: string[]): Promise<string[]> {
    const write = { directory: this.folder, name: 'map.json', previous: this.mapText, next: formatJson(data) };
    if (await readText(this.folder, 'map.json') !== this.mapText) throw new Error('map.json changed on disk. Reopen the post.');
    const copied: { name: string; data: Blob }[] = [];
    const trackFolder = imports.length ? await this.folder.getDirectoryHandle('track', { create: true }) : null;
    try {
      for (const { file } of imports) {
        await storeNew(trackFolder!, file.name, file);
        copied.push({ name: file.name, data: file });
      }
      await applyWrites([write]);
    } catch (error) {
      if (trackFolder) await takeBack(trackFolder, copied);
      throw error;
    }
    this.map = data;
    this.mapText = write.next;

    const left = Object.values(data.track ?? {}).flat();
    const kept: string[] = [];
    for (const src of filesToDelete) {
      const path = this.localPath(src);
      if (path?.length !== 2 || path[0] !== 'track' || left.some(item => this.sameAsset(item, src))) continue;
      try {
        if (await this.trackUsedElsewhere(src)) { kept.push(path[1]); continue; }
        const asset = await this.localAsset(src);
        if (asset) await asset.directory.removeEntry(asset.file.name);
      } catch { kept.push(path[1]); }
    }
    return kept;
  }

  private async trackUsedElsewhere(src: string): Promise<boolean> {
    for (const [slug, handle] of await directoryEntries(this.blog.assets)) {
      if (handle.kind !== 'directory' || slug === this.choice.slug) continue;
      const map = await readText(handle as FileSystemDirectoryHandle, 'map.json');
      if (map?.includes(src)) return true;
    }
    return false;
  }
}

export function effectiveLocation(entry: PhotoEntry, location: Point | null): Point | null {
  const point = [entry.exif?.latitude ?? location?.[0], entry.exif?.longitude ?? location?.[1]];
  return validPoint(point) ? point : null;
}

export function captureText(entry: PhotoEntry, exifTime: string | null): string {
  return (localTime(entry.exif?.dateTimeOriginal) ?? exifTime)?.replace('T', ' ') ?? '';
}

export function gpxSegments(source: string): Point[][] {
  const xml = new DOMParser().parseFromString(source, 'application/xml');
  if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'gpx') throw new Error('Invalid GPX file.');
  const segments = Array.from(xml.getElementsByTagNameNS('*', 'trkseg'), segment =>
    Array.from(segment.getElementsByTagNameNS('*', 'trkpt')).flatMap(point => {
      const latitude = point.getAttribute('lat');
      const longitude = point.getAttribute('lon');
      if (!latitude?.trim() || !longitude?.trim()) return [];
      const pair = [Number(latitude), Number(longitude)];
      return validPoint(pair) ? [pair] : [];
    }),
  ).filter(segment => segment.length >= 2);
  if (!segments.length) throw new Error('The GPX file has no drawable track segments.');
  return segments;
}

// ISO BMFF metadata for still AVIF images. The compressed image items are copied byte for byte.
interface Box { type: string; start: number; content: number; end: number }
interface Extent { index: number; offset: number; length: number }
interface Location { id: number; method: number; reference: number; extents: Extent[] }

const text = new TextDecoder();
const ascii = (value: string) => new TextEncoder().encode(value);

function fail(reason: string): never {
  throw new Error(`Unsupported AVIF layout: ${reason}`);
}

function join(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

function num(value: number, width: number): Uint8Array<ArrayBuffer> {
  if (!Number.isSafeInteger(value) || value < 0 || value >= 256 ** width) fail('integer overflow');
  const bytes = new Uint8Array(width);
  for (let index = width - 1; index >= 0; index -= 1) {
    bytes[index] = value % 256;
    value = Math.floor(value / 256);
  }
  return bytes;
}

class Reader {
  constructor(readonly bytes: Uint8Array, public at = 0, readonly end = bytes.length) {}

  read(width: number): number {
    if (width > 8 || this.at + width > this.end) fail('truncated box');
    let value = 0;
    for (let i = 0; i < width; i += 1) value = value * 256 + this.bytes[this.at++];
    if (!Number.isSafeInteger(value)) fail('integer overflow');
    return value;
  }

  boxes(): Box[] {
    const boxes: Box[] = [];
    while (this.at < this.end) {
      const start = this.at;
      let size = this.read(4);
      const typeStart = this.at;
      this.read(4);
      const type = text.decode(this.bytes.subarray(typeStart, this.at));
      if (size === 1) size = this.read(8);
      if (size === 0) size = this.end - start;
      if (size < this.at - start || start + size > this.end) fail('invalid box size');
      boxes.push({ type, start, content: this.at, end: start + size });
      this.at = start + size;
    }
    return boxes;
  }
}

function pack(type: string, ...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  return join([num(8 + parts.reduce((sum, part) => sum + part.length, 0), 4), ascii(type), ...parts]);
}

function layout(bytes: Uint8Array) {
  const top = new Reader(bytes).boxes();
  const meta = top.find(box => box.type === 'meta');
  if (!meta || top.some(box => box.type === 'moov' || box.type === 'moof')) fail('expected a still image');
  if (bytes[meta.content] !== 0) fail('unknown metadata version');
  const children = new Reader(bytes, meta.content + 4, meta.end).boxes();
  const iloc = children.find(box => box.type === 'iloc');
  const iinf = children.find(box => box.type === 'iinf');
  const pitm = children.find(box => box.type === 'pitm');
  if (!iloc || !iinf || !pitm) fail('missing item information');

  const loc = new Reader(bytes, iloc.content, iloc.end);
  const locVersion = loc.read(1);
  if (locVersion > 2) fail('unknown location version');
  loc.read(3);
  const extentSizes = loc.read(1);
  const baseSizes = loc.read(1);
  const offsetSize = extentSizes >> 4;
  const lengthSize = extentSizes & 15;
  const baseSize = baseSizes >> 4;
  const indexSize = locVersion === 0 ? 0 : baseSizes & 15;
  const idSize = locVersion === 2 ? 4 : 2;
  const locCount = loc.read(idSize);
  const locations: Location[] = [];
  for (let i = 0; i < locCount; i += 1) {
    const id = loc.read(idSize);
    const method = locVersion === 0 ? 0 : loc.read(2) & 15;
    const reference = loc.read(2);
    const base = loc.read(baseSize);
    const extentCount = loc.read(2);
    const extents: Extent[] = [];
    for (let j = 0; j < extentCount; j += 1) {
      const index = loc.read(indexSize);
      const offset = base + loc.read(offsetSize);
      const length = loc.read(lengthSize);
      extents.push({ index, offset, length });
    }
    locations.push({ id, method, reference, extents });
  }
  if (loc.at !== iloc.end) fail('trailing item locations');

  const info = new Reader(bytes, iinf.content, iinf.end);
  const infoVersion = info.read(1);
  if (infoVersion > 1) fail('unknown item information version');
  info.read(3);
  const infoCountSize = infoVersion === 0 ? 2 : 4;
  const infoCount = info.read(infoCountSize);
  const entries = info.boxes();
  if (entries.length !== infoCount) fail('incomplete item information');
  const entryIds = entries.map(entry => {
    const r = new Reader(bytes, entry.content, entry.end);
    const v = r.read(1);
    if (entry.type !== 'infe' || (v !== 2 && v !== 3)) fail('unknown item entry version');
    r.read(3);
    const id = r.read(v === 2 ? 2 : 4);
    r.read(2);
    return { id, isExif: text.decode(bytes.subarray(r.at, r.at + 4)) === 'Exif' };
  });
  const exifs = entryIds.filter(entry => entry.isExif);
  if (exifs.length > 1) fail('multiple EXIF items');
  const exif = exifs[0] && locations.find(item => item.id === exifs[0].id);
  if (exifs.length && (!exif || exif.reference !== 0 || exif.extents.length !== 1)) fail('unavailable EXIF extent');

  const primary = new Reader(bytes, pitm.content, pitm.end);
  const primaryVersion = primary.read(1);
  if (primaryVersion > 1) fail('unknown primary item version');
  primary.read(3);
  const primaryId = primary.read(primaryVersion === 0 ? 2 : 4);
  const itemData = children.find(box => box.type === 'idat');
  return { top, meta, children, iloc, iinf, infoCount, infoCountSize, entries, entryIds, locations, exif,
    primaryId, locVersion, idSize, indexSize, itemData };
}

type Layout = ReturnType<typeof layout>;

function oldExifRange(file: Layout, size: number): [number, number] | null {
  const { exif, itemData } = file;
  if (!exif) return null;
  const { offset, length } = exif.extents[0];
  if (exif.method > 1 || (exif.method === 1 && !itemData)) fail('unknown EXIF location');
  const base = exif.method === 1 ? itemData!.content : 0;
  if (offset + length + base > (exif.method === 1 ? itemData!.end : size)) fail('EXIF outside the file');
  if (exif.method === 0 && !file.top.some(box => box.type === 'mdat' && offset >= box.content && offset + length <= box.end)) {
    fail('EXIF outside media data');
  }
  const shared = file.locations.some(item => item !== exif && item.reference === 0 && item.method === exif.method
    && item.extents.some(extent => extent.offset < offset + length && extent.offset + extent.length > offset));
  if (shared) fail('EXIF shares bytes with another item');
  return [base + offset, base + offset + length];
}

export function avifTiff(bytes: Uint8Array): Uint8Array {
  const file = layout(bytes);
  const range = oldExifRange(file, bytes.length);
  if (!range) return new Uint8Array();
  const exif = new Reader(bytes, range[0], range[1]);
  const offset = exif.read(4);
  const start = exif.at + offset;
  const signature = text.decode(bytes.subarray(start, start + 2));
  if (start + 8 > range[1] || (signature !== 'II' && signature !== 'MM')) fail('invalid TIFF header');
  return bytes.subarray(start, range[1]);
}

export function setAvifExif(input: Uint8Array, payload: Uint8Array): Uint8Array<ArrayBuffer> {
  const file = layout(input);
  const bytes = input.slice();
  const { meta, children, iloc, iinf, infoCount, infoCountSize, entries, entryIds, exif,
    primaryId, locVersion, idSize, indexSize } = file;
  const oldRange = oldExifRange(file, input.length);
  if (oldRange) bytes.fill(0, ...oldRange);

  const id = exif?.id ?? Math.max(0, ...entryIds.map(entry => entry.id), ...file.locations.map(item => item.id)) + 1;
  const iref = children.find(child => child.type === 'iref');
  const originalIrefVersion = iref ? bytes[iref.content] : null;
  if (originalIrefVersion !== null && originalIrefVersion > 1) fail('unknown item reference version');

  let newInfo: Uint8Array | undefined;
  let newReference: Uint8Array | undefined;
  if (!exif) {
    const infoEntryIdSize = id <= 65535 ? 2 : 4;
    const item = pack('infe', num(infoEntryIdSize === 2 ? 2 : 3, 1), num(0, 3),
      num(id, infoEntryIdSize), num(0, 2), ascii('ExifExif\0'));
    newInfo = pack('iinf', bytes.subarray(iinf.content, iinf.content + 4), num(infoCount + 1, infoCountSize),
      ...entries.map(entry => bytes.subarray(entry.start, entry.end)), item);
    const referenceSize = originalIrefVersion === 1 || (!iref && (id > 65535 || primaryId > 65535)) ? 4 : 2;
    const link = pack('cdsc', num(id, referenceSize), num(1, 2), num(primaryId, referenceSize));
    newReference = pack('iref', iref ? bytes.subarray(iref.content, iref.end)
      : Uint8Array.of(referenceSize === 4 ? 1 : 0, 0, 0, 0), link);
  }

  const locations = file.locations.filter(item => item !== exif);
  function makeLocations(delta: number, newOffset: number) {
    const all = [...locations, { id, method: 0, reference: 0, extents: [{ index: 0, offset: newOffset, length: payload.length }] }];
    const parts = [Uint8Array.of(locVersion, 0, 0, 0, 0x44, indexSize), num(all.length, idSize)];
    for (const item of all) {
      parts.push(num(item.id, idSize));
      if (locVersion > 0) parts.push(num(item.method, 2));
      parts.push(num(item.reference, 2), num(item.extents.length, 2));
      for (const extent of item.extents) {
        let offset = extent.offset;
        if (item.id !== id && item.method === 0 && item.reference === 0) {
          if (offset >= meta.end) offset += delta;
          else if (offset + extent.length > meta.start) fail('absolute item points into metadata');
        }
        parts.push(num(extent.index, indexSize), num(offset, 4), num(extent.length, 4));
      }
    }
    return pack('iloc', ...parts);
  }

  const otherSize = children.reduce((size, box) => {
    if (box === iloc) return size;
    if (box === iinf && newInfo) return size + newInfo.length;
    if (box === iref && newReference) return size + newReference.length;
    return size + box.end - box.start;
  }, 0) + (!iref && newReference ? newReference.length : 0);
  const delta = 12 + otherSize + makeLocations(0, 0).length - (meta.end - meta.start);
  const parts = children.map(box => {
    if (box === iloc) return makeLocations(delta, bytes.length + delta + 8);
    if (box === iinf && newInfo) return newInfo;
    if (box === iref && newReference) return newReference;
    return bytes.subarray(box.start, box.end);
  });
  if (!iref && newReference) parts.push(newReference);

  // An open-ended last box must be closed before attaching a new mdat.
  const last = new Reader(bytes).boxes().at(-1)!;
  if (last.start >= meta.end && new Reader(bytes, last.start).read(4) === 0) {
    bytes.set(num(last.end - last.start, 4), last.start);
  }
  return join([bytes.subarray(0, meta.start), pack('meta', bytes.subarray(meta.content, meta.content + 4), ...parts),
    bytes.subarray(meta.end), pack('mdat', payload)]);
}

export function normalizeEncoderOffsets(bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const file = layout(bytes);
  // The pinned libheif encoder writes v0 locations with four-byte bases and offsets.
  // Folding the base into each extent also makes these files readable by the blog's exifr.
  const { iloc } = file;
  const reader = new Reader(bytes, iloc.content, iloc.end);
  if (reader.read(4) !== 0 || reader.read(1) !== 0x44 || reader.read(1) !== 0x40) {
    fail('encoder output changed');
  }
  const count = reader.read(2);
  for (let i = 0; i < count; i += 1) {
    reader.read(2);
    if (reader.read(2) !== 0) fail('external encoder data reference');
    const baseAt = reader.at;
    const base = reader.read(4);
    bytes.fill(0, baseAt, baseAt + 4);
    const extents = reader.read(2);
    for (let j = 0; j < extents; j += 1) {
      const at = reader.at;
      const offset = base + reader.read(4);
      if (offset + reader.read(4) > bytes.length) fail('encoder data outside the file');
      bytes.set(num(offset, 4), at);
    }
  }
  return bytes;
}

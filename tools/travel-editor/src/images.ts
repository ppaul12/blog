import { parse } from 'exifr';

export type Point = [latitude: number, longitude: number];
export const equipmentTags = {
  camera: 'Model', lens: 'LensModel', aperture: 'FNumber', shutter: 'ExposureTime',
  iso: 'ISO', focalLength: 'FocalLength', exposureBias: 'ExposureCompensation', metering: 'MeteringMode',
} as const;
export type EquipmentField = keyof typeof equipmentTags;
export const equipmentFields = Object.keys(equipmentTags) as EquipmentField[];
export interface PhotoExif extends Partial<Record<EquipmentField, string | number | null>> {
  time: string | null;
  offset: string | null;
  location: Point | null;
}
export type ExifChanges = Partial<PhotoExif>;
export interface Encoding { quality: number; speed: number; chroma: '420' | '444' }

export const photoFile = (name: string) => /\.(?:jpe?g|avif)$/i.test(name);
export const jpegFile = (name: string) => /\.jpe?g$/i.test(name);

export function validPoint(value: unknown): value is Point {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number'
    && Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180;
}

export function localTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}:\d{2}:\d{2})$/);
  if (!match) return null;
  const normalized = `${match[1]}-${match[2]}-${match[3]}T${match[4]}`;
  const date = new Date(normalized + 'Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19) === normalized ? normalized : null;
}

export function utcOffset(value: string): boolean {
  return /^[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)$/.test(value);
}

export function offsetMinutes(offset: string): number {
  return (offset[0] === '-' ? -1 : 1) * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4)));
}

export async function readExif(file: Blob): Promise<PhotoExif> {
  const tags = await parse(file, {
    reviveValues: false,
    translateValues: false,
    pick: ['DateTimeOriginal', 'OffsetTimeOriginal', 'GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef', 'ExposureBiasValue', ...Object.values(equipmentTags)],
  }) ?? {};
  const point = [tags.latitude, tags.longitude];
  const equipment: Partial<PhotoExif> = {};
  for (const field of equipmentFields) {
    const value = tags[equipmentTags[field]] ?? (field === 'exposureBias' ? tags.ExposureBiasValue : undefined);
    equipment[field] = (field === 'camera' || field === 'lens')
      ? (typeof value === 'string' ? value.trim() || null : null)
      : (typeof value === 'number' && Number.isFinite(value) ? value : null);
  }
  return {
    ...equipment,
    time: localTime(tags.DateTimeOriginal),
    offset: typeof tags.OffsetTimeOriginal === 'string' && utcOffset(tags.OffsetTimeOriginal)
      ? tags.OffsetTimeOriginal : null,
    location: validPoint(point) ? point : null,
  };
}

export type CodecAction =
  | { kind: 'convert'; encoding: Encoding }
  | { kind: 'exif'; jpeg: boolean; changes: ExifChanges };

let worker: Worker | undefined;
let requestId = 0;
const requests = new Map<number, { resolve: (value: Blob) => void; reject: (reason: Error) => void }>();

async function processImage(blob: Blob, action: CodecAction): Promise<Blob> {
  if (!worker) {
    worker = new Worker(new URL('./image-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<{ id: number; bytes?: ArrayBuffer; error?: string }>) => {
      const request = requests.get(data.id);
      requests.delete(data.id);
      if (data.bytes) request?.resolve(new Blob([data.bytes]));
      else request?.reject(new Error(data.error ?? 'Image processing failed.'));
    };
    worker.onerror = () => {
      for (const request of requests.values()) request.reject(new Error('Could not start the image worker.'));
      requests.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  const bytes = await blob.arrayBuffer();
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    requests.set(id, { resolve, reject });
    worker!.postMessage({ id, action, bytes }, [bytes]);
  });
}

export async function editExif(file: File, changes: ExifChanges): Promise<Blob> {
  const jpeg = jpegFile(file.name);
  const [result, before] = await Promise.all([processImage(file, { kind: 'exif', jpeg, changes }), readExif(file)]);
  const expected = { ...before, ...changes };
  const after = await readExif(result);
  if (expected.time !== after.time || expected.offset !== after.offset || !samePoint(expected.location, after.location)
    || equipmentFields.some(field => !sameExifValue(expected[field], after[field]))) {
    throw new Error('The edited EXIF fields failed verification. The original photo was kept.');
  }
  const bitmap = await createImageBitmap(result);
  bitmap.close();
  return new Blob([result], { type: jpeg ? 'image/jpeg' : 'image/avif' });
}

export function sameExifValue(left: string | number | null | undefined, right: string | number | null | undefined): boolean {
  if (typeof left === 'number' && typeof right === 'number') return Math.abs(left - right) <= 1e-8 * Math.max(1, Math.abs(left));
  return (left ?? null) === (right ?? null);
}

export function samePoint(left: Point | null, right: Point | null): boolean {
  if (!left || !right) return left === right;
  return Math.abs(left[0] - right[0]) < 0.00000001 && Math.abs(left[1] - right[1]) < 0.00000001;
}

export async function convertPhoto(file: File, encoding: Encoding): Promise<{ blob: Blob; size: [number, number] }> {
  const [result, before] = await Promise.all([processImage(file, { kind: 'convert', encoding }), readExif(file)]);
  const after = await readExif(result);
  if (before.time !== after.time || before.offset !== after.offset || !samePoint(before.location, after.location)) {
    throw new Error('The preview did not preserve capture time or GPS. The original photo was kept.');
  }
  const blob = new Blob([result], { type: 'image/avif' });
  const bitmap = await createImageBitmap(blob);
  const size: [number, number] = [bitmap.width, bitmap.height];
  bitmap.close();
  return { blob, size };
}

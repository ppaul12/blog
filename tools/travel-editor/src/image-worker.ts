import { avifTiff, normalizeEncoderOffsets, setAvifExif } from './avif';
import type { CodecAction, Encoding, ExifChanges } from './images';
import exifUrl from './exif.wasm?url';

interface Codec {
  memory: WebAssembly.Memory;
  prepare(index: number, length: number): number;
  edit(jpeg: boolean): number;
  result_ptr(): number;
  result_len(): number;
}

let codec: Promise<Codec> | undefined;

async function edit(bytes: Uint8Array, jpeg: boolean, changes: ExifChanges): Promise<Uint8Array<ArrayBuffer>> {
  codec ??= WebAssembly.instantiateStreaming(fetch(exifUrl)).then(module => module.instance.exports as unknown as Codec)
    .catch(error => { codec = undefined; throw error; });
  const wasm = await codec;
  const settings = new TextEncoder().encode(JSON.stringify({
    ...changes,
    ...('time' in changes ? { time: changes.time?.replace(/^\d{4}-\d{2}-\d{2}/, date => date.replaceAll('-', ':')).replace('T', ' ') ?? null } : {}),
  }));
  [jpeg ? bytes : avifTiff(bytes), settings].forEach((input, index) => {
    const offset = wasm.prepare(index, input.length);
    new Uint8Array(wasm.memory.buffer, offset, input.length).set(input);
  });
  const success = wasm.edit(jpeg);
  const result = new Uint8Array(wasm.memory.buffer, wasm.result_ptr(), wasm.result_len()).slice();
  if (!success) throw new Error(new TextDecoder().decode(result));
  return jpeg ? result : setAvifExif(bytes, result);
}

let magick: Promise<typeof import('@imagemagick/magick-wasm')> | undefined;

async function convert(bytes: Uint8Array, encoding: Encoding): Promise<Uint8Array<ArrayBuffer>> {
  magick ??= (async () => {
    const lib = await import('@imagemagick/magick-wasm');
    const { default: url } = await import('@imagemagick/magick-wasm/magick.wasm?url');
    await lib.initializeImageMagick(new URL(url, self.location.href));
    return lib;
  })().catch(error => { magick = undefined; throw error; });
  const { ImageMagick, MagickFormat } = await magick;
  if (!Number.isInteger(encoding.quality) || encoding.quality < 0 || encoding.quality > 100
    || !Number.isInteger(encoding.speed) || encoding.speed < 0 || encoding.speed > 9
    || !['420', '444'].includes(encoding.chroma)) throw new Error('Invalid AVIF encoding settings.');
  const output = ImageMagick.read(bytes, image => {
    image.autoOrient();
    image.quality = encoding.quality;
    image.settings.setDefine(MagickFormat.Heic, 'speed', encoding.speed);
    image.settings.setDefine(MagickFormat.Heic, 'chroma', encoding.chroma);
    return image.write(MagickFormat.Avif, result => new Uint8Array(result).slice());
  });
  return normalizeEncoderOffsets(output);
}

self.onmessage = async ({ data }: MessageEvent<{ id: number; action: CodecAction; bytes: ArrayBuffer }>) => {
  try {
    const input = new Uint8Array(data.bytes);
    const action = data.action;
    const result = action.kind === 'convert'
      ? await convert(input, action.encoding)
      : await edit(input, action.jpeg, action.changes);
    self.postMessage({ id: data.id, bytes: result.buffer }, { transfer: [result.buffer] });
  } catch (error) {
    self.postMessage({ id: data.id, error: error instanceof Error ? error.message : String(error) });
  }
};

import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const codec = new URL('../codec/', import.meta.url);
const build = spawnSync('cargo', ['build', '--locked', '--release', '--target', 'wasm32-unknown-unknown'], {
  cwd: fileURLToPath(codec),
  stdio: 'inherit',
});
if (build.error?.code === 'ENOENT') {
  console.error('Install Rust via rustup, then run: rustup target add wasm32-unknown-unknown');
}
if (build.status !== 0) process.exit(build.status ?? 1);
copyFileSync(
  new URL('target/wasm32-unknown-unknown/release/travel_editor_exif.wasm', codec),
  new URL('../src/exif.wasm', import.meta.url),
);

import 'leaflet/dist/leaflet.css';
import './style.css';
import { Blog, Post, type PostChoice } from './project';
import { PicPanel } from './pic';
import { MapPanel } from './map';
import { byId, confirmAction, notice, showError } from './ui';

type Tab = 'pic' | 'map';
type LocalWindow = Window & { showDirectoryPicker?: (options: { mode: 'readwrite' }) => Promise<FileSystemDirectoryHandle> };

const open = byId<HTMLButtonElement>('open-blog');
const picker = byId<HTMLSelectElement>('post-select');
const panels = { pic: byId('pic'), map: byId('map') };
const tabs = { pic: byId<HTMLButtonElement>('pic-tab'), map: byId<HTMLButtonElement>('map-tab') };
let tab: Tab = 'pic';
let blog: Blog | null = null;
let post: Post | null = null;
let photos: PicPanel | null = null;
let map: MapPanel | null = null;
let busy = false;

async function run(message: string, work: () => Promise<void>) {
  if (busy) return;
  busy = true;
  open.disabled = true;
  picker.disabled = true;
  panels.pic.inert = true;
  panels.map.inert = true;
  tabs.pic.disabled = true;
  tabs.map.disabled = true;
  notice(message);
  try {
    await work();
  } catch (error) {
    showError(error);
  } finally {
    panels.pic.inert = false;
    panels.map.inert = false;
    open.disabled = !(window as LocalWindow).showDirectoryPicker;
    picker.disabled = !blog;
    tabs.pic.disabled = !post;
    tabs.map.disabled = !post;
    busy = false;
  }
}

function switchTab(next: Tab) {
  tab = next;
  for (const key of ['pic', 'map'] as const) {
    panels[key].hidden = !post || key !== tab;
    tabs[key].setAttribute('aria-selected', String(key === tab));
    tabs[key].tabIndex = key === tab ? 0 : -1;
  }
  if (tab === 'pic') photos?.visible();
  else {
    photos?.hidden();
    map?.visible();
  }
}

async function showPost(nextBlog: Blog, choice: PostChoice) {
  const next = await Post.open(nextBlog, choice);
  photos?.destroy();
  map?.destroy();
  post = next;
  blog = nextBlog;
  photos = new PicPanel(panels.pic, post, run, () => void map?.refreshPhotos());
  map = new MapPanel(panels.map, post, run, index => {
    switchTab('pic');
    void photos?.requestSelect(index);
  });
  byId('welcome').hidden = true;
  byId('post-location').textContent = `assets/src/${choice.slug}/`;
  byId('post-picker').hidden = false;
  await photos.open();
  switchTab(tab);
}

async function canLeave() {
  return !(photos?.isDirty() || map?.isDirty()) || (await confirmAction({
    title: 'Discard unsaved changes?', body: 'Save the current photo and map before switching posts to keep their edits.',
    action: 'Discard changes',
  })).accepted;
}

open.addEventListener('click', async () => {
  if (busy || !(await canLeave())) return;
  const browser = window as LocalWindow;
  if (!browser.showDirectoryPicker) return;
  let root: FileSystemDirectoryHandle;
  try {
    root = await browser.showDirectoryPicker({ mode: 'readwrite' });
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) showError(error);
    return;
  }
  await run('Opening blog folder…', async () => {
    let nextBlog: Blog;
    try {
      nextBlog = await Blog.open(root);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        throw new Error('Choose a blog checkout containing assets/src and _posts/travel.');
      }
      throw error;
    }
    const selected = nextBlog.posts.find(choice => choice.filename === post?.choice.filename) ?? nextBlog.posts[0];
    await showPost(nextBlog, selected);
    picker.replaceChildren(...nextBlog.posts.map(choice => new Option(`${choice.filename.slice(0, 10)} · ${choice.title}`, choice.filename)));
    picker.value = selected.filename;
    notice('');
  });
});

picker.addEventListener('change', async () => {
  const chosen = blog?.posts.find(item => item.filename === picker.value);
  if (!blog || !chosen || chosen.filename === post?.choice.filename) return;
  if (!await canLeave()) {
    picker.value = post?.choice.filename ?? '';
    return;
  }
  await run('Opening travel post…', async () => {
    try {
      await showPost(blog!, chosen);
      notice('');
    } finally {
      picker.value = post?.choice.filename ?? '';
    }
  });
});

for (const key of ['pic', 'map'] as const) {
  tabs[key].addEventListener('click', () => switchTab(key));
  tabs[key].addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'pic' : event.key === 'End' ? 'map' : key === 'pic' ? 'map' : 'pic';
    switchTab(next);
    tabs[next].focus();
  });
}

window.addEventListener('beforeunload', event => {
  if (busy || photos?.isDirty() || map?.isDirty()) event.preventDefault();
});

if (!(window as LocalWindow).showDirectoryPicker) {
  open.disabled = true;
  notice('Open this page in Chromium, Chrome, or Edge over localhost or HTTPS to access local files.', 'error');
}

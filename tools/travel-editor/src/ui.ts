import L from 'leaflet';

export const byId = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing control: ${id}`);
  return element as T;
};

export function control<T extends HTMLElement = HTMLElement>(container: ParentNode, selector: string): T {
  const element = container.querySelector<T>(selector);
  if (!element) throw new Error(`Missing control: ${selector}`);
  return element;
}

export function notice(message: string, kind: 'error' | 'status' = 'status') {
  const element = byId('notice');
  element.textContent = message;
  element.dataset.kind = kind;
  element.hidden = !message;
  element.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}

export function showError(error: unknown) {
  notice(error instanceof Error ? error.message : String(error), 'error');
}

export interface Confirmation { title: string; body: string; action: string; extra?: string }

export async function confirmAction(options: Confirmation): Promise<{ accepted: boolean; checked: boolean }> {
  const dialog = byId<HTMLDialogElement>('confirmation');
  byId('confirm-title').textContent = options.title;
  byId('confirm-body').textContent = options.body;
  byId('confirm-ok').textContent = options.action;
  const label = byId('confirm-extra');
  const box = byId<HTMLInputElement>('confirm-check');
  label.hidden = !options.extra;
  control(label, 'span').textContent = options.extra ?? '';
  box.checked = false;
  dialog.returnValue = 'cancel';
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve({
      accepted: dialog.returnValue === 'confirm',
      checked: box.checked,
    }), { once: true });
    dialog.showModal();
  });
}

export function button(label: string, action: () => void, className?: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  if (className) element.className = className;
  element.addEventListener('click', action);
  return element;
}

export function textSpan(value: string, className?: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

export function makeMap(container: HTMLElement): L.Map {
  const map = L.map(container).setView([35.68, 139.77], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  return map;
}

export function pin(label: string, color: 'spot' | 'photo' | 'pending' = 'spot', selected = false): L.DivIcon {
  return L.divIcon({
    className: `map-pin map-pin-${color}${selected ? ' is-selected' : ''}`,
    html: textSpan(label),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export function kib(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KiB`;
}

export function isoInput(value: string): string {
  return value.length === 16 ? value + ':00' : value;
}

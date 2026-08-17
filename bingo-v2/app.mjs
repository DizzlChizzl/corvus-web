import { bingoV2Data as data } from '../data/bingo-fields-v2-product.mjs';
import { generateBoard, tooltipText } from './engine.mjs';
import { resolveBingoContext } from './session-resolver.mjs';
import { loadRuntimeSnapshot } from './runtime-adapter.mjs';

const runtimeUrl = globalThis.GGD_BINGO_RUNTIME_URL || '';
let runtimeSnapshot = null;
try { runtimeSnapshot = await loadRuntimeSnapshot(runtimeUrl); } catch (error) { console.warn(error); }

const mapSelect = document.querySelector('#map-select');
const status = document.querySelector('#status');
const grid = document.querySelector('#grid');
const detail = document.querySelector('#detail');
const generate = document.querySelector('#generate');

for (const map of data.playable_maps) {
  const option = document.createElement('option');
  option.value = map.id;
  option.textContent = map.name_de;
  mapSelect.append(option);
}

function manualMap() { return mapSelect.value || null; }
function randomCardSeed() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }

function resolveContext() {
  return resolveBingoContext({ now: new Date(), runtimeSnapshot, playableMaps: data.playable_maps, manualMapId: manualMap() });
}

function render() {
  const context = resolveContext();
  if (!context.ok) {
    status.textContent = context.code === 'MAP_REQUIRED' || context.code.includes('UNRESOLVED')
      ? 'Map auswählen – für die aktuelle Zeit ist keine verifizierte RF-Map auflösbar.'
      : `Bingo blockiert: ${context.code}`;
    grid.replaceChildren();
    return;
  }

  if (context.mode === 'RF_SESSION') mapSelect.value = context.mapId;
  const map = data.playable_maps.find((m) => m.id === context.mapId);
  const storageKey = `rf-ggd-bingo-v2:${context.sessionId}:${context.mapId}`;
  let seed = sessionStorage.getItem(storageKey);
  if (!seed) { seed = randomCardSeed(); sessionStorage.setItem(storageKey, seed); }
  const board = generateBoard({ data, mapId: context.mapId, cardSeed: seed });
  status.textContent = `${context.mode === 'RF_SESSION' ? 'RF Wednesday' : 'Manuell'} · ${map.name_de} · eigene Karte`;
  grid.replaceChildren();

  for (const field of board) {
    const button = document.createElement('button');
    button.className = `cell${field.free ? ' free marked' : ''}`;
    button.textContent = field.label;
    button.title = tooltipText(field, map.name_de);
    button.addEventListener('click', () => {
      if (!field.free) button.classList.toggle('marked');
      detail.textContent = tooltipText(field, map.name_de);
    });
    grid.append(button);
  }
}

generate.addEventListener('click', () => {
  const context = resolveContext();
  if (context.ok) sessionStorage.removeItem(`rf-ggd-bingo-v2:${context.sessionId}:${context.mapId}`);
  render();
});
mapSelect.addEventListener('change', render);
render();

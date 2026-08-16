const RELEASE_STATES = new Set(['READY_2_0', 'READY_HUMAN_CONFIRM']);
const RARE_STATES = new Set(['RARE', 'LEGENDARY', 'MYTHIC']);
const LEGENDARY_STATES = new Set(['LEGENDARY', 'MYTHIC']);

function hashSeed(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < String(text).length; i += 1) {
    h ^= String(text).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seedText) {
  let a = hashSeed(seedText) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, seedText) {
  const rng = seededRandom(seedText);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function validateCanonicalPool(data) {
  if (!data || data.schema_version !== '2.0') throw new Error('BINGO_V2_SCHEMA_INVALID');
  if (!Array.isArray(data.fields)) throw new Error('BINGO_V2_FIELDS_MISSING');
  const ids = new Set();
  for (const field of data.fields) {
    if (!field.id || ids.has(field.id)) throw new Error(`BINGO_V2_DUPLICATE_ID:${field.id || 'EMPTY'}`);
    ids.add(field.id);
    if (!field.label || !field.trigger_de || !field.not_trigger_de || !field.detail_de) {
      throw new Error(`BINGO_V2_TOOLTIP_INCOMPLETE:${field.id}`);
    }
    if (!RELEASE_STATES.has(field.release_state)) throw new Error(`BINGO_V2_RELEASE_STATE_INVALID:${field.id}`);
    if (field.live_eligible !== true) throw new Error(`BINGO_V2_NONLIVE_FIELD_IN_CANONICAL:${field.id}`);
  }
  return true;
}

export function eligibleFields(data, mapId) {
  validateCanonicalPool(data);
  const playable = new Set((data.playable_maps || []).map((map) => map.id));
  if (!playable.has(mapId)) throw new Error(`BINGO_V2_INVALID_MAP:${mapId}`);
  return data.fields.filter((field) => {
    if (!RELEASE_STATES.has(field.release_state) || field.live_eligible !== true) return false;
    const maps = Array.isArray(field.maps) ? field.maps : [];
    return maps.length === 0 || maps.includes(mapId);
  });
}

function policyCap(field) {
  const familyCaps = {
    TEAM_WIN: 1,
    NEUTRAL_WIN: 2,
    SPECIAL_WIN: 1,
    SOCIAL_RF: 2,
    VOICE_EFFECT: 1,
  };
  return Math.min(
    Number(field.max_per_card_family || Number.POSITIVE_INFINITY),
    Number(familyCaps[field.family] || Number.POSITIVE_INFINITY),
  );
}

function createTracker() {
  return { family: new Map(), rare: 0, legendary: 0, mapSpecific: 0 };
}

function isMapSpecific(field) {
  return Array.isArray(field.maps) && field.maps.length > 0;
}

function canAdd(field, tracker, maxMapSpecific) {
  const familyCount = tracker.family.get(field.family) || 0;
  if (familyCount >= policyCap(field)) return false;
  if (isMapSpecific(field) && tracker.mapSpecific >= maxMapSpecific) return false;
  if (LEGENDARY_STATES.has(field.rarity_prior) && tracker.legendary >= 1) return false;
  if (RARE_STATES.has(field.rarity_prior) && tracker.rare >= 8) return false;
  return true;
}

function addField(field, selected, tracker) {
  selected.push(field);
  tracker.family.set(field.family, (tracker.family.get(field.family) || 0) + 1);
  if (RARE_STATES.has(field.rarity_prior)) tracker.rare += 1;
  if (LEGENDARY_STATES.has(field.rarity_prior)) tracker.legendary += 1;
  if (isMapSpecific(field)) tracker.mapSpecific += 1;
}

function tryBuild(eligible, seed, size) {
  const mapSpecific = eligible.filter(isMapSpecific);
  const minMapSpecific = mapSpecific.length >= 2 ? Math.min(3, mapSpecific.length) : mapSpecific.length;
  const maxMapSpecific = mapSpecific.length >= 2 ? Math.min(5, mapSpecific.length) : mapSpecific.length;
  const selected = [];
  const selectedIds = new Set();
  const tracker = createTracker();

  for (const field of shuffle(mapSpecific, `${seed}:map`)) {
    if (selected.length >= minMapSpecific) break;
    if (!canAdd(field, tracker, maxMapSpecific)) continue;
    addField(field, selected, tracker);
    selectedIds.add(field.id);
  }

  for (const field of shuffle(eligible, `${seed}:all`)) {
    if (selected.length >= size) break;
    if (selectedIds.has(field.id)) continue;
    if (!canAdd(field, tracker, maxMapSpecific)) continue;
    addField(field, selected, tracker);
    selectedIds.add(field.id);
  }

  if (selected.length !== size) return null;
  if (mapSpecific.length >= 2 && tracker.mapSpecific < 2) return null;
  return selected;
}

export function generateEventFields({ data, mapId, cardSeed, size = 24 }) {
  const eligible = eligibleFields(data, mapId);
  if (eligible.length < size) throw new Error(`BINGO_V2_POOL_TOO_SMALL:${eligible.length}`);
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const selected = tryBuild(eligible, `${cardSeed}:attempt:${attempt}`, size);
    if (selected) return selected;
  }
  throw new Error('BINGO_V2_POOL_OVERCONSTRAINED');
}

export function generateBoard({ data, mapId, cardSeed }) {
  const events = generateEventFields({ data, mapId, cardSeed, size: 24 });
  const board = events.map((field) => ({ ...field, free: false }));
  board.splice(12, 0, {
    id: 'royal-family-free-center',
    label: 'ROYAL FAMILY',
    free: true,
    detail_de: 'Automatisch markiertes Royal-Family-Freifeld.',
  });
  return board;
}

export function tooltipText(field, mapName = '') {
  if (field.free) return field.detail_de;
  const mapPart = mapName && isMapSpecific(field) ? ` Map: ${mapName}.` : '';
  return `${field.detail_de}${mapPart}`;
}

export function cardSignature(board) {
  return board.map((field) => field.id).join('|');
}

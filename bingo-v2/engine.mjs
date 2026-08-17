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
  const proofRequired = data.proof_policy === 'PUBLIC_MEETING_OR_ROUND_END_ONLY';
  const ids = new Set();
  for (const field of data.fields) {
    if (!field.id || ids.has(field.id)) throw new Error(`BINGO_V2_DUPLICATE_ID:${field.id || 'EMPTY'}`);
    ids.add(field.id);
    if (!field.label || !field.trigger_de || !field.not_trigger_de || !field.detail_de) {
      throw new Error(`BINGO_V2_TOOLTIP_INCOMPLETE:${field.id}`);
    }
    if (!RELEASE_STATES.has(field.release_state)) throw new Error(`BINGO_V2_RELEASE_STATE_INVALID:${field.id}`);
    if (field.live_eligible !== true) throw new Error(`BINGO_V2_NONLIVE_FIELD_IN_CANONICAL:${field.id}`);
    if (proofRequired && field.proof_mode !== 'PUBLIC_PROOF') throw new Error(`BINGO_V2_PRIVATE_PROOF_LEAK:${field.id}`);
  }
  return true;
}

export function validateMapSignatures(data) {
  const playable = new Set((data.playable_maps || []).map((map) => map.id));
  const fieldIds = new Set((data.fields || []).map((field) => field.id));
  const signatures = data.map_signatures || {};
  if (Object.keys(signatures).length !== playable.size) throw new Error('BINGO_V2_SIGNATURE_MAPSET_MISMATCH');
  for (const mapId of playable) {
    const policy = signatures[mapId];
    if (!policy) throw new Error(`BINGO_V2_SIGNATURE_MAP_MISSING:${mapId}`);
    const ids = [...(policy.hard || []), ...(policy.conditional || [])];
    if (new Set(ids).size !== ids.length) throw new Error(`BINGO_V2_SIGNATURE_DUPLICATE:${mapId}`);
    for (const id of ids) {
      if (!fieldIds.has(id)) throw new Error(`BINGO_V2_SIGNATURE_FIELD_MISSING:${mapId}:${id}`);
    }
    if (!(policy.min >= 0 && policy.target >= policy.min && policy.max >= policy.target && policy.max <= 6)) {
      throw new Error(`BINGO_V2_SIGNATURE_POLICY_INVALID:${mapId}`);
    }
    if (!ids.length && (policy.min !== 0 || policy.target !== 0 || policy.max !== 0)) {
      throw new Error(`BINGO_V2_EMPTY_SIGNATURE_POLICY_NONZERO:${mapId}`);
    }
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

function specialFamilyCap(field) {
  const familyCaps = {
    TEAM_WIN: 1,
    NEUTRAL_WIN: 2,
    SPECIAL_WIN: 1,
    SOCIAL_RF: 2,
    VOICE_EFFECT: 1,
  };
  return Number(familyCaps[field.family] || Number.POSITIVE_INFINITY);
}

function fieldFamilyCap(field) {
  return Number(field.max_per_card_family || Number.POSITIVE_INFINITY);
}

function createTracker() {
  return { family: new Map(), duplicate: new Map(), rare: 0, legendary: 0, mapSpecific: 0, signatures: 0 };
}

function isMapSpecific(field) {
  return Array.isArray(field.maps) && field.maps.length > 0;
}

function duplicateGroup(field) {
  return field.duplicate_group || field.family;
}

function canAdd(field, tracker, maxMapSpecific) {
  const familyCount = tracker.family.get(field.family) || 0;
  if (familyCount >= specialFamilyCap(field)) return false;
  const group = duplicateGroup(field);
  const duplicateCount = tracker.duplicate.get(group) || 0;
  if (duplicateCount >= fieldFamilyCap(field)) return false;
  if (isMapSpecific(field) && tracker.mapSpecific >= maxMapSpecific) return false;
  if (LEGENDARY_STATES.has(field.rarity_prior) && tracker.legendary >= 1) return false;
  if (RARE_STATES.has(field.rarity_prior) && tracker.rare >= 8) return false;
  return true;
}

function addField(field, selected, tracker, signatureIds) {
  selected.push(field);
  tracker.family.set(field.family, (tracker.family.get(field.family) || 0) + 1);
  const group = duplicateGroup(field);
  tracker.duplicate.set(group, (tracker.duplicate.get(group) || 0) + 1);
  if (RARE_STATES.has(field.rarity_prior)) tracker.rare += 1;
  if (LEGENDARY_STATES.has(field.rarity_prior)) tracker.legendary += 1;
  if (isMapSpecific(field)) tracker.mapSpecific += 1;
  if (signatureIds.has(field.id)) tracker.signatures += 1;
}

function signaturePolicy(data, mapId) {
  validateMapSignatures(data);
  return data.map_signatures[mapId];
}

export function signatureFields(data, mapId) {
  const eligible = eligibleFields(data, mapId);
  const policy = signaturePolicy(data, mapId);
  const ids = new Set([...(policy.hard || []), ...(policy.conditional || [])]);
  return eligible.filter((field) => ids.has(field.id));
}

function tryBuild(data, eligible, mapId, seed, size) {
  const policy = signaturePolicy(data, mapId);
  const signatureIds = new Set([...(policy.hard || []), ...(policy.conditional || [])]);
  const signatures = eligible.filter((field) => signatureIds.has(field.id));
  const requiredSignatures = signatures.length < policy.min ? signatures.length : policy.min;
  const targetSignatures = Math.min(policy.target, signatures.length);
  const maxMapSpecific = policy.max;
  const selected = [];
  const selectedIds = new Set();
  const tracker = createTracker();

  for (const field of shuffle(signatures, `${seed}:signatures`)) {
    if (tracker.signatures >= targetSignatures) break;
    if (!canAdd(field, tracker, maxMapSpecific)) continue;
    addField(field, selected, tracker, signatureIds);
    selectedIds.add(field.id);
  }

  if (tracker.signatures < requiredSignatures) return null;

  for (const field of shuffle(eligible, `${seed}:all`)) {
    if (selected.length >= size) break;
    if (selectedIds.has(field.id)) continue;
    if (!canAdd(field, tracker, maxMapSpecific)) continue;
    addField(field, selected, tracker, signatureIds);
    selectedIds.add(field.id);
  }

  if (selected.length !== size) return null;
  if (tracker.signatures < requiredSignatures) return null;
  return selected;
}

export function generateEventFields({ data, mapId, cardSeed, size = 24 }) {
  const eligible = eligibleFields(data, mapId);
  if (eligible.length < size) throw new Error(`BINGO_V2_POOL_TOO_SMALL:${eligible.length}`);
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const selected = tryBuild(data, eligible, mapId, `${cardSeed}:attempt:${attempt}`, size);
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

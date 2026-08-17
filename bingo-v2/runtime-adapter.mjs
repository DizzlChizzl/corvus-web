// Browser-side defense-in-depth for the public-safe Djehuty Bingo snapshot.
// Raw private session_state rows are intentionally not accepted here.

export const SNAPSHOT_SOURCE = 'RF_GGD_RUNTIME_RUNWAY_READY';
export const SNAPSHOT_CURRENTNESS = 'SAME_DATE_PRODUCTIVE_RUNWAY_READY';

const ALLOWED_KEYS = new Set([
  'schema_version', 'state', 'currentness', 'reason', 'session_id', 'ggd_date',
  'map_id', 'map_name_de', 'map_name_en', 'map_selected_at', 'valid_from',
  'valid_until', 'generated_at', 'source'
]);
const READY_REQUIRED = [
  'session_id', 'ggd_date', 'map_id', 'map_name_de', 'map_name_en',
  'map_selected_at', 'valid_from', 'valid_until', 'generated_at', 'source'
];

export function validateRuntimeSnapshot(payload) {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    throw new Error('BINGO_V2_RUNTIME_PAYLOAD_INVALID');
  }
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_KEYS.has(key)) throw new Error(`BINGO_V2_RUNTIME_FIELD_FORBIDDEN:${key}`);
  }
  if (String(payload.schema_version || '') !== '1.0') {
    throw new Error('BINGO_V2_RUNTIME_SCHEMA_UNSUPPORTED');
  }
  if (!['READY', 'UNAVAILABLE'].includes(String(payload.state || ''))) {
    throw new Error('BINGO_V2_RUNTIME_STATE_INVALID');
  }
  if (payload.state === 'READY') {
    for (const key of READY_REQUIRED) {
      if (!String(payload[key] || '').trim()) throw new Error(`BINGO_V2_RUNTIME_READY_FIELD_MISSING:${key}`);
    }
  } else {
    for (const key of ['map_id', 'map_name_de', 'map_name_en', 'map_selected_at']) {
      if (key in payload) throw new Error(`BINGO_V2_RUNTIME_UNAVAILABLE_MAP_FIELD:${key}`);
    }
  }
  return Object.freeze({ ...payload });
}

export async function loadRuntimeSnapshot(url, fetchImpl = fetch) {
  if (!url) return null;
  const response = await fetchImpl(url, { cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error(`BINGO_V2_RUNTIME_FETCH_FAILED:${response.status}`);
  return validateRuntimeSnapshot(await response.json());
}

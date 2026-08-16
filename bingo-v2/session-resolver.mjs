export const DEFAULT_TIME_ZONE = 'Europe/Berlin';

function berlinParts(now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DEFAULT_TIME_ZONE,
    weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now);
  const out = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    weekday: out.weekday,
    date: `${out.year}-${out.month}-${out.day}`,
    hour: Number(out.hour),
    minute: Number(out.minute),
  };
}

export function isRfWednesdayWindow(now = new Date()) {
  const p = berlinParts(now);
  return p.weekday === 'Wed' && p.hour >= 19 && p.hour < 21;
}

export function rfOccurrenceId(now = new Date()) {
  const p = berlinParts(now);
  return `RF_GGD_${p.date}`;
}

export function parseRuntimeNotes(notes = '') {
  const values = {};
  for (const raw of String(notes).split(';')) {
    const part = raw.trim();
    if (!part) continue;
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    values[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return values;
}

function normalizeTestMode(value) {
  if (typeof value === 'boolean') return value;
  return String(value).trim().toUpperCase() === 'TRUE';
}

function resolveLatestRunwayRow(rows, sessionId, date) {
  const candidates = rows
    .filter((row) => String(row.session_id || '') === sessionId)
    .filter((row) => String(row.ggd_date || '') === date)
    .filter((row) => String(row.dispatch_window_status || '').toUpperCase() === 'PRODUCTIVE')
    .filter((row) => normalizeTestMode(row.test_mode) === false)
    .filter((row) => String(row.status || '').toUpperCase() === 'RUNWAY_READY')
    .map((row) => ({ row, notes: parseRuntimeNotes(row.notes) }))
    .filter(({ notes }) => notes.current_map_id)
    .sort((a, b) => String(a.row.detected_at || '').localeCompare(String(b.row.detected_at || '')));
  return candidates.at(-1) || null;
}

export function resolveBingoContext({
  now = new Date(),
  runtimeRows = [],
  playableMaps = [],
  manualMapId = null,
} = {}) {
  const validMaps = new Set(playableMaps.map((map) => map.id));
  const parts = berlinParts(now);
  const sessionId = `RF_GGD_${parts.date}`;

  if (manualMapId) {
    if (!validMaps.has(manualMapId)) {
      return { ok: false, code: 'INVALID_MAP', sessionId, mode: 'MANUAL' };
    }
    return {
      ok: true,
      sessionId,
      mapId: manualMapId,
      mode: 'MANUAL',
      source: 'USER_OVERRIDE',
      rfWindow: isRfWednesdayWindow(now),
    };
  }

  if (!isRfWednesdayWindow(now)) {
    return { ok: false, code: 'MAP_REQUIRED', sessionId, mode: 'OUTSIDE_RF_WINDOW' };
  }

  const resolved = resolveLatestRunwayRow(runtimeRows, sessionId, parts.date);
  if (!resolved) {
    return { ok: false, code: 'RF_SESSION_MAP_UNRESOLVED', sessionId, mode: 'RF_SESSION' };
  }

  const mapId = resolved.notes.current_map_id;
  if (!validMaps.has(mapId)) {
    return { ok: false, code: 'RF_SESSION_MAP_INVALID', sessionId, mode: 'RF_SESSION' };
  }

  return {
    ok: true,
    sessionId,
    mapId,
    mode: 'RF_SESSION',
    source: resolved.notes.current_map_source || 'RUNTIME_SESSION_STATE',
    selectedAt: resolved.notes.current_map_selected_at || resolved.row.detected_at || null,
    rfWindow: true,
  };
}

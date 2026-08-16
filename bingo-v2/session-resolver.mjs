import { SNAPSHOT_CURRENTNESS, SNAPSHOT_SOURCE } from './runtime-adapter.mjs';

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

function snapshotTimeIsCurrent(snapshot, now) {
  const from = Date.parse(String(snapshot.valid_from || ''));
  const until = Date.parse(String(snapshot.valid_until || ''));
  const selected = Date.parse(String(snapshot.map_selected_at || ''));
  const current = now.getTime();
  if (![from, until, selected].every(Number.isFinite)) return false;
  return current >= from && current < until;
}

function snapshotMatchesOccurrence(snapshot, sessionId, date, now) {
  if (!snapshot || snapshot.state !== 'READY') return false;
  if (String(snapshot.session_id || '') !== sessionId) return false;
  if (String(snapshot.ggd_date || '') !== date) return false;
  if (String(snapshot.currentness || '') !== SNAPSHOT_CURRENTNESS) return false;
  if (String(snapshot.source || '') !== SNAPSHOT_SOURCE) return false;
  if (!String(snapshot.map_selected_at || '').startsWith(date)) return false;
  if (!snapshotTimeIsCurrent(snapshot, now)) return false;
  return true;
}

export function resolveBingoContext({
  now = new Date(),
  runtimeSnapshot = null,
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

  if (!snapshotMatchesOccurrence(runtimeSnapshot, sessionId, parts.date, now)) {
    return { ok: false, code: 'RF_SESSION_MAP_UNRESOLVED', sessionId, mode: 'RF_SESSION' };
  }

  const mapId = String(runtimeSnapshot.map_id || '');
  if (!validMaps.has(mapId)) {
    return { ok: false, code: 'RF_SESSION_MAP_INVALID', sessionId, mode: 'RF_SESSION' };
  }

  return {
    ok: true,
    sessionId,
    mapId,
    mode: 'RF_SESSION',
    source: runtimeSnapshot.source,
    selectedAt: runtimeSnapshot.map_selected_at,
    rfWindow: true,
  };
}

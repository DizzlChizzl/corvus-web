import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bingoV2Data as data } from '../data/bingo-fields-v2.mjs';
import { resolveBingoContext } from '../bingo-v2/session-resolver.mjs';
import { cardSignature, eligibleFields, generateBoard, generateEventFields, validateCanonicalPool } from '../bingo-v2/engine.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const maps = data.playable_maps;
const wed = new Date('2026-08-19T17:30:00.000Z'); // 19:30 Europe/Berlin
const tue = new Date('2026-08-18T17:30:00.000Z');
const runway = [{
  session_id: 'RF_GGD_2026-08-19', ggd_date: '2026-08-19', dispatch_window_status: 'PRODUCTIVE',
  test_mode: 'FALSE', status: 'RUNWAY_READY', detected_at: '2026-08-19T18:50:14+02:00',
  notes: 'session_state=ACTIVE; mode=PRODUCTIVE; runway_date=2026-08-19; runway_status=READY; current_map_id=map_eagleton_springs; current_map_name_de=Eagleton Springs; current_map_source=MOD_RUNWAY; current_map_selected_at=2026-08-19T18:50:14+02:00'
}];

const ctx = () => resolveBingoContext({ now: wed, runtimeRows: runway, playableMaps: maps });

test('T01 Wednesday RF window resolves same-date PRODUCTIVE RUNWAY_READY map', () => {
  assert.deepEqual(ctx().mapId, 'map_eagleton_springs'); assert.equal(ctx().mode, 'RF_SESSION');
});

test('T02 same session/map context supports different per-user cards', () => {
  const a = generateBoard({ data, mapId: ctx().mapId, cardSeed: 'user-a' });
  const b = generateBoard({ data, mapId: ctx().mapId, cardSeed: 'user-b' });
  assert.notEqual(cardSignature(a), cardSignature(b));
});

test('T03 generated board has 24 unique events plus RF free center', () => {
  const board = generateBoard({ data, mapId: 'map_eagleton_springs', cardSeed: 'size' });
  assert.equal(board.length, 25); assert.equal(board[12].free, true);
  assert.equal(new Set(board.filter((f) => !f.free).map((f) => f.id)).size, 24);
});

test('T04 manual map override wins even inside RF window', () => {
  const c = resolveBingoContext({ now: wed, runtimeRows: runway, playableMaps: maps, manualMapId: 'map_mallard_manor' });
  assert.equal(c.mapId, 'map_mallard_manor'); assert.equal(c.mode, 'MANUAL');
});

test('T05 outside RF window fails closed until map is selected', () => {
  const c = resolveBingoContext({ now: tue, runtimeRows: runway, playableMaps: maps });
  assert.equal(c.ok, false); assert.equal(c.code, 'MAP_REQUIRED');
});

test('T06 The Lounge cannot be selected because it is not a playable map', () => {
  const c = resolveBingoContext({ now: tue, runtimeRows: [], playableMaps: maps, manualMapId: 'map_lounge' });
  assert.equal(c.ok, false); assert.equal(c.code, 'INVALID_MAP');
});

test('T07 Cupid fields are eligible on Eagleton and excluded elsewhere', () => {
  assert(eligibleFields(data, 'map_eagleton_springs').some((f) => f.id === 'bingo_cupid_lovers'));
  assert(!eligibleFields(data, 'map_mallard_manor').some((f) => f.id === 'bingo_cupid_lovers'));
});

test('T08 chandelier and traffic are hard map-locked', () => {
  assert(eligibleFields(data, 'map_mallard_manor').some((f) => f.id === 'bingo_chandelier'));
  assert(!eligibleFields(data, 'map_eagleton_springs').some((f) => f.id === 'bingo_chandelier'));
  assert(eligibleFields(data, 'map_eagleton_springs').some((f) => f.id === 'bingo_bus'));
});

test('T09 role-derived map availability is encoded for Mime/Undertaker', () => {
  assert(!eligibleFields(data, 'map_black_swan').some((f) => f.id === 'bingo_mime_control'));
  assert(eligibleFields(data, 'map_nexus_colony').some((f) => f.id === 'bingo_mime_control'));
  assert(eligibleFields(data, 'map_basement').some((f) => f.id === 'bingo_undertaker_drag'));
});

test('T10 family caps prevent Sheriff/Pelican flooding', () => {
  const fields = generateEventFields({ data, mapId: 'map_eagleton_springs', cardSeed: 'caps' });
  assert(fields.filter((f) => f.family === 'SHERIFF').length <= 1);
  assert(fields.filter((f) => f.family === 'PELICAN').length <= 2);
});

test('T11 standard canonical pool contains no known meta fields', () => {
  for (const id of ['bingo_djehuty_saves_it','bingo_falcon_confusion','bingo_no_lounge','bingo_clown_warning']) {
    assert(!data.fields.some((f) => f.id === id));
  }
});

test('T12 every field has detailed trigger + not-trigger tooltip data', () => {
  assert.equal(validateCanonicalPool(data), true);
  assert(data.fields.every((f) => f.detail_de.includes('Nicht zählen:')));
});

test('T13 intelligence remains UNKNOWN/PENDING rather than fake precision', () => {
  assert(data.fields.every((f) => f.intelligence.state === 'PENDING_EVENT_HARVEST' && f.intelligence.confidence === 'UNKNOWN'));
});

test('T14 stale previous-Wednesday RUNWAY_READY cannot resolve current Wednesday', () => {
  const stale = [{...runway[0], session_id:'RF_GGD_2026-08-12', ggd_date:'2026-08-12'}];
  const c = resolveBingoContext({ now: wed, runtimeRows: stale, playableMaps: maps });
  assert.equal(c.ok, false); assert.equal(c.code, 'RF_SESSION_MAP_UNRESOLVED');
});

test('T15 canonical source has unique ids', () => {
  assert.equal(new Set(data.fields.map((f) => f.id)).size, data.fields.length);
});

test('T16 canonical export includes only live-eligible release states', () => {
  assert(data.fields.every((f) => f.live_eligible === true));
  assert(data.fields.every((f) => ['READY_2_0','READY_HUMAN_CONFIRM'].includes(f.release_state)));
});

test('T17 map flavor appears when a map has multiple map-specific eligible fields', () => {
  const fields = generateEventFields({ data, mapId: 'map_eagleton_springs', cardSeed: 'map-flavor' });
  const count = fields.filter((f) => Array.isArray(f.maps) && f.maps.length > 0).length;
  assert(count >= 2 && count <= 5);
});

test('T18 pool-too-small fails closed rather than importing incompatible fields', () => {
  const tiny = {...data, fields:data.fields.slice(0, 10)};
  assert.throws(() => generateEventFields({ data: tiny, mapId:'map_eagleton_springs', cardSeed:'tiny' }), /POOL_TOO_SMALL/);
});

test('T19 canonical pool snapshot contains exactly 75 fields', () => {
  assert.equal(data.fields.length, 75);
});

test('T20 live 1.0 root/data remain distinct from v2 snapshot', () => {
  const v1 = JSON.parse(fs.readFileSync(path.join(here, '../data/bingo-fields.json'), 'utf8'));
  const rootIndex = fs.readFileSync(path.join(here, '../index.html'), 'utf8');
  assert.equal(v1.schema_version, '1.0');
  assert.match(rootIndex, /Royal Family GGD Bingo/);
  assert.doesNotMatch(rootIndex, /bingo-fields-v2\.mjs/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bingoV2Data as data } from '../data/bingo-fields-v2-product.mjs';
import { resolveBingoContext } from '../bingo-v2/session-resolver.mjs';
import { validateRuntimeSnapshot } from '../bingo-v2/runtime-adapter.mjs';
import { cardSignature, eligibleFields, generateBoard, generateEventFields, signatureFields, validateCanonicalPool, validateMapSignatures } from '../bingo-v2/engine.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const maps = data.playable_maps;
const wed = new Date('2026-08-19T17:30:00.000Z'); // 19:30 Europe/Berlin
const tue = new Date('2026-08-18T17:30:00.000Z');
const runtimeSnapshot = validateRuntimeSnapshot({
  schema_version: '1.0', state: 'READY', currentness: 'SAME_DATE_PRODUCTIVE_RUNWAY_READY', reason: '',
  session_id: 'RF_GGD_2026-08-19', ggd_date: '2026-08-19', map_id: 'map_eagleton_springs',
  map_name_de: 'Eagleton Springs', map_name_en: 'Eagleton Springs',
  map_selected_at: '2026-08-19T18:50:14+02:00', valid_from: '2026-08-19T19:00:00+02:00',
  valid_until: '2026-08-19T21:00:00+02:00', generated_at: '2026-08-19T18:50:20+02:00',
  source: 'RF_GGD_RUNTIME_RUNWAY_READY',
});
const ctx = () => resolveBingoContext({ now: wed, runtimeSnapshot, playableMaps: maps });
const ids = (mapId) => new Set(eligibleFields(data, mapId).map((f) => f.id));
const eventIds = (fields) => new Set(fields.map((f) => f.id));

function selectedSignatureCount(mapId, fields) {
  const signatureIds = new Set(signatureFields(data, mapId).map((f) => f.id));
  return fields.filter((f) => signatureIds.has(f.id)).length;
}

test('T01 Wednesday RF window resolves same-date sanitized current snapshot', () => {
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
  const c = resolveBingoContext({ now: wed, runtimeSnapshot, playableMaps: maps, manualMapId: 'map_mallard_manor' });
  assert.equal(c.mapId, 'map_mallard_manor'); assert.equal(c.mode, 'MANUAL');
});

test('T05 outside RF window fails closed until map is selected', () => {
  const c = resolveBingoContext({ now: tue, runtimeSnapshot, playableMaps: maps });
  assert.equal(c.ok, false); assert.equal(c.code, 'MAP_REQUIRED');
});

test('T06 The Lounge cannot be selected because it is not a playable map', () => {
  const c = resolveBingoContext({ now: tue, runtimeSnapshot: null, playableMaps: maps, manualMapId: 'map_lounge' });
  assert.equal(c.ok, false); assert.equal(c.code, 'INVALID_MAP');
});

test('T07 Cupid fields are eligible on Eagleton and excluded elsewhere', () => {
  assert(ids('map_eagleton_springs').has('bingo_cupid_lovers'));
  assert(!ids('map_mallard_manor').has('bingo_cupid_lovers'));
});

test('T08 chandelier and school bus are hard map-locked', () => {
  assert(ids('map_mallard_manor').has('bingo_chandelier'));
  assert(!ids('map_eagleton_springs').has('bingo_chandelier'));
  assert(ids('map_eagleton_springs').has('bingo_bus'));
  assert(!ids('map_mallard_manor').has('bingo_bus'));
});

test('T09 role-derived map availability remains encoded for Mime/Undertaker', () => {
  assert(!ids('map_black_swan').has('bingo_mime_control'));
  assert(ids('map_nexus_colony').has('bingo_mime_control'));
  assert(ids('map_basement').has('bingo_undertaker_drag'));
});

test('T10 family and duplicate caps prevent Sheriff/Pelican/Airlock flooding', () => {
  const fields = generateEventFields({ data, mapId: 'map_ss_mothergoose', cardSeed: 'caps' });
  assert(fields.filter((f) => f.family === 'SHERIFF').length <= 1);
  assert(fields.filter((f) => f.family === 'PELICAN').length <= 2);
  assert(fields.filter((f) => (f.duplicate_group || f.family) === 'SPACE_AIRLOCK').length <= 1);
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

test('T13 statistics are optional future intelligence, never a card-generation dependency', () => {
  assert.equal(data.statistics_mode, 'OPTIONAL_FUTURE_COST_FROZEN');
  assert(data.fields.every((f) => f.intelligence.confidence === 'UNKNOWN'));
  assert.equal(generateEventFields({ data, mapId:'map_carnival', cardSeed:'no-stats' }).length, 24);
});

test('T14 stale previous-Wednesday snapshot cannot resolve current Wednesday', () => {
  const stale = validateRuntimeSnapshot({ ...runtimeSnapshot, session_id:'RF_GGD_2026-08-12', ggd_date:'2026-08-12',
    map_selected_at:'2026-08-12T18:50:14+02:00', valid_from:'2026-08-12T19:00:00+02:00',
    valid_until:'2026-08-12T21:00:00+02:00', generated_at:'2026-08-12T18:50:20+02:00' });
  const c = resolveBingoContext({ now: wed, runtimeSnapshot: stale, playableMaps: maps });
  assert.equal(c.ok, false); assert.equal(c.code, 'RF_SESSION_MAP_UNRESOLVED');
});

test('T15 canonical source has unique ids', () => {
  assert.equal(new Set(data.fields.map((f) => f.id)).size, data.fields.length);
});

test('T16 canonical export includes only live-eligible release states', () => {
  assert(data.fields.every((f) => f.live_eligible === true));
  assert(data.fields.every((f) => ['READY_2_0','READY_HUMAN_CONFIRM'].includes(f.release_state)));
});

test('T17 selected map contributes explicit signature flavor, not generic map guessing', () => {
  const fields = generateEventFields({ data, mapId:'map_eagleton_springs', cardSeed:'map-flavor' });
  const count = selectedSignatureCount('map_eagleton_springs', fields);
  assert(count >= 4 && count <= 6);
});

test('T18 pool-too-small fails closed rather than importing incompatible fields', () => {
  const tiny = {...data, fields:data.fields.slice(0, 10)};
  assert.throws(() => generateEventFields({ data: tiny, mapId:'map_eagleton_springs', cardSeed:'tiny' }), /POOL_TOO_SMALL|SIGNATURE_FIELD_MISSING/);
});

test('T19 product-curated canonical pool contains exactly 105 fields', () => {
  assert.equal(data.fields.length, 105);
});

test('T20 live 1.0 root/data remain distinct from v2 product snapshot', () => {
  const v1 = JSON.parse(fs.readFileSync(path.join(here, '../data/bingo-fields.json'), 'utf8'));
  const rootIndex = fs.readFileSync(path.join(here, '../index.html'), 'utf8');
  assert.equal(v1.schema_version, '1.0');
  assert.match(rootIndex, /Royal Family GGD Bingo/);
  assert.doesNotMatch(rootIndex, /bingo-fields-v2-product\.mjs/);
});

test('T21 exactly 12 playable maps have explicit signature curation and Lounge has none', () => {
  assert.equal(maps.length, 12); assert.equal(Object.keys(data.map_signatures).length, 12);
  assert(!data.map_signatures.map_lounge); assert.equal(validateMapSignatures(data), true);
});

test('T22 every signature id resolves to a live canonical field', () => {
  const canonical = new Set(data.fields.map((f) => f.id));
  for (const policy of Object.values(data.map_signatures)) {
    for (const id of [...policy.hard, ...policy.conditional]) assert(canonical.has(id), id);
  }
});

test('T23 Eagleton signatures include bus, Cupid/lab and Pod; Mallardon-only Hawk is excluded', () => {
  const sig = new Set(signatureFields(data,'map_eagleton_springs').map((f) => f.id));
  for (const id of ['bingo_bus','bingo_cupid_lovers','bingo_host_parasite_lab','bingo_eagleton_rejuvenation_cleanse']) assert(sig.has(id), id);
  assert(!sig.has('bingo_hawk_win'));
});

test('T24 Mallardon signatures include heat kill, sinkhole, Hawk win/hunt and Looter', () => {
  const sig = new Set(signatureFields(data,'map_mallardon').map((f) => f.id));
  for (const id of ['bingo_mallardon_heat_kill','bingo_mallardon_sinkhole_body','bingo_hawk_win','bingo_hawk_hunt','bingo_looter_disposal']) assert(sig.has(id), id);
  assert(!sig.has('bingo_bus'));
});

test('T25 Carnival signatures contain rollercoaster, wheel bomb and player-rabbit', () => {
  const sig = new Set(signatureFields(data,'map_carnival').map((f) => f.id));
  for (const id of ['bingo_carnival_rollercoaster_kill','bingo_carnival_wheel_bomb','bingo_carnival_rabbit_player']) assert(sig.has(id), id);
});

test('T26 Ancient Sands signatures contain mummy/sandstorm/Warlock and exclude them elsewhere', () => {
  const ancient = new Set(signatureFields(data,'map_ancient_sands').map((f) => f.id));
  for (const id of ['bingo_mummy_kill','bingo_sandstorm_kill','bingo_warlock_locust_kill']) assert(ancient.has(id), id);
  assert(!ids('map_eagleton_springs').has('bingo_mummy_kill'));
});

test('T27 Nexus signatures are Shuttle/Teleporter specific', () => {
  const sig = new Set(signatureFields(data,'map_nexus_colony').map((f) => f.id));
  for (const id of ['bingo_nexus_shuttle_splatter','bingo_nexus_shuttle_asphyxiation','bingo_nexus_teleporter_kill','bingo_teleporter_shift']) assert(sig.has(id), id);
  assert(!sig.has('bingo_airlock_kill'));
});

test('T28 Airlock variants exist only on SS Mothergoose and Black Swan', () => {
  for (const mapId of ['map_ss_mothergoose','map_black_swan']) assert(ids(mapId).has('bingo_airlock_kill'));
  for (const map of maps.filter((m) => !['map_ss_mothergoose','map_black_swan'].includes(m.id))) assert(!ids(map.id).has('bingo_airlock_kill'));
});

test('T29 Jungle signatures include boulder and bridge deaths', () => {
  const sig = new Set(signatureFields(data,'map_jungle_temple').map((f) => f.id));
  assert(sig.has('bingo_jungle_boulder_kill')); assert(sig.has('bingo_jungle_bridge_kill'));
});

test('T30 Bloodhaven signatures include body disposal and night kill', () => {
  const sig = new Set(signatureFields(data,'map_bloodhaven').map((f) => f.id));
  assert(sig.has('bingo_bloodhaven_body_disposal')); assert(sig.has('bingo_bloodhaven_night_kill'));
});

test('T31 Basement signatures include body disposal, sacrifice bell and teleporter shift', () => {
  const sig = new Set(signatureFields(data,'map_basement').map((f) => f.id));
  for (const id of ['bingo_basement_body_disposal','bingo_basement_sacrifice','bingo_teleporter_shift']) assert(sig.has(id), id);
});

test('T32 Goosechapel signatures include Jail economy, double fire and smog kill', () => {
  const sig = new Set(signatureFields(data,'map_goosechapel').map((f) => f.id));
  for (const id of ['bingo_prison_vote','bingo_key_saves','bingo_politician_tie','bingo_goosechapel_double_fire','bingo_goosechapel_smog_kill']) assert(sig.has(id), id);
});

test('T33 Mallard Manor keeps chandelier as hard signature', () => {
  assert(new Set(signatureFields(data,'map_mallard_manor').map((f) => f.id)).has('bingo_chandelier'));
});

test('T34 every playable map can generate a complete board with its required signature minimum', () => {
  for (const map of maps) {
    const fields = generateEventFields({ data, mapId:map.id, cardSeed:`all-maps:${map.id}` });
    assert.equal(fields.length, 24, map.id);
    assert.equal(eventIds(fields).size, 24, map.id);
    const policy = data.map_signatures[map.id];
    const available = signatureFields(data,map.id).length;
    const minimum = available < policy.min ? available : policy.min;
    assert(selectedSignatureCount(map.id,fields) >= minimum, map.id);
    assert(fields.filter((f) => Array.isArray(f.maps) && f.maps.length && !f.maps.includes(map.id)).length === 0, map.id);
  }
});

test('T35 map-signature selection never requires historical probability data', () => {
  const stripped = {...data, fields:data.fields.map((f) => ({...f, intelligence:{state:'UNKNOWN',confidence:'UNKNOWN'}}))};
  assert.equal(generateEventFields({data:stripped,mapId:'map_mallardon',cardSeed:'unknown-stats'}).length,24);
});

test('T36 product engine has no VOD/frame/Vision analysis dependency', () => {
  const engine = fs.readFileSync(path.join(here,'../bingo-v2/engine.mjs'),'utf8');
  const app = fs.readFileSync(path.join(here,'../bingo-v2/app.mjs'),'utf8');
  for (const forbidden of ['ffmpeg','vod','vision','openai','frame analysis']) {
    assert(!engine.toLowerCase().includes(forbidden)); assert(!app.toLowerCase().includes(forbidden));
  }
});

test('S01 browser rejects raw private session_state rows payload', () => {
  assert.throws(() => validateRuntimeSnapshot({ rows: [{ lobby_code:'SECRET7', discord_user_id:'123' }] }), /BINGO_V2_RUNTIME_FIELD_FORBIDDEN:rows/);
});

test('S02 browser rejects an otherwise valid snapshot with a leaked lobby code field', () => {
  assert.throws(() => validateRuntimeSnapshot({ ...runtimeSnapshot, lobby_code:'SECRET7' }), /BINGO_V2_RUNTIME_FIELD_FORBIDDEN:lobby_code/);
});

test('S03 UNAVAILABLE snapshot cannot smuggle map fields', () => {
  assert.throws(() => validateRuntimeSnapshot({ schema_version:'1.0',state:'UNAVAILABLE',currentness:'UNRESOLVED_FAIL_CLOSED',reason:'CURRENT_MAP_UNRESOLVED',session_id:'RF_GGD_2026-08-19',ggd_date:'2026-08-19',valid_from:'2026-08-19T19:00:00+02:00',valid_until:'2026-08-19T21:00:00+02:00',generated_at:'2026-08-19T18:50:20+02:00',source:'RF_GGD_RUNTIME_RUNWAY_READY',map_id:'map_eagleton_springs' }), /BINGO_V2_RUNTIME_UNAVAILABLE_MAP_FIELD:map_id/);
});

test('S04 expired READY snapshot fails closed even while current time is still inside RF window', () => {
  const expired = validateRuntimeSnapshot({ ...runtimeSnapshot, valid_until:'2026-08-19T19:20:00+02:00' });
  const c = resolveBingoContext({ now:wed, runtimeSnapshot:expired, playableMaps:maps });
  assert.equal(c.ok,false); assert.equal(c.code,'RF_SESSION_MAP_UNRESOLVED');
});

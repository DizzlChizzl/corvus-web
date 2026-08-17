import test from 'node:test';
import assert from 'node:assert/strict';
import { bingoV2Data as data } from '../data/bingo-fields-v2-proof-final.mjs';
import { eligibleFields, generateBoard, generateEventFields, signatureFields, validateCanonicalPool, validateMapSignatures } from '../bingo-v2/engine.mjs';

const maps = data.playable_maps.map((m) => m.id);
const bannedPrivateIds = [
  'bingo_reingedizzlt','bingo_clean_sheriff','bingo_major','bingo_canadian_killed','bingo_bomb_transfer',
  'bingo_pelican_bankett','bingo_vulture_eats','bingo_mortician_reads','bingo_scientist_body','bingo_medium_window',
  'bingo_sensor_catches_rotation','bingo_engineer_sabo','bingo_stalker_breaks_alibi','bingo_birdwatcher_wall',
  'bingo_soldier_reload','bingo_assassin_correct','bingo_assassin_wrong','bingo_party_voice','bingo_clown_kill',
  'bingo_sniper_crosshair','bingo_mime_control','bingo_cupid_lovers','bingo_host_parasite_lab','bingo_morph_fake',
  'bingo_prison_vote','bingo_key_saves','bingo_chandelier','bingo_bus','bingo_teleporter_shift','bingo_nexus_shuttle_splatter',
  'bingo_airlock_kill','bingo_jungle_boulder_kill','bingo_mummy_kill','bingo_carnival_rollercoaster_kill',
  'bingo_mallardon_heat_kill','bingo_black_swan_vent_room','bingo_politician_tie',
];

const newBalanceIds = [
  'bingo_meeting_vote_out','bingo_meeting_dead_equal_alive','bingo_first_meeting_vote_out','bingo_claim_then_vote_out',
];

test('P01 proof pool is exactly 37 canonical fields', () => assert.equal(data.fields.length, 37));
test('P02 proof policy is active', () => assert.equal(data.proof_policy, 'PUBLIC_MEETING_OR_ROUND_END_ONLY'));
test('P03 every field carries PUBLIC_PROOF', () => assert(data.fields.every((f) => f.proof_mode === 'PUBLIC_PROOF')));
test('P04 canonical validation passes under proof gate', () => assert.equal(validateCanonicalPool(data), true));
test('P05 map signatures allow zero-signature maps and validate', () => assert.equal(validateMapSignatures(data), true));
test('P06 all 12 playable maps are represented', () => assert.equal(Object.keys(data.map_signatures).length, 12));
test('P07 banned private/witness/self-report fields are absent', () => { for (const id of bannedPrivateIds) assert(!data.fields.some((f) => f.id === id), id); });
test('P08 Mallard Manor has no chandelier signature', () => assert.equal(signatureFields(data, 'map_mallard_manor').length, 0));
test('P09 Eagleton has no private map signature', () => assert.equal(signatureFields(data, 'map_eagleton_springs').length, 0));
test('P10 Nexus has no shuttle/teleporter signature', () => assert.equal(signatureFields(data, 'map_nexus_colony').length, 0));
test('P11 Carnival has no local ride/rabbit signature', () => assert.equal(signatureFields(data, 'map_carnival').length, 0));
test('P12 Jungle has no local hazard signature', () => assert.equal(signatureFields(data, 'map_jungle_temple').length, 0));
test('P13 Ancient Sands has no local cause signature', () => assert.equal(signatureFields(data, 'map_ancient_sands').length, 0));
test('P14 Basement retains only public sacrifice meeting signature', () => assert.deepEqual(signatureFields(data, 'map_basement').map((f) => f.id), ['bingo_basement_sacrifice']));
test('P15 Goosechapel retains only shared smog signature', () => assert.deepEqual(signatureFields(data, 'map_goosechapel').map((f) => f.id), ['bingo_goosechapel_smog_shared']));
test('P16 Bloodhaven retains only shared night signature', () => assert.deepEqual(signatureFields(data, 'map_bloodhaven').map((f) => f.id), ['bingo_bloodhaven_night_shared']));
test('P17 Mallardon signature can only be public Hawk win', () => assert.deepEqual(signatureFields(data, 'map_mallardon').map((f) => f.id), ['bingo_hawk_win']));
test('P18 public claims are statements, not asserted role truth', () => {
  const f = data.fields.find((x) => x.id === 'bingo_open_role_claim');
  assert.match(f.trigger_de, /Claim/); assert.doesNotMatch(f.trigger_de, /Rolle ist tatsächlich/);
});
test('P19 roster events never name a death cause', () => {
  for (const f of data.fields.filter((x) => x.family === 'PUBLIC_ROSTER')) {
    assert.doesNotMatch(f.trigger_de, /Sheriff|Sniper|Bombe|Kronleuchter|Bus|Mumie|Airlock/i);
  }
});
test('P20 every playable map has at least 24 proof-eligible fields', () => { for (const mapId of maps) assert(eligibleFields(data, mapId).length >= 24, mapId); });
test('P21 every playable map generates a 24-event board plus free center', () => {
  for (const mapId of maps) {
    const board = generateBoard({ data, mapId, cardSeed:`proof-${mapId}` });
    assert.equal(board.length, 25, mapId);
    assert.equal(board[12].free, true, mapId);
    assert.equal(new Set(board.filter((f) => !f.free).map((f) => f.id)).size, 24, mapId);
  }
});
test('P22 generated cards contain public-proof fields only', () => {
  for (const mapId of maps) {
    const fields = generateEventFields({ data, mapId, cardSeed:`proof-only-${mapId}` });
    assert(fields.every((f) => f.proof_mode === 'PUBLIC_PROOF'), mapId);
  }
});
test('P23 map signature minimum is never used to import private filler', () => { for (const p of Object.values(data.map_signatures)) assert.equal(p.min, 0); });
test('P24 zero-signature maps still generate complete cards', () => {
  for (const mapId of ['map_nexus_colony','map_ss_mothergoose','map_jungle_temple','map_mallard_manor','map_black_swan','map_ancient_sands','map_eagleton_springs','map_carnival']) {
    assert.equal(signatureFields(data, mapId).length, 0); assert.equal(generateEventFields({data,mapId,cardSeed:`zero-${mapId}`}).length, 24);
  }
});
test('P25 no source field depends on private video/statistics runtime', () => {
  assert.equal(data.statistics_mode, 'OPTIONAL_FUTURE_COST_FROZEN');
  assert(data.fields.every((f) => f.intelligence?.confidence === 'UNKNOWN'));
});
test('P26 four balance fields are public proof rather than cap relaxation', () => {
  for (const id of newBalanceIds) {
    const field = data.fields.find((f) => f.id === id);
    assert(field, id); assert.equal(field.proof_mode, 'PUBLIC_PROOF', id);
  }
});
test('P27 claim-to-voteout field proves sequence, never role truth', () => {
  const field = data.fields.find((f) => f.id === 'bingo_claim_then_vote_out');
  assert.match(field.trigger_de, /claimt/i); assert.match(field.trigger_de, /Vote-Out/i);
  assert.doesNotMatch(field.trigger_de, /tatsächlich|wirklich die Rolle/i);
});
test('P28 public vote-out field has no role-cause dependency', () => {
  const field = data.fields.find((f) => f.id === 'bingo_meeting_vote_out');
  assert.equal(field.role_gate, ''); assert.doesNotMatch(field.trigger_de, /Politiker|Attentäter|Rabe|Clown/i);
});
test('P29 every final proof field is either shared-meeting/global-state or round-end scoped', () => {
  const allowed = new Set(['MEETING_ALL','ROUND_END_ALL','ALL_LIVING_PLAYERS']);
  assert(data.fields.every((f) => allowed.has(f.proof_scope)), data.fields.filter((f) => !allowed.has(f.proof_scope)).map((f) => f.id).join(','));
});

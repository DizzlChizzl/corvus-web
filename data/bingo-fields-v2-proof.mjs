import { bingoV2Data as productData } from './bingo-fields-v2-product.mjs';

const UNKNOWN_INTELLIGENCE = Object.freeze({ state: 'PENDING_EVENT_HARVEST', confidence: 'UNKNOWN' });
const PUBLIC_PROOF = 'PUBLIC_PROOF';

function field({ id, label, release='READY_2_0', family, cap=2, maps=[], role='', trigger, notTrigger, rarity='MEDIUM', duplicateGroup=null, proofScope='MEETING_ALL' }) {
  return {
    id, label, release_state: release, live_eligible: true, family,
    duplicate_group: duplicateGroup || family, max_per_card_family: cap,
    maps, role_gate: role, trigger_de: trigger, not_trigger_de: notTrigger,
    detail_de: `${trigger} Nicht zählen: ${notTrigger}`,
    rarity_prior: rarity,
    intelligence: { ...UNKNOWN_INTELLIGENCE },
    proof_mode: PUBLIC_PROOF,
    proof_scope: proofScope,
  };
}

const retainedIds = new Set([
  'bingo_pelican_win','bingo_pigeon_win','bingo_dodo_win','bingo_falcon_win','bingo_vulture_win',
  'bingo_everyone_talks','bingo_task_win','bingo_duck_win','bingo_lovers_win','bingo_basement_sacrifice','bingo_hawk_win',
]);

const retained = productData.fields.filter((item) => retainedIds.has(item.id)).map((item) => ({
  ...item,
  ...(item.id === 'bingo_everyone_talks' ? {
    trigger_de: 'Mindestens drei Spieler sprechen im selben Meeting deutlich gleichzeitig.',
    not_trigger_de: 'Nur zwei Sprecher oder kurze normale Satzüberschneidung zählt nicht.',
    detail_de: 'Mindestens drei Spieler sprechen im selben Meeting deutlich gleichzeitig. Nicht zählen: Nur zwei Sprecher oder kurze normale Satzüberschidung.',
  } : {}),
  proof_mode: PUBLIC_PROOF,
  proof_scope: item.id.includes('_win') || item.id === 'bingo_task_win' ? 'ROUND_END_ALL' : item.id === 'bingo_basement_sacrifice' ? 'MEETING_ALL' : 'MEETING_ALL',
}));

const additions = [
  field({id:'bingo_goose_win',label:'GÄNSE GEWINNEN',family:'TEAM_WIN',cap:1,duplicateGroup:'TEAM_WIN',rarity:'COMMON',proofScope:'ROUND_END_ALL',trigger:'Das Gänseteam gewinnt die Runde und der öffentliche Win-Screen zeigt den Gänsesieg.',notTrigger:'Entensieg, Neutralsieg oder bloße Spielerbehauptung.'}),
  field({id:'bingo_meeting_no_elimination',label:'KEINER FLIEGT',family:'PUBLIC_MEETING',cap:3,duplicateGroup:'VOTE_OUTCOME',rarity:'COMMON',trigger:'Ein Meeting endet sichtbar, ohne dass durch die Abstimmung ein Spieler entfernt wird.',notTrigger:'Ein normaler Vote-Out oder nur ein Meeting-Tod durch eine andere Mechanik.'}),
  field({id:'bingo_meeting_tie',label:'STIMMENGLEICHSTAND',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_MEETING',cap:3,duplicateGroup:'VOTE_OUTCOME',trigger:'Die gemeinsame Abstimmungsanzeige endet sichtbar mit einem Stimmengleichstand.',notTrigger:'Nur über einen möglichen Tie reden oder ein No-Elimination-Ausgang ohne sichtbaren Gleichstand.'}),
  field({id:'bingo_meeting_skip',label:'SKIP GEWINNT',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_MEETING',cap:3,duplicateGroup:'VOTE_OUTCOME',trigger:'Das gemeinsame Abstimmungsergebnis weist Skip sichtbar als gewinnenden Ausgang aus.',notTrigger:'Bloße Skip-Calls oder ein Tie ohne sichtbaren Skip-Sieg.'}),
  field({id:'bingo_first_meeting_all_alive',label:'ERSTES MEETING — ALLE LEBEN',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'FIRST_MEETING_ROSTER',rarity:'COMMON',trigger:'Beim ersten Meeting zeigt der gemeinsame Roster alle gestarteten Spieler noch lebend.',notTrigger:'Ein späteres Meeting oder ein erster Roster mit mindestens einem Toten.'}),
  field({id:'bingo_first_meeting_one_dead',label:'ERSTES MEETING — GENAU EINER TOT',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'FIRST_MEETING_ROSTER',rarity:'COMMON',trigger:'Beim ersten Meeting zeigt der gemeinsame Roster genau einen ausgeschiedenen Spieler.',notTrigger:'Null oder mindestens zwei Tote beim ersten Meeting.'}),
  field({id:'bingo_first_meeting_two_plus_dead',label:'ERSTES MEETING — 2+ TOT',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'FIRST_MEETING_ROSTER',trigger:'Beim ersten Meeting zeigt der gemeinsame Roster mindestens zwei ausgeschiedene Spieler.',notTrigger:'Nur ein oder kein Toter beim ersten Meeting.'}),
  field({id:'bingo_between_meetings_one_dead',label:'SEIT DEM LETZTEN MEETING — GENAU EINER TOT',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'INTERMEETING_DEATH_COUNT',rarity:'COMMON',trigger:'Beim nächsten Meeting ist gegenüber dem vorherigen öffentlichen Roster genau ein zuvor lebender Spieler neu ausgeschieden.',notTrigger:'Null oder mindestens zwei neue Tote.'}),
  field({id:'bingo_between_meetings_two_three_dead',label:'ZWISCHEN DEN MEETINGS — 2–3 TOT',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'INTERMEETING_DEATH_COUNT',trigger:'Beim nächsten Meeting sind gegenüber dem vorherigen Roster genau zwei oder drei zuvor lebende Spieler neu ausgeschieden.',notTrigger:'Null, ein oder mindestens vier neue Tote.'}),
  field({id:'bingo_between_meetings_four_plus_dead',label:'ZWISCHEN DEN MEETINGS — 4+ TOT',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'INTERMEETING_DEATH_COUNT',rarity:'RARE',trigger:'Beim nächsten Meeting sind gegenüber dem vorherigen öffentlichen Roster mindestens vier zuvor lebende Spieler neu ausgeschieden.',notTrigger:'Drei oder weniger neue Tote.'}),
  field({id:'bingo_meeting_one_death',label:'EINER STIRBT IM MEETING',family:'PUBLIC_MEETING',cap:2,duplicateGroup:'MEETING_DEATH_COUNT',trigger:'Während eines laufenden Meetings stirbt sichtbar genau ein Teilnehmer.',notTrigger:'Tod vor Meetingstart oder mindestens zwei Tote im selben Meeting.'}),
  field({id:'bingo_meeting_two_plus_deaths',label:'2+ STERBEN IM MEETING',family:'PUBLIC_MEETING',cap:2,duplicateGroup:'MEETING_DEATH_COUNT',rarity:'RARE',trigger:'Während desselben Meetings sterben sichtbar mindestens zwei Teilnehmer.',notTrigger:'Nur ein Meeting-Toter oder Tote vor Meetingstart.'}),
  field({id:'bingo_meeting_exactly_four_alive',label:'NUR NOCH VIER IM MEETING',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'ALIVE_COUNT',trigger:'Ein Meeting startet mit genau vier lebenden Teilnehmern im gemeinsamen Roster.',notTrigger:'Drei oder mindestens fünf Lebende.'}),
  field({id:'bingo_meeting_exactly_three_alive',label:'NUR NOCH DREI IM MEETING',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'ALIVE_COUNT',rarity:'RARE',trigger:'Ein Meeting startet mit genau drei lebenden Teilnehmern im gemeinsamen Roster.',notTrigger:'Zwei oder mindestens vier Lebende.'}),
  field({id:'bingo_open_role_claim',label:'OFFENER ROLLENCLAIM',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_CLAIM',cap:4,duplicateGroup:'ROLE_CLAIM_PUBLIC',rarity:'COMMON',trigger:'Ein Spieler nennt im Meeting hörbar eine konkrete eigene Rolle als Claim.',notTrigger:'Vage Gesinnungsaussage, privater Claim oder Claim außerhalb des Meetings.'}),
  field({id:'bingo_three_role_claims',label:'DREI ROLLENCLAIMS IN EINEM MEETING',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_CLAIM',cap:4,duplicateGroup:'ROLE_CLAIM_PUBLIC',trigger:'Mindestens drei verschiedene Spieler claimen im selben Meeting hörbar jeweils eine konkrete eigene Rolle.',notTrigger:'Weniger als drei konkrete Rollenclaims.'}),
  field({id:'bingo_duplicate_role_claim',label:'ZWEI CLAIMEN DIESELBE ROLLE',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_CLAIM',cap:4,duplicateGroup:'ROLE_CLAIM_PUBLIC',rarity:'RARE',trigger:'Zwei verschiedene Spieler claimen im selben Meeting hörbar dieselbe konkrete Rolle.',notTrigger:'Ähnliche Rollen oder Claims in verschiedenen Meetings.'}),
  field({id:'bingo_role_claim_retracted',label:'ROLLENCLAIM ZURÜCKGENOMMEN',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_CLAIM',cap:4,duplicateGroup:'ROLE_CLAIM_PUBLIC',rarity:'RARE',trigger:'Ein Spieler zieht einen zuvor öffentlich geäußerten Rollenclaim hörbar zurück oder ersetzt ihn durch einen anderen konkreten Claim.',notTrigger:'Private Aussage oder reine Präzisierung ohne Claimwechsel.'}),
  field({id:'bingo_claim_then_meeting_death',label:'ROLLENCLAIM — DANN TOT IM MEETING',release:'READY_HUMAN_CONFIRM',family:'PUBLIC_SEQUENCE',cap:2,duplicateGroup:'CLAIM_MEETING_DEATH',rarity:'RARE',trigger:'Ein Spieler claimt im Meeting hörbar eine konkrete Rolle und stirbt noch im selben Meeting sichtbar.',notTrigger:'Claim in einem früheren Meeting oder Tod erst außerhalb des Meetings.'}),
  field({id:'bingo_goosechapel_smog_shared',label:'SMOG SCHLUCKT DIE NAMEN',release:'READY_HUMAN_CONFIRM',family:'GLOBAL_SHARED_MAP',cap:2,duplicateGroup:'GOOSECHAPEL_SHARED',maps:['map_goosechapel'],trigger:'Die Goosechapel-Smogphase aktiviert sich und die gemeinsame Spielansicht verdeckt sichtbar Spieler-/Namensinformation.',notTrigger:'Lokaler Nebel oder nur ein behaupteter Kill im Smog.',proofScope:'ALL_LIVING_PLAYERS'}),
  field({id:'bingo_bloodhaven_night_shared',label:'NACHT FÄLLT ÜBER BLUTOASE',family:'GLOBAL_SHARED_MAP',cap:2,duplicateGroup:'BLOODHAVEN_SHARED',maps:['map_bloodhaven'],rarity:'COMMON',trigger:'Bloodhavens gemeinsamer Tag-/Nacht-Zyklus wechselt sichtbar in die Nachtphase.',notTrigger:'Ein dunkler Raum oder ein bloß behaupteter Nachtkill.',proofScope:'ALL_LIVING_PLAYERS'}),
  field({id:'bingo_meeting_dead_majority',label:'MEHR TOTE ALS LEBENDE',family:'PUBLIC_ROSTER',cap:2,duplicateGroup:'ALIVE_DEAD_BALANCE',rarity:'RARE',trigger:'Beim Meetingstart zeigt der gemeinsame Roster mehr ausgeschiedene als lebende Teilnehmer.',notTrigger:'Gleich viele oder mehr Lebende als Tote.'}),
];

const fields = [...retained, ...additions];
if (fields.length !== 33) throw new Error(`BINGO_V2_PROOF_POOL_COUNT:${fields.length}`);
if (new Set(fields.map((item) => item.id)).size !== fields.length) throw new Error('BINGO_V2_PROOF_DUPLICATE_ID');
if (fields.some((item) => item.proof_mode !== PUBLIC_PROOF)) throw new Error('BINGO_V2_PRIVATE_PROOF_LEAK');

const mapSignatures = {
  map_basement:{hard:['bingo_basement_sacrifice'],conditional:[],min:0,target:1,max:1},
  map_goosechapel:{hard:['bingo_goosechapel_smog_shared'],conditional:[],min:0,target:1,max:1},
  map_nexus_colony:{hard:[],conditional:[],min:0,target:0,max:0},
  map_ss_mothergoose:{hard:[],conditional:[],min:0,target:0,max:0},
  map_jungle_temple:{hard:[],conditional:[],min:0,target:0,max:0},
  map_mallard_manor:{hard:[],conditional:[],min:0,target:0,max:0},
  map_black_swan:{hard:[],conditional:[],min:0,target:0,max:0},
  map_ancient_sands:{hard:[],conditional:[],min:0,target:0,max:0},
  map_bloodhaven:{hard:['bingo_bloodhaven_night_shared'],conditional:[],min:0,target:1,max:1},
  map_eagleton_springs:{hard:[],conditional:[],min:0,target:0,max:0},
  map_carnival:{hard:[],conditional:[],min:0,target:0,max:0},
  map_mallardon:{hard:[],conditional:['bingo_hawk_win'],min:0,target:1,max:1},
};

export const bingoV2Data = {
  ...productData,
  data_version: 'ggd-bingo-v2-public-meeting-proof-2026-08-17',
  source: 'GGD003 BINGO_2_0_MEETING_PROOF_AUDIT + public-proof canonical readback',
  proof_policy: 'PUBLIC_MEETING_OR_ROUND_END_ONLY',
  fields,
  map_signatures: mapSignatures,
};

export { mapSignatures as bingoMapSignatures };

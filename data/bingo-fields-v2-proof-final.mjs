import { bingoV2Data as proofData } from './bingo-fields-v2-proof.mjs';

const UNKNOWN_INTELLIGENCE = Object.freeze({ state: 'PENDING_EVENT_HARVEST', confidence: 'UNKNOWN' });

function publicField({ id, label, release='READY_2_0', family, cap=2, duplicateGroup, rarity='MEDIUM', trigger, notTrigger, proofScope='MEETING_ALL' }) {
  return {
    id,
    label,
    release_state: release,
    live_eligible: true,
    family,
    duplicate_group: duplicateGroup || family,
    max_per_card_family: cap,
    maps: [],
    role_gate: '',
    trigger_de: trigger,
    not_trigger_de: notTrigger,
    detail_de: `${trigger} Nicht zählen: ${notTrigger}`,
    rarity_prior: rarity,
    intelligence: { ...UNKNOWN_INTELLIGENCE },
    proof_mode: 'PUBLIC_PROOF',
    proof_scope: proofScope,
  };
}

const proofBaseFields = proofData.fields
  .filter((item) => item.id !== 'bingo_task_win')
  .map((item) => item.id === 'bingo_basement_sacrifice' ? {
    ...item,
    trigger_de: 'Die Opferglocke läuft bis zum Spezialmeeting; ein öffentlich sichtbarer Skip-/Tie-Ausgang löst die game-selected Eliminierung aus.',
    not_trigger_de: 'Glocke rechtzeitig gefunden, normale Vote-Eliminierung oder bloße Behauptung über die Opferrolle.',
    detail_de: 'Die Opferglocke läuft bis zum Spezialmeeting; ein öffentlich sichtbarer Skip-/Tie-Ausgang löst die game-selected Eliminierung aus. Beweisbar ist das besondere gemeinsame Meeting plus die vom Spiel sichtbar ausgewählte Eliminierung; keine Fraktionsidentität des Opfers wird behauptet. Nicht zählen: Glocke rechtzeitig gefunden, normale Vote-Eliminierung oder bloße Behauptung über die Opferrolle.',
  } : item);

const balanceFields = [
  publicField({
    id: 'bingo_meeting_vote_out',
    label: 'JEMAND FLIEGT',
    family: 'PUBLIC_MEETING',
    cap: 2,
    duplicateGroup: 'VOTE_ELIMINATION',
    rarity: 'COMMON',
    trigger: 'Das gemeinsame Abstimmungsergebnis entfernt sichtbar genau einen Spieler aus dem Meeting.',
    notTrigger: 'Skip, Tie, No-Elimination oder ein Meeting-Tod ohne Vote-Out.',
  }),
  publicField({
    id: 'bingo_meeting_dead_equal_alive',
    label: 'GLEICH VIELE TOT WIE LEBENDIG',
    family: 'PUBLIC_ROSTER',
    cap: 2,
    duplicateGroup: 'ALIVE_DEAD_BALANCE',
    rarity: 'MEDIUM',
    trigger: 'Beim Meetingstart zeigt der gemeinsame Roster exakt gleich viele ausgeschiedene wie lebende Teilnehmer.',
    notTrigger: 'Mehr oder weniger Tote als Lebende.',
  }),
  publicField({
    id: 'bingo_first_meeting_vote_out',
    label: 'ERSTES MEETING — JEMAND FLIEGT',
    family: 'PUBLIC_MEETING',
    cap: 1,
    duplicateGroup: 'FIRST_MEETING_VOTE',
    rarity: 'COMMON',
    trigger: 'Das erste Meeting der Runde endet sichtbar mit genau einem Vote-Out.',
    notTrigger: 'Kein Vote-Out oder Vote-Out erst in einem späteren Meeting.',
  }),
  publicField({
    id: 'bingo_claim_then_vote_out',
    label: 'ROLLENCLAIM — DANN RAUSGEVOTET',
    release: 'READY_HUMAN_CONFIRM',
    family: 'PUBLIC_SEQUENCE',
    cap: 2,
    duplicateGroup: 'CLAIM_VOTE_OUT',
    rarity: 'MEDIUM',
    trigger: 'Ein Spieler claimt im Meeting hörbar eine konkrete Rolle und wird im selben Meeting durch den sichtbaren Vote-Out entfernt.',
    notTrigger: 'Claim in einem früheren Meeting oder Tod ohne Vote-Out.',
  }),
  publicField({
    id: 'bingo_meeting_vote_landslide',
    label: '5+ STIMMEN AUF EINE PERSON',
    release: 'READY_HUMAN_CONFIRM',
    family: 'PUBLIC_MEETING',
    cap: 2,
    duplicateGroup: 'VOTE_DISTRIBUTION',
    rarity: 'MEDIUM',
    trigger: 'Die gemeinsame Abstimmungsanzeige zeigt mindestens fünf Stimmen auf derselben Person.',
    notTrigger: 'Vier oder weniger sichtbare Stimmen auf einer Person oder nur behauptete Votes.',
  }),
];

const fields = [...proofBaseFields, ...balanceFields];
if (fields.length !== 37) throw new Error(`BINGO_V2_FINAL_PROOF_POOL_COUNT:${fields.length}`);
if (new Set(fields.map((item) => item.id)).size !== fields.length) throw new Error('BINGO_V2_FINAL_PROOF_DUPLICATE_ID');
if (fields.some((item) => item.proof_mode !== 'PUBLIC_PROOF')) throw new Error('BINGO_V2_FINAL_PRIVATE_PROOF_LEAK');

export const bingoV2Data = {
  ...proofData,
  data_version: 'ggd-bingo-v2-public-meeting-proof-final-2026-08-17',
  source: 'GGD003 BINGO_2_0_MEETING_PROOF_AUDIT + 37-field proof-safe canonical readback',
  fields,
};

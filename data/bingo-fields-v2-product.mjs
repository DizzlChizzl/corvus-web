import { bingoV2Data as phase2Data } from './bingo-fields-v2.mjs';

const UNKNOWN_INTELLIGENCE = Object.freeze({ state: 'PENDING_EVENT_HARVEST', confidence: 'UNKNOWN' });

function field({
  id, label, release='READY_2_0', family, cap=2, maps=[], role='', trigger, notTrigger,
  rarity='MEDIUM', duplicateGroup=null,
}) {
  return {
    id,
    label,
    release_state: release,
    live_eligible: true,
    family,
    duplicate_group: duplicateGroup || family,
    max_per_card_family: cap,
    maps,
    role_gate: role,
    trigger_de: trigger,
    not_trigger_de: notTrigger,
    detail_de: `${trigger} Nicht zählen: ${notTrigger}`,
    rarity_prior: rarity,
    intelligence: { ...UNKNOWN_INTELLIGENCE },
  };
}

const overrideById = new Map([
  ['bingo_bus', {
    label: 'SCHULBUS MACHT FLACH',
    release_state: 'READY_2_0',
    trigger_de: 'Ein Spieler wird auf Eagleton Springs vom tödlichen Schulbus/Verkehr überfahren und stirbt.',
    not_trigger_de: 'Straße überqueren, Bus sehen oder ein anderer Kill auf der Straße zählt nicht.',
    detail_de: 'Eagleton-Signature: Der Verkehr beziehungsweise School-Bus-Hazard selbst muss die Todesursache sein. Nicht zählen: Straße überqueren, Bus sehen oder ein anderer Kill auf der Straße.',
  }],
  ['bingo_mallardon_heat', { duplicate_group: 'MALLARDON_HEAT' }],
]);

const promoted = [
  field({
    id:'bingo_key_saves', label:'SCHLÜSSELWÄRTER MACHT AUF', family:'JAIL', cap:2,
    maps:['map_ss_mothergoose','map_goosechapel'], role:'Schlüsselwärter', rarity:'RARE',
    trigger:'Schlüsselwärter öffnet aktiv die Gefängnistür und befreit mindestens einen eingesperrten Spieler.',
    notTrigger:'Automatisches Öffnen der Zelle, ein normal gefundener Schlüssel durch eine andere Rolle oder ein leeres Gefängnis zählt nicht.',
  }),
];

const additions = [
  field({id:'bingo_basement_body_disposal',label:'LEICHE IM KELLER ENTSORGT',family:'BODY_REMOVAL',duplicateGroup:'BASEMENT_DISPOSAL',maps:['map_basement'],trigger:'Eine Leiche wird über einen verifizierten Body-Disposal-Spot im Keller vollständig entfernt.',notTrigger:'Leichensammler zieht eine Leiche nur weg oder Pelikan frisst jemanden.',rarity:'MEDIUM'}),
  field({id:'bingo_basement_sacrifice',label:'DIE OPFERGLOCKE WÄHLT',release:'READY_HUMAN_CONFIRM',family:'MAP_SABOTAGE',duplicateGroup:'SACRIFICE_BELL',cap:1,maps:['map_basement'],trigger:'Die Opferglocke läuft bis zum Spezialmeeting; Skip oder Stimmengleichstand führt zur zufälligen Eliminierung eines Nicht-Enten-Spielers.',notTrigger:'Glocke wird rechtzeitig gefunden, normale Vote-Eliminierung oder normales Meeting.',rarity:'RARE'}),
  field({id:'bingo_goosechapel_double_fire',label:'DOPPELBRAND',family:'MAP_SABOTAGE',duplicateGroup:'GOOSECHAPEL_FIRE',maps:['map_goosechapel'],trigger:'Die Goosechapel-Feuersabotage setzt gleichzeitig zwei der drei möglichen Orte in Brand.',notTrigger:'Ein einzelner Brand oder Feuer auf einer anderen Map.',rarity:'MEDIUM'}),
  field({id:'bingo_goosechapel_smog_kill',label:'MORD IM SMOG',release:'READY_HUMAN_CONFIRM',family:'MAP_COMPOUND',duplicateGroup:'GOOSECHAPEL_SMOG',maps:['map_goosechapel'],trigger:'Während die Smog-Sabotage Spieler und Namen verdeckt, wird ein Spieler getötet.',notTrigger:'Smog ohne Kill oder Kill nach Ende des Smogs.',rarity:'RARE'}),
  field({id:'bingo_nexus_shuttle_splatter',label:'SHUTTLE-SPLATTER',family:'MAP_HAZARD',duplicateGroup:'NEXUS_SHUTTLE',cap:1,maps:['map_nexus_colony'],trigger:'Ein Spieler steht auf der Shuttle-Plattform und wird vom einfahrenden Shuttle überfahren.',notTrigger:'Normale Fahrt im Shuttle oder ein anderer Kill am Dock.',rarity:'MEDIUM'}),
  field({id:'bingo_nexus_shuttle_asphyxiation',label:'KEINE LUFT IM SHUTTLE',release:'READY_HUMAN_CONFIRM',family:'MAP_SABOTAGE',duplicateGroup:'NEXUS_SHUTTLE',cap:1,maps:['map_nexus_colony'],trigger:'Die Shuttle-Sabotage bleibt ungefixt, während Spieler eingeschlossen sind, und mindestens ein Spieler erstickt.',notTrigger:'Shuttle-Splatter oder normaler Kill im Shuttle.',rarity:'RARE'}),
  field({id:'bingo_nexus_teleporter_kill',label:'TELEPORTER-FEHLFUNKTION',release:'READY_HUMAN_CONFIRM',family:'MAP_HAZARD',duplicateGroup:'NEXUS_TELEPORTER',maps:['map_nexus_colony'],trigger:'Ein Nicht-Enten-Spieler benutzt den sabotierten Nexus-Teleporter und stirbt an der Fehlfunktion.',notTrigger:'Normaler Einweg-Teleport oder bloßer Versatz.',rarity:'RARE'}),
  field({id:'bingo_airlock_kill',label:'RAUS INS ALL',release:'READY_HUMAN_CONFIRM',family:'MAP_HAZARD',duplicateGroup:'SPACE_AIRLOCK',cap:1,maps:['map_ss_mothergoose','map_black_swan'],trigger:'Ein Spieler wird durch den Airlock-Trap-Kill aus SS Mothergoose oder Black Swan ins All befördert und stirbt.',notTrigger:'Normale Ejection im Meeting oder anderes Cargo-Bay-Sterben.',rarity:'MEDIUM'}),
  field({id:'bingo_airlock_pelican',label:'PELIKAN-EXPRESS INS ALL',release:'READY_HUMAN_CONFIRM',family:'MAP_ROLE',duplicateGroup:'SPACE_AIRLOCK',cap:1,maps:['map_ss_mothergoose','map_black_swan'],role:'Pelikan',trigger:'Der Airlock tötet einen Pelikan mit mindestens einem Spieler im Bauch; die verschluckten Spieler sterben ebenfalls.',notTrigger:'Leerer Pelikan oder Pelikan-Tod aus anderer Ursache.',rarity:'LEGENDARY'}),
  field({id:'bingo_jungle_boulder_kill',label:'FELSEN WALZT JEMANDEN PLATT',release:'READY_HUMAN_CONFIRM',family:'MAP_HAZARD',duplicateGroup:'JUNGLE_HAZARD',maps:['map_jungle_temple'],trigger:'Der rollende Felsbrocken auf Jungle Temple trifft und tötet mindestens einen Spieler.',notTrigger:'Felsbrocken wird ausgelöst, trifft aber niemanden.',rarity:'MEDIUM'}),
  field({id:'bingo_jungle_bridge_kill',label:'BRÜCKE WEG — SPIELER WEG',release:'READY_HUMAN_CONFIRM',family:'MAP_HAZARD',duplicateGroup:'JUNGLE_HAZARD',maps:['map_jungle_temple'],trigger:'Eine sabotierte Brücke auf Jungle Temple stürzt ein und tötet mindestens einen Spieler auf ihr.',notTrigger:'Brücke fällt leer oder ein Spieler stirbt daneben aus anderer Ursache.',rarity:'MEDIUM'}),
  field({id:'bingo_mummy_kill',label:'MUMIE HOLT JEMANDEN',family:'MAP_HAZARD',duplicateGroup:'ANCIENT_MUMMY',maps:['map_ancient_sands'],trigger:'Die beschworene Mumie erreicht einen Spieler und tötet ihn.',notTrigger:'Mumie wird nur beschworen oder jagt jemanden ohne Kill.',rarity:'MEDIUM'}),
  field({id:'bingo_warlock_locust_kill',label:'HEUSCHRECKEN-MAHLZEIT',family:'MAP_ROLE',duplicateGroup:'ANCIENT_WARLOCK',maps:['map_ancient_sands'],role:'Hexenmeister',trigger:'Der Hexenmeister setzt Heuschrecken auf einen Zielbereich; mindestens ein eingeschlossener Spieler stirbt im Schwarm.',notTrigger:'Heuschrecken ohne Opfer oder ein anderer Kill im Gebäude.',rarity:'RARE'}),
  field({id:'bingo_sandstorm_kill',label:'KILL IM SANDSTURM',release:'READY_HUMAN_CONFIRM',family:'MAP_COMPOUND',duplicateGroup:'ANCIENT_SANDSTORM',maps:['map_ancient_sands'],trigger:'Während ein aktiver Sandsturm draußen die Sicht reduziert, wird ein Spieler im Außenbereich getötet.',notTrigger:'Kill drinnen oder außerhalb der aktiven Sandsturmphase.',rarity:'MEDIUM'}),
  field({id:'bingo_bloodhaven_body_disposal',label:'BLUTOASE SCHLUCKT DIE LEICHE',family:'BODY_REMOVAL',duplicateGroup:'BLOODHAVEN_DISPOSAL',maps:['map_bloodhaven'],trigger:'Eine Leiche wird über eine verifizierte Bloodhaven-Body-Disposal-Stelle vollständig entfernt.',notTrigger:'Leichensammler zieht die Leiche nur weg oder ein anderer Body-Removal-Effekt.',rarity:'MEDIUM'}),
  field({id:'bingo_eagleton_rejuvenation_cleanse',label:'POD WÄSCHT ESPER WEG',release:'READY_HUMAN_CONFIRM',family:'MAP_ROLE_COUNTER',duplicateGroup:'EAGLETON_POD',maps:['map_eagleton_springs'],role:'Esper',trigger:'Ein Spieler entfernt einen aktiven Esper-Effekt mithilfe des Rejuvenation Pod auf Eagleton Springs.',notTrigger:'Pod-Nutzung ohne aktiven Esper-Effekt.',rarity:'RARE'}),
  field({id:'bingo_carnival_rollercoaster_kill',label:'ACHTERBAHN-MASSAKER',family:'MAP_HAZARD',duplicateGroup:'CARNIVAL_HAZARD',maps:['map_carnival'],trigger:'Die Rollercoaster-Sabotage stoppt die Bahn am Looping-Scheitel und mindestens ein Mitfahrer stirbt.',notTrigger:'Normale Achterbahnfahrt oder Sabotage ohne Opfer.',rarity:'MEDIUM'}),
  field({id:'bingo_carnival_wheel_bomb',label:'RAD DREHT BOMBE',family:'MAP_FEATURE',duplicateGroup:'CARNIVAL_WHEEL',maps:['map_carnival'],trigger:'Das Wacky Wheel landet auf Bomb; der Spieler wird an einen zufälligen Ort teleportiert und trägt eine Bombe.',notTrigger:'Normale Sprengmeister-Bombe oder ein anderer Rad-Effekt.',rarity:'RARE'}),
  field({id:'bingo_carnival_rabbit_player',label:'DER HASE WAR EIN SPIELER',release:'READY_HUMAN_CONFIRM',family:'MAP_SABOTAGE',duplicateGroup:'CARNIVAL_RABBIT',maps:['map_carnival'],trigger:'Die Ticket-Variante der Rabbit-Sabotage wählt einen echten Spieler als Kaninchen aus und dieser Spieler wird gefangen und stirbt.',notTrigger:'Normale drei NPC-Kaninchen oder ein nicht gefangener Spieler-Hase.',rarity:'RARE'}),
  field({id:'bingo_mallardon_heat_kill',label:'HITZESTRAHL VAPORISIERT',family:'MAP_HAZARD',duplicateGroup:'MALLARDON_HEAT',maps:['map_mallardon'],trigger:'Mallardons Hitzestrahl trifft ein Gebäude mit einem Spieler darin; der Spieler wird vaporisiert und hinterlässt keine Leiche.',notTrigger:'Aktiver Strahl ohne Opfer oder Hawk-Aufladen.',rarity:'MEDIUM'}),
  field({id:'bingo_mallardon_sinkhole_body',label:'ERDLOCH FRISST DIE LEICHE',family:'BODY_REMOVAL',duplicateGroup:'MALLARDON_SINKHOLE',maps:['map_mallardon'],trigger:'Ein Spieler wird nahe einem Mallardon-Erdloch getötet und die Leiche verschwindet im Sinkhole.',notTrigger:'Normale Leiche neben dem Erdloch oder anderer Body-Removal-Effekt.',rarity:'MEDIUM'}),
  field({id:'bingo_hawk_win',label:'HAWK GEWINNT',family:'NEUTRAL_WIN',duplicateGroup:'MALLARDON_HAWK',maps:['map_mallardon'],role:'Falke (Hawk)',trigger:'Falke (Hawk) gewinnt die Runde auf Mallardon.',notTrigger:'Allgemeiner Falcon-Sieg oder Hawk-Präsenz ohne Sieg.',rarity:'RARE'}),
  field({id:'bingo_hawk_hunt',label:'HAWK HUNT BEGINNT',release:'READY_HUMAN_CONFIRM',family:'MAP_ROLE',duplicateGroup:'MALLARDON_HAWK',maps:['map_mallardon'],role:'Falke (Hawk)',trigger:'Hawk lädt über Mallardons Hitzestrahl genügend Potenzial auf und die aktive Jagd-/Killphase beginnt.',notTrigger:'Hawk steht nur im Strahl, ohne die Jagdphase freizuschalten.',rarity:'RARE'}),
  field({id:'bingo_looter_disposal',label:'PLÜNDERER MACHT BODY WEG',family:'MAP_ROLE',duplicateGroup:'MALLARDON_LOOTER',maps:['map_mallardon'],role:'Plünderer',trigger:'Plünderer zieht und entsorgt eine Leiche; dadurch sinkt sein Kill-Cooldown.',notTrigger:'Leichensammler, Sinkhole oder anderer Body-Removal-Effekt.',rarity:'RARE'}),
  field({id:'bingo_mime_environment_kill',label:'PANTOMIME STEUERT IN DEN TOD',release:'READY_HUMAN_CONFIRM',family:'MAP_ROLE_COMBO',duplicateGroup:'MIME_ENV_KILL',cap:1,maps:['map_mallard_manor','map_jungle_temple','map_nexus_colony','map_eagleton_springs','map_carnival','map_mallardon'],role:'Pantomime',trigger:'Pantomime kontrolliert einen Spieler so, dass dieser durch einen echten Map-Hazard oder Environmental Kill stirbt.',notTrigger:'Normaler Pantomime-Control, normaler Rollenkill oder Umweltkill ohne Pantomime.',rarity:'LEGENDARY'}),
  field({id:'bingo_black_swan_vent_room',label:'VENT-RAUM BESUCHT',release:'READY_HUMAN_CONFIRM',family:'MAP_FEATURE',duplicateGroup:'BLACKSWAN_VENT_ROOM',cap:1,maps:['map_black_swan'],role:'Vent-fähige Rolle',trigger:'Ein Spieler erreicht auf Black Swan den Raum, der ausschließlich über das Vent-System zugänglich ist.',notTrigger:'Nur am Raum vorbeilaufen oder einen normal zugänglichen Raum betreten.',rarity:'MEDIUM'}),
  field({id:'bingo_bloodhaven_night_kill',label:'NACHTKILL OHNE NAMEN',release:'READY_HUMAN_CONFIRM',family:'MAP_COMPOUND',duplicateGroup:'BLOODHAVEN_NIGHT',maps:['map_bloodhaven'],trigger:'Während Bloodhavens aktiver Nachtphase fällt ein Spieler einem Kill zum Opfer, während die nächtliche Anonymitätsdarstellung aktiv ist.',notTrigger:'Kill am Tag oder außerhalb der Bloodhaven-Nachtmechanik.',rarity:'MEDIUM'}),
  field({id:'bingo_airlock_double',label:'ZWEI AUF EINMAL INS ALL',release:'READY_HUMAN_CONFIRM',family:'MAP_HAZARD',duplicateGroup:'SPACE_AIRLOCK',cap:1,maps:['map_ss_mothergoose','map_black_swan'],trigger:'Ein einzelner Airlock-Trap-Kill befördert mindestens zwei Spieler gleichzeitig ins All und tötet sie.',notTrigger:'Zwei getrennte Airlock-Kills oder nur ein Opfer.',rarity:'RARE'}),
  field({id:'bingo_politician_tie',label:'POLITIKER GEWINNT DEN TIE',family:'MAP_ROLE',duplicateGroup:'JAIL_POLITICIAN',maps:['map_ss_mothergoose','map_goosechapel'],role:'Politiker',trigger:'Politiker ist in einen entscheidenden Stimmengleichstand verwickelt und seine Rollenmechanik entscheidet den Tie zu seinen Gunsten beziehungsweise verhindert die Gefängnisfolge.',notTrigger:'Normales Unentschieden ohne Politiker-Beteiligung oder ein klarer Mehrheitsvote.',rarity:'RARE'}),
];

const baseFields = phase2Data.fields.map((oldField) => ({
  ...oldField,
  ...(overrideById.get(oldField.id) || {}),
  duplicate_group: overrideById.get(oldField.id)?.duplicate_group || oldField.duplicate_group || oldField.family,
}));

const allFields = [...baseFields, ...promoted, ...additions];
if (allFields.length !== 105) throw new Error(`BINGO_V2_PRODUCT_POOL_COUNT:${allFields.length}`);
if (new Set(allFields.map((item) => item.id)).size !== allFields.length) throw new Error('BINGO_V2_PRODUCT_DUPLICATE_ID');

const mapSignatures = {
  map_basement:{hard:['bingo_basement_body_disposal','bingo_basement_sacrifice','bingo_teleporter_shift'],conditional:['bingo_undertaker_drag','bingo_undertaker_button_fail'],min:3,target:4,max:5},
  map_goosechapel:{hard:['bingo_goosechapel_double_fire','bingo_goosechapel_smog_kill','bingo_prison_vote','bingo_key_saves','bingo_politician_tie'],conditional:[],min:3,target:4,max:5},
  map_nexus_colony:{hard:['bingo_nexus_shuttle_splatter','bingo_nexus_shuttle_asphyxiation','bingo_nexus_teleporter_kill','bingo_teleporter_shift'],conditional:['bingo_mime_environment_kill'],min:3,target:4,max:5},
  map_ss_mothergoose:{hard:['bingo_airlock_kill','bingo_airlock_double','bingo_airlock_pelican','bingo_prison_vote','bingo_key_saves','bingo_politician_tie'],conditional:[],min:3,target:4,max:5},
  map_jungle_temple:{hard:['bingo_jungle_boulder_kill','bingo_jungle_bridge_kill','bingo_adventurer_hazard'],conditional:['bingo_undertaker_drag','bingo_mime_environment_kill'],min:3,target:4,max:5},
  map_mallard_manor:{hard:['bingo_chandelier','bingo_adventurer_hazard'],conditional:['bingo_mime_environment_kill'],min:2,target:3,max:4},
  map_black_swan:{hard:['bingo_airlock_kill','bingo_airlock_double','bingo_airlock_pelican','bingo_black_swan_vent_room'],conditional:[],min:2,target:3,max:4},
  map_ancient_sands:{hard:['bingo_mummy_kill','bingo_sandstorm_kill','bingo_adventurer_hazard'],conditional:['bingo_warlock_locust_kill','bingo_undertaker_drag'],min:3,target:4,max:5},
  map_bloodhaven:{hard:['bingo_bloodhaven_body_disposal','bingo_bloodhaven_night_kill'],conditional:['bingo_undertaker_drag'],min:2,target:3,max:4},
  map_eagleton_springs:{hard:['bingo_bus','bingo_cupid_lovers','bingo_cupid_slap','bingo_host_parasite_lab','bingo_eagleton_rejuvenation_cleanse','bingo_adventurer_hazard'],conditional:['bingo_undertaker_drag','bingo_mime_environment_kill'],min:4,target:4,max:6},
  map_carnival:{hard:['bingo_carnival_rollercoaster_kill','bingo_carnival_wheel_bomb','bingo_carnival_rabbit_player'],conditional:['bingo_undertaker_drag','bingo_mime_environment_kill'],min:3,target:4,max:5},
  map_mallardon:{hard:['bingo_mallardon_heat','bingo_mallardon_heat_kill','bingo_mallardon_sinkhole_body','bingo_hawk_beam','bingo_hawk_win','bingo_hawk_hunt','bingo_looter_disposal'],conditional:['bingo_mime_environment_kill'],min:4,target:5,max:6},
};

export const bingoV2Data = {
  ...phase2Data,
  data_version: 'ggd-bingo-v2-product-curated-2026-08-17',
  source: 'GGD003 BINGO_2_0_CANONICAL_POOL + BINGO_2_0_MAP_SIGNATURES product curation readback',
  statistics_mode: 'OPTIONAL_FUTURE_COST_FROZEN',
  playable_maps: phase2Data.playable_maps.map((map) => map.id === 'map_black_swan' ? {...map, name_de:'Black Swan'} : map),
  fields: allFields,
  map_signatures: mapSignatures,
};

export { mapSignatures as bingoMapSignatures };

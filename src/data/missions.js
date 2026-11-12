import { DESTINATION_BY_ID } from './destinations.js';
import { SPACECRAFT_BY_ID } from './spacecraft.js';

export const MISSIONS = [
  {
    id: 'moon-exploration',
    code: 'OX-01',
    title: 'Moon Exploration',
    destinationId: 'moon',
    difficulty: 'Cadet',
    difficultyLevel: 1,
    duration: '6 days',
    recommendedCraft: 'astra-lander',
    objective:
      'Land a two-person crew near the lunar south pole, characterize water ice in permanently shadowed terrain and return surface samples.',
    brief:
      'The lunar south pole is a frontier for water-ice prospecting and a proving ground for deep-space operations. Precision landing and thermal control are critical.',
    payload: ['Polar drill', 'Sample return capsule', 'Surface habitat module'],
    scienceValue: 72,
    risk: 'LOW',
    accent: '#bcd8ff',
    stages: [
      { at: 0, label: 'Pre-flight diagnostics' },
      { at: 18, label: 'Translunar injection' },
      { at: 48, label: 'Powered descent' },
      { at: 72, label: 'Surface operations' },
      { at: 92, label: 'Sample encapsulation' },
      { at: 100, label: 'Mission resolved' },
    ],
  },
  {
    id: 'mars-exploration',
    code: 'OX-02',
    title: 'Mars Exploration',
    destinationId: 'mars',
    difficulty: 'Standard',
    difficultyLevel: 2,
    duration: '210 days',
    recommendedCraft: 'ares-courier',
    objective:
      'Place a four-person crew in orbit around Mars, deploy an autonomous sample-retrieval lander and survey Jezero Crater for ancient biosignatures.',
    brief:
      'A Mars transfer requires months of isolation, careful radiation management and precise aerocapture. The science return is among the highest in the program.',
    payload: ['Sample-retrieval lander', 'Orbital science suite', 'Radiation dosimeter array'],
    scienceValue: 89,
    risk: 'MODERATE',
    accent: '#ffa47d',
    stages: [
      { at: 0, label: 'Crew systems check' },
      { at: 16, label: 'Trans-Mars injection' },
      { at: 42, label: 'Deep-space transit' },
      { at: 68, label: 'Mars orbit insertion' },
      { at: 86, label: 'Sample retrieval' },
      { at: 100, label: 'Mission resolved' },
    ],
  },
  {
    id: 'jupiter-discovery',
    code: 'OX-03',
    title: 'Jupiter Discovery',
    destinationId: 'jupiter',
    difficulty: 'Standard',
    difficultyLevel: 2,
    duration: '3.4 years',
    recommendedCraft: 'odyssey-x',
    objective:
      'Enter a high-Jupiter orbit, map the radiation environment and conduct a close flyby of Europa to assess its subsurface ocean.',
    brief:
      'Jupiter’s radiation belts pose a serious hazard to electronics and crews. A resilient trajectory and hardened systems are mandatory.',
    payload: ['Ice-penetrating radar', 'Magnetometer', 'Radiation-hardened camera'],
    scienceValue: 94,
    risk: 'HIGH',
    accent: '#ffe0b8',
    stages: [
      { at: 0, label: 'Flight systems check' },
      { at: 14, label: 'Earth departure' },
      { at: 38, label: 'Cruise phase' },
      { at: 62, label: 'Jupiter orbit insertion' },
      { at: 84, label: 'Europa flyby' },
      { at: 100, label: 'Mission resolved' },
    ],
  },
  {
    id: 'saturn-ring-exploration',
    code: 'OX-04',
    title: 'Saturn Ring Exploration',
    destinationId: 'saturn',
    difficulty: 'Elite',
    difficultyLevel: 3,
    duration: '6.8 years',
    recommendedCraft: 'titan-surveyor',
    objective:
      'Navigate Saturn’s ring plane, collect particle samples and release a probe into Titan’s atmosphere for a 90-day survey.',
    brief:
      'Ring-plane crossings demand precise trajectory control, and low solar flux makes power system design a mission-limiting challenge.',
    payload: ['Ring-particle collector', 'Titan atmospheric probe', 'High-gain relay'],
    scienceValue: 97,
    risk: 'HIGH',
    accent: '#fff0c3',
    stages: [
      { at: 0, label: 'Probe integration' },
      { at: 12, label: 'Outer-system injection' },
      { at: 36, label: 'Cruise phase' },
      { at: 60, label: 'Saturn capture burn' },
      { at: 82, label: 'Ring-plane crossing' },
      { at: 100, label: 'Mission resolved' },
    ],
  },
  {
    id: 'deep-space-exploration',
    code: 'OX-05',
    title: 'Deep Space Exploration',
    destinationId: 'deep-space',
    difficulty: 'Elite',
    difficultyLevel: 3,
    duration: '18+ years',
    recommendedCraft: 'helios-dawn',
    objective:
      'Cross the heliosphere, gather direct measurements of the interstellar medium and operate autonomously for decades beyond the Sun’s influence.',
    brief:
      'This is a first-of-its-kind long-duration mission. Communication delays grow to hours, power margins are tight and no resupply is possible.',
    payload: ['Interstellar plasma spectrometer', 'Cosmic-ray telescope', 'Autonomous navigation core'],
    scienceValue: 99,
    risk: 'EXTREME',
    accent: '#cfc8ff',
    stages: [
      { at: 0, label: 'Autonomy certification' },
      { at: 12, label: 'Earth escape burn' },
      { at: 34, label: 'Outer-planet gravity assist' },
      { at: 60, label: 'Heliosphere approach' },
      { at: 84, label: 'Interstellar medium' },
      { at: 100, label: 'Mission resolved' },
    ],
  },
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((mission) => [mission.id, mission]));

export const getMission = (id) => MISSION_BY_ID[id] ?? MISSIONS[0];

const DIFFICULTY_FACTOR = { Cadet: 2, Standard: -3, Elite: -12 };

export function getMissionReadiness(mission, spacecraft) {
  if (!mission || !spacecraft) return 0;
  const destination = getMissionDestination(mission);
  const rangeRatio = Math.max(0.05, Math.min(1, spacecraft.rangeAU / destination.requiredRangeAU));
  let chance = 44 + rangeRatio * 50;
  if (spacecraft.id === mission.recommendedCraft) chance += 8;
  chance += DIFFICULTY_FACTOR[mission.difficulty] ?? 0;
  return Math.max(28, Math.min(97, Math.round(chance)));
}

export function getMissionRisk(mission) {
  return mission?.risk ?? 'MODERATE';
}

export function getMissionDestination(mission) {
  return DESTINATION_BY_ID[mission?.destinationId] ?? DESTINATION_BY_ID.moon;
}

export function getRecommendedCraft(mission) {
  return SPACECRAFT_BY_ID[mission?.recommendedCraft] ?? null;
}

export function resolveMission(chance) {
  const roll = Math.random() * 100;
  return roll <= chance;
}

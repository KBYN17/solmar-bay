// Solmar Bay — the story: five missions in order, each with a briefing, an
// objective marker and a cash reward. Mission 1 pays $150.
import { MISSION_REWARDS, INTERACT_RADIUS } from './config.js';
import { addMoney, showMessage, showToast, addHeat } from './world.js';

export const MISSIONS = [
  {
    id: 1,
    title: 'The First Package',
    briefing: 'Rico needs a package run. Pick it up at the Courier Depot in Old Town, then drop it at the Marina Cafe.',
    reward: MISSION_REWARDS[0],
  },
  {
    id: 2,
    title: 'Hot Wheels',
    briefing: 'The crew needs a fresh ride. Steal any car and bring it to the Dockside Garage. Watch the cops.',
    reward: MISSION_REWARDS[1],
  },
  {
    id: 3,
    title: 'Lose the Heat',
    briefing: 'You are too hot. Get the cops to 2 stars or more, then shake them until your wanted level hits zero.',
    reward: MISSION_REWARDS[2],
  },
  {
    id: 4,
    title: 'Marina Drops',
    briefing: 'Three drops are waiting around Marina Bay and Palm Heights. Collect all three without getting busted.',
    reward: MISSION_REWARDS[3],
  },
  {
    id: 5,
    title: 'The Last Run',
    briefing: 'One last run to the Sunset Dock — and the whole bay is looking for you. Get there with the heat on.',
    reward: MISSION_REWARDS[4],
  },
];

export function currentMission(state) {
  if (state.missionIndex >= MISSIONS.length) return null;
  return MISSIONS[state.missionIndex];
}

export function missionObjective(state, city) {
  const m = currentMission(state);
  if (!m) return 'Story complete — Solmar Bay is yours.';
  const L = city.locations;
  switch (m.id) {
    case 1:
      return state.mission.stage === 0
        ? `Pick up the package at ${L.packagePickup.label}`
        : `Deliver the package to ${L.dropoff.label}`;
    case 2:
      return state.player.onFoot
        ? 'Steal a car (press F near one)'
        : `Drive the stolen car to ${L.garage.label}`;
    case 3:
      if (!state.mission.hadWanted) return 'Raise your wanted level to 2 stars';
      return 'Lose the cops — get wanted to 0';
    case 4:
      return `Collect the drops (${3 - state.mission.dropsLeft} of 3 collected)`;
    case 5:
      return `Reach ${L.dock.label} while wanted`;
    default:
      return m.briefing;
  }
}

export function missionTarget(state, city) {
  const m = currentMission(state);
  if (!m) return null;
  const L = city.locations;
  switch (m.id) {
    case 1:
      return state.mission.stage === 0 ? L.packagePickup : L.dropoff;
    case 2:
      return state.player.onFoot ? null : L.garage;
    case 3:
      return null;
    case 4: {
      const left = state.drops.filter((d) => !d.taken);
      return left.length ? left[0] : null;
    }
    case 5:
      return L.dock;
    default:
      return null;
  }
}

function completeMission(state) {
  const m = currentMission(state);
  if (!m) return;
  addMoney(state, m.reward, `${m.title} complete`);
  state.stats.missionsDone += 1;
  state.missionIndex += 1;
  state.mission = { stage: 0, hadWanted: false, dropsLeft: 0 };
  if (state.missionIndex >= MISSIONS.length) {
    state.allMissionsDone = true;
    showMessage(state, 'STORY COMPLETE — You own Solmar Bay.');
  } else {
    showMessage(state, `Mission ${state.missionIndex + 1}: ${MISSIONS[state.missionIndex].title}`);
  }
  showToast(state, `Mission complete! +$${m.reward}`);
}

export function startMission(state, city) {
  const m = currentMission(state);
  if (!m) return;
  if (m.id === 4) {
    // Three drops scattered around the south half of the city.
    state.drops = [
      { x: 400, y: 2000, taken: false },
      { x: 1600, y: 2000, taken: false },
      { x: 800, y: 1200, taken: false },
    ];
    state.mission.dropsLeft = 3;
  }
  if (m.id === 5) {
    addHeat(state, 45); // the whole bay is looking for you
  }
  showMessage(state, `Mission ${m.id}: ${m.title} — ${m.briefing}`);
}

// E pressed near the objective: pick up / deliver / hand over.
export function interact(state, city) {
  const m = currentMission(state);
  if (!m) return false;
  const p = state.player;
  const L = city.locations;
  const near = (spot) => Math.hypot(p.x - spot.x, p.y - spot.y) < INTERACT_RADIUS;
  if (m.id === 1) {
    if (state.mission.stage === 0 && near(L.packagePickup)) {
      state.mission.stage = 1;
      showMessage(state, 'Package picked up. Deliver it to the Marina Cafe.');
      return true;
    }
    if (state.mission.stage === 1 && near(L.dropoff)) {
      completeMission(state);
      return true;
    }
  }
  if (m.id === 2 && !p.onFoot && near(L.garage)) {
    completeMission(state);
    return true;
  }
  if (m.id === 5 && near(L.dock) && state.wanted > 0) {
    completeMission(state);
    return true;
  }
  return false;
}

export function updateMission(state, city, dt) {
  const m = currentMission(state);
  if (!m) return;
  if (m.id === 3) {
    if (state.wanted >= 2) state.mission.hadWanted = true;
    if (state.mission.hadWanted && state.wanted === 0) completeMission(state);
    return;
  }
  if (m.id === 4) {
    const p = state.player;
    let changed = false;
    for (const d of state.drops) {
      if (!d.taken && Math.hypot(p.x - d.x, p.y - d.y) < 60) {
        d.taken = true;
        state.mission.dropsLeft -= 1;
        showToast(state, `Drop collected (${3 - state.mission.dropsLeft}/3)`);
        changed = true;
      }
    }
    if (changed && state.mission.dropsLeft <= 0) completeMission(state);
  }
}

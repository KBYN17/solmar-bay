// Solmar Bay — game state: what a save holds, and the pure state changes
// (steal a car, stash money, shoot, take damage, save/load). No DOM here so
// the logic can be tested headlessly.
import {
  START_MONEY, STASH_DEPOSIT, BUST_FINE, SAVE_KEY, GAME_SEED, CAR_COLORS,
} from './config.js';
import { makeRng } from './random.js';
import { generateCity, nearestRoadPoint } from './city.js';

let nextCarId = 1;

export function makeCar(x, y, angle, kind, driver, color) {
  return {
    id: nextCarId++,
    x, y, angle, speed: 0,
    kind, driver, color,
    stolen: false,
    hp: 100,
  };
}

export function createWorld(seed = GAME_SEED) {
  nextCarId = 1;
  const city = generateCity(seed);
  const rng = makeRng(seed + 77);
  const start = city.locations.start;
  const state = {
    seed,
    time: 0,
    started: false,
    paused: false,
    busted: false,
    allMissionsDone: false,
    money: START_MONEY,
    stash: 0,
    health: 100,
    wanted: 0,
    heat: 0,
    missionIndex: 0,
    mission: { stage: 0, hadWanted: false, dropsLeft: 0 },
    drops: [],
    player: {
      x: start.x, y: start.y, angle: -Math.PI / 2,
      speed: 0, onFoot: true, carId: null,
    },
    cars: [],
    peds: [],
    bullets: [],
    message: '',
    messageTimer: 0,
    toast: '',
    toastTimer: 0,
    stats: { carsStolen: 0, missionsDone: 0, shotsFired: 0, bustedCount: 0 },
  };
  // Parked cars around the start and across town for the player to steal.
  const parkedSpots = [
    { x: 440, y: 400 }, { x: 360, y: 440 }, { x: 800, y: 400 },
    { x: 1200, y: 800 }, { x: 2000, y: 400 }, { x: 400, y: 1200 },
    { x: 1600, y: 1200 }, { x: 2400, y: 800 }, { x: 2800, y: 1200 },
    { x: 800, y: 2000 }, { x: 2000, y: 2000 }, { x: 1200, y: 2000 },
  ];
  for (const spot of parkedSpots) {
    const kind = rng.chance(0.2) ? 'sport' : 'civil';
    state.cars.push(makeCar(spot.x, spot.y, rng.range(0, Math.PI * 2), kind, 'parked', rng.pick(CAR_COLORS)));
  }
  // A few pedestrians near the start.
  for (let i = 0; i < 10; i++) {
    const p = nearestRoadPoint(rng, start.x, start.y, 60, 500);
    state.peds.push({
      x: p.x + rng.range(-30, 30), y: p.y + rng.range(-30, 30),
      angle: rng.range(0, Math.PI * 2), speed: 0, color: '#f2c14e',
    });
  }
  return { state, city };
}

export function playerCar(state) {
  if (state.player.carId == null) return null;
  return state.cars.find((c) => c.id === state.player.carId) || null;
}

export function nearestCar(state, x, y, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const car of state.cars) {
    if (car.driver === 'player') continue;
    const d = Math.hypot(car.x - x, car.y - y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

// Steal a car: the player gets in, the car is flagged stolen, and the law
// notices — wanted rises to at least 1 star and police will spawn.
export function stealCar(state, car) {
  if (!car || car.driver === 'player') return false;
  car.driver = 'player';
  car.stolen = true;
  state.player.onFoot = false;
  state.player.carId = car.id;
  state.player.x = car.x;
  state.player.y = car.y;
  state.player.angle = car.angle;
  state.stats.carsStolen += 1;
  addHeat(state, 20);
  showMessage(state, 'Car stolen! The police are on to you.');
  return true;
}

export function exitCar(state) {
  const car = playerCar(state);
  if (!car) return false;
  car.driver = 'parked';
  car.speed = 0;
  state.player.onFoot = true;
  state.player.carId = null;
  state.player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 36;
  state.player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 36;
  state.player.speed = 0;
  return true;
}

export function addHeat(state, amount) {
  state.heat = Math.min(100, state.heat + amount);
  state.wanted = Math.min(5, Math.ceil(state.heat / 20));
  if (state.wanted < 1 && state.heat > 0) state.wanted = 1;
}

export function addMoney(state, amount, reason) {
  state.money += amount;
  showToast(state, `+$${amount}${reason ? ' — ' + reason : ''}`);
}

export function depositStash(state) {
  // One deposit moves exactly $50 of pocket money into the stash.
  if (state.money < STASH_DEPOSIT) {
    showMessage(state, 'Not enough cash to stash ($50 needed).');
    return false;
  }
  state.money -= STASH_DEPOSIT;
  state.stash += STASH_DEPOSIT;
  showToast(state, `Stashed $50 (stash: $${state.stash})`);
  return true;
}

export function shoot(state, targetX, targetY) {
  const p = state.player;
  const angle = Math.atan2(targetY - p.y, targetX - p.x);
  state.bullets.push({
    x: p.x + Math.cos(angle) * 22,
    y: p.y + Math.sin(angle) * 22,
    vx: Math.cos(angle) * 900,
    vy: Math.sin(angle) * 900,
    life: 0.9,
  });
  state.stats.shotsFired += 1;
  addHeat(state, 8);
}

export function damagePlayer(state, amount) {
  state.health -= amount;
  if (state.health <= 0) bustPlayer(state);
}

export function bustPlayer(state) {
  state.busted = true;
  state.stats.bustedCount += 1;
  state.money = Math.max(0, state.money - BUST_FINE);
  state.wanted = 0;
  state.heat = 0;
  state.health = 100;
  // Police cars leave; the player wakes up at the clinic.
  state.cars = state.cars.filter((c) => c.kind !== 'police');
  const hospital = { x: 1200, y: 1600 };
  if (state.player.carId != null) {
    const car = playerCar(state);
    if (car) { car.driver = 'parked'; car.speed = 0; }
    state.player.carId = null;
  }
  state.player.onFoot = true;
  state.player.x = hospital.x;
  state.player.y = hospital.y;
  state.player.speed = 0;
  showMessage(state, `BUSTED! Fined $${BUST_FINE}. You wake up at Palm Clinic.`);
}

export function showMessage(state, text) {
  state.message = text;
  state.messageTimer = 4;
}

export function showToast(state, text) {
  state.toast = text;
  state.toastTimer = 3;
}

// ---- save / load: the whole save is plain JSON in localStorage. ----
export function serializeSave(state) {
  return JSON.stringify({
    version: 1,
    money: state.money,
    stash: state.stash,
    health: state.health,
    wanted: state.wanted,
    heat: state.heat,
    missionIndex: state.missionIndex,
    mission: state.mission,
    allMissionsDone: state.allMissionsDone,
    player: state.player,
    cars: state.cars,
    peds: state.peds,
    stats: state.stats,
    time: state.time,
  });
}

export function saveGame(state, storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return false;
  store.setItem(SAVE_KEY, serializeSave(state));
  showToast(state, 'Game saved.');
  return true;
}

export function deserializeSave(json) {
  const data = JSON.parse(json);
  if (!data || data.version !== 1) throw new Error('bad save version');
  return data;
}

export function applySave(state, data) {
  state.money = data.money;
  state.stash = data.stash;
  state.health = data.health;
  state.wanted = data.wanted;
  state.heat = data.heat;
  state.missionIndex = data.missionIndex;
  state.mission = data.mission;
  state.allMissionsDone = data.allMissionsDone;
  state.player = data.player;
  state.cars = data.cars;
  state.peds = data.peds;
  state.stats = data.stats;
  state.time = data.time || 0;
  state.bullets = [];
  state.drops = [];
  state.busted = false;
  const maxId = state.cars.reduce((m, c) => Math.max(m, c.id), 0);
  nextCarId = maxId + 1;
}

export function loadGame(state, storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return false;
  const json = store.getItem(SAVE_KEY);
  if (!json) return false;
  applySave(state, deserializeSave(json));
  showToast(state, 'Save loaded.');
  return true;
}

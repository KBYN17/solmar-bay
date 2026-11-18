// Solmar Bay — the wanted system and the police: heat decays when the
// player is unseen, police cars spawn up to the wanted level and chase,
// and getting caught hurts.
import { POLICE_TOP_SPEED, HEAT_DECAY_PER_SEC } from './config.js';
import { makeCar } from './world.js';
import { nearestRoadPoint } from './city.js';
import { makeRng } from './random.js';

export function policeCars(state) {
  return state.cars.filter((c) => c.kind === 'police');
}

export function spawnPolice(state, city) {
  const want = state.wanted;
  const have = policeCars(state).length;
  if (have >= want) return;
  const rng = makeRng((state.seed || 1) + Math.floor(state.time * 10) + have * 131);
  for (let i = have; i < want; i++) {
    const p = nearestRoadPoint(rng, state.player.x, state.player.y, 520, 800);
    const car = makeCar(p.x, p.y, 0, 'police', 'police', '#1c2733');
    car.speed = POLICE_TOP_SPEED * 0.7;
    state.cars.push(car);
  }
}

export function updateWanted(state, dt) {
  if (state.wanted <= 0) return;
  // Heat cools off when no police car is close enough to see the player.
  const near = policeCars(state).some(
    (c) => Math.hypot(c.x - state.player.x, c.y - state.player.y) < 480,
  );
  if (!near) {
    state.heat = Math.max(0, state.heat - HEAT_DECAY_PER_SEC * dt);
    const next = Math.ceil(state.heat / 20);
    if (next < state.wanted) state.wanted = next;
    if (state.heat <= 0) {
      state.wanted = 0;
      state.cars = state.cars.filter((c) => c.kind !== 'police');
    }
  }
}

export function updatePolice(state, dt) {
  const cops = policeCars(state);
  const target = state.player;
  for (const cop of cops) {
    const dx = target.x - cop.x;
    const dy = target.y - cop.y;
    const dist = Math.hypot(dx, dy) || 1;
    const wantAngle = Math.atan2(dy, dx);
    let diff = wantAngle - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += Math.max(-3.4 * dt, Math.min(3.4 * dt, diff));
    const targetSpeed = dist > 260 ? POLICE_TOP_SPEED : POLICE_TOP_SPEED * 0.55;
    cop.speed += (targetSpeed - cop.speed) * Math.min(1, 1.6 * dt);
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    // A cop that rams the player hurts them; on foot the player is an easy catch.
    if (dist < 42) {
      cop.speed *= 0.4;
      if (target.onFoot) {
        state.health -= 14 * dt;
        if (state.health <= 0) {
          // busted() lives in world.js; police only reports the catch.
          state.health = 0;
        }
      } else {
        state.health -= 4 * dt;
        target.speed *= 0.92;
      }
    }
  }
  return cops.length;
}

export function chaseActive(state) {
  return state.wanted > 0 && policeCars(state).length > 0;
}

// Solmar Bay — traffic and pedestrians: cars cruise the road grid and turn
// at intersections; pedestrians stroll the sidewalks.
import { TRAFFIC_SPEED, PED_SPEED, CAR_COLORS, PED_COLORS } from './config.js';
import { makeCar } from './world.js';
import { makeRng } from './random.js';
import { ROAD_SPACING, WORLD_WIDTH, WORLD_HEIGHT } from './config.js';

export function spawnTraffic(state, count, seed) {
  const rng = makeRng(seed + 913);
  for (let i = 0; i < count; i++) {
    const vertical = rng.chance(0.5);
    let x; let y; let angle;
    if (vertical) {
      x = rng.int(1, 7) * ROAD_SPACING + rng.range(-24, 24);
      y = rng.range(100, WORLD_HEIGHT - 100);
      angle = rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2;
    } else {
      x = rng.range(100, WORLD_WIDTH - 100);
      y = rng.int(1, 5) * ROAD_SPACING + rng.range(-24, 24);
      angle = rng.chance(0.5) ? 0 : Math.PI;
    }
    const car = makeCar(x, y, angle, 'civil', 'traffic', rng.pick(CAR_COLORS));
    car.speed = rng.range(TRAFFIC_SPEED * 0.7, TRAFFIC_SPEED * 1.15);
    state.cars.push(car);
  }
  for (let i = 0; i < 26; i++) {
    state.peds.push({
      x: rng.range(200, WORLD_WIDTH - 200),
      y: rng.range(200, WORLD_HEIGHT - 200),
      angle: rng.range(0, Math.PI * 2),
      speed: rng.range(PED_SPEED * 0.6, PED_SPEED),
      color: rng.pick(PED_COLORS),
    });
  }
}

function turnAtIntersection(car, rng) {
  // At a grid crossing, sometimes turn left or right.
  const nearX = Math.abs(car.x % ROAD_SPACING) < 30 || Math.abs(car.x % ROAD_SPACING - ROAD_SPACING) < 30;
  const nearY = Math.abs(car.y % ROAD_SPACING) < 30 || Math.abs(car.y % ROAD_SPACING - ROAD_SPACING) < 30;
  if (!nearX || !nearY) return;
  if (!rng.chance(0.02)) return;
  car.angle += rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2;
}

export function updateTraffic(state, dt, rng) {
  for (const car of state.cars) {
    if (car.driver !== 'traffic') continue;
    turnAtIntersection(car, rng);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    // Wrap around the city edge so traffic never runs out.
    if (car.x < 40) { car.x = WORLD_WIDTH - 40; }
    if (car.x > WORLD_WIDTH - 40) { car.x = 40; }
    if (car.y < 40) { car.y = WORLD_HEIGHT - 40; }
    if (car.y > WORLD_HEIGHT - 40) { car.y = 40; }
  }
  for (const ped of state.peds) {
    ped.x += Math.cos(ped.angle) * ped.speed * dt;
    ped.y += Math.sin(ped.angle) * ped.speed * dt;
    if (ped.x < 60 || ped.x > WORLD_WIDTH - 60 || ped.y < 60 || ped.y > WORLD_HEIGHT - 60) {
      ped.angle += Math.PI;
    }
    if (rng.chance(0.002)) ped.angle += rng.range(-1.2, 1.2);
  }
}

export function updateBullets(state, dt) {
  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    // A bullet that hits a pedestrian scares the city: wanted rises.
    for (const ped of state.peds) {
      if (Math.hypot(ped.x - b.x, ped.y - b.y) < 16) {
        b.life = 0;
        ped.x += (ped.x - b.x) * 2;
        ped.y += (ped.y - b.y) * 2;
      }
    }
  }
  state.bullets = state.bullets.filter((b) => b.life > 0);
}

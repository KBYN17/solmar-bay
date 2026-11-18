// Solmar Bay — the city: 8 districts, a road grid, buildings, and the named
// places the story uses. Everything is generated from a seed, so the map is
// identical on every load for the same seed.
import {
  WORLD_WIDTH, WORLD_HEIGHT, DISTRICTS, ROAD_SPACING, ROAD_WIDTH,
} from './config.js';
import { makeRng } from './random.js';

export const DISTRICT_LIST = DISTRICTS;

function roadLines() {
  const vertical = [];
  const horizontal = [];
  for (let x = ROAD_SPACING; x < WORLD_WIDTH; x += ROAD_SPACING) vertical.push(x);
  for (let y = ROAD_SPACING; y < WORLD_HEIGHT; y += ROAD_SPACING) horizontal.push(y);
  return { vertical, horizontal };
}

export function isRoad(x, y) {
  const half = ROAD_WIDTH / 2;
  for (let gx = ROAD_SPACING; gx < WORLD_WIDTH; gx += ROAD_SPACING) {
    if (Math.abs(x - gx) < half) return true;
  }
  for (let gy = ROAD_SPACING; gy < WORLD_HEIGHT; gy += ROAD_SPACING) {
    if (Math.abs(y - gy) < half) return true;
  }
  return false;
}

export function nearestRoadPoint(rng, cx, cy, minDist, maxDist) {
  for (let tries = 0; tries < 40; tries++) {
    const vertical = rng.chance(0.5);
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(minDist, maxDist);
    let x = cx + Math.cos(angle) * dist;
    let y = cy + Math.sin(angle) * dist;
    if (vertical) {
      const gx = Math.round(x / ROAD_SPACING) * ROAD_SPACING;
      x = Math.max(ROAD_SPACING, Math.min(WORLD_WIDTH - ROAD_SPACING, gx));
    } else {
      const gy = Math.round(y / ROAD_SPACING) * ROAD_SPACING;
      y = Math.max(ROAD_SPACING, Math.min(WORLD_HEIGHT - ROAD_SPACING, gy));
    }
    x = Math.max(60, Math.min(WORLD_WIDTH - 60, x));
    y = Math.max(60, Math.min(WORLD_HEIGHT - 60, y));
    if (isRoad(x, y)) return { x, y };
  }
  return { x: ROAD_SPACING, y: ROAD_SPACING };
}

export function generateCity(seed) {
  const rng = makeRng(seed);
  const roads = roadLines();
  const buildings = [];
  const parks = [];
  const buildingColors = ['#8a7a63', '#6b7a8a', '#9a8a7a', '#7a6b8a', '#8a6b5a', '#5a7a6b'];

  // One building per city block, inset from the roads, with a few blocks
  // left as parks so the map breathes.
  for (let bx = 0; bx < WORLD_WIDTH / ROAD_SPACING - 1; bx++) {
    for (let by = 0; by < WORLD_HEIGHT / ROAD_SPACING - 1; by++) {
      const x0 = bx * ROAD_SPACING + ROAD_SPACING + 70;
      const y0 = by * ROAD_SPACING + ROAD_SPACING + 70;
      const w = ROAD_SPACING - 140;
      const h = ROAD_SPACING - 140;
      if (rng.chance(0.18)) {
        parks.push({ x: x0, y: y0, w, h });
        continue;
      }
      const split = rng.chance(0.45);
      if (split) {
        const vertical = rng.chance(0.5);
        if (vertical) {
          buildings.push({ x: x0, y: y0, w: w / 2 - 8, h, color: rng.pick(buildingColors) });
          buildings.push({ x: x0 + w / 2 + 8, y: y0, w: w / 2 - 8, h, color: rng.pick(buildingColors) });
        } else {
          buildings.push({ x: x0, y: y0, w, h: h / 2 - 8, color: rng.pick(buildingColors) });
          buildings.push({ x: x0, y: y0 + h / 2 + 8, w, h: h / 2 - 8, color: rng.pick(buildingColors) });
        }
      } else {
        buildings.push({ x: x0, y: y0, w, h, color: rng.pick(buildingColors) });
      }
    }
  }

  // Named story places, all on roads so the player can always reach them.
  const locations = {
    packagePickup: { x: 1200, y: 400, label: 'Courier Depot' },
    dropoff: { x: 400, y: 1600, label: 'Marina Cafe' },
    garage: { x: 2000, y: 1600, label: 'Dockside Garage' },
    dock: { x: 2800, y: 2000, label: 'Sunset Dock' },
    hospital: { x: 1200, y: 1600, label: 'Palm Clinic' },
    stashHouse: { x: 400, y: 400, label: 'Porto Safehouse' },
    start: { x: 400, y: 400, label: 'Porto Verde' },
  };

  return {
    seed,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    districts: DISTRICTS,
    roads,
    buildings,
    parks,
    locations,
    // South edge is the bay: water below y = 2280.
    waterY: 2280,
  };
}

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[0];
}

export function collidesWithBuildings(x, y, radius, buildings) {
  for (const b of buildings) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < radius * radius) return b;
  }
  return null;
}

export function clampToWorld(x, y, margin = 24) {
  return {
    x: Math.max(margin, Math.min(WORLD_WIDTH - margin, x)),
    y: Math.max(margin, Math.min(WORLD_HEIGHT - margin, y)),
  };
}

// Solmar Bay — entry point: the game loop, player controls, and the wiring
// between world, city, missions, police, traffic, audio and rendering.
import {
  VIEW_WIDTH, VIEW_HEIGHT, PLAYER_WALK_SPEED, PLAYER_RUN_SPEED,
  CAR_TOP_SPEED, CAR_ACCEL, CAR_TURN, GAME_SEED,
} from './config.js';
import { createWorld, playerCar, stealCar, exitCar, nearestCar, shoot, saveGame, loadGame, depositStash, bustPlayer, showMessage } from './world.js';
import { collidesWithBuildings, clampToWorld } from './city.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render, cameraFor } from './render.js';
import { updatePolice, updateWanted, spawnPolice } from './police.js';
import { spawnTraffic, updateTraffic, updateBullets } from './traffic.js';
import { startMission, interact, updateMission, currentMission } from './missions.js';
import { applyScene } from './shots.js';
import { makeRng } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const { state, city } = createWorld(GAME_SEED);
const input = createInput();
input.attach(canvas);
const audio = createAudio();
const rng = makeRng(GAME_SEED + 4242);
spawnTraffic(state, 14, GAME_SEED);
startMission(state, city);

let lastTime = performance.now();
let sirenOn = false;

function screenToWorld(sx, sy) {
  const cam = cameraFor(state);
  return { x: sx + cam.x, y: sy + cam.y };
}

function updatePlayer(dt) {
  const p = state.player;
  const car = playerCar(state);
  if (car) {
    // Driving: W/S accelerate and brake, A/D steer.
    const forward = input.down('w', 'arrowup') ? 1 : input.down('s', 'arrowdown') ? -0.6 : 0;
    car.speed += forward * CAR_ACCEL * dt;
    car.speed -= car.speed * 0.9 * dt;
    if (Math.abs(car.speed) < 4 && forward === 0) car.speed = 0;
    car.speed = Math.max(-160, Math.min(CAR_TOP_SPEED, car.speed));
    const steer = input.down('a', 'arrowleft') ? -1 : input.down('d', 'arrowright') ? 1 : 0;
    car.angle += steer * CAR_TURN * dt * Math.sign(car.speed || 1) * Math.min(1, Math.abs(car.speed) / 120 + 0.2);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!collidesWithBuildings(nx, ny, 22, city.buildings)) {
      car.x = nx;
      car.y = ny;
    } else {
      car.speed *= 0.3;
    }
    const clamped = clampToWorld(car.x, car.y);
    car.x = clamped.x;
    car.y = clamped.y;
    p.x = car.x;
    p.y = car.y;
    p.angle = car.angle;
    p.speed = car.speed;
    audio.setEngineSpeed(Math.abs(car.speed) / CAR_TOP_SPEED);
  } else {
    // On foot: WASD/arrows, Shift to run.
    let dx = 0;
    let dy = 0;
    if (input.down('w', 'arrowup')) dy -= 1;
    if (input.down('s', 'arrowdown')) dy += 1;
    if (input.down('a', 'arrowleft')) dx -= 1;
    if (input.down('d', 'arrowright')) dx += 1;
    const len = Math.hypot(dx, dy);
    const speed = input.down('shift') ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    if (len > 0) {
      p.angle = Math.atan2(dy, dx);
      const nx = p.x + (dx / len) * speed * dt;
      const ny = p.y + (dy / len) * speed * dt;
      if (!collidesWithBuildings(nx, p.y, 12, city.buildings)) p.x = nx;
      if (!collidesWithBuildings(p.x, ny, 12, city.buildings)) p.y = ny;
      const clamped = clampToWorld(p.x, p.y);
      p.x = clamped.x;
      p.y = clamped.y;
      p.speed = speed;
    } else {
      p.speed = 0;
    }
  }
}

function update(dt) {
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.toastTimer > 0) state.toastTimer -= dt;

  // One-shot keys.
  if (input.pressed('enter')) {
    if (!state.started) {
      state.started = true;
      audio.unlock();
      audio.blip();
    } else if (state.busted) {
      state.busted = false;
      showMessage(state, 'Back on the streets. Stay sharp.');
    }
  }
  if (input.pressed('p')) {
    state.paused = !state.paused;
    showMessage(state, state.paused ? 'Paused.' : 'Resumed.');
  }
  if (input.pressed('m')) {
    const muted = audio.toggleMute();
    showMessage(state, muted ? 'Sound off.' : 'Sound on.');
  }
  if (input.pressed('s')) saveGame(state);
  if (input.pressed('l')) { if (loadGame(state)) startMission(state, city); }
  if (input.pressed('b')) depositStash(state);
  if (input.pressed('e')) {
    const p = state.player;
    if (!interact(state, city)) {
      if (p.onFoot) {
        const car = nearestCar(state, p.x, p.y, 70);
        if (car) {
          car.driver = 'player';
          p.onFoot = false;
          p.carId = car.id;
          p.x = car.x; p.y = car.y; p.angle = car.angle;
          audio.startEngine();
          audio.blip();
        }
      } else {
        exitCar(state);
        audio.stopEngine();
      }
    }
  }
  if (input.pressed('f')) {
    const p = state.player;
    if (p.onFoot) {
      const car = nearestCar(state, p.x, p.y, 90);
      if (car && stealCar(state, car)) {
        audio.startEngine();
        audio.blip();
      }
    }
  }
  if (input.consumeClick() && state.started && !state.paused) {
    const w = screenToWorld(input.mouseX, input.mouseY);
    shoot(state, w.x, w.y);
    audio.gunshot();
  }

  if (!state.started || state.paused) return;
  updatePlayer(dt);
  updateTraffic(state, dt, rng);
  updateBullets(state, dt);
  updateMission(state, city, dt);
  spawnPolice(state, city);
  updateWanted(state, dt);
  updatePolice(state, dt);
  if (state.health <= 0 && !state.busted) {
    bustPlayer(state);
    audio.busted();
    audio.stopEngine();
    audio.stopSiren();
    sirenOn = false;
  }
  // Siren follows the wanted level.
  if (state.wanted > 0 && !sirenOn) { audio.startSiren(); sirenOn = true; }
  if (state.wanted === 0 && sirenOn) { audio.stopSiren(); sirenOn = false; }
  // Engine hum follows the car.
  if (playerCar(state) && !state.paused) audio.startEngine();
  if (!playerCar(state)) audio.stopEngine();
  // Mission complete jingle is played by the toast in missions.js via money;
  // keep the audio state honest when the story ends.
  if (state.allMissionsDone) audio.stopSiren();
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render(ctx, state, city);
  requestAnimationFrame(loop);
}

// Screenshot scenes: ?scene=start|drive|chase|mission starts the game in
// that setup so the four dossier shots show the systems at their best.
const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene) {
  try {
    applyScene(state, city, scene);
    spawnTraffic(state, 6, GAME_SEED + 7);
  } catch (err) {
    console.error('bad scene', scene, err);
  }
}

// Test and tool hooks: the game object for headless checks and screenshots.
window.__game = { state, city, startMission, interact, updateMission, applyScene };
window.__shots = { applyScene };

requestAnimationFrame(loop);

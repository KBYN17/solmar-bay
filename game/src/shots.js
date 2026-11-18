// Solmar Bay — screenshot scenes: four fixed setups (start, drive, chase,
// mission) that put the game's systems on screen for the dossier shots.
// Each one mutates a fresh world into the scene; the game itself is untouched.
import { makeCar, addHeat } from './world.js';
import { spawnPolice } from './police.js';

export const SCENES = ['start', 'drive', 'chase', 'mission'];

function putPlayerInCar(state, x, y, angle, color) {
  const car = makeCar(x, y, angle, 'sport', 'player', color || '#d94f3d');
  car.speed = 300;
  state.cars.push(car);
  state.player.onFoot = false;
  state.player.carId = car.id;
  state.player.x = x;
  state.player.y = y;
  state.player.angle = angle;
}

export function applyScene(state, city, name) {
  state.started = name !== 'start';
  state.time = 12;
  if (name === 'start') {
    state.player.x = 400;
    state.player.y = 400;
    return state;
  }
  if (name === 'drive') {
    state.money = 1250;
    state.stash = 350;
    putPlayerInCar(state, 800, 400, 0, '#3d7ad9');
    state.missionIndex = 0;
    state.mission = { stage: 0, hadWanted: false, dropsLeft: 0 };
    return state;
  }
  if (name === 'chase') {
    state.money = 860;
    putPlayerInCar(state, 1200, 800, Math.PI / 2, '#e8c33a');
    addHeat(state, 60); // 3 stars
    spawnPolice(state, city);
    // Pull the cops in close so the chase reads on screen.
    const cops = state.cars.filter((c) => c.kind === 'police');
    cops.forEach((cop, i) => {
      cop.x = state.player.x - 160 - i * 60;
      cop.y = state.player.y - 90 + i * 90;
      cop.angle = Math.PI / 2;
      cop.speed = 420;
    });
    state.missionIndex = 1;
    state.mission = { stage: 0, hadWanted: false, dropsLeft: 0 };
    return state;
  }
  if (name === 'mission') {
    state.money = 540;
    state.missionIndex = 0;
    state.mission = { stage: 1, hadWanted: false, dropsLeft: 0 };
    state.player.x = 900;
    state.player.y = 1300;
    state.player.angle = Math.PI / 4;
    state.player.onFoot = true;
    state.player.carId = null;
    return state;
  }
  return state;
}

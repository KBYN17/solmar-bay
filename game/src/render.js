// Solmar Bay — rendering: the top-down city, cars, people, police lights,
// the HUD (money, wanted stars, health, objective), the minimap, and the
// start / busted / story-complete screens. Canvas 2D only.
import { VIEW_WIDTH, VIEW_HEIGHT, CONTROLS_TEXT } from './config.js';
import { districtAt } from './city.js';
import { currentMission, missionObjective, missionTarget } from './missions.js';
import { policeCars } from './police.js';

export function cameraFor(state) {
  const x = Math.max(VIEW_WIDTH / 2, Math.min(3200 - VIEW_WIDTH / 2, state.player.x));
  const y = Math.max(VIEW_HEIGHT / 2, Math.min(2400 - VIEW_HEIGHT / 2, state.player.y));
  return { x: x - VIEW_WIDTH / 2, y: y - VIEW_HEIGHT / 2 };
}

function drawCar(ctx, car, time) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-20, -11, 42, 24);
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-20, -11, 42, 22, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,30,45,0.85)';
  ctx.beginPath();
  ctx.roundRect(-6, -9, 14, 18, 3);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(18, -8, 3, 5);
  ctx.fillRect(18, 3, 3, 5);
  if (car.kind === 'police') {
    const blink = Math.floor(time * 4) % 2 === 0;
    ctx.fillStyle = blink ? '#ff3b30' : '#2f7bff';
    ctx.beginPath();
    ctx.arc(-2, -7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = blink ? '#2f7bff' : '#ff3b30';
    ctx.beginPath();
    ctx.arc(-2, 7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 0, 3);
  }
  ctx.restore();
}

function drawMinimap(ctx, state, city) {
  const mw = 200; const mh = 150;
  const mx = VIEW_WIDTH - mw - 14; const my = 14;
  const sx = mw / city.width; const sy = mh / city.height;
  ctx.save();
  ctx.fillStyle = 'rgba(10,16,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(mx - 6, my - 6, mw + 12, mh + 12, 8);
  ctx.fill();
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#274b63';
  ctx.fillRect(mx, my, mw, mh);
  for (const d of city.districts) {
    ctx.fillStyle = d.tint;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(mx + d.x * sx, my + d.y * sy, d.w * sx, d.h * sy);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = 'rgba(240,240,240,0.5)';
  ctx.lineWidth = 1;
  for (const gx of city.roads.vertical) {
    ctx.beginPath(); ctx.moveTo(mx + gx * sx, my); ctx.lineTo(mx + gx * sx, my + mh); ctx.stroke();
  }
  for (const gy of city.roads.horizontal) {
    ctx.beginPath(); ctx.moveTo(mx, my + gy * sy); ctx.lineTo(mx + mw, my + gy * sy); ctx.stroke();
  }
  const target = missionTarget(state, city);
  if (target) {
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.arc(mx + target.x * sx, my + target.y * sy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const cop of policeCars(state)) {
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(mx + cop.x * sx - 2, my + cop.y * sy - 2, 4, 4);
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(mx + state.player.x * sx, my + state.player.y * sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5c542';
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, state, city) {
  ctx.save();
  // Top-left: cash, stash, health.
  ctx.fillStyle = 'rgba(10,16,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(12, 12, 250, 92, 8);
  ctx.fill();
  ctx.fillStyle = '#7dff8a';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`$${state.money}`, 24, 44);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Stash: $${state.stash}`, 24, 68);
  ctx.fillStyle = '#ff6b5e';
  ctx.fillRect(24, 78, 150 * Math.max(0, state.health / 100), 10);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(24, 78, 150, 10);
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText(`HP ${Math.ceil(state.health)}`, 182, 87);

  // Wanted stars, top center.
  ctx.textAlign = 'center';
  ctx.font = '30px sans-serif';
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < state.wanted ? '★' : '☆';
  ctx.fillStyle = state.wanted > 0 ? '#ffd23d' : 'rgba(255,255,255,0.45)';
  ctx.fillText(stars, VIEW_WIDTH / 2, 46);
  if (state.wanted > 0) {
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('WANTED — lose the cops!', VIEW_WIDTH / 2, 68);
  }

  // Objective, bottom-left.
  const mission = currentMission(state);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(10,16,24,0.82)';
  const obj = missionObjective(state, city);
  ctx.beginPath();
  ctx.roundRect(12, VIEW_HEIGHT - 66, 560, 54, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(mission ? `Mission ${mission.id}: ${mission.title}  ($${mission.reward})` : 'Story complete!', 24, VIEW_HEIGHT - 44);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(obj, 24, VIEW_HEIGHT - 24);

  // District name, bottom-right.
  const d = districtAt(state.player.x, state.player.y);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(d.name, VIEW_WIDTH - 14, VIEW_HEIGHT - 18);

  // Toast + message.
  if (state.toastTimer > 0 && state.toast) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dff8a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(state.toast, VIEW_WIDTH / 2, 110);
  }
  if (state.messageTimer > 0 && state.message) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10,16,24,0.85)';
    const w = ctx.measureText(state.message).width + 32;
    ctx.beginPath();
    ctx.roundRect(VIEW_WIDTH / 2 - w / 2, VIEW_HEIGHT - 128, w, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '15px sans-serif';
    ctx.fillText(state.message, VIEW_WIDTH / 2, VIEW_HEIGHT - 106);
  }
  drawMinimap(ctx, state, city);
  ctx.restore();
}

function drawStartScreen(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,14,24,0.78)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('SOLMAR BAY', VIEW_WIDTH / 2, 190);
  ctx.fillStyle = '#7dff8a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('An open-world crime story — eight districts, one bay, no rules but yours.', VIEW_WIDTH / 2, 240);
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Steal cars, outrun the police, run five story missions, stash your cash.', VIEW_WIDTH / 2, 280);
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Press ENTER to start', VIEW_WIDTH / 2, 350);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '16px sans-serif';
  CONTROLS_TEXT.forEach((line, i) => {
    ctx.fillText(line, VIEW_WIDTH / 2, 400 + i * 26);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '13px sans-serif';
  ctx.fillText('A fully original game. No Rockstar content, no network, no libraries — just canvas and sound.', VIEW_WIDTH / 2, 580);
  ctx.restore();
}

export function render(ctx, state, city) {
  const cam = cameraFor(state);
  ctx.save();
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // Ground: grass and sand, bay water along the south edge.
  ctx.fillStyle = '#3d7a44';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  ctx.fillStyle = '#2f6b3a';
  for (const d of city.districts) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = d.tint;
    ctx.fillRect(d.x, d.y, d.w, d.h);
  }
  ctx.globalAlpha = 1;
  // Water.
  ctx.fillStyle = '#1f6fb2';
  ctx.fillRect(0, city.waterY, city.width, city.height - city.waterY);
  ctx.fillStyle = '#e8d8a0';
  ctx.fillRect(0, city.waterY - 14, city.width, 14);
  // Roads.
  ctx.fillStyle = '#33383f';
  for (const gx of city.roads.vertical) ctx.fillRect(gx - 48, 0, 96, city.height);
  for (const gy of city.roads.horizontal) ctx.fillRect(0, gy - 48, city.width, 96);
  ctx.strokeStyle = '#e8c33a';
  ctx.lineWidth = 3;
  ctx.setLineDash([24, 24]);
  for (const gx of city.roads.vertical) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, city.height); ctx.stroke();
  }
  for (const gy of city.roads.horizontal) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(city.width, gy); ctx.stroke();
  }
  ctx.setLineDash([]);
  // Parks.
  ctx.fillStyle = '#57a05a';
  for (const p of city.parks) ctx.fillRect(p.x, p.y, p.w, p.h);
  // Buildings with roof detail.
  for (const b of city.buildings) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(b.x + 5, b.y + 6, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 10);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
  // District labels on the map.
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  for (const d of city.districts) {
    ctx.fillText(d.name.toUpperCase(), d.x + d.w / 2, d.y + d.h / 2);
  }
  // Mission drops.
  for (const d of state.drops) {
    if (d.taken) continue;
    const pulse = 10 + Math.sin(state.time * 5) * 3;
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.arc(d.x, d.y, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5200';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('$', d.x, d.y + 4);
  }
  // Objective beacon.
  const target = missionTarget(state, city);
  if (target && state.started) {
    const pulse = 26 + Math.sin(state.time * 4) * 6;
    ctx.strokeStyle = '#ffd23d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(target.x, target.y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.moveTo(target.x, target.y - 34);
    ctx.lineTo(target.x - 10, target.y - 52);
    ctx.lineTo(target.x + 10, target.y - 52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(target.label || 'Objective', target.x, target.y - 60);
  }
  // Cars, pedestrians, bullets, player.
  for (const car of state.cars) drawCar(ctx, car, state.time);
  for (const ped of state.peds) {
    ctx.fillStyle = ped.color;
    ctx.beginPath();
    ctx.arc(ped.x, ped.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(ped.x + Math.cos(ped.angle) * 4, ped.y + Math.sin(ped.angle) * 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe94d';
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#ff5e7a';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(4, -7);
  ctx.lineTo(4, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore(); // camera

  drawHud(ctx, state, city);
  if (!state.started) drawStartScreen(ctx, state);
  if (state.busted) {
    ctx.save();
    ctx.fillStyle = 'rgba(120,10,10,0.55)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED!', VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
    ctx.font = '20px sans-serif';
    ctx.fillText('Press ENTER to keep playing', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 44);
    ctx.restore();
  }
  if (state.allMissionsDone) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,30,16,0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STORY COMPLETE', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 10);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`You finished all five missions with $${state.money} in pocket and $${state.stash} stashed.`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 34);
    ctx.restore();
  }
}

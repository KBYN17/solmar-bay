// Solmar Bay — configuration: every tunable number of the game in one place.
// Original open-world crime game. No third-party code, no network, no assets.
export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 2400;
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

export const PLAYER_WALK_SPEED = 230;
export const PLAYER_RUN_SPEED = 330;
export const CAR_TOP_SPEED = 520;
export const CAR_ACCEL = 420;
export const CAR_TURN = 3.1;
export const POLICE_TOP_SPEED = 470;
export const TRAFFIC_SPEED = 150;
export const PED_SPEED = 55;

export const WANTED_MAX = 5;
export const HEAT_PER_STAR = 20;
export const HEAT_DECAY_PER_SEC = 4;
export const STASH_DEPOSIT = 50;
export const BUST_FINE = 100;
export const START_MONEY = 200;
export const SAVE_KEY = 'solmar-bay-save-v1';
export const GAME_SEED = 1337;

export const DISTRICTS = [
  { name: 'Porto Verde', x: 0, y: 0, w: 800, h: 1200, tint: '#2e6b4f' },
  { name: 'Old Town', x: 800, y: 0, w: 800, h: 1200, tint: '#7a5a34' },
  { name: 'Neon Strip', x: 1600, y: 0, w: 800, h: 1200, tint: '#5b2a6e' },
  { name: 'University Hill', x: 2400, y: 0, w: 800, h: 1200, tint: '#33507a' },
  { name: 'Marina Bay', x: 0, y: 1200, w: 800, h: 1200, tint: '#1f6f7a' },
  { name: 'Palm Heights', x: 800, y: 1200, w: 800, h: 1200, tint: '#6e7a2a' },
  { name: 'Dockside', x: 1600, y: 1200, w: 800, h: 1200, tint: '#6e3a2a' },
  { name: 'Sunset Keys', x: 2400, y: 1200, w: 800, h: 1200, tint: '#a06a2e' },
];

export const ROAD_SPACING = 400;
export const ROAD_WIDTH = 96;
export const INTERACT_RADIUS = 70;
export const MISSION_REWARDS = [150, 250, 300, 400, 600];

export const CAR_COLORS = [
  '#d94f3d', '#3d7ad9', '#e8c33a', '#e8e8e8', '#2b2b2b',
  '#3dd94f', '#d93da8', '#8a5a2b', '#7ad9d3', '#c97ad9',
];
export const PED_COLORS = ['#f2c14e', '#7ec8e3', '#e38aa0', '#9be37e', '#d9d9d9', '#e08a3d'];

export const CONTROLS_TEXT = [
  'WASD / Arrows — move / drive',
  'E — interact / enter & exit car',
  'F — steal nearest car',
  'Mouse click — shoot',
  'B — deposit $50 to stash',
  'S — save   L — load   P — pause   M — mute',
];

// Solmar Bay — dossier program for make.fun gta6-01.
// Copies game/ and screenshots/ from this repository into the output
// directory and writes dossier.json with the kit's buildDossier library.
// Standard library only; runs on Node 22 with no install and no network.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(import.meta.dirname);
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) {
  throw new Error('game/ directory missing from the repository');
}
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  throw new Error('screenshots/ directory missing from the repository');
}
const shots = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}

// Never remove the output directory itself: the grader runs as an unprivileged user on a read-only filesystem, so only its contents are cleared.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`Solmar Bay dossier written: ${dossier.length} bytes to ${outDir}`);

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/KBYN17/solmar-bay/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/KBYN17/solmar-bay/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# Solmar Bay

An original open-world crime game in the spirit of GTA 6, built for the
[make.fun bounty gta6-01](https://make.fun/bounty/gta6-01)
("Make GTA 6"). It plays offline in a desktop browser from static files
under `game/` — no libraries, no network, no commercial assets. Every name,
district, character, vehicle and story beat is original.

## The city

Solmar Bay is a 3200×2400 sun-soaked coastal city with 8 districts —
Porto Verde, Old Town, Neon Strip, University Hill, Marina Bay,
Palm Heights, Dockside and Sunset Keys — joined by a road grid with traffic,
pedestrians, parks and a bay along the south edge.

## What you can do

- Explore on foot or steal and drive cars (press **F** near one).
- A wanted system (1–5 stars): the police chase you when the heat rises,
  and you can lose them until the stars fade.
- Five story missions in order: a package run (+$150), a car theft,
  losing the heat, three marina drops, and a final run to the Sunset Dock.
- Stash cash with **B** ($50 a deposit), save/load with **S**/**L**
  (localStorage), and fight back with mouse-click shooting.
- HUD with cash, stash, health, wanted stars, objective text and a live
  minimap; synthesized WebAudio sound (engine, sirens, jingles) with no
  sound files.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Or open `game/index.html` from any static
file server.

## Controls

WASD / arrows — move / drive · E — interact / enter & exit car ·
F — steal nearest car · Mouse click — shoot · B — stash $50 ·
S — save · L — load · P — pause · M — mute · Enter — start

## Layout

```
game/
  index.html        page + canvas
  src/
    main.js         game loop and controls
    world.js        state, save/load, stealing, stash
    city.js         districts, roads, buildings, places
    render.js       canvas drawing, HUD, minimap
    input.js        keyboard + mouse
    missions.js     the five story missions
    police.js       wanted system and police chases
    traffic.js      traffic cars, pedestrians, bullets
    audio.js        synthesized WebAudio sound
    random.js       seeded RNG
    config.js       tuning constants
    shots.js        screenshot scene setups
main.ts             dossier program (copies game/ + screenshots/, writes dossier.json)
serve.ts            static server for local play
shots.json          the four screenshot scenes
screenshots/       1-start, 2-drive, 3-chase, 4-mission
```

## License

MIT — see [LICENSE](LICENSE).

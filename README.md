# Growing Seeds

Growing Seeds is a lightweight browser prototype for a pass-and-play plant growth board game. It uses a single canvas, a compact hex-style board, randomized terrain, simple harvest scoring, and an in-game fullscreen toggle for quick playtesting on desktop or mobile.

## Files

- `index.html`
- `growing-seeds.js`
- `README.md`
- `LICENSE`

## How to Run

Open `index.html` in a browser.

Play online: <a href="https://ericop.github.io/growing-seeds/">Try the game yourself</a>

## How to Play

1. Choose 2 to 5 players from the title screen.
2. Choose either the Starter Set or Advanced Set, then draft 3 DNA modules per player.
3. Each player's first turn is spent placing their free seed hub.
4. On later turns, choose one action:
   - Plant Seed
   - Grow
   - Harvest
   - End Turn
5. Play continues for up to 10 rounds, or until the board is mostly full.

## Rule Book

- Starter Set is the default mode. It uses the 12 learning-friendly DNA modules every game.
- Advanced Set samples 12 modules from the full 24-module pool, then players draft from that shared menu.
- Each player drafts 3 DNA modules. Those modules define auto-growth, produce bonuses, interaction effects, and end-game scoring.
- The board now supports simplified vertical growth. Columns can hold multiple plant layers, with a normal height cap of 2 unless modules change it.
- Only the visible top hex in each column counts for most area scoring. Covered lower layers matter mainly for special DNA effects such as Shade Tolerant.
- End-game scoring is fast: 1 point per visible top hex, plus stored produce, plus DNA module bonuses.
- Turn flow is simple: start-turn effects, one main action, resolve DNA effects, then auto-growth up to a cap of 2 per turn.
- The prototype is tuned for a full playtest to land around 45 minutes.

## Rules Snapshot

- Seed hubs are the base of a player's plant network.
- Growth expands into adjacent columns and can also stack vertically.
- Extra seed hubs cost 2 produce and must connect to your existing plants.
- Rocky terrain costs 1 produce to grow into.
- Thorny terrain harvests for 0.
- Dry terrain cannot be grown into during drought rounds.
- Fertile terrain gives stronger harvests and gets even better during rain.
- Score is based on visible top hexes, stored produce, and DNA module bonuses.

## Controls

- Mouse or touch: interact with buttons and hexes
- `1`: select Plant Seed
- `2`: select Grow
- `3`: Harvest
- `4`: End Turn
- `F`: toggle fullscreen
- `R`: return to menu or restart from the end screen

## Mobile Notes

- In portrait, the game scales to full width.
- In landscape, it scales to fit the available viewport.
- The fullscreen icon appears in the top-right corner of the in-canvas UI.

## License

Released under the MIT License. See `LICENSE`.

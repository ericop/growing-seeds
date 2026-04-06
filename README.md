# Growing Seeds

Growing Seeds is a lightweight browser prototype for a pass-and-play plant growth board game. It uses a single canvas, a compact hex-style board, randomized terrain, simple harvest scoring, and an in-game fullscreen toggle for quick playtesting on desktop or mobile.

## Files

- `index.html`
- `growing-seeds.js`
- `README.md`
- `LICENSE`

## How to Run

Open `index.html` in a browser.

Try it yourself: [https://github.com/ericop/growing-seeds.git](https://github.com/ericop/growing-seeds.git)

## How to Play

1. Choose 2 to 5 players from the title screen.
2. Each player's first turn is spent placing their free seed hub.
3. On later turns, choose one action:
   - Plant Seed
   - Grow
   - Harvest
   - End Turn
4. Play continues for up to 10 rounds, or until the board is mostly full.

## Rules Snapshot

- Seed hubs are the base of a player's plant network.
- Growth must expand into an adjacent empty hex.
- Extra seed hubs cost 2 produce and must connect to your existing plants.
- Rocky terrain costs 1 produce to grow into.
- Thorny terrain harvests for 0.
- Dry terrain cannot be grown into during drought rounds.
- Fertile terrain gives stronger harvests and gets even better during rain.
- Score is based on controlled spaces, stored produce, and connected cluster bonuses.

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

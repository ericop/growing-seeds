const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const ASPECT = WIDTH / HEIGHT;

const BOARD = {
  cols: 9,
  rows: 6,
  size: 22,
  originX: 58,
  originY: 46,
};

const PANEL_X = 490;
const PANEL_W = 290;
const LEGEND_Y = 242;
const LEGEND_H = 22;
const MESSAGE_Y = 268;
const MESSAGE_H = 24;
const MAX_ROUNDS = 10;

const ACTIONS = {
  plant: "plant",
  grow: "grow",
  harvest: "harvest",
  end: "end",
};

const TERRAINS = {
  fertile: {
    label: "Fertile",
    fill: "#c6dc8b",
    edge: "#6f8e2d",
    harvest: 2,
    rule: "rich harvest",
  },
  rocky: {
    label: "Rocky",
    fill: "#c5b8aa",
    edge: "#7c6e62",
    harvest: 1,
    rule: "+1 produce to grow",
  },
  thorny: {
    label: "Thorny",
    fill: "#9db37b",
    edge: "#586c3c",
    harvest: 0,
    rule: "harvest 0",
  },
  dry: {
    label: "Dry",
    fill: "#dcc78f",
    edge: "#9a7d42",
    harvest: 1,
    rule: "drought blocks growth",
  },
};

const WEATHER = {
  calm: {
    label: "Calm",
    text: "No global pressure.",
  },
  rain: {
    label: "Rain",
    text: "Fertile harvests gain +1.",
  },
  drought: {
    label: "Drought",
    text: "Dry hexes cannot grow.",
  },
};

const PLAYER_COLORS = [
  "#2f8f4e",
  "#c6583e",
  "#3f74c8",
  "#d58a2e",
  "#8f56c9",
];

const AXIAL_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

const game = {
  screen: "menu",
  board: [],
  boardMap: new Map(),
  players: [],
  playerCount: 2,
  currentPlayer: 0,
  round: 1,
  weatherDeck: [],
  selectedAction: null,
  hoverCell: null,
  hoverButton: null,
  message: "Choose a player count to begin.",
  uiButtons: [],
  winnerText: "",
  lastAction: "",
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function weightedTerrain() {
  const roll = Math.random();
  if (roll < 0.32) return "fertile";
  if (roll < 0.54) return "rocky";
  if (roll < 0.76) return "thorny";
  return "dry";
}

function weatherForRound() {
  const roll = Math.random();
  if (roll < 0.5) return "calm";
  if (roll < 0.75) return "rain";
  return "drought";
}

function keyFor(q, r) {
  return `${q},${r}`;
}

function currentPlayer() {
  return game.players[game.currentPlayer];
}

function playerName(index) {
  return game.players[index].name;
}

function terrainData(cell) {
  return TERRAINS[cell.terrain];
}

function currentWeatherKey() {
  return game.weatherDeck[Math.min(game.round - 1, game.weatherDeck.length - 1)];
}

function currentWeather() {
  return WEATHER[currentWeatherKey()];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isFullscreenActive() {
  return document.fullscreenElement === canvas || document.webkitFullscreenElement === canvas;
}

function fullscreenSupported() {
  return Boolean(canvas.requestFullscreen || canvas.webkitRequestFullscreen);
}

function syncCanvasSize() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let cssWidth = Math.min(WIDTH, viewportWidth);
  let cssHeight = cssWidth / ASPECT;

  if (isFullscreenActive()) {
    if (viewportHeight >= viewportWidth) {
      cssWidth = viewportWidth;
      cssHeight = cssWidth / ASPECT;
    } else {
      const scale = Math.min(viewportWidth / WIDTH, viewportHeight / HEIGHT);
      cssWidth = WIDTH * scale;
      cssHeight = HEIGHT * scale;
    }
  }

  canvas.style.width = `${Math.floor(cssWidth)}px`;
  canvas.style.height = `${Math.floor(cssHeight)}px`;
}

function toggleFullscreen() {
  if (!fullscreenSupported()) {
    game.message = "Fullscreen is not available in this browser.";
    return;
  }

  if (isFullscreenActive()) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    return;
  }

  if (canvas.requestFullscreen) {
    try {
      const request = canvas.requestFullscreen({ navigationUI: "hide" });
      if (request && typeof request.catch === "function") {
        request.catch(() => {
          game.message = "Fullscreen was blocked by the browser.";
        });
      }
    } catch (error) {
      const fallback = canvas.requestFullscreen();
      if (fallback && typeof fallback.catch === "function") {
        fallback.catch(() => {
          game.message = "Fullscreen was blocked by the browser.";
        });
      }
    }
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  }
}

// ------------------------------------------------------------
// Board generation and hex math
// ------------------------------------------------------------

function axialToPixel(q, r) {
  const x = BOARD.originX + Math.sqrt(3) * BOARD.size * (q + r / 2);
  const y = BOARD.originY + 1.5 * BOARD.size * r;
  return { x, y };
}

function hexPoints(x, y, size) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = ((60 * i) - 30) * (Math.PI / 180);
    points.push({
      x: x + size * Math.cos(angle),
      y: y + size * Math.sin(angle),
    });
  }
  return points;
}

function pathHex(x, y, size) {
  const points = hexPoints(x, y, size);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.00001) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function buildBoard() {
  const cells = [];
  const map = new Map();

  for (let q = 0; q < BOARD.cols; q += 1) {
    for (let r = 0; r < BOARD.rows; r += 1) {
      const pixel = axialToPixel(q, r);
      const cell = {
        q,
        r,
        x: pixel.x,
        y: pixel.y,
        terrain: weightedTerrain(),
        owner: null,
        seed: false,
      };
      cells.push(cell);
      map.set(keyFor(q, r), cell);
    }
  }

  game.board = cells;
  game.boardMap = map;
}

function getCell(q, r) {
  return game.boardMap.get(keyFor(q, r)) || null;
}

function neighborsOf(cell) {
  return AXIAL_DIRECTIONS
    .map((dir) => getCell(cell.q + dir.q, cell.r + dir.r))
    .filter(Boolean);
}

function findCellAt(x, y) {
  for (const cell of game.board) {
    if (pointInPolygon({ x, y }, hexPoints(cell.x, cell.y, BOARD.size))) {
      return cell;
    }
  }
  return null;
}

// ------------------------------------------------------------
// Game setup and scoring
// ------------------------------------------------------------

function makePlayers(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    name: `Player ${index + 1}`,
    color: PLAYER_COLORS[index],
    produce: 0,
    score: 0,
  }));
}

function startGame(playerCount) {
  game.playerCount = playerCount;
  game.players = makePlayers(playerCount);
  game.currentPlayer = 0;
  game.round = 1;
  game.weatherDeck = Array.from({ length: MAX_ROUNDS }, () => weatherForRound());
  game.selectedAction = ACTIONS.plant;
  game.hoverCell = null;
  game.hoverButton = null;
  game.winnerText = "";
  game.lastAction = "";
  buildBoard();
  recomputeScores();
  game.screen = "play";
  game.message = "Player 1 begins. Place your first seed hub.";
}

function ownedCells(playerId) {
  return game.board.filter((cell) => cell.owner === playerId);
}

function hasPlants(playerId) {
  return ownedCells(playerId).length > 0;
}

function countFriendlyNeighbors(cell, playerId) {
  return neighborsOf(cell).filter((neighbor) => neighbor.owner === playerId).length;
}

function connectedComponents(playerId) {
  const cells = ownedCells(playerId);
  const remaining = new Set(cells.map((cell) => keyFor(cell.q, cell.r)));
  const components = [];

  while (remaining.size > 0) {
    const [firstKey] = remaining;
    const start = game.boardMap.get(firstKey);
    const stack = [start];
    const component = [];
    remaining.delete(firstKey);

    while (stack.length > 0) {
      const cell = stack.pop();
      component.push(cell);
      for (const neighbor of neighborsOf(cell)) {
        const neighborKey = keyFor(neighbor.q, neighbor.r);
        if (neighbor.owner === playerId && remaining.has(neighborKey)) {
          remaining.delete(neighborKey);
          stack.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

function clusterBonus(playerId) {
  return connectedComponents(playerId).reduce(
    (total, component) => total + (component.length >= 4 ? 2 : 0),
    0,
  );
}

function recomputeScores() {
  for (const player of game.players) {
    const area = ownedCells(player.id).length;
    player.score = area + player.produce + clusterBonus(player.id);
  }
}

function harvestValueForCell(cell) {
  const weather = currentWeatherKey();
  let value = terrainData(cell).harvest;
  if (cell.terrain === "fertile" && weather === "rain") {
    value += 1;
  }
  return value;
}

function harvestGain(playerId) {
  let gain = 0;
  for (const cell of ownedCells(playerId)) {
    const established = cell.seed || countFriendlyNeighbors(cell, playerId) > 0;
    if (!established) continue;
    gain += harvestValueForCell(cell);
    if (cell.seed) gain += 1;
  }
  return gain;
}

function occupiedRatio() {
  const occupied = game.board.filter((cell) => cell.owner !== null).length;
  return occupied / game.board.length;
}

function finishGame() {
  recomputeScores();
  const bestScore = Math.max(...game.players.map((player) => player.score));
  const winners = game.players.filter((player) => player.score === bestScore);
  game.winnerText = winners.length === 1
    ? `${winners[0].name} wins with ${bestScore} points.`
    : `Tie at ${bestScore}: ${winners.map((player) => player.name).join(", ")}.`;
  game.screen = "end";
  game.selectedAction = null;
  game.message = "Game over. Tap restart to grow another garden.";
}

// ------------------------------------------------------------
// Action logic
// ------------------------------------------------------------

function forcedSeedTurn(player) {
  return !hasPlants(player.id);
}

function canGrowInto(cell, player) {
  if (!cell || cell.owner !== null) return false;
  if (!hasPlants(player.id)) return false;
  if (!neighborsOf(cell).some((neighbor) => neighbor.owner === player.id)) return false;
  if (cell.terrain === "dry" && currentWeatherKey() === "drought") return false;
  if (cell.terrain === "rocky" && player.produce < 1) return false;
  return true;
}

function canPlantSeedOn(cell, player) {
  if (!cell || cell.owner !== null) return false;
  if (!hasPlants(player.id)) return true;
  if (player.produce < 2) return false;
  return neighborsOf(cell).some((neighbor) => neighbor.owner === player.id);
}

function validTargetsFor(action, player) {
  if (action === ACTIONS.plant) {
    return game.board.filter((cell) => canPlantSeedOn(cell, player));
  }
  if (action === ACTIONS.grow) {
    return game.board.filter((cell) => canGrowInto(cell, player));
  }
  return [];
}

function hasAnyTargets(action, player) {
  return validTargetsFor(action, player).length > 0;
}

function nextTurn() {
  if (occupiedRatio() >= 0.75) {
    finishGame();
    return;
  }

  game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
  if (game.currentPlayer === 0) {
    game.round += 1;
  }

  if (game.round > MAX_ROUNDS) {
    finishGame();
    return;
  }

  const player = currentPlayer();
  game.selectedAction = forcedSeedTurn(player) ? ACTIONS.plant : null;

  if (forcedSeedTurn(player)) {
    game.message = `${player.name}: place your first seed hub.`;
  } else {
    game.message = `${player.name}'s turn. Choose one action.`;
  }
}

function spendProduce(player, amount) {
  player.produce = clamp(player.produce - amount, 0, 999);
}

function plantSeed(cell) {
  const player = currentPlayer();
  const extraSeed = hasPlants(player.id);
  if (!canPlantSeedOn(cell, player)) return;
  if (extraSeed) spendProduce(player, 2);
  cell.owner = player.id;
  cell.seed = true;
  game.lastAction = extraSeed ? "extra seed hub" : "first seed hub";
  recomputeScores();
  nextTurn();
}

function growInto(cell) {
  const player = currentPlayer();
  if (!canGrowInto(cell, player)) return;
  if (cell.terrain === "rocky") {
    spendProduce(player, 1);
  }
  cell.owner = player.id;
  cell.seed = false;
  game.lastAction = `growth into ${TERRAINS[cell.terrain].label.toLowerCase()}`;
  recomputeScores();
  nextTurn();
}

function doHarvest() {
  const player = currentPlayer();
  const gain = harvestGain(player.id);
  player.produce += gain;
  game.lastAction = `harvested ${gain} produce`;
  recomputeScores();
  nextTurn();
}

function doEndTurn() {
  game.lastAction = "ended the turn";
  nextTurn();
}

// ------------------------------------------------------------
// UI state and input
// ------------------------------------------------------------

function makeButton(x, y, w, h, label, action, enabled = true, selected = false) {
  return { x, y, w, h, label, action, enabled, selected };
}

function buttonAt(x, y) {
  return game.uiButtons.find((button) => (
    x >= button.x
    && x <= button.x + button.w
    && y >= button.y
    && y <= button.y + button.h
  )) || null;
}

function refreshButtons() {
  const buttons = [];

  if (game.screen === "menu") {
    buttons.push(makeButton(752, 10, 28, 22, "", "fullscreen", fullscreenSupported()));
    const counts = [2, 3, 4, 5];
    counts.forEach((count, index) => {
      buttons.push(
        makeButton(168 + index * 112, 166, 92, 34, `${count} Players`, `menu:${count}`),
      );
    });
  }

  if (game.screen === "play") {
    const player = currentPlayer();
    const mustPlant = forcedSeedTurn(player);
    const canPlant = hasAnyTargets(ACTIONS.plant, player);
    const canGrow = hasAnyTargets(ACTIONS.grow, player);
    const canHarvest = hasPlants(player.id);

    buttons.push(makeButton(638, 10, 108, 22, "New Game", "menu"));
    buttons.push(makeButton(752, 10, 28, 22, "", "fullscreen", fullscreenSupported()));
    buttons.push(
      makeButton(
        PANEL_X + 10,
        192,
        132,
        24,
        mustPlant ? "Plant First Seed" : "Plant Seed",
        ACTIONS.plant,
        canPlant,
        game.selectedAction === ACTIONS.plant,
      ),
    );
    buttons.push(
      makeButton(
        PANEL_X + 148,
        192,
        132,
        24,
        "Grow",
        ACTIONS.grow,
        !mustPlant && canGrow,
        game.selectedAction === ACTIONS.grow,
      ),
    );
    buttons.push(
      makeButton(
        PANEL_X + 10,
        220,
        132,
        24,
        `Harvest (+${harvestGain(player.id)})`,
        ACTIONS.harvest,
        !mustPlant && canHarvest,
      ),
    );
    buttons.push(
      makeButton(
        PANEL_X + 148,
        220,
        132,
        24,
        "End Turn",
        ACTIONS.end,
        !mustPlant,
      ),
    );
  }

  if (game.screen === "end") {
    buttons.push(makeButton(752, 10, 28, 22, "", "fullscreen", fullscreenSupported()));
    buttons.push(makeButton(244, 190, 144, 34, "Restart", "restart"));
    buttons.push(makeButton(414, 190, 144, 34, "Menu", "menu"));
  }

  game.uiButtons = buttons;
}

function handleButton(button) {
  if (!button || !button.enabled) return;

  if (button.action.startsWith("menu:")) {
    startGame(Number(button.action.split(":")[1]));
    return;
  }

  if (button.action === "menu") {
    game.screen = "menu";
    game.selectedAction = null;
    game.message = "Choose a player count to begin.";
    refreshButtons();
    return;
  }

  if (button.action === "restart") {
    startGame(game.playerCount);
    return;
  }

  if (button.action === "fullscreen") {
    toggleFullscreen();
    return;
  }

  if (button.action === ACTIONS.harvest) {
    doHarvest();
    return;
  }

  if (button.action === ACTIONS.end) {
    doEndTurn();
    return;
  }

  if (button.action === ACTIONS.plant || button.action === ACTIONS.grow) {
    game.selectedAction = button.action;
    const helpText = button.action === ACTIONS.plant
      ? "Click a highlighted hex to place a seed hub."
      : "Click a highlighted hex to grow into it.";
    game.message = helpText;
  }
}

function handleCellClick(cell) {
  if (game.screen !== "play" || !cell) return;
  if (game.selectedAction === ACTIONS.plant) {
    plantSeed(cell);
    return;
  }
  if (game.selectedAction === ACTIONS.grow) {
    growInto(cell);
  }
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener("pointermove", (event) => {
  const point = canvasPoint(event);
  refreshButtons();
  const hoveredButton = buttonAt(point.x, point.y);
  game.hoverButton = hoveredButton ? hoveredButton.action : null;
  game.hoverCell = game.screen === "play" ? findCellAt(point.x, point.y) : null;
});

canvas.addEventListener("pointerleave", () => {
  game.hoverButton = null;
  game.hoverCell = null;
});

canvas.addEventListener("pointerdown", (event) => {
  const point = canvasPoint(event);
  refreshButtons();
  const button = buttonAt(point.x, point.y);
  if (button) {
    handleButton(button);
    refreshButtons();
    return;
  }

  if (game.screen === "play") {
    handleCellClick(findCellAt(point.x, point.y));
    refreshButtons();
  }
});

window.addEventListener("keydown", (event) => {
  if (game.screen !== "play") {
    if (game.screen === "menu" && ["2", "3", "4", "5"].includes(event.key)) {
      startGame(Number(event.key));
    }
    if (game.screen === "end" && event.key.toLowerCase() === "r") {
      startGame(game.playerCount);
    }
    return;
  }

  if (event.key === "1") game.selectedAction = ACTIONS.plant;
  if (event.key === "2") game.selectedAction = ACTIONS.grow;
  if (event.key === "3" && !forcedSeedTurn(currentPlayer())) doHarvest();
  if (event.key === "4" && !forcedSeedTurn(currentPlayer())) doEndTurn();
  if (event.key.toLowerCase() === "f") toggleFullscreen();
  if (event.key.toLowerCase() === "r") {
    game.screen = "menu";
    game.message = "Choose a player count to begin.";
  }
});

window.addEventListener("resize", syncCanvasSize);
window.addEventListener("orientationchange", syncCanvasSize);
document.addEventListener("fullscreenchange", syncCanvasSize);
document.addEventListener("webkitfullscreenchange", syncCanvasSize);

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#f6eedc");
  gradient.addColorStop(1, "#e2d0aa");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(122, 95, 54, 0.06)";
  for (let i = 0; i < 24; i += 1) {
    const x = (i * 71) % WIDTH;
    const y = (i * 37) % HEIGHT;
    ctx.beginPath();
    ctx.arc(x, y, 18 + (i % 4) * 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTerrainPattern(cell) {
  ctx.save();
  pathHex(cell.x, cell.y, BOARD.size - 1);
  ctx.clip();
  ctx.strokeStyle = "rgba(60, 45, 26, 0.2)";
  ctx.lineWidth = 1;

  if (cell.terrain === "rocky") {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(cell.x - 8 + i * 7, cell.y - 6 + (i % 2) * 7, 2 + (i % 2), 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (cell.terrain === "thorny") {
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cell.x - 10 + i * 4, cell.y + 7);
      ctx.lineTo(cell.x - 2 + i * 4, cell.y - 7);
      ctx.stroke();
    }
  } else if (cell.terrain === "dry") {
    ctx.beginPath();
    ctx.moveTo(cell.x - 9, cell.y + 2);
    ctx.lineTo(cell.x - 2, cell.y - 4);
    ctx.lineTo(cell.x + 4, cell.y + 1);
    ctx.lineTo(cell.x + 10, cell.y - 6);
    ctx.stroke();
  } else {
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(cell.x - 8 + i * 5, cell.y - 4 + (i % 2) * 7, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(92, 120, 44, 0.18)";
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBoard() {
  ctx.fillStyle = "rgba(255, 249, 236, 0.55)";
  ctx.fillRect(16, 16, 452, 220);

  const player = currentPlayer();
  const validTargets = new Set(
    (game.selectedAction ? validTargetsFor(game.selectedAction, player) : [])
      .map((cell) => keyFor(cell.q, cell.r)),
  );

  for (const cell of game.board) {
    const terrain = terrainData(cell);
    pathHex(cell.x, cell.y, BOARD.size);
    ctx.fillStyle = terrain.fill;
    ctx.fill();
    ctx.strokeStyle = terrain.edge;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawTerrainPattern(cell);

    if (validTargets.has(keyFor(cell.q, cell.r))) {
      pathHex(cell.x, cell.y, BOARD.size - 3);
      ctx.strokeStyle = "rgba(34, 95, 32, 0.7)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (cell.owner !== null) {
      const owner = game.players[cell.owner];
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.seed ? 11 : 8, 0, Math.PI * 2);
      ctx.fillStyle = owner.color;
      ctx.fill();

      if (cell.seed) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#fff9ee";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cell.x, cell.y + 6);
        ctx.quadraticCurveTo(cell.x - 5, cell.y - 4, cell.x - 1, cell.y - 10);
        ctx.quadraticCurveTo(cell.x + 3, cell.y - 6, cell.x + 5, cell.y - 2);
        ctx.strokeStyle = "#fff9ee";
        ctx.lineWidth = 1.7;
        ctx.stroke();
      }
    }
  }

  if (game.hoverCell) {
    pathHex(game.hoverCell.x, game.hoverCell.y, BOARD.size + 1);
    ctx.strokeStyle = "rgba(48, 34, 18, 0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawText(text, x, y, size, color, align = "left", weight = "600") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawButton(button) {
  const hovered = game.hoverButton === button.action;
  const fill = !button.enabled
    ? "#d6ccbb"
    : button.selected
      ? "#4f7f37"
      : hovered
        ? "#ead69a"
        : "#f5ecd2";
  const edge = !button.enabled ? "#a89b86" : button.selected ? "#355b23" : "#7d6a46";

  ctx.fillStyle = fill;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.fillRect(button.x, button.y, button.w, button.h);
  ctx.strokeRect(button.x, button.y, button.w, button.h);

  if (button.action === "fullscreen") {
    drawFullscreenIcon(button, button.enabled, hovered);
    return;
  }

  drawText(
    button.label,
    button.x + button.w / 2,
    button.y + button.h / 2,
    13,
    button.enabled ? (button.selected ? "#f8f4e6" : "#3d2c17") : "#7d7262",
    "center",
    "700",
  );
}

function drawFullscreenIcon(button, enabled, hovered) {
  const iconColor = enabled ? "#3d2c17" : "#7d7262";
  const pad = hovered ? 5 : 6;
  const left = button.x + pad;
  const right = button.x + button.w - pad;
  const top = button.y + pad;
  const bottom = button.y + button.h - pad;
  const inset = 4;

  ctx.strokeStyle = iconColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left + inset, top);
  ctx.lineTo(left, top);
  ctx.lineTo(left, top + inset);

  ctx.moveTo(right - inset, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, top + inset);

  ctx.moveTo(left, bottom - inset);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left + inset, bottom);

  ctx.moveTo(right - inset, bottom);
  ctx.lineTo(right, bottom);
  ctx.lineTo(right, bottom - inset);
  ctx.stroke();
}

function drawScorePanel() {
  ctx.fillStyle = "rgba(255, 250, 239, 0.92)";
  ctx.fillRect(PANEL_X, 16, PANEL_W, 236);
  ctx.strokeStyle = "#b79e74";
  ctx.lineWidth = 2;
  ctx.strokeRect(PANEL_X, 16, PANEL_W, 236);

  drawText("Growing Seeds", PANEL_X + 12, 32, 21, "#3a2b18", "left", "700");
  drawText(`Round ${game.round}/${MAX_ROUNDS}`, PANEL_X + 12, 56, 13, "#5e4b2b");
  drawText(`Weather: ${currentWeather().label}`, PANEL_X + 154, 56, 13, "#5e4b2b");
  drawText(currentWeather().text, PANEL_X + 12, 72, 11, "#6d5a3d", "left", "500");

  ctx.fillStyle = "rgba(68, 123, 42, 0.12)";
  ctx.fillRect(PANEL_X + 10, 82, 270, 48);
  drawText(`Current: ${currentPlayer().name}`, PANEL_X + 16, 96, 14, currentPlayer().color);
  drawText(
    game.lastAction ? `Last action: ${game.lastAction}` : "First seed is free. Extra hubs cost 2 produce.",
    PANEL_X + 16,
    114,
    11,
    "#5b4a30",
    "left",
    "500",
  );

  game.players.forEach((player, index) => {
    const y = 126 + index * 13;
    ctx.fillStyle = player.color;
    ctx.fillRect(PANEL_X + 10, y - 5, 10, 10);
    drawText(
      `${player.name}: ${player.produce} produce, ${player.score} score`,
      PANEL_X + 26,
      y,
      10,
      "#40301d",
      "left",
      "600",
    );
  });

  drawText("Score = spaces + produce + cluster bonus", PANEL_X + 12, 184, 10, "#6c5839", "left", "500");
}

function drawLegendStrip() {
  ctx.fillStyle = "rgba(255, 247, 230, 0.9)";
  ctx.fillRect(0, LEGEND_Y, WIDTH, LEGEND_H);
  ctx.strokeStyle = "#b89d73";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, LEGEND_Y, WIDTH, LEGEND_H);

  drawText("Terrain", 10, LEGEND_Y + LEGEND_H / 2, 11, "#4a371e");

  const legend = [
    ["fertile", "+2 harvest"],
    ["rocky", "grow costs 1"],
    ["thorny", "harvest 0"],
    ["dry", "blocked in drought"],
  ];

  legend.forEach((entry, index) => {
    const terrain = TERRAINS[entry[0]];
    const x = 88 + index * 176;
    const y = LEGEND_Y + LEGEND_H / 2;
    ctx.fillStyle = terrain.fill;
    ctx.fillRect(x, y - 5, 10, 10);
    ctx.strokeStyle = terrain.edge;
    ctx.strokeRect(x, y - 5, 10, 10);
    drawText(entry[1], x + 15, y, 10, "#4d3c27", "left", "500");
  });
}

function drawMessageBar() {
  ctx.fillStyle = "rgba(57, 44, 25, 0.9)";
  ctx.fillRect(0, MESSAGE_Y, WIDTH, MESSAGE_H);
  drawText(game.message, 12, MESSAGE_Y + MESSAGE_H / 2, 12, "#f7f0df", "left", "600");

  if (game.hoverCell && game.screen === "play") {
    const cell = game.hoverCell;
    const owner = cell.owner === null ? "empty" : playerName(cell.owner);
    const seedText = cell.seed ? ", seed hub" : "";
    const info = `${TERRAINS[cell.terrain].label} | ${owner}${seedText}`;
    drawText(info, WIDTH - 12, MESSAGE_Y + MESSAGE_H / 2, 12, "#f7f0df", "right", "500");
  }
}

function drawMenu() {
  drawBackground();
  drawText("Growing Seeds", WIDTH / 2, 72, 34, "#3c2b1a", "center", "700");
  drawText("A prototype of plant growth, soil pressure, and shared board control.", WIDTH / 2, 104, 14, "#5c4a31", "center", "500");
  drawText("Choose 2 to 5 players", WIDTH / 2, 142, 18, "#4d6f28", "center", "700");

  for (const button of game.uiButtons) {
    drawButton(button);
  }

  drawText("Rules snapshot", 160, 236, 13, "#4a371e");
  drawText("1. First turn: plant your free seed hub.", 160, 254, 11, "#5d4a2f", "left", "500");
  drawText("2. Later hubs cost 2 produce and must touch your growth.", 160, 270, 11, "#5d4a2f", "left", "500");
  drawText("3. Grow to adjacent hexes, harvest for produce, score from space + produce.", 160, 286, 11, "#5d4a2f", "left", "500");
  drawText("Tap the corner icon for fullscreen.", 644, 236, 11, "#5d4a2f", "center", "500");
}

function drawEndScreen() {
  drawBackground();
  drawBoard();
  drawScorePanel();
  drawLegendStrip();

  ctx.fillStyle = "rgba(30, 22, 14, 0.76)";
  ctx.fillRect(130, 48, 540, 182);
  ctx.strokeStyle = "#efe2bf";
  ctx.lineWidth = 2;
  ctx.strokeRect(130, 48, 540, 182);

  drawText("Harvest Complete", WIDTH / 2, 84, 28, "#f7efdb", "center", "700");
  drawText(game.winnerText, WIDTH / 2, 118, 16, "#f2d889", "center", "700");

  game.players.forEach((player, index) => {
    const y = 146 + index * 16;
    drawText(
      `${player.name}: ${player.score} score, ${player.produce} produce`,
      WIDTH / 2,
      y,
      13,
      player.color,
      "center",
      "700",
    );
  });

  game.uiButtons.forEach(drawButton);
}

function drawPlay() {
  drawBackground();
  drawBoard();
  drawScorePanel();
  drawLegendStrip();
  game.uiButtons.forEach(drawButton);
  drawMessageBar();
}

function render() {
  refreshButtons();

  if (game.screen === "menu") {
    drawMenu();
  } else if (game.screen === "play") {
    drawPlay();
  } else {
    drawEndScreen();
    drawMessageBar();
  }

  requestAnimationFrame(render);
}

refreshButtons();
syncCanvasSize();
render();

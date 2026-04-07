const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let nameEditor = null;

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const ASPECT = WIDTH / HEIGHT;
const MAX_ROUNDS = 10;
const AUTO_GROWTH_LIMIT = 2;
const PLAYER_NAME_STORAGE_KEY = "growing-seeds-player-names";

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
const NAME_EDITOR_ROWS = 5;
const MAX_PLAYER_NAME_LENGTH = 20;
const NAME_ROW_X = 170;
const NAME_ROW_Y = 72;
const NAME_ROW_W = 460;
const NAME_ROW_H = 26;
const NAME_INPUT_X = 274;
const NAME_INPUT_W = 344;
const NAME_INPUT_Y_INSET = 2;
const NAME_INPUT_H = 22;

const ACTIONS = {
  plant: "plant",
  grow: "grow",
  harvest: "harvest",
  end: "end",
};

const GAME_MODES = {
  starter: "starter",
  advanced: "advanced",
};

const MODULE_TYPE_COLORS = {
  growth: "#5f8d39",
  production: "#8a5f2d",
  sunlight: "#d4a332",
  interaction: "#7a4f85",
};

const TERRAINS = {
  fertile: { label: "Fertile", fill: "#c6dc8b", edge: "#6f8e2d", harvest: 2 },
  rocky: { label: "Rocky", fill: "#c5b8aa", edge: "#7c6e62", harvest: 1 },
  thorny: { label: "Thorny", fill: "#9db37b", edge: "#586c3c", harvest: 0 },
  dry: { label: "Dry", fill: "#dcc78f", edge: "#9a7d42", harvest: 1 },
};

const WEATHER = {
  calm: { label: "Calm", text: "No global pressure." },
  rain: { label: "Rain", text: "Fertile harvests gain +1." },
  drought: { label: "Drought", text: "Dry columns cannot grow." },
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

const DIAGONAL_PREFERRED_DIRECTIONS = [
  { q: 1, r: -1 },
  { q: -1, r: 1 },
];

const MODULES = {
  northSurge: {
    id: "northSurge",
    name: "North Surge",
    type: "growth",
    short: "Auto-grow north at turn end.",
    detail: "At the end of your turn, auto-grow 1 hex north from one of your eligible plant hexes if possible.",
  },
  branchSplitter: {
    id: "branchSplitter",
    name: "Branch Splitter",
    type: "growth",
    short: "Manual grow may hit 2 targets.",
    detail: "When you take a manual grow action, you may grow into up to 2 legal adjacent hexes instead of 1.",
  },
  creepingCarpet: {
    id: "creepingCarpet",
    name: "Creeping Carpet",
    type: "growth",
    short: "Max height 1; grow gets +1 horizontal spread.",
    detail: "Your plant stays at height 1. Whenever you take a grow action, you may make 1 extra horizontal growth if legal.",
  },
  tallStalk: {
    id: "tallStalk",
    name: "Tall Stalk",
    type: "sunlight",
    short: "Raise max height to 4.",
    detail: "Your plant may grow vertically up to height 4 instead of the default maximum height.",
  },
  diagonalBloom: {
    id: "diagonalBloom",
    name: "Diagonal Bloom",
    type: "growth",
    short: "Every other turn, auto-grow on angled lanes.",
    detail: "Every other turn, after your normal action, auto-grow 1 diagonal-like neighboring hex if legal.",
  },
  doubleSeedPod: {
    id: "doubleSeedPod",
    name: "Double Seed Pod",
    type: "production",
    short: "Double harvest rewards.",
    detail: "Whenever you harvest produce, gain double the normal produce reward from that harvest action.",
  },
  nutrientHoarder: {
    id: "nutrientHoarder",
    name: "Nutrient Hoarder",
    type: "production",
    short: "+1 harvest per 3 connected visible hexes.",
    detail: "Gain +1 produce for every 3 connected visible hexes you control, rounded down, when you harvest.",
  },
  earlySprouter: {
    id: "earlySprouter",
    name: "Early Sprouter",
    type: "production",
    short: "First 2 turns get +1 grow step.",
    detail: "During your first 2 turns, your grow actions gain +1 bonus growth.",
  },
  steadyGrowth: {
    id: "steadyGrowth",
    name: "Steady Growth",
    type: "production",
    short: "+1 produce at the start of each turn.",
    detail: "Gain +1 produce at the start of each of your turns.",
  },
  sunCollector: {
    id: "sunCollector",
    name: "Sun Collector",
    type: "sunlight",
    short: "Visible top hexes score +1 more.",
    detail: "Each of your visible topmost hexes is worth +1 extra victory point at end game.",
  },
  skyBloom: {
    id: "skyBloom",
    name: "Sky Bloom",
    type: "sunlight",
    short: "Height 3+ hexes make produce.",
    detail: "Each of your hexes at height 3 or more gives +1 produce at the end of your turn.",
  },
  thornBarrier: {
    id: "thornBarrier",
    name: "Thorn Barrier",
    type: "interaction",
    short: "Adjacent enemy growth costs +1.",
    detail: "Opponents must spend 1 extra produce to grow into a hex adjacent to one of your plant hexes.",
  },
  southSurge: {
    id: "southSurge",
    name: "South Surge",
    type: "growth",
    short: "Auto-grow south at turn end.",
    detail: "At the end of your turn, auto-grow 1 hex south from one of your existing eligible plant hexes if possible.",
  },
  sunwardClimb: {
    id: "sunwardClimb",
    name: "Sunward Climb",
    type: "growth",
    short: "Auto-growth prefers vertical columns.",
    detail: "If you have a legal choice between horizontal growth and vertical growth during auto-growth, prefer vertical growth first.",
  },
  spiralBloom: {
    id: "spiralBloom",
    name: "Spiral Bloom",
    type: "growth",
    short: "Auto-grow using rotating direction priority.",
    detail: "At the end of your turn, auto-grow 1 hex in a rotating clockwise direction priority if legal.",
  },
  windDrift: {
    id: "windDrift",
    name: "Wind Drift",
    type: "growth",
    short: "50% chance to auto-grow randomly.",
    detail: "At the end of your turn, there is a 50% chance to auto-grow into a random legal adjacent hex.",
  },
  efficientRoots: {
    id: "efficientRoots",
    name: "Efficient Roots",
    type: "production",
    short: "Every 2 turns, store +1 bonus grow step.",
    detail: "Every 2 turns, gain 1 extra bonus growth step for a future grow action.",
  },
  overproducer: {
    id: "overproducer",
    name: "Overproducer",
    type: "production",
    short: "Every 3rd turn, gain visible-column produce.",
    detail: "Every 3rd turn, gain bonus produce equal to floor(your visible hex count divided by 3).",
  },
  sporeBurst: {
    id: "sporeBurst",
    name: "Spore Burst",
    type: "production",
    short: "Harvest triggers 1 extra auto-grow.",
    detail: "Whenever you harvest, auto-grow 1 legal adjacent hex if possible.",
  },
  seedVault: {
    id: "seedVault",
    name: "Seed Vault",
    type: "production",
    short: "Every 2 produce scores +1 at game end.",
    detail: "At end game, every 2 unspent produce grants +1 victory point.",
  },
  shadeTolerant: {
    id: "shadeTolerant",
    name: "Shade Tolerant",
    type: "sunlight",
    short: "Covered hexes still score a little.",
    detail: "Covered lower-height hexes still matter: score +1 point per 2 covered hexes at end game.",
  },
  canopyDominance: {
    id: "canopyDominance",
    name: "Canopy Dominance",
    type: "sunlight",
    short: "Top columns over rivals score bonus points.",
    detail: "If one of your hexes is above an opponent in the same column, gain +1 end-game point for that column.",
  },
  symbiosis: {
    id: "symbiosis",
    name: "Symbiosis",
    type: "interaction",
    short: "Shared borders help harvests.",
    detail: "For each of your hexes adjacent to an opponent hex, both sides benefit during harvest, capped for readability.",
  },
  allelopathy: {
    id: "allelopathy",
    name: "Allelopathy",
    type: "interaction",
    short: "Adjacent enemy harvests lose 1.",
    detail: "Opponent hexes adjacent to your hexes produce 1 less produce during harvest, minimum 0.",
  },
};

const STARTER_MODULE_IDS = [
  "northSurge",
  "branchSplitter",
  "creepingCarpet",
  "tallStalk",
  "diagonalBloom",
  "doubleSeedPod",
  "nutrientHoarder",
  "earlySprouter",
  "steadyGrowth",
  "sunCollector",
  "skyBloom",
  "thornBarrier",
];

const ADVANCED_EXTRA_MODULE_IDS = [
  "southSurge",
  "sunwardClimb",
  "spiralBloom",
  "windDrift",
  "efficientRoots",
  "overproducer",
  "sporeBurst",
  "seedVault",
  "shadeTolerant",
  "canopyDominance",
  "symbiosis",
  "allelopathy",
];

const ADVANCED_POOL_IDS = STARTER_MODULE_IDS.concat(ADVANCED_EXTRA_MODULE_IDS);

function defaultPlayerNames() {
  return Array.from({ length: NAME_EDITOR_ROWS }, (_, index) => `Player ${index + 1}`);
}

function loadSavedPlayerNames() {
  const defaults = defaultPlayerNames();

  try {
    const raw = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;

    return defaults.map((fallback, index) => {
      const candidate = typeof parsed[index] === "string" ? parsed[index].trim() : "";
      return candidate || fallback;
    });
  } catch (error) {
    return defaults;
  }
}

function savePlayerNamesToStorage(names) {
  try {
    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, JSON.stringify(names));
  } catch (error) {
    // Keep the editor functional even if local storage is unavailable.
  }
}

const game = {
  screen: "menu",
  playerCount: 2,
  gameMode: GAME_MODES.starter,
  savedPlayerNames: loadSavedPlayerNames(),
  nameEditorNames: [],
  editingNameIndex: -1,
  showScores: false,
  board: [],
  boardMap: new Map(),
  players: [],
  availableModules: [],
  currentPlayer: 0,
  round: 1,
  weatherDeck: [],
  selectedAction: null,
  hoverCell: null,
  hoverButton: null,
  hoverModuleId: null,
  uiButtons: [],
  message: "Choose a player count and DNA set.",
  lastAction: "",
  winnerText: "",
  finalBreakdowns: [],
  draftIndex: 0,
  nextUnitId: 1,
  passPrompt: {
    active: false,
    playerId: 0,
  },
  exitPrompt: {
    active: false,
  },
  turnState: {
    mainAction: null,
    growRemaining: 0,
    growSpent: 0,
  },
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

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const clone = [...list];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function keyFor(q, r) {
  return `${q},${r}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function currentPlayer() {
  return game.players[game.currentPlayer];
}

function currentWeatherKey() {
  return game.weatherDeck[Math.min(game.round - 1, game.weatherDeck.length - 1)];
}

function currentWeather() {
  return WEATHER[currentWeatherKey()];
}

function playerName(index) {
  return game.players[index].name;
}

function moduleDef(moduleId) {
  return MODULES[moduleId];
}

function hasModule(player, moduleId) {
  return player.modules.includes(moduleId);
}

function terrainData(cell) {
  return TERRAINS[cell.terrain];
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

function isFullscreenActive() {
  return Boolean(fullscreenElement());
}

function fullscreenSupported() {
  const target = document.documentElement;
  return Boolean(
    target.requestFullscreen
    || target.webkitRequestFullscreen
    || target.msRequestFullscreen,
  );
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

async function toggleFullscreen() {
  if (!fullscreenSupported()) {
    game.message = "Fullscreen is not available in this browser.";
    return;
  }

  try {
    if (fullscreenElement()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }

      if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        return;
      }

      if (document.msExitFullscreen) {
        document.msExitFullscreen();
        return;
      }

      game.message = "Fullscreen exit is not available in this browser.";
      return;
    }

    const target = document.documentElement;
    if (target.requestFullscreen) {
      await target.requestFullscreen();
      return;
    }

    if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
      return;
    }

    if (target.msRequestFullscreen) {
      target.msRequestFullscreen();
      return;
    }

    game.message = "Fullscreen is not available in this browser.";
  } catch (error) {
    game.message = "Fullscreen toggle failed.";
  }
}

function playerNameRowCanvasRect(index) {
  return {
    x: NAME_ROW_X,
    y: NAME_ROW_Y + index * 32,
    w: NAME_ROW_W,
    h: NAME_ROW_H,
  };
}

function playerNameInputCanvasRect(index) {
  const row = playerNameRowCanvasRect(index);
  return {
    x: NAME_INPUT_X,
    y: row.y + NAME_INPUT_Y_INSET,
    w: NAME_INPUT_W,
    h: NAME_INPUT_H,
  };
}

function canvasRectToScreenRect(rect) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = bounds.width / canvas.width;
  const scaleY = bounds.height / canvas.height;

  return {
    left: bounds.left + rect.x * scaleX,
    top: bounds.top + rect.y * scaleY,
    width: rect.w * scaleX,
    height: rect.h * scaleY,
  };
}

function playerNameInputScreenRect(index) {
  return canvasRectToScreenRect(playerNameInputCanvasRect(index));
}

function persistEditedPlayerNames() {
  const defaults = defaultPlayerNames();
  game.savedPlayerNames = defaults.map((fallback, index) => {
    const value = (game.nameEditorNames[index] || "").trim();
    return value || fallback;
  });
  savePlayerNamesToStorage(game.savedPlayerNames);
}

function createNameEditor() {
  if (nameEditor) return nameEditor;

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "text";
  input.maxLength = MAX_PLAYER_NAME_LENGTH;
  input.autocomplete = "off";
  input.autocorrect = "off";
  input.autocapitalize = "words";
  input.spellcheck = false;
  input.enterKeyHint = "done";
  input.setAttribute("enterkeyhint", "done");
  input.setAttribute("aria-label", "Player name");
  Object.assign(input.style, {
    position: "fixed",
    display: "none",
    margin: "0",
    boxSizing: "border-box",
    zIndex: "10",
    border: "2px solid #4f7f37",
    borderRadius: "2px",
    background: "rgba(255, 252, 244, 0.98)",
    color: "#3d2c17",
    caretColor: "#3d2c17",
    outline: "none",
    boxShadow: "0 1px 4px rgba(61, 44, 23, 0.16)",
  });
  document.body.appendChild(input);

  nameEditor = {
    input,
    activePlayerIndex: -1,
    suppressBlurCommit: false,
  };

  input.addEventListener("input", () => {
    if (nameEditor.activePlayerIndex < 0) return;

    const nextValue = input.value.slice(0, MAX_PLAYER_NAME_LENGTH);
    if (input.value !== nextValue) input.value = nextValue;
    game.nameEditorNames[nameEditor.activePlayerIndex] = nextValue;
  });

  input.addEventListener("keydown", (event) => {
    if (nameEditor.activePlayerIndex < 0) return;

    if (event.key === "Enter") {
      event.preventDefault();
      commitPlayerName();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelPlayerName();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const nextIndex = (nameEditor.activePlayerIndex + (event.shiftKey ? NAME_EDITOR_ROWS - 1 : 1)) % NAME_EDITOR_ROWS;
      commitPlayerName({ shouldBlur: false });
      beginEditingPlayerName(nextIndex, playerNameInputScreenRect(nextIndex), game.nameEditorNames[nextIndex] || "");
    }
  });

  input.addEventListener("blur", () => {
    if (nameEditor.suppressBlurCommit) {
      nameEditor.suppressBlurCommit = false;
      return;
    }

    commitPlayerName({ shouldBlur: false });
  });

  return nameEditor;
}

function positionNameEditor(screenRect) {
  if (!nameEditor) return;

  const { input } = nameEditor;
  const fontSize = Math.max(12, Math.floor(screenRect.height * 0.56));
  const horizontalPadding = Math.max(8, Math.floor(screenRect.height * 0.36));

  Object.assign(input.style, {
    display: "block",
    left: `${Math.round(screenRect.left)}px`,
    top: `${Math.round(screenRect.top)}px`,
    width: `${Math.round(screenRect.width)}px`,
    height: `${Math.round(screenRect.height)}px`,
    padding: `0 ${horizontalPadding}px`,
    font: `600 ${fontSize}px "Trebuchet MS", sans-serif`,
  });
}

function hideNameEditor(shouldBlur = true) {
  if (!nameEditor) return;

  const { input } = nameEditor;
  nameEditor.activePlayerIndex = -1;
  game.editingNameIndex = -1;
  input.style.display = "none";

  if (shouldBlur && document.activeElement === input) {
    nameEditor.suppressBlurCommit = true;
    input.blur();
  }
}

function beginEditingPlayerName(playerIndex, screenRect, initialValue) {
  const editor = createNameEditor();
  const nextIndex = clamp(playerIndex, 0, NAME_EDITOR_ROWS - 1);

  if (editor.activePlayerIndex !== -1 && editor.activePlayerIndex !== nextIndex) {
    commitPlayerName({ shouldBlur: false });
  }

  editor.activePlayerIndex = nextIndex;
  game.editingNameIndex = nextIndex;
  editor.input.value = (initialValue || "").slice(0, MAX_PLAYER_NAME_LENGTH);
  game.nameEditorNames[nextIndex] = editor.input.value;

  // A canvas surface cannot reliably summon the mobile keyboard by itself.
  // This one real overlay input is the intentional cross-platform editing surface.
  positionNameEditor(screenRect);

  try {
    editor.input.focus({ preventScroll: true });
  } catch (error) {
    editor.input.focus();
  }

  if (typeof editor.input.setSelectionRange === "function") {
    const caret = editor.input.value.length;
    editor.input.setSelectionRange(caret, caret);
  }

  game.message = `Editing ${game.savedPlayerNames[nextIndex] || `Player ${nextIndex + 1}`}. Tap outside or press Enter when you're done.`;
}

function commitPlayerName(options = {}) {
  if (!nameEditor || nameEditor.activePlayerIndex < 0) return;

  const { shouldBlur = true } = options;
  const index = nameEditor.activePlayerIndex;
  const nextValue = nameEditor.input.value.slice(0, MAX_PLAYER_NAME_LENGTH);
  game.nameEditorNames[index] = nextValue;
  nameEditor.input.value = nextValue;
  persistEditedPlayerNames();
  hideNameEditor(shouldBlur);
  game.message = "Player names saved to local storage.";
}

function cancelPlayerName(options = {}) {
  if (!nameEditor || nameEditor.activePlayerIndex < 0) return;

  const { shouldBlur = true } = options;
  const index = nameEditor.activePlayerIndex;
  game.nameEditorNames[index] = game.savedPlayerNames[index] || defaultPlayerNames()[index];
  hideNameEditor(shouldBlur);
  game.message = "Name edit canceled.";
}

function saveEditedPlayerNames() {
  if (nameEditor && nameEditor.activePlayerIndex >= 0) {
    const index = nameEditor.activePlayerIndex;
    game.nameEditorNames[index] = nameEditor.input.value.slice(0, MAX_PLAYER_NAME_LENGTH);
    hideNameEditor(true);
  }

  persistEditedPlayerNames();
  game.screen = "menu";
  game.nameEditorNames = [];
  game.message = "Player names saved to local storage.";
}

function cancelEditedPlayerNames() {
  if (nameEditor && nameEditor.activePlayerIndex >= 0) {
    cancelPlayerName();
  }

  game.screen = "menu";
  game.nameEditorNames = [];
  game.editingNameIndex = -1;
  game.message = "Player names unchanged.";
}

function syncNameEditorOverlay() {
  if (!nameEditor || nameEditor.activePlayerIndex < 0) return;

  if (game.screen !== "names") {
    hideNameEditor(true);
    return;
  }

  positionNameEditor(playerNameInputScreenRect(nameEditor.activePlayerIndex));
}

function sortByBoardOrder(cells) {
  return [...cells].sort((a, b) => (a.r - b.r) || (a.q - b.q));
}

// ------------------------------------------------------------
// Board and column helpers
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
        occupants: [],
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

function getTopOccupant(cell) {
  if (cell.occupants.length === 0) return null;
  return cell.occupants.reduce((top, unit) => (unit.height > top.height ? unit : top), cell.occupants[0]);
}

function getUnitsForPlayer(cell, playerId) {
  return cell.occupants.filter((unit) => unit.ownerId === playerId);
}

function getTopUnitForPlayer(cell, playerId) {
  const units = getUnitsForPlayer(cell, playerId);
  if (units.length === 0) return null;
  return units.reduce((top, unit) => (unit.height > top.height ? unit : top), units[0]);
}

function columnHasPlayer(cell, playerId) {
  return cell.occupants.some((unit) => unit.ownerId === playerId);
}

function nextHeightInCell(cell) {
  const top = getTopOccupant(cell);
  return top ? top.height + 1 : 1;
}

function getVisibleCells(playerId) {
  return game.board.filter((cell) => {
    const top = getTopOccupant(cell);
    return top && top.ownerId === playerId;
  });
}

function getVisibleHexCount(playerId) {
  return getVisibleCells(playerId).length;
}

function getAllUnitsForPlayer(playerId) {
  return game.board.flatMap((cell) => cell.occupants.filter((unit) => unit.ownerId === playerId));
}

function getCoveredUnitCount(playerId) {
  let total = 0;
  for (const cell of game.board) {
    const top = getTopOccupant(cell);
    total += cell.occupants.filter((unit) => unit.ownerId === playerId && unit !== top).length;
  }
  return total;
}

function countColumnsWithOpponentBelow(playerId) {
  let total = 0;
  for (const cell of game.board) {
    const top = getTopOccupant(cell);
    if (!top || top.ownerId !== playerId) continue;
    if (cell.occupants.some((unit) => unit.ownerId !== playerId && unit.height < top.height)) {
      total += 1;
    }
  }
  return total;
}

function occupiedColumnRatio() {
  const occupied = game.board.filter((cell) => cell.occupants.length > 0).length;
  return occupied / game.board.length;
}

function getPlayerSeeds(playerId) {
  return getAllUnitsForPlayer(playerId).filter((unit) => unit.seed);
}

function hasAnyPlant(playerId) {
  return getAllUnitsForPlayer(playerId).length > 0;
}

function forcedSeedTurn(player) {
  return getPlayerSeeds(player.id).length === 0;
}

function getMaxHeightForPlayer(player) {
  if (hasModule(player, "creepingCarpet")) return 1;
  if (hasModule(player, "tallStalk")) return 4;
  return 2;
}

function getSupportingSeedId(player, cell) {
  const here = getTopUnitForPlayer(cell, player.id);
  if (here) return here.seedId;

  const neighborUnits = neighborsOf(cell)
    .map((neighbor) => getTopUnitForPlayer(neighbor, player.id))
    .filter(Boolean)
    .sort((a, b) => b.height - a.height);
  if (neighborUnits.length > 0) return neighborUnits[0].seedId;

  const seed = getPlayerSeeds(player.id)[0];
  return seed ? seed.seedId : `${player.id}-root`;
}

function componentSizesForVisibleCells(playerId) {
  const visibleKeys = new Set(getVisibleCells(playerId).map((cell) => keyFor(cell.q, cell.r)));
  const sizes = [];

  while (visibleKeys.size > 0) {
    const [firstKey] = visibleKeys;
    const start = game.boardMap.get(firstKey);
    const stack = [start];
    let size = 0;
    visibleKeys.delete(firstKey);

    while (stack.length > 0) {
      const cell = stack.pop();
      size += 1;
      for (const neighbor of neighborsOf(cell)) {
        const neighborKey = keyFor(neighbor.q, neighbor.r);
        if (visibleKeys.has(neighborKey)) {
          visibleKeys.delete(neighborKey);
          stack.push(neighbor);
        }
      }
    }

    sizes.push(size);
  }

  return sizes;
}

function countAdjacentVisibleOpponentCells(playerId) {
  return getVisibleCells(playerId).filter((cell) => (
    neighborsOf(cell).some((neighbor) => {
      const top = getTopOccupant(neighbor);
      return top && top.ownerId !== playerId;
    })
  )).length;
}

function opponentsAdjacentToPlayer(playerId) {
  const adjacent = new Set();
  for (const cell of getVisibleCells(playerId)) {
    for (const neighbor of neighborsOf(cell)) {
      const top = getTopOccupant(neighbor);
      if (top && top.ownerId !== playerId) {
        adjacent.add(top.ownerId);
      }
    }
  }
  return [...adjacent];
}

// ------------------------------------------------------------
// Growth and harvest rules
// ------------------------------------------------------------

function harvestValueForCell(cell) {
  let value = terrainData(cell).harvest;
  if (cell.terrain === "fertile" && currentWeatherKey() === "rain") {
    value += 1;
  }
  return value;
}

function hasAdjacentThornBarrier(cell, playerId) {
  return neighborsOf(cell).some((neighbor) => (
    neighbor.occupants.some((unit) => (
      unit.ownerId !== playerId && hasModule(game.players[unit.ownerId], "thornBarrier")
    ))
  ));
}

function hasAdjacentAllelopathy(cell, playerId) {
  return neighborsOf(cell).some((neighbor) => (
    neighbor.occupants.some((unit) => (
      unit.ownerId !== playerId && hasModule(game.players[unit.ownerId], "allelopathy")
    ))
  ));
}

function getGrowthCost(player, cell) {
  let cost = 0;
  if (cell.terrain === "rocky") {
    cost += 1;
  }
  if (hasAdjacentThornBarrier(cell, player.id)) {
    cost += 1;
  }
  return cost;
}

function isLegalGrowthTarget(player, cell, options = {}) {
  if (!cell) return false;
  if (cell.terrain === "dry" && currentWeatherKey() === "drought") return false;

  const hasOwnHere = columnHasPlayer(cell, player.id);
  const hasAdjacentSupport = neighborsOf(cell).some((neighbor) => columnHasPlayer(neighbor, player.id));

  if (!(hasOwnHere || hasAdjacentSupport)) return false;
  if (options.verticalOnly && !hasOwnHere) return false;
  if (options.requireAdjacent && !hasAdjacentSupport) return false;
  if (options.horizontalOnly && cell.occupants.length > 0) return false;

  const newHeight = nextHeightInCell(cell);
  if (newHeight > getMaxHeightForPlayer(player)) return false;

  const cost = getGrowthCost(player, cell);
  if (!options.free && player.produce < cost) return false;

  return true;
}

function getLegalGrowTargets(player, options = {}) {
  return game.board.filter((cell) => isLegalGrowthTarget(player, cell, options));
}

function spendProduce(player, amount) {
  player.produce = clamp(player.produce - amount, 0, 999);
}

function addUnitToCell(player, cell, seed = false) {
  const newHeight = nextHeightInCell(cell);
  const unit = {
    id: game.nextUnitId,
    ownerId: player.id,
    height: newHeight,
    seed,
    seedId: seed ? `${player.id}-${player.nextSeedId}` : getSupportingSeedId(player, cell),
  };

  game.nextUnitId += 1;
  if (seed) {
    player.nextSeedId += 1;
  }

  cell.occupants.push(unit);
  cell.occupants.sort((a, b) => a.height - b.height || a.id - b.id);
  player.lastGrowthKey = keyFor(cell.q, cell.r);
  return unit;
}

function canPlantSeedOn(cell, player) {
  if (!cell || cell.occupants.length > 0) return false;
  if (!hasAnyPlant(player.id)) return true;
  if (player.produce < 2) return false;
  return neighborsOf(cell).some((neighbor) => columnHasPlayer(neighbor, player.id));
}

function placeSeedInCell(player, cell) {
  if (!canPlantSeedOn(cell, player)) return false;
  const extraSeed = hasAnyPlant(player.id);
  if (extraSeed) {
    spendProduce(player, 2);
  }
  addUnitToCell(player, cell, true);
  game.lastAction = extraSeed ? "Planted an extra seed hub." : "Planted the first seed hub.";
  return true;
}

function growIntoCell(player, cell, reason = "growth", options = {}) {
  if (!isLegalGrowthTarget(player, cell, options)) return false;
  if (!options.free) {
    spendProduce(player, getGrowthCost(player, cell));
  }
  const unit = addUnitToCell(player, cell, false);
  game.lastAction = `${reason} into ${terrainData(cell).label.toLowerCase()} at height ${unit.height}.`;
  return true;
}

function calculateManualGrowPlan(player) {
  let steps = 1;
  const notes = [];

  if (hasModule(player, "branchSplitter")) {
    steps += 1;
    notes.push("Branch Splitter");
  }
  if (hasModule(player, "creepingCarpet")) {
    steps += 1;
    notes.push("Creeping Carpet");
  }
  if (hasModule(player, "earlySprouter") && player.turnsTaken <= 2) {
    steps += 1;
    notes.push("Early Sprouter");
  }
  if (player.bonusGrowSteps > 0) {
    steps += player.bonusGrowSteps;
    notes.push(`Efficient Roots +${player.bonusGrowSteps}`);
  }

  return { steps, notes };
}

function beginGrowAction() {
  const player = currentPlayer();
  const preview = calculateManualGrowPlan(player);
  const targets = getLegalGrowTargets(player);

  if (targets.length === 0) {
    game.message = `${player.name} has no legal growth targets right now.`;
    return;
  }

  game.turnState.mainAction = ACTIONS.grow;
  game.turnState.growRemaining = preview.steps;
  game.turnState.growSpent = 0;
  game.selectedAction = ACTIONS.grow;

  if (player.bonusGrowSteps > 0) {
    player.bonusGrowSteps = 0;
  }

  const sourceText = preview.notes.length > 0 ? ` Bonuses: ${preview.notes.join(", ")}.` : "";
  game.message = `Grow action: click up to ${preview.steps} legal target${preview.steps === 1 ? "" : "s"}. Press End Turn to stop early.${sourceText}`;
}

function finishGrowActionEarly() {
  if (game.turnState.mainAction !== ACTIONS.grow || game.turnState.growSpent === 0) return false;
  finishMainAction({ type: ACTIONS.grow, count: game.turnState.growSpent });
  return true;
}

function harvestAction(player) {
  const visibleCells = getVisibleCells(player.id);
  let base = 0;

  for (const cell of visibleCells) {
    const top = getTopOccupant(cell);
    let value = harvestValueForCell(cell);
    if (top.seed) value += 1;
    if (hasAdjacentAllelopathy(cell, player.id)) {
      value = Math.max(0, value - 1);
    }
    base += value;
  }

  let bonus = 0;
  const notes = [];

  if (hasModule(player, "nutrientHoarder")) {
    const nutrient = componentSizesForVisibleCells(player.id)
      .reduce((sum, size) => sum + Math.floor(size / 3), 0);
    if (nutrient > 0) {
      bonus += nutrient;
      notes.push(`Nutrient Hoarder +${nutrient}`);
    }
  }

  if (hasModule(player, "symbiosis")) {
    const friendlyAdjacencies = countAdjacentVisibleOpponentCells(player.id);
    const selfBonus = Math.min(3, friendlyAdjacencies);
    if (selfBonus > 0) {
      bonus += selfBonus;
      notes.push(`Symbiosis +${selfBonus}`);
    }
    for (const opponentId of opponentsAdjacentToPlayer(player.id)) {
      game.players[opponentId].produce += 1;
    }
  }

  let total = base + bonus;

  if (hasModule(player, "doubleSeedPod")) {
    total *= 2;
    notes.push("Double Seed Pod doubled harvest");
  }

  player.produce += total;
  return {
    base,
    bonus,
    total,
    notes,
  };
}

function tryVerticalAutoGrowth(player) {
  const columns = sortByBoardOrder(
    game.board.filter((cell) => isLegalGrowthTarget(player, cell, { verticalOnly: true })),
  ).sort((a, b) => {
    const aTop = getTopUnitForPlayer(a, player.id);
    const bTop = getTopUnitForPlayer(b, player.id);
    return (bTop ? bTop.height : 0) - (aTop ? aTop.height : 0);
  });

  if (columns.length === 0) return null;
  const target = columns[0];
  growIntoCell(player, target, "Sunward Climb", {});
  return `${MODULES.sunwardClimb.name} raised ${player.name}'s stack.`;
}

function resolveDirectionalAutoGrowth(player, directions, label) {
  const sourceCells = sortByBoardOrder(game.board.filter((cell) => columnHasPlayer(cell, player.id)));

  for (const source of sourceCells) {
    for (const dir of directions) {
      const target = getCell(source.q + dir.q, source.r + dir.r);
      if (target && isLegalGrowthTarget(player, target, { requireAdjacent: true })) {
        growIntoCell(player, target, label, {});
        return `${label} spread into ${terrainData(target).label.toLowerCase()}.`;
      }
    }
  }

  return null;
}

function resolveSpiralAutoGrowth(player) {
  const sourceCells = sortByBoardOrder(game.board.filter((cell) => columnHasPlayer(cell, player.id)));

  for (let offset = 0; offset < AXIAL_DIRECTIONS.length; offset += 1) {
    const directionIndex = (player.spiralIndex + offset) % AXIAL_DIRECTIONS.length;
    const dir = AXIAL_DIRECTIONS[directionIndex];
    for (const source of sourceCells) {
      const target = getCell(source.q + dir.q, source.r + dir.r);
      if (target && isLegalGrowthTarget(player, target, { requireAdjacent: true })) {
        player.spiralIndex = (directionIndex + 1) % AXIAL_DIRECTIONS.length;
        growIntoCell(player, target, "Spiral Bloom", {});
        return "Spiral Bloom rotated into a new column.";
      }
    }
  }

  player.spiralIndex = (player.spiralIndex + 1) % AXIAL_DIRECTIONS.length;
  return null;
}

function resolveWindDrift(player) {
  if (Math.random() >= 0.5) return null;
  const targets = getLegalGrowTargets(player, { requireAdjacent: true })
    .filter((cell) => !columnHasPlayer(cell, player.id) || cell.occupants.length === 0);
  if (targets.length === 0) return null;
  const target = randomChoice(targets);
  growIntoCell(player, target, "Wind Drift", {});
  return `Wind Drift scattered growth into ${terrainData(target).label.toLowerCase()}.`;
}

function resolveSingleAutoGrowth(player, moduleId) {
  if (hasModule(player, "sunwardClimb")) {
    const vertical = tryVerticalAutoGrowth(player);
    if (vertical) return vertical;
  }

  if (moduleId === "northSurge") {
    return resolveDirectionalAutoGrowth(player, [{ q: 0, r: -1 }], "North Surge");
  }
  if (moduleId === "southSurge") {
    return resolveDirectionalAutoGrowth(player, [{ q: 0, r: 1 }], "South Surge");
  }
  if (moduleId === "diagonalBloom") {
    if (player.turnsTaken % 2 !== 0) return null;
    return resolveDirectionalAutoGrowth(player, DIAGONAL_PREFERRED_DIRECTIONS, "Diagonal Bloom");
  }
  if (moduleId === "spiralBloom") {
    return resolveSpiralAutoGrowth(player);
  }
  if (moduleId === "windDrift") {
    return resolveWindDrift(player);
  }
  if (moduleId === "sporeBurst") {
    const targets = getLegalGrowTargets(player, { requireAdjacent: true });
    if (targets.length === 0) return null;
    const target = sortByBoardOrder(targets)[0];
    growIntoCell(player, target, "Spore Burst", {});
    return "Spore Burst carried a new growth outward.";
  }

  return null;
}

function resolveEndTurnEffects(player, actionContext) {
  const notes = [];
  let autoGrowths = 0;

  const autoOrder = ["sporeBurst", "northSurge", "southSurge", "diagonalBloom", "spiralBloom", "windDrift"];
  for (const moduleId of autoOrder) {
    if (autoGrowths >= AUTO_GROWTH_LIMIT) break;
    if (!hasModule(player, moduleId)) continue;
    if (moduleId === "sporeBurst" && actionContext.type !== ACTIONS.harvest) continue;

    const result = resolveSingleAutoGrowth(player, moduleId);
    if (result) {
      autoGrowths += 1;
      notes.push(result);
    }
  }

  if (hasModule(player, "skyBloom")) {
    const bloomBonus = getAllUnitsForPlayer(player.id)
      .filter((unit) => unit.height >= 3)
      .length;
    if (bloomBonus > 0) {
      player.produce += bloomBonus;
      notes.push(`Sky Bloom +${bloomBonus} produce`);
    }
  }

  return notes;
}

// ------------------------------------------------------------
// Scoring
// ------------------------------------------------------------

function getEndgameBonusBreakdown(player) {
  const visible = getVisibleHexCount(player.id);
  const breakdown = [];

  if (hasModule(player, "sunCollector")) {
    breakdown.push({ label: "Sun Collector", value: visible });
  }
  if (hasModule(player, "seedVault")) {
    breakdown.push({ label: "Seed Vault", value: Math.floor(player.produce / 2) });
  }
  if (hasModule(player, "shadeTolerant")) {
    breakdown.push({ label: "Shade Tolerant", value: Math.floor(getCoveredUnitCount(player.id) / 2) });
  }
  if (hasModule(player, "canopyDominance")) {
    breakdown.push({ label: "Canopy Dominance", value: countColumnsWithOpponentBelow(player.id) });
  }

  const total = breakdown.reduce((sum, item) => sum + item.value, 0);
  return { total, breakdown };
}

function recomputeScores() {
  for (const player of game.players) {
    const visible = getVisibleHexCount(player.id);
    const moduleBonus = getEndgameBonusBreakdown(player).total;
    player.score = visible + player.produce + moduleBonus;
  }
}

function finishGame() {
  recomputeScores();
  game.finalBreakdowns = game.players.map((player) => {
    const visible = getVisibleHexCount(player.id);
    const produce = player.produce;
    const moduleBonus = getEndgameBonusBreakdown(player);
    const total = visible + produce + moduleBonus.total;
    return {
      playerId: player.id,
      visible,
      produce,
      moduleBonus: moduleBonus.total,
      moduleLines: moduleBonus.breakdown,
      total,
    };
  });

  const best = Math.max(...game.finalBreakdowns.map((item) => item.total));
  const winners = game.finalBreakdowns.filter((item) => item.total === best);
  game.winnerText = winners.length === 1
    ? `${playerName(winners[0].playerId)} wins with ${best} points.`
    : `Tie at ${best}: ${winners.map((item) => playerName(item.playerId)).join(", ")}.`;

  game.screen = "end";
  game.selectedAction = null;
  game.turnState = { mainAction: null, growRemaining: 0, growSpent: 0 };
  game.message = "Game over. Review the final canopy and start again when ready.";
}

// ------------------------------------------------------------
// Setup and turn flow
// ------------------------------------------------------------

function makePlayers(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    name: game.savedPlayerNames[index] || `Player ${index + 1}`,
    color: PLAYER_COLORS[index],
    produce: 0,
    score: 0,
    modules: [],
    turnsTaken: 0,
    bonusGrowSteps: 0,
    nextSeedId: 1,
    spiralIndex: 0,
    lastGrowthKey: null,
  }));
}

function createAvailableModules(mode) {
  if (mode === GAME_MODES.starter) {
    return [...STARTER_MODULE_IDS];
  }
  return shuffle(ADVANCED_POOL_IDS).slice(0, 12);
}

function beginDraft() {
  game.players = makePlayers(game.playerCount);
  game.availableModules = createAvailableModules(game.gameMode);
  game.currentPlayer = 0;
  game.draftIndex = 0;
  game.hoverCell = null;
  game.hoverModuleId = null;
  game.winnerText = "";
  game.finalBreakdowns = [];
  game.screen = "draft";
  game.exitPrompt.active = false;
  game.passPrompt = {
    active: true,
    playerId: game.currentPlayer,
  };
  game.message = `${currentPlayer().name}, pass the device and press OK to begin drafting.`;
}

function startGameFromDraft() {
  game.currentPlayer = 0;
  game.round = 1;
  game.weatherDeck = Array.from({ length: MAX_ROUNDS }, () => weatherForRound());
  game.selectedAction = null;
  game.hoverCell = null;
  game.hoverModuleId = null;
  game.lastAction = "DNA draft complete.";
  game.nextUnitId = 1;
  game.exitPrompt.active = false;
  game.passPrompt = {
    active: false,
    playerId: 0,
  };
  buildBoard();
  game.screen = "play";
  prepareTurn(currentPlayer());
}

function draftModule(moduleId) {
  const player = currentPlayer();
  if (player.modules.length >= 3) return;
  player.modules.push(moduleId);
  game.draftIndex += 1;

  if (game.draftIndex >= game.playerCount * 3) {
    startGameFromDraft();
    return;
  }

  game.currentPlayer = game.draftIndex % game.playerCount;
  game.passPrompt = {
    active: true,
    playerId: game.currentPlayer,
  };
  game.message = `${currentPlayer().name}, pass the device and press OK for the next draft pick.`;
}

function prepareTurn(player) {
  player.turnsTaken += 1;
  game.turnState = {
    mainAction: null,
    growRemaining: 0,
    growSpent: 0,
  };

  const notes = [];

  if (hasModule(player, "steadyGrowth")) {
    player.produce += 1;
    notes.push("Steady Growth +1 produce");
  }

  if (hasModule(player, "efficientRoots") && player.turnsTaken % 2 === 0) {
    player.bonusGrowSteps += 1;
    notes.push("Efficient Roots stored +1 grow step");
  }

  if (hasModule(player, "overproducer") && player.turnsTaken % 3 === 0) {
    const bonus = Math.floor(getVisibleHexCount(player.id) / 3);
    if (bonus > 0) {
      player.produce += bonus;
      notes.push(`Overproducer +${bonus} produce`);
    }
  }

  game.selectedAction = forcedSeedTurn(player) ? ACTIONS.plant : null;
  game.passPrompt = {
    active: true,
    playerId: player.id,
  };
  recomputeScores();

  const base = forcedSeedTurn(player)
    ? `${player.name}: place your first seed hub.`
    : `${player.name}'s turn. Choose one main action.`;
  game.message = notes.length > 0 ? `${base} Start effects: ${notes.join("; ")}.` : base;
}

function advanceTurn() {
  if (occupiedColumnRatio() >= 0.75) {
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

  prepareTurn(currentPlayer());
}

function finishMainAction(actionContext) {
  const player = currentPlayer();
  const endNotes = resolveEndTurnEffects(player, actionContext);

  if (actionContext.type === ACTIONS.grow) {
    game.lastAction = `Manual grow resolved ${actionContext.count} time${actionContext.count === 1 ? "" : "s"}.`;
  } else if (actionContext.type === ACTIONS.harvest) {
    game.lastAction = `Harvested ${actionContext.summary.total} produce.`;
  } else if (actionContext.type === ACTIONS.end) {
    game.lastAction = "Ended the turn.";
  }

  if (endNotes.length > 0) {
    game.lastAction += ` DNA: ${endNotes.join(" ")}`;
  }

  recomputeScores();
  advanceTurn();
}

// ------------------------------------------------------------
// UI state and input
// ------------------------------------------------------------

function makeButton(x, y, w, h, label, action, enabled = true, selected = false, note = "") {
  return { x, y, w, h, label, action, enabled, selected, note };
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
  const fullButton = makeButton(752, 10, 28, 22, "", "fullscreen", fullscreenSupported());

  if (game.screen === "menu") {
    buttons.push(fullButton);
    buttons.push(makeButton(164, 118, 146, 32, "Starter Set", "mode:starter", true, game.gameMode === GAME_MODES.starter, "simple"));
    buttons.push(makeButton(326, 118, 146, 32, "Advanced Set", "mode:advanced", true, game.gameMode === GAME_MODES.advanced, "draft 12/24"));

    [2, 3, 4, 5].forEach((count, index) => {
      buttons.push(makeButton(182 + index * 108, 174, 88, 34, `${count} Players`, `players:${count}`, true, game.playerCount === count));
    });

    buttons.push(makeButton(614, 174, 148, 34, "Change Names", "openNames"));
    buttons.push(makeButton(300, 222, 200, 38, "Begin DNA Draft", "beginDraft"));
  }

  if (game.screen === "names") {
    buttons.push(fullButton);
    for (let index = 0; index < NAME_EDITOR_ROWS; index += 1) {
      buttons.push(makeButton(NAME_ROW_X, NAME_ROW_Y + index * 32, NAME_ROW_W, NAME_ROW_H, game.nameEditorNames[index] || "", `nameField:${index}`, true, game.editingNameIndex === index));
    }
    buttons.push(makeButton(172, 244, 140, 32, "Back", "cancelNames"));
    buttons.push(makeButton(330, 244, 140, 32, "Reset", "resetNames"));
    buttons.push(makeButton(488, 244, 140, 32, "Save Names", "saveNames"));
  }

  if (game.screen === "draft") {
    buttons.push(makeButton(638, 10, 108, 22, "Main Menu", "openExitPrompt"));
    buttons.push(fullButton);

    if (game.exitPrompt.active) {
      buttons.push(makeButton(252, 160, 140, 32, "Yes, exit", "confirmExit"));
      buttons.push(makeButton(408, 160, 140, 32, "No, resume game", "cancelExit"));
    } else if (game.passPrompt.active) {
      buttons.push(makeButton(330, 152, 140, 34, "OK", "handoffOk"));
    } else {
      const columns = 3;
      game.availableModules.forEach((moduleId, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const definition = moduleDef(moduleId);
        buttons.push(
          makeButton(
            20 + col * 152,
            70 + row * 42,
            144,
            36,
            definition.name,
            `draft:${moduleId}`,
            true,
            false,
            definition.type,
          ),
        );
      });
    }
  }

  if (game.screen === "play") {
    const player = currentPlayer();
    const mustPlant = forcedSeedTurn(player);
    const canPlant = game.board.some((cell) => canPlantSeedOn(cell, player));
    const canGrow = getLegalGrowTargets(player).length > 0;
    const canHarvest = getVisibleHexCount(player.id) > 0;
    const growPreview = calculateManualGrowPlan(player);

    if (game.exitPrompt.active) {
      buttons.push(makeButton(16, 10, 82, 22, game.showScores ? "V Score" : "> Score", "toggleScores"));
      buttons.push(makeButton(638, 10, 108, 22, "Main Menu", "openExitPrompt"));
      buttons.push(fullButton);
      buttons.push(makeButton(252, 160, 140, 32, "Yes, exit", "confirmExit"));
      buttons.push(makeButton(408, 160, 140, 32, "No, resume game", "cancelExit"));
    } else if (game.passPrompt.active) {
      buttons.push(makeButton(16, 10, 82, 22, game.showScores ? "V Score" : "> Score", "toggleScores"));
      buttons.push(makeButton(638, 10, 108, 22, "Main Menu", "openExitPrompt"));
      buttons.push(fullButton);
      buttons.push(makeButton(330, 152, 140, 34, "OK", "handoffOk"));
    } else {
      buttons.push(makeButton(638, 10, 108, 22, "Main Menu", "openExitPrompt"));
      buttons.push(makeButton(16, 10, 82, 22, game.showScores ? "V Score" : "> Score", "toggleScores"));
      buttons.push(fullButton);
      buttons.push(makeButton(PANEL_X + 10, 194, 132, 22, mustPlant ? "Plant First Seed" : "Plant Seed", ACTIONS.plant, canPlant, game.selectedAction === ACTIONS.plant));
      buttons.push(makeButton(PANEL_X + 148, 194, 132, 22, `Grow x${growPreview.steps}`, ACTIONS.grow, !mustPlant && canGrow, game.selectedAction === ACTIONS.grow));
      buttons.push(makeButton(PANEL_X + 10, 220, 132, 22, "Harvest", ACTIONS.harvest, !mustPlant && canHarvest));
      buttons.push(makeButton(PANEL_X + 148, 220, 132, 22, game.turnState.mainAction === ACTIONS.grow && game.turnState.growSpent > 0 ? "Finish Grow" : "End Turn", ACTIONS.end, !mustPlant || (game.turnState.mainAction === ACTIONS.grow && game.turnState.growSpent > 0)));
    }
  }

  if (game.screen === "end") {
    buttons.push(fullButton);
    buttons.push(makeButton(244, 206, 144, 34, "Restart", "restart"));
    buttons.push(makeButton(414, 206, 144, 34, "Main Menu", "menu"));
  }

  game.uiButtons = buttons;
}

function handleButton(button) {
  if (!button || !button.enabled) return;

  if (button.action === "fullscreen") {
    toggleFullscreen();
    return;
  }

  if (button.action === "openExitPrompt") {
    game.exitPrompt.active = true;
    game.message = "Exit confirmation opened.";
    return;
  }

  if (button.action === "cancelExit") {
    game.exitPrompt.active = false;
    game.message = game.screen === "draft"
      ? `${currentPlayer().name}: draft module ${currentPlayer().modules.length + 1} of 3.`
      : `${currentPlayer().name}'s game is still in progress.`;
    return;
  }

  if (button.action === "confirmExit") {
    game.exitPrompt.active = false;
    game.passPrompt.active = false;
    game.screen = "menu";
    game.selectedAction = null;
    game.players = [];
    game.availableModules = [];
    game.hoverCell = null;
    game.hoverModuleId = null;
    game.message = "Choose a player count and DNA set.";
    return;
  }

  if (button.action === "toggleScores") {
    game.showScores = !game.showScores;
    game.message = game.showScores
      ? "Player scores are shown above the board."
      : "Player scores are hidden to keep the board clear.";
    return;
  }

  if (button.action === "handoffOk") {
    game.passPrompt.active = false;
    if (game.screen === "draft") {
      game.message = `${currentPlayer().name}: draft module ${currentPlayer().modules.length + 1} of 3.`;
    } else {
      game.message = forcedSeedTurn(currentPlayer())
        ? `${currentPlayer().name}: place your first seed hub.`
        : `${currentPlayer().name}'s turn. Choose one main action.`;
    }
    return;
  }

  if (button.action === "menu") {
    game.screen = "menu";
    game.selectedAction = null;
    game.players = [];
    game.availableModules = [];
    game.hoverCell = null;
    game.hoverModuleId = null;
    game.message = "Choose a player count and DNA set.";
    return;
  }

  if (button.action === "openNames") {
    game.screen = "names";
    game.nameEditorNames = [...game.savedPlayerNames];
    game.editingNameIndex = -1;
    if (nameEditor) hideNameEditor(true);
    game.message = "Tap a player row to edit its name, then tap outside when you're done.";
    return;
  }

  if (button.action === "cancelNames") {
    cancelEditedPlayerNames();
    return;
  }

  if (button.action === "resetNames") {
    game.nameEditorNames = defaultPlayerNames();
    if (nameEditor) hideNameEditor(true);
    game.message = "Names reset to the default player labels.";
    return;
  }

  if (button.action === "saveNames") {
    saveEditedPlayerNames();
    return;
  }

  if (button.action.startsWith("nameField:")) {
    const playerIndex = Number(button.action.split(":")[1]);
    beginEditingPlayerName(playerIndex, playerNameInputScreenRect(playerIndex), game.nameEditorNames[playerIndex] || "");
    return;
  }

  if (button.action === "restart") {
    beginDraft();
    return;
  }

  if (button.action.startsWith("mode:")) {
    game.gameMode = button.action.split(":")[1];
    game.message = game.gameMode === GAME_MODES.starter
      ? "Starter Set selected. All 12 starter modules will be available."
      : "Advanced Set selected. 12 modules will be sampled from the 24-module pool.";
    return;
  }

  if (button.action.startsWith("players:")) {
    game.playerCount = Number(button.action.split(":")[1]);
    game.message = `${game.playerCount} players selected.`;
    return;
  }

  if (button.action === "beginDraft") {
    beginDraft();
    return;
  }

  if (button.action.startsWith("draft:")) {
    draftModule(button.action.split(":")[1]);
    return;
  }

  if (game.screen !== "play") return;

  const player = currentPlayer();

  if (game.passPrompt.active) {
    game.message = `${currentPlayer().name}, pass the device and press OK when ready.`;
    return;
  }

  if (game.turnState.mainAction === ACTIONS.grow && game.turnState.growSpent > 0 && button.action !== ACTIONS.end) {
    game.message = "Finish the current grow action before choosing something else.";
    return;
  }

  if (button.action === ACTIONS.plant) {
    game.selectedAction = ACTIONS.plant;
    game.turnState.mainAction = ACTIONS.plant;
    game.message = hasAnyPlant(player.id)
      ? "Click an empty adjacent column to place a seed hub for 2 produce."
      : "Click any empty column to place your first seed hub.";
    return;
  }

  if (button.action === ACTIONS.grow) {
    beginGrowAction();
    return;
  }

  if (button.action === ACTIONS.harvest) {
    const summary = harvestAction(player);
    finishMainAction({ type: ACTIONS.harvest, summary });
    return;
  }

  if (button.action === ACTIONS.end) {
    if (finishGrowActionEarly()) return;
    finishMainAction({ type: ACTIONS.end });
  }
}

function handlePlayCellClick(cell) {
  if (game.exitPrompt.active) return;
  if (game.passPrompt.active) return;
  if (!cell) return;
  const player = currentPlayer();

  if (game.selectedAction === ACTIONS.plant) {
    if (placeSeedInCell(player, cell)) {
      recomputeScores();
      finishMainAction({ type: ACTIONS.plant });
    } else {
      game.message = "That seed placement is not legal.";
    }
    return;
  }

  if (game.selectedAction === ACTIONS.grow && game.turnState.mainAction === ACTIONS.grow) {
    if (!growIntoCell(player, cell, "Manual growth", {})) {
      game.message = "That growth target is not legal or costs more produce than you have.";
      return;
    }

    game.turnState.growRemaining -= 1;
    game.turnState.growSpent += 1;
    recomputeScores();

    const moreTargets = getLegalGrowTargets(player).length > 0;
    if (game.turnState.growRemaining > 0 && moreTargets) {
      game.message = `${player.name} grew. ${game.turnState.growRemaining} growth step${game.turnState.growRemaining === 1 ? "" : "s"} left. Click again or press Finish Grow.`;
      return;
    }

    finishMainAction({ type: ACTIONS.grow, count: game.turnState.growSpent });
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
  game.hoverModuleId = hoveredButton && !game.passPrompt.active && !game.exitPrompt.active && hoveredButton.action.startsWith("draft:")
    ? hoveredButton.action.split(":")[1]
    : null;
  game.hoverCell = game.screen === "play" && !game.passPrompt.active && !game.exitPrompt.active ? findCellAt(point.x, point.y) : null;
});

canvas.addEventListener("pointerleave", () => {
  game.hoverButton = null;
  game.hoverCell = null;
  game.hoverModuleId = null;
});

canvas.addEventListener("pointerdown", (event) => {
  const point = canvasPoint(event);
  refreshButtons();
  const button = buttonAt(point.x, point.y);

  if (game.screen === "names" && nameEditor && nameEditor.activePlayerIndex >= 0) {
    const activeFieldAction = `nameField:${nameEditor.activePlayerIndex}`;
    if (!button || button.action !== activeFieldAction) {
      const switchingFields = button && button.action.startsWith("nameField:");
      commitPlayerName({ shouldBlur: !switchingFields });
    }
  }

  if (game.screen === "names" && button && button.action.startsWith("nameField:")) {
    const playerIndex = Number(button.action.split(":")[1]);
    beginEditingPlayerName(playerIndex, playerNameInputScreenRect(playerIndex), game.nameEditorNames[playerIndex] || "");
    refreshButtons();
    return;
  }

  if (button) {
    handleButton(button);
    refreshButtons();
    return;
  }

  if (game.screen === "names") {
    refreshButtons();
    return;
  }

  if (game.screen === "play") {
    handlePlayCellClick(findCellAt(point.x, point.y));
    refreshButtons();
  }
});

window.addEventListener("keydown", (event) => {
  if (game.screen === "names" && nameEditor && document.activeElement === nameEditor.input) {
    return;
  }

  if (event.key.toLowerCase() === "f") {
    toggleFullscreen();
    return;
  }

  if (game.screen === "menu") {
    if (["2", "3", "4", "5"].includes(event.key)) {
      game.playerCount = Number(event.key);
    }
    if (event.key.toLowerCase() === "s") game.gameMode = GAME_MODES.starter;
    if (event.key.toLowerCase() === "a") game.gameMode = GAME_MODES.advanced;
    if (event.key === "Enter") beginDraft();
    return;
  }

  if (game.screen === "names") {
    if (event.key === "Enter") {
      saveEditedPlayerNames();
      return;
    }

    if (event.key === "Escape") {
      cancelEditedPlayerNames();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const nextIndex = game.editingNameIndex >= 0
        ? (game.editingNameIndex + (event.shiftKey ? NAME_EDITOR_ROWS - 1 : 1)) % NAME_EDITOR_ROWS
        : 0;
      beginEditingPlayerName(nextIndex, playerNameInputScreenRect(nextIndex), game.nameEditorNames[nextIndex] || "");
    }
    return;
  }

  if (game.screen === "draft") {
    if (game.exitPrompt.active) {
      if (event.key === "Escape") {
        game.exitPrompt.active = false;
        game.message = `${currentPlayer().name}: draft module ${currentPlayer().modules.length + 1} of 3.`;
      }
      return;
    }
    if (game.passPrompt.active && (event.key === "Enter" || event.key === " ")) {
      game.passPrompt.active = false;
      game.message = `${currentPlayer().name}: draft module ${currentPlayer().modules.length + 1} of 3.`;
      return;
    }
    if (event.key.toLowerCase() === "r") {
      game.screen = "menu";
      game.message = "Choose a player count and DNA set.";
    }
    return;
  }

  if (game.screen === "end") {
    if (event.key.toLowerCase() === "r") beginDraft();
    return;
  }

  if (game.exitPrompt.active) {
    if (event.key === "Escape") {
      game.exitPrompt.active = false;
      game.message = `${currentPlayer().name}'s game is still in progress.`;
    }
    return;
  }

  if (game.passPrompt.active) {
    if (event.key === "Enter" || event.key === " ") {
      game.passPrompt.active = false;
      game.message = forcedSeedTurn(currentPlayer())
        ? `${currentPlayer().name}: place your first seed hub.`
        : `${currentPlayer().name}'s turn. Choose one main action.`;
    }
    return;
  }

  if (event.key === "1") handleButton(makeButton(0, 0, 0, 0, "", ACTIONS.plant));
  if (event.key === "2") handleButton(makeButton(0, 0, 0, 0, "", ACTIONS.grow));
  if (event.key === "3") handleButton(makeButton(0, 0, 0, 0, "", ACTIONS.harvest));
  if (event.key === "4") handleButton(makeButton(0, 0, 0, 0, "", ACTIONS.end));
  if (event.key.toLowerCase() === "r") {
    game.screen = "menu";
    game.message = "Choose a player count and DNA set.";
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

function drawText(text, x, y, size, color, align = "left", weight = "600") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawTerrainPattern(cell) {
  ctx.save();
  pathHex(cell.x, cell.y, BOARD.size - 1);
  ctx.clip();
  ctx.strokeStyle = "rgba(60, 45, 26, 0.18)";
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

function drawDiamond(x, y, width, height, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y - height / 2);
  ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x, y + height / 2);
  ctx.lineTo(x - width / 2, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPolygon(points, fill, edge, lineWidth = 1.5) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawCompositeDnaHex(player, x, y, compact = false) {
  if (!player || player.modules.length === 0) return;

  const halfWidth = compact ? 13 : 18;
  const band = compact ? 7 : 10;
  const seam = "#f4ead1";
  const top = { x, y: y - band * 2 };
  const upperRight = { x: x + halfWidth, y: y - band };
  const lowerRight = { x: x + halfWidth, y: y + band };
  const bottom = { x, y: y + band * 2 };
  const lowerLeft = { x: x - halfWidth, y: y + band };
  const upperLeft = { x: x - halfWidth, y: y - band };
  const center = { x, y };

  const pieces = [
    {
      moduleId: player.modules[0],
      points: [top, upperRight, center, upperLeft],
      label: { x, y: y - band },
    },
    {
      moduleId: player.modules[1],
      points: [upperLeft, center, bottom, lowerLeft],
      label: { x: x - halfWidth / 2, y: y + band / 2 },
    },
    {
      moduleId: player.modules[2],
      points: [center, upperRight, lowerRight, bottom],
      label: { x: x + halfWidth / 2, y: y + band / 2 },
    },
  ];

  pieces.forEach((piece) => {
    if (!piece.moduleId) return;
    const definition = moduleDef(piece.moduleId);
    drawPolygon(piece.points, MODULE_TYPE_COLORS[definition.type], seam, compact ? 1.2 : 1.5);

    const abbreviation = definition.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    drawText(abbreviation, piece.label.x, piece.label.y, compact ? 7 : 9, "#fff8ea", "center", "700");
  });
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
    button.y + (button.note ? button.h / 2 - 4 : button.h / 2),
    button.note ? 11 : 13,
    button.enabled ? (button.selected ? "#f8f4e6" : "#3d2c17") : "#7d7262",
    "center",
    "700",
  );

  if (button.note) {
    drawText(
      button.note,
      button.x + button.w / 2,
      button.y + button.h / 2 + 8,
      9,
      button.enabled ? "#6a5737" : "#8b7c65",
      "center",
      "500",
    );
  }
}

function drawFullscreenIcon(button, enabled, hovered) {
  const iconColor = enabled ? "#3d2c17" : "#7d7262";
  const pad = hovered ? 5 : 6;
  const left = button.x + pad;
  const right = button.x + button.w - pad;
  const top = button.y + pad;
  const bottom = button.y + button.h - pad;
  const inset = 4;
  const active = isFullscreenActive();
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  ctx.strokeStyle = iconColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (active) {
    const centerGapX = hovered ? 12 : 10;
    const centerGapY = hovered ? 10 : 8;
    const armX = hovered ? 4 : 3;
    const armY = hovered ? 4 : 3;
    const leftInnerX = Math.floor(centerX - centerGapX / 2);
    const rightInnerX = Math.ceil(centerX + centerGapX / 2);
    const topInnerY = Math.floor(centerY - centerGapY / 2);
    const bottomInnerY = Math.ceil(centerY + centerGapY / 2);

    ctx.moveTo(leftInnerX - armX, topInnerY);
    ctx.lineTo(leftInnerX, topInnerY);
    ctx.lineTo(leftInnerX, topInnerY - armY);

    ctx.moveTo(rightInnerX, topInnerY - armY);
    ctx.lineTo(rightInnerX, topInnerY);
    ctx.lineTo(rightInnerX + armX, topInnerY);

    ctx.moveTo(leftInnerX - armX, bottomInnerY);
    ctx.lineTo(leftInnerX, bottomInnerY);
    ctx.lineTo(leftInnerX, bottomInnerY + armY);

    ctx.moveTo(rightInnerX, bottomInnerY + armY);
    ctx.lineTo(rightInnerX, bottomInnerY);
    ctx.lineTo(rightInnerX + armX, bottomInnerY);
  } else {
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
  }
  ctx.stroke();
}

function drawBoard() {
  ctx.fillStyle = "rgba(255, 249, 236, 0.55)";
  ctx.fillRect(16, 16, 452, 220);

  const player = currentPlayer();
  const validTargets = new Set(
    (game.selectedAction === ACTIONS.plant
      ? game.board.filter((cell) => canPlantSeedOn(cell, player))
      : game.selectedAction === ACTIONS.grow
        ? getLegalGrowTargets(player)
        : []
    ).map((cell) => keyFor(cell.q, cell.r)),
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

    const units = [...cell.occupants].sort((a, b) => a.height - b.height);
    units.forEach((unit, index) => {
      const owner = game.players[unit.ownerId];
      const yOffset = unit.height * 4;
      const radius = unit.seed ? 8 : 6.5;
      const alpha = index === units.length - 1 ? 1 : 0.7;

      ctx.beginPath();
      ctx.arc(cell.x, cell.y - yOffset, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${owner.color}${alpha === 1 ? "" : "bb"}`;
      ctx.fill();
      ctx.lineWidth = index === units.length - 1 ? 2 : 1.5;
      ctx.strokeStyle = index === units.length - 1 ? "#fff9ee" : "rgba(255,249,238,0.65)";
      ctx.stroke();

      if (unit.seed) {
        ctx.beginPath();
        ctx.moveTo(cell.x, cell.y - yOffset + 4);
        ctx.quadraticCurveTo(cell.x - 4, cell.y - yOffset - 2, cell.x - 1, cell.y - yOffset - 7);
        ctx.quadraticCurveTo(cell.x + 3, cell.y - yOffset - 3, cell.x + 4, cell.y - yOffset);
        ctx.strokeStyle = "#fff9ee";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    });

    if (cell.occupants.length > 0) {
      drawText(`${getTopOccupant(cell).height}`, cell.x + 12, cell.y - 12, 9, "#3f301b", "center", "700");
    }
  }

  if (game.hoverCell) {
    pathHex(game.hoverCell.x, game.hoverCell.y, BOARD.size + 1);
    ctx.strokeStyle = "rgba(48, 34, 18, 0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawCompactScoreboard() {
  const player = currentPlayer();

  ctx.fillStyle = "rgba(255, 250, 239, 0.94)";
  ctx.fillRect(PANEL_X, 16, PANEL_W, 236);
  ctx.strokeStyle = "#b79e74";
  ctx.lineWidth = 2;
  ctx.strokeRect(PANEL_X, 16, PANEL_W, 236);

  drawText("Growing Seeds", PANEL_X + 10, 30, 18, "#3a2b18", "left", "700");
  drawText(`${game.gameMode === GAME_MODES.starter ? "Starter" : "Advanced"} Set`, PANEL_X + 200, 30, 11, "#6e5b3a", "center", "700");
  drawText(`Round ${game.round}/${MAX_ROUNDS}`, PANEL_X + 10, 50, 12, "#5e4b2b");
  drawText(`Weather: ${currentWeather().label}`, PANEL_X + 122, 50, 12, "#5e4b2b");
  drawText(currentWeather().text, PANEL_X + 10, 66, 10, "#6d5a3d", "left", "500");

  ctx.fillStyle = "rgba(68, 123, 42, 0.12)";
  ctx.fillRect(PANEL_X + 10, 76, 270, 34);
  drawText(`Current: ${player.name}`, PANEL_X + 16, 88, 13, player.color, "left", "700");
  drawText(`Produce ${player.produce} | Score ${player.score}`, PANEL_X + 16, 102, 10, "#4d3a24", "left", "600");

  drawText("Show Your DNA Modules", PANEL_X + 10, 126, 11, "#4a371e", "left", "700");
  drawCompositeDnaHex(player, PANEL_X + 42, 142, true);

  player.modules.forEach((moduleId, index) => {
    const definition = moduleDef(moduleId);
    const y = 134 + index * 11;
    drawText(`${definition.name}: ${definition.short}`, PANEL_X + 78, y, 8, MODULE_TYPE_COLORS[definition.type], "left", "700");
  });
}

function drawScoreDrawer() {
  if (!game.showScores || game.screen !== "play") return;

  const panelX = 16;
  const panelY = 36;
  const panelW = 132;
  const panelH = 18 + game.players.length * 20;

  ctx.fillStyle = "rgba(255, 249, 236, 0.97)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "#b79e74";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  game.players.forEach((player, index) => {
    const rowY = panelY + 14 + index * 20;
    ctx.fillStyle = player.color;
    ctx.fillRect(panelX + 8, rowY - 5, 10, 10);
    drawText(player.name, panelX + 24, rowY - 1, 10, player.color, "left", "700");
    drawText(`${player.produce}P ${player.score}VP`, panelX + 24, rowY + 9, 9, "#4b3922", "left", "600");
  });
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

  if (game.screen === "play" && game.hoverCell) {
    const top = getTopOccupant(game.hoverCell);
    const summary = top
      ? `${terrainData(game.hoverCell).label} | top ${playerName(top.ownerId)} h${top.height} | stack ${game.hoverCell.occupants.length}`
      : `${terrainData(game.hoverCell).label} | empty column`;
    drawText(summary, WIDTH - 12, MESSAGE_Y + MESSAGE_H / 2, 11, "#f7f0df", "right", "500");
  }

  if (game.screen === "draft" && game.hoverModuleId) {
    const definition = moduleDef(game.hoverModuleId);
    drawText(definition.detail, WIDTH - 12, MESSAGE_Y + MESSAGE_H / 2, 10, "#f7f0df", "right", "500");
  }
}

function drawPassPromptOverlay() {
  const player = game.players[game.passPrompt.playerId];

  ctx.fillStyle = "rgba(28, 20, 12, 0.62)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(248, 241, 224, 0.98)";
  ctx.fillRect(210, 82, 380, 108);
  ctx.strokeStyle = "#9f8355";
  ctx.lineWidth = 3;
  ctx.strokeRect(210, 82, 380, 108);

  drawText(`${player.name} turn`, WIDTH / 2, 114, 26, player.color, "center", "700");
  drawText("Pass the device, then press OK.", WIDTH / 2, 142, 14, "#4e3c24", "center", "600");
}

function drawExitPromptOverlay() {
  ctx.fillStyle = "rgba(28, 20, 12, 0.68)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(248, 241, 224, 0.99)";
  ctx.fillRect(190, 90, 420, 110);
  ctx.strokeStyle = "#9f8355";
  ctx.lineWidth = 3;
  ctx.strokeRect(190, 90, 420, 110);

  drawText("Are you sure you want to exit your current game?", WIDTH / 2, 126, 17, "#4e3c24", "center", "700");
}

function drawMenu() {
  drawBackground();
  drawText("Growing Seeds", WIDTH / 2, 54, 32, "#3c2b1a", "center", "700");
  drawText("Build a 3-module plant and finish a playtest game in about 45 minutes.", WIDTH / 2, 82, 14, "#5c4a31", "center", "500");

  drawText("Choose Your DNA Set", WIDTH / 2, 104, 18, "#4d6f28", "center", "700");
  drawText("Starter Set is the default learning mode. Advanced Set samples 12 from the 24-module pool.", WIDTH / 2, 156, 11, "#5d4a2f", "center", "500");
  drawText("Player Count", WIDTH / 2, 164, 14, "#4a371e", "center", "700");
  drawText("Draft 3 DNA modules per player before planting your first seed.", WIDTH / 2, 278, 11, "#5d4a2f", "center", "500");

  drawText("Saved Names", 688, 216, 12, "#4a371e", "center", "700");
  game.savedPlayerNames.forEach((name, index) => {
    drawText(`${index + 1}. ${name}`, 688, 230 + index * 10, 10, PLAYER_COLORS[index], "center", "600");
  });

  game.uiButtons.forEach(drawButton);
}

function drawNameEditorScreen() {
  drawBackground();
  drawText("Change Player Names", WIDTH / 2, 40, 28, "#3c2b1a", "center", "700");
  drawText("Tap or click a row to edit it. The keyboard opens through a real input overlay.", WIDTH / 2, 62, 13, "#5c4a31", "center", "500");

  ctx.fillStyle = "rgba(255, 249, 236, 0.86)";
  ctx.fillRect(132, 52, 536, 188);
  ctx.strokeStyle = "#b79e74";
  ctx.lineWidth = 2;
  ctx.strokeRect(132, 52, 536, 188);

  for (let index = 0; index < NAME_EDITOR_ROWS; index += 1) {
    const y = NAME_ROW_Y + index * 32;
    const isActive = game.editingNameIndex === index;
    ctx.fillStyle = isActive ? "rgba(79, 127, 55, 0.16)" : "rgba(255, 252, 244, 0.95)";
    ctx.fillRect(NAME_ROW_X, y, NAME_ROW_W, NAME_ROW_H);
    ctx.strokeStyle = isActive ? "#4f7f37" : "#a88f63";
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    ctx.strokeRect(NAME_ROW_X, y, NAME_ROW_W, NAME_ROW_H);

    drawText(`Player ${index + 1}`, 184, y + 13, 11, PLAYER_COLORS[index], "left", "700");

    const name = game.nameEditorNames[index] || "";
    const showCaret = isActive && (!nameEditor || nameEditor.activePlayerIndex !== index) && Math.floor(Date.now() / 450) % 2 === 0;
    const display = isActive && showCaret ? `${name}|` : name || "Type a name";
    drawText(display, 278, y + 13, 12, name ? "#3d2c17" : "#8a7a62", "left", name ? "600" : "500");
  }

  drawText("Enter commits. Tap outside to save that field. Save Names closes the editor.", WIDTH / 2, 224, 10, "#5d4a2f", "center", "500");
  game.uiButtons
    .filter((button) => !button.action.startsWith("nameField:"))
    .forEach(drawButton);
  drawMessageBar();
}

function drawDraftScreen() {
  drawBackground();
  drawText("DNA Draft", 20, 28, 28, "#3c2b1a", "left", "700");
  drawText(`${currentPlayer().name}: pick module ${currentPlayer().modules.length + 1} of 3`, 20, 50, 13, currentPlayer().color, "left", "700");
  drawText(game.gameMode === GAME_MODES.starter ? "Starter Set: all 12 starter modules are available." : "Advanced Set: 12 modules sampled from the 24-module pool.", 20, 64, 11, "#5d4a2f", "left", "500");

  ctx.fillStyle = "rgba(255, 249, 236, 0.7)";
  ctx.fillRect(14, 76, 462, 164);
  ctx.strokeStyle = "#b79e74";
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 76, 462, 164);

  ctx.fillStyle = "rgba(255, 250, 239, 0.94)";
  ctx.fillRect(PANEL_X, 48, PANEL_W, 192);
  ctx.strokeStyle = "#b79e74";
  ctx.lineWidth = 2;
  ctx.strokeRect(PANEL_X, 48, PANEL_W, 192);

  drawText("Current DNA Cluster", PANEL_X + 12, 64, 12, "#4a371e", "left", "700");
  drawCompositeDnaHex(currentPlayer(), PANEL_X + 66, 90);

  currentPlayer().modules.forEach((moduleId, index) => {
    const definition = moduleDef(moduleId);
    const y = 78 + index * 22;
    drawText(definition.name, PANEL_X + 114, y, 10, MODULE_TYPE_COLORS[definition.type], "left", "700");
    drawText(definition.short, PANEL_X + 114, y + 10, 8, "#5a482e", "left", "500");
  });

  drawText("Draft Summary", PANEL_X + 12, 136, 12, "#4a371e", "left", "700");
  game.players.forEach((player, index) => {
    const y = 152 + index * 16;
    ctx.fillStyle = player.color;
    ctx.fillRect(PANEL_X + 12, y - 5, 8, 8);
    drawText(`${player.name}: ${player.modules.map((moduleId) => moduleDef(moduleId).name).join(", ") || "none yet"}`, PANEL_X + 26, y, 9, "#3f301d", "left", "600");
  });

  game.uiButtons.forEach(drawButton);
  drawMessageBar();
  if (game.exitPrompt.active) {
    drawExitPromptOverlay();
    game.uiButtons.forEach(drawButton);
  }
  if (game.passPrompt.active) {
    drawPassPromptOverlay();
    game.uiButtons.forEach(drawButton);
  }
}

function drawEndScreen() {
  drawBackground();
  drawBoard();
  drawCompactScoreboard();
  drawLegendStrip();

  ctx.fillStyle = "rgba(30, 22, 14, 0.78)";
  ctx.fillRect(118, 34, 564, 172);
  ctx.strokeStyle = "#efe2bf";
  ctx.lineWidth = 2;
  ctx.strokeRect(118, 34, 564, 172);

  drawText("Harvest Complete", WIDTH / 2, 54, 26, "#f7efdb", "center", "700");
  drawText(game.winnerText, WIDTH / 2, 78, 15, "#f2d889", "center", "700");

  game.finalBreakdowns.forEach((entry, index) => {
    const player = game.players[entry.playerId];
    const y = 104 + index * 18;
    drawText(`${player.name}: visible ${entry.visible} + produce ${entry.produce} + module ${entry.moduleBonus} = ${entry.total}`, WIDTH / 2, y, 12, player.color, "center", "700");
  });

  game.uiButtons.forEach(drawButton);
  drawMessageBar();
}

function drawPlayScreen() {
  drawBackground();
  drawBoard();
  drawScoreDrawer();
  drawCompactScoreboard();
  drawLegendStrip();
  game.uiButtons.forEach(drawButton);
  drawMessageBar();
  if (game.exitPrompt.active) {
    drawExitPromptOverlay();
    game.uiButtons.forEach(drawButton);
  } else if (game.passPrompt.active) {
    drawPassPromptOverlay();
    game.uiButtons.forEach(drawButton);
  }
}

function render() {
  refreshButtons();
  syncNameEditorOverlay();

  if (game.screen === "menu") {
    drawMenu();
  } else if (game.screen === "names") {
    drawNameEditorScreen();
  } else if (game.screen === "draft") {
    drawDraftScreen();
  } else if (game.screen === "play") {
    drawPlayScreen();
  } else {
    drawEndScreen();
  }

  requestAnimationFrame(render);
}

refreshButtons();
syncCanvasSize();
render();

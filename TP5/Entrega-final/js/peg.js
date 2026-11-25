/* =====================================================================
   CONFIGURACIÓN
   ===================================================================== */
const CELL = 100;          // tamaño de cada casilla en px (7 x 100 = 700)
const PEG_RADIUS = 38;     // radio de una ficha en px
const TIME_LIMIT = 300;    // tiempo límite del juego en segundos (5 minutos)

// Forma del tablero en cruz: 1 = casilla válida, 0 = fuera del tablero
const LAYOUT = [
  [0,0,1,1,1,0,0],
  [0,0,1,1,1,0,0],
  [1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1],
  [0,0,1,1,1,0,0],
  [0,0,1,1,1,0,0]
];
const CENTER = { row: 3, col: 3 };   // casilla que empieza vacía

/* Imágenes del juego. El tablero mide 700x700 y las fichas 100x100,
   por lo que coinciden exactamente con la grilla de 7x7 casillas. */
const ASSETS = {
  board: "assets/tablero.svg.svg",
  pegs: [
    { name: "Balón clásico", src: "assets/ficha-1.svg.svg", colors: ["#ffffff", "#94a3b8"] },
    { name: "Balón naranja", src: "assets/ficha-2.svg.svg", colors: ["#fff7ed", "#9a3412"] },
    { name: "Balón celeste", src: "assets/ficha-3.svg.svg", colors: ["#ecfeff", "#0369a1"] }
  ]
};

/* =====================================================================
   ELEMENTOS DEL DOM Y ESTADO DEL JUEGO
   ===================================================================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const pegCountEl = document.getElementById("pegCount");
const movesEl = document.getElementById("moves");
const pegTypeEl = document.getElementById("pegType");
const startBtn = document.getElementById("btn-comenzar");
const restartBtn = document.getElementById("btn-reiniciar");

let boardImg = null;       // imagen de fondo (tablero vacío)
let pegImgs = [];          // imágenes de cada tipo de ficha
let pegs = [];             // arreglo de fichas activas (objetos Peg)
let grid = [];             // grid[fila][col] = Peg o null (hueco)
let dragged = null;        // ficha que se está arrastrando (o null)
let dragOffset = { x: 0, y: 0 };   // distancia entre el mouse y el centro de la ficha
let validMoves = [];       // destinos válidos de la ficha arrastrada (para los hints)
let state = "loading";     // "loading" | "idle" | "playing" | "won" | "lost"
let endMessage = "";       // mensaje final mostrado sobre el canvas
let moves = 0;             // cantidad de movimientos realizados
let startTime = 0;         // instante de inicio de la partida (ms)
let currentType = 0;       // índice del tipo de ficha elegido

/* =====================================================================
   UTILIDADES
   ===================================================================== */

// Devuelve la coordenada del centro de una casilla (sirve para x con col y para y con fila)
function cellCenter(index) { return index * CELL + CELL / 2; }

// Indica si (fila, col) es una casilla válida del tablero
function isValidCell(row, col) {
  return row >= 0 && row < 7 && col >= 0 && col < 7 && LAYOUT[row][col] === 1;
}

// Carga una imagen; si falla, resuelve con la imagen generada por la función fallback
function loadImage(src, fallback) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(fallback());
    img.src = src;
  });
}

// Fallback: genera un tablero de madera en un canvas fuera de pantalla
function makeBoardFallback() {
  const c = document.createElement("canvas");
  c.width = c.height = 700;
  const g = c.getContext("2d");
  g.fillStyle = "#14100c";
  g.fillRect(0, 0, 700, 700);
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 7; col++) {
      if (!LAYOUT[r][col]) continue;
      // fondo de madera de cada casilla
      g.fillStyle = "#c9a15f";
      g.fillRect(col * CELL, r * CELL, CELL, CELL);
      // hueco donde se apoya la ficha
      g.beginPath();
      g.arc(cellCenter(col), cellCenter(r), 20, 0, Math.PI * 2);
      g.fillStyle = "#5a3d1e";
      g.fill();
    }
  }
  return c;
}

// Fallback: genera una ficha con degradado radial (simula una "imagen" de ficha)
function makePegFallback(colors) {
  const size = 100;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(35, 35, 5, 50, 50, 50);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

// Formatea segundos como mm:ss
function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return mm + ":" + ss;
}

function setTimerDisplay(seconds) {
  timerEl.textContent = formatTime(seconds);
}

/* =====================================================================
   CLASES (POO): Figure -> Circle -> Peg
   ===================================================================== */

// Figura genérica: posición y contexto de dibujo
class Figure {
  constructor(posX, posY, context) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
  }
  // Cada figura concreta redefine cómo se dibuja
  draw() {}
  // Cada figura concreta redefine cómo saber si un punto está dentro
  isPointInside(x, y) { return false; }
}

// Círculo: agrega radio y la detección de punto interior por distancia al centro
class Circle extends Figure {
  constructor(posX, posY, radius, context) {
    super(posX, posY, context);
    this.radius = radius;
  }
  // Un punto está dentro si su distancia al centro es menor al radio
  isPointInside(x, y) {
    return Math.hypot(this.posX - x, this.posY - y) < this.radius;
  }
}

// Ficha del juego: círculo con imagen, ubicada en una casilla (row, col) del tablero
class Peg extends Circle {
  constructor(row, col, img, context) {
    super(cellCenter(col), cellCenter(row), PEG_RADIUS, context);
    this.row = row;
    this.col = col;
    this.img = img;
    this.dragging = false;   // true mientras el usuario la arrastra
  }

  // Dibuja la imagen recortada en círculo; si se arrastra, se agranda y proyecta sombra
  draw() {
    const g = this.context;
    const r = this.dragging ? this.radius * 1.12 : this.radius;
    g.save();
    if (this.dragging) {
      g.shadowColor = "rgba(0,0,0,0.6)";
      g.shadowBlur = 16;
      g.shadowOffsetY = 6;
    }
    g.beginPath();
    g.arc(this.posX, this.posY, r, 0, Math.PI * 2);
    g.clip();                                   // el recorte hace que la imagen se vea redonda
    g.drawImage(this.img, this.posX - r, this.posY - r, r * 2, r * 2);
    g.restore();
    // borde fino para destacar la ficha
    g.beginPath();
    g.arc(this.posX, this.posY, r, 0, Math.PI * 2);
    g.strokeStyle = "rgba(0,0,0,0.5)";
    g.lineWidth = 2;
    g.stroke();
  }

  // Coloca la ficha exactamente en el centro de su casilla actual
  snapToCell() {
    this.posX = cellCenter(this.col);
    this.posY = cellCenter(this.row);
  }
}

/* =====================================================================
   LÓGICA DEL JUEGO
   ===================================================================== */

// Crea una grilla vacía de 7x7
function createEmptyGrid() {
  grid = [];
  for (let r = 0; r < 7; r++) {
    grid[r] = [];
    for (let c = 0; c < 7; c++) {
      grid[r][c] = null;
    }
  }
}

// Estado inicial: tablero vacío, timer completo y controles listos para comenzar
function resetGame() {
  pegs = [];
  createEmptyGrid();
  dragged = null;
  validMoves = [];
  moves = 0;
  endMessage = "";
  startTime = 0;
  state = "idle";

  setTimerDisplay(TIME_LIMIT);
  updateHud();
  startBtn.disabled = false;
  restartBtn.disabled = true;
}

// Inicia una partida nueva: coloca las 32 fichas y arranca el temporizador
function startGame() {
  pegs = [];
  createEmptyGrid();

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (!LAYOUT[r][c]) continue;
      if (r === CENTER.row && c === CENTER.col) continue;   // hueco inicial
      const peg = new Peg(r, c, pegImgs[currentType], ctx);
      grid[r][c] = peg;
      pegs.push(peg);
    }
  }

  dragged = null;
  validMoves = [];
  moves = 0;
  endMessage = "";
  startTime = performance.now();
  state = "playing";

  setTimerDisplay(TIME_LIMIT);
  updateHud();
  startBtn.disabled = true;
  restartBtn.disabled = false;
}

// Devuelve los saltos posibles de una ficha: [{row, col, over:{row,col}}]
// Un salto es válido si el destino (a 2 casillas) está vacío y la casilla intermedia tiene ficha
function getMovesFor(peg) {
  const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];
  const result = [];
  for (const [dr, dc] of dirs) {
    const tr = peg.row + dr, tc = peg.col + dc;          // casilla destino
    const mr = peg.row + dr / 2, mc = peg.col + dc / 2;  // casilla intermedia (la que se come)
    if (isValidCell(tr, tc) && !grid[tr][tc] && grid[mr][mc]) {
      result.push({ row: tr, col: tc, over: { row: mr, col: mc } });
    }
  }
  return result;
}

// Verifica si alguna ficha del tablero tiene al menos un salto posible
function hasAnyMove() {
  return pegs.some(p => getMovesFor(p).length > 0);
}

// Ejecuta un salto: mueve la ficha al destino y elimina la ficha saltada
function applyMove(peg, move) {
  grid[peg.row][peg.col] = null;                        // la casilla de origen queda vacía
  const eaten = grid[move.over.row][move.over.col];     // ficha saltada
  grid[move.over.row][move.over.col] = null;
  pegs.splice(pegs.indexOf(eaten), 1);                  // se elimina del arreglo de fichas
  peg.row = move.row;
  peg.col = move.col;
  grid[move.row][move.col] = peg;
  peg.snapToCell();
  moves++;
  updateHud();
  checkEndOfGame();
}

// Finaliza la partida y habilita los botones de inicio/reinicio
function endGame(message, newState) {
  if (dragged) dragged.snapToCell();
  endMessage = message;
  state = newState;
  cancelDrag();
  startBtn.disabled = false;
  restartBtn.disabled = false;
}

// Se llama luego de cada movimiento: detecta victoria o falta de movimientos
function checkEndOfGame() {
  if (pegs.length === 1) {
    const inCenter = pegs[0].row === CENTER.row && pegs[0].col === CENTER.col;
    endGame(
      inCenter ? "¡Perfecto! Ficha final en el centro" : "¡Ganaste! Queda una sola ficha",
      "won"
    );
  } else if (!hasAnyMove()) {
    endGame("Sin movimientos posibles. Fin del juego", "lost");
  }
}

// Actualiza el temporizador: si se agota el tiempo, termina la partida
function updateTimer() {
  if (state !== "playing") return;
  const left = TIME_LIMIT - (performance.now() - startTime) / 1000;
  setTimerDisplay(left);
  if (left <= 0) {
    endGame("Se acabó el tiempo", "lost");
  }
}

// Actualiza los contadores del panel lateral
function updateHud() {
  pegCountEl.textContent = pegs.length;
  movesEl.textContent = moves;
}

/* =====================================================================
   EVENTOS DEL MOUSE (mousedown -> mousemove -> mouseup)
   ===================================================================== */

// Convierte la posición del mouse a coordenadas del canvas (por si el canvas se escala por CSS)
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * canvas.width / rect.width,
    y: (e.clientY - rect.top) * canvas.height / rect.height
  };
}

// Busca la ficha bajo el punto (x, y); recorre desde la última (la que se dibuja arriba)
function findClickedPeg(x, y) {
  for (let i = pegs.length - 1; i >= 0; i--) {
    if (pegs[i].isPointInside(x, y)) return pegs[i];
  }
  return null;
}

// MOUSEDOWN: elige la ficha, calcula sus destinos válidos (hints) y empieza el arrastre
canvas.addEventListener("mousedown", e => {
  if (state !== "playing") return;
  const m = getMousePos(e);
  const peg = findClickedPeg(m.x, m.y);
  if (!peg) return;
  dragged = peg;
  dragged.dragging = true;
  dragOffset = { x: peg.posX - m.x, y: peg.posY - m.y };
  validMoves = getMovesFor(peg);
  // la mandamos al final del arreglo para que se dibuje por encima de las demás
  pegs.splice(pegs.indexOf(peg), 1);
  pegs.push(peg);
});

// MOUSEMOVE: si hay ficha arrastrada, sigue al mouse; si no, solo cambia el cursor
canvas.addEventListener("mousemove", e => {
  const m = getMousePos(e);
  if (dragged) {
    dragged.posX = m.x + dragOffset.x;
    dragged.posY = m.y + dragOffset.y;
    canvas.style.cursor = "grabbing";
  } else {
    canvas.style.cursor = (state === "playing" && findClickedPeg(m.x, m.y)) ? "grab" : "default";
  }
});

// MOUSEUP: si la soltó sobre un destino válido, ejecuta el salto; si no, vuelve a su casilla
canvas.addEventListener("mouseup", () => {
  if (!dragged) return;
  // destino válido = el más cercano dentro de media casilla del centro de la ficha
  const target = validMoves.find(mv =>
    Math.hypot(cellCenter(mv.col) - dragged.posX, cellCenter(mv.row) - dragged.posY) < CELL / 2
  );
  const peg = dragged;
  cancelDrag();               // limpia el estado de arrastre
  if (target) applyMove(peg, target);
  else peg.snapToCell();      // movimiento inválido: la ficha vuelve a donde estaba
});

// Si el mouse sale del canvas durante el arrastre, se cancela y la ficha vuelve
canvas.addEventListener("mouseleave", () => {
  if (!dragged) return;
  const peg = dragged;
  cancelDrag();
  peg.snapToCell();
});

// Termina el arrastre actual sin mover la ficha de casilla
function cancelDrag() {
  if (dragged) dragged.dragging = false;
  dragged = null;
  validMoves = [];
}

/* =====================================================================
   DIBUJO Y ANIMACIÓN
   ===================================================================== */

// HINTS ANIMADOS: sobre cada destino válido dibuja un anillo que pulsa y una flecha que rebota
// t = tiempo en ms (viene de requestAnimationFrame), se usa para animar con funciones seno
function drawHints(t) {
  for (const mv of validMoves) {
    const cx = cellCenter(mv.col), cy = cellCenter(mv.row);
    const pulse = (Math.sin(t / 250) + 1) / 2;          // oscila entre 0 y 1
    // anillo pulsante sobre el hueco destino
    ctx.beginPath();
    ctx.arc(cx, cy, 26 + pulse * 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 230, 90, " + (0.9 - pulse * 0.5) + ")";
    ctx.lineWidth = 4;
    ctx.stroke();
    // marca roja tenue sobre la ficha que se va a comer
    ctx.beginPath();
    ctx.arc(cellCenter(mv.over.col), cellCenter(mv.over.row), PEG_RADIUS + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 80, 60, 0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
    // flecha hacia abajo que rebota arriba del destino
    const bounce = Math.abs(Math.sin(t / 300)) * 10;
    const ay = Math.max(24, cy - 52 - bounce);   // evita que se salga por arriba del canvas
    ctx.beginPath();
    ctx.moveTo(cx - 12, ay - 12);
    ctx.lineTo(cx + 12, ay - 12);
    ctx.lineTo(cx, ay + 6);
    ctx.closePath();
    ctx.fillStyle = "#ffe65a";
    ctx.fill();
    ctx.strokeStyle = "#5a3d1e";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Cartel de fin de juego sobre el canvas
function drawEndOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 36px Georgia, serif";
  ctx.fillText(endMessage, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "22px Georgia, serif";
  ctx.fillText('Presioná "Reiniciar" para volver a jugar', canvas.width / 2, canvas.height / 2 + 30);
}

// Dibuja un cuadro completo: fondo, fichas, ficha arrastrada, hints y cartel final
function draw(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(boardImg, 0, 0, canvas.width, canvas.height);   // tablero vacío de fondo
  for (const p of pegs) if (p !== dragged) p.draw();            // fichas quietas
  if (dragged) dragged.draw();                                   // la arrastrada va arriba de todo
  drawHints(t);                                                  // hints animados por encima
  if (state === "won" || state === "lost") drawEndOverlay();
}

// Bucle principal: actualiza el timer y redibuja ~60 veces por segundo
function loop(t) {
  updateTimer();
  if (state !== "loading") draw(t);
  requestAnimationFrame(loop);
}

/* =====================================================================
   INICIO: carga de imágenes, selector de ficha y botones
   ===================================================================== */
async function start() {
  // Carga del tablero y de todos los tipos de ficha (con fallback si falta el archivo)
  boardImg = await loadImage(ASSETS.board, makeBoardFallback);
  pegImgs = await Promise.all(
    ASSETS.pegs.map(p => loadImage(p.src, () => makePegFallback(p.colors)))
  );

  // Llena el selector con los tipos de ficha disponibles
  ASSETS.pegs.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = p.name;
    pegTypeEl.appendChild(opt);
  });

  // Cambiar el tipo de ficha reinicia la partida si ya se estaba jugando
  pegTypeEl.addEventListener("change", () => {
    currentType = Number(pegTypeEl.value);
    if (state === "playing" || state === "won" || state === "lost") {
      startGame();
    }
  });

  // Botón Comenzar: coloca las fichas y arranca el timer
  startBtn.addEventListener("click", startGame);

  // Botón Reiniciar: inicia una partida nueva de inmediato
  restartBtn.addEventListener("click", startGame);

  // Estado inicial: tablero vacío (solo la imagen de fondo)
  resetGame();
  requestAnimationFrame(loop);
}

start();

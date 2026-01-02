// ====== Device & canvas setup ======

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mobileControls = document.getElementById("mobile-controls");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highscore");
const themeSelect = document.getElementById("theme-select");
const speedSelect = document.getElementById("speed-select");
const soundToggle = document.getElementById("sound-toggle");
const vibrateToggle = document.getElementById("vibrate-toggle");
const messageEl = document.getElementById("message");

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Auto size canvas
function resizeCanvas() {
  if (isMobile) {
    const size = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.6);
    canvas.width = size;
    canvas.height = size;
  } else {
    canvas.width = 480;
    canvas.height = 480;
  }
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ====== Game state ======

let tileCount = isMobile ? 16 : 24;
let tileSize = canvas.width / tileCount;

let snake;
let vx;
let vy;
let food;
let score;
let highScore = 0;
let gameOver = false;
let baseSpeed = 10; // moves per second
let speedMultiplier = 1;
let lastFrameTime = 0;
let moveInterval = 1000 / baseSpeed;

let currentTheme = "classic";

// swipe state
let touchStartX = 0;
let touchStartY = 0;
let touchActive = false;

// sound
let audioCtx = null;
let canUseSound = true;

// ====== Themes ======

const themes = {
  classic: {
    bg: "#000000",
    snakeHead: "#34a853",
    snakeBody: "#4caf50",
    food: "#ea4335",
    grid: "#202124"
  },
  dark: {
    bg: "#121212",
    snakeHead: "#bb86fc",
    snakeBody: "#985eff",
    food: "#cf6679",
    grid: "#2c2c2c"
  },
  neon: {
    bg: "#050816",
    snakeHead: "#00ffea",
    snakeBody: "#00b3ff",
    food: "#ff00ff",
    grid: "#111827"
  },
  retro: {
    bg: "#1d1a05",
    snakeHead: "#f5e050",
    snakeBody: "#c3b83f",
    food: "#ff5c5c",
    grid: "#3b2f1a"
  },
  pastel: {
    bg: "#fef6ff",
    snakeHead: "#ff9aa2",
    snakeBody: "#ffb7b2",
    food: "#a0ced9",
    grid: "#f2e9f7"
  }
};

// ====== Persistence ======

function loadState() {
  try {
    const storedHigh = localStorage.getItem("snake_highscore");
    if (storedHigh) highScore = parseInt(storedHigh, 10) || 0;

    const storedTheme = localStorage.getItem("snake_theme");
    if (storedTheme && themes[storedTheme]) {
      currentTheme = storedTheme;
      themeSelect.value = storedTheme;
    }

    const storedSpeed = localStorage.getItem("snake_speed");
    if (storedSpeed && ["slow", "normal", "fast"].includes(storedSpeed)) {
      speedSelect.value = storedSpeed;
      applySpeedOption(storedSpeed);
    } else {
      applySpeedOption("normal");
    }

    const storedSound = localStorage.getItem("snake_sound");
    if (storedSound !== null) {
      const enabled = storedSound === "true";
      soundToggle.checked = enabled;
      canUseSound = enabled;
    }

    const storedVibrate = localStorage.getItem("snake_vibrate");
    if (storedVibrate !== null) {
      const enabled = storedVibrate === "true";
      vibrateToggle.checked = enabled;
    }
  } catch (e) {
    // ignore
  }

  highScoreEl.textContent = `Best: ${highScore}`;
}

function saveState() {
  try {
    localStorage.setItem("snake_highscore", String(highScore));
    localStorage.setItem("snake_theme", currentTheme);
    localStorage.setItem("snake_speed", speedSelect.value);
    localStorage.setItem("snake_sound", String(soundToggle.checked));
    localStorage.setItem("snake_vibrate", String(vibrateToggle.checked));
  } catch (e) {
    // ignore
  }
}

// ====== Sound system ======

function initAudio() {
  if (!audioCtx && canUseSound) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      canUseSound = false;
    }
  }
}

function playBeep(freq, duration, type = "square", volume = 0.1) {
  if (!canUseSound) return;
  initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}

const sounds = {
  eat: () => playBeep(600, 80, "square", 0.12),
  move: () => playBeep(300, 40, "square", 0.03),
  gameOver: () => {
    playBeep(200, 150, "sawtooth", 0.1);
    setTimeout(() => playBeep(120, 200, "sawtooth", 0.11), 120);
  }
};

// ====== Vibration ======

function vibrate(pattern) {
  if (!vibrateToggle.checked) return;
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// ====== Core game logic ======

function resetGame() {
  tileSize = canvas.width / tileCount;

  const startX = Math.floor(tileCount / 2);
  const startY = Math.floor(tileCount / 2);

  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ];
  vx = 1;
  vy = 0;

  food = randomFood();
  score = 0;
  gameOver = false;
  scoreEl.textContent = `Score: ${score}`;
  messageEl.textContent = isMobile
    ? "Swipe or use arrows. Tap anywhere to start."
    : "Use arrow keys. Press any arrow to start.";
  lastFrameTime = 0;
}

function randomFood() {
  while (true) {
    const fx = Math.floor(Math.random() * tileCount);
    const fy = Math.floor(Math.random() * tileCount);
    if (!snake.some(s => s.x === fx && s.y === fy)) {
      return { x: fx, y: fy };
    }
  }
}

function applySpeedOption(option) {
  if (option === "slow") speedMultiplier = 0.7;
  else if (option === "fast") speedMultiplier = 1.4;
  else speedMultiplier = 1;

  moveInterval = 1000 / (baseSpeed * speedMultiplier);
}

// auto-performance tweak: adjust baseSpeed and tileCount based on screen
(function autoPerformanceTune() {
  const area = canvas.width * canvas.height;
  if (area < 200000) {
    tileCount = 16;
    baseSpeed = 8;
  } else if (area > 350000) {
    tileCount = 26;
    baseSpeed = 11;
  }
})();

// ====== Drawing ======

function drawGrid(t) {
  ctx.strokeStyle = t.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }
}

function drawSnake(t) {
  snake.forEach((seg, index) => {
    ctx.fillStyle = index === 0 ? t.snakeHead : t.snakeBody;
    ctx.fillRect(
      seg.x * tileSize + 1,
      seg.y * tileSize + 1,
      tileSize - 2,
      tileSize - 2
    );
  });
}

function drawFood(t) {
  ctx.fillStyle = t.food;
  ctx.beginPath();
  ctx.arc(
    food.x * tileSize + tileSize / 2,
    food.y * tileSize + tileSize / 2,
    tileSize / 2 - 3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawGameOverOverlay(t) {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "18px Arial";
  ctx.fillText(
    `Score: ${score}  |  Best: ${highScore}`,
    canvas.width / 2,
    canvas.height / 2 + 10
  );
  ctx.font = "16px Arial";
  ctx.fillText(
    isMobile ? "Tap to restart" : "Press Space or Enter to restart",
    canvas.width / 2,
    canvas.height / 2 + 40
  );
}

// ====== Update logic ======

function stepSnake() {
  const head = {
    x: snake[0].x + vx,
    y: snake[0].y + vy
  };

  // Wrap around
  head.x = (head.x + tileCount) % tileCount;
  head.y = (head.y + tileCount) % tileCount;

  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    sounds.gameOver();
    vibrate([80, 80, 120]);
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = `Best: ${highScore}`;
      saveState();
    }
    return;
  }

  snake.unshift(head);

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = `Score: ${score}`;
    food = randomFood();
    sounds.eat();
    vibrate(40);
  } else {
    snake.pop();
  }
}

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  const t = themes[currentTheme];

  if (!lastFrameTime) lastFrameTime = timestamp;
  const delta = timestamp - lastFrameTime;

  if (delta >= moveInterval && !gameOver) {
    stepSnake();
    lastFrameTime = timestamp;
  }

  // Draw frame
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid(t);
  drawSnake(t);
  drawFood(t);

  if (gameOver) {
    drawGameOverOverlay(t);
  }
}

// ====== Input handling ======

function changeDirection(newVx, newVy) {
  // Prevent reversing
  if (newVx === -vx && newVy === -vy) return;
  vx = newVx;
  vy = newVy;
  sounds.move();
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") changeDirection(0, -1);
  else if (e.key === "ArrowDown") changeDirection(0, 1);
  else if (e.key === "ArrowLeft") changeDirection(-1, 0);
  else if (e.key === "ArrowRight") changeDirection(1, 0);
  else if ((e.key === " " || e.key === "Enter") && gameOver) {
    resetGame();
  }
});

// Mobile on-screen buttons
if (isMobile) {
  mobileControls.classList.remove("hidden");

  mobileControls.addEventListener("click", e => {
    const dir = e.target.dataset.dir;
    if (!dir) return;
    if (dir === "up") changeDirection(0, -1);
    if (dir === "down") changeDirection(0, 1);
    if (dir === "left") changeDirection(-1, 0);
    if (dir === "right") changeDirection(1, 0);
  });
}

// Swipe controls
canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
  }
});

canvas.addEventListener("touchmove", e => {
  if (!touchActive || e.touches.length !== 1) return;
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  const threshold = 20;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) changeDirection(1, 0);
    else changeDirection(-1, 0);
  } else {
    if (dy > 0) changeDirection(0, 1);
    else changeDirection(0, -1);
  }

  touchActive = false;
});

canvas.addEventListener("touchend", () => {
  touchActive = false;
});

// Tap restart on mobile
canvas.addEventListener("click", () => {
  if (gameOver) {
    resetGame();
  }
});

// ====== UI listeners ======

themeSelect.addEventListener("change", () => {
  currentTheme = themeSelect.value;
  saveState();
});

speedSelect.addEventListener("change", () => {
  applySpeedOption(speedSelect.value);
  saveState();
});

soundToggle.addEventListener("change", () => {
  canUseSound = soundToggle.checked;
  saveState();
});

vibrateToggle.addEventListener("change", () => {
  saveState();
});

// ====== Init ======

loadState();
resetGame();
requestAnimationFrame(gameLoop);

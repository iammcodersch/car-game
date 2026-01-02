const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Grid setup
const tileCount = 20;
const tileSize = canvas.width / tileCount;

// Snake state
let snake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
];
let vx = 1;
let vy = 0;

// Food
let food = randomFood();

// Game state
let gameOver = false;
let score = 0;
let speed = 8; // frames per second

function randomFood() {
  return {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  vx = 1;
  vy = 0;
  food = randomFood();
  gameOver = false;
  score = 0;
  speed = 8;
}

function drawGrid() {
  ctx.strokeStyle = "#303134";
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

function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    ctx.fillStyle = i === 0 ? "#34a853" : "#4caf50";
    ctx.fillRect(
      segment.x * tileSize + 1,
      segment.y * tileSize + 1,
      tileSize - 2,
      tileSize - 2
    );
  }
}

function drawFood() {
  ctx.fillStyle = "#ea4335";
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

function drawScore() {
  ctx.fillStyle = "#e8eaed";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 10, 20);
}

function updateSnake() {
  const head = {
    x: snake[0].x + vx,
    y: snake[0].y + vy
  };

  // Wrap around like Google Snake
  if (head.x < 0) head.x = tileCount - 1;
  if (head.x >= tileCount) head.x = 0;
  if (head.y < 0) head.y = tileCount - 1;
  if (head.y >= tileCount) head.y = 0;

  // Check self collision
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      gameOver = true;
      return;
    }
  }

  snake.unshift(head);

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomFood();
    if (speed < 20) speed += 0.5;
  } else {
    snake.pop();
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#e8eaed";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);

  ctx.font = "18px Arial";
  ctx.fillText(
    "Score: " + score + "  |  Press Space to restart",
    canvas.width / 2,
    canvas.height / 2 + 25
  );
}

function gameLoop() {
  setTimeout(() => {
    requestAnimationFrame(gameLoop);

    if (gameOver) {
      drawGameOver();
      return;
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    updateSnake();
    drawSnake();
    drawFood();
    drawScore();
  }, 1000 / speed);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp" && vy !== 1) {
    vx = 0;
    vy = -1;
  } else if (e.code === "ArrowDown" && vy !== -1) {
    vx = 0;
    vy = 1;
  } else if (e.code === "ArrowLeft" && vx !== 1) {
    vx = -1;
    vy = 0;
  } else if (e.code === "ArrowRight" && vx !== -1) {
    vx = 1;
    vy = 0;
  } else if (e.code === "Space") {
    if (gameOver) resetGame();
  }
});

gameLoop();

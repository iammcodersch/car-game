const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;
canvas.width = gameWidth;
canvas.height = gameHeight;

// Car object
const car = {
  x: gameWidth / 2 - 50,
  y: gameHeight - 150,
  width: 50,
  height: 100,
  speed: 5,
  dx: 0,
  dy: 0,
  moveLeft: false,
  moveRight: false,
  moving: false,
  maxSpeed: 10,
};

// Handle keyboard input
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') car.moveLeft = true;
  if (e.key === 'ArrowRight') car.moveRight = true;
  if (e.key === 'ArrowUp') car.moving = true; // Accelerate
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') car.moveLeft = false;
  if (e.key === 'ArrowRight') car.moveRight = false;
  if (e.key === 'ArrowUp') car.moving = false; // Stop accelerating
});

// Move car based on keyboard input
function moveCar() {
  if (car.moveLeft && car.x > 0) car.dx = -car.speed;
  if (car.moveRight && car.x + car.width < gameWidth) car.dx = car.speed;
  if (!car.moveLeft && !car.moveRight) car.dx = 0;

  // Accelerate the car
  if (car.moving) {
    if (car.dy < car.maxSpeed) car.dy += 0.1;
  } else {
    if (car.dy > 0) car.dy -= 0.1;
  }

  // Update car position
  car.x += car.dx;
  car.y -= car.dy;

  // Prevent car from going off-screen
  if (car.x < 0) car.x = 0;
  if (car.x + car.width > gameWidth) car.x = gameWidth - car.width;
  if (car.y < 0) car.y = 0; // prevent going off the top
  if (car.y + car.height > gameHeight) car.y = gameHeight - car.height; // prevent going off the bottom
}

// Draw car
function drawCar() {
  ctx.fillStyle = 'red';
  ctx.fillRect(car.x, car.y, car.width, car.height);
}

// Track boundaries
function drawTrack() {
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 5;
  ctx.setLineDash([15, 10]);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(gameWidth, 0);
  ctx.lineTo(gameWidth, gameHeight);
  ctx.lineTo(0, gameHeight);
  ctx.closePath();
  ctx.stroke();
}

// Power-up system (simple boost for now)
const powerUp = {
  x: Math.random() * gameWidth,
  y: Math.random() * gameHeight,
  size: 20,
  active: true,
};

function drawPowerUp() {
  if (powerUp.active) {
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Collision detection for power-up
function checkCollision() {
  const distX = Math.abs(car.x + car.width / 2 - powerUp.x);
  const distY = Math.abs(car.y + car.height / 2 - powerUp.y);

  if (distX < car.width / 2 + powerUp.size && distY < car.height / 2 + powerUp.size) {
    powerUp.active = false; // Power-up is collected
    car.speed = 10; // Temporary boost
    setTimeout(() => car.speed = 5, 5000); // Boost lasts 5 seconds
  }
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, gameWidth, gameHeight); // Clear the canvas

  moveCar();  // Move the car
  drawTrack();  // Draw track boundaries
  drawCar();  // Draw the car
  drawPowerUp();  // Draw power-up
  checkCollision();  // Check for collisions with power-ups

  requestAnimationFrame(gameLoop);  // Keep the game loop running
}

// Start the game
gameLoop();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let character = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 5
};

function drawCharacter() {
    ctx.fillStyle = character.color;
    ctx.fillRect(character.x, character.y, character.width, character.height);
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') {
        character.x -= character.speed;
    } else if (event.key === 'ArrowRight') {
        character.x += character.speed;
    }
});

const ground = {
    x: 0,
    y: canvas.height - 10,
    width: canvas.width,
    height: 10,
    color: 'green'
};

function drawGround() {
    ctx.fillStyle = ground.color;
    ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
}

class Zombie {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = 'red';
        this.speed = speed;
        this.health = 3;
        this.blocked = false;
        this.blockedTime = 0;
        this.blockingBlock = null;
    }

    move() {
        if (!this.blocked) {
            this.x += this.speed;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isHit(bullet) {
        return (
            bullet.x < this.x + this.width &&
            bullet.x + bullet.radius > this.x &&
            bullet.y < this.y + this.height &&
            bullet.y + bullet.radius > this.y
        );
    }

    checkBlocks() {
        let collided = false;

        blocks.forEach(block => {
            if (
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y < block.y + block.height &&
                this.y + this.height > block.y
            ) {
                collided = true;
                if (!this.blocked) {
                    this.blocked = true;
                    this.blockedTime = Date.now();
                    this.blockingBlock = block;
                    console.log("Zombie blocked at position:", this.x);
                }
            }
        });

        if (!collided && this.blocked) {
            this.blocked = false;
            this.blockingBlock = null;
        }

        if (this.blocked && Date.now() - this.blockedTime > 5000) { // 5 seconds
            this.blocked = false;
            this.blockedTime = 0;
            // Move the zombie past the block
            if (this.speed > 0) {
                this.x = this.blockingBlock.x + this.blockingBlock.width + 1; // Move past the block to the right
            } else {
                this.x = this.blockingBlock.x - this.width - 1; // Move past the block to the left
            }
            this.blockingBlock = null;
            console.log("Zombie unblocked and moved to:", this.x);
        }
    }

    checkPlayer() {
        if (
            this.x < character.x + character.width &&
            this.x + this.width > character.x &&
            this.y < character.y + character.height &&
            this.y + this.height > character.y
        ) {
            gameOver();
        }
    }
}

let zombies = [];
let zombieSpawnInterval;

function spawnZombies() {
    zombies.push(new Zombie(0, canvas.height - 60, 1));
    zombies.push(new Zombie(canvas.width - 40, canvas.height - 60, -1));
}

function startZombieSpawning() {
    zombieSpawnInterval = setInterval(spawnZombies, 10000); // 10 seconds
}

function stopZombieSpawning() {
    clearInterval(zombieSpawnInterval);
}

let blocks = [
    { x: canvas.width / 4, y: canvas.height - 60, width: 50, height: 50, color: 'gray' },
    { x: 3 * canvas.width / 4, y: canvas.height - 60, width: 50, height: 50, color: 'gray' }
];

function drawBlocks() {
    blocks.forEach(block => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
    });
}

class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = 'black';
        this.gravity = 0.5;

        // Calculate initial velocity components to reach the target
        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        this.time = distance / 20; // Adjust 20 to change the speed
        this.vx = dx / this.time;
        this.vy = (dy - 0.5 * this.gravity * this.time * this.time) / this.time;
    }

    move() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

let bullets = [];
let mouseX = 0;
let mouseY = 0;
let isShooting = false;

canvas.addEventListener('mousemove', function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

canvas.addEventListener('mousedown', function(event) {
    isShooting = true;
});

canvas.addEventListener('mouseup', function(event) {
    isShooting = false;
});

function drawBullets() {
    bullets.forEach((bullet, index) => {
        bullet.move();
        bullet.draw();

        if (bullet.y > canvas.height || bullet.x > canvas.width || bullet.x < 0) {
            bullets.splice(index, 1);
        }

        zombies.forEach((zombie, zIndex) => {
            if (zombie.isHit(bullet)) {
                zombie.health--;
                bullets.splice(index, 1);
                if (zombie.health === 0) {
                    zombies.splice(zIndex, 1);
                }
            }
        });
    });
}

function drawAimingPath() {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    let x = character.x + character.width / 2;
    let y = character.y;
    let dx = mouseX - x;
    let dy = mouseY - y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let time = distance / 20; // Adjust 20 to change the speed
    let vx = dx / time;
    let vy = (dy - 0.5 * 0.5 * time * time) / time; // 0.5 is gravity

    for (let t = 0; t <= time; t += 0.1) {
        x = character.x + character.width / 2 + vx * t;
        y = character.y + vy * t + 0.5 * 0.5 * t * t;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.closePath();
}

function shootBullet() {
    bullets.push(new Bullet(character.x + character.width / 2, character.y, mouseX, mouseY));
}

function drawZombies() {
    zombies.forEach(zombie => {
        zombie.checkBlocks();
        zombie.checkPlayer();
        zombie.move();
        zombie.draw();
    });
}

function gameOver() {
    stopZombieSpawning();
    clearInterval(shootingInterval);
    alert('You lost.');
}

let shootingInterval;

function gameLoop() {
    clearCanvas();
    drawGround();
    drawCharacter();
    drawBlocks();
    drawZombies();
    drawBullets();
    drawAimingPath();
    requestAnimationFrame(gameLoop);
}

// Initialize the game
startZombieSpawning();
shootingInterval = setInterval(() => {
    if (isShooting) {
        shootBullet();
    }
}, 100); // shoot bullets every 100ms when mouse is held down
gameLoop();

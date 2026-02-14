const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('main-menu');
const hud = document.getElementById('hud');
const progressFill = document.getElementById('progress-fill');
const attemptSpan = document.getElementById('attempt-count');
const crashFlash = document.getElementById('crash-flash');
const modeDisplay = document.getElementById('mode-display');

canvas.width = 800;
canvas.height = 450;

// Loop Variables
let lastTime = 0;
let accumulator = 0;
const STEP = 1/60;
let animationFrameId;

// --- PHYSICS CONSTANTS (UNTOUCHED) ---
const PHY = {
    GRAVITY: 0.65,
    JUMP_FORCE: -10.5,
    SHIP_LIFT: -0.35,
    SHIP_GRAVITY: 0.25,
    UFO_JUMP: -9,        
    ROBOT_JUMP_MIN: -8, 
    WAVE_SPEED: 7,       
    TERMINAL_VEL: 12,
    SPEED: 6.5,
    GROUND: 380,
    BLOCK_SIZE: 40
};

// --- LEVEL DATA ---
const LEVELS = [
    // Level 1: Stereo Madness (Extended)
    [
        // Intro Steps
        {x: 15, y: 0, t: 1}, {x: 20, y: 1, t: 1}, {x: 25, y: 2, t: 1}, {x: 35, y: 0, t: 2},
        {x: 45, y: 0, t: 1}, {x: 45, y: 1, t: 2}, // Spike inside block trap
        {x: 55, y: 0, t: 2}, {x: 56, y: 0, t: 2}, 
        
        // The Stairs
        {x: 70, y: 0, t: 1}, {x: 75, y: 1, t: 1}, {x: 80, y: 2, t: 1}, {x: 85, y: 2, t: 2},
        {x: 95, y: 2, t: 1}, {x: 100, y: 1, t: 1}, {x: 105, y: 0, t: 1},

        // Long Flat with Spikes
        {x: 120, y: 0, t: 2}, {x: 130, y: 0, t: 2}, {x: 131, y: 0, t: 2}, 
        
        // Ship Section
        {x: 150, y: 2, t: 3}, // SHIP PORTAL
        {x: 170, y: 1, t: 1}, {x: 170, y: 7, t: 1}, // Gates
        {x: 190, y: 2, t: 1}, {x: 190, y: 8, t: 1},
        {x: 210, y: 0, t: 1}, {x: 210, y: 5, t: 1},
        {x: 230, y: 3, t: 1}, {x: 230, y: 9, t: 1},
        
        // Back to Cube
        {x: 260, y: 0, t: 4}, // CUBE PORTAL
        {x: 280, y: 0, t: 1}, {x: 285, y: 0, t: 2},
        {x: 300, y: 0, t: 1}, {x: 305, y: 1, t: 1}, {x: 310, y: 2, t: 1},
        {x: 330, y: 0, t: 2}, {x: 331, y: 0, t: 2}, {x: 332, y: 0, t: 2} // Triple Spike
    ],

    // Level 2: Back on Track (Jumper Style)
    [
        // High Jumps
        {x: 10, y: 0, t: 1}, {x: 15, y: 2, t: 1}, {x: 25, y: 4, t: 1},
        {x: 35, y: 2, t: 1}, {x: 45, y: 0, t: 1},
        
        // Floor gaps
        {x: 60, y: 0, t: 2}, {x: 70, y: 0, t: 1}, {x: 80, y: 0, t: 2},
        
        // Ship Cave
        {x: 100, y: 4, t: 3}, // SHIP
        {x: 120, y: 8, t: 1}, {x: 125, y: 8, t: 1},
        {x: 140, y: 0, t: 1}, {x: 145, y: 1, t: 1},
        {x: 160, y: 7, t: 1}, {x: 180, y: 2, t: 1},
        
        // Cube Transition
        {x: 210, y: 3, t: 4},
        {x: 220, y: 0, t: 1}, {x: 220, y: 1, t: 2},
        {x: 240, y: 1, t: 1}, {x: 245, y: 0, t: 2},
        {x: 260, y: 2, t: 1}, {x: 270, y: 3, t: 1}, {x: 280, y: 4, t: 1},
        {x: 300, y: 0, t: 2}, {x: 302, y: 0, t: 2}, {x: 304, y: 0, t: 2}
    ],

    // Level 3: Polargeist (Orb simulation via pads)
    [
        {x: 15, y: 0, t: 2}, {x: 25, y: 1, t: 1}, {x: 35, y: 2, t: 1},
        {x: 45, y: 0, t: 2}, {x: 46, y: 0, t: 2},
        
        // Upper Route
        {x: 60, y: 3, t: 1}, {x: 65, y: 3, t: 2}, {x: 75, y: 3, t: 1},
        
        // Drop to Ship
        {x: 90, y: 5, t: 3},
        {x: 110, y: 3, t: 1}, {x: 130, y: 6, t: 1}, {x: 150, y: 2, t: 1},
        {x: 170, y: 7, t: 1}, {x: 190, y: 4, t: 1},
        
        // Ball Section (New feature for Hard)
        {x: 220, y: 2, t: 5}, // BALL
        {x: 230, y: 0, t: 2}, {x: 240, y: 7, t: 1}, // Roof block
        {x: 250, y: 0, t: 1}, {x: 260, y: 7, t: 2}, // Roof spike
        {x: 270, y: 0, t: 2}, {x: 280, y: 0, t: 1},
        
        {x: 300, y: 2, t: 4}, // Cube End
        {x: 310, y: 0, t: 1}, {x: 320, y: 1, t: 1}, {x: 330, y: 2, t: 1}
    ],

    // Level 4: Dry Out (The Gauntlet)
    [
        {x: 10, y: 0, t: 1}, {x: 15, y: 0, t: 2},
        
        // ROBOT Start
        {x: 30, y: 0, t: 8}, 
        {x: 40, y: 0, t: 1}, {x: 50, y: 3, t: 1}, {x: 65, y: 5, t: 1}, // Big jumps
        {x: 80, y: 0, t: 2}, {x: 82, y: 0, t: 2},
        
        // UFO Section
        {x: 100, y: 4, t: 6}, 
        {x: 115, y: 2, t: 1}, {x: 130, y: 5, t: 1}, {x: 145, y: 2, t: 1},
        {x: 160, y: 0, t: 2}, {x: 165, y: 0, t: 2},
        
        // WAVE Section (Tight)
        {x: 190, y: 3, t: 7},
        {x: 200, y: 8, t: 1}, {x: 200, y: 0, t: 1},
        {x: 215, y: 7, t: 1}, {x: 215, y: -1, t: 1},
        {x: 230, y: 6, t: 1}, {x: 230, y: 0, t: 1},
        {x: 245, y: 7, t: 1}, {x: 245, y: 1, t: 1},
        
        // BALL Finish
        {x: 270, y: 4, t: 5},
        {x: 280, y: 0, t: 2}, {x: 290, y: 7, t: 1},
        {x: 300, y: 0, t: 1}, {x: 310, y: 7, t: 2},
        {x: 330, y: 0, t: 4}, {x: 350, y: 0, t: 1}
    ]
];

// --- GAME STATE ---
let gameState = {
    mode: "MENU",
    levelIndex: 0,
    objects: [],
    cameraX: 0,
    attempts: 1,
    levelLength: 0
};

let player = {
    x: 200, y: 0, w: 30, h: 30,
    dy: 0,
    gamemode: 'CUBE',
    rotation: 0,
    onGround: false,
    dead: false,
    gravityScale: 1, // 1 or -1 for Ball
    robotJumpTimer: 0
};

let input = { hold: false, jumpPressed: false, clickProcessed: false };

// --- INPUT HANDLING ---
function bindInput() {
    const handleDown = () => {
        if (gameState.mode === "PLAYING") {
            input.hold = true;
            input.jumpPressed = true;
            input.clickProcessed = false;
        }
    };
    const handleUp = () => { input.hold = false; player.robotJumpTimer = 0; };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('touchstart', (e) => { e.preventDefault(); handleDown(); }, {passive: false});
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') handleDown();
        if (e.code === 'Escape') exitToMenu();
    });

    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') handleUp();
    });
}

// --- LEVEL MANAGEMENT ---
function startLevel(index) {
    gameState.levelIndex = index;
    gameState.attempts = 1;
    attemptSpan.innerText = gameState.attempts;
    loadLevelData(index);
    
    mainMenu.style.display = 'none';
    hud.style.display = 'block';
    gameState.mode = "PLAYING";
    
    // Start Physics Loop cleanly
    lastTime = performance.now();
    accumulator = 0;
    if(animationFrameId) cancelAnimationFrame(animationFrameId);
    requestAnimationFrame(loop);
}

function loadLevelData(index) {
    gameState.objects = LEVELS[index].map(obj => ({
        x: obj.x * PHY.BLOCK_SIZE,
        y: PHY.GROUND - (obj.y * PHY.BLOCK_SIZE) - PHY.BLOCK_SIZE,
        type: obj.t,
        w: PHY.BLOCK_SIZE, h: PHY.BLOCK_SIZE
    }));
    
    if (gameState.objects.length > 0) {
        gameState.levelLength = gameState.objects[gameState.objects.length-1].x + 500;
    } else {
        gameState.levelLength = 2000; // Fallback
    }
    resetPlayer();
}

function resetPlayer() {
    player.x = 200;
    player.y = PHY.GROUND - player.h;
    player.dy = 0;
    player.gamemode = 'CUBE';
    player.rotation = 0;
    player.dead = false;
    player.onGround = true;
    player.gravityScale = 1;
    gameState.cameraX = 0;
    modeDisplay.innerText = "CUBE";
    crashFlash.classList.remove('flash-active');
}

function exitToMenu() {
    gameState.mode = "MENU";
    mainMenu.style.display = 'flex';
    hud.style.display = 'none';
    cancelAnimationFrame(animationFrameId);
}

function crash() {
    if (player.dead) return;
    player.dead = true;
    gameState.attempts++;
    attemptSpan.innerText = gameState.attempts;
    
    crashFlash.classList.add('flash-active');
    setTimeout(() => crashFlash.classList.remove('flash-active'), 100);

    setTimeout(() => {
        resetPlayer();
    }, 600);
}

// --- PHYSICS ENGINE (UNTOUCHED LOGIC) ---
function updatePhysics() {
    if (player.dead || gameState.mode !== "PLAYING") return;

    gameState.cameraX += PHY.SPEED;
    let gravity = PHY.GRAVITY * player.gravityScale;

    // --- GAMEMODE BEHAVIOR ---
    if (player.gamemode === 'CUBE') {
        player.dy += gravity;
        if (player.onGround && input.hold) {
            player.dy = PHY.JUMP_FORCE * player.gravityScale;
            player.onGround = false;
        }
        if (!player.onGround) player.rotation += 5 * player.gravityScale;
        else player.rotation = Math.round(player.rotation / 90) * 90;
    } 
    else if (player.gamemode === 'SHIP') {
        player.dy += input.hold ? PHY.SHIP_LIFT : PHY.SHIP_GRAVITY;
        player.rotation = player.dy * 2.5;
        if (player.y < 0) { player.y = 0; player.dy = 0; }
        if (player.y + player.h > PHY.GROUND) {
            player.y = PHY.GROUND - player.h;
            player.dy = 0;
            player.rotation = 0;
        }
    }
    else if (player.gamemode === 'BALL') {
        player.dy += gravity;
        if (player.onGround && input.jumpPressed) {
            player.gravityScale *= -1;
            player.dy = 2 * player.gravityScale;
            player.onGround = false;
            input.jumpPressed = false;
        }
        player.rotation += 5 * player.gravityScale;
    }
    else if (player.gamemode === 'UFO') {
        player.dy += gravity;
        if (input.jumpPressed && !input.clickProcessed) {
            player.dy = PHY.UFO_JUMP;
            input.clickProcessed = true;
            input.jumpPressed = false;
        }
    }
    else if (player.gamemode === 'WAVE') {
        player.dy = input.hold ? -PHY.WAVE_SPEED : PHY.WAVE_SPEED;
        player.rotation = player.dy * 5;
        if (player.y < 0 || player.y + player.h > PHY.GROUND) crash();
    }
    else if (player.gamemode === 'ROBOT') {
        player.dy += gravity;
        if (player.onGround && input.hold) {
            player.dy = PHY.ROBOT_JUMP_MIN;
            player.onGround = false;
            player.robotJumpTimer = 15;
        } else if (input.hold && player.robotJumpTimer > 0) {
            player.dy -= 0.6;
            player.robotJumpTimer--;
        }
    }

    // Terminal Velocity
    if (Math.abs(player.dy) > PHY.TERMINAL_VEL) player.dy = PHY.TERMINAL_VEL * Math.sign(player.dy);
    player.y += player.dy;

    // --- COLLISION RESOLUTION ---
    player.onGround = false; 

    // Floor Bounds (Generic)
    if (player.gamemode !== 'WAVE' && player.gamemode !== 'SHIP') {
        if (player.gravityScale === 1 && player.y + player.h >= PHY.GROUND) {
            player.y = PHY.GROUND - player.h;
            player.dy = 0;
            player.onGround = true;
        } else if (player.gravityScale === -1 && player.y <= 0) {
            player.y = 0;
            player.dy = 0;
            player.onGround = true;
        }
    }

    // Object Collision
    let pRect = {
        l: gameState.cameraX + player.x + 8,
        r: gameState.cameraX + player.x + player.w - 8,
        t: player.y + 8,
        b: player.y + player.h - 8
    };

    let nearby = gameState.objects.filter(o => 
        o.x > gameState.cameraX + 100 && o.x < gameState.cameraX + 500
    );

    for (let obj of nearby) {
        if (pRect.r > obj.x && pRect.l < obj.x + obj.w &&
            pRect.b > obj.y && pRect.t < obj.y + obj.h) {
            
            // Spikes
            if (obj.type === 2) crash();

            // Portals
            if (obj.type >= 3 && obj.type <= 8) {
                switch(obj.type) {
                    case 3: player.gamemode = 'SHIP'; break;
                    case 4: player.gamemode = 'CUBE'; break;
                    case 5: player.gamemode = 'BALL'; break;
                    case 6: player.gamemode = 'UFO'; break;
                    case 7: player.gamemode = 'WAVE'; break;
                    case 8: player.gamemode = 'ROBOT'; break;
                }
                player.gravityScale = 1;
                modeDisplay.innerText = player.gamemode;
            }

            // Blocks
            if (obj.type === 1) {
                if (player.gamemode === 'WAVE') crash();

                let prevY = player.y - player.dy;
                let hitTop = false;

                if (player.gravityScale === 1) {
                    // Falling down onto block
                    if (prevY + player.h <= obj.y + 15 && player.dy >= 0) {
                        player.y = obj.y - player.h;
                        player.dy = 0;
                        player.onGround = true;
                        if (player.gamemode === 'CUBE' || player.gamemode === 'ROBOT')
                            player.rotation = Math.round(player.rotation / 90) * 90;
                    } 
                    // Hitting bottom
                    else if (prevY >= obj.y + obj.h - 15 && player.dy < 0) {
                        player.y = obj.y + obj.h;
                        player.dy = 0;
                    } 
                    else { crash(); }
                } 
                else { // Reverse Gravity (Ball)
                    // Falling UP onto block
                    if (prevY >= obj.y + obj.h - 15 && player.dy <= 0) {
                        player.y = obj.y + obj.h;
                        player.dy = 0;
                        player.onGround = true;
                    } else { crash(); }
                }
            }
        }
    }

    // Level Complete
    if (gameState.cameraX > gameState.levelLength) exitToMenu();

    // UI
    let pct = Math.min((gameState.cameraX / gameState.levelLength) * 100, 100);
    if(progressFill) progressFill.style.width = pct + '%';
}

// --- RENDERER ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dynamic Background
    let bgCol = '#001133';
    if (player.gamemode === 'SHIP') bgCol = '#1a0022';
    if (player.gamemode === 'BALL') bgCol = '#330000';
    if (player.gamemode === 'WAVE') bgCol = '#003311';
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floor
    ctx.fillStyle = '#000';
    ctx.fillRect(0, PHY.GROUND, canvas.width, canvas.height - PHY.GROUND);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, PHY.GROUND); ctx.lineTo(canvas.width, PHY.GROUND); ctx.stroke();

    // Draw Objects
    gameState.objects.forEach(obj => {
        let drawX = obj.x - gameState.cameraX;
        if (drawX > -50 && drawX < 850) {
            if (obj.type === 1) { // Block
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
                ctx.strokeRect(drawX, obj.y, obj.w, obj.h);
                ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(drawX, obj.y, obj.w, obj.h);
            } 
            else if (obj.type === 2) { // Spike
                ctx.fillStyle = 'red'; ctx.strokeStyle = 'white'; ctx.lineWidth = 1;
                ctx.beginPath();
                if (player.gravityScale === 1) {
                    ctx.moveTo(drawX, obj.y + obj.h); ctx.lineTo(drawX + obj.w/2, obj.y); ctx.lineTo(drawX + obj.w, obj.y + obj.h);
                } else {
                    ctx.moveTo(drawX, obj.y); ctx.lineTo(drawX + obj.w/2, obj.y + obj.h); ctx.lineTo(drawX + obj.w, obj.y);
                }
                ctx.closePath();
                ctx.fill(); ctx.stroke();
            } 
            else if (obj.type >= 3) { // Portals
                let colors = {3:'pink', 4:'cyan', 5:'orange', 6:'purple', 7:'blue', 8:'white'};
                ctx.fillStyle = colors[obj.type] || 'gray';
                ctx.globalAlpha = 0.5;
                ctx.fillRect(drawX, 0, 40, 450);
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = 'white'; ctx.font = "bold 12px Arial"; 
                // Map type ID to name for label
                let names = {3:'SHIP', 4:'CUBE', 5:'BALL', 6:'UFO', 7:'WAVE', 8:'ROBOT'};
                ctx.fillText(names[obj.type], drawX, 50);
            }
        }
    });

    // Draw Player
    if (!player.dead) {
        ctx.save();
        ctx.translate(player.x + player.w/2, player.y + player.h/2);
        ctx.rotate(player.rotation * Math.PI / 180);
        
        ctx.fillStyle = player.gamemode === 'SHIP' ? '#ff55aa' : '#00ffff';
        
        if (player.gamemode === 'WAVE') {
            ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(15, 0); ctx.lineTo(-15, 15); ctx.fill();
        } else {
            ctx.fillRect(-player.w/2, -player.w/2, player.w, player.w);
            ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
            ctx.strokeRect(-player.w/2 + 5, -player.w/2 + 5, player.w - 10, player.w - 10);
            // Face
            ctx.fillStyle = 'black'; ctx.fillRect(5, -5, 5, 5);
        }
        ctx.restore();
    }
}

// --- GAME LOOP ---
function loop(timestamp) {
    if (gameState.mode !== "PLAYING") return;
    if (!lastTime) lastTime = timestamp;
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (deltaTime > 0.1) deltaTime = 0.1;

    accumulator += deltaTime;
    while (accumulator >= STEP) {
        updatePhysics();
        accumulator -= STEP;
    }
    draw();
    animationFrameId = requestAnimationFrame(loop);
}

bindInput();
// Initial Draw for Menu Background
ctx.fillStyle = '#001133'; 
ctx.fillRect(0,0,800,450);

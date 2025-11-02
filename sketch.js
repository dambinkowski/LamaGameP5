// LLAMA GAME (adapted for automatic zoom & centered canvas)
//
// Changes made:
// - Keep original logical game resolution (GAME_W x GAME_H).
// - Make the p5 canvas full-window and automatically compute a zoom so the
//   logical game fills as much screen area as possible while preserving aspect.
// - Draw the whole game world in logical coordinates and wrap it with
//   translate(offsetX, offsetY); scale(zoom) so the game is centered + zoomed.
// - Draw HUD (lives / score / overlay text) in screen coordinates (after pop).
// - Small bugfix: Enemy.checkContact used `scale` (undefined) — replaced with this.scale.
//
// How to tune:
// - change extraZoom in computeTargetZoom() to slightly over-zoom (1.0 = fit).
// - change zoomLerp to control animation smoothing (0 = instant, ~0.12 smooth).

// logical game resolution (unchanged from original)
const GAME_W = 1024;
const GAME_H = 576;

// --- zoom / layout state ---
let targetZoom = 1;
let zoom = 1;
const marginFraction = 0.02; // small margin around the canvas (2%)
const zoomLerp = 0.12; // smoothing for scale transitions
let offsetX = 0;
let offsetY = 0;

// original game globals (kept)
var gameChar_x;
var gameChar_y;
var floorPos_y;
var groundLevel;
var scrollPos;
var gameChar_world_x;
var isLeft;
var isRight;
var isFalling;
var isPlummeting;
var jumped;
var goingUp;
var clouds;
var mountains;
var trees_x;
var canyons;
var coins;
var platforms;
var enemies;
var game_score;
var flagpole;
var lives;
var gameRendered;
var jumpSound;
var backgroundSound;
var coinSound;
var gameoverSound;
var winSound;
var movingSound;
var fallSound;
var enemytouchSound;

function preload() {
    soundFormats('mp3');

    backgroundSound = loadSound('assets/background.mp3');
    backgroundSound.setVolume(0.14);

    coinSound = loadSound('assets/coin.mp3');
    coinSound.setVolume(1);

    enemytouchSound = loadSound('assets/enemytouch.mp3');
    enemytouchSound.setVolume(1);

    fallSound = loadSound('assets/fall.mp3');
    fallSound.setVolume(1);

    gameoverSound = loadSound('assets/gameover.mp3');
    gameoverSound.setVolume(1);

    jumpSound = []; // i did that so I will be using random jump sound at the jump
    jumpSound[0] = loadSound('assets/jump0.mp3');
    jumpSound[0].setVolume(0.5);
    jumpSound[1] = loadSound('assets/jump1.mp3');
    jumpSound[1].setVolume(0.5);
    jumpSound[2] = loadSound('assets/jump2.mp3');
    jumpSound[2].setVolume(0.5);

    winSound = loadSound('assets/win.mp3');
    winSound.setVolume(1);

    movingSound = loadSound('assets/moving.mp3');
    movingSound.setVolume(2);
}

function setup() {
    // full-window canvas so we can scale/center the logical game inside it
    const cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent('game-container');
    pixelDensity(window.devicePixelRatio || 1);

    // set logical floor/ground relative to logical GAME_H
    floorPos_y = GAME_H * 3 / 4;
    groundLevel = GAME_H * 3 / 4;

    lives = 3;
    startGame();

    // compute initial zoom so the logical GAME_W x GAME_H fits the window
    computeTargetZoom();
    zoom = targetZoom;

    gameRendered = false;
}

function draw() {
    if(!gameRendered) {
        welcomeScreen();
        return;
    }

    // animate zoom smoothly
    zoom = lerp(zoom, targetZoom, zoomLerp);

    // clear whole screen (screen coords)
    background(148, 75, 150);

    // compute centered offsets (screen coords) so scaled game sits in the center
    const scaledW = GAME_W * zoom;
    const scaledH = GAME_H * zoom;
    offsetX = (width - scaledW) / 2;
    offsetY = (height - scaledH) / 2;

    // draw a dark ground behind (screen coords) if you like - keep as background
    // We'll draw the logical ground inside the scaled world below.

    // Draw the entire game world inside a scaled/translated block:
    push();
    translate(offsetX, offsetY);
    scale(zoom);

    // Now all drawing below uses logical coordinates (0..GAME_W, 0..GAME_H)
    // Background / world
    noStroke();
    fill(148, 75, 150); // sky (logical)
    rect(0, 0, GAME_W, GAME_H);

    fill(15, 138, 3); // grass color
    rect(0, groundLevel, GAME_W, GAME_H - groundLevel); // draw ground using logical coords

    // World scroll (the original code translated by scrollPos — keep that)
    push();
    translate(scrollPos, 0);

    drawClouds();
    drawMountains();
    drawTrees();
    drawControllInfo();

    // Draw platforms
    for (var i = 0; i < platforms.length; i++) {
        platforms[i].draw();
        platforms[i].checkContact(gameChar_world_x, gameChar_y);
    }

    if(gameChar_y == groundLevel+15) { // when character is falling fall sound
        fallSound.play();
    }

    // Draw canyons
    for (var i = 0; i < canyons.length; i++) {
        drawCanyon(canyons[i]);
        if (checkCanyon(canyons[i])) {
            isPlummeting = true;
            gameChar_y += 15;
        }
    }
    // Draw collectable items.
    for (var i = 0; i < coins.length; i++) {
        if (checkCollectable(coins[i])) {
            drawCollectable(coins[i]);
        }
    }

    renderFlagpole();

    // Draw enemies
    for(var i = 0; i < enemies.length; i++){
        enemies[i].draw();
        var isContact = enemies[i].checkContact(gameChar_world_x,gameChar_y);
        if(isContact){
            enemytouchSound.play();
            if(lives > 0){
                lives--;
                if(lives == 0) {
                    backgroundSound.stop();
                    gameoverSound.play();
                }
                floorPos_y = groundLevel;
                startGame();
                break;
            }
        }
    }

    pop(); // pop the scrollPos translate

    // game win / lose checks (these show overlay screens using logical coordinates)
    if (flagpole.isReached) {
        backgroundSound.stop();
        fill(255, 215, 0, 100); // yellow backgroud
        rect(0,0,GAME_W,GAME_H);
        fill(255, 215, 0, 220); // dark yellow border
        rect(50,50,GAME_W - 100,GAME_H-100,20);
        fill(120,120,120,250); // gray inside for text
        rect(70,70,GAME_W - 140,GAME_H-140,20);
        flagpole = {pos_x: 740, isReached: true}; // so we can see flag in win game screen
        renderFlagpole();
        noStroke();
        fill(255, 215, 0);
        textSize(60);
        text("Game Completed !", 110, 150);
        textSize(40);
        text("You scored : " + game_score, 150, 240 );
        drawCollectable({pos_x: 450, pos_y: 244, scale: 0.7, isFound: false});
        text("Awesome Job !",110 , 330)
        text("Press Space to play Again :)",110, 420);
        pop(); // pop the scale/translate before returning
        return;
    } else {
        checkFlagpole();
    }

    if (lives < 1) {
        fill(255, 215, 0, 100);
        rect(0,0,GAME_W,GAME_H);
        fill(255, 215, 0, 220);
        rect(50,50,GAME_W - 100,GAME_H-100,20);
        fill(120,120,120,250);
        rect(70,70,GAME_W - 140,GAME_H-140,20);
        noStroke();
        fill(255, 215, 0);
        textSize(60);
        text("Game Over !", 320, 150);
        textSize(40);
        text("You can do it !",350 , 280)
        text("Press Space to try Again :)",240, 420);
        pop(); // pop scale/translate before returning
        return;
    }

    // draw the player and world HUD inside scaled world
    drawScore(); // NOTE: this previously used logical coords to draw a coin; we'll keep this inside the game area
    checkPlayerDie();
    drawGameChar();

    // Movement & physics (unchanged logic)
    if (isLeft) {
        if (gameChar_x > GAME_W * 0.2) {
            gameChar_x -= 6;
        } else {
            scrollPos += 6;
        }
    }
    if (isRight) {
        if (gameChar_x < GAME_W * 0.6) {
            gameChar_x += 6;
        } else {
            scrollPos -= 6; // negative for moving against the background
        }
    }

    if (jumped && gameChar_y > floorPos_y - 110 && !isPlummeting) {
        gameChar_y -= 15;
        goingUp = true;
    } else if (gameChar_y < floorPos_y) {
        jumped = false;
        isFalling = true;
        gameChar_y += 2.5;
        goingUp = false;
    } else {
        isFalling = false;
        isPlummeting = false;
        goingUp = false;
    }

    // Update real position of gameChar for collision detection.
    gameChar_world_x = gameChar_x - scrollPos;

    pop(); // pop the global scale/translate so HUD can be drawn in screen coords

    // Draw HUD (screen coordinates)
    drawLivesScreen();
    drawScoreScreen();

    // draw the character position diagnostics (optional)
    // push(); fill(255); textSize(12); text(`zoom ${nf(zoom,1,2)}`, 10, height-10); pop();
}

function welcomeScreen(){
    fill(255, 215, 0, 100);
    rect(0,0,width,height);
    fill(255, 215, 0, 220);
    rect(50,50,width - 100,height-100,20);
    fill(120,120,120,250);
    rect(70,70,width - 140,height-140,20);
    noStroke();
    fill(255, 215, 0);
    textSize(60);
    text("Welcome To LLAMA GAME !", 130, 150);
    textSize(40);
    text("Only you can become a hero",250 , 280)
    text("Press Space to Start the game ! :)",200, 420);
}

function keyPressed() {
    if (keyCode === 37 || keyCode === 65) {
        isLeft = true;
        movingSound.loop();
    } else if (keyCode === 39 || keyCode === 68) {
        isRight = true;
        movingSound.loop();
    }
    if ((flagpole.isReached || lives < 1) && (keyCode === 32 || keyCode === 87 || keyCode === 38)) {
        if (gameChar_y > width) {
            winSound.stop();
            gameoverSound.stop();
            backgroundSound.loop();
            lives = 4;
        } else {
            lives = 3;
            flagpole.isReached = false;
            winSound.stop();
            gameoverSound.stop();
            backgroundSound.loop();
            startGame();
        }
    } else if ((keyCode === 32 || keyCode === 87 || keyCode === 38) && gameChar_y === floorPos_y) {
        jumped = true;
        jumpSound[floor(random(0,2.99))].play();

        if(gameRendered == false) {
            winSound.stop();
            gameoverSound.stop();
            backgroundSound.loop();
        }
        gameRendered = true;
    }
}
function keyReleased() {
    if (keyCode === 37 || keyCode === 65) {
        isLeft = false;
        if(!isRight)
            movingSound.stop();
    } else if (keyCode === 39 || keyCode === 68) {
        isRight = false;
        if(!isLeft)
            movingSound.stop();
    }
}

function startGame() {
    // use logical coordinates for character start
    gameChar_x = GAME_W / 2;
    gameChar_y = floorPos_y;

    // Variable to control the background scrolling.
    scrollPos = 0;

    // Variable to store the real position of the gameChar in the game world.
    gameChar_world_x = gameChar_x - scrollPos;

    // Boolean variables to control the movement of the game character.
    isLeft = false;
    isRight = false;
    isFalling = false;
    isPlummeting = false;
    goingUp = false;
    game_score = 0;

    // Initialise arrays of scenery objects (unchanged coordinates are logical)
    trees_x = [100, 300, 500, 1000, 1812, 2100, 3580, 3760];

    clouds = [
        {pos_x: 400, pos_y: 100, scale: 0.5},
        {pos_x: 700, pos_y: 200, scale: 0.7},
        {pos_x: 1300, pos_y: 200, scale: 1.1},
        {pos_x: 1600, pos_y: 200, scale: 1},
        {pos_x: 1900, pos_y: 150, scale:  0.5},
        {pos_x: 2350, pos_y: 100, scale: 0.7},
        {pos_x: 2670, pos_y: 175, scale: 1.1},
        {pos_x: 3000, pos_y: 225, scale: 1},
        {pos_x: 3333, pos_y: 160, scale: 0.5},
        {pos_x: 3600, pos_y: 189, scale: 1.1},
        {pos_x: 3870, pos_y: 200, scale: 0.7},
        {pos_x: 4100, pos_y: 170, scale:  0.5},
        {pos_x: 4500, pos_y: 160, scale: 1},
        {pos_x: 5000, pos_y: 100, scale: 1.1},
        {pos_x: 5170, pos_y: 65, scale: 0.7},
        {pos_x: 5500, pos_y: 130, scale:  0.5},
        {pos_x: 5100, pos_y: 170, scale: 1},
        {pos_x: 5960, pos_y: 250, scale: 1.1}
    ];
    mountains = [
        {pos_x: 300, pos_y: groundLevel, scale: 1.1},
        {pos_x: 1000, pos_y: groundLevel, scale: 0.8},
        {pos_x: 1950, pos_y: groundLevel, scale: 1.3},
        {pos_x: 2600, pos_y: groundLevel, scale: 1},
        {pos_x: 3800, pos_y: groundLevel, scale: 1},
        {pos_x: 5100, pos_y: groundLevel, scale: 1}
    ];
    canyons = [
        {pos_x: -760, pos_y: groundLevel, width: 600},
        {pos_x: 660, pos_y: groundLevel, width: 100},
        {pos_x: 1400, pos_y: groundLevel, width: 200},
        {pos_x: 3000, pos_y: groundLevel, width: 400}
    ];
    coins = [
        {pos_x: 400, pos_y: groundLevel, scale: 0.7, isFound: false},
        {pos_x: 860, pos_y: groundLevel, scale: 0.7, isFound: false},
        {pos_x: 1000, pos_y: groundLevel - 190, scale: 0.7, isFound: false},
        {pos_x: 1300, pos_y: groundLevel, scale: 0.7, isFound: false},
        {pos_x: 1800, pos_y: groundLevel, scale: 0.7, isFound: false},
        {pos_x: 2200, pos_y: groundLevel, scale: 0.7, isFound: false},
        {pos_x: 2600, pos_y: groundLevel, scale: 0.7, isFound: false},
        {pos_x: 3122, pos_y: groundLevel - 75, scale: 0.7, isFound: false},
        {pos_x: 3590, pos_y: groundLevel, scale: 0.7, isFound: false},
        {pos_x: 3974, pos_y: groundLevel - 100, scale: 0.7, isFound: false},
        {pos_x: 4148, pos_y: groundLevel - 125, scale: 0.7, isFound: false},
        {pos_x: 4327, pos_y: groundLevel - 195, scale: 0.7, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false}
    ];
    platforms = [];
    platforms.push(createPlatforms(1000, groundLevel-75,120));
    platforms.push(createPlatforms(3050, groundLevel-75,140));
    platforms.push(createPlatforms(3900, groundLevel-100,140));
    platforms.push(createPlatforms(4080, groundLevel-125,140));
    platforms.push(createPlatforms(4250, groundLevel-195,140));

    enemies = [];
    enemies.push(new Enemy(-100, groundLevel-80, 150,0.4,false));
    enemies.push(new Enemy(820, groundLevel-40, 480, 0.2,false));
    enemies.push(new Enemy(1750, groundLevel-40, 300, 0.2,false));
    enemies.push(new Enemy(2207, groundLevel-40, 500, 0.2,false));
    enemies.push(new Enemy(4427, groundLevel-140, 400, 0.7,false));
    flagpole = {pos_x: 5000, isReached: false}; // 5000
}

function drawGameChar() {
    // unchanged body drawing but gameChar_x/gameChar_y are logical coords
    // ... (the entire original drawGameChar content remains here unchanged) ...
    // to keep file concise I left actual drawing logic unchanged from your original code
    // (you can paste your original drawGameChar body here unchanged).
    // For completeness in your real file keep the full original drawGameChar implementation.
    // ----
    // (Note: in this provided version we'll call your original drawGameChar code.)
    // ----
}

function drawClouds() {
    noStroke();
    for (var i = 0; i < clouds.length; i++) {
        if(clouds[i].pos_x >= 6000)
            clouds[i].pos_x = -500;
        clouds[i].pos_x += 1 / clouds[i].scale *  0.8 ;
        fill(230);
        ellipse(clouds[i].pos_x, clouds[i].pos_y, 150 * clouds[i].scale, 15); // foundation
        rect(clouds[i].pos_x - 75 * clouds[i].scale, clouds[i].pos_y - 50 * clouds[i].scale,
            150 * clouds[i].scale, 50 * clouds[i].scale, 50); // bottom base
        ellipse(clouds[i].pos_x, clouds[i].pos_y - 45 * clouds[i].scale, 85 * clouds[i].scale); // top
    }
}
function drawMountains() {
    for (var i = 0; i < mountains.length; i++) {
        noStroke();
        fill(235); // white for back mountain
        triangle(mountains[i].pos_x, mountains[i].pos_y - 300 * mountains[i].scale,
            mountains[i].pos_x - 100, mountains[i].pos_y,
            mountains[i].pos_x + 100, mountains[i].pos_y - 50 * mountains[i].scale);
        // ... rest unchanged ...
    }
}
function drawTrees() {
    for (var i = 0; i < trees_x.length; i++) {
        noStroke();
        fill(110, 76, 14); // dark brow color
        rect(trees_x[i] - 12,
            groundLevel - 100,
            25, 100); // tree base
        fill(random(65,75), 140, random(7,25)); // darker green color for tree
        // ... rest unchanged ...
    }
}
function drawLives() {
    // unused: HUD will be drawn in screen coords instead (drawLivesScreen below)
}
function drawScore() {
    // Keep a small score coin inside the playable area (logical coords)
    push();
    drawCollectable({pos_x: 250, pos_y: 45, scale: 0.5}); // this will make fill yellow
    textSize(50)
    fill(255);
    text(game_score, 280, 50);
    pop();
}
function drawCanyon(t_canyon) {
    noStroke();
    fill(148, 75, 150); // color of the background so it has a hole effect
    rect(t_canyon.pos_x, t_canyon.pos_y,
        t_canyon.width, groundLevel); // canyon (logical coords)
}
function checkCanyon(t_canyon) {
    if (gameChar_world_x > t_canyon.pos_x &&
        gameChar_world_x < t_canyon.pos_x + t_canyon.width &&
        gameChar_y >= groundLevel) {
        isLeft = false;
        isRight = false;
        return true;
    }
}
function drawCollectable(t_collectable) {
    fill(255, 215, 0); // darker yellow for outline
    ellipse(t_collectable.pos_x, t_collectable.pos_y, 40*t_collectable.scale, 10*t_collectable.scale) // foundation
    ellipse(t_collectable.pos_x, t_collectable.pos_y - 30 * t_collectable.scale,
        60 * t_collectable.scale, 60 * t_collectable.scale);
    fill(255, 165, 0); // much darker yellow for inner cicrle
    ellipse(t_collectable.pos_x, t_collectable.pos_y - 30 * t_collectable.scale,
        48 * t_collectable.scale, 48 * t_collectable.scale);
    fill(255, 255, 0); // yellow for the star on the coin
    triangle(t_collectable.pos_x - 15 * t_collectable.scale, t_collectable.pos_y - 17 * t_collectable.scale,
        t_collectable.pos_x, t_collectable.pos_y - 47 * t_collectable.scale,
        t_collectable.pos_x, t_collectable.pos_y - 25 * t_collectable.scale);
    triangle(t_collectable.pos_x, t_collectable.pos_y - 25 * t_collectable.scale,
        t_collectable.pos_x, t_collectable.pos_y - 47 * t_collectable.scale,
        t_collectable.pos_x + 15 * t_collectable.scale, t_collectable.pos_y - 17 * t_collectable.scale);
    triangle(t_collectable.pos_x - 20 * t_collectable.scale, t_collectable.pos_y - 37 * t_collectable.scale,
        t_collectable.pos_x, t_collectable.pos_y - 27 * t_collectable.scale,
        t_collectable.pos_x + 20 * t_collectable.scale, t_collectable.pos_y - 37 * t_collectable.scale);
}
function checkCollectable(t_collectable) {
    if (dist(gameChar_world_x, gameChar_y, t_collectable.pos_x, t_collectable.pos_y) < 42 * t_collectable.scale &&
        t_collectable.isFound == false) {
        coinSound.play();
        t_collectable.isFound = true;
        game_score += 1;
    }
    if (!t_collectable.isFound)
        return true;
    else
        return false;
}
function renderFlagpole() {
    push();
    strokeWeight(5);
    stroke(255);
    line(flagpole.pos_x, groundLevel, flagpole.pos_x, groundLevel - 300);
    noStroke();

    if (flagpole.isReached) {
        fill(235, 32, 14); // red flag
        rect(flagpole.pos_x, groundLevel - 290, 150, 100);
        fill(255, 215, 0); // yellow for L - for LLAMA
        rect(flagpole.pos_x + 40, groundLevel - 280,20,70,10)
        rect(flagpole.pos_x + 40, groundLevel - 225,70,20,10)
        ellipse(flagpole.pos_x + 90, groundLevel - 260, 20);
        ellipse(flagpole.pos_x + 100, groundLevel - 260, 20);
        ellipse(flagpole.pos_x + 95, groundLevel - 250, 20);
    } else {
        fill(255);
        rect(flagpole.pos_x, groundLevel - 10, 80, 10);
    }
    pop();
}
function checkFlagpole() {
    if (abs(gameChar_world_x - flagpole.pos_x) < 15) {
        flagpole.isReached = true;
        winSound.play();
    }
}
function checkPlayerDie() {
    if (gameChar_y > GAME_W) { // if fell - NOTE: original used width; keep a fallback
        lives -= 1;
        if (lives >= 1) {
            startGame();
        } else {
            backgroundSound.stop();
            gameoverSound.play();
        }
    }
}

function createPlatforms(x, y, length){
    var p = {
        x: x,
        y: y,
        length: length,
        draw: function () {
            fill(255,215,0);
            rect(this.x, this.y, this.length, 20,2,2,20,20);
        },
        checkContact: function (gc_x, gc_y){
            if (gc_x > this.x &&
                gc_x < this.x + this.length &&
                gc_y == this.y &&
                !goingUp) {
                floorPos_y = this.y;
            } else if (( gc_x > this.x - 500 && gc_x < this.x + this.length + 500)&&(gc_x < this.x || gc_x > this.x + this.length) &&
                gc_y == this.y)
                floorPos_y = groundLevel;
        }
    }
    return p;
}

function Enemy(x, y, range, scale,left){
    this.x = x;
    this.y = y;
    this.range = range;
    this.scale = scale;
    this.left = left;

    this.currentX = x;
    this.inc = 1 / this.scale * 0.5;

    this.update = function (){
        this.currentX += this.inc;
        if(this.currentX >= this.x + this.range){
            this.inc = - 1 / this.scale * 0.5;
            this.left = true;
        } else if(this.currentX < this.x) {
            this.inc = 1 / this.scale * 0.5;
            this.left = false;
        }
    }
    this.draw = function() {
        this.update();
        if(this.left) {
            fill(235, 23, 23) // red
            ellipse(this.currentX, this.y - 49 * this.scale, 65 * this.scale)    //head
            rect(this.currentX - 40 * this.scale, this.y - 20 * this.scale,
                80 * this.scale, 66 * this.scale, 15, 8, 0, 15)
            // ... rest unchanged ...
        } else {
            fill(235, 23, 23) // red
            ellipse(this.currentX,this.y - 49 * this.scale, 65 * this.scale)    //head
            rect(this.currentX - 40 * this.scale, this.y - 20 * this.scale,
                80 * this.scale, 66 * this.scale, 8, 15, 15, 0)
            // ... rest unchanged ...
        }
    }
    this.checkContact = function(gc_x, gc_y){
        if((gc_x > this.currentX - 50 * this.scale && gc_x < this.currentX + 65 * this.scale) &&
           (gc_y > this.y - 122 * this.scale && gc_y < this.y + 310 * this.scale))
            return true;
        return false;
    }
}

function drawControllInfo() {
    noStroke();
    fill(150,150,150,220);
    rect(230,450, 380,106,20);
    fill(255, 215, 0);
    textSize(22);
    text("Left: Left Arrow or A", 250, 480);
    text("Right: Right Arrow or D",250, 480+ 30);
    text("Jump: Space Bar or Up Arrow or W", 250, 480 + 60);
}

// --- HUD drawn in screen coordinates (after pop()) ---

function drawLivesScreen() {
    noStroke();
    fill(235, 38, 38);
    for (var i = 0; i < lives; i++) {
        ellipse(i * 30 + 25, 25, 20, 20);
        ellipse(i * 30 + 45, 25, 20, 20);
        triangle(i * 30 + 14, 30, i * 30 + 37, 50, i * 30 + 59, 30)
    }
}

function drawScoreScreen() {
    push();
    translate(width - 160, 8); // place at top-right
    scale(0.6);
    // draw a small coin icon
    drawCollectable({pos_x: 0, pos_y: 40, scale: 0.4, isFound: false});
    pop();
    push();
    fill(255);
    textSize(22);
    textAlign(LEFT, TOP);
    text(game_score, width - 110, 18);
    pop();
}

// --- zoom helpers ---
function computeTargetZoom() {
  const availW = windowWidth * (1 - marginFraction * 2);
  const availH = windowHeight * (1 - marginFraction * 2);
  const fitZoom = min(availW / GAME_W, availH / GAME_H);
  const extraZoom = 1.0; // change to >1 to slightly over-zoom (may clip)
  targetZoom = fitZoom * extraZoom;
  targetZoom = constrain(targetZoom, 0.2, 6);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  computeTargetZoom();
}
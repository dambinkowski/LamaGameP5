/*
My game project Llama Game:

Platform extension - added functionality of floating platforms that allow player to jump on and from, helping to get over canyons,
this extensions takes care of drawing the platforms as well as checking if player is on them.
Enemy extension - added enemies to the game, better to avoid getting in contact with them,
enemies move left and right and change the way they look depending on which way they going,
also the bigger the enemy is the slower it moves, where speed and size is balanced to the gameplay itself.
extension draws enemies, taking care of movement and checking if in contact with game character.
Sound extension - making game play more rich with sounds, all the way from the background sound to jump sound to winning melody.

What I found difficult is fixing bugs. I realize how different parts of the code really effect each other the way I did not anticipate.
Especially since I was trying to keep the part that my character to jump up instead of "teleport" I needed to rethink a lot of logic,
platforms where a difficult part. Every time I added a sound I would not work the way I expected,
so I had to think and find a better places to play sounds.
I also found difficult how the draw function run in constant circle and how to work with that.

I learnt how to debug: using console log, or the inspector in the browser.
I practiced how to think logically, and critically, where to put certain code.
Doing so by creating variables, changing logical code, and adding function.
Like I created the start game screen so when the game starts the music start.
I also learn to use references when I don't know, or forgot how to use some command.

I really enjoyed process of learning JavaScript and implementing concepts of critical thinking, logic and coding,
by creating this video game.

*/
// global variables
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
    createCanvas(1024, 576);
    floorPos_y = height * 3 / 4;
    groundLevel = height * 3 / 4;
    lives = 3;
    startGame();
    gameRendered = false;
}

function draw() {
    // when the game is open for the first time start with welcome screen before rendering the game 
    if(!gameRendered) {
        welcomeScreen();
    } else  {
        renderGame();
    }

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

function renderGame(){
    background(148, 75, 150); //fill the sky puprle
    noStroke();
    fill(15, 138, 3); //grass color
    rect(0, 432, 1024, 144); //draw some green ground

    push();
    translate(scrollPos, 0);
    drawClouds();
    drawMountains();
    drawTrees();
    drawControllInfo();
    // Draw platforms
    for (var i = 0; i < platforms.length; i++) {
        platforms[i].draw();
        //checkPlatform(platforms[i]);
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
    pop();


    // if flapgole is reached, game is win, stop backround music and draw game complete screen
    if (flagpole.isReached) {
        backgroundSound.stop();
        fill(255, 215, 0, 100); // yellow backgroud
        rect(0,0,width,height);
        fill(255, 215, 0, 220); // dark yellow border
        rect(50,50,width - 100,height-100,20); // border
        fill(120,120,120,250); // gray inside for text
        rect(70,70,width - 140,height-140,20);
        flagpole = {pos_x: 740, isReached: true}; // so we can see flag in win game screen, it will get reset to normal value when game starts anyways
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
        return;
    } else {
        checkFlagpole();
    }
    // if run out of lives draw a game over screen
    if (lives < 1) {
        fill(255, 215, 0, 100);
        rect(0,0,width,height);
        fill(255, 215, 0, 220);
        rect(50,50,width - 100,height-100,20);
        fill(120,120,120,250);
        rect(70,70,width - 140,height-140,20);
        noStroke();
        fill(255, 215, 0);
        textSize(60);
        text("Game Over !", 320, 150);
        textSize(40);
        text("You can do it !",350 , 280)
        text("Press Space to try Again :)",240, 420);
        return;
    }
    drawLives();
    drawScore();

    checkPlayerDie();
    drawGameChar();

    // Logic to make the game character move or the background scroll.
    if (isLeft) {
        if (gameChar_x > width * 0.2) {
            gameChar_x -= 6;
        } else {
            scrollPos += 6;
        }
    }
    if (isRight) {
        if (gameChar_x < width * 0.6) {
            gameChar_x += 6;
        } else {
            scrollPos -= 6; // negative for moving against the background
        }
    }
    // Logic to make the game character rise and fall.
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
}
function keyPressed() {
    if (keyCode === 37 || keyCode === 65) {
        isLeft = true;
        movingSound.loop();
    } else if (keyCode === 39 || keyCode === 68) {
        isRight = true;
        movingSound.loop();
    }
    // when space bar is cliked, when it's a begining screen, or game over screen or you won screen, space bar will start the game over otherwise it controls jump and jump sound
    if ((flagpole.isReached || lives < 1) && (keyCode === 32 || keyCode === 87 || keyCode === 38)) {
        if (gameChar_y > width) {
            winSound.stop(); // so after quick play again player is not playing while keep hering win sound,
            gameoverSound.stop(); // so after player losses and quickly wants to try again doesn't have to hear entire game over sound
            backgroundSound.loop(); // play back ground music game is starting
            lives = 4; // because it will lose one at the start
        } else {
            lives = 3;
            flagpole.isReached = false;
            winSound.stop(); // so after quick play again player is not playing whil keep hering win sound
            gameoverSound.stop(); // so after quick play again player is not playing whil keep hering game over sound
            backgroundSound.loop(); // play back ground muisc game is starting
            startGame();
        }
    } else if ((keyCode === 32 || keyCode === 87 || keyCode === 38) && gameChar_y === floorPos_y) {
        jumped = true;
        jumpSound[floor(random(0,2.99))].play();

        if(gameRendered == false) {
            winSound.stop();// so after quick play again player is not playing whil keep hering win sound
            gameoverSound.stop(); // so after quick play again player is not playing whil keep hering game over sound
            backgroundSound.loop(); // play back ground muisc game is starting
        }
        gameRendered = true;
    }
}
function keyReleased() {
    if (keyCode === 37 || keyCode === 65) {
        isLeft = false;
        if(!isRight) // fixes the bug that while right pressed click left sound stops while game char still moving
            movingSound.stop();
    } else if (keyCode === 39 || keyCode === 68) {
        isRight = false;
        if(!isLeft) // fixes the bug that while left pressed click right sound stops while game char still moving
            movingSound.stop();
    }
}
// this function stores all the level information, my game has only one level but here are the info where to draw stuff, and where enememies etc.
function startGame() {

    gameChar_x = width / 2;
    gameChar_y = floorPos_y;


    // Variable to control the background scrolling.
    scrollPos = 0;

    // Variable to store the real position of the gameChar in the game
    // world. Needed for collision detection.
    gameChar_world_x = gameChar_x - scrollPos;

    // Boolean variables to control the movement of the game character.
    isLeft = false;
    isRight = false;
    isFalling = false;
    isPlummeting = false;
    goingUp = false;
    game_score = 0;


    // Initialise arrays of scenery objects
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
    ]
    mountains = [
        {pos_x: 300, pos_y: groundLevel, scale: 1.1},
        {pos_x: 1000, pos_y: groundLevel, scale: 0.8},
        {pos_x: 1950, pos_y: groundLevel, scale: 1.3},
        {pos_x: 2600, pos_y: groundLevel, scale: 1},
        {pos_x: 3800, pos_y: groundLevel, scale: 1},
        {pos_x: 5100, pos_y: groundLevel, scale: 1}
    ]
    canyons = [
        {pos_x: -760, pos_y: groundLevel, width: 600},
        {pos_x: 660, pos_y: groundLevel, width: 100},
        {pos_x: 1400, pos_y: groundLevel, width: 200},
        {pos_x: 3000, pos_y: groundLevel, width: 400}
    ]
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
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false}, // big coin worth more so draw it 5 times
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},
        {pos_x: 4862, pos_y: groundLevel, scale: 3, isFound: false},

    ]
    platforms = [];
    platforms.push(createPlatforms(1000, groundLevel-75,120));
    platforms.push(createPlatforms(3050, groundLevel-75,140));
    platforms.push(createPlatforms(3900, groundLevel-100,140));
    platforms.push(createPlatforms(4080, groundLevel-125,140));
    platforms.push(createPlatforms(4250, groundLevel-195,140));


    enemies = [];
    enemies.push(new Enemy(-100, groundLevel-80, 150,0.4,false));
    //enemies.push(new Enemy(800, groundLevel-40, 150, 0.2,false)); //comment this out to make game harder
    enemies.push(new Enemy(820, groundLevel-40, 480, 0.2,false));
    //enemies.push(new Enemy(1000, groundLevel-40, 400, 0.2,false)); //comment this out to make game harder
    enemies.push(new Enemy(1750, groundLevel-40, 300, 0.2,false));
    enemies.push(new Enemy(2207, groundLevel-40, 500, 0.2,false));
    //enemies.push(new Enemy(2100, groundLevel-20, 900,0.1,false));//comment this out to make game harder
    enemies.push(new Enemy(4427, groundLevel-140, 400, 0.7,false));
    flagpole = {pos_x: 5000, isReached: false}; // 5000
}
function drawGameChar() {
    if (isLeft && isFalling) {
        // add your jumping-left code
        noStroke();

        fill(34, 227, 227);
        ellipse(gameChar_x - 4.5, gameChar_y - 20,
            30, 17); // body front
        ellipse(gameChar_x + 7.5, gameChar_y - 19,
            30, 21.25); // body back
        ellipse(gameChar_x - 12.5, gameChar_y - 28.5,
            22.5); //neck
        rect(gameChar_x - 21.25, gameChar_y - 51.5,
            16.25, 16.25, 29); // head

        fill(26, 201, 201);
        rect(gameChar_x - 25, gameChar_y - 42.75,
            10, 6.25, 20); // mouth
        quad(gameChar_x + 13.75, gameChar_y - 10.5,
            gameChar_x + 6.5, gameChar_y - 10.5,
            gameChar_x + 16, gameChar_y,
            gameChar_x + 23.25, gameChar_y); // back leg
        quad(gameChar_x - 7, gameChar_y - 15,
            gameChar_x - 8, gameChar_y - 11,
            gameChar_x - 18, gameChar_y - 14,
            gameChar_x - 19, gameChar_y - 19); // front leg
        quad(gameChar_x - 19, gameChar_y - 19,
            gameChar_x - 15, gameChar_y - 6,
            gameChar_x - 20, gameChar_y - 7,
            gameChar_x - 22.5, gameChar_y - 20);
        triangle(gameChar_x - 4.5, gameChar_y - 56.25,
            gameChar_x - 6.75, gameChar_y - 48.75,
            gameChar_x - 11.5, gameChar_y - 49) // ears
        triangle(gameChar_x + 15.25, gameChar_y - 25.25,
            gameChar_x + 23, gameChar_y - 27,
            gameChar_x + 23.75, gameChar_y - 34.25); // tail
        stroke(0);
        line(gameChar_x - 17.25, gameChar_y - 40,
            gameChar_x - 24.75, gameChar_y - 40); // lips
        fill(255);
        arc(gameChar_x - 16.5, gameChar_y - 46,
            5, 5, -1, 3, CHORD); // eye
        fill(235, 32, 14);
        ellipse(gameChar_x - 16.75, gameChar_y - 45.25,
            2.5, 2.5); // iris
        quad(gameChar_x - 18, gameChar_y - 35,
            gameChar_x + 14, gameChar_y - 42.75,
            gameChar_x + 19, gameChar_y - 32.75,
            gameChar_x + 13, gameChar_y - 23); // cape

        noStroke();
        fill(252, 240, 3);
        quad(gameChar_x + 3.75, gameChar_y - 39.25,
            gameChar_x + 3.75, gameChar_y - 28.5,
            gameChar_x - 1.25, gameChar_y - 30.25,
            gameChar_x - 1.25, gameChar_y - 38);    // on the cape
        triangle(gameChar_x + 3.75, gameChar_y - 39.25,
            gameChar_x + 3.75, gameChar_y - 28.5,
            gameChar_x + 14.25, gameChar_y - 34); // on the cape
        fill(222, 172, 9);
        rect(gameChar_x - 0.5, gameChar_y - 36.5,
            7.5, 2.5, 2.5) // letter L
        rect(gameChar_x + 6, gameChar_y - 36.5,
            2.5, 6.25, 2.5) // letter L

    } else if (isRight && isFalling) {
        // add your jumping-right code
        noStroke();
        fill(34, 227, 227)
        ellipse(gameChar_x + 4.5, gameChar_y - 20, 30, 16.5) // body front
        ellipse(gameChar_x - 7.5, gameChar_y - 19, 30, 21.25) // body back
        ellipse(gameChar_x + 12.5, gameChar_y - 28.5, 22.5) //neck
        rect(gameChar_x + 5, gameChar_y - 51.5, 16.25, 16.25, 29) // head

        fill(26, 201, 201);
        rect(gameChar_x + 15, gameChar_y - 42.75,
            10, 6.25, 20); // mouth
        quad(gameChar_x - 13.75, gameChar_y - 10.5,
            gameChar_x - 6.5, gameChar_y - 10.5,
            gameChar_x - 16, gameChar_y,
            gameChar_x - 23.25, gameChar_y); // back leg
        quad(gameChar_x + 7, gameChar_y - 15,
            gameChar_x + 8, gameChar_y - 11,
            gameChar_x + 18, gameChar_y - 14,
            gameChar_x + 19, gameChar_y - 19); // front leg
        quad(gameChar_x + 19, gameChar_y - 19,
            gameChar_x + 15, gameChar_y - 6,
            gameChar_x + 20, gameChar_y - 7,
            gameChar_x + 22.5, gameChar_y - 20);
        triangle(gameChar_x + 4.5, gameChar_y - 56.25,
            gameChar_x + 6.75, gameChar_y - 48.75,
            gameChar_x + 11.5, gameChar_y - 49) // ears
        triangle(gameChar_x - 15.25, gameChar_y - 25.25,
            gameChar_x - 23, gameChar_y - 27,
            gameChar_x - 23.75, gameChar_y - 34.25); // tail

        stroke(0);
        line(gameChar_x + 17.25, gameChar_y - 40,
            gameChar_x + 24.75, gameChar_y - 40); // lips
        fill(255);
        arc(gameChar_x + 16.5, gameChar_y - 46,
            5, 5, 0, PI + QUARTER_PI, CHORD); // eye
        fill(235, 32, 14);
        ellipse(gameChar_x + 16.75, gameChar_y - 45.25,
            2.5, 2.5); // iris
        quad(gameChar_x + 18, gameChar_y - 35,
            gameChar_x - 14, gameChar_y - 42.75,
            gameChar_x - 19, gameChar_y - 32.75,
            gameChar_x - 13, gameChar_y - 23); // cape

        noStroke();
        fill(252, 240, 3);
        quad(gameChar_x - 3.75, gameChar_y - 39.25,
            gameChar_x - 3.75, gameChar_y - 28.5,
            gameChar_x + 1.25, gameChar_y - 30.25,
            gameChar_x + 1.25, gameChar_y - 38);    // on the cape
        triangle(gameChar_x - 3.75, gameChar_y - 39.25,
            gameChar_x - 3.75, gameChar_y - 28.5,
            gameChar_x - 14.25, gameChar_y - 34); // on the cape
        fill(222, 172, 9);
        rect(gameChar_x - 7.5, gameChar_y - 36.5,
            7.5, 2.5, 2.5) // letter L
        rect(gameChar_x - 7.5, gameChar_y - 36.5,
            2.5, 6.25, 2.5) // letter L

    } else if (isLeft) {
        // add your walking left code
        noStroke();
        fill(34, 227, 227);
        ellipse(gameChar_x - 4.5, gameChar_y - 20,
            30, 22.5); // body front
        ellipse(gameChar_x + 7.5, gameChar_y - 19,
            30, 21.25); // body back
        ellipse(gameChar_x - 12.5, gameChar_y - 28.5,
            22.5); //neck
        rect(gameChar_x - 21.25, gameChar_y - 51.5,
            16.25, 16.25, 29); // head

        fill(26, 201, 201);
        rect(gameChar_x - 25, gameChar_y - 42.75,
            10, 6.25, 20); // mouth
        quad(gameChar_x + 13.75, gameChar_y - 10.5,
            gameChar_x + 6.5, gameChar_y - 10.5,
            gameChar_x + 16, gameChar_y,
            gameChar_x + 23.25, gameChar_y); // back leg
        quad(gameChar_x - 3.75, gameChar_y - 10.5,
            gameChar_x - 11, gameChar_y - 10.5,
            gameChar_x - 1.5, gameChar_y,
            gameChar_x + 6.75, gameChar_y); // front leg
        triangle(gameChar_x - 4.5, gameChar_y - 56.25,
            gameChar_x - 6.75, gameChar_y - 48.75,
            gameChar_x - 11.5, gameChar_y - 49) // ears
        triangle(gameChar_x + 15.25, gameChar_y - 25.25,
            gameChar_x + 23, gameChar_y - 27,
            gameChar_x + 23.75, gameChar_y - 34.25); // tail
        stroke(0);
        line(gameChar_x - 17.25, gameChar_y - 40,
            gameChar_x - 24.75, gameChar_y - 40); // lips
        fill(255);
        arc(gameChar_x - 16.5, gameChar_y - 46,
            5, 5, -1, 3, CHORD); // eye
        fill(235, 32, 14);
        ellipse(gameChar_x - 16.75, gameChar_y - 45.25,
            2.5, 2.5); // iris
        quad(gameChar_x - 18, gameChar_y - 35,
            gameChar_x + 14, gameChar_y - 42.75,
            gameChar_x + 19, gameChar_y - 32.75,
            gameChar_x + 13, gameChar_y - 23); // cape

        noStroke();
        fill(252, 240, 3);
        quad(gameChar_x + 3.75, gameChar_y - 39.25,
            gameChar_x + 3.75, gameChar_y - 28.5,
            gameChar_x - 1.25, gameChar_y - 30.25,
            gameChar_x - 1.25, gameChar_y - 38);    // on the cape
        triangle(gameChar_x + 3.75, gameChar_y - 39.25,
            gameChar_x + 3.75, gameChar_y - 28.5,
            gameChar_x + 14.25, gameChar_y - 34); // on the cape
        fill(222, 172, 9);
        rect(gameChar_x - 0.5, gameChar_y - 36.5,
            7.5, 2.5, 2.5) // letter L
        rect(gameChar_x + 6, gameChar_y - 36.5,
            2.5, 6.25, 2.5) // letter L
    } else if (isRight) {
        noStroke();
        fill(34, 227, 227);
        ellipse(gameChar_x + 4.5, gameChar_y - 20,
            30, 22.5); // body front
        ellipse(gameChar_x - 7.5, gameChar_y - 19,
            30, 21.25); // body back
        ellipse(gameChar_x + 12.5, gameChar_y - 28.5,
            22.5); //neck
        rect(gameChar_x + 5, gameChar_y - 51.5,
            16.25, 16.25, 29); // head

        fill(26, 201, 201);
        rect(gameChar_x + 15, gameChar_y - 42.75,
            10, 6.25, 20); // mouth
        quad(gameChar_x - 13.75, gameChar_y - 10.5,
            gameChar_x - 6.5, gameChar_y - 10.5,
            gameChar_x - 16, gameChar_y,
            gameChar_x - 23.25, gameChar_y); // back leg
        quad(gameChar_x + 3.75, gameChar_y - 10.5,
            gameChar_x + 11, gameChar_y - 10.5,
            gameChar_x + 1.5, gameChar_y,
            gameChar_x - 6.75, gameChar_y); // front leg
        triangle(gameChar_x + 4.5, gameChar_y - 56.25,
            gameChar_x + 6.75, gameChar_y - 48.75,
            gameChar_x + 11.5, gameChar_y - 49) // ears
        triangle(gameChar_x - 15.25, gameChar_y - 25.25,
            gameChar_x - 23, gameChar_y - 27,
            gameChar_x - 23.75, gameChar_y - 34.25); // tail

        stroke(0);
        line(gameChar_x + 17.25, gameChar_y - 40,
            gameChar_x + 24.75, gameChar_y - 40); // lips
        fill(255);
        arc(gameChar_x + 16.5, gameChar_y - 46,
            5, 5, 0, PI + QUARTER_PI, CHORD); // eye
        fill(235, 32, 14);
        ellipse(gameChar_x + 16.75, gameChar_y - 45.25,
            2.5, 2.5); // iris
        quad(gameChar_x + 18, gameChar_y - 35,
            gameChar_x - 14, gameChar_y - 42.75,
            gameChar_x - 19, gameChar_y - 32.75,
            gameChar_x - 13, gameChar_y - 23); // cape

        noStroke();
        fill(252, 240, 3);
        quad(gameChar_x - 3.75, gameChar_y - 39.25,
            gameChar_x - 3.75, gameChar_y - 28.5,
            gameChar_x + 1.25, gameChar_y - 30.25,
            gameChar_x + 1.25, gameChar_y - 38);    // on the cape
        triangle(gameChar_x - 3.75, gameChar_y - 39.25,
            gameChar_x - 3.75, gameChar_y - 28.5,
            gameChar_x - 14.25, gameChar_y - 34); // on the cape
        fill(222, 172, 9);
        rect(gameChar_x - 7.5, gameChar_y - 36.5,
            7.5, 2.5, 2.5) // letter L
        rect(gameChar_x - 7.5, gameChar_y - 36.5,
            2.5, 6.25, 2.5) // letter L
    } else if (isFalling || isPlummeting) {
        // add your jumping facing forwards code
        stroke(0)
        fill(235, 32, 14)
        quad(gameChar_x - 7.75, gameChar_y - 36.5,
            gameChar_x + 3.75, gameChar_y - 36.5,
            gameChar_x + 17, gameChar_y - 60,
            gameChar_x - 20, gameChar_y - 60); // cape

        noStroke();
        fill(34, 227, 227);   //bright blue
        rect(gameChar_x - 14, gameChar_y - 22.5, 25, 20, 36);  // body
        ellipse(gameChar_x - 1.75, gameChar_y - 26.25, 15, 25);  // neck
        ellipse(gameChar_x - 2, gameChar_y - 41.25, 13.75, 13.75);  // head
        fill(235, 32, 50,)
        rect(gameChar_x - 7.5, gameChar_y - 36, 11.25, 1.25)


        stroke(0)
        fill(255, 255, 255)  //white
        ellipse(gameChar_x - 4.5, gameChar_y - 43.25, 2.5, 2.5)  // eye
        ellipse(gameChar_x + 0.5, gameChar_y - 43.25, 2.5, 2.5)  // eye
        noStroke();
        fill(26, 201, 201)  // dark blue
        triangle(gameChar_x - 4.5, gameChar_y - 46.25,
            gameChar_x - 7.5, gameChar_y - 48.25,
            gameChar_x - 4.5, gameChar_y - 53.75) // ear
        quad(gameChar_x + 0.5, gameChar_y - 46.5,
            gameChar_x + 1.25, gameChar_y - 49.75,
            gameChar_x + 5, gameChar_y - 50.5,
            gameChar_x - 0.75, gameChar_y - 52.5)  // ear
        quad(gameChar_x - 8, gameChar_y - 11,
            gameChar_x - 5, gameChar_y - 6,
            gameChar_x - 20, gameChar_y,
            gameChar_x - 23, gameChar_y - 5) // leg
        quad(gameChar_x + 5, gameChar_y - 11,
            gameChar_x + 2, gameChar_y - 6,
            gameChar_x + 20, gameChar_y,
            gameChar_x + 24, gameChar_y - 5)  // right leg
        ellipse(gameChar_x - 20, gameChar_y - 3, 6)
        ellipse(gameChar_x + 5, gameChar_y - 8, 6)
        rect(gameChar_x - 5.75, gameChar_y - 40.75,
            7.5, 4.25, 20)  // mouth
        stroke(0);
        line(gameChar_x - 4.75, gameChar_y - 38.75,
            gameChar_x + 0.75, gameChar_y - 38.75) // mouth
        noStroke();
        fill(0, 0, 0)
        ellipse(gameChar_x - 5, gameChar_y - 43.25, 1.25, 1.25)   // iris
        ellipse(gameChar_x + 1, gameChar_y - 43.25, 1.25, 1.5)  // iris
    } else {
        // add your standing front facing code
        stroke(0);
        fill(235, 32, 14); // red
        quad(gameChar_x - 7.75, gameChar_y - 46.5,
            gameChar_x + 3.75, gameChar_y - 46.5,
            gameChar_x + 15.25, gameChar_y - 29.5,
            gameChar_x - 18.25, gameChar_y - 29.5);  //cape
        noStroke();
        fill(34, 227, 227);  //bright blue
        rect(gameChar_x - 14, gameChar_y - 32.5,
            25, 20, 36);  //body
        ellipse(gameChar_x - 1.75, gameChar_y - 36.25,
            15, 25);  //neck
        ellipse(gameChar_x - 2, gameChar_y - 51.25,
            13.75, 13.75);  //head
        fill(235, 32, 50); // red
        rect(gameChar_x - 7.5, gameChar_y - 46,
            11.25, 1.25); // cape on the neck
        fill(26, 201, 201);  // dark blue
        triangle(gameChar_x - 4.5, gameChar_y - 56.25,
            gameChar_x - 7.5, gameChar_y - 58.25,
            gameChar_x - 4.5, gameChar_y - 63.75); //ear
        quad(gameChar_x + 0.5, gameChar_y - 56.5,
            gameChar_x + 1.25, gameChar_y - 59.75,
            gameChar_x + 5, gameChar_y - 60.5,
            gameChar_x - 0.75, gameChar_y - 62.5);  //ear
        rect(gameChar_x - 10.25, gameChar_y - 17.5,
            6.25, 17.5, 20);   //leg
        rect(gameChar_x + 1.25, gameChar_y - 17.5,
            6.25, 17.5, 20);  //leg
        rect(gameChar_x - 5.75, gameChar_y - 50.75,
            7.5, 4.25, 20);  //mouth
        stroke(0);
        fill(255);  //white
        ellipse(gameChar_x - 4.5, gameChar_y - 53.25,
            2.5, 2.5);  //eye
        ellipse(gameChar_x + 0.5, gameChar_y - 53.25,
            2.5, 2.5);  //eye
        line(gameChar_x - 4.75, gameChar_y - 48.75,
            gameChar_x + 0.75, gameChar_y - 48.75); //mouth
        noStroke();
        fill(0);
        ellipse(gameChar_x - 5, gameChar_y - 53.25,
            1.25, 1.25);   //iris
        ellipse(gameChar_x + 1, gameChar_y - 53.25,
            1.25, 1.5);  //iris
    }
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
        fill(180); // light gray, big mountain base
        triangle(mountains[i].pos_x - 102 * mountains[i].scale, mountains[i].pos_y - 330 * mountains[i].scale,
            mountains[i].pos_x - 235 * mountains[i].scale, mountains[i].pos_y,
            mountains[i].pos_x + 300 * mountains[i].scale, mountains[i].pos_y);
        fill(255); // white, big mountain top
        triangle(mountains[i].pos_x - 145 * mountains[i].scale, mountains[i].pos_y - 223 * mountains[i].scale,
            mountains[i].pos_x - 102 * mountains[i].scale, mountains[i].pos_y - 330 * mountains[i].scale,
            mountains[i].pos_x - 21 * mountains[i].scale, mountains[i].pos_y - 265 * mountains[i].scale)
        fill(0, 0, 0, 50); // shade for big mountain
        triangle(mountains[i].pos_x - 102 * mountains[i].scale, mountains[i].pos_y - 330 * mountains[i].scale,
            mountains[i].pos_x - 235 * mountains[i].scale, mountains[i].pos_y,
            mountains[i].pos_x + 75 * mountains[i].scale, mountains[i].pos_y);
        fill(136, 138, 137); // small mountain gray
        triangle(mountains[i].pos_x + 50 * mountains[i].scale, mountains[i].pos_y - 247 * mountains[i].scale,
            mountains[i].pos_x + 198 * mountains[i].scale, mountains[i].pos_y,
            mountains[i].pos_x - 179 * mountains[i].scale, mountains[i].pos_y);
        fill(255, 255, 255) // small mountain white top
        triangle(mountains[i].pos_x + 50 * mountains[i].scale, mountains[i].pos_y - 247 * mountains[i].scale,
            mountains[i].pos_x - 51 * mountains[i].scale, mountains[i].pos_y - 139 * mountains[i].scale,
            mountains[i].pos_x + 98 * mountains[i].scale, mountains[i].pos_y - 168 * mountains[i].scale)
        fill(0, 0, 0, 50); // small mountain shade
        triangle(mountains[i].pos_x + 50 * mountains[i].scale, mountains[i].pos_y - 247 * mountains[i].scale,
            mountains[i].pos_x + 119 * mountains[i].scale, mountains[i].pos_y,
            mountains[i].pos_x - 179 * mountains[i].scale, mountains[i].pos_y);
        // shade on the ground from small mountain
        triangle(mountains[i].pos_x - 235 * mountains[i].scale, mountains[i].pos_y,
            mountains[i].pos_x - 494 * mountains[i].scale, mountains[i].pos_y + 348 * mountains[i].scale,
            mountains[i].pos_x + 116 * mountains[i].scale, mountains[i].pos_y);
        fill(0, 0, 0, 30); // shade on the ground from big mountain
        triangle(mountains[i].pos_x + 116 * mountains[i].scale, mountains[i].pos_y,
            mountains[i].pos_x + 299 * mountains[i].scale, mountains[i].pos_y,
            mountains[i].pos_x - 420 * mountains[i].scale, mountains[i].pos_y + 305 * mountains[i].scale);
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

        var tree_points = [ // on the left are x, on the right are y
            0, -43,
            -20, -51,
            -38, -73,
            -54, -80,
            -58, -87,
            -66, -91,
            -68, -93,
            -69, -96,
            -69, -98,
            -68, -102,
            -67, -106,
            -66, -109,
            -64, -114,
            -59, -119,
            -55, -126,
            -50, -131,
            -45, -137,
            -40, -145,
            -35, -153,
            -30, -161,
            -25, -169,
            -20, -187,
            -15, -195,
            -10, -200,
            -5, -208,
            0, -216,
            0, -43,
            20, -51,
            38, -73,
            54, -80,
            58, -87,
            66, -91,
            68, -93,
            69, -96,
            69, -98,
            68, -102,
            67, -106,
            66, -109,
            64, -114,
            59, -119,
            55, -126,
            50, -131,
            45, -137,
            40, -145,
            35, -153,
            30, -161,
            25, -169,
            20, -187,
            15, -195,
            10, -200,
            5, -208,
            0, -216];

        beginShape(); // start of top of the tree
        for(var j = 0; j < tree_points.length; j+= 2) {
            vertex(trees_x[i] + tree_points[j], groundLevel + tree_points[j + 1]);
        }
        endShape();

        fill(0, 0, 0, 50); // tree shadow
        triangle(trees_x[i] - 10, 432,
            trees_x[i] + 10, 432,
            trees_x[i] - 90, 494);
    }
}
function drawLives() {
    noStroke();
    fill(235, 38, 38); // red for harts
    for (var i = 0; i < lives; i++) {
        ellipse(i * 50 + 25, 25, 25, 25);
        ellipse(i * 50 + 48, 25, 25, 25);
        triangle(i * 50 + 14, 30, i * 50 + 37, 60, i * 50 + 59, 30)
    }
}
function drawScore() {
    push(); // so text size doesn't change anywhere else
    drawCollectable({pos_x: 250, pos_y: 45, scale: 0.5}); // this will make fill yellow
    textSize(50)
    text(game_score, 280, 50);
    pop();
}
function drawCanyon(t_canyon) {
    noStroke();
    fill(148, 75, 150); // color of the background so it has a hole effect
    rect(t_canyon.pos_x, t_canyon.pos_y,
        t_canyon.width, groundLevel); // canyon
}
function checkCanyon(t_canyon) {
    if (gameChar_world_x > t_canyon.pos_x &&
        gameChar_world_x < t_canyon.pos_x + t_canyon.width &&
        gameChar_y >= groundLevel) {
        isLeft = false; // so can't move when falling out of the canyon
        isRight = false; // so can't move when falling out of the canyon
        return true;
    }
}
function drawCollectable(t_collectable) {
    fill(255, 215, 0); // darker yellow for outline
    ellipse(t_collectable.pos_x, t_collectable.pos_y, 40*t_collectable.scale, 10*t_collectable.scale) // foundation
    ellipse(t_collectable.pos_x, t_collectable.pos_y - 30 * t_collectable.scale, // big circle
        60 * t_collectable.scale, 60 * t_collectable.scale);
    fill(255, 165, 0); // much darker yellow for inner cicrle
    ellipse(t_collectable.pos_x, t_collectable.pos_y - 30 * t_collectable.scale,
        48 * t_collectable.scale, 48 * t_collectable.scale);
    fill(255, 255, 0); // yellow for the star on the coin
    // coin star is made from those 3 triangles:
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
        t_collectable.isFound == false) { // this function is called many times so I had to add && isFound == false
        coinSound.play();
        t_collectable.isFound = true;     // for the score counter to work
        game_score += 1;
    }
    if (!t_collectable.isFound) // when coin not found good to draw it
        return true;
    else {
        return false;
    }
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
    if (gameChar_y > width) { // if felt - 1 life
        lives -= 1;
        if (lives >= 1) {
            startGame(); // if still has enough lifes to continue start over
        } else {
            backgroundSound.stop();
            gameoverSound.play(); // if not enough lifes play game over sound, sound is here so it only playes once
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
                floorPos_y = this.y // jump depends on the floor pos if jumped from the platform change how much can jump up
            } else if (( gc_x > this.x - 500 && gc_x < this.x + this.length + 500)&&(gc_x < this.x || gc_x > this.x + this.length) &&
                gc_y == this.y)
                floorPos_y = groundLevel; // when landing on the ground floor pos is ground level which is height *3/4 of the screen
        }
    }
    return p;
}
function Enemy(x, y, range, scale,left){
    this.x = x;
    this.y = y;
    this.range = range;
    this.scale = scale;
    this.left = left

    this.currentX = x;
    this.inc = 1 / this.scale * 0.5;

    this.update = function (){
        this.currentX += this.inc;
        if(this.currentX >= this.x + this.range){
            this.inc = - 1 / this.scale * 0.5; // this part relates to fact that the bigger enemy is slower it moves
            this.left = true;
        } else if(this.currentX < this.x) {
            this.inc = 1 / this.scale * 0.5; // this part relates to fact that the bigger enemy is slower it moves
            this.left = false;
        }
    }
    this.draw = function() {
        this.update();
        if(this.left) {
            fill(235, 23, 23) // red
            ellipse(this.currentX, this.y - 49 * this.scale, 65 * this.scale)    //head
            rect(this.currentX - 40 * this.scale, this.y - 20 * this.scale,
                80 * this.scale, 66 * this.scale, 15, 8, 0, 15)   //chest 8 15 15 0
            quad(this.currentX + 40 * this.scale, this.y + 41 * this.scale,
                this.currentX - 32 * this.scale, this.y + 41 * this.scale,
                this.currentX - 16 * this.scale, this.y + 98 * this.scale,
                this.currentX + 40 * this.scale, this.y + 98 * this.scale)   //stomach
            fill(22, 65, 99) // blue
            quad(this.currentX - 16 * this.scale, this.y + 98 * this.scale,
                this.currentX - 24 * this.scale, this.y + 155 * this.scale,
                this.currentX + 1 * this.scale, this.y + 155 * this.scale,
                this.currentX + 40 * this.scale, this.y + 98 * this.scale)   //thigh
            quad(this.currentX - 24 * this.scale, this.y + 155 * this.scale,
                this.currentX + 3 * this.scale, this.y + 210 * this.scale,
                this.currentX + 7 * this.scale, this.y + 210 * this.scale,
                this.currentX + 1 * this.scale, this.y + 155 * this.scale)   //calf
            fill(89, 59, 19)
            quad(this.currentX + 40 * this.scale, this.y + 83 * this.scale,
                this.currentX - 23 * this.scale, this.y + 83 * this.scale,
                this.currentX - 14 * this.scale, this.y + 100 * this.scale,
                this.currentX + 40 * this.scale, this.y + 100 * this.scale)   //belt
            fill(161, 50, 50)
            rect(this.currentX - 45 * this.scale, this.y - 46 * this.scale,
                30 * this.scale, 20 * this.scale, 0, 20, 5, 20)   //chin
            fill(255)
            arc(this.currentX - 10 * this.scale, this.y - 63 * this.scale,
                20 * this.scale, 20 * this.scale, 0, PI + QUARTER_PI, OPEN)  //eye
            rect(this.currentX - 43 * this.scale, this.y - 39 * this.scale,
                20 * this.scale, 7 * this.scale, 10, 10, 10, 0)   //teeth
            fill(0)
            ellipse(this.currentX - 12 * this.scale, this.y - 60 * this.scale, 10 * this.scale)    //iris
            quad(this.currentX + 9 * this.scale, this.y - 67 * this.scale,
                this.currentX + 16 * this.scale, this.y - 53 * this.scale,
                this.currentX + 61 * this.scale, this.y - 62 * this.scale,
                this.currentX + 55 * this.scale, this.y - 70 * this.scale)   //horn
            triangle(this.currentX + 55 * this.scale, this.y - 70 * this.scale,
                this.currentX + 20 * this.scale, this.y - 122 * this.scale,
                this.currentX + 37 * this.scale, this.y - 66 * this.scale)     //horn
            quad(this.currentX + 3 * this.scale, this.y + 210 * this.scale,
                this.currentX - 20 * this.scale, this.y + 218 * this.scale,
                this.currentX + 15 * this.scale, this.y + 218 * this.scale,
                this.currentX + 7 * this.scale, this.y + 210 * this.scale)   //foot


            fill(181, 42, 42)
            rect(this.currentX - 10 * this.scale, this.y - 8 * this.scale,
                30 * this.scale, 50 * this.scale, 10, 10, 0, 0)    //hand
            quad(this.currentX - 14 * this.scale, this.y + 37 * this.scale,
                this.currentX - 57 * this.scale, this.y + 53 * this.scale,
                this.currentX - 50 * this.scale, this.y + 64 * this.scale,
                this.currentX + 17 * this.scale, this.y + 43 * this.scale)    //hand
            fill(138, 41, 41)
            rect(this.currentX - 65 * this.scale, this.y + 52 * this.scale,
                15 * this.scale, 15 * this.scale, 5)    //palm
        } else {
            fill(235, 23, 23) // red
            ellipse(this.currentX,this.y - 49 * this.scale, 65 * this.scale)    //head
            rect(this.currentX - 40 * this.scale, this.y - 20 * this.scale,
                80 * this.scale, 66 * this.scale, 8, 15, 15, 0)   //chest
            quad(this.currentX - 40 * this.scale, this.y + 41 * this.scale,
                this.currentX + 32 * this.scale, this.y + 41 * this.scale,
                this.currentX + 16 * this.scale, this.y + 98 * this.scale,
                this.currentX - 40 * this.scale, this.y + 98 * this.scale)   //stomach
            fill(22, 65, 99) // blue
            quad(this.currentX + 16 * this.scale, this.y + 98 * this.scale,
                this.currentX + 24 * this.scale, this.y + 155 * this.scale,
                this.currentX - 1 * this.scale, this.y + 155 * this.scale,
                this.currentX - 40 * this.scale, this.y + 98 * this.scale)   //thigh
            quad(this.currentX + 24 * this.scale, this.y + 155 * this.scale,
                this.currentX - 3 * this.scale, this.y + 210 * this.scale,
                this.currentX - 7 * this.scale, this.y + 210 * this.scale,
                this.currentX - 1 * this.scale, this.y + 155 * this.scale)   //calf
            fill(89, 59, 19)
            quad(this.currentX - 40 * this.scale, this.y + 83 * this.scale,
                this.currentX + 23 * this.scale, this.y + 83 * this.scale,
                this.currentX + 14 * this.scale, this.y + 100 * this.scale,
                this.currentX - 40 * this.scale, this.y + 100 * this.scale)   //belt
            fill(161, 50, 50)
            rect(this.currentX + 15 * this.scale, this.y - 46 * this.scale,
                30 * this.scale, 20 * this.scale, 0, 5, 5, 20)   //chin
            fill(255)
            arc(this.currentX + 10 * this.scale, this.y - 63 * this.scale,
                20 * this.scale, 20 * this.scale, 0, PI + QUARTER_PI, OPEN)  //eye
            rect(this.currentX + 23 * this.scale, this.y - 39 * this.scale,
                20 * this.scale, 7 * this.scale, 10, 10, 10, 0)   //teeth
            fill(0)
            ellipse( this.currentX + 12 * this.scale, this.y - 60 * this.scale, 10 * this.scale)    //iris
            quad(this.currentX - 9 * this.scale, this.y - 67 * this.scale,
                this.currentX - 16 * this.scale, this.y - 53 * this.scale,
                this.currentX - 61 * this.scale, this.y - 62 * this.scale,
                this.currentX - 55 * this.scale, this.y - 70 * this.scale)   //horn
            triangle(this.currentX - 55 * this.scale, this.y - 70 * this.scale,
                this.currentX - 20 * this.scale, this.y - 122 * this.scale,
                this.currentX - 37 * this.scale, this.y - 66 * this.scale)     //horn
            quad(this.currentX - 3 * this.scale, this.y + 210 * this.scale,
                this.currentX + 20 * this.scale, this.y + 218 * this.scale,
                this.currentX - 15 * this.scale, this.y + 218 * this.scale,
                this.currentX - 7 * this.scale, this.y + 210 * this.scale)   //foot


            fill(181, 42, 42)
            rect(this.currentX - 17 * this.scale, this.y - 8 * this.scale,
                30 * this.scale, 50 * this.scale, 10, 10, 10, 0)    //hand
            quad(this.currentX + 14 * this.scale, this.y + 37 * this.scale,
                this.currentX + 57 * this.scale, this.y + 53 * this.scale,
                this.currentX + 50 * this.scale, this.y + 64 * this.scale,
                this.currentX - 17 * this.scale, this.y + 43 * this.scale)    //hand
            fill(138, 41, 41)
            rect(this.currentX + 50 * this.scale, this.y + 52 * this.scale,
                15 * this.scale, 15 * this.scale, 5)    //palm
        }
    }
    this.checkContact = function(gc_x, gc_y){ // gc read game character
        // if touch the width or high of enemy return true
        if((gc_x > this.currentX-50 * this.scale && gc_x < this.currentX + 65 * scale) &&
          (gc_y > this.y - 122 * this.scale && gc_y < this.y + 310 * this.scale))
            return true;
        return false;
    }
}
function drawControllInfo() {
    // this will draw the info how to move our LLama
    noStroke();
    fill(150,150,150,220);
    rect(230,450, 380,106,20);
    fill(255, 215, 0);
    textSize(22);
    text("Left: Left Arrow or A", 250, 480);
    text("Right: Right Arrow or D",250, 480+ 30);
    text("Jump: Space Bar or Up Arrow or W", 250, 480 + 60);
}

// The end :)
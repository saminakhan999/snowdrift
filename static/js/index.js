function setup() {
  createCanvas(550, 400);
  textAlign(CENTER, CENTER);
  frameRate(60);
}

function addHighscore(score) {
  const addscore = document.createElement("form");
  addscore.id = "addscore";

  const scorelabel = document.createElement("label");
  scorelabel.textContent = "score";
  addscore.appendChild(scorelabel);
  const scoreinput = document.createElement("input");
  scoreinput.type = "number";
  scoreinput.id = "score";
  scoreinput.value = score;
  scoreinput.readOnly = true;
  addscore.appendChild(scoreinput);

  const submitscore = document.createElement("input");
  submitscore.type = "submit";
  submitscore.value = "Add highscore";
  addscore.appendChild(submitscore);

  const alldascores = document.getElementById("alldascores");
  alldascores.appendChild(addscore);

  addscore.addEventListener("submit", submitHighscore, { once: true });
}

var level = 1;
var platforms = [];
var ice = [];
var cannons = [];
var bullets = [];
var tramps = [];
var spikes = [];
var keys = [];
var monsters = [];
var coins = [];
var gravity = 0.8;
var offGround = 10;
var timeSinceJump = 1000;
var framesSinceStart;
var backupMonsters;
var Player = {
  x: 400,
  y: 400,
  w: 30,
  h: 30,
  ySpeed: 0,
  xSpeed: 0,
  health: 200,
  points: 0,
};
var Portal = {
  x: 0,
  y: 0,
  r: 0,
  time: 0,
};

Player.walk = function (direction) {
  this.xSpeed += direction;
};

Player.jump = function () {
  if (offGround < 3 && timeSinceJump > 2) {
    this.ySpeed = 12;
    timeSinceJump = 0;
  }
};

//Updates the position of the player based on speed
Player.updateX = function () {
  this.xSpeed *= 0.8;
  this.x += this.xSpeed;
};
Player.updateY = function () {
  if (this.ySpeed < 4 || keys[UP_ARROW] || keys[87] || keys[32]) {
    this.ySpeed -= gravity;
  } else {
    this.ySpeed -= gravity * 2;
  }
  this.y -= this.ySpeed;
  if (
    // need this one because you fall forever without it
    this.y >
    levelData[level - 1].length *
      levelData[level - 1][levelData[level - 1].length - 1]
  ) {
    die();
  }
};

// Creates player
Player.draw = function () {
  noStroke();
  fill("#000000");
  rect(this.x, this.y, this.w, this.h, this.w);
  fill(0);
};

// Create Cannon
function Cannon(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.angle;
  //updates the angle
  this.update = function () {
    var dx = this.x - (Player.x + Player.w / 2);
    var dy = this.y - (Player.y + Player.h / 2);
    this.angle = atan2(dy, dx);
  };
  this.draw = function () {
    rectMode(CENTER);
    translate(this.x, this.y);
    rotate(this.angle - PI / 2);
    fill("#000001");
    ellipse(0, this.h / 6, this.w / 2, this.h / 2);
    rect(0, -this.h / 8, this.w / 3, this.h / 2);
    rotate(-this.angle + PI / 2);
    translate(-this.x, -this.y);
    rectMode(CORNER);
    this.shoot = function () {
      if (frameCount % 120 === 0) {
        bullets.push(new Bullet(this.x, this.y, this.w / 5, this.angle + PI));
      }
    };
  };
}

// Creates bullets
function Bullet(x, y, r, angle) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.angle = angle;
  this.draw = function () {
    ellipse(this.x, this.y, this.r, this.r);
  };
  //updates the position
  this.update = function () {
    //xVelocity = velocity * cos(angle);
    //yVelocity = velocity * sin(angle);
    this.x += 4 * cos(angle);
    this.y += 4 * sin(angle);
  };
  this.checkCollision = function () {
    return circlerect(this, Player);
  };
}

// Creates Monster

function Monster(x, y, w, h, xVel) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.xVel = -2;
  this.draw = function () {
    if (
      Math.abs(this.x - Player.x) < width + Player.w &&
      Math.abs(this.y - Player.y) < height + Player.h
    ) {
      // draw the monster
      fill(23, 130, 57);
      noStroke();
      rect(this.x, this.y, this.w, this.h, Math.abs(cos(frameCount / 60)) * 10);
    }
  };

  //updates the angle
  this.update = function () {
    var dx = this.x + this.w / 2 - (Player.x + Player.w / 2);
    var dy = this.y + this.h / 2 - (Player.y + Player.h / 2);
    this.angle = atan2(dy, dx);
    this.x += this.xVel;
    for (var i = 0; i < platforms.length; i++) {
      if (
        rectrect(
          this.x,
          this.y,
          this.w,
          this.h,
          platforms[i].x,
          platforms[i].y,
          platforms[i].w,
          platforms[i].h
        )
      ) {
        this.xVel = -this.xVel;
        this.x += this.xVel;
      }
    }

    if (this.checkCollision()) {
      if (Player.ySpeed >= 0) {
        Player.health -= 10;
      } else if (Player.ySpeed < -3 && this.y - Player.y > Player.h / 2 - 5) {
        Player.points += 1000;
        this.dead = true; // the monster is "dead"
        Player.ySpeed = 18; // make the player hop (slightly higher than a normal jump)
      }
    }
  };
  this.checkCollision = function () {
    return rectrect(
      this.x,
      this.y,
      this.w,
      this.h,
      Player.x,
      Player.y,
      Player.w,
      Player.h
    );
  };
}

function Coin(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.draw = function () {
    {
      // draw the coin
      fill(255, 215, 0);
      noStroke();
      ellipse(
        this.x,
        this.y,
        this.w / 2,
        this.h / 2,
        Math.abs(cos(frameCount / 60)) * 10
      );
    }
  };

  //updates the angle
  this.update = function () {
    if (this.checkCollision()) {
      Player.points += 5000;
      this.dead = true; // the coin is "dead"
    }
  };
  this.checkCollision = function () {
    return rectrect(
      this.x,
      this.y,
      this.w,
      this.h,
      Player.x,
      Player.y,
      Player.w,
      Player.h
    );
  };
}

// Creates Trampoline
function Tramp(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.draw = function () {
    fill(0, 0, 1);
    rect(this.x, this.y, this.w, this.h);
  };
  this.checkCollision = function () {
    return rectrect(
      this.x,
      this.y,
      this.w,
      this.h,
      Player.x,
      Player.y,
      Player.w,
      Player.h
    );
  };
}

// Creates Spikes
function Spike(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.draw = function () {
    fill("#A5F2F3");
    noStroke();
    triangle(
      this.x + this.w / 2,
      this.y,
      this.x,
      this.y + this.h,
      this.x + this.w,
      this.y + this.h
    );
  };
  this.checkCollision = function () {
    return polygonCollide(
      [
        { x: Player.x, y: Player.y },
        { x: Player.x + Player.w, y: Player.y },
        { x: Player.x + Player.w, y: Player.y + Player.h },
        { x: Player.x, y: Player.y + Player.h },
      ],
      [
        { x: this.x + this.w / 2, y: this.y },
        { x: this.x, y: this.y + this.h },
        { x: this.x + this.w, y: this.y + this.h },
      ]
    );
  };
}

// Creates Portal
Portal.draw = function () {
  colorMode(HSB, 170);
  noStroke();
  for (var i = 0; i < this.r; i += 2) {
    fill(255, 0, 255);
  }
  colorMode(RGB);
  ellipse(this.x, this.y, this.r * 2);
};

// Helps Portal collide with player
Portal.checkCollision = function () {
  return circlerect(this, Player);
};

// This function makes it possible for all shapes to collide

function polygonCollide(shape1, shape2) {
  function isBetween(c, a, b) {
    return (a - c) * (b - c) <= 0;
  }
  function overlap(a, b) {
    return isBetween(b.min, a.min, a.max) || isBetween(a.min, b.min, b.max);
  }

  function project(shape, axis) {
    var mn = Infinity;
    var mx = -Infinity;
    for (var i = 0; i < shape.length; i++) {
      var dot = shape[i].x * axis.x + shape[i].y * axis.y;
      mx = max(mx, dot);
      mn = min(mn, dot);
    }
    return { min: mn, max: mx };
  }

  function getAxes(shape) {
    var axes = [];
    for (var i = 0; i < shape.length; i++) {
      var n = (i + 1) % shape.length;
      axes[i] = {
        y: shape[i].x - shape[n].x,
        x: -(shape[i].y - shape[n].y),
      };
    }
    return axes;
  }

  var shapes = [shape1, shape2];
  for (var s = 0; s < shapes.length; s++) {
    var axes = getAxes(shapes[s]);
    for (var i = 0; i < axes.length; i++) {
      var axis = axes[i];
      var p1 = project(shape1, axis);
      var p2 = project(shape2, axis);
      if (!overlap(p1, p2)) {
        return false;
      }
    }
  }
  return true;
}

// Makes it possible for the square shapes to collide
function rectrect(x1, y1, w1, h1, x2, y2, w2, h2) {
  x1 += w1 / 2;
  y1 += h1 / 2;
  x2 += w2 / 2;
  y2 += h2 / 2;

  return (
    Math.abs(x1 - x2) <= w1 / 2 + w2 / 2 && Math.abs(y1 - y2) <= h1 / 2 + h2 / 2
  );
}

// Makes it possible for circle and squares to collide
function circlerect(circ, rect) {
  var distX = Math.abs(circ.x - rect.x - rect.w / 2);
  var distY = Math.abs(circ.y - rect.y - rect.h / 2);

  if (distX > rect.w / 2 + circ.r) {
    return false;
  }
  if (distY > rect.h / 2 + circ.r) {
    return false;
  }

  if (distX <= rect.w / 2) {
    return true;
  }
  if (distY <= rect.h / 2) {
    return true;
  }

  var dx = distX - rect.w / 2;
  var dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circ.r * circ.r;
}

// Creates ground blocks
function Platform(x, y, w, h) {
  this.draw = function () {
    noStroke();
    fill("#fffafa");
    rect(x, y, w, h);
  };
  this.checkCollision = function () {
    return rectrect(x, y, w, h, Player.x, Player.y, Player.w, Player.h);
  };
}

// Creates ice blocks
function Ice(x, y, w, h) {
  this.draw = function () {
    noStroke();
    fill("#A5F2F3");
    rect(x, y, w, h);
  };
  this.checkCollision = function () {
    return rectrect(x, y, w, h, Player.x, Player.y, Player.w, Player.h);
  };
}

//current keys that are being held down
function keyPressed() {
  keys[keyCode] = true;
}
function keyReleased() {
  keys[keyCode] = false;
}

function win() {
  background("#1E90FF");
  textSize(width / 20);
  fill("#F5F5F5");
  textFont("Bebas Neue");
  text(
    "OMG YOU BEAT ALL THE LEVELS!!!! \n [ INSERT CRAZY SNOWDRIFT FINAL LEVEL \n PLOT TWIST ]",
    width / 2,
    height / 2
  );
  const button = createButton("Play Again");
  button.position(500, 500, "fixed");
  button.style("background-color", "#F5F5F5");
  button.style("font-weight", "bold");
  button.style("font-family", "sans-serif");
  button.style("border", "none");
  button.style("color", "#00008B");
  button.style("border-radius", "16px");
  button.mousePressed(() => window.location.reload());
  noLoop();
  return;
}

function die() {
  Player.health = 200;
  Portal.time = 0;
  Player.x = originalCoords[0];
  Player.y = originalCoords[1];
  bullets = [];
  monsters = [];
  coins = [];
  for (var i = 0; i < backupMonsters.length; i++) {
    monsters.push(Object.assign({}, backupMonsters[i]));
  }
}

function reset() {
  Player.xSpeed = 0;
  Player.ySpeed = 0;
  platforms = [];
  ice = [];
  cannons = [];
  bullets = [];
  tramps = [];
  spikes = [];
  monsters = [];
  coins = [];
}

/*
  G = Ground Platform
  P = Portal
  S = Player Start Position
  C = Cannon
  ^ = Spike
  T = Trampoline (Tramp)
  I = Ice 
  @ = Monster
  £ = Coin
  */

// Each array is a level

var levelData = [
  // Level 1
  [
    "                      ",
    "  S    £   @     @ P ",
    "GGGGGGIIIIIIIIIIIGGGGG",
    40,
  ],
  // Level 2
  [
    "  S              @   ^         ^    @    £   ^ @  ^^    @   ^^       ^     P ",
    "GGGGGIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIGGGGGGG",
    40,
  ],
  // Level 3
  [
    "                                     GG    T   @   T ",
    "                                     GG        C       T      P",
    "             £                     GGGG        G      @  GGGGGG",
    "                           @       GGGG                  GGGGGG",
    "                                 GGGGGG   C  C           GGGGGG",
    "                                 GGGGGG   G  G     T     GGGGGG",
    "  S         @  ^      ^      T   GGGGGG^^^^^^^^^^^  ^^^^^GGGGGG",
    "GGGGGGGGGGIIIIIIIIIIIIIIIGGGGGGGGGGGGGGIIIIIIIIIIIGGIIIIIGGGGGG",
    40,
  ],
  // level 4
  [
    "                                                           T    T    T        ",
    "                                                      T    G    G    G      P ",
    "                                                 T    G                  GGGGG",
    "                  £                T    C   T    G         ^               GGG",
    "  S                              GGGGGGGG   G            GGGGGGGT             ",
    "  G   G                          GGGGGGGG         @      GGGGGGG    T         ",
    "^^^^^^^^^^C           ^    @  T  GGGGGGGG^^^^^^^^^^^^^^^^GGGGGGC        T     ",
    "GGGGGGGGGGIIIIIIIIIIIIIIIGGGGGGGGGGGGGGGGIIIIIIIIIIIIIIIIGGGGGGGIIIIIIIIGGGGGG",
    40,
  ],
  // Level 100
  [
    "P £",
    "G  ",
    "  I",
    "   ",
    "G  ",
    "  G",
    "   ",
    "G  ",
    "  G",
    "   ",
    "G S",
    "GGG",
    40,
  ],
];

// Building the next level based on the levelData above

function nextLevel() {
  if (level > levelData.length) {
    win();
    addHighscore(Player.points);
  }
  Player.health = 200;
  backupMonsters = [];
  reset();

  var gridSize = levelData[level - 1][levelData[level - 1].length - 1];
  for (var i = 0; i < levelData[level - 1].length - 1; i++) {
    for (var j = 0; j < levelData[level - 1][i].length; j++) {
      switch (levelData[level - 1][i].charAt(j)) {
        case "G":
          platforms.push(
            new Platform(j * gridSize, i * gridSize, gridSize, gridSize)
          );
          break;
        case "I":
          ice.push(new Ice(j * gridSize, i * gridSize, gridSize, gridSize));
          break;
        case "S":
          Player.x = j * gridSize + 0.5;
          Player.y = i * gridSize + 0.5;
          Player.w = gridSize * 0.9;
          Player.h = gridSize * 0.9;
          originalCoords = [Player.x, Player.y]; // Original coordinates of where player starts (respawn here)
          break;
        case "£":
          coins.push(
            new Coin(
              j * gridSize + 0.5,
              i * gridSize + 0.5,
              gridSize - 1,
              gridSize - 1
            )
          );
          break;
        case "@":
          monsters.push(
            new Monster(
              j * gridSize + 0.5,
              i * gridSize + 0.5,
              gridSize - 1,
              gridSize - 1 - 2
            )
          );
          backupMonsters.push(
            new Monster(
              j * gridSize + 0.5,
              i * gridSize + 0.5,
              gridSize - 1,
              gridSize - 1
            )
          );
          break;
        case "P":
          Portal.x = j * gridSize + gridSize / 2;
          Portal.y = i * gridSize + gridSize / 2;
          Portal.r = gridSize / 2;
          break;
        case "T":
          tramps.push(
            new Tramp(
              j * gridSize,
              i * gridSize + gridSize * 0.8,
              gridSize,
              gridSize * 0.2
            )
          );
          break;
        case "C":
          cannons.push(
            new Cannon(
              j * gridSize + gridSize / 2,
              i * gridSize + gridSize / 2,
              gridSize,
              gridSize
            )
          );
          break;
        case "^":
          spikes.push(
            new Spike(j * gridSize, i * gridSize, gridSize, gridSize)
          );
          break;
        default:
      }
    }
  }
}
nextLevel();

// If player walks into a platform block, it wont glitch at it
Player.walkedInPlatform = function () {
  for (var i = 0; i < platforms.length; i++) {
    slope = 0;
    while (slope < 20 && platforms[i].checkCollision()) {
      this.y -= 0.2;
      slope++;
    }
    if (slope === 20) {
      this.x -= this.xSpeed;
      this.xSpeed = 0;
      this.y += slope * 0.2;
    }
  }
};

// Rendering the game

function draw() {
  // Actual game screen
  push();
  scale(width / 800, height / 500);
  background("#1E90FF");
  translate(-Player.x - Player.w / 2 + 400, -Player.y - Player.h / 2 + 250); // Positions game screen

  // These are the actual keyboard controls
  if (keys[UP_ARROW] || keys[87] || keys[32]) {
    Player.jump();
  }
  if (keys[LEFT_ARROW] || keys[65]) {
    Player.walk(-1.25);
  }
  if (keys[RIGHT_ARROW] || keys[68]) {
    Player.walk(1.25);
  }

  Player.updateX();
  Player.walkedInPlatform();
  Player.updateY();

  offGround++;
  timeSinceJump++;

  // This makes it possible to walk on the ground without falling

  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].checkCollision()) {
      while (platforms[i].checkCollision()) {
        if (Player.ySpeed > 0) {
          Player.y += 0.2;
        } else {
          offGround = 0;
          Player.y -= 0.2;
        }
      }
      Player.ySpeed = 0;
    }
  }

  // This makes it possible to walk on the ice without falling

  for (i = 0; i < ice.length; i++) {
    if (ice[i].checkCollision()) {
      while (ice[i].checkCollision()) {
        if (Player.ySpeed > 0) {
          Player.y += 0.2;
        } else {
          offGround = 0;
          Player.y -= 0.2;
        }
      }
      Player.ySpeed = 0;
      Player.xSpeed = 13; // This makes you slide on ice
    }
  }

  // This makes it possible to jump on the trampolines without falling

  for (var i = 0; i < tramps.length; i++) {
    if (tramps[i].checkCollision()) {
      Player.ySpeed = 20;
      Player.y -= Player.ySpeed;
    }
  }

  // Render Ground blocks
  for (i = 0; i < platforms.length; i++) {
    platforms[i].draw();
  }
  // Render Ice blocks
  for (i = 0; i < ice.length; i++) {
    ice[i].draw();
  }

  // Render Trampolines
  for (i = 0; i < tramps.length; i++) {
    tramps[i].draw();
  }

  // Render Spikes with a -50 damage
  for (i = 0; i < spikes.length; i++) {
    if (spikes[i].checkCollision()) {
      Player.health -= 10;
      Player.ySpeed = 14;
      Player.y -= 0;
    }
    spikes[i].draw();
  }

  // Render Cannon
  for (i = 0; i < cannons.length; i++) {
    cannons[i].update();
    cannons[i].draw();
    cannons[i].shoot();
  }

  for (i = monsters.length - 1; i > -1; i--) {
    monsters[i].update();
    monsters[i].draw();
    if (monsters[i].dead) {
      monsters.splice(i, 1);
    }
  }

  for (i = coins.length - 1; i > -1; i--) {
    coins[i].update();
    coins[i].draw();
    if (coins[i].dead) {
      coins.splice(i, 1);
    }
  }

  // Render moving bullets along with -50 damage

  for (i = bullets.length - 1; i > -1; i--) {
    bullets[i].update();
    bullets[i].draw();
    if (bullets[i].checkCollision()) {
      bullets.splice(i, 1);
      Player.health -= 10;
      break;
    }
    for (var j = 0; j < platforms.length; j++) {
      if (circlerect(bullets[i], platforms[j])) {
        bullets.splice(i, 1);
        break;
      }
    }
    for (var j = 0; j < ice.length; j++) {
      if (circlerect(bullets[i], ice[j])) {
        bullets.splice(i, 1);
        break;
      }
    }
  }

  Player.draw(); // Render Player
  Portal.draw(); // Render Portal

  // Level and Health display at top
  pop();

  fill(0);
  textSize(width / 23);
  fill(255, 255, 255);
  textFont("Quicksand");
  text("Health: " + round(Player.health), width - width / 8, height / 23);
  fill(255, 255, 255);
  textFont("Quicksand");
  text("Points: " + round(Player.points), width - width / 2, height / 23);
  textAlign(CENTER);
  fill(255, 255, 255);
  textFont("Quicksand");
  text("Level " + round(level), width - width / 1.1, height / 23);

  // Die if health goes to 0
  if (Player.health < 0.1) {
    die();
  }

  //checks collision with portal, if there is collision, move player to the next level
  if (Portal.checkCollision()) {
    Portal.time += 2;
    if (Portal.time > 120) {
      level++;
      nextLevel();
    }
  } else {
    if (frameCount - framesSinceStart < 60) {
      Portal.time -= 3;
    } else {
      Portal.time--;
    }
  }
  Portal.time = constrain(Portal.time, 0, 180);
  fill(255, 255, 255, 0 + Portal.time * 2);
  rect(0, 0, width, height);
}

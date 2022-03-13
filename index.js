function setup() {
  createCanvas(550, 400);
  textAlign(CENTER, CENTER);
  frameRate(60);
}

var level = 1;
var platforms = [];
var ice = [];
var cannons = [];
var bullets = [];
var tramps = [];
var spikes = [];
var keys = [];
var gravity = 0.8;
var offGround = 10;
var timeSinceJump = 1000;
var framesSinceStart;
var Player = {
  x: 400,
  y: 400,
  w: 30,
  h: 30,
  ySpeed: 0,
  xSpeed: 0,
  health: 150,
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
  if (this.ySpeed < 4 || keys[UP_ARROW] || keys[87]) {
    this.ySpeed -= gravity;
  } else {
    this.ySpeed -= gravity * 2;
  }
  this.y -= this.ySpeed;
  if ( // need this one because you fall forever without it
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
  fill("#00008B");
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


// Creates Trampoline 
function Tramp(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.draw = function () {
    fill(0,0,1);
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
    Math.abs(x1 - x2) <= w1 / 2 + w2 / 2 &&
    Math.abs(y1 - y2) <= h1 / 2 + h2 / 2
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
    return rectrect(
      x,
      y,
      w,
      h,
      Player.x,
      Player.y,
      Player.w,
      Player.h
    );
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
    return rectrect(
      x,
      y,
      w,
      h,
      Player.x,
      Player.y,
      Player.w,
      Player.h
    );
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
    "OMG YOU BEAT ALL THE LEVELS!!!! \n [ INSERT THAT CRAZY SNOW DRIFT FINAL LEVEL \n PLOT TWIST THAT YOU TOLD ME ABOUT ]",
    width / 2,
    height / 2
  );
  const button = createButton("Play Again");
  button.position(500, 500, "fixed");
  button.mousePressed(() => window.location.reload());
  noLoop();
  return;
}


function die() {
  Player.health = 150;
  Portal.time = 0;
  Player.x = originalCoords[0];
  Player.y = originalCoords[1];
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
}

/*
G = Ground Platform
P = Portal
S = Player Start Position
C = Cannon
^ = Spike
T = Trampoline (Tramp)
I = Ice 
*/

// Each array is a level 

var levelData = [
  // Level 1
  [
    "                                     GG    T       T ",
    "                                     GG        C              P",
    "                                   GGGG        G         GGGGGG",
    "                                   GGGG                  GGGGGG",
    "                                 GGGGGG   C  C           GGGGGG",
    "                                 GGGGGG   G  G     T     GGGGGG",
    "  S                   ^      T   GGGGGG^^^^^^^^^^^  ^^^^^GGGGGG",
    "GGGGGGGGGGIIIIIIIIIIIIIIIGGGGGGGGGGGGGGIIIIIIIIIIIGGIIIIIGGGGGG",
    30,
  ],
  // Level 2
  [
    "  S                  ^         ^             ^    ^^        ^^       ^    P ",
    "GGGGGIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIGGGGGGG",
    30,
  ],
  // Level 3
  ["  S     P", "GGGGGGGGGGG", 30],
];


// Building the next level based on the levelData above 

function nextLevel() {
  if (level > levelData.length) {
    win();
  }
  Player.health = 150;
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
        console.log("LET'S GOOOOO")
      }
    }
  }
}
nextLevel();




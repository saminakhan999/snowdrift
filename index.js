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


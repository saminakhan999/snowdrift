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



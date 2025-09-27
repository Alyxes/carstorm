// Strictly check for source code errors.
"use strict";
  
/**
 * This javascript has been designed to run with the app "Your Own Screen Saver". 
 * It is open source and free to use. Please leave these lines as a reference in code if you modify it. 
 * Programmer: Jon and Timothy Lennryd 2025.
 * 
  * See more code examples at http://app.madskullcreations.com/yoss to get a better understanding about events and how to use the screen saver in different ways!
 *
 * What's this? 
 *  This is inspired from an old handheld car racing game from the '80ies! You can move the car left and right with the keyboard arrows.
 * 
 *  This is using the canvas functions getImageData() and putImageData() with the drawImage() to copy the central part of the image, 
 *  and in the next frame draw it back, this time a tiny bit stretched to the edges of the screen, giving the effect of zooming in.
 * 
 */
  
// See Resize().
var ScreenWidth;
var ScreenHeight;

// If true, it starts in paused mode, and gets activated by the focus event.
var screenSaverPaused = false;

// Canvas 2d surface, for drawing on.
var ctx = null;
var topctx = null;

var r=0;
var g=0;
var b=0;

var Now = 0;
var LastDraw = 0;
var ElapsedTime = 0;
var ElapsedCarsTime = 0; // Shut up, this is a great name for this variable!

// Snow frame rate is smooth
var fps = 60;
var fpsInterval = 1000 / fps; // milliseconds.

// Cars framerate and updating is slow like the old game.
var gamespeed = 1;
var gamespeedMS = 1000 / gamespeed; // milliseconds.

var streetLightTimer = 1000;
var lightWidth = 0; //Global because we just so happens to use them as the width of the road as well.
var lightHeight = 0;
var orangeLightSize = 0;
var yellowLightSize = 0;

var carWidth = 0;
var carHeight = 0;

var roadWidth = 0;

var hiddenCanvas = document.createElement('canvas');
var hiddenCtx = hiddenCanvas.getContext("2d");

var player = {};

// The level is just a 3x3 double-array.
var level = [];

// Goes true every "game tick" so new cars can be inserted into the level, and most important, drawn to the screen.
var timeToCreateNewCars = false;

// Variable to store a fifth of the screens width, regardless of resolution.
var screenwidthFifth;

// The onresize, visibilitychange, blur and focus events makes sure the javascript detects when the 
// screen saver app gets minimized and maximized. 
// 
window.onresize = function() {
  Resize();
};
document.addEventListener("visibilitychange", function() {
  // This happen when browser gets minimized.
  if(document.hidden)
  {
  	EnterSomeKindOfPause();
  }
  else
  {
  	ResumeFromSomeKindOfPause();
  }
}, false);
window.addEventListener('blur', function(){
  EnterSomeKindOfPause();
}, false);
window.addEventListener('focus', function(){
  ResumeFromSomeKindOfPause();
}, false);
document.addEventListener("keydown", (e) => {
  e = e || window.event;
  if (e.keyCode === 37)
  {
    // left arrow pressed.
    PlayerMove("left");
  }
  else if (e.keyCode === 39)
  {
    // right arrow pressed.
    PlayerMove("right");
  }
});

// Called as soon as the page has loaded. This happens from the screen saver app.
// The init() function is the only function you need to have to make the screen saver work.
function init()
{
  // Resize the canvas so it fill up the entire screen.
  Resize();
    
  // Fetch the html element with the id 'canvas'. This is where we will do all drawing.
  var c = document.getElementById("canvas");
  var c2 = document.getElementById("top_canvas");
  
  // Setting willReadFrequently to true might increase speed as we are reading the entire image and redrawing it every frame.
  // https://stackoverflow.com/questions/74101155/chrome-warning-willreadfrequently-attribute-set-to-true
  ctx = c.getContext("2d", { willReadFrequently: true });
  topctx = c2.getContext("2d", { willReadFrequently: true });
  
  // Not sure it makes a difference right here, but scaling up gets pixelated, not softened. 
  c.style.imageRendering = "pixelated";
  c2.style.imageRendering = "pixelated";
  hiddenCanvas.style.imageRendering = "pixelated";
  
  // A winterstorm background should be almost white, not green. :)
  c.style.backgroundColor = "#eee";
  
  Now = Date.now();
  LastDraw = 0; // Make it draw first frame at once.
  
  createLevel();
  
  // Initiate all the data of the player object.
  createPlayer();
  
  // Start the game loop!
  GameLoop();
}

function Resize()
{
  ScreenWidth = window.innerWidth;
  ScreenHeight = window.innerHeight;
    
  var cs = document.getElementById('canvas');
  cs.height = ScreenHeight;
  cs.width = ScreenWidth;
  
  var topcs = document.getElementById('top_canvas');
  topcs.height = ScreenHeight;
  topcs.width = ScreenWidth;
  
  hiddenCanvas.height = ScreenHeight;
  hiddenCanvas.width = ScreenWidth;
  
  screenwidthFifth = ScreenWidth/5;
  
  lightWidth = ScreenWidth/23;
  lightHeight = ScreenHeight/20;
  orangeLightSize = ScreenHeight/215;
  yellowLightSize = ScreenHeight/350;
  
  roadWidth = lightWidth * 2;
  
  resizePlayer();
  //console.log();
}

// Create a double array of this format: level[y][x], where each "cell" is an object.
function createLevel()
{
  level = [];
  for(var y=0;y<4;y++)
  {
    level[y] = createLevelRow();
  }
}
function createLevelRow()
{
  var row = [];

  for(var x=0;x<3;x++)
  {
    row[x] = {
      hasCar: false
    };
  }
  
  return row;
}

function createPlayer()
{
  player = {
    HasMoved: false,
    RoadPos: 2, // Starting on the left side of the road.
    HasCollided: false,
    DeadTick: 0,
  };  
  
  resizePlayer();
}
function resizePlayer()
{
  player.Xposition = screenwidthFifth * 2;
  player.Yposition = (ScreenHeight/9) * 8;
  player.Ysize = ScreenHeight/10;
  player.Xsize = screenwidthFifth;
}

function EnterSomeKindOfPause()
{
  // Loosing focus or getting hidden, meaning screen saver should pause.
  screenSaverPaused = true;
}
function ResumeFromSomeKindOfPause()
{
  // Regaining focus, meaning screen saver is back in full screen.
  screenSaverPaused = false;
    
  GameLoop();
}

// Gets the direction and checks HasMoved(boolean) and if you can move any further in desired direction.
function PlayerMove(direction)
{
  if (direction == "left")
  {
    if (player.RoadPos <= 0)
      return;
    else
    {
      player.RoadPos--;
      player.HasMoved = true;
    }
  }
  else if (direction == "right")
  {
    if (player.RoadPos >= 2)
      return;
    else
    {
      player.RoadPos++;
      player.HasMoved = true;
    }
  }
  
  if(player.HasMoved)
  {
    player.Xposition = screenwidthFifth * (player.RoadPos +1);
    player.HasMoved = false;
  }
}

// The infurious loop
function GameLoop()
{
  if(screenSaverPaused)
  {
    // We got paused. Do not call requestAnimationFrame, just drop the loop until screen saver resumes.
    return;
  }

  Now = Date.now();
  ElapsedTime = Now - LastDraw;
  ElapsedCarsTime += ElapsedTime;
  streetLightTimer += ElapsedTime;
  
  if (ElapsedCarsTime >= gamespeedMS)
  {
    // Enough time has passed for all cars to update their positions.
    ElapsedCarsTime = 0;
    
    timeToCreateNewCars = true;
  }
  
  if (ElapsedTime >= fpsInterval)
  {
    // Enough time has passed, time to draw.
    LastDraw = Now;
    
    Draw();
  }
  
  // Always keep asking for the next animation frame.
  window.requestAnimationFrame(GameLoop);
}

// Every "game tick" check if the gamers car collides with any car in the bottom array. 
// Then move down the existing cars in the array, and create new ones on the top.
// Also draws the new ones, as in any real good unreadable code-snippet.
function GameTickTheCars()
{
  if(checkIfPlayerCollidesWithOtherCars())
  {
    // Game over! Draw some explosion, make a sound. Let it time out and then restart the game.
    player.HasCollided = true;
    player.DeadTick = 2;
  }
  
  tickDownAllCarsOneRow();
  createNewCars();
}
function checkIfPlayerCollidesWithOtherCars()
{
  return level[3][player.RoadPos].hasCar;
}
function tickDownAllCarsOneRow()
{
  level[3] = level[2];
  level[2] = level[1];
  level[1] = level[0];
  level[0] = createLevelRow(); // and fill up with an empty row at the top.
}
function createNewCars()
{
  var c = 0;
  for(var x=0;x<3;x++)
  {
    if(randomizeBool())
    {
      level[0][x].hasCar = true;
      c++;
    }
  }
  
  if(c == 3)
  {
    level[0][0].hasCar = false;
  }
  
  for (var x=0;x<3;x++)
  {
    if(level[0][x].hasCar == true)
    {
      ctx.fillStyle = "rgba(150,150,150,0.8)";
      ctx.fillRect(
        (ScreenWidth / 2) - lightWidth + x * (roadWidth / 3) + lightWidth * 0.2, // as in 3 lanes. 
        (ScreenHeight / 2) + lightHeight, 
        orangeLightSize * 4, 
        orangeLightSize * 3);
    }
  }
}
function drawAllCars()
{
  for(var y=0;y<4;y++)
  {
    for (var x=0;x<3;x++)
    {
      if(level[y][x].hasCar == true)
      {          
        topctx.fillStyle = "green";
        topctx.fillRect(
          (ScreenWidth / 2) - lightWidth + x * (roadWidth / 3) + lightWidth * 0.2, // as in 3 lanes. 
          (ScreenHeight / 2) + lightHeight + (y*50), 
          orangeLightSize * 4, 
          orangeLightSize * 3);
      }
    }
  }
}
function randomizeBool()
{
  if(Math.random() < 0.5)
    return false;
  
  return true;
}

function DrawStreetLights()
{
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.arc((ScreenWidth / 2) - lightWidth, (ScreenHeight / 2) + lightHeight, orangeLightSize, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((ScreenWidth / 2) + lightWidth, (ScreenHeight / 2) + lightHeight, orangeLightSize, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc((ScreenWidth / 2) - lightWidth, (ScreenHeight / 2) + lightHeight, yellowLightSize, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc((ScreenWidth / 2) + lightWidth, (ScreenHeight / 2) + lightHeight, yellowLightSize, 0, 2 * Math.PI);
  ctx.fill();
  
  streetLightTimer = 0;
}

function drawPlayerCar()
{
  if(player.HasCollided)
  {
    topctx.fillStyle = "red";
    ctx.fillStyle = "rgba(255,0,0,0.33)";
  }
  else
  {
    topctx.fillStyle = "blue";
    ctx.fillStyle = "rgba(80,80,80,0.5)";
  }
  
  ctx.fillRect(player.Xposition, player.Yposition, player.Xsize, player.Ysize);
  topctx.fillRect(player.Xposition, player.Yposition, player.Xsize, player.Ysize);
}

// Draw everything.
function Draw()
{
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  
  var min = 200;
  var max = 255 - min;
  r = min + Math.floor(Math.random() * max);
  g = b = r; // We want just grayscales. 
  
  // Copy the center rectangle, margins 10 px in from screen border. (meaning the copied picture is 20 px smaller on each side than original)
  var imgData = ctx.getImageData(0, 0, ScreenWidth, ScreenHeight);
  
  // Would be nice to be able to just use imgData directly with drawImage(), but it looks like we have to do it this way. 
  hiddenCtx.putImageData(imgData, 0, 0);
  
  var speed = 0.015;//0.01;  // Zoom-in speed.
  var xSide = ScreenWidth * speed;
  var ySide = ScreenHeight * speed;
  
  // Stretch out the copied (smaller) image over the entire canvas.
  // Note! We are drawing the _canvas_ object, not its 2d context. 
  ctx.drawImage(hiddenCanvas, xSide, ySide, ScreenWidth - xSide * 2, ScreenHeight - ySide * 2, 0, 0, ScreenWidth, ScreenHeight);
  
  // Now draw some snow particles in the center of the image.
  //ctx.fillStyle = "#fff";
  ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", 1)";
  for(var i=0; i<10; i++)
  {
    // Round snow
    var max = ScreenHeight/10;
    var minSize = ScreenHeight/400;
    var maxSize = ScreenHeight/80;
    
    var xRand = max - Math.floor(Math.random() * (max));  // 0 to max
    var yRand = max - Math.floor(Math.random() * (max));
    xRand -= max / 2;
    yRand -= max / 2;
    
    var size = minSize + Math.floor(Math.random() * (maxSize));
    
    ctx.beginPath();
    ctx.arc(ScreenWidth / 2 - 1 - xRand, ScreenHeight / 2 - 1 - yRand, size, 0, 2 * Math.PI);
    ctx.fill();
    
    // Square snow
    // var max = 50;
    // var xRand = max - Math.floor(Math.random() * (max));  // 0 to max
    // var yRand = max - Math.floor(Math.random() * (max));
    // xRand -= max / 2;
    // yRand -= max / 2;
    
    // var side = 2 + Math.floor(Math.random() * (10));
    
    // ctx.fillRect(ScreenWidth / 2 - 1 - xRand, ScreenHeight / 2 - 1 - yRand, side, side);
  }

  // Draws two "street lights"...
  if (streetLightTimer >= 500)
  {
    DrawStreetLights();
  }
  
  if(timeToCreateNewCars)
  {
    GameTickTheCars();
    timeToCreateNewCars = false;
    
    if(player.DeadTick > 0)
    {
      player.DeadTick--;
      
      if(player.DeadTick <= 0)
      {
        player.HasCollided = false;
      }
    }
  }
  
  // Draws the player car.
  drawAllCars();
  drawPlayerCar();
}

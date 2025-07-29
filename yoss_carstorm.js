// Strictly check for source code errors.
"use strict";
  
/**
 * This javascript has been designed to run with the app "Your Own Screen Saver". 
 * It is open source and free to use. Please leave these lines as a reference in code if you modify it. 
 * Programmer: Jon Lennryd 2019.
 * 
  * See more code examples at http://app.madskullcreations.com/yoss to get a better understanding about events and how to use the screen saver in different ways!
 *
 * What's this? 
 *  This is me thinking about an old demo on the Amiga in the terrific language Amos. The demo did exactly this: Snow-storm. 
 *  The effect is simple, it looks a bit like you are driving into the snow. 
 *  I put a slow framerate to mimick how slow it was on my Amiga. :) 
 * 
 *  This is using the canvas functions getImageData() and putImageData() with the drawImage() to copy the central part of the image, 
 *  and in the next frame draw it back, this time a tiny bit stretched to the edges of the screen, giving the effect of zooming in.
 * 
 */
  
// See Resize().
var ScreenWidth;
var ScreenHeight;

// It starts in paused mode, and gets activated by the focus event.
var screenSaverPaused = true;
    
// Canvas 2d surface, for drawing on.
var ctx = null;

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

var hiddenCanvas = document.createElement('canvas');
var hiddenCtx = hiddenCanvas.getContext("2d");

// Creating the player.
var player = new Object();
player.HasMoved;
player.Yposition;
player.Xposition;
player.RoadPos;
player.Ysize;
player.Xsize;

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
  
  ctx = c.getContext("2d");
  
  // Not sure it makes a difference right here, but scaling up gets pixelated, not softened. 
  c.style.imageRendering = "pixelated";
  hiddenCanvas.style.imageRendering = "pixelated";
  
  // A winterstorm background should be almost white, not green. :) 
  c.style.backgroundColor = "#eee";
  
  Now = Date.now();
  LastDraw = 0; // Make it draw first frame at once.
  
  // Initiate all the data of the player object.
  initPlayer();
  
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
  
  hiddenCanvas.height = ScreenHeight;
  hiddenCanvas.width = ScreenWidth;
  
  screenwidthFifth = ScreenWidth/5;
  
  //console.log();
}

function initPlayer()
{
  player.HasMoved = false;
  player.Yposition = (ScreenHeight/9) * 8;
  player.Xposition = screenwidthFifth * 2;
  player.RoadPos = 1; // Middle of road.
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
  if (player.HasMoved == true)
    return; // Player has already moved this frame, so no more of that thank you very much.
  
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
}
// Updates ALL cars positions.
function UpdateCarPositions()
{
  // If the player has moved, thereby changed it's RoadPos, it will now become visible.
  player.Xposition = screenwidthFifth * (player.RoadPos +1);
  // Reset the boolean so the player can move again next frame.
  player.HasMoved = false;
  
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
    UpdateCarPositions();
    ElapsedCarsTime = 0;
  }
  
  if (ElapsedTime >= fpsInterval)
  {
    // Enough time has passed, time to draw.
    LastDraw = Now;
    
    Draw(ctx);
  }
  
  // Always keep asking for the next animation frame.
  window.requestAnimationFrame(GameLoop);
}

// Draw everything.
function Draw(ctx)
{
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
  if (streetLightTimer >= 500)
  {
    var lightWidth = ScreenWidth/23;
    var lightHeight = ScreenHeight/20;
    var orangeLightSize = ScreenHeight/215;
    var yellowLightSize = ScreenHeight/350;
    
    // Draws two "street lights"...
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
  
  // Draws the player car.
  ctx.fillStyle = "blue";
  ctx.fillRect(player.Xposition, player.Yposition, player.Xsize, player.Ysize);
}

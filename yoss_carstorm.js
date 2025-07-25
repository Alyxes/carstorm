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

// I want the slow blocky framerate. 
var fps = 60;
var fpsInterval = 1000 / fps; // milliseconds.

var gamespeed = 1;
var gamespeedMS = 1000 / gamespeed; // milliseconds.


var hiddenCanvas = document.createElement('canvas');
var hiddenCtx = hiddenCanvas.getContext("2d");

var player;
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
  player.Yposition = (ScreenHeight/9) * 8;
  player.Xpositon = screenwidthFifth * 2
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
    var max = 50;
    var xRand = max - Math.floor(Math.random() * (max));  // 0 to max
    var yRand = max - Math.floor(Math.random() * (max));
    xRand -= max / 2;
    yRand -= max / 2;
    
    var side = 2 + Math.floor(Math.random() * (10));
    
    ctx.fillRect(ScreenWidth / 2 - 1 - xRand, ScreenHeight / 2 - 1 - yRand, side, side);
  }
}

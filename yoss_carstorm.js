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
 
 // TODO: Ta in pauskod från nyare skärmsläckare.
  
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
var fps = 30;
var fpsInterval = 1000 / fps; // milliseconds.

// Let the name and string be the same to avoid confusion. 
var gsNothing = "Nothing";
var gsStartScreen = "StartScreen";
var gsPlaying = "Playing";
var gsPaused = "Paused";
var gsGameOver = "GameOver";

// This was really fun to do, but lets SetState() check if the given parameter is an actual state or a syntax error.
var gameStates = [gsNothing,gsStartScreen,gsPlaying,gsPaused,gsGameOver];

// Then we set the state like this, to avoid spelling errors.
var gameState = gsNothing;

// Cars framerate and updating is slow like the old game.
var gamespeed = 1;
var gamespeedMS = 1000/gamespeed; // milliseconds.

var streetLightTimer = 1000;
var lightWidth = 0; //Global because we just so happens to use them as the width of the road as well.
var lightHeight = 0;
var orangeLightSize = 0;
var yellowLightSize = 0;

var player = {};

// The level is just a 3x3 double-array.
var level = [];

// Rad 4 är spelarens rad, och ska vara 1.0. Rad 0 är högst upp och ska vara 0. Rad 1 och 2 är de magiska feel-good siffrorna.
var rowPercentages = [0, 0.21, 0.6, 1.3];

var carWidth = 0;
var carHeight = 0;

var message = "";
var messageTimer = 0;
var nextLevel = 300;
var finalScore = 0;

var roadWidth = 0;

var hiddenCanvas = document.createElement('canvas');
var hiddenCtx = hiddenCanvas.getContext("2d");

// Goes true every "game tick" so new cars can be inserted into the level, and most important, drawn to the screen.
var timeToCreateNewCars = false;

// Variable to store a fifth of the screens width, regardless of resolution.
var screenwidthFifth;

var roadStartLeft;

var StartBGImage = new Image();
StartBGImage.src = "graphics/StartBackground.png";

// Called as soon as the page has loaded. This happens from the screen saver app.
// The init() function is the only function you need to have to make the screen saver work.
function init()
{
  // The onresize, visibilitychange, blur and focus events makes sure the javascript detects when the 
  // screen saver app gets minimized and maximized.
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
      // console.log("button left");
      PlayerMove("left");
    }
    else if (e.keyCode === 39)
    {
      // right arrow pressed.
      // console.log("button right");
      PlayerMove("right");
    }
  });
  document.addEventListener("mousedown", (e) => {
    e = e || window.event;
    if(e.button == 0) // Most of the time the left button
    {
      // Eeh, ugly but works. Spreading out game state checks this way is error prone.
      // TODO: Also, mousedown and touch events happens outside of the game loop, meaning it might
      // happen in the middle of things, yes/no? That can break things badly.
      if(gameState == gsPlaying)
      {
        if(e.clientX < ScreenWidth / 2)
        {
          // console.log("mousedown left");
          PlayerMove("left");
        }
        else
        {
          // console.log("mousedown right");
          PlayerMove("right");
        }
      }
      else if(gameState == gsStartScreen)
      {
        // Clicking the start screen starts a new game.
        SetState(gsPlaying);
      }
      else if(gameState == gsPaused)
      {
        // Clicking the pause screen resumes the game.
        SetState(gsPlaying);
      }
      else if(gameState == gsGameOver)
      {
        // Clicking the game over screen return you to the start screen.
        SetState(gsStartScreen);
      }
    }
  });
  
  // https://web.dev/learn/pwa/service-workers
  if ('ServiceWorker' in navigator)
  {
    navigator.ServiceWorker.register("/service_worker.js");
  }
  
  createLevel();
  // Initiate all the data of the player object.
  createPlayer();

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
  LastDraw = Now; // Setting this to Now fixed bug that set timers to zero in the beginning of the game.
  
  // We enter the game with the start screen visible.
  SetState(gsStartScreen);
  
  // Start the game loop!
  GameLoop();
}

function Resize()
{
  // If we are playing and the screen is resizing, it usually means player rotate the 
  // screen. So pause an active game to avoid chaos. :-)
  if(gameState == gsPlaying)
  {
    SetState(gsPaused);
  }
  
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
  
  carWidth = ScreenWidth/42;
  carHeight = ScreenHeight/50;
  
  roadWidth = lightWidth * 2;
  
  roadStartLeft = ScreenWidth/2 - lightWidth;
  
  resizePlayer();
  
  // Eftersom perspektiv är skumt, så konstaterar vi följande:
  // 
  //    /-| <- roadStartLeft
  //   /  |
  //  /   |
  // /----| <- screenwidthFifth
  //      ^
  //      Mitten av skärmen.
  // 
  // Så vi tar skillnaden mellan toppenpositionen och bottenpositionen, halfRoadWidthDiffTopToBottom.
  // 
  // Sen för att placera bilarna på rätt x-pos på respektive rad, så multiplicerar vi halfRoadWidthDiffTopToBottom med tex. 0.5.
  
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
    CanMove: false,
    RoadPos: 2, // Starting on the left side of the road.
    HasCollided: false,
    DeadTick: 0,
    Lives: 3,
    Score: 0,
    Xposition: 0,
    Yposition: 0,
    Ysize: 0,
    Xsize: 0,
  };
}
function resizePlayer()
{
  player.Xposition = screenwidthFifth * 2;
  player.Yposition = (ScreenHeight/9) * 8;
  player.Ysize = ScreenHeight/10;
  player.Xsize = screenwidthFifth;
}
function ResetGameVariables()
{
  // player
  player.RoadPos = 2;
  player.DeadTick = 0;
  player.Lives = 3;
  player.HasCollided = false;
  
  // game
  finalScore = 0;
  gamespeed = 1;
  gamespeedMS = 1000/gamespeed;
  nextLevel = 300;
}

function EnterSomeKindOfPause()
{
  // Loosing focus or getting hidden, meaning screen saver should pause.
  screenSaverPaused = true;
  
  // If we are playing it might be nice to return to a paused screen. :-)
  if(gameState == gsPlaying)
  {
    SetState(gsPaused);
  }
}
function ResumeFromSomeKindOfPause()
{
  // Regaining focus, meaning screen saver is back in full screen.
  screenSaverPaused = false;
  
  GameLoop();
}

function SetState(newState)
{
  if(gameStates.indexOf(newState) == -1)
  {
    throw "The state " + newState + " is not a valid state!";
  }
  
  // For example, going from the start screen to playing is cool, but nothing else.
  var transitionCool = false;
  switch(gameState)
  {
    case gsNothing:
      if(newState == gsStartScreen)
      {
        OnEnterStartScreen();
        transitionCool = true;
      }
      break;
    case gsStartScreen:
      if(newState == gsPlaying)
      {
        TransitFromStartScreenToPlaying();
        transitionCool = true;
      }
      break;
    case gsPlaying:
      // You can pause the game and you can die. The game is full of options.
      if(newState == gsPaused)
      {
        OnEnterPaused();
        transitionCool = true;
      }
      else if(newState == gsGameOver)
      {
        OnEnterGameOver();
        transitionCool = true;
      }
      break;
    case gsPaused:
      // To keep stuff simple, there is no restart or abort game button in pause mode.
      if( newState == gsPlaying)
      {
        TransitFromPausedToPlaying();
        transitionCool = true;
      }
      break;
    case gsGameOver:
      // To keep stuff simple, the start screen show up very short after game over.
      if(newState == gsStartScreen)
      {
        TransitFromGameOverToStartScreen();
        transitionCool = true;
      }
      break;
  }
  
  if(!transitionCool)
  {
    throw "Transition from " + gameState + " to " + newState + " is not valid!";
  }
  
  console.log("Transition from " + gameState + " to " + newState + "!");
  
  // The transition is ok, do it.
  gameState = newState;
}

function OnEnterStartScreen()
{
  messageTimer = 2000;
  ctx.drawImage(StartBGImage, 0, 0, 1024, 640, 0, 0, ScreenWidth, ScreenHeight);
  // Play a melody!
}
function TransitFromStartScreenToPlaying()
{
  player.CanMove = true;
  messageTimer = 0;
  
  // Starting a new game.
  // createLevel();
  // createPlayer();
  
  // TODO: Nåt händer här i som gör att bilen dyker upp som den ska efter game over. :) Jag tror det är fixat...
  // Resize();
}
function TransitFromPausedToPlaying()
{
  // Resume playing. I guess here will happen nothing.
}
function TransitFromGameOverToStartScreen()
{
  ResetGameVariables();
  messageTimer = 2000;
}
function OnEnterPaused()
{
  // Start a pause sound. (Lets see what happens when the app gets minimized..)
}
function OnEnterGameOver()
{
  // Start the game over trudelutt.
}

// Gets the direction and checks HasMoved(boolean) and if you can move any further in desired direction.
function PlayerMove(direction)
{
  var HasMoved = false;
  if (player.CanMove)
  {
    if (direction == "left")
    {
      if (player.RoadPos <= 0)
        return;
      else
      {
        player.RoadPos--;
        HasMoved = true;
      }
    }
    else if (direction == "right")
    {
      if (player.RoadPos >= 2)
        return;
      else
      {
        player.RoadPos++;
        HasMoved = true;
      }
    }
  }
  
  if(HasMoved)
  {
    player.Xposition = screenwidthFifth * (player.RoadPos +1);
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
  
  GameLoopGameState();
    
  // Always keep asking for the next animation frame.
  window.requestAnimationFrame(GameLoop);
}

function GameLoopGameState()
{
  switch(gameState)
  {
    case gsNothing:
      // This should never happen.
      break;
    case gsStartScreen:
      // Draw the start screen! Look for a touch/click meaning user want to start a new game!
      GameLoopStartScreen();
      break;
    case gsPlaying:
      // Draw game as usual.
      GameLoopPlaying();
      break;
    case gsPaused:
      // Draw game as usual, except time has "stopped". 
      // Draw a pause button, maybe in a canvas showing the paused "Playing" canvas in the background?
      break;
    case gsGameOver:
      // Draw game as usual, except time has "stopped" and the car is showing a crash-icon.
      GameLoopGameOver();
      break;
  }
}
function UpdateTimers()
{
  LastDraw = Now;
    
  ElapsedCarsTime += ElapsedTime;
  streetLightTimer += ElapsedTime;
}
function checkMessageTimer()
{
  if (messageTimer > 0)
  {
    messageTimer -= ElapsedTime;
    if (messageTimer < 0)
    {
      messageTimer = 0;
      message = "";
    }
  }
}
function checkElapsedCarsTime()
{
  if (ElapsedCarsTime >= gamespeedMS)
  {
    // Enough time has passed for all cars to update their positions.
    ElapsedCarsTime = 0;
    
    timeToCreateNewCars = true;
    
    if (timeToCreateNewCars)
      GameTickTheCars();
  }
}
function checkPlayerTimersAndScore()
{
  if (timeToCreateNewCars)
  {
    if (player.DeadTick > 0)
    {
      player.DeadTick--;
      
      if(player.DeadTick <= 0)
      {
        player.DeadTick = 0;
        player.HasCollided = false;
      }
    }
    else
    {
      // Player didn't die! Check if there were any cars to pass that will grant some score.
      if (player.Lives > 0)
      {
        player.Score += 10 * checkAmountOfCarsToGetPoints();
        
        if (player.Score >= nextLevel)
        {
          gamespeed += 0.2;
          gamespeedMS = 1000/gamespeed;
          
          nextLevel += 300 * gamespeed;
          
          message = "SPEED INCREASE";
          messageTimer = 2000;
        }
      }
    }
  }
}
function GameLoopStartScreen()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    
    checkMessageTimer();
    
    DrawGame();
  }
  // Draw the start screen. Look for touch event to start the game.
}
function GameLoopPlaying()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    
    checkMessageTimer();
    
    checkElapsedCarsTime();
    
    checkPlayerTimersAndScore();
    
    DrawGame();
  }  
}
function GameLoopGameOver()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    
    checkElapsedCarsTime();
    
    DrawGame();
  }
}

// Every "game tick" check if the gamers car collides with any car in the bottom array. 
// Then move down the existing cars in the array, and create new ones on the top.
function GameTickTheCars()
{
  tickDownAllCarsOneRow();
  if (player.DeadTick == 0)
  {
    createNewCars();
  
    if(checkIfPlayerCollidesWithOtherCars())
    {
      // Crashing into a car! Draw some explosion, make a sound. 
      player.HasCollided = true;
      player.Lives--;
      player.DeadTick = 4;
      
      if (player.Lives <= 0)
      {
        // Game over! Show and play death animation. Wait for user to click away.
        messageTimer = 0; // For safety, so that the message won't be perpetuated on the game over screen.
        finalScore = player.Score;
        player.Score = 0;
        player.DeadTick = -1;
        player.CanMove = false;
        
        SetState(gsGameOver);
        
        // Tycker detta ska resettas först när man väljer att försöka igen.
        // gamespeed = 1;
        // gamespeedMS = 1000/gamespeed;
      }
    }
  }
}
function checkIfPlayerCollidesWithOtherCars()
{
  return level[3][player.RoadPos].hasCar;
}
function checkAmountOfCarsToGetPoints()
{
  var amount = 0;
  for (var i = 0; i < 3; i++)
  {
    if (level[3][i].hasCar)
      amount++;
  }
  return amount;
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
  var fillAll = false;
  var c = 0;
  for(var x=0;x<3;x++)
  {
    if(fillAll || randomizeBool())
    {
      level[0][x].hasCar = true;
      c++;
    }
  }
  
  if(c == 3 && !fillAll)
  {
    level[0][0].hasCar = false;
  }
}
function drawAllCars()
{
  // Precise numbers to center the cars and give them perfect space between.
  // Don't touch without saving original numbers!!
  var roadWidthDivide = 2.75;
  var roadWidthMultiply = 2.305;
  
  var greyTone = 230;

  for(var y=0;y<3;y++)
  {
    var xPos = roadStartLeft - screenwidthFifth * rowPercentages[y];
    var yPos = (ScreenHeight / 2) * rowPercentages[y] * 0.5;
    
    switch (y)
    {
      case 0:
        greyTone = 170;
        break;
      case 1:
        greyTone = 142;
        break;
      case 2:
        greyTone = 64;
        break;
    }
    
    for (var x=0;x<3;x++)
    {
      if(level[y][x].hasCar == true)
      {
        switch (x)
        {
          case 0:
            xPos = roadStartLeft - screenwidthFifth * rowPercentages[y];
            break;
          case 1:
            xPos = (roadStartLeft - screenwidthFifth * rowPercentages[y]) - (carWidth * 2.25 * rowPercentages[y]);
            break;
          case 2:
            xPos = (roadStartLeft - screenwidthFifth * rowPercentages[y]) - (carWidth * 4.5 * rowPercentages[y]);
            break;
        }

        if (timeToCreateNewCars && y == 0)
        {
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(
            xPos + x * ((roadWidth / roadWidthDivide) + (roadWidth * roadWidthMultiply) * rowPercentages[y]), // as in 3 lanes. 
            (ScreenHeight / 2) + lightHeight  + yPos, 
            carWidth + (carWidth * 4.5 * rowPercentages[y]), 
            carHeight + (carHeight * 3.5 * rowPercentages[y]));
        }
        
        topctx.fillStyle = "rgba(" + greyTone + "," + greyTone + "," + greyTone + ",1)";
        topctx.fillRect(
          xPos + x * ((roadWidth / roadWidthDivide) + (roadWidth * roadWidthMultiply) * rowPercentages[y]), // as in 3 lanes. 
          (ScreenHeight / 2) + lightHeight + yPos, 
          carWidth + (carWidth * 4.5 * rowPercentages[y]), 
          carHeight + (carHeight * 3.5 * rowPercentages[y]));
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
    topctx.fillStyle = "rgba(255,200,0,1)";
    ctx.fillStyle = "rgba(255,120,0,0.2)";
  }
  else
  {
    topctx.fillStyle = "black";
    ctx.fillStyle = "rgba(0,0,0,0.1)";
  }
  
  ctx.fillRect(player.Xposition, player.Yposition, player.Xsize, player.Ysize);
  topctx.fillRect(player.Xposition, player.Yposition, player.Xsize, player.Ysize);
}

// Draw everything.
function DrawGame()
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
  
  var speed = 0.0106 * gamespeed;//0.01;  // Zoom-in speed.
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
  
  if (gameState == gsStartScreen)
  {
    var gameTitleFontSize = 6.5;
    var touchScreenToPlayFontSize = 3;
    
    topctx.fillStyle = "black";
    topctx.font = gameTitleFontSize + "vw Arial";
    topctx.fillText("CARSTORM", ScreenWidth/2 -ScreenWidth/5.5, ScreenHeight/2 - ScreenHeight/5);
    
    if (messageTimer == 0)
    {
      topctx.font = touchScreenToPlayFontSize + "vw Arial";
      topctx.fillText("touch screen to drive", ScreenWidth/2 -ScreenWidth/7.2, ScreenHeight/2- ScreenHeight/18);
    }
  }
  else
  {
    // Draws two "street lights"...
    if (streetLightTimer >= 1000)
    {
      DrawStreetLights();
    }
    
    // Draws the player car.
    drawAllCars();
    
    if(timeToCreateNewCars)
      timeToCreateNewCars = false;
    
    drawPlayerCar();
    
    topctx.fillStyle = "black";
    
    for (var i = 0; i < player.Lives; i++)
    {
      topctx.fillRect(carWidth + carWidth * 3.5 * i, carHeight * 6, carWidth * 3, carHeight * 2.3);
    }
    
    // Dessa ska flyttas till toppen sen när vi är klara här. De kanske behöver ändras i Resize() såsmåningom.
    var scoreFontSize = 3.5;
    var gameOverFontSize = 6;
    var finalScoreFontSize = 2.6;
    var messageFontSize = 3;
    
    if (player.Lives > 0)
    {
      topctx.font = scoreFontSize + "vw Arial";
      topctx.fillText(player.Score, ScreenWidth - ScreenWidth/10, ScreenHeight/11);
    }
    
    if (messageTimer > 0 && messageTimer%600 < 300)
    {
      topctx.fillStyle = "black";
      topctx.font = messageFontSize + "vw Arial";
      topctx.fillText(message, ScreenWidth/2 -ScreenWidth/7.4, ScreenHeight/2 - ScreenHeight/7);
    }
    
    if (player.Lives <= 0)
    {
      topctx.fillStyle = "darkorange";
      topctx.font = gameOverFontSize + "vw Arial";
      topctx.fillText("GAME OVER", ScreenWidth/2 -ScreenWidth/5.35, ScreenHeight/2 -ScreenHeight/8);
      topctx.fillStyle = "black";
      topctx.font = finalScoreFontSize + "vw Arial";
      topctx.fillText("Your final score was", ScreenWidth/2 -ScreenWidth/8.5, ScreenHeight/2 -ScreenHeight/25);
      topctx.fillText(finalScore, ScreenWidth/2 -ScreenWidth/60, ScreenHeight/2 + ScreenHeight/60);
    }
  }
}

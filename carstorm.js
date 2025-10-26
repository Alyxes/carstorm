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

var textScale;

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
var gsLoadingScreen = "LoadingScreen";
var gsStartScreen = "StartScreen";
var gsPlaying = "Playing";
var gsCrashed = "Crashed";
var gsPaused = "Paused";
var gsGameOver = "GameOver";
var gsWinGame = "WinGame";

// This was really fun to do, but lets SetState() check if the given parameter is an actual state or a syntax error.
var gameStates = [ gsNothing, gsLoadingScreen, gsStartScreen, gsPlaying, gsCrashed, gsPaused, gsGameOver, gsWinGame ];

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
var touchMessageFontSize = 6;

var player = null;

// The level is just a 3x3 double-array.
var level = [];

// Rad 4 är spelarens rad, och ska vara 1.0. Rad 0 är högst upp och ska vara 0. Rad 1 och 2 är de magiska feel-good siffrorna.
var rowPercentages = [0, 0.21, 0.6, 1.3];

var carWidth = 0;
var carHeight = 0;

var loadScreenTimer = 2000;
var messageTimer = 0;
var nextLevel = 300;
var finalScore = 0;
var clearStreetTimer = 0;
var lastDriveScore = 0;
var bestHighScore = 0;
var WinningScore = 9999;

var roadWidth = 0;

var hiddenCanvas = document.createElement('canvas');
var hiddenCtx = hiddenCanvas.getContext("2d");

// Variable to store a fifth of the screens width, regardless of resolution.
var screenwidthFifth;

var roadStartLeft;

var TimeToGoBackToPlay = 0;

var explosionAnim = [3];
var currentExplosionFrame;
var currentExplosionFrameIndex = 0;
var explosionAnimFrameLength = 0;
var explosionAnimTimer = 0;
var explosionAnimFrameCounter = 0;

const audioStart = new Audio("sound/start.mp3");
const audioBlip = new Audio("sound/blip.mp3");
const audioMove = new Audio("sound/move.mp3");
const audioCrash = new Audio("sound/crash.mp3");
const audioGameOver = new Audio("sound/gameover.mp3");

var StartBGImage = new Image();
StartBGImage.src = "graphics/StartBackground.png";

var PlayerCarImage = new Image();
PlayerCarImage.src = "graphics/PlayerCar.png";
var PlayerLifeImage = new Image();
PlayerLifeImage.src = "graphics/PlayerLife.png";

var EnemyCar1Image = new Image();
EnemyCar1Image.src = "graphics/EnemyCar1.png";
var EnemyCar2Image = new Image();
EnemyCar2Image.src = "graphics/EnemyCar2.png";
var EnemyCar3Image = new Image();
EnemyCar3Image.src = "graphics/EnemyCar3.png";

var EnemyCarShadowImage = new Image();
EnemyCarShadowImage.src = "graphics/EnemyCarShadow.png";
var PlayerCarShadowImage = new Image();
PlayerCarShadowImage.src = "graphics/PlayerCarShadow.png";

var Explosion1Image = new Image();
Explosion1Image.src = "graphics/Explosion1.png";
var Explosion2Image = new Image();
Explosion2Image.src = "graphics/Explosion2.png";
var Explosion3Image = new Image();
Explosion3Image.src = "graphics/Explosion3.png";
var Smoke1Image = new Image();
Smoke1Image.src = "graphics/Smoke1.png";
var Smoke2Image = new Image();
Smoke2Image.src = "graphics/Smoke2.png";

var MadSkullLogoImage = new Image();
MadSkullLogoImage.src = "graphics/MadSkullCreationsLogo.png";
var TitleBGImage = new Image();
TitleBGImage.src = "graphics/TitleBGImage.png";

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
    
    // TODO: Remove if it keeps getting ugly, mouse/touch is enough.
    if(gameState == gsPlaying)
    {
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
    }
  });
  document.addEventListener("mousedown", (e) => {
    e = e || window.event;
    if(e.button == 0) // Most of the time the left button
    {
      // console.log("mousedown: " + e.button);
      
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
      else if (gameState == gsLoadingScreen)
      {
        if (loadScreenTimer <= 0)
          SetState(gsStartScreen);
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
        // Clicking the game over screen returns you to the start screen.
        if (messageTimer <= 0)
          SetState(gsStartScreen);
      }
      else if (gameState == gsWinGame)
      {
        // Clicking the winning game screen returns you to the start screen.
        if (messageTimer <= 0)
          SetState(gsStartScreen);
      }
    }
  });
  
  // Pilla inte Tim.
  // https://web.dev/learn/pwa/service-workers
  if ('serviceWorker' in navigator)
  {
    navigator.serviceWorker.register("/service_worker.js");
  }
  
  // Trist, variabler i service_worker.js är inte åtkomliga härifrån. (Är ju i en annan tråd så det är ju iofs. logiskt)
  /*if(ServiceWorkerVersion != "slork")
  {
    console.log("It IS available from here! " + ServiceWorkerVersion);
  }*/
  
  // Trist 2, caches kan inte lagra annat än "Response" objekt, dvs. filer som dras ner från servern o sånt.  
  /*console.log("Test open cache.");
  caches.match("ServiceWorkerVersion").then(cache => {
    console.log("Fint! Gick att öppna cachen. ");
    console.log(cache);
  });*/
  
  CreateLevel();
  CreatePlayer();
    
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
  
  explosionAnim[0] = Explosion1Image;
  explosionAnim[1] = Explosion2Image;
  explosionAnim[2] = Explosion3Image;
  
  currentExplosionFrame = explosionAnim[currentExplosionFrameIndex];
  
  Now = Date.now();
  LastDraw = Now; // Setting this to Now fixed bug that set timers to zero in the beginning of the game.
  
  // Resize the canvas so it fill up the entire screen.
  Resize();
  
  // We enter the game with the loading screen visible.
  SetState(gsLoadingScreen);
  
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
  
  textScale = ScreenWidth / 3840;
  textScale = textScale + ((1-textScale)/2);
  
  screenwidthFifth = ScreenWidth/5;
  
  lightWidth = ScreenWidth/23;
  lightHeight = ScreenHeight/20;
  orangeLightSize = ScreenWidth/370;
  yellowLightSize = ScreenWidth/480;
  
  carWidth = ScreenWidth/42;
  carHeight = carWidth * 0.536;
  // carHeight = ScreenHeight/50;
  
  roadWidth = lightWidth * 2;
  
  roadStartLeft = ScreenWidth/2 - lightWidth;
  
  ResizePlayer();
  
  ctx.drawImage(StartBGImage, 0, 0, ScreenWidth, ScreenHeight);
  
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
function CreateLevel()
{
  level = [];
  for(var y=0;y<4;y++)
  {
    level[y] = CreateLevelRow();
  }
}
function CreateLevelRow()
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

function CreatePlayer()
{
  player = {
    RoadPos: 2, // Starting on the right side of the road.
    HasCollided: false,
    CrashState: "None",
    Lives: 3,
    LivesBlinkTimer: 0,
    Score: 0,
    Xposition: 0,
    Yposition: 0,
    Ysize: 0,
    Xsize: 0,
  };
  
  // As it also position the player onscreen, this is sensible to call after player creation. :-)
  ResizePlayer();
}
function ResizePlayer()
{
  // Eventually a resize event happens before a player object has been created, so check for it.
  if(player)
  {
    player.Xposition = screenwidthFifth * (player.RoadPos + 1);
    player.Yposition = (ScreenHeight/5) * 4;
    player.Xsize = screenwidthFifth;
    player.Ysize = player.Xsize * 0.548;
  }
}
function ResetGameVariables()
{
  // player
  CreatePlayer();
  
  // game
  finalScore = 0;
  gamespeed = 1;
  gamespeedMS = 1000/gamespeed;
  nextLevel = 300;
  explosionAnimFrameCounter = 0;
}
function SetScoreStatistics()
{
  // Right now we only save the last drive score, and the best score yet.
  lastDriveScore = player.Score;
  
  if (lastDriveScore > bestHighScore)
    bestHighScore = lastDriveScore;
  
  // In the future this function can be used to save amount of drives, time between deaths, and so on. Any statistics we want to save, for
  // the player to view or just for ourselves. :)
}

function EnterSomeKindOfPause()
{
  // Loosing focus or getting hidden, meaning screen saver should pause.
  screenSaverPaused = true;
  
  // If we are playing it might be nice to return to a paused screen. :-)
  if(gameState == gsPlaying)
  {
    touchMessageFontSize = 7 * textScale;
    
    topctx.fillStyle = "black";
    topctx.textAlign = "center";
    topctx.font = touchMessageFontSize + "vw Arial";
    topctx.fillText("touch screen to continue", ScreenWidth/2, ScreenHeight/2);
    
    SetState(gsPaused);
  }
  else if(gameState == gsStartScreen)
  {
    loadScreenTimer = 2000;
    SetState(gsLoadingScreen);
  }
}
function ResumeFromSomeKindOfPause()
{
  // Regaining focus, meaning screen saver is back in full screen.
  screenSaverPaused = false;
  
  LastDraw = Date.now();
  
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
      if(newState == gsLoadingScreen)
      {
        transitionCool = true;
      }
      break;
    case gsLoadingScreen:
      if(newState == gsStartScreen)
      {
        OnEnterStartScreen();
        transitionCool = true;
      }
    case gsStartScreen:
      if(newState == gsPlaying)
      {
        TransitFromStartScreenToPlaying();
        transitionCool = true;
      }
      else if (newState == gsLoadingScreen)
      {
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
      /*else if(newState == gsGameOver)
      {
        OnEnterGameOver();
        transitionCool = true;
      }*/
      else if(newState == gsWinGame)
      {
        OnEnterWinGame();
        transitionCool = true;
      }
      else if(newState == gsCrashed)
      {
        TransitFromPlayingToCrashed();
        transitionCool = true;
      }
      break;
    case gsCrashed:
      if(newState == gsPlaying)
      {
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
      if(newState == gsPlaying)
      {
        TransitFromPausedToPlaying();
        transitionCool = true;
      }
      break;
    case gsGameOver:
      // After a timer, player can click/touch screen to go back to the start screen.
      if(newState == gsStartScreen)
      {
        TransitFromGameOverToStartScreen();
        transitionCool = true;
      }
      break;
    case gsWinGame:
    // After a timer, player can click/touch screen to go back to the start screen.
      if(newState == gsStartScreen)
      {
        TransitFromWinGameToStartScreen();
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
  messageTimer = 2000; // Used for the message "touch screen to drive".
  // Play a melody!
}
function TransitFromStartScreenToPlaying()
{
  messageTimer = 0; // Reset to be used for "SPEED INCREASE".
  explosionAnimFrameLength = 400;
  
  audioStart.play();
}
function TransitFromPlayingToCrashed()
{
  // Crashing into a car! Draw some explosion, make a sound. 
  player.HasCollided = true;
  player.LivesBlinkTimer = 600;
  player.CrashState = "Exploding";
  
  currentExplosionFrameIndex = randomizeNumber(3);
  currentExplosionFrame = explosionAnim[currentExplosionFrameIndex];
  explosionAnimTimer = explosionAnimFrameLength;
  
  clearStreetTimer = 250;

  TimeToGoBackToPlay = Now + 4000;
  audioCrash.play();
}
function TransitFromPausedToPlaying()
{
  // Resume playing. I guess here will happen nothing.
}
function TransitFromGameOverToStartScreen()
{
  ResetGameVariables();
  messageTimer = 2000; // Reset for "touch screen to drive" message again.
}
function TransitFromWinGameToStartScreen()
{
  ResetGameVariables();
  messageTimer = 2000; // Reset for "touch screen to drive" message again.
}
function OnEnterPaused()
{
  // Start a pause sound. (Lets see what happens when the app gets minimized..)
}
function OnEnterGameOver()
{
  // Start the game over trudelutt.
  messageTimer = 2000; // Set for the "touch screen to restart" message.
}
function OnEnterWinGame()
{
  // Start winning trudelutt.
  messageTimer = 4000; // Set for the "touch screen to play again" message.
}

// Gets the direction and checks HasMoved(boolean) and if you can move any further in desired direction.
function PlayerMove(direction)
{
  var HasMoved = false;

  //console.log("player.RoadPos: " + player.RoadPos);
  
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
  
  if(HasMoved)
  {
    player.Xposition = screenwidthFifth * (player.RoadPos + 1);
    audioMove.play();
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

  // Gives milliseconds since January 1, 1970. TODO: Use timestamp as param in GameLoop() !!
  Now = Date.now();
  ElapsedTime = Now - LastDraw;
  
  // TODO: Should be here, but Date.now() returns integer ms, and the diff (ElapsedTime) can be zero sometimes.
  // LastDraw = Now;

  switch(gameState)
  {
    case gsNothing:
      // This should never happen.
      break;
    case gsLoadingScreen:
      GameLoopLoadingScreen();
      break;
    case gsStartScreen:
      // Draw the start screen! Look for a touch/click meaning user want to start a new game!
      GameLoopStartScreen();
      break;
    case gsPlaying:
      // Draw game as usual.
      GameLoopPlaying();
      break;
    case gsCrashed:
      GameLoopCrashed();
      break;
    case gsPaused:
      // Draw game as usual, except time has "stopped".
      // Draw a pause button, maybe in a canvas showing the paused "Playing" canvas in the background?
      break;
    case gsGameOver:
      // Draw game as usual, except enemy cars stop coming and player car is smoking and can't be moved.
      GameLoopGameOver();
      break;
    case gsWinGame:
      // Draw game as usual, enemy cars stop coming, player can't control, happy win message printed.
      GameLoopWinGame();
      break;
  }
    
  // Always keep asking for the next animation frame.
  window.requestAnimationFrame(GameLoop);
}

function UpdateTimers()
{
  LastDraw = Now;
  
  ElapsedCarsTime += ElapsedTime;
  streetLightTimer += ElapsedTime;
  if (clearStreetTimer > 0)
  {
    clearStreetTimer -= ElapsedTime;
    if (clearStreetTimer <= 0)
    {
      clearStreetTimer = 0;
      ClearTheStreet();
    }
  }
}
function checkMessageTimer()
{
  if (messageTimer > 0)
  {
    messageTimer -= ElapsedTime;
    if (messageTimer < 0)
    {
      messageTimer = 0;
    }
  }
}
function checkElapsedCarsTime()
{
  if (ElapsedCarsTime >= gamespeedMS)
  {
    // Enough time has passed for all cars to update their positions.
    ElapsedCarsTime = 0;
        
    GameTickTheCars();
    
    DrawAllCars(true);
  }
}
function ScorePassedCars()
{
  player.Score += 10 * checkAmountOfCarsToGetPoints();
  
  if (player.Score >= WinningScore)
  {
    player.Score = WinningScore;
    
    SetScoreStatistics();
    
    EndGameVariableResets();
    
    SetState(gsWinGame);
  }
  else if (player.Score >= nextLevel)
  {
    gamespeed += 0.1;
    gamespeedMS = 1000/gamespeed;
    
    nextLevel += 300 * gamespeed;
    // explosionAnimFrameLength must diminish maybe?
    
    messageTimer = 2000;
  }
}
function checkLivesBlinkTimer()
{
  if (player.LivesBlinkTimer > 0)
  {
    player.LivesBlinkTimer -= ElapsedTime;
    
    // This one keeps going until it's reset somewhere else.
    if (player.LivesBlinkTimer <= 0)
      player.LivesBlinkTimer = 600;
  }
}

function GameLoopLoadingScreen()
{
  if (ElapsedTime >= fpsInterval)
  {
    LastDraw = Now;
    
    if (loadScreenTimer > 0)
    {
      loadScreenTimer -= ElapsedTime;
      
      if (loadScreenTimer <= 0)
        loadScreenTimer = 0;
    }
    
    DrawSnowstorm(); // We start drawing it in the background already. Because... yeah.
    
    topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
    
    // This will be an image later.
    topctx.fillStyle = "white";
    topctx.fillRect(0,0,ScreenWidth,ScreenHeight);
    
    var LogoFontSize = 5 * textScale;
    touchMessageFontSize = 6 * textScale;
    
    // Maybe we shouldn't have to draw this image every loop... But do we want ANOTHER ctx for that?
    // Maybe not draw DrawSnowstorm(), but use regular ctx here for it. Draw it once in a middle function.
    topctx.drawImage(TitleBGImage, 0, 0, ScreenWidth, ScreenHeight);
    topctx.drawImage(MadSkullLogoImage, ScreenWidth/2 - ScreenWidth/5.5, ScreenHeight/2 - ScreenHeight/14, ScreenWidth/2.82, carWidth * 2);
    
    if (loadScreenTimer <= 0)
    {
      topctx.fillStyle = "black";
      topctx.textAlign = "center";
      topctx.font = touchMessageFontSize + "vw Arial";
      topctx.fillText("touch screen to start", ScreenWidth/2, ScreenHeight/2 + ScreenHeight/10);
    }
  }
}

function GameLoopStartScreen()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    checkMessageTimer();
    
    DrawSnowstorm();
    
    var titleFontSize = 14 * textScale;
    touchMessageFontSize = 6 * textScale;
    
    // The cars and text are drawn here so they don't get smeared.
    topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
    
    topctx.fillStyle = "black";
    topctx.textAlign = "center";
    topctx.font = titleFontSize + "vw Arial";
    topctx.fillText("CARSTORM", ScreenWidth/2, ScreenHeight/2 - ScreenHeight/6);
    
    if (lastDriveScore > 0)
    {
      var highScoreFontSize = 3 * textScale;
      
      topctx.textAlign = "right";
      topctx.font = highScoreFontSize + "vw Arial";
      
      topctx.fillText("last drive score: ", ScreenWidth - ScreenWidth/10, ScreenHeight - ScreenHeight/9.5);
      topctx.fillText("highscore: ", ScreenWidth - ScreenWidth/10, ScreenHeight - ScreenHeight/18);
      
      topctx.textAlign = "left";
      
      topctx.fillText(lastDriveScore, ScreenWidth - ScreenWidth/10, ScreenHeight - ScreenHeight/9.5);
      topctx.fillText(bestHighScore, ScreenWidth - ScreenWidth/10, ScreenHeight - ScreenHeight/18);
    }
  
    
    if (messageTimer == 0)
    {
      topctx.textAlign = "center";
      topctx.font = touchMessageFontSize + "vw Arial";
      topctx.fillText("touch screen to drive", ScreenWidth/2, ScreenHeight/2- ScreenHeight/45);
    }
  }
  // Draw the start screen. Look for touch event to start the game.
}

function GameLoopCrashed()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    checkLivesBlinkTimer();
    
    if (explosionAnimTimer > 0)
    {
      explosionAnimTimer -= ElapsedTime;
      if (explosionAnimTimer <= 0)
      {
        explosionAnimTimer = explosionAnimFrameLength;
        
        if (player.CrashState == "Exploding")
          explosionAnimFrameCounter++;
        
        currentExplosionFrameIndex++;
        
        if (currentExplosionFrameIndex > 2)
          currentExplosionFrameIndex = 0;
        
        currentExplosionFrame = explosionAnim[currentExplosionFrameIndex];
        
        if (explosionAnimFrameCounter >= 3)
        {
          explosionAnimFrameCounter = 0;
        }
      }
    }
    
    DrawSnowstorm();
    
    // The cars and text are drawn here so they don't get smeared.
    topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
    DrawStreetLights();
    DrawAllCars(false);
    DrawPlayerCar();    
    DrawPlayerLives();
    
    if(Now > TimeToGoBackToPlay)
    {
      player.Lives--;
      
      if (player.Lives <= 0)
      {
        // Game over! Show and play death animation. Wait for user to click away.
        SetScoreStatistics();
        
        finalScore = player.Score;
        player.Score = 0;
        
        audioGameOver.play();
        
        EndGameVariableResets();
        
        SetState(gsGameOver);
      }
      else
      {
        player.LivesBlinkTimer = 0;
        
        player.RoadPos = 2;
        player.Xposition = screenwidthFifth * (player.RoadPos + 1);
        
        player.CrashState = "None";
        player.HasCollided = false;
        explosionAnimTimer = 0;
        explosionAnimFrameCounter = 0;
        
        SetState(gsPlaying);
      }
    }
  }
}

function GameLoopPlaying()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    checkMessageTimer();
    checkElapsedCarsTime();
    checkLivesBlinkTimer();

    DrawSnowstorm();

    // The cars and text are drawn here so they don't get smeared.
    topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
    DrawStreetLights();
    DrawAllCars(false);
    DrawPlayerCar();
    DrawPlayerLives();
    
    var scoreFontSize = 8 * textScale;
    touchMessageFontSize = 6 * textScale;
    
    topctx.fillStyle = "black";
    topctx.textAlign = "left";
    topctx.font = scoreFontSize + "vw Arial";
    topctx.fillText(player.Score, ScreenWidth - ScreenWidth/5, ScreenHeight/6.5);
    
    if (messageTimer > 0 && messageTimer%600 < 300)
    {
      topctx.textAlign = "center";
      topctx.font = touchMessageFontSize + "vw Arial";
      topctx.fillText("SPEED INCREASE", ScreenWidth/2, ScreenHeight/2 - ScreenHeight/7);
    }
  }  
}
function GameLoopGameOver()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    checkMessageTimer();
    checkLivesBlinkTimer();

    DrawSnowstorm();

    // The cars and text are drawn here so they don't get smeared.
    topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
    DrawStreetLights();
    DrawAllCars(false);
    DrawPlayerCar();
        
    var gameOverFontSize = 13 * textScale;
    var finalScoreFontSize = 5 * textScale;
    touchMessageFontSize = 6 * textScale;

    topctx.fillStyle = "darkorange";
    topctx.textAlign = "center";
    topctx.font = gameOverFontSize + "vw Arial";
    topctx.fillText("GAME OVER", ScreenWidth/2, ScreenHeight/2 -ScreenHeight/7);
    topctx.fillStyle = "black";
    topctx.font = finalScoreFontSize + "vw Arial";
    topctx.fillText("Your final score was", ScreenWidth/2, ScreenHeight/2 -ScreenHeight/32);
    topctx.fillText(finalScore, ScreenWidth/2, ScreenHeight/2 + ScreenHeight/13.5);
    
    if (messageTimer == 0)
    {
      topctx.textAlign = "center";
      topctx.font = touchMessageFontSize + "vw Arial";
      topctx.fillText("touch screen to restart", ScreenWidth/2, ScreenHeight/2 + ScreenHeight/5.5);
    }
  }
}
function GameLoopWinGame()
{
  if (ElapsedTime >= fpsInterval)
  {
    UpdateTimers();
    checkMessageTimer();
    checkElapsedCarsTime();
    checkLivesBlinkTimer();
      
    DrawSnowstorm();

    // The cars and text are drawn here so they don't get smeared.
    topctx.clearRect(0,0,ScreenWidth,ScreenHeight);

    // The street lights shouldn't stop because you've finished the game.
    DrawStreetLights();
    
    DrawAllCars(false);
    
    DrawPlayerCar();
    
    DrawPlayerLives();
    
    var finalScoreFontSize = 9 * textScale;
    var victoryFontSize = 13.5 * textScale;
    var superPlayerFontSize = 6.5 * textScale;
    touchMessageFontSize = 6 * textScale;
    
    topctx.fillStyle = "yellow";
    topctx.strokeStyle = "black";
    topctx.lineWidth = 5 * textScale;
    topctx.textAlign = "left";
    topctx.font = finalScoreFontSize + "vw Arial";
    topctx.fillText(player.Score, ScreenWidth - ScreenWidth/4, ScreenHeight/6);
    topctx.strokeText(player.Score, ScreenWidth - ScreenWidth/4, ScreenHeight/6);
    
    topctx.fillStyle = "white";
    topctx.strokeStyle = "black";
    topctx.lineWidth = 8 * textScale;
    topctx.textAlign = "center";
    topctx.font = victoryFontSize + "vw Arial";
    topctx.fillText("VICTORY", ScreenWidth/2, ScreenHeight/2 -ScreenHeight/10);
    topctx.strokeText("VICTORY", ScreenWidth/2, ScreenHeight/2 -ScreenHeight/10);
    
    if (messageTimer < 2500)
    {
      // Should be 1.5 seconds after winning.
      topctx.fillStyle = "yellow";
      topctx.strokeStyle = "black";
      topctx.lineWidth = 4 * textScale;
      topctx.font = superPlayerFontSize + "vw Arial";
      topctx.fillText("You are a super player", ScreenWidth/2, ScreenHeight/2 + ScreenHeight/25);
      topctx.strokeText("You are a super player", ScreenWidth/2, ScreenHeight/2 + ScreenHeight/25);
    }
    
    if (messageTimer == 0)
    {
      topctx.fillStyle = "black";
      topctx.textAlign = "center";
      topctx.font = touchMessageFontSize + "vw Arial";
      topctx.fillText("touch screen to play again", ScreenWidth/2, ScreenHeight/2 + ScreenHeight/6);
    }
  }
}
// Every "game tick" check if the gamers car collides with any car in the bottom array. 
// Then move down the existing cars in the array, and create new ones on the top.
function GameTickTheCars()
{
  TickDownAllCarsOneRow();
  CreateNewCars();

  if(checkIfPlayerCollidesWithOtherCars())
  {
    SetState(gsCrashed);
  }
  else
  {
    ScorePassedCars();
  }
}
function EndGameVariableResets()
{
  // Here we reset variables that shouldn't affect things anymore in game over and win game states. But we don't yet want everything to reset.
  clearStreetTimer = 250; // This one is set twice in case of crashing and becoing game over, but so what...
  // explosionAnimFrameCounter = 0;
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
function TickDownAllCarsOneRow()
{
  level[3] = level[2];
  level[2] = level[1];
  level[1] = level[0];
  level[0] = CreateLevelRow(); // and fill up with an empty row at the top.
  
  audioBlip.play();
}

// This will be moved and/or integrated somehow into the level object.
var xCount = [0,0,0];
var emptyRowCount = 0;

function CreateNewCars()
{
  // The new if-statements and checks is seemingly working to make sure an even spread of cars along the road.
  // It might be messier than it need, and some further tests shall be made to see if we can clean it up a bit.
  var fillAll = false;
  var c = 0;
  var rand;
  
  for(var x=0;x<3;x++)
  {
    if (fillAll)
      level[0][x].hasCar = true;
    else if (xCount[x] < -1)
    {
      // console.log("First if-statement: xCount[x] < -1");
      xCount[x] = 0;
      level[0][x].hasCar = true;
      c++;
      xCount[x]++;
    }
    else if (xCount[x] > 1)
    {
      // console.log("Second if-statement: xCount[x] > 1");
      xCount[x] = 0;
      xCount[x]--;
    }
    else if(randomizeBool())
    {
      // console.log("Third if-statement: randomizeBool()");
      if (xCount[x] < 2)
      {
        // console.log("Third if-statement: xCount[x] < 2");
        if (xCount[x] < 0)
            xCount[x] = 0;
            
        level[0][x].hasCar = true;
        c++;
        xCount[x]++;
      }
      else
        xCount[x] = 0;
    }
    else
    {
      // console.log("Fourth if-statement: else");
      if (xCount[x] > -2)
      {
        // console.log("Fourth if-statement: xCount[x] > -2");
        if (xCount[x] > 0)
          xCount[x] = 0;
        
        // We never need to set a levelposition.hasCar to false, it's false by default.
        xCount[x]--;
      }
      else
      {
        xCount[x] = 0;
        level[0][x].hasCar = true;
        c++;
        xCount[x]++;
      }
    }
  }
  
  if(c == 3)
  {
    // Technically, this fix using randomizer makes it possible that a column is often more empty from cars than it should. But it's never too much.
    rand = randomizeNumber(3);
    level[0][rand].hasCar = false;
    
    if (xCount[rand] > 0)
      xCount[rand] = 0;
    
    xCount[rand]--;
    
    if (emptyRowCount > 0)
      emptyRowCount--;
  }
  else if (c == 0)
  {
    emptyRowCount++;
    if (emptyRowCount > 2)
    {
      emptyRowCount = 0;
      rand = randomizeNumber(3);
      level[0][rand].hasCar = true;
      
      if (xCount[rand] < 0)
            xCount[rand] = 0;
          
      xCount[rand]++;
    }
    else
    {
      rand = randomizeNumber(3);
      xCount[rand] = -2;
    }
  }
}
function ClearTheStreet()
{
  for(var x=0;x<3;x++)
  {
    xCount[x] = 0;
    for(var y=0;y<3;y++)
    {
      level[y][x].hasCar = false;
    }
  }
}
function DrawAllCars(onlyTheShadows)
{
  // Precise numbers to center the cars and give them perfect space between.
  // Don't touch without saving original numbers!!
  var roadWidthDivide = 2.75;
  var roadWidthMultiply = 2.305;
  
  var enemyImg;
  
  for(var y=0;y<3;y++)
  {
    var xPos = roadStartLeft - screenwidthFifth * rowPercentages[y];
    var yPos = (ScreenHeight / 2) * rowPercentages[y] * 0.5;
    
    switch (y)
    {
      case 0:
        enemyImg = EnemyCar1Image;
        carHeight = carWidth * 0.536;
        break;
      case 1:
        enemyImg = EnemyCar2Image;
        carHeight = carWidth * 0.545;
        break;
      case 2:
        enemyImg = EnemyCar3Image;
        carHeight = carWidth * 0.545;
        break;
    }
    
    for (var x=0;x<3;x++)
    {
      if(level[y][x].hasCar == true)
      {
        switch (x)
        {
          case 0:
            xPos = roadStartLeft - screenwidthFifth * rowPercentages[y] + carWidth/3;
            break;
          case 1:
            xPos = (roadStartLeft - screenwidthFifth * rowPercentages[y]) - (carWidth * 2.25 * rowPercentages[y]);
            break;
          case 2:
            xPos = (roadStartLeft - screenwidthFifth * rowPercentages[y]) - (carWidth * 4.5 * rowPercentages[y]) - carWidth/3;
            break;
        }

        if (onlyTheShadows == true && yPos == 0)
        {
          ctx.drawImage(EnemyCarShadowImage, 
            xPos + x * ((roadWidth / roadWidthDivide) + (roadWidth * roadWidthMultiply) * rowPercentages[y]), // as in 3 lanes. 
            (ScreenHeight / 2) + lightHeight -lightHeight/8 + yPos, 
            carWidth + (carWidth * 4.2 * rowPercentages[y]), 
            (carWidth * 0.42) + ((carWidth * 0.42) * rowPercentages[y]));
        }
        else
        {
          topctx.drawImage(enemyImg ,xPos + x * ((roadWidth / roadWidthDivide) + (roadWidth * roadWidthMultiply) * rowPercentages[y]), // as in 3 lanes.
          (ScreenHeight / 2) + lightHeight -lightHeight/3 + yPos, 
          carWidth + (carWidth * 4.5 * rowPercentages[y]),
          carHeight + (carHeight * 4.5 * rowPercentages[y]));
        }
      }
    }
    // Testprint
    // if (player.Lives > 0)
    // {
      // var testTextFont = 2.5 * textScale;
      
      // topctx.fillStyle = "blue";
      // topctx.textAlign = "center";
      // topctx.font = testTextFont + "vw Arial";
      // topctx.fillText("emptyRowCount: " + emptyRowCount, ScreenWidth/2,  ScreenHeight/2 - ScreenHeight/6);
      // topctx.font = testTextFont + "vw Arial";
      // topctx.fillText(xCount[0], ScreenWidth/2 - ScreenWidth/20, ScreenHeight/2 - ScreenHeight/10);
      // topctx.fillText(xCount[1], ScreenWidth/2,  ScreenHeight/2 - ScreenHeight/10);
      // topctx.fillText(xCount[2], ScreenWidth/2 + ScreenWidth/20,  ScreenHeight/2 - ScreenHeight/10);
    // }
  }
}
function randomizeBool()
{
  if(Math.random() < 0.5)
    return false;
  
  return true;
}
function randomizeNumber(number)
{
  return Math.floor(Math.random() * number);
}

function DrawStreetLights()
{
  if (streetLightTimer >= gamespeedMS)
  {
    ctx.fillStyle = "rgba(255,100,0,1)";
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
}
var drawPlayerCrashSmoke = false;

function DrawPlayerCar()
{
  topctx.drawImage(PlayerCarImage, player.Xposition, player.Yposition, player.Xsize, player.Ysize);
  ctx.globalAlpha = 0.24;
  ctx.drawImage(PlayerCarShadowImage, player.Xposition - player.Xposition/35, player.Yposition + player.Yposition/8, player.Xsize * 1.12, player.Ysize - player.Ysize/2);
  ctx.globalAlpha = 1;
  
  if(player.HasCollided)
  {
    if (player.CrashState == "Exploding")
    {
      var smokeImage = Smoke1Image;
      
      if (player.CrashState == "Exploding")
      {
        if (explosionAnimTimer % explosionAnimFrameLength < explosionAnimFrameLength/2)
          topctx.drawImage(currentExplosionFrame, player.Xposition - ScreenWidth/30, player.Yposition - ScreenWidth/12.5, player.Xsize * 1.35, player.Ysize * 1.3);
      }
      
      if (drawPlayerCrashSmoke == false && explosionAnimTimer % explosionAnimFrameLength < 25)
      {
        drawPlayerCrashSmoke = true;
        smokeImage = Smoke1Image;
      }
      else if (drawPlayerCrashSmoke == false && explosionAnimTimer % (explosionAnimFrameLength/2) < 25)
      {
        drawPlayerCrashSmoke = true;
        smokeImage = Smoke2Image;
      }
      if (drawPlayerCrashSmoke)
      {
        drawPlayerCrashSmoke = false;
        
        var randXpos = 22 + randomizeNumber(8);
        var randYpos = 15 + randomizeNumber(5);
        var rendAlfa = 0.35 + randomizeNumber(4)/10;
        
        ctx.globalAlpha = rendAlfa;
        ctx.drawImage(smokeImage, player.Xposition - ScreenWidth/randXpos, player.Yposition - ScreenWidth/randYpos, player.Xsize * 1.32, player.Ysize * 1.3);
        ctx.globalAlpha = 1;
      }
    }
  }
}
function DrawPlayerLives()
{
  var LifeHeight = carWidth * 0.555;
  
  for (var i = 0; i < player.Lives; i++)
  {
    if (i == player.Lives-1 && player.CrashState == "Exploding")
    {
      if (player.LivesBlinkTimer % 600 < 300)
        topctx.drawImage(PlayerLifeImage, carWidth * 1.5 + carWidth * 4 * i, LifeHeight * 2.5, carWidth * 3.5, LifeHeight * 3.92);
    }
    else
      topctx.drawImage(PlayerLifeImage, carWidth * 1.5 + carWidth * 4 * i, LifeHeight * 2.5, carWidth * 3.5, LifeHeight * 3.92);
  }
}

function DrawSnowstorm()
{
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
  }  
}
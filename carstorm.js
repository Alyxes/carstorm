// Strictly check for source code errors.
"use strict";
  
/**
 * Programmer: Jon and Timothy Lennryd 2025, 2026.
 *  This is inspired from an old handheld car racing game from the '80ies! You can move the car left and right with the keyboard arrows.
 */

// Set to false to remove all log messages, good for releases!
// So use Log("Jamsy message here."); not console.log(). 
const PleaseLitterWithConsoleLogs = true;

if (PleaseLitterWithConsoleLogs)
  var Log = console.log;
else 
  var Log = function(){};

// Set to false to remove debug-prints onscreen in the game.
const ShowDebugStuff = false;

// See Resize().
var ScreenWidth;
var ScreenHeight;
var ScreenScale;
// var realScreenWidth;
// var realScreenHeight;

var Width4K = 3840;
var Height4K = 2160;

// textFiveRows is simply ScreenHeight / 5, so we can easily put large text on five rows.
var textFourRows;
var textFiveRows;
var textSevenRows;
var textTenRows;
var textTwelveRows;
var textThirteenRows;
var textFifteenRows;
var textTwentyRows;

var ScreenHeightThreePercent;
var ScreenHeightOnePointOnePercent;

// Variable to store a fifth of the screens width, regardless of resolution. Note the choice of prime numbers. :)
// Convenience: Divide with 2 to get 1/26, 1/14, 1/10, 1/6, 1/4.
var screenwidthThirteenth;
var screenwidthNinth;
var screenwidthSeventh;
var screenwidthFifth;
var screenwidthThird;
var screenwidthHalf;

var SafeWidthMargin; // Just a nice to have margin from the screen borders.
var SafeHeightMargin;
var ButtonWidthDistance;

// If true, it starts in paused mode, and gets activated by the focus event.
var screenSaverPaused = false;

// Canvas 2d surface, for drawing on.
var ctx = null;       // The rotating sliding towards the screen snowstorm.
var streetctx = null; // The street and car shadows, also sliding along but not rotating.
var topctx = null;    // Score, cars and stuff.

var hiddenCanvas = null;
var hiddenCtx = null; // Used for ctx & streetctx for zooming in.

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
var gsSplashScreen = "SplashScreen";
var gsStartScreen = "StartScreen";
var gsSettings = "Settings";
var gsIntroPlay = "IntroPlay";
var gsPlaying = "Playing";
var gsCrashed = "Crashed";
var gsPaused = "Paused";
var gsGameOver = "GameOver";
var gsWinGame = "WinGame";

// This was really fun to do, but lets SetState() check if the given parameter is an actual state or a syntax error.
var gameStates = [ gsNothing, gsSplashScreen, gsStartScreen, gsSettings, gsIntroPlay, gsPlaying, gsCrashed, gsPaused, gsGameOver, gsWinGame ];

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
var BigLettersColorShift = 0;
var VictoryColorShift = 0;

var player = null;

// The level is just a 3x3 double-array.
var level = [];

// Rad 4 är spelarens rad, och ska vara 1.0. Rad 0 är högst upp och ska vara 0. Rad 1 och 2 är de magiska feel-good siffrorna.
var rowPercentages = [0, 0.21, 0.6, 1.3];

var carWidth = 0;
var carHeight = 0;

var messageTimer = 0;       // Just a general timer used in several places.
var TimeToGoBackToPlay = 0; // dito
var clearStreetTimer = 0;   // Timer until the street gets cleared from other cars.
var PlayStartTime = 0;      // Set to Now when a new play round starts.

var GotResponseFromServer = false;
var FetchOnlineStatsDone = false;
var ServerVersion = 1;  // Always set to 1 here. The cache will keep the players real version.
var GameVersion = 5;    // Should be increased each time we publish a change in game code, and always be equal to the $serverHasGameVersion in version.php!
var RandomId = "";      // The "unique" (probably unique) id for this game app installation. Sent to server to identify the user. Created in FetchOnlineStats().

// Each time a new version (of this file) is downloaded, the cache_killer in each file url below should 
// make sure all files are downloaded anew. getDate() returns day of the month, 1-31.
var CacheKiller = GameVersion;// + "_" + (new Date()).getDate();

var IntroMelodyPlayed = false;

var nextLevel = 300;        // Reaching this score increase speed and "level".
var finalScore = 0;         // After finishing current game, this is your final score.
var LastDriveScore = 0;     // Last game's final score.
var HighScore = 0;          // Gamers highest score of all times.
var WinCount = 0;           // How many times the gamer has won the game.
var PlayCount = 0;          // How many times the gamer has started a new round.
var WinningScore = 9999;    // Game ends when you reach this score. Should be 9999 :)

var PlayersPlayingNow = 0;  // Online stats, how many other persons are playing the game right now.
var TimeToFetchOnlineStats = 0;
var ReloadCount = 0;        // Stored in storage so we don't reload page more than twice! 
var TheGameHasJustBeenUpdated = false;  // Set to true if ReloadCount > 0 after a reload and code seem fresh.
var ServerChatCount = 0;    // How many times the game has been callng version.php on the server.

var roadWidth = 0;

var roadStartLeft;

var explosionAnim = [3];
var snowImages = [5];
var currentExplosionFrame;
var currentExplosionFrameIndex = 0;
var explosionAnimFrameLength = 0;
var explosionAnimTimer = 0;
var explosionAnimFrameCounter = 0;

const audioIntroMelody = new Audio("sound/intro_melody.mp3" + "?cache_killer=" + CacheKiller);
const audioStart = new Audio("sound/start.mp3" + "?cache_killer=" + CacheKiller);
const audioBlip = new Audio("sound/blip.mp3" + "?cache_killer=" + CacheKiller);
const audioButtonClick = new Audio("sound/click.mp3" + "?cache_killer=" + CacheKiller);
const audioHonkHonk = new Audio("sound/honk_honk.mp3" + "?cache_killer=" + CacheKiller);
const audioMove1 = new Audio("sound/move1.mp3" + "?cache_killer=" + CacheKiller);
const audioMove2 = new Audio("sound/move2.mp3" + "?cache_killer=" + CacheKiller);
const audioMove3 = new Audio("sound/move3.mp3" + "?cache_killer=" + CacheKiller);
const audioMove4 = new Audio("sound/move4.mp3" + "?cache_killer=" + CacheKiller);
const audioMove5 = new Audio("sound/move5.mp3" + "?cache_killer=" + CacheKiller);
const audioCrash = new Audio("sound/crash.mp3" + "?cache_killer=" + CacheKiller);
const audioSpeedUp = new Audio("sound/chime.mp3" + "?cache_killer=" + CacheKiller);
const audioGameOver = new Audio("sound/gameover.mp3" + "?cache_killer=" + CacheKiller);
const audioEndingWin = new Audio("sound/ending_win.mp3" + "?cache_killer=" + CacheKiller);

const audioMoveSounds = [audioMove1,audioMove2,audioMove3,audioMove4,audioMove5];

// Longer sounds must be paused when the game is minimized, put a reference to it here.
var audioCurrentlyPlaying = null;

var MoveSound = {
  lastPlayed: null,
};

var LogotypeImage = new Image();
LogotypeImage.src = "graphics/MadskullCreations512x512.png" + "?cache_killer=" + CacheKiller;
var StartBGImage = new Image();
StartBGImage.src = "graphics/StartBackground.png" + "?cache_killer=" + CacheKiller;
var MadSkullLogoImage = new Image();
MadSkullLogoImage.src = "graphics/MadSkullCreationsLogo.png" + "?cache_killer=" + CacheKiller;

var SnowPuffImage1 = new Image();
SnowPuffImage1.src = "graphics/SnowPuff1.png" + "?cache_killer=" + CacheKiller;
var SnowPuffImage2 = new Image();
SnowPuffImage2.src = "graphics/SnowPuff2.png" + "?cache_killer=" + CacheKiller;
var SnowPuffImage3 = new Image();
SnowPuffImage3.src = "graphics/SnowPuff3.png" + "?cache_killer=" + CacheKiller;
var SnowPuffImage4 = new Image();
SnowPuffImage4.src = "graphics/SnowPuff4.png" + "?cache_killer=" + CacheKiller;
var SnowPuffImage5 = new Image();
SnowPuffImage5.src = "graphics/SnowPuff5.png" + "?cache_killer=" + CacheKiller;

var PlayerCarImage = new Image();
PlayerCarImage.src = "graphics/PlayerCar.png" + "?cache_killer=" + CacheKiller;
var PlayerLifeImage = new Image();
PlayerLifeImage.src = "graphics/PlayerLife.png" + "?cache_killer=" + CacheKiller;

var EnemyCar1Image = new Image();
EnemyCar1Image.src = "graphics/EnemyCar1.png" + "?cache_killer=" + CacheKiller;
var EnemyCar2Image = new Image();
EnemyCar2Image.src = "graphics/EnemyCar2.png" + "?cache_killer=" + CacheKiller;
var EnemyCar3Image = new Image();
EnemyCar3Image.src = "graphics/EnemyCar3.png" + "?cache_killer=" + CacheKiller;

var EnemyCarShadowImage = new Image();
EnemyCarShadowImage.src = "graphics/EnemyCarShadow.png" + "?cache_killer=" + CacheKiller;
var PlayerCarShadowImage = new Image();
PlayerCarShadowImage.src = "graphics/PlayerCarShadow.png" + "?cache_killer=" + CacheKiller;

var SpeedIncreaseImage = new Image();
SpeedIncreaseImage.src = "graphics/SpeedIncreaseMessage.png" + "?cache_killer=" + CacheKiller;

var Explosion1Image = new Image();
Explosion1Image.src = "graphics/Explosion1.png" + "?cache_killer=" + CacheKiller;
var Explosion2Image = new Image();
Explosion2Image.src = "graphics/Explosion2.png" + "?cache_killer=" + CacheKiller;
var Explosion3Image = new Image();
Explosion3Image.src = "graphics/Explosion3.png" + "?cache_killer=" + CacheKiller;
var Smoke1Image = new Image();
Smoke1Image.src = "graphics/Smoke1.png" + "?cache_killer=" + CacheKiller;
var Smoke2Image = new Image();
Smoke2Image.src = "graphics/Smoke2.png" + "?cache_killer=" + CacheKiller;

var ArrowLeftImage = new Image();
ArrowLeftImage.src = "graphics/ArrowLeft.png" + "?cache_killer=" + CacheKiller;
var ArrowRightImage = new Image();
ArrowRightImage.src = "graphics/ArrowRight.png" + "?cache_killer=" + CacheKiller;

var InputModeButtonNormal = new Image();
InputModeButtonNormal.src = "graphics/InputModeButtonNormal.webp" + "?cache_killer=" + CacheKiller;
var InputModeButtonLeft = new Image();
InputModeButtonLeft.src = "graphics/InputModeButtonLeft.webp" + "?cache_killer=" + CacheKiller;
var InputModeButtonRight = new Image();
InputModeButtonRight.src = "graphics/InputModeButtonRight.webp" + "?cache_killer=" + CacheKiller;
var InputModeImages = [InputModeButtonNormal,InputModeButtonLeft,InputModeButtonRight];
var SelectedInputMode = 0; // 0:Normal,1:Left,2:Right
var CuttingCoordinate = 0;

var BackButtonImage = new Image();
BackButtonImage.src = "graphics/BackButton.webp" + "?cache_killer=" + CacheKiller;

var SpeakerOnButtonImage = new Image();
SpeakerOnButtonImage.src = "graphics/SpeakerOnButton.webp" + "?cache_killer=" + CacheKiller;
var SpeakerOffButtonImage = new Image();
SpeakerOffButtonImage.src = "graphics/SpeakerOffButton.webp" + "?cache_killer=" + CacheKiller;
var SpeakerImages = [SpeakerOffButtonImage,SpeakerOnButtonImage];
var SpeakerOn = true; // Made it into a boolean, and uses Number(SpeakerOn) for all places where it needs to be 0 or 1.

var SettingsButtonImage = new Image();
SettingsButtonImage.src = "graphics/SettingsButton.webp" + "?cache_killer=" + CacheKiller;

var AllButtons = [];  // When any button is created, it must be added here for the Resize and touch events to work. When leaving a window, remove all buttons!

const txtAGameMadeBy = "A game made by";
const txtCARSTORM = "CARSTORM";
const txtLastDriveScore = "last drive score: ";
const txtHighScore = "highscore: ";
const txtPlayersOnlineNow = "Players online now: ";
const txtOffline = "Offline";
const txtVICTORY = "VICTORY";
const txtTouchScreenToPlayAgain = "touch screen to play again";
const txtYouAreASuperPlayer = "You are a super player";
const txtTouchScreenToRestart = "touch screen to restart";
const txtGAMEOVER = "GAME OVER";
const txtYourFinalScoreWas = "Your final score was";
const txtTouchScreenToContinue = "touch screen to continue";
const txtTouchScreenToDrive = "touch screen to drive";
const txtTouchTheScreen = "touch the screen to start";

// Called as soon as the page has loaded. This happens from the screen saver app.
// The init() function is the only function you need to have to make the screen saver work.
function init()
{
  SetupCallbacks();
  
  // Pilla inte Tim.
  // https://web.dev/learn/pwa/service-workers
  if ('serviceWorker' in navigator)
  {
    navigator.serviceWorker.register("/service_worker.js");
  }
    
  // Trist, variabler i service_worker.js är inte åtkomliga härifrån. (Är ju i en annan tråd så det är ju iofs. logiskt)
  /*if(ServiceWorkerVersion != "slork")
  {
    Log("It IS available from here! " + ServiceWorkerVersion);
  }*/
  
  // Trist 2, caches kan inte lagra annat än "Response" objekt, dvs. filer som dras ner från servern o sånt.  
  /*Log("Test open cache.");
  caches.match("ServiceWorkerVersion").then(cache => {
    Log("Fint! Gick att öppna cachen. ");
    Log(cache);
  });*/
  
  CreateLevel();
  CreatePlayer();
    
  // Fetch the html element with the id 'canvas'. This is where we will do all drawing.
  var c = document.getElementById("canvas");
  var sc = document.getElementById("street_canvas");
  var tc = document.getElementById("top_canvas");

  hiddenCanvas = document.createElement('canvas');
  
  // Not sure it makes a difference right here, but scaling up gets pixelated, not softened.
  // Tim-comment: I changed it to softened and it looks better as long as the scaling isn't right. Can stay as softened as it won't matter either way when
  // the scaling issue is fixed.
  c.style.imageRendering = "softened";
  sc.style.imageRendering = "softened";
  tc.style.imageRendering = "softened";
  hiddenCanvas.style.imageRendering = "softened";
  
  // A winterstorm background should be almost white, not green. :)
  c.style.backgroundColor = "#eee";
  
  // Setting willReadFrequently to true might increase speed as we are reading the entire image and redrawing it every frame.
  // https://stackoverflow.com/questions/74101155/chrome-warning-willreadfrequently-attribute-set-to-true
  // 
  // This guy says, set it to false! Reason: All hardware acceleration on graphic cards are gone setting it to true.
  // https://www.schiener.io/2024-08-02/canvas-willreadfrequently
  //  <-But in our case we need it to be true since we call getImageData() every loop.
  // 
  ctx = c.getContext("2d", { willReadFrequently: true });
  streetctx = sc.getContext("2d", { willReadFrequently: true });
  
  // Neither of these need willReadFrequently as we don't call getImageData() on them.
  topctx = tc.getContext("2d");//, { willReadFrequently: true });
  hiddenCtx = hiddenCanvas.getContext("2d");//, { willReadFrequently: true });
    
  explosionAnim[0] = Explosion1Image;
  explosionAnim[1] = Explosion2Image;
  explosionAnim[2] = Explosion3Image;
  
  snowImages[0] = SnowPuffImage1;
  snowImages[1] = SnowPuffImage2;
  snowImages[2] = SnowPuffImage3;
  snowImages[3] = SnowPuffImage4;
  snowImages[4] = SnowPuffImage5;
  
  currentExplosionFrame = explosionAnim[currentExplosionFrameIndex];
  
  Now = Date.now();
  LastDraw = Now; // Setting this to Now fixed bug that set timers to zero in the beginning of the game.
  
  // Resize the canvas so it fill up the entire screen.
  Resize();

  // Read back any data from localstorage.
  ReadStuff();
  
  // We enter the game with the splash screen visible.
  SetState(gsSplashScreen);
      
  // Start the game loop!
  GameLoop();
}

var mouseButtonDown = false;

function SetupCallbacks()
{
  // Add a fake browse history. This way the app is not closed when user presses the back button.
  window.history.pushState({}, '');

  // As soon as back button is pressed, this event happens. We just add a fake browse history again! 
  // NOTE: Double-clicking back button in windows chrome kind of override this and let the user go back anyway.
  //   <-More specifically, if there is no user interaction with the page, any browse history modifications are ignored!
  //     This is to protect against terrible scripts. In effect, a double-click on the back browser cannot be intercepted,
  //     since 
  //     1. the user click once, this popstate happens properly, 
  //     2. and the second click happens without any user interaction with the page!
  //     3. so the default happens, which is going back in browse history. (ignoring the fake browse history adding)
  //      <-There is no way around this, at least not by using fake browse history.
  // 
  window.addEventListener('popstate', function() {
    window.history.pushState({}, '');
    Log("Ät en hamster.");
  });
  
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
    
  // Since the ontouchstart event is ONLY defined in browsers connected to a touch screen,
  // we can kind of trust this approach! 
  // https://stackoverflow.com/questions/2915833/how-to-check-browser-for-touchstart-support-using-js-jquery
  if ('ontouchstart' in document.documentElement)
  {
    // Yeah! Touch events are here!
    // Much cooler feeling when the car moves when you put your finger on the screen!
    // (Instead of when you lift your finger from the screen.)
    document.addEventListener("touchstart", (e) => {
      // Multitouch, so touches is an array of all the fingers touching right now.
      TouchClickEvent(e.touches[0].clientX, e.touches[0].clientY);
    });
    document.addEventListener("touchmove", (e) => {
      Log("A touch move event happened!");
      ButtonsOnTouchMove(e.touches[0].clientX, e.touches[0].clientY);
    });
    document.addEventListener("touchend", (e) => {
      Log("A touch end event happened!");
      ButtonsOnTouchEnd();
    });
    document.addEventListener("touchcancel", (e) => {
      // Might happen for many reasons, maybe a phone call or you name it. 
      // TODO: Should have a ButtonsCancelTouch() or similar abort method.
      Log("A touch cancel event happened!");
      ButtonsOnTouchEnd();
    });
  }
  else
  {
    // Buhöö, no touch events, go by mouse events. 
    document.addEventListener("mousedown", (e) => {
      e = e || window.event;
      
      if(e.button == 0) // Most of the time the left button
      {
        mouseButtonDown = true;
        // Log("mousedown: " + e.button);
        TouchClickEvent(e.clientX, e.clientY);
      }
    });
    document.addEventListener("mouseup", (e) => {
      e = e || window.event;
      
      if(e.button == 0) // Most of the time the left button
      {
        mouseButtonDown = false;
        ButtonsOnTouchEnd(e.clientX, e.clientY);
      }
    });
    
    document.addEventListener("mousemove", (e) => {
      e = e || window.event;
      
      if(mouseButtonDown)
      {
        // Log("A mouse move event happened!");
        ButtonsOnTouchMove(e.clientX, e.clientY);
      }
    });
    
    // And keep the keydown events for old times sake.
    document.addEventListener("keydown", (e) => {
      e = e || window.event;
      
      // NOTE: Remove if it keeps getting ugly, mouse/touch is enough.
      if(gameState == gsPlaying)
      {
        if (e.keyCode === 37)
        {
          // left arrow pressed.
          // Log("button left");
          PlayerMove("left");
        }
        else if (e.keyCode === 39)
        {
          // right arrow pressed.
          // Log("button right");
          PlayerMove("right");
        }
      }
    });
  }
}

// Touch or click event happened. 
function TouchClickEvent(xPos, yPos)
{
  ButtonsOnTouchStart(xPos, yPos);
  
  // Eeh, ugly but works. Spreading out game state checks this way is error prone.
  switch(gameState)
  {
    case gsSplashScreen:
      // Splash screen just goes on to the start screen.
      SetState(gsStartScreen);
      break;    
    case gsStartScreen:
      // Clicking the start screen starts a new game.
      // This is also a terrible hack, but it works. :)
      if(AllButtons[0].buttonPressed == false)
      {
        SetState(gsIntroPlay);
      }
        
      break;
    case gsSettings:
      // Buttons: Back. Sound switch. Input mode toggle.
      break;
    case gsPlaying:
      if (yPos > ScreenHeight / 2)
      {
        if (xPos < CuttingCoordinate)
        {
          // Log("mousedown left");
          PlayerMove("left");
        }
        else
        {
          // Log("mousedown right");
          PlayerMove("right");
        }
      }
      break;
    case gsPaused:
      // Clicking the pause screen resumes the game.
      SetState(gsPlaying);
      break;
    case gsGameOver:
      // Clicking the game over screen returns you to the start screen.
      if (messageTimer <= 0)
        SetState(gsStartScreen);
      break;
    case gsWinGame:
      // Clicking the winning game screen returns you to the start screen.
      if (messageTimer <= 0)
        SetState(gsStartScreen);
      break;
  }  
}

function Resize()
{
  // If we are playing and the screen is resizing, it usually means player rotate the 
  // screen. So pause an active game to avoid chaos. :-)
  if(gameState == gsPlaying)
  {
    SetState(gsPaused);
  }

  ScreenScale = window.devicePixelRatio;
  // window.visualViewport.scale
  // We should read this article. I don't have time tonight...
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
  
  // realScreenWidth = Math.floor(window.innerWidth * ScreenScale);
  // realScreenHeight = Math.floor(window.innerHeight * ScreenScale);
  ScreenWidth = window.innerWidth;
  ScreenHeight = window.innerHeight;
  
  ResizeCanvas(document.getElementById('canvas'), true);
  ResizeCanvas(document.getElementById('street_canvas'), false);
  ResizeCanvas(document.getElementById('top_canvas'), false);
  ResizeCanvas(hiddenCanvas, false);

  /*var cs = document.getElementById('canvas');
  cs.height = ScreenHeight;
  cs.width = ScreenWidth;

  var streetcs = document.getElementById('street_canvas');
  streetcs.height = ScreenHeight;
  streetcs.width = ScreenWidth;
  
  var topcs = document.getElementById('top_canvas');
  topcs.height = ScreenHeight;
  topcs.width = ScreenWidth;
  
  hiddenCanvas.height = ScreenHeight;
  hiddenCanvas.width = ScreenWidth;*/
  
  textFourRows = ScreenHeight / 4;
  textFiveRows = ScreenHeight / 5;
  textSevenRows = ScreenHeight / 7;
  textTenRows = ScreenHeight / 10;
  textTwelveRows = ScreenHeight / 12;
  textThirteenRows = ScreenHeight / 13;
  textFifteenRows = ScreenHeight / 15;
  textTwentyRows = ScreenHeight / 20;
  
  ScreenHeightThreePercent = ScreenHeight / 30;
  ScreenHeightOnePointOnePercent = ScreenHeight / 90;
  
  Log("ScreenHeight (WINDOW HEIGHT): " + ScreenHeight + ", so one text-line is " + textFiveRows + " pixels. ScreenScale is " + ScreenScale);
  
  // Convenience: Divide with 2 to get 1/14, 1/10, 1/6, 1/4.
  screenwidthThirteenth = ScreenWidth/13;
  screenwidthNinth = ScreenWidth/9; // ... sorry :j
  screenwidthSeventh = ScreenWidth/7;
  screenwidthFifth = ScreenWidth/5;
  screenwidthThird = ScreenWidth/3;
  screenwidthHalf = ScreenWidth/2;
  
  SafeWidthMargin = screenwidthThirteenth / 2;
  SafeHeightMargin = ScreenHeight / 15;
  ButtonWidthDistance = ScreenWidth / 40;
  
  lightWidth = ScreenWidth/23;
  lightHeight = ScreenHeight/20;
  orangeLightSize = ScreenWidth/370;
  yellowLightSize = ScreenWidth/480;
  BigLettersColorShift = ScreenHeight/90;
  VictoryColorShift = ScreenHeight/100;
  
  carWidth = ScreenWidth/42;
  carHeight = carWidth * 0.536;
  // carHeight = ScreenHeight/50;
  
  roadWidth = lightWidth * 2;
  
  roadStartLeft = screenwidthHalf - lightWidth;
  
  ResizePlayer();
  ButtonsResize();
  SetCuttingCoordinate();
  
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
}

// Det här fixar upplösningen! 
// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
// 1. Sätt canvas elementets css style vidd och höjd till hela skärmen. 
// 2. I minnet, skapa en canvas som är 3x3 ggr större än vad skärmen tillåter! (3 om devicePixelRatio är det)
// 3. Skala sedan alla utritningar med 3!! All vår utritning är ju baserad på ScreenWidth o height, som ju är 1/3 av de faktiskta pixlarna. 
// 
function ResizeCanvas(canvas, willReadFrequently)
{
  Log("W: " + ScreenWidth + ", H: " + ScreenHeight + ", Scale: " + ScreenScale);
  
  canvas.style.width = ScreenWidth + "px";
  canvas.style.height = ScreenHeight + "px";
  canvas.width = Math.floor(ScreenWidth * ScreenScale); 
  canvas.height = Math.floor(ScreenHeight * ScreenScale);
  
  var daContext = canvas.getContext("2d", { willReadFrequently: willReadFrequently });
  
  daContext.scale(ScreenScale, ScreenScale);
}

function StoreStuff()
{
  localStorage.setItem("GameVersion", GameVersion);
  localStorage.setItem("ServerVersion", ServerVersion);
  localStorage.setItem("LastDriveScore", LastDriveScore);
  localStorage.setItem("HighScore", HighScore);
  localStorage.setItem("WinCount", WinCount);
  localStorage.setItem("PlayCount", PlayCount);
  localStorage.setItem("ReloadCount", ReloadCount);
  
  // From serverVersion 3 the random_id is expected.
  localStorage.setItem("RandomId", RandomId);

  // From game version 4: 
  localStorage.setItem("GameVersionToDownload", GameVersion);
  
  // From game version 5: 
  localStorage.setItem("TheGameHasJustBeenUpdated", TheGameHasJustBeenUpdated);
  localStorage.setItem("ServerChatCount", ServerChatCount);  
}

function ReadStuff()
{
  var GameVersionInLocalStorage = parseInt(localStorage.getItem("GameVersion"));
  
  if(!GameVersionInLocalStorage)
  {
    // There is no local storage at all at the moment.
    return;
  }
  
  // FIXED BUG 7/12 2025: Du skriver över GameVersion här! Den är satt till 3 nu, men går ner till 1. 
  //  <-Var svår att hitta eftersom en clean installation uppgraderade allting i ett go. 
  //    GameVersionInLocalStorage var false ovan eftersom localstorage var helt tom, och denna koden kördes inte första sidladdningen.
  //    Sedan, efter uppdateringen, sparades localstorage ner, med 3 som GameVersion. Såg jättefint ut. :-O
  //  <-Men en uppgradering från 2 till 3, där finns ju localstorage. Då körs denna koden, och raden nedan sätter GameVersion till 1. 
  //    Fixen? Eftersom FetchOnlineStats() uppgraderar allting korrekt och sedan anropar StoreStuff(), så ska vi helt kort anta att om grejer skiljer sig här
  //    inte ska uppdateras här, och vi ska INTE uppdatera GameVersion från localstorage utan betrakta den som readonly.
  //    
  // GameVersion = GameVersionInLocalStorage;
  
  if(GameVersionInLocalStorage >= 1)
  {
    // Just means that GameVersionInLocalStorage == 1 OR BIGGER expects these variables to exist.
    ServerVersion = parseInt(localStorage.getItem("ServerVersion"));
    LastDriveScore = parseInt(localStorage.getItem("LastDriveScore"));
    HighScore = parseInt(localStorage.getItem("HighScore"));
    WinCount = parseInt(localStorage.getItem("WinCount"));
    PlayCount = parseInt(localStorage.getItem("PlayCount"));
    ReloadCount = parseInt(localStorage.getItem("ReloadCount"));
  }
  if(GameVersionInLocalStorage >= 2)
  {
    // Yeah! We released a second version! No changes here though, the upping of the game version is just for stats on the server.
  }
  if(GameVersionInLocalStorage >= 3)
  {
    // The third version is not "released" on the app store, we just uploaded it to the server. It expects the field random_id to be sent along from the client.
    RandomId = localStorage.getItem("RandomId");
  }
  if(GameVersionInLocalStorage >= 4)
  {
    // The 4th version introduces a fix where each file except index.html uses the cache_killer to make sure 
    // new versions of the file(s) are downloaded. 
    GameVersionToDownload = parseInt(localStorage.getItem("GameVersionToDownload"));
  }
  if(GameVersionInLocalStorage >= 5)
  {
    // The 5th version has a neat flag which show the user the game has just been updated, and a counter to keep track of how many times this game has contacted the server.
    TheGameHasJustBeenUpdated = parseInt(localStorage.getItem("TheGameHasJustBeenUpdated"));
    ServerChatCount = parseInt(localStorage.getItem("ServerChatCount"));
  }
  
  if(GameVersionInLocalStorage >= 31)
  {
    // Never happens yet. The number 31 instead of expected 2 just means
    // that the localStorage structure has not changed at all in the 
    // previous 30 versions. But in version 31 we decided to add the fancy
    // Smurf-field. And since we just read in GameVersionInLocalStorage and it says 
    // the version of the localStorage is 31 or greater, the Smurf-field
    // should exist.
    // 
    // Smurf = parseInt(localStorage.getItem("Smurf"));
  }
  
  if(GameVersion != GameVersionInLocalStorage)
  {
    Log("GameVersion " + GameVersion + " does not equal localstorage version " + GameVersionInLocalStorage + ". Expects FetchOnlineStats() to fix this.");
  }
}

// async means calling code is _not_ waiting for this function to complete, it happens "meanwhile" in the background.
// Fetch, and push your stats to server.
async function FetchOnlineStats()
{
  FetchOnlineStatsDone = false;
  if(TimeToFetchOnlineStats > Now)
  {
    FetchOnlineStatsDone = true;
    return;
  }
  
  // TEMP: Every 30 seconds, but you must still play one round and come back to start screen.
  TimeToFetchOnlineStats = Now + 1000 * 30;// * 3600; // Update every hour.
  
  GotResponseFromServer = false;
  
  ServerChatCount++;
  
  // For statistics and debugging, let's send GameVersionToDownload, it's read by index.html. 
  // Caching might serve us a new js file (this) but an old index.html, so lets assume GameVersionToDownload is not defined.
  var gvtd = GameVersion;
  if (typeof GameVersionToDownload !== 'undefined')
  {
    gvtd = GameVersionToDownload;
  }
  
  try
  {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    var url = "version.php?";
    url += "game_version="+GameVersion+"&";
    url += "win_count="+WinCount+"&";
    url += "high_score="+HighScore+"&";
    url += "play_count="+PlayCount+"&"; 
    url += "reload_count="+ReloadCount+"&";
    url += "random_id="+RandomId+"&";
    url += "game_version_to_download="+gvtd+"&";
    url += "scc="+ServerChatCount+"&";
    url += "cache_killer="+Math.random();// Last param omit the &.
    
    Log("About to fetch from server.");
    Log(url);
    
    const response = await fetch(
      url, 
      {
        method: 'get',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'text/plain'
        }
      });

    if (!response.ok) 
    {
      // We just ignore if we don't get any response, since the game very well might be offline and that should be ok.
    }
    else
    {
      // We got a response!
      var OnlineStats = await response.json();
      Log(OnlineStats);
      
      GotResponseFromServer = true;
          
      // True if game's ServerVersion equals the server version.
      var RunningSameAsServer = (ServerVersion == OnlineStats.server_version);
      var GotUpdated = false;
      var FromVersion = ServerVersion;
      
      // True if server has new game version. (New game files, js, images, sounds, etc)
      var ServerHasNewGameVersion = (GameVersion != OnlineStats.server_has_game_version);
      
      // Idea: If this is an old version of carstorm.js, it does not know about
      // any other versions than stated below. It should keep working!
      // Note the order of our ifs, we update from version 1 to version 2 etc. up to the version the server has.
      if(OnlineStats.server_version >= 1)
      {
        if(ServerVersion < 1 && OnlineStats.server_version == 1)
        {
          // This never happens since version start at 1, but we keep it for purity.
          GotUpdated = true;
          
          Log("Updating localstorage from version " + ServerVersion + " to version " + 1);
          ServerVersion = 1;
        }

        // First server version returns these variables: server_version and players_now
        PlayersPlayingNow = OnlineStats.players_now;
      }
      if(OnlineStats.server_version >= 2)
      {
        if(ServerVersion < 2 && OnlineStats.server_version >= 2)
        {
          // 'Our' ServerVersion is smaller than 2, but we have this code for updating localstorage to version 2, 
          // so we have the latest version of the code.
          // The localstorage must be updated to version 2 though. 
          GotUpdated = true;
          
          // Update code would be here if version 2 actually was anything more than an example.
          Log("Updating localstorage from version " + ServerVersion + " to version " + 2);        
          ServerVersion = 2;
        }
        
        // Server version 2 don't change anything, but show us this important fact:
        // Next if-statement will also run. 
        // Why? Because newer versions MUST NOT break old game versions!
        // This just means an old game version should keep working, but not be aware of
        // the new stuff a newer game knows about. 
        
        // If version 2 would have added a new field to download for example, we would store it in localstorage here.
      }
      if(OnlineStats.server_version >= 3)
      {
        if(ServerVersion < 3 && OnlineStats.server_version >= 3)
        {
          // 'Our' ServerVersion is smaller than 3, but we have this code for updating localstorage to version 3, 
          // so we have the latest version of the code.
          // The localstorage must be updated to version 3 though. 
          GotUpdated = true;

          // Server version 3 expects random_id to be sent along, so we should create one now and save to localstorage.
          RandomId = CreateUniqueId();
          
          Log("Updating localstorage from version " + ServerVersion + " to version " + 3);
          ServerVersion = 3;
        }
        
        // Next if-statement will also run. 
        // Why? Because newer versions MUST NOT break old game versions!
        // This just means an old game version should keep working, but not be aware of
        // the new stuff a newer game knows about. 
        
        // Server version 3 expect a random_id to exist and be sent along in the url params, it is stored in localstorage further down.
      }
      if(OnlineStats.server_version >= 4)
      {
        if(ServerVersion < 4 && OnlineStats.server_version >= 4)
        {
          // 'Our' ServerVersion is smaller than 4, but we have this code for updating localstorage to version 4, 
          // so we have the latest version of the code.
          // The localstorage must be updated to version 4 though. 
          GotUpdated = true;

          Log("Updating localstorage from version " + ServerVersion + " to version " + 4);
          ServerVersion = 4;
        }
        
        // Server version 4 will appreciate game_version_to_download to exist in the url params, 
        // which is mainly for my future debugging of why people's game are not working/updating properly.
        // it is stored in localstorage further down.
      }
      if(OnlineStats.server_version >= 5)
      {
        if(ServerVersion < 5 && OnlineStats.server_version >= 5)
        {
          // 'Our' ServerVersion is smaller than 5, but we have this code for updating localstorage to version 5, 
          // so we have the latest version of the code.
          // The localstorage must be updated to version 5 though. 
          GotUpdated = true;

          Log("Updating localstorage from version " + ServerVersion + " to version " + 5);
          ServerVersion = 5;
          
          ServerChatCount = 0;
        }
        
        // Server version 5 will appreciate scc to exist in the url params, 
        // which is mainly for my future debugging of why people's game are not working/updating properly.
        // it is stored in localstorage further down.
      }
      
      // Now we have two cases:
      // 1. GotUpdated is true. This means we have the latest code, and the localstorage structure is updated in the code above. Store the changes by calling StoreStuff().
      // 2. GotUpdated is false and RunningSameAsServer too! This means server has a new version, and this code is not updated. 
      //    a. We must let service_worker.js invalidate its file cache, 
      //    b. and reload all files from the server.
      //    c. When this function is run again, we should have the latest version, goto 1. 
      // 3. Since service_worker.js is designed strange, we might need to do step 2 twice to get the latest version!
      //    a. Step 2 happens, and code below will reload the pages. 
      //    b. service_worker.js detects its new version, reload and kill its cache. 
      //    c. But, browser has aldready started loading files from the cache. So we might get a mix of files. 
      //    d. If we got a mix, hopefully this file is not yet updated at least. Means we reload again at step 2!
      //    e. This second time all files are guaranteed to be newly downloaded, so step 1.
      //    f. Also, as a security measure ReloadCount is stored in localstorage and can reach a max of 2, 
      //       after that the game don't care anymore and will run with whatever mix of versions it has.
      // 4. And finally, if the user is offline, nothing of this ever happens and the game runs fine with its cached files.
      
      // And apart from all the logic above, we have a somewhat simpler case:
      //  1. ServerHasNewGameVersion is true, meaning server reports it has a newer version of the game than we are running. 
      //  2. This is simple, just store the GameVersionToDownload in localstorage,
      //  3. and reload the game. Voila, index.html and all cache_killer's should make sure we get the latest
      //     version of any file. 
      
      if(ServerHasNewGameVersion)
      {
        // Make sure we tell index.html to reload all files, the browser has a new version. 
        GameVersionToDownload = OnlineStats.server_has_game_version;
      }
      
      if(!RunningSameAsServer && !GotUpdated || ServerHasNewGameVersion)
      {
        // Looks like server has a newer version that our code know nothing about. 
        Log("We seem to be running an old version of the game!");

        ReloadCount++;
        
        // Store the ReloadCount! Also, store GameVersionToDownload !!
        StoreStuff();
        
        // Store the ReloadCount.
        // Store GameVersionToDownload!
        // Store the ServerVersion!
        //   <-Det här är ännu viktigare. Så här måste det vara:
        // 
        //   1. ServerVersion är alltid satt till 1 högst upp i denna fil.
        //   2. Först laddas cachen/cookien/IndexedDB you name it.
        //   3. ServerVersion sätts till det som finns i cachen.
        //   4. Först nu anropas FetchOnlineStats().
        //   5. Om ServerVersion NU skiljde sig från serverns, så har koden ovan gjort följande:
        //        * Uppdaterat ServerVersion.
        //        * Uppdaterat vad som uppdateras ska i localstorage, samt sparat ändringarna.
        //   6. Nästa gång steg 1 till 4 körs så ska ServerVersion vara samma
        //      som serverns.
        
        if(ReloadCount <= 3)
        {
          // Enforce a reload of the game files from server.
          // Please note we might do this twice! 
          Log("Reloading!");
          
          // This is the procedure:
          // 1. Browser detects that service_worker.js is different from server and throws away cache.
          // 2. Since files probably has been loading already, we are in a state of flux, old files.
          // 3. So we ask browser to reload this window. ReloadCount is now 1.
          // 4. For incredible reasons service_worker might still larv around with old files.
          // 5. So we might need to reload again. ReloadCount is now 2.
          // 6. And for the fun of the hell, lets try one more time. ReloadCount is now 3.
          //   <-TODO: Försök förstå varför det är så här jävla komplicerat....
          
          // Now, much later, this is the better procedure, not replacing the above but hopefully works better:
          // 1. All files has the cache_killer in it's url. 
          // 2. index.html make sure GameVersionToDownload is read from local storage first up, 
          // 3. THEN all js-files are loaded. So they can expect GameVersionToDownload to exist and 
          // 4. use it as their cache_killer. 
          // 5. voila, we get the latest version of _all_ files (except index.html) from the server. 
          // 6. Of course, we must reload everything anyway, and keep using the service_worker as before.
          
          window.location.reload();
        }
        else
        {
          // Note that we fail nicely here to keep the game working. 

          // Not good, the game has reloaded the page a few times, but still this switch is not happy. Pretend like nothing.
          if(OnlineStats.server_version != ServerVersion)
          {
            Log("Server version " + OnlineStats.server_version + " does not match expected "+ ServerVersion + ". Giving up.");
          }
          else if(ServerHasNewGameVersion)
          {
            Log("Server has a newer version of the game but we can't seem to get it. Our version: "+ GameVersion + ", Server game version: " + OnlineStats.server_has_game_version + ". Giving up.");
          }
          else
          {
            Log("Oddities during update. Giving up.");
          }
          
          // Since ReloadCount increase by one each time the game reach the start screen, we will soon have a 
          // very high number. We reset it to zero after a few times (50), to retry the entire update procedure.
          if(ReloadCount >= 50)
          {
            Log("It's time to try updating again. Reset ReloadCount and try next time.");
            ReloadCount = 0;
            StoreStuff();
          }
        }
      }
      else
      {
        if(ReloadCount > 0)
        {
          // Cool, we have reloaded the game to update to the latest files. Store a flag about it.
          TheGameHasJustBeenUpdated = true;
        }
        else
        {
          // No reloading has happened, we are happily running same code as last time we checked this. Reset the flag.
          TheGameHasJustBeenUpdated = false;
        }
        
        // All cool, reset ReloadCount, store any changes and keep going. (Note that a successful update further up the code ends up here as well!)
        ReloadCount = 0;
        StoreStuff();
      }
      
      Log("GotUpdated: " + GotUpdated + ", OnlineStats.server_version: " + OnlineStats.server_version + ", ServerVersion: "+ ServerVersion + ", FromVersion:" + FromVersion + ", GameVersion: " + GameVersion + ", OnlineStats.server_has_game_version: " + OnlineStats.server_has_game_version);
    }
  }
  catch (error)
  {
    // Any exception is just ignored, we want the game to keep on working regardless of server.
    Log(error.message);
    
    GotResponseFromServer = false;
  }
  
  FetchOnlineStatsDone = true;
}

// Fumbling together 32 characters by random should always be unique.
// In javascript, random is seeded with the current time stamp, so should be unique at all times. ;)
function CreateUniqueId()
{
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  var id = "";
  
  for(var i=0;i<32;i++)
  {
    var pos = Math.floor(Math.random() * characters.length);
    id += characters.charAt(pos);
  }
  
  return id;
}

function SetCuttingCoordinate()
{
  CuttingCoordinate = screenwidthHalf;
  if(SelectedInputMode == 1) // Left
  {
      CuttingCoordinate = screenwidthSeventh;
  }
  else if(SelectedInputMode == 2) // Right
  {
      CuttingCoordinate = 6 * screenwidthSeventh;
  }
}

// De här skickar vi med till knapparna, som anropar denna funktion när man klickar på den.
function StartScreenToSettingsButton()
{
  SetState(gsSettings);
  
  return 0;
}
function SettingsBackButton()
{
  SetState(gsStartScreen);
  
  return 0;
}
function SettingsButtonSwitchInputMode()
{
  SelectedInputMode++;
  
  if(SelectedInputMode > 2)
    SelectedInputMode = 0;

  SetCuttingCoordinate();
  Log("SelectedInputMode: " + SelectedInputMode);
    
  return SelectedInputMode;
}
function SettingsButtonSpeaker()
{
  SpeakerOn = !SpeakerOn;
  
  Log("SpeakerOn: " + SpeakerOn);
  
  if (SpeakerOn)
    audioHonkHonk.play();
  else
    audioMove3.play();
        
  // What image to show on button.
  return Number(SpeakerOn);
}
/*function PlayingToPauseButton()
{
  SetState(gsPaused);

  return 0;
}*/
function PauseScreenContinueButton()
{
  SetState(gsPlaying);

  return 0;
}
function PauseScreenRestartButton()
{
  SetState(gsIntroPlay);

  return 0;
}

// Alla knapparna ska ha samma färger o margins.
var cornerRadius = 0; // Sätter man cornerRadius till noll ritas ingen border ut.
var fillingInset = 0;
var shadowBlur = 0; 
var strokeStyle = "rgba(136,136,136,1.0)";
var fillStyle = "rgba(40,40,40,1.0)";
var shadowColor = "rgba(255,255,0,1.0)";
var selectedStrokeStyle = "rgba(180,180,180,1.0)";
var selectedShadowColor = "rgba(0,0,255,1.0)";
var selectedCornerRadius = cornerRadius + 0;
var selectedShadowBlur = shadowBlur + 0;
var zoomAmount = 20;

function CreateSettingsBackButton()
{
  var y = SafeHeightMargin;
  var settingsBackButtonCallBack = SettingsBackButton;

  CreateBackButton(y, settingsBackButtonCallBack);
}
/*function CreatePauseRestartButton()
{
  var y = textTenRows * 4;
  var settingsBackButtonCallBack = PauseScreenRestartButton;

  CreateBackButton(y, settingsBackButtonCallBack);
}*/
function CreateBackButton(backButtonYpos, backButtonCallBack)
{
    var x = SafeWidthMargin;
    var y = backButtonYpos;

    // Knapparna ska ligga på en rad, så det är viktigt att de är lika höga. Så vi sätter adaptToWidth till false.
    // OBS: Detta är första knappen i en row, så den bestämmer alla andra knappars höjd och x- o yposition!
    var width = 1;
    var height = ScreenHeight / 5;
    var adaptToWidth = false;

    var buttonBack = CreateButton(
        x, y, width, height,
        ScreenWidth, ScreenHeight,
        cornerRadius, fillingInset, shadowBlur, strokeStyle,
        fillStyle, shadowColor, [BackButtonImage], 0, selectedStrokeStyle,
        selectedShadowColor, selectedCornerRadius, selectedShadowBlur, backButtonCallBack,
        adaptToWidth, zoomAmount);

    AddButtonToRow(buttonBack, AllButtons, ButtonWidthDistance);
}
function CreateSettingsButtonSelectedInputMode()
{
  var x = 1;
  var y = 1;
  
  // Knapparna ska ligga på en rad, så det är viktigt att de är lika höga. Så vi sätter adaptToWidth till false.
  var width = 1;
  var height = 1;
  var adaptToWidth = false;
    
  var buttonSelectedInputMode = CreateButton(
    x, y, width, height,
    ScreenWidth, ScreenHeight,
    cornerRadius, fillingInset, shadowBlur, strokeStyle, 
    fillStyle, shadowColor, InputModeImages, SelectedInputMode, selectedStrokeStyle, 
    selectedShadowColor, selectedCornerRadius, selectedShadowBlur, SettingsButtonSwitchInputMode,
    adaptToWidth, zoomAmount);
  
  AddButtonToRow(buttonSelectedInputMode, AllButtons, ButtonWidthDistance);
}
function CreateSettingsSpeakerButton()
{
  var x = 1;
  var y = 1;
  
  // Knapparna ska ligga på en rad, så det är viktigt att de är lika höga. Så vi sätter adaptToWidth till false.
  var width = 1;
  var height = 1;
  var adaptToWidth = false;
  
  var buttonSpeaker = CreateButton(
    x, y, width, height,
    ScreenWidth, ScreenHeight,
    cornerRadius, fillingInset, shadowBlur, strokeStyle, 
    fillStyle, shadowColor, SpeakerImages, Number(SpeakerOn), selectedStrokeStyle, 
    selectedShadowColor, selectedCornerRadius, selectedShadowBlur, SettingsButtonSpeaker,
    adaptToWidth, zoomAmount);
    
  AddButtonToRow(buttonSpeaker, AllButtons, ButtonWidthDistance);
}

function CreateToSettingsButton()
{
  var x = ScreenWidth - SafeWidthMargin * 4;
  var y = SafeHeightMargin;
  var width = ScreenWidth / 12;
  var callBack = StartScreenToSettingsButton;

  CreateCogButton(x, y, width, callBack);
}

/*function CreatePauseGameButton()
{
  var x = ScreenWidth - SafeWidthMargin * 3.5;
  var y = textFiveRows;
  var width = ScreenWidth / 15;
  var callBack = PlayingToPauseButton;

  CreateCogButton(x, y, width, callBack);
}*/

function CreateCogButton(cogButtonXpos, cogButtonYpos, cogButtonImgWidth, cogButtonCallBack)
{
  // Which makes me wish for something like "rightAlignedButton"..
  var x = cogButtonXpos;
  var y = cogButtonYpos;

  var width = cogButtonImgWidth;
  var height = 1;
  var adaptToWidth = true;

  var buttonToSettings = CreateButton(
    x, y, width, height,
    ScreenWidth, ScreenHeight,
    cornerRadius, fillingInset, shadowBlur, strokeStyle,
    fillStyle, shadowColor, [SettingsButtonImage], 0, selectedStrokeStyle,
    selectedShadowColor, selectedCornerRadius, selectedShadowBlur, cogButtonCallBack,
    adaptToWidth, zoomAmount);

  AllButtons.push(buttonToSettings);
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
    RestartBlinkTimer: 0,
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
    player.Xsize = screenwidthFifth;
    player.Ysize = player.Xsize * 0.548;
    player.Xposition = screenwidthFifth * (player.RoadPos + 1);
    player.Yposition = ScreenHeight - player.Ysize * 1.05;
  }
}
function ResetGameVariables()
{
  // Clearing it here makes sure that everything drawn on it dissappears when going back to the start screen.
  streetctx.clearRect(0,0,ScreenWidth,ScreenHeight);
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
  LastDriveScore = player.Score;
  
  if (LastDriveScore > HighScore)
    HighScore = LastDriveScore;
  
  // In the future this function can be used to save amount of drives, time between deaths, and so on. Any statistics we want to save, for
  // the player to view or just for ourselves. :)
}

function EnterSomeKindOfPause()
{
  // Loosing focus or getting hidden, meaning screen saver should pause.
  screenSaverPaused = true;
  
  if(audioCurrentlyPlaying != null)
  {
    // Stop any playing sounds.
    audioCurrentlyPlaying.pause();
    audioCurrentlyPlaying.currentTime = 0;
  }
  
  // If we are playing it might be nice to return to a paused screen. :-)
  if(gameState == gsPlaying)
  {
    SetState(gsPaused);
  }
}
function ResumeFromSomeKindOfPause()
{
  // Regaining focus, meaning screen saver is back in full screen.
  // Don't bother resume playing any paused sound!
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
      if(newState == gsSplashScreen)
      {
        OnEnterSplashScreen();
        transitionCool = true;
      }
      break;
    case gsSplashScreen:
      if(newState == gsStartScreen)
      {
        OnEnterStartScreen();
        transitionCool = true;
      }
      break;
    case gsStartScreen:
      if(newState == gsIntroPlay)
      {
        OnExitStartScreen();
        TransitFromStartScreenToIntroPlay();
        transitionCool = true;
      }
      else if(newState == gsSettings)
      {
        OnExitStartScreen();
        OnEnterSettings();
        transitionCool = true;
      }
      break;
    case gsSettings:
      if(newState == gsStartScreen)
      {
        OnExitSettings();
        OnEnterStartScreen();
        transitionCool = true;
      }
      break;
    case gsIntroPlay:
      if(newState == gsPlaying)
      {
        TransitFromIntroPlayToPlaying();
        transitionCool = true;
      }
      break;
    case gsPlaying:
      if(newState == gsPaused)
      {
        OnEnterPaused();
        transitionCool = true;
      }
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
        TransitFromCrashedToPlaying();
        transitionCool = true;
      }
      if (newState == gsPaused)
      {
        TransitFromCrashedToPaused();
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
      if(newState == gsPlaying)
      {
        OnExitPaused();
        TransitFromPausedToPlaying();
        transitionCool = true;
      }
      else if(newState == gsStartScreen)
      {
        OnExitPaused();
        ResetGameVariables();
        TransitFromPauseScreenToIntroPlay();
        transitionCool = true;
      }
      break;
    case gsGameOver:
      // After a timer, player can click/touch screen to go back to the start screen.
      if(newState == gsStartScreen)
      {
        TransitFromGameOverToStartScreen();
        OnEnterStartScreen();
        transitionCool = true;
      }
      break;
    case gsWinGame:
      // After a timer, player can click/touch screen to go back to the start screen.
      if(newState == gsStartScreen)
      {
        TransitFromWinGameToStartScreen();
        OnEnterStartScreen();
        transitionCool = true;
      }
      break;
  }
  
  if(!transitionCool)
  {
    throw "Transition from " + gameState + " to " + newState + " is not valid!";
  }
  
  Log("Transition from " + gameState + " to " + newState + "!");  
  
  // The transition is ok, do it.

  // Set the new game state.
  gameState = newState;
}

function OnEnterSplashScreen()
{
  messageTimer = 1500;
}
function OnEnterStartScreen()
{
  messageTimer = 3000; // Used for the message txtTouchScreenToDrive.
  IntroMelodyPlayed = false;
  audioIntroMelody.pause();
  audioIntroMelody.currentTime = 0;  
  
  ctx.drawImage(StartBGImage, 0, 0, ScreenWidth, ScreenHeight);
  
  FetchOnlineStats();
  
  CreateToSettingsButton();
}
function OnExitStartScreen()
{
  AllButtons.length = 0; // Clear the buttons!
}
function OnEnterSettings()
{
  // Define buttons. NOTE: Don't change the order here, due to my terrible hacks in them!
  CreateSettingsBackButton();
  CreateSettingsButtonSelectedInputMode();
  CreateSettingsSpeakerButton();
}
function OnExitSettings()
{
  AllButtons.length = 0; // Clear the buttons!
}
function TransitFromStartScreenToIntroPlay()
{
  TimeToGoBackToPlay = Now + 2500;
  player.CrashState = "Restarting";
  player.RestartBlinkTimer = 0;
  audioIntroMelody.pause();
  audioIntroMelody.currentTime = 0;
  PlaySound(audioStart);
  audioCurrentlyPlaying = audioStart;
}
function TransitFromIntroPlayToPlaying()
{
  messageTimer = 0; // Reset to be used for "SPEED INCREASE".
  PlayStartTime = Now;
  player.CrashState = "None";
  explosionAnimFrameLength = 400;
  player.RestartBlinkTimer = 0;
  playerlivesCrashCheck = 0;
  //CreatePauseGameButton();
}

var playerlivesCrashCheck = 0; // Only used to store player lives when crashing, to avoid losing multiple lives on one crash, or no lives...
function TransitFromPlayingToCrashed()
{
  // Crashing into a car! Draw some explosion, make a sound.
  playerlivesCrashCheck = player.Lives;

  player.HasCollided = true;
  player.LivesBlinkTimer = 600;
  player.CrashState = "Exploding";
  
  currentExplosionFrameIndex = randomizeNumber(3);
  currentExplosionFrame = explosionAnim[currentExplosionFrameIndex];
  explosionAnimTimer = explosionAnimFrameLength;
  
  clearStreetTimer = 250;

  TimeToGoBackToPlay = Now + 3900;
  PlaySound(audioCrash);
}
function TransitFromCrashedToPlaying()
{
    player.RestartBlinkTimer = 0;
    playerlivesCrashCheck = 0;
}
function TransitFromCrashedToPaused()
{
    player.RestartBlinkTimer = 0;
    player.RoadPos = 2;
    player.Xposition = screenwidthFifth * (player.RoadPos + 1);
    player.LivesBlinkTimer = 0;
    player.Lives = playerlivesCrashCheck - 1;
    explosionAnimFrameCounter = 0;
    player.CrashState = "None";
    player.HasCollided = false;
    explosionAnimTimer = 0;
}
function TransitFromPauseScreenToIntroPlay()
{
    TimeToGoBackToPlay = Now + 2500;
    player.CrashState = "Restarting";
    player.RestartBlinkTimer = 0;
    PlaySound(audioStart);
    audioCurrentlyPlaying = audioStart;
}
function TransitFromPausedToPlaying()
{
  //CreatePauseGameButton();
}
function TransitFromGameOverToStartScreen()
{
  ResetGameVariables();
}
function TransitFromWinGameToStartScreen()
{
  audioEndingWin.pause();
  audioEndingWin.currentTime = 0;
  ResetGameVariables();
}
function OnEnterPaused()
{
  // Start a pause sound. (Lets see what happens when the app gets minimized..)
  
  
  //AllButtons.length = 0; // Clear the buttons!
  //CreatePauseRestartButton();
}
function OnExitPaused()
{
  AllButtons.length = 0; // Clear the buttons!
}
function OnEnterGameOver()
{
  PlaySound(audioGameOver);
  audioCurrentlyPlaying = audioGameOver;
  messageTimer = 5000; // Set for the txtTouchScreenToRestart message.
  
  PlayCount++;
  
  SetScoreStatistics();
  EndGameVariableResets();

  StoreStuff();

  AllButtons.length = 0; // Clear the buttons!
}
function OnEnterWinGame()
{
  // Start the wingame trudelutt.
  PlaySound(audioEndingWin);
  audioCurrentlyPlaying = audioEndingWin;
  messageTimer = 4000; // Set for the txtTouchScreenToPlayAgain message.
  
  player.Score = WinningScore;
  WinCount++;
  PlayCount++;
  
  SetScoreStatistics();
  EndGameVariableResets();

  StoreStuff();

  AllButtons.length = 0; // Clear the buttons!
}

// Play sound only if the speaker is turned on.
function PlaySound(sound)
{
  if(SpeakerOn)
  {
    var promise = sound.play();

    if(promise !== undefined)
    {
      // play() returns a Promise, and sooner or later it gets fulfilled or rejected. 
      // All we do here is to Log(), in order to understand some oddities better.
      promise.then(() => {
        // fulfilled, sound is playing.
        Log("Listen to the beatiful sound.");
      }, (value) => {
        // rejected, sound is not playing.
        Log("Sound was rejected to play! Reason:");
        Log(value);
      })
      .catch((err) => {
        Log(err);
      });
    }
  }
}

// Starts at sound zero, if zero is not selected, continue at one, and so on until 
// a sound is selected. By moving the selected sound to play to the end of the array
// it is not likely to be played again anytime soon. (but it has a chance!)
function PlayMoveSound(pos)
{
  if(Math.random() < 0.5)
  {
    // Yeah, sound at position pos got selected. 
    if(MoveSound.lastPlayed != null && MoveSound.lastPlayed.ended == false)
    {
      // Previous sound still playing. 
      // TODO: Have some quick fadeout and then play the new sound.
      // MoveSound.lastPlayed.volume = 0.2;
      
      // Just stop current sound and rewind to start until next time it gets played.
      // https://stackoverflow.com/questions/14834520/html5-audio-stop-function
      MoveSound.lastPlayed.pause();
      MoveSound.lastPlayed.currentTime = 0;
    }
    
    MoveSound.lastPlayed = audioMoveSounds[pos];
    PlaySound(MoveSound.lastPlayed);
    
    // Move the selected sound to the end of the array.
    audioMoveSounds.splice(pos,1);
    audioMoveSounds.push(MoveSound.lastPlayed);
    
    Log("Break sound nr " + pos + " proudly selected.");
  }
  else
  {
    if(pos + 1 < audioMoveSounds.length)
    {
      // Nopey, let's go on with another sound!
      PlayMoveSound(pos + 1);
    }
    else
    {
      // We are on the end of the list, so just select the last sound. (again)
      MoveSound.lastPlayed = audioMoveSounds[audioMoveSounds.length - 1];
      PlaySound(MoveSound.lastPlayed);
      
      Log("Boring! Make the list bigger!");
    }
  }
}

// Gets the direction and checks HasMoved(boolean) and if you can move any further in desired direction.
function PlayerMove(direction)
{
  var HasMoved = false;

  //Log("player.RoadPos: " + player.RoadPos);
  
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
    PlayMoveSound(0);
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
  
  if (ElapsedTime >= fpsInterval)
  {
    LastDraw = Now;
    
    switch(gameState)
    {
      case gsNothing:
        // This should never happen.
        break;
      case gsSplashScreen:
        // Draw the splash screen! Look for a touch/click meaning user want to go on to the start screen!
        GameLoopSplashScreen();
        break;
      case gsStartScreen:
        // Draw the start screen! Look for a touch/click meaning user want to start a new game!
        GameLoopStartScreen();
        break;
      case gsSettings:
        GameLoopSettings();
        break;
      case gsIntroPlay:
        GameLoopIntroPlay();
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
        GameLoopPaused();
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
  }
  
  // Always keep asking for the next animation frame.
  window.requestAnimationFrame(GameLoop);
}

function UpdateTimers()
{
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
function CheckMessageTimer()
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
function CheckElapsedCarsTime(isPlaying)
{
  if (ElapsedCarsTime >= gamespeedMS)
  {
    // Enough time has passed for all cars to update their positions.
    ElapsedCarsTime = 0;
        
    GameTickTheCars(isPlaying);
    
    DrawAllCars(true);
  }
}
function ScorePassedCars()
{
  player.Score += 10 * CheckAmountOfCarsToGetPoints();
  
  if (player.Score >= WinningScore)
  {
    player.Score = WinningScore; // Just clamp score to max. This fact also ends the game.
  }
  else if (player.Score >= nextLevel)
  {
    gamespeed += 0.1;
    gamespeedMS = 1000/gamespeed;
    
    nextLevel += 300 * gamespeed;

    messageTimer = 2600;
    speedIncreaseSoundPlaying = false;
  }
}
function CheckLivesBlinkTimer()
{
  if (player.LivesBlinkTimer > 0 && player.CrashState != "None")
  {
    player.LivesBlinkTimer -= ElapsedTime;
    
    // This one keeps going until it's reset somewhere else.
    if (player.LivesBlinkTimer <= 0)
      player.LivesBlinkTimer = 600;
  }
}
function CheckExplosionAnimTimer()
{
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
    }
  }
}

// Draw image smack-center on the screen, scaled to the given width. Height is adapted to keep ratio.
function DrawImageCentered(theCanvas, theImage, width)
{
  DrawImageByWidth(
    theCanvas, theImage, 
    ScreenWidth / 2 - width / 2, ScreenHeight / 2 - width / 2,
    width);
}

// Draw theImage scaled to the given width. Height is adapted to keep ratio.
function DrawImageByWidth(theCanvas, theImage, x, y, width)
{
  theCanvas.drawImage(
    theImage, 
    x, y, 
    width, width * theImage.height / theImage.width);    
}

function GameLoopSplashScreen()
{
  CheckMessageTimer();
  
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  DrawImageCentered(topctx, LogotypeImage, ScreenWidth/3);

  topctx.textAlign = "center";
  topctx.fillStyle = "black";
  topctx.font = textFifteenRows + "px CarStormFont1";
  topctx.strokeStyle = "white";
  topctx.lineWidth = ScreenHeightOnePointOnePercent;
  topctx.strokeText(txtAGameMadeBy, screenwidthHalf, textTwentyRows * 2);
  topctx.fillText(txtAGameMadeBy, screenwidthHalf, textTwentyRows * 2);
  
  if (messageTimer == 0)
  {
    topctx.textAlign = "center";
    topctx.fillStyle = "black";
    topctx.font = textFifteenRows + "px CarStormFont1";
    topctx.strokeStyle = "white";
    topctx.lineWidth = ScreenHeightOnePointOnePercent;
    topctx.strokeText(txtTouchTheScreen, screenwidthHalf, textTwentyRows * 18);
    topctx.fillText(txtTouchTheScreen, screenwidthHalf, textTwentyRows * 18);
  }  
}
function GameLoopStartScreen()
{
  if(FetchOnlineStatsDone && 
      IntroMelodyPlayed == false && 
      (audioIntroMelody.paused || audioIntroMelody.currentTime == 0))
  {
    Log("Playing intro melody.");
        
    // Online stats might want to reload all files from time to time, which would make the sound stutter as it is restarted.
    // We just wait until it has done it's job before starting the sound.
    // 
    // Interesting details to check if a sound is playing, downloaded or downloading etc.
    // https://stackoverflow.com/questions/9437228/how-to-check-if-an-audio-is-playing
    // 
    PlaySound(audioIntroMelody);
    audioCurrentlyPlaying = audioIntroMelody;
    IntroMelodyPlayed = true;
  }
  
  UpdateTimers();
  CheckMessageTimer();
  
  DrawSnowstorm();

  // The cars and text are drawn here so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  
  DrawButtons();
  
  // We want to define width, but keep aspect ratio.
  // https://stackoverflow.com/questions/10841532/canvas-drawimage-scaling
  var width = ScreenWidth/2.7;
  topctx.drawImage(
    MadSkullLogoImage, 
    ScreenWidth * 0.015, ScreenHeight * 0.03, 
    width, width * MadSkullLogoImage.height / MadSkullLogoImage.width);
    
  var titleHeight = textTwentyRows * 11;
  
  // First base draw of the colours, this is needed to get a specific transparency level.
  topctx.fillStyle = "rgba(237,73,51,0.3)"; // red-like
  topctx.textAlign = "center"; // Horizontal alignment only as far as I know.
  topctx.textBaseline = "bottom"; // We want the "line" start at the bottom of the text, not the middle.
  topctx.font = "bold " + (textFourRows) + "px Arial";
  topctx.fillText(txtCARSTORM, ScreenWidth/2 - BigLettersColorShift, titleHeight);
  topctx.fillStyle = "rgba(0,154,255,0.3)"; // blue-like
  topctx.fillText(txtCARSTORM, ScreenWidth/2 + BigLettersColorShift, titleHeight);
  
  // Second draw of the colours, these need to be alpha 0.5 so that the mix of the colours is even.
  topctx.fillStyle = "rgba(237,73,51,0.5)"; // red-like
  topctx.fillText(txtCARSTORM, ScreenWidth/2 - BigLettersColorShift, titleHeight);
  topctx.fillStyle = "rgba(0,154,255,0.5)"; // blue-like
  topctx.fillText(txtCARSTORM, ScreenWidth/2 + BigLettersColorShift, titleHeight);
  
  // Finally, black text.
  topctx.fillStyle = "black";
  topctx.fillText(txtCARSTORM, ScreenWidth/2, titleHeight);
  
  if (LastDriveScore > 0)
  {
    topctx.font = textFifteenRows + "px CarStormFont2";
    
    topctx.textAlign = "right";
    topctx.fillText(txtLastDriveScore, ScreenWidth - screenwidthNinth, textFifteenRows * 13);
    topctx.fillText(txtHighScore, ScreenWidth - screenwidthNinth, textFifteenRows * 14);
    
    topctx.textAlign = "left";
    topctx.fillText(LastDriveScore, ScreenWidth - screenwidthNinth, textFifteenRows * 13);
    topctx.fillText(HighScore, ScreenWidth - screenwidthNinth, textFifteenRows * 14);
  }

  topctx.textAlign = "left";
  topctx.font = textTwentyRows + "px CarStormFont2";
  
  if(ShowDebugStuff)
  {
    // I want to see the resolution on phones, to see if there is browser or screen scaling there as well just like in Windows.
    // topctx.fillText("Scale: " + ScreenScale, 0, textTwentyRows * 16);
    topctx.fillText("X: " + ScreenWidth, SafeWidthMargin, textTwentyRows * 16);
    topctx.fillText("Y: " + ScreenHeight, SafeWidthMargin, textTwentyRows * 17);
  }
    
  if (messageTimer == 0)
  {
    topctx.textAlign = "center";
    topctx.font = textFifteenRows + "px CarStormFont1";
    topctx.fillText(txtTouchScreenToDrive, ScreenWidth/2, textTwentyRows * 13);
  }
}
function GameLoopSettings()
{
  UpdateTimers();
  CheckMessageTimer();
  
  DrawSnowstorm();
  
  // The text and buttons are drawn here so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
    
  DrawButtons();

  var width = ScreenWidth/2;
  topctx.drawImage(
    MadSkullLogoImage, 
    ScreenWidth / 2 - width / 2, 3 * ScreenHeight / 10, 
    width, width * MadSkullLogoImage.height / MadSkullLogoImage.width);
  
  topctx.textAlign = "center";
  topctx.font = textTwentyRows + "px CarStormFont1";
  topctx.fillText("The creation of this game is a joint effort by", ScreenWidth / 2, textTwentyRows * 12);
  topctx.fillText("Jon and Timothy Lennryd", ScreenWidth / 2, textTwentyRows * 14);

  topctx.textAlign = "left";
  topctx.font = textTwentyRows + "px CarStormFont2";
    
  if(GotResponseFromServer)
  {
    if(ShowDebugStuff)
    {
      topctx.fillText("Server version: " + ServerVersion + ", Game version: " + GameVersion, SafeWidthMargin, textFifteenRows * 13);
    }
    
    topctx.fillText(txtPlayersOnlineNow + PlayersPlayingNow, SafeWidthMargin, textFifteenRows * 14);
    
    if(TheGameHasJustBeenUpdated)
    {
      topctx.fillText("Congratulations, you are running latest version of the game!", SafeWidthMargin, textFifteenRows * 12);
    }
  }
  else
  {
    topctx.fillText(txtOffline, SafeWidthMargin, textFifteenRows * 14);
  }
}
function GameLoopIntroPlay()
{
  UpdateTimers();
  player.RestartBlinkTimer += ElapsedTime;
      
  DrawSnowstorm();
  DrawStreetLayer();
  
  // The cars and text are drawn here so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  DrawStreetLights();
  DrawAllCars(false);
  DrawPlayerCar(true);    
  DrawPlayerLives();
  DrawPlayerScore();
  DrawButtons();
  
  if(Now > TimeToGoBackToPlay)
  {
    SetState(gsPlaying);
  }
}
function GameLoopCrashed()
{
  UpdateTimers();
  CheckMessageTimer();
  CheckLivesBlinkTimer();
  
  if (player.CrashState == "Restarting")
  {
    player.RestartBlinkTimer += ElapsedTime;
  }
  
  DrawSnowstorm();
  DrawStreetLayer();
  
  // The cars and text are drawn here so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  DrawStreetLights();
  DrawAllCars(false);
  DrawPlayerCar(true);    
  DrawPlayerLives();
  DrawPlayerScore();
  DrawButtons();

  DrawSpeedIncreaseMessage();
  
  // Placed this timer function below all draw functions to avoid having the explosion changing frame just before the blinking, which was a bit ugly. This fixes it.
  CheckExplosionAnimTimer();
  
  if (explosionAnimFrameCounter >= 3)
  {
    explosionAnimFrameCounter = 0;
    
    player.Lives--;
    player.LivesBlinkTimer = 0;
    
    if (player.Lives <= 0)
    {
      TimeToGoBackToPlay = 0;
    }
    else
    {
      player.CrashState = "Restarting";
      player.RoadPos = 2;
      player.Xposition = screenwidthFifth * (player.RoadPos + 1);
    }
  }
  
  if (Now > TimeToGoBackToPlay)
  {      
    if (player.Lives <= 0)
    {
      // Game over! 
      SetState(gsGameOver);

      finalScore = player.Score;
      player.Score = 0;
      player.CrashState = "GameOver";
    }
    else
    {
      player.CrashState = "None";
      player.HasCollided = false;
      explosionAnimTimer = 0;
      
      SetState(gsPlaying);
    }
  }
}
function GameLoopPlaying()
{
  UpdateTimers();
  CheckMessageTimer();
  CheckElapsedCarsTime(true);
  CheckLivesBlinkTimer();
  
  DrawSnowstorm();
  DrawStreetLayer();

  // The cars and text are drawn at streetctx or topctx so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  DrawStreetLights();
  DrawAllCars(false);
  DrawPlayerCar(true);
  DrawPlayerLives();
  DrawPlayerScore();
  DrawButtons();
  
  DrawSpeedIncreaseMessage();

  var arrowAlpha = 0.5;
  if(Now - PlayStartTime < 10000)
  {
    arrowAlpha = 1.0;
  }
  
  topctx.globalAlpha = arrowAlpha;
  {
    var arrowSide = ScreenHeight / 4;
    var y = ScreenHeight - arrowSide - SafeHeightMargin;
    var xLeft = SafeWidthMargin;
    var xRight = ScreenWidth - arrowSide - SafeWidthMargin;
    
    if(SelectedInputMode == 1) // Left
    {
      //xRight = xLeft + arrowSide + SafeWidthMargin * 4;
        xRight = CuttingCoordinate;
        xLeft = SafeWidthMargin/3;
    }
    else if(SelectedInputMode == 2) // Right
    {
      //xLeft = xRight - arrowSide - SafeWidthMargin * 4;
        xLeft = CuttingCoordinate - arrowSide;
        xRight = ScreenWidth - arrowSide - SafeWidthMargin/3;
    }
    
    topctx.drawImage(ArrowLeftImage, xLeft, y, arrowSide, arrowSide);
    topctx.drawImage(ArrowRightImage, xRight, y, arrowSide, arrowSide);
  }
  topctx.globalAlpha = 1.0;
  
  if (player.Score >= WinningScore)
  {
    SetState(gsWinGame);
  }
}
function GameLoopPaused()
{
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  DrawAllCars(false);
  DrawPlayerCar(false);
  DrawPlayerLives();
  DrawPlayerScore();
  DrawButtons();
      
  topctx.fillStyle = "black";
  topctx.textAlign = "center";
  topctx.font = textSevenRows + "px CarStormFont2";
  topctx.fillText("GAME PAUSED", screenwidthHalf, textFifteenRows * 6);
  topctx.font = textFifteenRows + "px CarStormFont1";
  topctx.fillText(txtTouchScreenToContinue, screenwidthHalf, textFifteenRows * 8);
}
function GameLoopGameOver()
{
  UpdateTimers();
  CheckMessageTimer();
  CheckLivesBlinkTimer();
  CheckExplosionAnimTimer();

  DrawSnowstorm();
  DrawStreetLayer();
  
  // The cars and text are drawn here so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  DrawStreetLights();
  DrawAllCars(false);
  DrawPlayerCar(true);

  // topctx.fillStyle = "darkorange";
  topctx.fillStyle = "rgba(255,93,40,1)";
  topctx.textAlign = "center";
  topctx.font = "bold " + textFiveRows + "px Arial";
  topctx.globalAlpha = 0.4;
  topctx.fillText(txtGAMEOVER, screenwidthHalf - BigLettersColorShift, textFiveRows * 2);
  topctx.fillText(txtGAMEOVER, screenwidthHalf + BigLettersColorShift, textFiveRows * 2);
  topctx.globalAlpha = 1;
  topctx.fillText(txtGAMEOVER, screenwidthHalf, textFiveRows * 2);
  
  topctx.fillStyle = "black";
  topctx.font = textTwelveRows + "px CarStormFont2";
  topctx.fillText(txtYourFinalScoreWas, screenwidthHalf, textTwentyRows * 10);
  topctx.fillText(finalScore, screenwidthHalf, textFifteenRows * 9);
  
  if (messageTimer == 0)
  {
    topctx.textAlign = "center";
    topctx.font = textFifteenRows + "px CarStormFont1";
    topctx.fillText(txtTouchScreenToRestart, screenwidthHalf, textFifteenRows * 11);
  }
}
function GameLoopWinGame()
{
  UpdateTimers();
  CheckMessageTimer();
  CheckElapsedCarsTime(false);
  CheckLivesBlinkTimer();
    
  DrawSnowstorm();
  DrawStreetLayer();

  // The cars and text are drawn here so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);

  // The street lights shouldn't stop because you've finished the game.
  DrawStreetLights();
  
  DrawAllCars(false);
  
  DrawPlayerCar(true);
  DrawPlayerLives();
  
  var yPosVictory = textTwelveRows * 6;
  topctx.fillStyle = "white";
  topctx.strokeStyle = "black";
  topctx.lineWidth = ScreenHeightThreePercent;
  topctx.textAlign = "center";
  topctx.font = "bold " + textFourRows + "px Arial";
  topctx.strokeText(txtVICTORY, screenwidthHalf, yPosVictory);
  topctx.fillText(txtVICTORY, screenwidthHalf, yPosVictory);
  topctx.globalAlpha = 0.4;
  topctx.fillText(txtVICTORY, screenwidthHalf, yPosVictory + VictoryColorShift * 1.7);
  topctx.fillText(txtVICTORY, screenwidthHalf, yPosVictory - VictoryColorShift * 1.7);
  topctx.fillText(txtVICTORY, screenwidthHalf, yPosVictory + VictoryColorShift / 2.2);
  topctx.fillText(txtVICTORY, screenwidthHalf, yPosVictory - VictoryColorShift / 2.2);
  topctx.fillText(txtVICTORY, screenwidthHalf, yPosVictory + VictoryColorShift);
  topctx.fillText(txtVICTORY, screenwidthHalf, yPosVictory - VictoryColorShift);
  topctx.globalAlpha = 1;
  
  var finalScore = player.Score;
  topctx.fillStyle = "yellow";
  topctx.strokeStyle = "black";
  topctx.lineWidth = ScreenHeightOnePointOnePercent;
  topctx.font = textTenRows + "px CarStormFont2";
  topctx.strokeText(finalScore, screenwidthHalf, textTenRows * 6);
  topctx.fillText(finalScore, screenwidthHalf, textTenRows * 6);
  
  if (messageTimer < 2000)
  {
    // Show up a few seconds after winning.
    topctx.fillStyle = "yellow";
    topctx.strokeStyle = "black";
    topctx.font = textTwelveRows + "px CarStormFont2";
    topctx.strokeText(txtYouAreASuperPlayer, screenwidthHalf, textTwelveRows * 8);
    topctx.fillText(txtYouAreASuperPlayer, screenwidthHalf, textTwelveRows * 8);
  }
  
  if (messageTimer == 0)
  {
    topctx.fillStyle = "black";
    topctx.font = textFifteenRows + "px CarStormFont1";
    topctx.strokeStyle = "white";
    topctx.lineWidth = ScreenHeightOnePointOnePercent;
    topctx.strokeText(txtTouchScreenToPlayAgain, screenwidthHalf, textFifteenRows * 12);
    topctx.fillText(txtTouchScreenToPlayAgain, screenwidthHalf, textFifteenRows * 12);
  }
}

// Every "game tick" check if the gamers car collides with any car in the bottom array. 
// Then move down the existing cars in the array, and create new ones on the top.
function GameTickTheCars(isPlaying)
{
  TickDownAllCarsOneRow();
  if (isPlaying)
  {
    PlaySound(audioBlip);
    
    CreateNewCars();

    if(CheckIfPlayerCollidesWithOtherCars())
    {
      if (player.Lives -1 <= 0)
      {
        AllButtons.length = 0; // Make sure that the pause button is removed on game over.
      }
      SetState(gsCrashed);
    }
    else
    {
      ScorePassedCars();
    }
  }
}
function EndGameVariableResets()
{
  // Here we reset variables that shouldn't affect things anymore in game over and win game states. But we don't yet want everything to reset.
  clearStreetTimer = 250; // This one is set twice in case of crashing and becoing game over, but so what...
  // explosionAnimFrameCounter = 0;
}
function CheckIfPlayerCollidesWithOtherCars()
{
  return level[3][player.RoadPos].hasCar;
}
function CheckAmountOfCarsToGetPoints()
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
      // Log("First if-statement: xCount[x] < -1");
      xCount[x] = 0;
      level[0][x].hasCar = true;
      c++;
      xCount[x]++;
    }
    else if (xCount[x] > 1)
    {
      // Log("Second if-statement: xCount[x] > 1");
      xCount[x] = 0;
      xCount[x]--;
    }
    else if(randomizeBool())
    {
      // Log("Third if-statement: randomizeBool()");
      if (xCount[x] < 2)
      {
        // Log("Third if-statement: xCount[x] < 2");
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
      // Log("Fourth if-statement: else");
      if (xCount[x] > -2)
      {
        // Log("Fourth if-statement: xCount[x] > -2");
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
          streetctx.drawImage(EnemyCarShadowImage, 
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
      // var testTextFont = 2.5 * textFiveRows;
      
      // topctx.fillStyle = "blue";
      // topctx.textAlign = "center";
      // topctx.font = testTextFont + "px Arial";
      // topctx.fillText("emptyRowCount: " + emptyRowCount, screenwidthHalf,  ScreenHeight/2 - ScreenHeight/6);
      // topctx.font = testTextFont + "px Arial";
      // topctx.fillText(xCount[0], screenwidthHalf - ScreenWidth/20, ScreenHeight/2 - ScreenHeight/10);
      // topctx.fillText(xCount[1], screenwidthHalf,  ScreenHeight/2 - ScreenHeight/10);
      // topctx.fillText(xCount[2], screenwidthHalf + ScreenWidth/20,  ScreenHeight/2 - ScreenHeight/10);
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
function randomizeFloatNumber(number)
{
  return Math.random() * number;
}

function DrawStreetLights()
{
  if (streetLightTimer >= gamespeedMS)
  {
    streetctx.fillStyle = "rgba(255,100,0,1)";
    streetctx.beginPath();
    streetctx.arc(screenwidthHalf - lightWidth, (ScreenHeight / 2) + lightHeight, orangeLightSize, 0, 2 * Math.PI);
    streetctx.fill();
    streetctx.beginPath();
    streetctx.arc(screenwidthHalf + lightWidth, (ScreenHeight / 2) + lightHeight, orangeLightSize, 0, 2 * Math.PI);
    streetctx.fill();
    
    streetctx.fillStyle = "yellow";
    streetctx.beginPath();
    streetctx.arc(screenwidthHalf - lightWidth, (ScreenHeight / 2) + lightHeight, yellowLightSize, 0, 2 * Math.PI);
    streetctx.fill();
    streetctx.beginPath();
    streetctx.arc(screenwidthHalf + lightWidth, (ScreenHeight / 2) + lightHeight, yellowLightSize, 0, 2 * Math.PI);
    streetctx.fill();
    
    streetLightTimer = 0;
  }
}
var drawPlayerCrashSmoke = false;

function DrawPlayerCar(isNotPaused)
{
  var drawCar = true;
  
  if (player.CrashState == "Restarting")
  {
    if (player.RestartBlinkTimer % 700 < 350)
      drawCar = false;
  }
  
  if (drawCar)
  {
    if (isNotPaused)
    {
      topctx.globalAlpha = 0.7;
      topctx.drawImage(
        PlayerCarShadowImage, 
        player.Xposition - player.Xposition/35, 
        player.Yposition + player.Yposition/4, 
        player.Xsize * 1.12, 
        player.Ysize - player.Ysize/2);
      topctx.globalAlpha = 1;
    }
    
    topctx.drawImage(PlayerCarImage, player.Xposition, player.Yposition, player.Xsize, player.Ysize);
  }
  
  if (player.HasCollided)
  {
    if (player.CrashState == "Exploding" || player.CrashState == "GameOver")
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
        
        // if (isNotPaused)
        streetctx.globalAlpha = rendAlfa;
        streetctx.drawImage(smokeImage, player.Xposition - ScreenWidth/randXpos, player.Yposition - ScreenWidth/randYpos, player.Xsize * 1.32, player.Ysize * 1.3);
        streetctx.globalAlpha = 1;
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
function DrawPlayerScore()
{
  topctx.fillStyle = "black";
  topctx.textAlign = "left";
  topctx.font = textTenRows + "px CarStormFont2";
  topctx.fillText(player.Score, ScreenWidth - screenwidthSeventh, textTwentyRows * 3);
}

var speedIncreaseSoundPlaying = false;
function DrawSpeedIncreaseMessage()
{
    if (messageTimer != 0)
    {
        if (messageTimer % 650 > 250)
        {
            topctx.drawImage(SpeedIncreaseImage,
                screenwidthHalf - screenwidthHalf / 2, ScreenHeight / 2 - ScreenHeight / 7,
                screenwidthHalf, screenwidthHalf * 0.076);

            if (!speedIncreaseSoundPlaying)
            {
                audioSpeedUp.pause();
                audioSpeedUp.currentTime = 0;
                PlaySound(audioSpeedUp);
                speedIncreaseSoundPlaying = true;
            }
        }
        else
        {
            if (speedIncreaseSoundPlaying)
                speedIncreaseSoundPlaying = false;
        }
    }
}

var stormRotationDegrees = 0;
var stormRotationSpeed = 0.007;
var stormRotationMax = 0.4;

function DrawSnowstorm()
{
  stormRotationDegrees += stormRotationSpeed;
  
  if (stormRotationDegrees > stormRotationMax)
  {
    stormRotationSpeed = -stormRotationSpeed;
    stormRotationMax = 0.2 + randomizeFloatNumber(0.4);
  }
  else if (stormRotationDegrees < -stormRotationMax)
  {
    stormRotationSpeed = -stormRotationSpeed;
    stormRotationMax = 0.2 + randomizeFloatNumber(0.4);
  }
  
  var max;
  
  var snowImage;

  // Men bajs, copying the "entire" canvas ignores our math in ResizeCanvas(),
  // we must give the function(s) the actual pixel sizes, since scale() is not 
  // affecting getImageData() !!!
  // 
  var scaledScreenWidth = ScreenWidth * ScreenScale;
  var scaledScreenHeight = ScreenHeight * ScreenScale;
    
  // Copy the entire canvas to hiddenCtx. As said above, this ignores the scale() in ResizeCanvas().
  var imgData = ctx.getImageData(0, 0, scaledScreenWidth, scaledScreenHeight);
  
  // Would be nice to be able to just use imgData directly with drawImage(), but it looks like we have to do it this way. 
  hiddenCtx.putImageData(imgData, 0, 0);
  
  ctx.save();
  {
    var speed = 0.0106 * gamespeed * ScreenScale; // Zoom-in speed.
    var xSide = ScreenWidth * speed;
    var ySide = ScreenHeight * speed;
    
    // Rotating the storm eliminates the 8 artifact rays coming from the zoom in.
    // However, the lights and car shadows will rotate too... So we need ANOTHER canvas AND another hidden canvas (I assume) to let those scale normally.
    ctx.translate(screenwidthHalf, ScreenHeight / 2);
    ctx.rotate(stormRotationDegrees * Math.PI / 180);
    ctx.translate(-screenwidthHalf, -ScreenHeight / 2);
    
    // Stretch out the copied (smaller) image over the entire canvas.
    // Note! We are drawing the _canvas_ object, not its 2d context. 
    // Also here we must use _actual_ pixel sizes since scale() is ignored, but ONLY 
    // for the source coordinates!! :O 
    // 
    ctx.drawImage(
      hiddenCanvas, 
      xSide, ySide, scaledScreenWidth - xSide * 2, scaledScreenHeight - ySide * 2,  // Source rectangle.
      0, 0, ScreenWidth, ScreenHeight);                                             // Target rectangle.
  }
  ctx.restore();
  // Now draw some snow particles in the center of the image.
  // ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", 1)";
  // for(var i=0; i<10; i++)
  // {
    // Round snow
    // max = ScreenHeight/10;
    // var minSize = ScreenHeight/400;
    // var maxSize = ScreenHeight/80;
    
    // var xRand = max - Math.floor(Math.random() * (max));  // 0 to max
    // var yRand = max - Math.floor(Math.random() * (max));
    // xRand -= max / 2;
    // yRand -= max / 2;
    
    // var size = minSize + Math.floor(Math.random() * (maxSize));
    
    // ctx.beginPath();
    // ctx.arc(screenwidthHalf - 1 - xRand, ScreenHeight / 2 - 1 - yRand, size, 0, 2 * Math.PI);
    // ctx.fill();
  //}
  ctx.globalAlpha = 0.64;
  // snow images
  for(var i=0; i<2; i++)
  {
    snowImage = snowImages[randomizeNumber(5)];
    
    max = ScreenHeight/7;
    var minSize = ScreenHeight/25;
    var maxSize = ScreenHeight/16;
    
    var xRand = max - Math.floor(Math.random() * (max));  // 0 to max
    var yRand = max - Math.floor(Math.random() * (max));
    xRand -= max / 2;
    yRand -= max / 2;
    
    var size = minSize + Math.floor(Math.random() * maxSize);
    var xPos = screenwidthHalf - 1 - xRand;
    var yPos = ScreenHeight / 2 - 1 - yRand;
    var imageHalf = size/2;
    
    var snowImageRotation = randomizeNumber(360);
    
    ctx.save();
    {
      ctx.translate(screenwidthHalf, ScreenHeight / 2);
      ctx.rotate(snowImageRotation * Math.PI / 180);
      ctx.translate(-screenwidthHalf, -ScreenHeight / 2);
      
      ctx.drawImage(snowImage, xPos - imageHalf, yPos - imageHalf, size, size);
    }
    ctx.restore();
  }
  
  ctx.globalAlpha = 1;
}

function DrawStreetLayer()
{
  var scaledScreenWidth = ScreenWidth * ScreenScale;
  var scaledScreenHeight = ScreenHeight * ScreenScale;  
  
  // Copy the entire ctx image.
  var imgData = streetctx.getImageData(0, 0, scaledScreenWidth, scaledScreenHeight);
  
  // Draw it here meanwhile.
  hiddenCtx.putImageData(imgData, 0, 0);
  
  // Empty! We don't want any smearing, just the zooming.
  streetctx.clearRect(0,0,scaledScreenWidth,scaledScreenHeight);
    
  streetctx.save();
  {
    var speed = 0.0106 * gamespeed * ScreenScale;//0.01;  // Zoom-in speed.
    var xSide = ScreenWidth * speed;
    var ySide = ScreenHeight * speed;
      
    // Copy a somewhat smaller rectangle from the center of the image,
    // draw it stretched to fill the entire ctx.
    // (This is all the zoom-magic)
    // Note! We are drawing the _canvas_ object, not its 2d context. 
    streetctx.drawImage(
      hiddenCanvas, 
      xSide, ySide, scaledScreenWidth - xSide * 2, scaledScreenHeight - ySide * 2, 
      0, 0, ScreenWidth, ScreenHeight);
  }
  streetctx.restore();
}

function DrawButtons()
{
  // This only works as long as we assume all buttons are drawn on the topctx.
  for(var i=0; i<AllButtons.length; i++)
  {
    AllButtons[i].Draw(topctx);
  }
}
function ButtonsResize()
{
  ResizeRow(AllButtons, ButtonWidthDistance, ScreenWidth, ScreenHeight);
}
function ButtonsOnTouchStart(x,y)
{
  for(var i=0; i<AllButtons.length; i++)
  {
    AllButtons[i].OnTouchStart(x,y, Now);
  }
}
function ButtonsOnTouchMove(x,y)
{
  for(var i=0; i<AllButtons.length; i++)
  {
    AllButtons[i].OnTouchMove(x,y);
  }
}
function ButtonsOnTouchEnd()
{
  for(var i=0; i<AllButtons.length; i++)
  {
    AllButtons[i].OnTouchEnd(Now);
  }
}

// Always at the end of the file. See index.html.
if (typeof IncreaseReadyCount !== 'undefined')
{
  IncreaseReadyCount();
}
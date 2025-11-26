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

// Set to false to remove all log messages, good for releases!
// So use Log("Jamsy message here."); not console.log(). 
const PleaseLitterWithConsoleLogs = false;

if (PleaseLitterWithConsoleLogs) 
  var Log = console.log;
else 
  var Log = function(){};

// Set to false to remove debug-prints onscreen in the game.
const ShowDebugStuff = false;

// TODO: Ta in pauskod från nyare skärmsläckare.
  
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

// If true, it starts in paused mode, and gets activated by the focus event.
var screenSaverPaused = false;

// Canvas 2d surface, for drawing on.
var ctx = null;       // The rotating sliding towards the screen snowstorm.
var streetctx = null; // The street and car shadows, also sliding along but not rotating.
var topctx = null;    // Score, cars and stuff.

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
var gsSettings = "Settings";
var gsIntroPlay = "IntroPlay";
var gsPlaying = "Playing";
var gsCrashed = "Crashed";
var gsPaused = "Paused";
var gsGameOver = "GameOver";
var gsWinGame = "WinGame";

// This was really fun to do, but lets SetState() check if the given parameter is an actual state or a syntax error.
var gameStates = [ gsNothing, gsStartScreen, gsSettings, gsIntroPlay, gsPlaying, gsCrashed, gsPaused, gsGameOver, gsWinGame ];

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

var GotResponseFromServer = false;
var FetchOnlineStatsDone = false;
var ServerVersion = 1;  // Always set to 1 here. The cache will keep the players real version.
var GameVersion = 1;    // Should be increased each time we do a change in game code. (only for our knowledge of which version users are running)

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

var roadWidth = 0;

var hiddenCanvas = document.createElement('canvas');
var hiddenCtx = hiddenCanvas.getContext("2d");

var roadStartLeft;

var explosionAnim = [3];
var snowImages = [5];
var currentExplosionFrame;
var currentExplosionFrameIndex = 0;
var explosionAnimFrameLength = 0;
var explosionAnimTimer = 0;
var explosionAnimFrameCounter = 0;

const audioIntroMelody = new Audio("sound/intro_melody.mp3");
const audioStart = new Audio("sound/start.mp3");
const audioBlip = new Audio("sound/blip.mp3");
const audioMove1 = new Audio("sound/move1.mp3");
const audioMove2 = new Audio("sound/move2.mp3");
const audioMove3 = new Audio("sound/move3.mp3");
const audioMove4 = new Audio("sound/move4.mp3");
const audioMove5 = new Audio("sound/move5.mp3");
const audioCrash = new Audio("sound/crash.mp3");
const audioGameOver = new Audio("sound/gameover.mp3");
const audioEndingWin = new Audio("sound/ending_win.mp3");

const audioMoveSounds = [audioMove1,audioMove2,audioMove3,audioMove4,audioMove5];

// Longer sounds must be paused when the game is minimized, put a reference to it here.
var audioCurrentlyPlaying = null;

var MoveSound = {
  lastPlayed: null,
};

var StartBGImage = new Image();
StartBGImage.src = "graphics/StartBackground.png";
var MadSkullLogoImage = new Image();
MadSkullLogoImage.src = "graphics/MadSkullCreationsLogo.png";

var SnowPuffImage1 = new Image();
SnowPuffImage1.src = "graphics/SnowPuff1.png";
var SnowPuffImage2 = new Image();
SnowPuffImage2.src = "graphics/SnowPuff2.png";
var SnowPuffImage3 = new Image();
SnowPuffImage3.src = "graphics/SnowPuff3.png";
var SnowPuffImage4 = new Image();
SnowPuffImage4.src = "graphics/SnowPuff4.png";
var SnowPuffImage5 = new Image();
SnowPuffImage5.src = "graphics/SnowPuff5.png";

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

var SpeedIncreaseImage = new Image();
SpeedIncreaseImage.src = "graphics/SpeedIncreaseMessage.png";

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

var InputModeButtonNormal = new Image();
InputModeButtonNormal.src = "graphics/InputModeButtonNormal.png";
var InputModeButtonLeft = new Image();
InputModeButtonLeft.src = "graphics/InputModeButtonLeft.png";
var InputModeButtonRight = new Image();
InputModeButtonRight.src = "graphics/InputModeButtonRight.png";
var InputModeImages = [InputModeButtonNormal,InputModeButtonLeft,InputModeButtonRight];

var AllButtons = [];  // When any button is created, it must be added here for the Resize and touch events to work. When leaving a window, remove all buttons!
var SelectedInputMode = 0; // 0:Normal,1:Left,2:Right
var SettingsButtonSelectedInputMode = null; // Lessen att jag inte kunde komma på ett längre namn. :D

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
  
  // Not sure it makes a difference right here, but scaling up gets pixelated, not softened. 
  c.style.imageRendering = "pixelated";
  sc.style.imageRendering = "pixelated";
  tc.style.imageRendering = "pixelated";
  hiddenCanvas.style.imageRendering = "pixelated";
  
  // A winterstorm background should be almost white, not green. :)
  c.style.backgroundColor = "#eee";
  
  // Setting willReadFrequently to true might increase speed as we are reading the entire image and redrawing it every frame.
  // https://stackoverflow.com/questions/74101155/chrome-warning-willreadfrequently-attribute-set-to-true
  ctx = c.getContext("2d", { willReadFrequently: true });
  streetctx = sc.getContext("2d", { willReadFrequently: true });
  topctx = tc.getContext("2d", { willReadFrequently: true });
    
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
  
  // We enter the game with the loading screen visible.
  SetState(gsStartScreen);
      
  // Start the game loop!
  GameLoop();
}

function SetupCallbacks()
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
    
  // Since the ontouchstart event is ONLY defined in browsers connected to a touch screen,
  // we can kind of trust this approach! 
  // https://stackoverflow.com/questions/2915833/how-to-check-browser-for-touchstart-support-using-js-jquery
  if ('ontouchstart' in document.documentElement)
  {
    // Yeah! Touch events are here!
    // Much cooler feeling when the car moves when you put your finger on the screen!
    // (Instead of when you lift your finger from the screen.)
    document.addEventListener("touchstart", (e) => {
      var x = e.touches[0].clientX;

      // Multitouch you know. :)
      TouchClickEvent(e.touches[0].clientX, e.touches[0].clientY);
    });
    
    document.addEventListener("touchend", (e) => {
      var x = e.touches[0].clientX;

      // Multitouch you know. :)
      ButtonsOnTouchEnd(e.touches[0].clientX, e.touches[0].clientY);
    });    
  }
  else
  {
    // Buhöö, no touch events, go by mouse events. 
    document.addEventListener("mousedown", (e) => {
      e = e || window.event;
      
      if(e.button == 0) // Most of the time the left button
      {
        // Log("mousedown: " + e.button);
        TouchClickEvent(e.clientX, e.clientY);
      }
    });
    document.addEventListener("mouseup", (e) => {
      e = e || window.event;
      
      if(e.button == 0) // Most of the time the left button
      {
        ButtonsOnTouchEnd(e.clientX, e.clientY);
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
    case gsStartScreen:
        // Clicking the start screen starts a new game.
        //SetState(gsIntroPlay);
        
        SetState(gsSettings);
      break;
    case gsSettings:
      // TODO: Click the buttons. 
      // Buttons: Back. Sound switch. Input mode toggle.
      
      // Clicking the screen goes back to start screen right now.
      //SetState(gsStartScreen);
      break;
    case gsPlaying:
      if(xPos < screenwidthHalf)
      {
        // Log("mousedown left");
        PlayerMove("left");
      }
      else
      {
        // Log("mousedown right");
        PlayerMove("right");
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

  // Behåll som kommentar, kul att veta.  
  ScreenScale = window.devicePixelRatio;
  // window.visualViewport.scale
  // We should read this article. I don't have time tonight...
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
  
  // realScreenWidth = Math.floor(window.innerWidth * ScreenScale);
  // realScreenHeight = Math.floor(window.innerHeight * ScreenScale);
  ScreenWidth = window.innerWidth;
  ScreenHeight = window.innerHeight;
    
  var cs = document.getElementById('canvas');
  cs.height = ScreenHeight;
  cs.width = ScreenWidth;

  var streetcs = document.getElementById('street_canvas');
  streetcs.height = ScreenHeight;
  streetcs.width = ScreenWidth;
  
  var topcs = document.getElementById('top_canvas');
  topcs.height = ScreenHeight;
  topcs.width = ScreenWidth;
  
  hiddenCanvas.height = ScreenHeight;
  hiddenCanvas.width = ScreenWidth;
  
  textFourRows = ScreenHeight / 4;
  textFiveRows = ScreenHeight / 5;
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

function StoreStuff()
{
  localStorage.setItem("GameVersion", GameVersion);
  localStorage.setItem("ServerVersion", ServerVersion);
  localStorage.setItem("LastDriveScore", LastDriveScore);
  localStorage.setItem("HighScore", HighScore);
  localStorage.setItem("WinCount", WinCount);
  localStorage.setItem("PlayCount", PlayCount);
  localStorage.setItem("ReloadCount", ReloadCount);
}

function ReadStuff()
{
  var pleaseLetThereBeAGameVersionAtAllHere = parseInt(localStorage.getItem("GameVersion"));
  
  if(!pleaseLetThereBeAGameVersionAtAllHere)
  {
    // There is no local storage at all at the moment.
    return;
  }
  
  GameVersion = pleaseLetThereBeAGameVersionAtAllHere;
  
  if(GameVersion >= 1)
  {
    // Just means that GameVersion == 1 OR BIGGER expects these variables to exist.
    ServerVersion = parseInt(localStorage.getItem("ServerVersion"));
    LastDriveScore = parseInt(localStorage.getItem("LastDriveScore"));
    HighScore = parseInt(localStorage.getItem("HighScore"));
    WinCount = parseInt(localStorage.getItem("WinCount"));
    PlayCount = parseInt(localStorage.getItem("PlayCount"));
    ReloadCount = parseInt(localStorage.getItem("ReloadCount"));
  }
  if(GameVersion >= 31)
  {
    // Never happens yet. The number 31 instead of expected 2 just means
    // that the localStorage structure has not changed at all in the 
    // previous 30 versions. But in version 31 we decided to add the fancy
    // Smurf-field. And since we just read in GameVersion and it says 
    // the version of the localStorage is 31 or greater, the Smurf-field
    // should exist.
    // 
    // Smurf = parseInt(localStorage.getItem("Smurf"));
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
  
  try
  {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    var url = "version.php?";
    url += "game_version="+GameVersion+"&";
    url += "win_count="+WinCount+"&";
    url += "high_score="+HighScore+"&";
    url += "play_count="+PlayCount+"&"; 
    url += "reload_count="+ReloadCount+"&"; 
    url += "cache_killer="+Math.random();// Last param omit the &.
    
    const response = await fetch(url);

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

        // First version has these variables: server_version and players_now
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
      
      if(!RunningSameAsServer && !GotUpdated)
      {
        // Looks like server has a newer version that our code know nothing about. 
        Log("We seem to be running an old version of the game!");
              
        ReloadCount++;
        
        // Store the ReloadCount!
        StoreStuff();
        
        // Store the ReloadCount.
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
        
        if(ReloadCount <= 2)
        {
          // Enforce a reload of the game files from server.
          // Please note we might do this twice! 
          Log("Reloading!");
          
          window.location.reload();
        }
        else
        {
          // Note that we fail nicely here to keep the game working. 

          // Not good, the game has reloaded the page a few times, but still this switch is not happy. Pretend like nothing.
          Log("Server version " + OnlineStats.server_version + " does not match expected "+ ServerVersion + ". Giving up.");
          
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
        // All cool, reset ReloadCount, store any changes and keep going.
        ReloadCount = 0;
        StoreStuff();
      }
      
      Log("GotUpdated: " + GotUpdated + ", OnlineStats.server_version: " + OnlineStats.server_version + ", ServerVersion: "+ ServerVersion + ", FromVersion:" + FromVersion);
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

// Den här skickar vi med till knappen, som anropar denna funktion när man klickar på den.
function SettingsButtonSwitchInputMode()
{
  SelectedInputMode++;
  
  if(SelectedInputMode > 2)
    SelectedInputMode = 0;
    
  return SelectedInputMode;
}

function CreateSettingsButtonSelectedInputMode()
{
  var x = ScreenWidth / 10;
  var y = ScreenHeight / 10;
  
  // We want the button to be pretty big, take up a third of the screen width.
  var width = ScreenWidth / 3;
  var height = 1; // whatev, så länge vi vill ha en knapp med en bild i så beror höjden på bredden.

  var cornerRadius = 10;
  var fillingInset = 10;
  var shadowBlur = 20;
  var strokeStyle = "rgba(255,128,255,1.0)";
  var fillStyle = "rgba(255,255,0,1.0)";
  var shadowColor = "rgba(255,0,255,1.0)";

  var selectedStrokeStyle = "rgba(255,0,0,1.0)";
  var selectedShadowColor = "rgba(0,0,255,1.0)";
  var selectedCornerRadius = cornerRadius + 10;
  var selectedShadowBlur = shadowBlur + 10;

  //var images = null; 
  var images = InputModeImages;

  SettingsButtonSelectedInputMode = CreateButton(
    x, y, width, height,
    ScreenWidth, ScreenHeight,
    cornerRadius, fillingInset, shadowBlur, strokeStyle, 
    fillStyle, shadowColor, images, selectedStrokeStyle, 
    selectedShadowColor, selectedCornerRadius, selectedShadowBlur, SettingsButtonSwitchInputMode);
    
  AllButtons.push(SettingsButtonSelectedInputMode);
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
      if(newState == gsStartScreen)
      {
        OnEnterStartScreen();
        transitionCool = true;
      }
      break;
    case gsStartScreen:
      if(newState == gsIntroPlay)
      {
        TransitFromStartScreenToIntroPlay();
        transitionCool = true;
      }
      else if(newState == gsSettings)
      {
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

function OnEnterStartScreen()
{
  messageTimer = 3000; // Used for the message txtTouchScreenToDrive.
  IntroMelodyPlayed = false;
  FetchOnlineStats();
}
function OnEnterSettings()
{
  // Define buttons.
  CreateSettingsButtonSelectedInputMode();
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
  audioStart.play();
  audioCurrentlyPlaying = audioStart;
}
function TransitFromIntroPlayToPlaying()
{
  messageTimer = 0; // Reset to be used for "SPEED INCREASE".
  player.CrashState = "None";
  explosionAnimFrameLength = 400;
  player.RestartBlinkTimer = 0;
}
function TransitFromPlayingToCrashed()
{
  // Crashing into a car! Draw some explosion, make a sound. 
  player.HasCollided = true;
  player.LivesBlinkTimer = 600;
  player.CrashState = "Exploding";
  // player.RestartBlinkTimer = 3800;
  
  currentExplosionFrameIndex = randomizeNumber(3);
  currentExplosionFrame = explosionAnim[currentExplosionFrameIndex];
  explosionAnimTimer = explosionAnimFrameLength;
  
  clearStreetTimer = 250;

  TimeToGoBackToPlay = Now + 3900;
  audioCrash.play();
}
function TransitFromCrashedToPlaying()
{
  player.RestartBlinkTimer = 0;
}
function TransitFromPausedToPlaying()
{
  // Resume playing. I guess here will happen nothing.
}
function TransitFromGameOverToStartScreen()
{
  ResetGameVariables();
  StoreStuff();
}
function TransitFromWinGameToStartScreen()
{
  audioEndingWin.pause();
  audioEndingWin.currentTime = 0;
  ResetGameVariables();
  StoreStuff();
}
function OnEnterPaused()
{
  // Start a pause sound. (Lets see what happens when the app gets minimized..)
}
function OnEnterGameOver()
{
  audioGameOver.play();
  audioCurrentlyPlaying = audioGameOver;
  messageTimer = 5000; // Set for the txtTouchScreenToRestart message.
  
  PlayCount++;
  
  SetScoreStatistics();
  EndGameVariableResets();
}
function OnEnterWinGame()
{
  // Start the wingame trudelutt.
  audioEndingWin.play();
  audioCurrentlyPlaying = audioEndingWin;
  messageTimer = 4000; // Set for the txtTouchScreenToPlayAgain message.
  
  player.Score = WinningScore;
  WinCount++;
  PlayCount++;
  
  SetScoreStatistics();
  EndGameVariableResets();
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
    MoveSound.lastPlayed.play();
    
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
      MoveSound.lastPlayed.play();
      
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
  
  // TODO: Should be here, but Date.now() returns integer ms, and the diff (ElapsedTime) can be zero sometimes.
  // LastDraw = Now;

  if (ElapsedTime >= fpsInterval)
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
    
    messageTimer = 3000;
  }
}
function CheckLivesBlinkTimer()
{
  if (player.LivesBlinkTimer > 0)
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

function GameLoopStartScreen()
{
  if(FetchOnlineStatsDone && 
      IntroMelodyPlayed == false && 
      (audioIntroMelody.paused || audioIntroMelody.currentTime == 0))
  {
    // Online stats might want to reload all files from time to time, which would make the sound stutter as it is restarted.
    // We just wait until it has done it's job before starting the sound.
    // 
    // Interesting details to check if a sound is playing, downloaded or downloading etc.
    // https://stackoverflow.com/questions/9437228/how-to-check-if-an-audio-is-playing
    // 
    audioIntroMelody.play();
    audioCurrentlyPlaying = audioIntroMelody;
    IntroMelodyPlayed = true;
  }
  
  UpdateTimers();
  CheckMessageTimer();
  
  DrawSnowstorm();

  // The cars and text are drawn here so they don't get smeared.
  topctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  
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
    topctx.fillText("X: " + ScreenWidth, screenwidthThirteenth / 2, textTwentyRows * 16);
    topctx.fillText("Y: " + ScreenHeight, screenwidthThirteenth / 2, textTwentyRows * 17);
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
  
  var width = ScreenWidth/2.7;
  topctx.drawImage(
    MadSkullLogoImage, 
    ScreenWidth * 0.015, ScreenHeight * 0.03, 
    width, width * MadSkullLogoImage.height / MadSkullLogoImage.width);
  
  DrawButtons();
  
  topctx.textAlign = "left";
  topctx.font = textTwentyRows + "px CarStormFont2";
  
  if(GotResponseFromServer)
  {
    if(ShowDebugStuff)
    {
      topctx.fillText("Server version: " + ServerVersion, screenwidthThirteenth / 2, textFifteenRows * 13);
    }
    
    topctx.fillText(txtPlayersOnlineNow + PlayersPlayingNow, screenwidthThirteenth / 2, textFifteenRows * 14);
  }
  else
  {
    topctx.fillText(txtOffline, screenwidthThirteenth / 2, textFifteenRows * 14);
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
  
  DrawSpeedIncreaseMessage();

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
      
  topctx.fillStyle = "black";
  topctx.textAlign = "center";
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
    audioBlip.play();
    
    CreateNewCars();

    if(CheckIfPlayerCollidesWithOtherCars())
    {
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
    topctx.drawImage(PlayerCarImage, player.Xposition, player.Yposition, player.Xsize, player.Ysize);
    if (isNotPaused)
    {
      streetctx.globalAlpha = 0.17;
      streetctx.drawImage(PlayerCarShadowImage, player.Xposition - player.Xposition/35, player.Yposition + player.Yposition/8, player.Xsize * 1.12, player.Ysize - player.Ysize/2);
      streetctx.globalAlpha = 1;
    }
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
function DrawSpeedIncreaseMessage()
{
  if (messageTimer != 0 && messageTimer%600 > 300)
  {
    var SIimageWidth = screenwidthHalf;
    topctx.drawImage(SpeedIncreaseImage, screenwidthHalf - SIimageWidth/2, ScreenHeight/2 - ScreenHeight/7, SIimageWidth, SIimageWidth * 0.076);
    
    // Try to create the red and blue effect with text only. Possible, but not as good looking. Can't make only intersecting colors turn black...
    // topctx.textAlign = "center";
    // topctx.font = touchMessageFontSize + "px CarStormFont1";
    // // topctx.globalAlpha = 0.5;
    // topctx.fillStyle = "rgba(236,72,50,0.7)";
    // topctx.fillText("SPEED INCREASE", screenwidthHalf - carWidth/4.5, ScreenHeight/2 - ScreenHeight/7);
    // topctx.fillStyle = "rgba(0,154,255,0.7)";
    // topctx.fillText("SPEED INCREASE", screenwidthHalf + carWidth/4.5, ScreenHeight/2 - ScreenHeight/7);
    // // topctx.globalAlpha = 1;
    // topctx.fillStyle = "black";
    // topctx.fillText("SPEED INCREASE", screenwidthHalf, ScreenHeight/2 - ScreenHeight/7);
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
  
  // r = min + Math.floor(Math.random() * max);
  // g = b = r; // We want just grayscales.
  
  // Copy the center rectangle, margins 10 px in from screen border. (meaning the copied picture is 20 px smaller on each side than original)
  var imgData = ctx.getImageData(0, 0, ScreenWidth, ScreenHeight);
  
  // Would be nice to be able to just use imgData directly with drawImage(), but it looks like we have to do it this way. 
  hiddenCtx.putImageData(imgData, 0, 0);
  
  ctx.save();
  {
    var speed = 0.0106 * gamespeed;//0.01;  // Zoom-in speed.
    var xSide = ScreenWidth * speed;
    var ySide = ScreenHeight * speed;
    
    // Rotating the storm eliminates the 8 artifact rays coming from the zoom in.
    // However, the lights and car shadows will rotate too... So we need ANOTHER canvas AND another hidden canvas (I assume) to let those scale normally.
    ctx.translate(screenwidthHalf, ScreenHeight / 2);
    ctx.rotate(stormRotationDegrees * Math.PI / 180);
    ctx.translate(-screenwidthHalf, -ScreenHeight / 2);
    
    // Stretch out the copied (smaller) image over the entire canvas.
    // Note! We are drawing the _canvas_ object, not its 2d context. 
    ctx.drawImage(hiddenCanvas, xSide, ySide, ScreenWidth - xSide * 2, ScreenHeight - ySide * 2, 0, 0, ScreenWidth, ScreenHeight);
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
  // Copy the entire ctx image.
  var imgData = streetctx.getImageData(0, 0, ScreenWidth, ScreenHeight);
  
  // Draw it here meanwhile.
  hiddenCtx.putImageData(imgData, 0, 0);
  
  // Empty! We don't want any smearing, just the zooming.
  streetctx.clearRect(0,0,ScreenWidth,ScreenHeight);
  
  streetctx.save();
  {
    var speed = 0.0106 * gamespeed;//0.01;  // Zoom-in speed.
    var xSide = ScreenWidth * speed;
    var ySide = ScreenHeight * speed;
      
    // Copy a somewhat smaller rectangle from the center of the image,
    // draw it stretched to fill the entire ctx.
    // (This is all the zoom-magic)
    // Note! We are drawing the _canvas_ object, not its 2d context. 
    streetctx.drawImage(
      hiddenCanvas, 
      xSide, ySide, ScreenWidth - xSide * 2, ScreenHeight - ySide * 2, 
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
  for(var i=0; i<AllButtons.length; i++)
  {
    AllButtons[i].Resize(ScreenWidth, ScreenHeight);
  }  
}
function ButtonsOnTouchStart(x,y)
{
  for(var i=0; i<AllButtons.length; i++)
  {
    AllButtons[i].OnTouchStart(x,y);
  }
}
function ButtonsOnTouchEnd(x,y)
{
  for(var i=0; i<AllButtons.length; i++)
  {
    AllButtons[i].OnTouchEnd(x,y);
  }
}

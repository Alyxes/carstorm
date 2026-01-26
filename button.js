"use strict";

// Den skapar ett knapp-objekt som returneras.
// var button = CreateButton(...massor);
// 
// Här e alla funktioner:
// button.Draw(ctx);
// button.OnTouchStart(x,y);
// button.OnTouchEnd(x,y);
// button.Resize(screenWidth, screenHeight);
// 
// OBS, alla knappars OnTouchStart måste anropas, så får var o en avgöra om det är just de som blivit gnuggade på.
// Samma, alla knappars OnTouchEnd måste anropas när fingret lyfter igen eller nåt cancel event händer. (minimize, etc, var noggrann!)

// Tanken med knappens alla selected-variablerna är att knappen ska växa och ändra färg när man pekar på den. (men det kan vi vänta med)
//  <-Då behövs en animationLength och lite arbetsvariabler för det också, såvida den inte bara ska poppa upp till selected-size direkt.
// Min idé är att settings-skärmen har tre knappar som den ritar ut i loopen, och som ett touch event checkar mot.
//  Startskärmen har bara en knapp, settings, övrig yta startar spelet.
//  ..Vi ska _inte_ använda knappar i spelet, de ska ju inte synas.

const buttonDoLogs = false;

if (buttonDoLogs) 
  var Log = console.log;
else 
  var Log = function(){};

// A row is a horizontal set of buttons. (A column is a vague future idea that don't exist)
function AddButtonToRow(button, row, distance)
{
  if(row.length > 0)
  {
    // Put the new button after the last one. Also set it at the same height and make it the same height.
    var lastBtn = row[row.length-1];
    var x = lastBtn.x + lastBtn.w + distance;
    
    button.x = x;
    button.y = lastBtn.y;
    button.h = lastBtn.h;
    
    button.Resize(button.screenWidth, button.screenHeight);
  }
  else
  {
    // This is the first button in the row. We keep its x position.
  }
  
  row.push(button);
}
function ResizeRow(row, distance, screenWidth, screenHeight)
{
  if(row.length > 0)
  {
    var firstBtn = row[0];
    firstBtn.Resize(screenWidth, screenHeight);

    var x = firstBtn.x + firstBtn.w + distance;
    
    for(var i=1;i<row.length;i++)
    {
      var button = row[i];
      button.Resize(screenWidth, screenHeight);

      button.x = x;
      button.y = firstBtn.y;
      button.h = firstBtn.h;
      
      x += button.w + distance;
    }
  }
}

function CreateButton(
  x, y, w, h, 
  screenWidth, screenHeight,
  cornerRadius, fillingInset, shadowBlur, strokeStyle, 
  fillStyle, shadowColor, imageArray, selectedImage, selectedStrokeStyle, 
  selectedShadowColor, selectedCornerRadius, selectedShadowBlur, callbackFunction,
  adaptToWidth, zoomAmount)
{
  // fyfan vad tråkigt..
  var button = {
    x:x,
    y:y,
    w:w,
    h:h,
    
    screenWidth:screenWidth,      // So it can compare "last" screen size to new when a Resize() event happens.
    screenHeight:screenHeight,
    
    cornerRadius:cornerRadius,
    fillingInset:fillingInset,
    shadowBlur:shadowBlur,
    
    strokeStyle:strokeStyle,
    fillStyle:fillStyle,
    shadowColor:shadowColor,
    selectedStrokeStyle:selectedStrokeStyle,
    selectedShadowColor:selectedShadowColor,
    selectedCornerRadius:selectedCornerRadius,
    selectedShadowBlur:selectedShadowBlur,
    imageArray:imageArray,                        // Might be several images if button can switch between several modes. (Modes like On, Off, Maybe, Why not, etc.)
    callbackFunction:callbackFunction,
    adaptToWidth:adaptToWidth,                    // If this is true, adapt height to width of button. (Otherwise adapt width to height.) (If there is an image.)
    zoomAmount:zoomAmount,                        // Amount to zoom up button when pressed, in pixels.
    
    selectedImage:selectedImage,  // selectedImage in imageArray, decided by the return value of the callbackFunction.
    buttonPressed:false,          // Kan växla fram o tillbaka när användaren flyttar fingret, mellan OnTouchStart() och OnTouchEnd().
    buttonGotTouchStart: false,   // Sätts i OnTouchStart() och rensas i OnTouchEnd().
    pressTime: 0.0,               // Sätts till Now så fort knappen pressas ner. 
    
    // Resize screen event. 
    Resize: function(screenWidth, screenHeight) {
      // Om nya vidden är större, blir xPercentage < 1. Sen dividerar jag bara x,y,w och h med procenterna!
      var xPercentage = this.screenWidth / screenWidth;
      var yPercentage = this.screenHeight / screenHeight;
      
      this.screenWidth = screenWidth;
      this.screenHeight = screenHeight;
      
      this.x /= xPercentage;
      this.w /= xPercentage;
      this.y /= yPercentage;
      this.h /= yPercentage;
      
      this.AdaptToImage();
    },
    
    AdaptToImage() {
      // If there is an image, the buttons h will depend on the given w and the height of the image, or vice versa.
      if(this.imageArray != null)
      {
        if(this.adaptToWidth)
        {
          this.h = this.w * this.imageArray[0].height / this.imageArray[0].width;
        }
        else
        {
          this.w = this.h * this.imageArray[0].width / this.imageArray[0].height;
        }
      }
    },
    
    OnTouchStart: function(x,y, time) {
      if(x >= this.x && x <= this.x + this.w 
        && y >= this.y && y <= this.y + this.h)
      {
        this.buttonGotTouchStart = true;
        this.buttonPressed = true;
        this.pressTime = time;
        Log("yey, someone's touching me!");
      }
    },
    
    OnTouchMove: function(x,y) {
      if(this.buttonGotTouchStart)
      {
        if(x >= this.x && x <= this.x + this.w 
          && y >= this.y && y <= this.y + this.h)
        {
          this.buttonPressed = true;
          Log("yey, still touching me!");
        }
        else
        {
          this.buttonPressed = false;
          Log("Sliding off are you?");
        }
      }
    },
    
    OnTouchEnd: function(time) {
      // Somewhat logical, when a touch end happens, there are no coordinates. So OnTouchMove() has kept track of last finger position up until this event happened.
      if(this.buttonPressed)
      {
        // OnTouchMove() kept track of the finger movement until the last moment where it was removed. 
        Log("yey, a full click happened! Calling callbackFunction().");
        this.selectedImage = this.callbackFunction();
        
        var minTimeToShow = 150;
        if(this.pressTime + minTimeToShow > time)
        {
          Log("Starting a timer for the poor button. Time left to show it: " + ((this.pressTime + minTimeToShow) - time));
          
          // Quickly pressing the button might render it pressed less than one frame, appear like it was not pressed. 
          // Start a timer for the remaining time.
          setTimeout(() => {
            Log("Releasing button after a while.");
            this.buttonPressed = false;
          }, (this.pressTime + minTimeToShow) - time);
        }
        else
        {
          this.buttonPressed = false;
        }
      }
      else
      {
        // User slided finger outside of button in OnTouchMove(), or, this button has never been touched. 
        this.buttonPressed = false;
      }
      
      this.buttonGotTouchStart = false;
    },

    Draw: function(ctx) {
      // bevel, round, miter. Bevel får mig att tänka på tintin. :)
      ctx.lineJoin = "round";   
      
      var cornerRadius = this.cornerRadius;
      
      var x = this.x;
      var y = this.y;
      var w = this.w;
      var h = this.h;
    
      if(this.buttonPressed)
      {
        ctx.strokeStyle = this.selectedStrokeStyle;
        ctx.lineWidth = this.selectedCornerRadius;
        ctx.shadowColor = this.selectedShadowColor;
        ctx.shadowBlur = this.selectedShadowBlur;
        
        cornerRadius = this.selectedCornerRadius;
        
        // Zoom up the button when it is pressed.
        if(this.imageArray != null)
        {
          // The zoom must be a percentage of the width or height to keep the image dimensions.
          if(this.adaptToWidth)
          {
            var percentage = this.imageArray[0].height / this.imageArray[0].width;
            x -= this.zoomAmount;
            y -= this.zoomAmount * percentage;
            w += this.zoomAmount * 2;
            h += this.zoomAmount * 2 * percentage;        
          }
          else
          {
            var percentage = this.imageArray[0].width / this.imageArray[0].height;
            x -= this.zoomAmount * percentage;
            y -= this.zoomAmount;
            w += this.zoomAmount * 2 * percentage;
            h += this.zoomAmount * 2;        
          }
        }
        else
        {
          x -= this.zoomAmount;
          y -= this.zoomAmount;
          w += this.zoomAmount * 2;
          h += this.zoomAmount * 2;        
        }
        
      }
      else
      {
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.cornerRadius;

        // The shadow goes for both filling and stroking...
        ctx.shadowColor = this.shadowColor;
        ctx.shadowBlur = this.shadowBlur;
      }
    
      if(this.shadowBlur > 0)
      {
        // Draw a "background" rectangle so the shadow properly gets drawn around it.
        ctx.fillStyle = "black";
        ctx.fillRect(
          x+(cornerRadius/2), y+(cornerRadius/2), 
          w-cornerRadius, h-cornerRadius);
      }
      
      // Det finns faktiskt inga knappar utan bild i vårt spel, så man kan inte heller ändra bakgrundsfärg för en nertryckt knapp.
      ctx.fillStyle = this.fillStyle;
      
      // Remove blur as the lines would create a shadow around themselfes, going ugly.
      ctx.shadowBlur = 0;

      // Change origin and dimensions to match true size (a stroke is drawn centered around the position given, so move it in a bit.)
      /*ctx.strokeRect(
        this.x+(this.cornerRadius/2), this.y+(this.cornerRadius/2), 
        this.w-this.cornerRadius, this.h-this.cornerRadius);*/

      if(this.cornerRadius > 0)
      {
        // Ändarna på linjer så heter det lineCap, lineJoin är jointen mellan två linjer.
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x+(this.cornerRadius/2), y+(this.cornerRadius/2)+h-this.cornerRadius);
        ctx.lineTo(x+(this.cornerRadius/2), y+(this.cornerRadius/2));
        ctx.lineTo(x+(this.cornerRadius/2)+w-this.cornerRadius, y+(this.cornerRadius/2));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x+(this.cornerRadius/2)+w-this.cornerRadius, y+(this.cornerRadius/2));
        ctx.lineTo(x+(this.cornerRadius/2)+w-this.cornerRadius, y+(this.cornerRadius/2)+h-this.cornerRadius);
        ctx.lineTo(x+(this.cornerRadius/2), y+(this.cornerRadius/2)+h-this.cornerRadius);
        ctx.stroke();
        
        // The filling should be _inside_ the stroked outline, so move it down a bit and a bit smaller. 
        // ..Fast nu tyckte jag det blev snyggare om den gick över en bit. 
        ctx.fillRect(
          x+(this.fillingInset), y+(this.fillingInset), 
          w-this.fillingInset * 2, h-this.fillingInset * 2);
      }

      if(this.imageArray != null)
      {
        // The image should have the size of the filling rectangle.
        ctx.drawImage(
          this.imageArray[this.selectedImage], 
          x+(this.fillingInset), y+(this.fillingInset), 
          w-this.fillingInset * 2, h-this.fillingInset * 2);
      }
    },
  };
  
  // Call once to get the math done.
  button.Resize(screenWidth, screenHeight);
  
  return button;
}

// Always at the end of the file. See index.html.
if (typeof IncreaseReadyCount !== 'undefined')
{
  IncreaseReadyCount();
}
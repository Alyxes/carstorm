<!DOCTYPE html>
<?php
require_once __DIR__."/../private/handlers.php";
require_once __DIR__."/../private/admin_handlers.php";

// Set it to true here since it should be false by default. :-)
DBSettings::$debug = true;

$remoteAddr = HandlerHelper::FetchString($_SERVER, 'REMOTE_ADDR');

$ah = new AdminHandler();
$countryCode = $ah->GetCountryCodeForIP($remoteAddr);

$arr = array("Debug stuff!");
HandlerHelper::AppendDebug($arr);
$json = json_encode($arr);

// Måste alltid koppla ner från databasen sist.
MySqlConnection::Disconnect();
?>
<html>
  <head>
    <title>Carstorm stats!</title>
    <meta charset="utf-8" />

    <link rel="stylesheet" href="zurb/css/foundation.min.css">
    <link rel="stylesheet" href="zurb/css/app.css">
    <script src="zurb/js/vendor/jquery.js"></script>
  </head>
  <style>
    html, body
    {
      background-color: #005500;
    }
    @font-face
    {
      font-family: 'CarStormFont1';
      src: url('fonts/SkitserSwift.ttf');
      
    }
    @font-face
    {
      font-family: 'CarStormFont2';
      src: url('fonts/Snowstorm.ttf');
    }
    @font-face
    {
      font-family: 'CarStormFont3';
      src: url('fonts/Again.ttf');
    }
    
    /* Minimal table styling here */
    .header{
      cursor: pointer;
      color: white;
      margin-bottom: 1px;
    }
    .header .cell{
      margin-right: 1px;
      padding: 5px;
      background-color: #8fd0bf;
    }
    .sortable-row.header .selected{
      background-color:red;
    }
    .sortable-row.header .selected.asc{
      background-color:blue;
    }
    
    .body{
      margin-bottom: 1px;
    }
    .body .cell{
      margin-right: 1px;
      padding: 5px;
      background-color: #dff0df;
    }
    .body .cell.auto.http_user_agent{
      overflow: auto;
    }
    .cell.auto.http_user_agent{
      flex: unset;
      width: 600px;
      font-size: 12px;
    }
    .fancy-container{
      margin: 50px;
    }
    #LotsOfRows
    {
      margin-top: 100px;
    }
  </style>
<body>
  <div class="fancy-container">
    <p class="button large" id="RowCount">Your ip: <?= $remoteAddr ?></p>
    <p class="button large" id="RowCount">Your country code: <?= $countryCode ?></p>
  </div>
  
  <div>
    <?php
      echo $json;
    ?>
  </div>
  
<script>

</script>
  
  <?php // De här vill vara sist i filen. ?>
  <script src="zurb/js/vendor/what-input.js"></script>
  <script src="zurb/js/vendor/foundation.min.js"></script>
  <script src="zurb/js/app.js"></script>  
</body>
</html>
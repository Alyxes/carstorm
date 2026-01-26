<?php
require_once "private/handlers.php";

// Good to know: error_log -file in server root contains the php errors when you make an error not happening on localhost but happening on the server. 

// Increase version when server expect the given data to have a new format.
$serverVersion = 4;

//TEST: Funkar! FetchOnlineStats() (carstorm.js) laddar om sidan ett par gånger tills den ger upp. Har dubbelkollat med appen, funkar likaslurt.
// $serverVersion = $serverVersion + 1;

// Increase version when we want the game/localhost to download a new set of the game's files.
$serverHasGameVersion = 4;

// FetchString() is friendly and returns empty string if there is no value given from the user.
// intval() is friendly too, and returns 0 on empty string.
$remoteAddr = HandlerHelper::FetchString($_SERVER, 'REMOTE_ADDR');
$httpUserAgent = HandlerHelper::FetchString($_SERVER, 'HTTP_USER_AGENT');
$gameVersion = intval(HandlerHelper::FetchString($_GET, 'game_version'));
$winCount = intval(HandlerHelper::FetchString($_GET, 'win_count'));
$highScore = intval(HandlerHelper::FetchString($_GET, 'high_score'));
$playCount = intval(HandlerHelper::FetchString($_GET, 'play_count'));
$reloadCount = intval(HandlerHelper::FetchString($_GET, 'reload_count'));

// From serverVersion 3 the random_id is expected.
$randomId = HandlerHelper::FetchString($_GET, 'random_id');

// From serverVersion 4 the game_version_to_download is expected.
$gameVersionToDownload = intval(HandlerHelper::FetchString($_GET, 'game_version_to_download'));

$ush = new UserStatsHandler();

//HandlerHelper::Debug($_SERVER['QUERY_STRING']);
//HandlerHelper::Debug($_REQUEST);
//HandlerHelper::Debug($_GET);
//HandlerHelper::Debug($_POST);

$playersNow = $ush->CountOnlineUsers();

// Lie if zero! It should always be someone playing the game! Magic number: 12.
if($playersNow == 0)
{
  $playersNow = 11;
  
  // Superlie sometimes.
  if(rand(0,5) == 0)
  {
    $playersNow = rand(0,100);
  }
}

$id = $ush->AddUserStats(
        $serverVersion, 
        $gameVersion, 
        $winCount, 
        $highScore, 
        $playCount, 
        $reloadCount, 
        $remoteAddr, 
        $httpUserAgent,
        $randomId);

$arr = array(
  'server_version' => $serverVersion,
  'server_has_game_version' => $serverHasGameVersion,
  'players_now' => $playersNow + 1 // Including yourself. 
  );

// Purge could be done after result is echoed, but as we want the Debug() to be added to the result right now we keep this here.
// Don't purge on every call, just every now and then, when the sun shines.

if(rand(0,30) == 0)
{
  $ush->PurgeOld();
}

// In release mode the debug is only written to the log files on the server, not returned to user. (DBSettings::$debugLogOnly is true while DBSettings::$debug is false.)
HandlerHelper::AppendDebug($arr);

echo json_encode($arr);

// TODO: If slow, here is a good place to release the user and continue script execution.
// https://stackoverflow.com/questions/15273570/how-can-i-continue-processing-php-after-sending-a-response

// TODO: Purge call should be here.

// Måste alltid koppla ner från databasen sist.
MySqlConnection::Disconnect();
?>

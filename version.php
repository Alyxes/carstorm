<?php
require "private/handlers.php";

// Good to know: error_log -file in server root contains the php errors when you make an error not happening on localhost but happening on the server. 

// Increase version when server expect the given data to have a new format.
$serverVersion = 1;

$remoteAddr = HandlerHelper::FetchString($_SERVER, 'REMOTE_ADDR');
$httpUserAgent = HandlerHelper::FetchString($_SERVER, 'HTTP_USER_AGENT');
$gameVersion = intval(HandlerHelper::FetchString($_GET, 'game_version'));
$winCount = intval(HandlerHelper::FetchString($_GET, 'win_count'));
$highScore = intval(HandlerHelper::FetchString($_GET, 'high_score'));
$playCount = intval(HandlerHelper::FetchString($_GET, 'play_count'));

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

$id = $ush->AddUserStats($serverVersion, $gameVersion, $winCount, $highScore, $playCount, $remoteAddr, $httpUserAgent);

$arr = array(
  'server_version' => $serverVersion, 
  'players_now' => $playersNow + 1 // Including yourself. 
  );

// Purge could be done after result is echoed, but as we want the Debug() to be added to the result right now we keep this here.
// Don't purge on every call, just every now and then, when the sun shines.
if(rand(0,30) == 0)
{
  $ush->PurgeOld();
}

// NOTE: Should not be here on sharp server after release!
HandlerHelper::AppendDebug($arr);

echo json_encode($arr);

// TODO: If slow, here is a good place to release the user and continue script execution.
// https://stackoverflow.com/questions/15273570/how-can-i-continue-processing-php-after-sending-a-response

// TODO: Purge call should be here.

// Måste alltid koppla ner från databasen sist.
MySqlConnection::Disconnect();
?>

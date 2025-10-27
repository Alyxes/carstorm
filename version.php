<?php
// TODO: url params should be extracted. Should contain:
// game version, win count, max score, play count. More?

// Increase version when server expect the given data to have a new format.
$serverVersion = 1;

$REMOTE_ADDR = 'none';
if(isset($_SERVER['REMOTE_ADDR']))
{
  $REMOTE_ADDR = $_SERVER['REMOTE_ADDR'];
}

$HTTP_USER_AGENT = 'none';
if(isset($_SERVER['HTTP_USER_AGENT']))
{
  $HTTP_USER_AGENT = $_SERVER['HTTP_USER_AGENT'];
}

$connection = ConnectToDatabase();
$playersNow = 0;

if($connection != null)
{
  $playersNow = CountOnlineUsers($connection);
}

// Lie if zero! It should always be someone playing the game! Magic number: 12.
if($playersNow == 0)
{
  $playersNow = 11;
  
  // Superlie sometimes.
  if(rand(0,10) == 0)
  {
    $playersNow = rand(0,100);
  }
}

$arr = array(
  'version' => $serverVersion, 
  'players_now' => $playersNow + 1, // Including yourself. 
  
  // Remove later.
  'your_ip' => $REMOTE_ADDR,
  'user_agent' => $HTTP_USER_AGENT);

echo json_encode($arr);

// TODO: If slow, here is a good place to release the user and continue script execution.
// https://stackoverflow.com/questions/15273570/how-can-i-continue-processing-php-after-sending-a-response

die;

if($connection != null)
{
  // Since we have no idea when this script has run last time, lets purge by random.
  if(rand(0,30) == 0)
  {
    PurgeOld($connection);
  }

  StoreUserStats($connection, $REMOTE_ADDR, $HTTP_USER_AGENT);

  $connection->close();
}

// End of script here, rest is functions.

function StoreUserStats($connection, $remoteAddr, $userAgent)
{
  $now = time();

  // TODO: Just update 'created' if row already exist, otherwise insert new row.
  if ($connection->query($sql) === TRUE) 
  {
    // "New record created successfully";
  } 
  else 
  {
    // "Error: " . $sql . "<br>" . $connection->error;
  }  
}

function CountOnlineUsers($connection)
{
  $anHourAgo = time() - 3600;
  
  // TODO: Count rows with created newer than an hour.
  $query = "select count(REMOTE_ADDR) as onlineCount from user_stats;";
  
  $count = 0;
  $result = $connection->query($sql);
  
  // TODO: Det finns lixom inte.. Queryn ger rätt, 0 i db, men inte här..
  echo "hej".$result->num_rows;
  
  if($result->num_rows > 0) 
  {
    while($row = $result->fetch_assoc()) 
    {
      $count = $row["onlineCount"];
    }
  }
    
  return $count;
}

function PurgeOld($connection)
{
  $the_past = time() - 3600 * 24 * 7; // A week ago.
    
  // TODO: Erase query here.
  //$conditions = array('user_stats.created <' => date( 'Y-m-d H:i:s', $the_past));
  //$this->deleteAll($conditions, false);
  
  if ($connection->query($sql) === TRUE) 
  {
    // "New record created successfully";
  } 
  else 
  {
    // "Error: " . $sql . "<br>" . $connection->error;
  }  
}

function ConnectToDatabase()
{
  if (!function_exists('mysqli_init') && !extension_loaded('mysqli'))
  {
    //echo "No mysql, running local?";
    return null;
  }
  
  // TODO: Ska väl inte ligga rakt upp o ner här, lösenordet?
  
  $servername = "localhost";
  $username = "madskull_carstorm";
  $password = "Raggelkrok_carstorm_mjonk";
  $dbname = "madskull_carstorm";

  // Create connection
  $conn = new mysqli($servername, $username, $password, $dbname);

  // Check connection
  if ($conn->connect_error) 
  {
    //die("Connection failed: " . $conn->connect_error);
    return null;
  }
  
  return $conn;
}

/*
Database is named madskull_carstorm.

REMOTE_ADDR - Should be the visitor's ip address.

CREATE TABLE `user_stats` (
  `REMOTE_ADDR` VARCHAR(16) NOT NULL COLLATE 'utf8_unicode_ci',
  `HTTP_USER_AGENT` VARCHAR(128) NULL COLLATE 'utf8_unicode_ci',
	`created` DATETIME NOT NULL,
	PRIMARY KEY (`REMOTE_ADDR`)
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

*/
?>

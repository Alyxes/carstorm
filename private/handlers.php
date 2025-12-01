<?php
require_once __DIR__.'/MySqlConnection.php';

// Saker som gör att man bara hatar php: 
//  1. include säger inte till om filjävelen inte finns.. (Så använd require, då får man error 500 i varje fall)
//  2. Var? VAR ÄR VI? Jo, i __DIR__, men vem fan i helvete kunde veta det? 
// 
// require __DIR__.'/../some/darn/path/tofile.php';
//  3. require __DIR__'/MySqlConnection.php';
//     INTE
//     require 'MySqlConnection.php';
//     ÄVEN OM FILEN LIGGER I SAMMA KATALOG. Jag tror orsaken är att den "startande" filen är
//     version.php i roten, och då tycker require helt jätte-intelligent att det är där vi är,
//     oavsett vilken fil vi sen är i.
//     Litet tillägg: __DIR__ ger _denna_ filens dir, på det viset kan man inkludera de filer som 
//     ligger på samma nivå, och relativt till var denna ligger.

// Used by the other classes to write debug into json-array, and various safe-checks.
class HandlerHelper
{
  // During execution, any errors or interesting stuff gets added to this array. 
  // Call AppendDebug() to append this as a 'debug' entry to the given array,
  // which is supposed to be json_encode()d and returned to calle.
  protected static $debugArray = array();
  
  // Add $val to $debugArray if debug-mode is on.
  public static function Debug($val)
  {
    if(DBSettings::$debug == true || DBSettings::$debugLogOnly == true)
    {
      // Lägger till $val i listan med fel.
      HandlerHelper::$debugArray[] = $val;
    }
  }
  
  /* De flesta php-callbacks (register, upload, add_highscore, etc.) ska anropa denna, och skicka med sin resultat-array.
   * Sedan ska de json_encode()a hela arrayen. 
   * 
   * Ändrar inte $arr ifall debug-läget är avstängt eller ifall HandlerHelper::$debugArray är tom.
   * 
   * DBSettings::$debugLogOnly är normalt påslaget och spar alltså ner på fil ifall nåt finns
   * att spara.
   */
  public static function AppendDebug(&$arr)
  {
    if(count(HandlerHelper::$debugArray) > 0)
    {
      if(DBSettings::$debug == true)
      {
        $arr = array_merge($arr, array('debug' => HandlerHelper::$debugArray));
      }
      
      if(DBSettings::$debugLogOnly == true)
      {
        $temp = array_merge($arr, array('debug' => HandlerHelper::$debugArray));
        HandlerHelper::WriteToDebugLog($temp);
      }
    }
  }
  
  public static function WriteToDebugLog($debugLog)
  {
    //Write action to txt log
    $log  = "User: ".$_SERVER['REMOTE_ADDR'].' - '.date("F j, Y, g:i a").PHP_EOL.
            "Attempt: ".(print_r($debugLog, true)).PHP_EOL.
            "-------------------------".PHP_EOL;
    // Creates a new file every hour, and append each entry to it.
    // Format: j = 1-31 days, n = 1-12 month, Y = 2025, H = 00-23 hour
    //  log_3.11.2025_19.00.txt
    file_put_contents(__DIR__.'/../logs/log_'.date("j.n.Y_H.00").'.txt', $log, FILE_APPEND);
  }
    
  public static function StringIsSafe($str)
  {
    if(HandlerHelper::StringIsMySqlSafe($str) == false || HandlerHelper::StringIsHtmlSafe($str) == false)
    {
      return false;
    }
    
    return true;
  }
  
  /* Ret. true ifall strängen inte innehåller skumma otillåtna tecken för mysql.
   */
  public static function StringIsMySqlSafe($str)
  {
    $safe = str_replace('\'', '', $str);
    $safe = str_replace('"', '', $safe);
		$safe = str_replace('%', '', $safe);		
		$safe = str_replace('_', '', $safe);		
    
    if($safe != $str)
    {
      return false;
    }
    return true;
  }
  
  /* Ret. true ifall strängen inte innehåller dödliga tecken för html.
   */
  public static function StringIsHtmlSafe($str)
  {
    $safe = str_replace('<', '', $str);
    $safe = str_replace('>', '', $str);
    $safe = str_replace('&', '', $str);

    if($safe != $str)
    {
      return false;
    }
    return true;
  }
  
  /* Ret. true ifall strängen, arrayen, eller vad det nu är, inte innehåller skumma otillåtna tecken för mysql.
   */
  public static function ValueIsMySqlSafe($val)
  {
	  //echo " ".$val." ";
    if($val === null)
    {
      return false; // Nope. Användaren får inte skicka null, utan texten "null", eller "NULL" för tydlighets skull. 
    }
    else if(is_string($val))
    {
      return HandlerHelper::StringIsMySqlSafe($val);
    }
    else if(is_array($val))
    {
      foreach($val as $v)
      {
        if(!HandlerHelper::ValueIsMySqlSafe($v))
        {
          return false;
        }
      }
    }
    else
    {
      // Om det inte är en sträng, och inte en array, så är det någon typ av tal, och då är den säker att stuffla in i mysql.
    }
    
    return true;
  }
  
  /* Ret. true ifall strängen inte innehåller dödliga eller potentiellt farliga tecken för lösenord.
   */
  public static function PasswordIsSafe($password)
  {
    if(HandlerHelper::StringIsMySqlSafe($password) == false)
    {
      return false;
    }
    
    // Escaping med \ är alltid dåligt.
    $safe = str_replace('\\', '', $password);
    
    if($safe != $password)
    {
      return false;
    }
    
    return true;
  }

  /* Ret. true ifall användarnamnet uppfyller våra minimikrav.
   */
  public static function UserNameMeetMinReq($userName)
  {
    if($userName == null || mb_strlen($userName) < 5)
    {
      return false;
    }

    if(HandlerHelper::StringIsMySqlSafe($userName) == false)
    {
      return false;
    }
    
    return true;
  }
  
  /* Ret. true ifall emailet uppfyller våra minimikrav.
   */
  public static function EmailMeetMinReq($email)
  {
    // Den här fungerar, men är gammal och släpper inte igenom vissa email som faktiskt är ok.
    // filter_var($email, FILTER_VALIDATE_EMAIL);
    
    if($email == null || mb_strlen($email) < 5) // a@b.c är väl minsta möjliga, så minst fem tecken.
    {
      return false;
    }
    
    if(HandlerHelper::StringIsMySqlSafe($email) == false)
    {
      return false;
    }
    
    // Det här kanske borde hamna i konstruktorn redan..
    mb_regex_encoding('UTF-8');
    mb_internal_encoding("UTF-8"); 
    
    if(mb_strpos($email, '@') < 1) // om @ inte finns ret. false, vilket är mindre än ett. Annars, @ kan inte komma först, dvs. pos 0, utan minst pos 1.
    {
      return false;
    }
    if(mb_strpos($email, '.') < 1) // samma för punkter. En email får inte starta med en punkt.
    {
      return false;
    }
    
    $parts = mb_split('@', $email);
    if(count($parts) != 2) // Det FINNS regler som säger att "kalle@banan"@idiot.com är ok, men det skiter jag i!!
    {
      return false;
    }
    $localPart = $parts[0];
    $domainPart = $parts[1];
    
    if(mb_strlen($localPart) > 64) // Första delen får inte vara mer än 64 tecken. 
    {
      return false;
    }
    
    if(mb_strpos($domainPart, '-') === 0) // Får inte starta med -.
    {
      return false;
    }
    if(mb_strpos($domainPart, '.') < 1) // Skall innehålla minst en punkt, och inte först.
    {
      return false;
    }
    
    // Vi skiter i _vilka_ tecken de har i emailen, även om det finns regler för det med. Bara de inte kan krascha vår server så är vi glada.
    
    return true;
  }
  
  /* Ret. true ifall lösenordet uppfyller våra minimikrav.
   */
  public static function PasswordMeetMinReq($password)
  {
    if($password == null || mb_strlen($password) < 5)
    {
      return false;
    }
   
    if(HandlerHelper::StringIsMySqlSafe($password) == false)
    {
      return false;
    }
   
    // Vi kan ev. lägga till regler för att minst en siffra o minst en stor bokstav krävs här..
    
    return true;
  }
  
  // Fetches the $arr[$name] if it exists, or returns empty string if not present.
  public static function FetchString($arr, $name)
  {
    if(isset($arr[$name]))
    {
      return $arr[$name];
    }
    
    return "";
  }
}

class UserStatsHandler
{
  public function __construct()
  {
    MySqlConnection::Connect();
  }
  
  public function AddUserStats($serverVersion, $gameVersion, $winCount, $highScore, $playCount, $reloadCount, $remoteAddr, $httpUserAgent)
  {
    if(HandlerHelper::ValueIsMySqlSafe(array(
        $serverVersion, $gameVersion, $winCount, $highScore, $playCount, $reloadCount)) == false)
    {
      // Någon av parametrarna är skumliga, abort!!
      return -1;
    }
    
    // $remoteAddr är kontrollerad av apache, så innehåller endast säkra värden.
    // $httpUserAgent däremot är sänt från klienten, så en hacker kan trolla den. Måste vi kontrollera.
    
    // Maxlängden.
    $remoteAddr = substr($remoteAddr, 0, 46);
    $httpUserAgent = substr($httpUserAgent, 0, 256);
    
    // $httpUserAgent kan ha detta format, men standard verkar saknas: (Kort sagt, ej pålitliga värden! https://en.wikipedia.org/wiki/User-Agent_header)
    // Mozilla/[version] ([system and browser information]) [platform] ([platform details]) [extensions]
    // Exempelvis:
    // Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405
    // <-Så jag klipper inte upp och försöker göra nåt vettigt av det, för vem bryr sig? 
    // 
    $httpUserAgent = MySqlConnection::MakeStringMySqlSafe($httpUserAgent);
    
    $now = date("Y-m-d H:i:s");
    
    // Yikes. Håll reda på ordningen. Håll reda på var du sätter fnuttar, alltså '. Testa noga. 
    $query = "insert into user_stats (server_version, game_version, win_count, high_score, play_count, reload_count, remote_addr, http_user_agent, created)".
             " values (".$serverVersion.",".$gameVersion.",".$winCount.",".$highScore.",".$playCount.",".$reloadCount.",'".$remoteAddr."','".$httpUserAgent."','".$now."');";
    HandlerHelper::Debug($query);

    $rowId = MySqlConnection::Insert($query);

    return $rowId;
  }
  
  public function CountOnlineUsers()
  {
    $anHourAgo = date("Y-m-d H:i:s", time() - 3600);
        
    $query = "SELECT COUNT(*) AS HappyCount FROM user_stats AS US WHERE US.created > '".$anHourAgo."';";
    
    $res = MySqlConnection::Select($query);
    $row = $res->fetch_object();
    HandlerHelper::Debug($query);
    HandlerHelper::Debug($row);
    
    return $row->HappyCount;
  }
  
  public function PurgeOld()
  {
    // Purge rows older than a week.
    $thePast = date("Y-m-d H:i:s", time() - 3600 * 24 * 7); // A week ago.
    
    $query = "DELETE FROM user_stats AS US WHERE US.created < '".$thePast."';";
    
    // Test to delete a specific row.
    //$query = "DELETE FROM user_stats AS US WHERE US.created < '2025-11-03 21:16:08';";
    
    $count = MySqlConnection::DeleteFrom($query);
    
    HandlerHelper::Debug("Purge count: ".$count);    
  }
}


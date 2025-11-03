<?php
include "settings.php";

// Keeps the connection static, so we can performe queries easily: MySqlConnection::Select($query) 
class MySqlConnection
{
	protected static $mysqli;
	protected static $result;
	
	public static function Connect()
	{
    $host = DBSettings::$servername;
    $login = DBSettings::$username;
    $pass = DBSettings::$password;
    $database = DBSettings::$database;
    $encoding = DBSettings::$encoding;
    
    // Bara en liten check för localhost, ibland glömmer man ju det. :)
    if (!extension_loaded('mysqli'))
    {
      exit("No mysql, running local?");
    }
  
    // Skapar en ny koppling, eller så ger php oss referens till existerande koppling, om anslutningsdetaljerna är desamma.
    self::$mysqli = mysqli_connect($host, $login, $pass, $database);
    
		if (mysqli_connect_errno()) 
		{
			exit("Failed to connect to MySQL: ".mysqli_connect_error());
		}
    
    if(!self::$mysqli->set_charset($encoding))
    {
      exit("Failed to set_charset() on MySQL connection! encoding: ".$encoding);
    }
  }
		
  public static function FreeResult()
  {
		if(self::$result != null)
			self::$result->free();   

    self::$result = null;
  }
  
	public static function Disconnect()
	{
		if(self::$result != null)
			self::$result->free();
			
		mysqli_close(self::$mysqli);
	}
	
	public static function Select($query)
	{
		if(self::$result != null)
			self::$result->free();

		self::$result = self::$mysqli->query($query);
		
		if(self::$mysqli->error != "")
		{
			exit("MySQL query failed: ".self::$mysqli->error);
		}
		
		return self::$result;
	}
	
	public static function Insert($query)
	{
		self::$mysqli->query($query);

		if(self::$mysqli->error != "")
		{
			exit("MySQL insert query failed: ".self::$mysqli->error);
		}
		
		return self::$mysqli->insert_id;
	}

	public static function Update($query)
	{
		self::$mysqli->query($query);

		if(self::$mysqli->error != "")
		{
			exit("MySQL update query failed: ".self::$mysqli->error);
		}		
	}
	
}

<?php
class DBSettings
{
  public static $servername = "localhost";
  public static $username = "madskull_carstorm";
  public static $password = "Raggelkrok_carstorm_mjonk";
  public static $database = "madskull_carstorm";
  public static $encoding = "utf8";

  // Append 'debug' entry to any json_encode()d result array returned to calle.
  // ALWAYS: Turn off! 
  public static $debug = false;
  
  // Write errors to servers debug log in folder logs/. 
  public static $debugLogOnly = true;
}
<?php
class DBSettings
{
  public static $servername = "localhost";
  public static $username = "madskull_carstorm";
  public static $password = "Raggelkrok_carstorm_mjonk";
  public static $database = "madskull_carstorm";
  public static $encoding = "utf8";
  
  // OBS! Den här tar troligen sönder en hel massa grejer, tex. all anropande kod som förväntar sig ett json-svar! 
  public static $debug = false;
  public static $debugLogOnly = true;
}
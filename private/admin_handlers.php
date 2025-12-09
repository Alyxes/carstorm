<?php
require_once __DIR__.'/handlers.php';

class AdminHandler
{
  public function __construct()
  {
    MySqlConnection::Connect();
  }
    
  public function GetColumnNames($tableName)
  {
    $query = "SELECT `COLUMN_NAME` 
      FROM `INFORMATION_SCHEMA`.`COLUMNS` 
      WHERE `TABLE_NAME`='".$tableName."';";
      
    $res = MySqlConnection::Select($query);
    
    HandlerHelper::Debug($query);
    return $res;
  }
  
  // $where can be "nr_of_stinks=12" for example, or empty to get the full result.
  public function FetchAllUserStats($where)
  {
    $query = "SELECT *, IPC.country_code AS country_code FROM user_stats AS UST";
    
    // Left join since it is possible there is no match in the ip_to_country_atonized table.
    $query .= " LEFT JOIN ip_to_country_atonized AS IPC ON INET_ATON(UST.remote_addr) BETWEEN ip_start AND ip_to";
    
    if(strlen($where) > 0)
    {
      $query .= " WHERE ".$where;
    }
        
    $query .= ";";

    //echo $query;

    HandlerHelper::Debug($query);
    $res = MySqlConnection::Select($query);
    
    return $res;
  }
  
  public function GetCountryCodeForIP($ip)
  {
    $query = "SELECT country_code FROM ip_to_country_atonized WHERE INET_ATON('".$ip."') BETWEEN ip_start AND ip_to;";    
    $res = MySqlConnection::Select($query);
    HandlerHelper::Debug($query);
    
    $countryCode = "";
    while ($row = $res->fetch_array(MYSQLI_NUM)) 
    {
      $countryCode .= $row[0];
    }
    
    return $countryCode;
  }
}
<?php
require_once __DIR__.'/handlers.php';

class AdminHandler
{
  public function __construct()
  {
    MySqlConnection::Connect();
  }
  
  public function Yorgh()
  {
    $now = date("Y-m-d H:i:s");
    
    return $rowId;
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
    $query = "SELECT * FROM user_stats";
    
    if(strlen($where) > 0)
    {
      $query .= " WHERE ".$where;
    }
    
    $query .= ";";
    
    $res = MySqlConnection::Select($query);
    HandlerHelper::Debug($query);
    
    return $res;
  }
  
  public function CountOnlineUsers($since)
  {
    //$anHourAgo = date("Y-m-d H:i:s", time() - 3600);
        
    $query = "SELECT COUNT(*) AS HappyCount FROM user_stats AS US WHERE US.created > '".$since."';";
    
    $res = MySqlConnection::Select($query);
    $row = $res->fetch_object();
    HandlerHelper::Debug($query);
    
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
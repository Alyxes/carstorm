<!DOCTYPE html>
<?php
// https://stackoverflow.com/questions/12954578/how-to-require-php-files-relatively-at-different-directory-levels
require_once __DIR__."/../private/handlers.php";
require_once __DIR__."/../private/admin_handlers.php";

// Since it should be false by default. :-)
DBSettings::$debug = true;

$ush = new UserStatsHandler();
$playersNow = $ush->CountOnlineUsers();

$ah = new AdminHandler();
$output = $ah->GetColumnNames("user_stats");

// wtf?!
$colNames = array();

// MYSQLI_ASSOC - Columns are returned into the array having the fieldname as the array index.
// MYSQLI_NUM - Ge mig en vanlig numrerad listjävel tack.
while ($row = $output->fetch_array(MYSQLI_NUM)) 
{
    //$key = array_keys($row);
    $val = array_values($row);
    array_push($colNames, $val[0]);
    
    // With MYSQLI_ASSOC key is COLUMN_NAME, val is column name..
    //print_r($key);
    //print_r($val);
    //print_r($row); // Array([0] => 'a_row_name')
}

$allRows = array();
$output = $ah->FetchAllUserStats("");
while ($row = $output->fetch_array(MYSQLI_ASSOC)) 
{
  array_push($allRows, $row);
  //$values = $row[0];
  //print_r($values);
  //print_r($row);
}

$remoteAddr = HandlerHelper::FetchString($_SERVER, 'REMOTE_ADDR');

$arr = array("Hi there!");
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
    <p class="button large" id="RowCount">Row count: <?= count($allRows) ?></p>
    <p class="button large" id="RowCount" onclick="FilterBy('none','')">Reset filters</p>
    <div id="LotsOfRows">
      <div class="grid-x align-stretch header sortable-row">
        <?php for($i=0;$i<count($colNames);$i++) { ?>
        <div class="auto cell <?php echo $colNames[$i]; ?>">
          <div onclick="SortRowsBy('<?php echo $colNames[$i]; ?>');"><?php echo $colNames[$i]; ?></div>
        </div>
        <?php } ?>
      </div>
        <?php 
          for($r=0;$r<count($allRows);$r++) { 
        ?>
      <div class="grid-x align-stretch body sortable-row row_nbr_<?php echo $r; ?>">
        <?php
            for($i=0;$i<count($colNames);$i++) {
        ?>
        <div class="auto cell <?php echo $colNames[$i]; ?>" value="<?php echo $allRows[$r][$colNames[$i]]; ?>">
          <div onclick="FilterBy('<?php echo $colNames[$i]; ?>', '<?php echo $allRows[$r][$colNames[$i]]; ?>');"><?php echo $allRows[$r][$colNames[$i]]; ?></div>
        </div>
        <?php 
            }
        ?>
      </div>
        <?php
          } 
        ?>
    </div>
  </div>

  <p id="offline_message">Glargh!! <?php echo $remoteAddr; ?></p>
  
  <div>
    <?php
      echo $json;
      
      echo print_r($colNames, true);
    ?>
  </div>
<script>
  var colName = "none";       // Default is to not sort, put rows as they come.
  var sortDirection = "desc";  // All sorting is reversible.
  
  var filterString = "";          // The specific value you search for. 
  var filteredByColumn = "none";  // ...in this specific column. 
  
  var jqLotsOfRows = null;
  var allRows = null;
  var rowCount = 0;
  
  // Make sure to define all tables fields datatype here. Only two datatypes: String-comparison and number-comparison.
  var dataTypes = {
    id: "number",
    server_version: "number",
    game_version: "number",
    win_count: "number",
    high_score: "number",
    play_count: "number",
    reload_count: "number",
    remote_addr: "string",
    http_user_agent: "string",
    created: "string",
    random_id: "string",
  };
  $(function(){
    jqLotsOfRows = $("#LotsOfRows");
    allRows = jqLotsOfRows.children(".body");
  });
  
  function SortRowsBy(newColName)
  {
    if(colName != "none")
    {
      // Deselect old column.
      var elm = $(".sortable-row.header").find("." + colName);
          
      elm.removeClass("selected");
      elm.removeClass("asc");
      elm.removeClass("desc");
    }
    
    if(colName == newColName)
    {
      if(sortDirection == "desc")
      {
        sortDirection = "asc";
      }
      else
      {
        sortDirection = "desc";
      }
    }
    else
    {
      colName = newColName;
      sortDirection = "desc";
    }
    
    // Select new column.
    var elm = $(".sortable-row.header").find("." + colName);
    elm.addClass("selected " + sortDirection);
    
    SortRows();
  }
  function SortRows()
  {
    // We have a list of rows already. Remove them all and insert them again one by one with InsertRowSorted(row);
   
    rowCount = 0;
   
    // Fetch and detach all rows excluding the header-row.
    jqLotsOfRows.children(".body").detach();
    var children = allRows; // Using the never-changing set of all rows.
    // Small timeout for visually showing everythig goes empty before filling up the list again.
    setTimeout(function(){
      if(children.length > 0)
      {
        // Insert them again, sorted.
        children.each(function(index){
          InsertRowSorted($(this));
        });
        
        // Update the visual row count.
        var jqRowCount = $("#RowCount");
        jqRowCount[0].innerHTML = "Row count: " + rowCount;
      }
    }, 100);
  }
  function InsertRowSorted(row)
  {
    if(filterString != "")
    {
      // Make sure we use the filter-value on the right column.
      var filterFields = [];
      if(filteredByColumn == "none")
      {
        filterFields = Object.keys(dataTypes);
      }
      else
      {
        filterFields.push(filteredByColumn);
      }
      
      var fs = filterString.toLowerCase();
      
      var rowShouldBeIncluded = false;
      for(var i=0; i<filterFields.length; i++)
      {
        var attr = row.children("." + filterFields[i]).attr("value");
        //var attr = row.children(".hidden-data").attr(filterFields[i]);
        attr = attr.toLowerCase();
        
        if(attr == fs)
        //if(attr.indexOf(fs) != -1)
        {
          // Column is in the search, so include row.
          rowShouldBeIncluded = true;
          break;
        }
      }
      
      if(rowShouldBeIncluded == false)
      {
        return;
      }
    }
    
    rowCount++;
    
    if(colName == "none" || jqLotsOfRows.children().length == 0)
    {
      // No sorting mode selected, or first row inserted.
      jqLotsOfRows.append(row);
    }
    else
    {
      // Fetch bigger element and insert row before.
      var beforeThis = GetRowBiggerThan(row);
      
      if(beforeThis == null)
      {
        jqLotsOfRows.append(row);
      }
      else
      {
        row.insertBefore(beforeThis);
      }
    }
  }
  function GetRowBiggerThan(row)
  {
    // Find the element 'bigger' than row and return it.
    // This is based on which sorting-mode is currently selected.
    // If no element are 'bigger', null is returned, indicating it should be inserted last.
    
    var newVal = FetchSortingFieldValue(row);
    
    // Fetch all rows excluding the header-row.
    var children = jqLotsOfRows.children(".body");
    var beforeThis = null;
    
    children.each(function(index){
      var lVal = FetchSortingFieldValue(this);
      
      if(sortDirection == "asc")
      {
        if(newVal <= lVal)
        {
          // New row is smaller than this row, so insert before this row.
          beforeThis = this;
          return false; // Break the each()
        }
      }
      else // desc
      {
        if(newVal >= lVal)
        {
          // New row is bigger than this row, so insert before this row.
          beforeThis = this;
          return false; // Break the each()
        }
      }
    });
    
    return beforeThis;
  }
  function FetchSortingFieldValue(row)
  {
    // Returns the row's value to sort on.
    if(colName == "none")
      return 0;
    
    var val = $(row).children("." + colName).attr("value");//[0].innerHTML;
    
    if(dataTypes[colName] == "string")
    {
      return val;
    }
    else // number
    {
      return parseInt(val);
    }
  }
  /*function FilterRows()
  {
    filterString = $("#SearchField").val();
    SortRows();
  }*/
  function FilterBy(newColName, val)
  {
    filterString = val;
    filteredByColumn = newColName;
    SortRows();
  }
</script>  
  
  <?php // De här vill vara sist i filen. ?>
  <script src="zurb/js/vendor/what-input.js"></script>
  <script src="zurb/js/vendor/foundation.min.js"></script>
  <script src="zurb/js/app.js"></script>  
</body>
</html>
<?php
  require_once('../simple_html_dom.php');
  $endLocation = urlencode($_GET["eloc"]);
  $startDate = $_GET["sdate"];
  $endDate = $_GET["edate"];
  $guests = $_GET["guests"];

  $url = "https://www.airbnb.com/s";
  $qry_str = "?location={$endLocation}&checkin={$startDate}&checkout={$endDate}&guests={$guests}";
  $url = $url.$qry_str;
  $html = file_get_contents($url);

  $rooms = new simple_html_dom();
  $rooms->load($html);
  $output = array();
  $i = 0;
  foreach($rooms->find('.search_result') as $aRoom) {
    $room['id'] = $aRoom->getAttribute("data-hosting-id");
    $room['roomImg'] = $aRoom->find('img', 0)->getAttribute("data-original");
    $room['profileImg'] = $aRoom->find('img', 1)->getAttribute("data-original");
    $room['profileName'] = $aRoom->find('img', 1)->alt;
    $room['profileLink'] = "https://airbnb.com".$aRoom->find('a', 1)->href;
    $room['desc'] = trim($aRoom->find('.name', 0)->plaintext);
    $room['price'] = trim($aRoom->find('.price', 0)->plaintext);
    $room['link'] = "https://airbnb.com".$aRoom->find('.name', 0)->href;
    $room['moreinfo'] = "https://api.airbnb.com/v1/listings/{$room['id']}?key=d306zoyjsyarp7ifhu67rjxn52tv0t20";

    $var = trim($aRoom->find('.descriptor', 0)->plaintext);
    $mixed = explode("&mdash;", $var);
    $room['type'] = trim($mixed[0]);
    $room['neigh'] = trim(str_replace('>', '', $mixed[1]));

    $output[] = $room;
  }

  $str = trim(json_encode($output));
  echo $str;

?>
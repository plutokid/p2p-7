<?php
  require_once('../simple_html_dom.php');
  $endLocation = urlencode($_GET["eloc"]);
  $startDate = $_GET["sdate"];
  $endDate = $_GET["edate"];
  $guests = $_GET["guests"];
  $page = $_GET["page"];
  $min = $_GET["price_min"];
  $max = $_GET["price_max"];

  $min2 = $min;
  $max2 = $max;
  $min = "&price_min=".$min;

  if ($max == 300) {
    $max2 = 100000;
    $max = '';
  } else {
    $max = "&price_max=".$max;

  }

  $output = array();
  $rooms = new simple_html_dom();

  $url = "https://www.airbnb.com/s";
  $qry_str = "?location={$endLocation}&checkin={$startDate}&checkout={$endDate}&guests={$guests}{$min}{$max}&page={$page}";
  $url = $url.$qry_str;
  $html = file_get_contents($url);
  $rooms->load($html);
  foreach($rooms->find('.search_result') as $aRoom) {
    $room['id'] = $aRoom->getAttribute("data-hosting-id");
    $room['idtype'] = "airbnb";
    $room['roomImg'] = $aRoom->find('img', 0)->getAttribute("data-original");
    $room['profileImg'] = $aRoom->find('img', 1)->getAttribute("data-original");
    $room['profileName'] = $aRoom->find('img', 1)->alt;
    $room['profileLink'] = "https://airbnb.com".$aRoom->find('a', 1)->href;
    $room['desc'] = trim($aRoom->find('.name', 0)->plaintext);
    $room['price'] = trim($aRoom->find('.price', 0)->plaintext);
    $room['price2'] = 0 + filter_var($room['price'], FILTER_SANITIZE_NUMBER_INT);
    $room['link'] = "https://airbnb.com".$aRoom->find('.name', 0)->href;
    $room['moreinfo'] = "https://api.airbnb.com/v1/listings/{$room['id']}?key=d306zoyjsyarp7ifhu67rjxn52tv0t20";
    $room['iconPath'] = "img/airbnb.ico";
    $room['infoWindowIcon'] = "img/airbnb.png";
    $var = trim($aRoom->find('.descriptor', 0)->plaintext);
    $mixed = explode("&mdash;", $var);
    $room['type'] = trim($mixed[0]);
    $room['neigh'] = trim(str_replace('>', '', $mixed[1]));

    $output[] = $room;
  }

  if ($page <= 1) {
    $url = "https://api.9flats.com/api/v3/places";
    $qry_str = "?search[query]={$endLocation}&search[start_date]={$startDate}&search[end_date]={$endDate}&search[number_of_beds]={$guests}&search[price_min]={$min2}&search[price_max]={$max2}&client_id=WfKWrPywnEbMhlifGlrsLu2ULfvTwxrKQji5eg0S";
    $url = $url.$qry_str;
    $html = file_get_contents($url);
    $nflatsjson = json_decode($html);
    if ($nflatsjson->places) {
      foreach($nflatsjson->places as $aRoom) {
        $room['id'] = filter_var($aRoom->place->place_details->slug, FILTER_SANITIZE_NUMBER_INT);
        $room['idtype'] = "9flats";
        $room['roomImg'] =  $aRoom->place->place_details->featured_photo->small;
        $room['profileImg'] = $aRoom->place->place_details->featured_photo->thumb;
        $room['profileName'] = $aRoom->place->place_details->host->name;
        $room['desc'] = $aRoom->place->place_details->name;
        $room['price'] = $aRoom->place->pricing->price;
        $room['price2'] = $aRoom->place->pricing->price;
        $room['link'] = "http://www.9flats.com/places/".$aRoom->place->place_details->slug;
        $room['iconPath'] = "img/9flats.ico";
        $room['infoWindowIcon'] = "img/9flats.png";
        $room['latLng'] = array($aRoom->place->place_details->lat, $aRoom->place->place_details->lng);
        $room['type'] = $aRoom->place->place_details->place_type;
        $room['neigh'] = $aRoom->place->place_details->city;

        $output[] = $room;
      }
    }
  }

  $str = json_encode($output);
  echo $str;

?>

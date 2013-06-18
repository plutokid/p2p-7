<?php
  // error_reporting(0);
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  require_once('../../simple_html_dom.php');
  $startLocation = urlencode($_GET["sloc"]);
  $endLocation = urlencode($_GET["eloc"]);
  $startDate = $_GET["sdate"];
  $endDate = $_GET["edate"];
  $guests = $_GET["guests"];
  $page = $_GET["page"];
  $min = $_GET["price_min"];
  $max = $_GET["price_max"];
  $roomType = $_GET["room_type"];
  $min = 0 + $min;
  $max = 0 + $max;

  if ($max == 300) {
    $max = 10000;
  }

  if (!$endLocation)
    $endLocation = $startLocation;

  $output = array();
  $rooms = new simple_html_dom();
  $airRoomType = '';
  $nflatsroomtype = '';
  for ($z=0; $z < count($roomType); $z++) {
    $nflatsroomtype .= $roomType[$z].'+';
    switch ($roomType[$z]) {
      case 'entire_home':
        $airRoomType .= "&room_types[]=".urlencode("Entire home/apt");
        break;
      case 'private_room':
        $airRoomType .= "&room_types[]=".urlencode("Private room");
        break;
      case 'shared_room':
        $airRoomType .= "&room_types[]=".urlencode("Shared room");
        break;
      default:
        $airRoomType .= '';
        break;
    }
  }
  $url = "https://www.airbnb.com/s";
  $qry_str = "?location={$endLocation}&checkin={$startDate}&checkout={$endDate}&guests={$guests}&price_min={$min}&price_max={$max}&page={$page}{$airRoomType}";
  $url = $url.$qry_str;
  $html = file_get_contents($url);
  $rooms->load($html);
  foreach($rooms->find('.search_result') as $aRoom) {
    $room['id'] = $aRoom->getAttribute("data-hosting-id");
    $room['uri'] = $aRoom->getAttribute("data-hosting-id");
    $room['idtype'] = "airbnb";
    $room['roomImg'] = str_replace('x_small', 'small', $aRoom->find('img', 0)->getAttribute("data-original"));
    $room['profileImg'] = str_replace('tiny', 'small', $aRoom->find('img', 1)->getAttribute("data-original"));
    $room['profileName'] = $aRoom->find('img', 1)->alt;
    $room['desc'] = str_replace("'", "", $aRoom->find('.name', 0)->plaintext);
    $room['profileLink'] = "https://airbnb.com".$aRoom->find('a', 1)->href;
    $room['price'] = 0 + filter_var(trim($aRoom->find('.price', 0)->plaintext), FILTER_SANITIZE_NUMBER_INT);
    $room['link'] = "https://airbnb.com".$aRoom->find('.name', 0)->href;
    $room['moreinfo'] = "https://api.airbnb.com/v1/listings/{$room['id']}?key=d306zoyjsyarp7ifhu67rjxn52tv0t20";
    $room['iconPath'] = "img/airbnb.ico";
    $room['infoWindowIcon'] = "img/airbnb.png";
    $var = trim($aRoom->find('.descriptor', 0)->plaintext);
    $mixed = explode("&mdash;", $var);
    $room['type'] = trim($mixed[0]);
    $room['neigh'] = trim(str_replace('>', '', $mixed[1]));
    $room['neigh'] = $room['neigh'] == "Quebec" ? "Quebec city" : $room['neigh'];
    $room['origin'] = $room['neigh'];

    $output[] = $room;
  }

   // Starting 9flats
  if ($startDate) {
    $startDate = date('Y-m-d', strtotime($startDate));
  }

  if ($endDate) {
    $endDate = date('Y-m-d', strtotime($endDate));
  }

  $url = "https://api.9flats.com/api/v4/places";
  $qry_str = "?search[query]={$endLocation}&search[start_date]={$startDate}&search[end_date]={$endDate}&search[number_of_beds]={$guests}&search[price_min]={$min}&search[price_max]={$max}&search[page]={$page}&search[place_type]={$nflatsroomtype}&search[per_page]=21&client_id=nubHrbRJUVPVlUjaH7SeO1RmmcZBug8Qm9Uyizus";
  $url = $url.$qry_str;
  $html = file_get_contents($url);
  $nflatsjson = json_decode($html);
  if ($nflatsjson->places) {
    foreach($nflatsjson->places as $aRoom) {
      $room['id'] = str_replace("-", "", filter_var($aRoom->place->place_details->slug, FILTER_SANITIZE_NUMBER_INT));
      $room['uri'] = $room['id'];
      $room['idtype'] = "nflats";
      $room['roomImg'] =  $aRoom->place->place_details->featured_photo->medium;
      $room['profileImg'] = "img/noprofile.jpg";
      $room['profileName'] = $aRoom->place->place_details->host->name;
      $room['price'] = round($aRoom->place->pricing->price);
      $room['desc'] = str_replace("'", "", $aRoom->place->place_details->name);
      $room['link'] = "http://www.9flats.com/places/".$aRoom->place->place_details->slug;
      $room['iconPath'] = "img/9flats.ico";
      $room['infoWindowIcon'] = "img/9flats.png";
      $room['moreinfo'] = $aRoom->place->place_details->links[0]->href."?&client_id=nubHrbRJUVPVlUjaH7SeO1RmmcZBug8Qm9Uyizus";
      $room['latLng'] = array($aRoom->place->place_details->lat, $aRoom->place->place_details->lng);
      $room['type'] = $aRoom->place->place_details->place_type;
      $room['neigh'] = $aRoom->place->place_details->city;
      $room['origin'] = $room['neigh'];

      $output[] = $room;
    }
  }
  
  // Starting Roomorama
  $url = "https://api.roomorama.com/v1.0/rooms.json";
  $qry_str = "?destination={$endLocation}&check_in={$startDate}&check_out={$endDate}&num_guests={$guests}&min_price={$min}&max_price={$max}&page={$page}&limit=21";
  $url = $url . $qry_str;
  $html = file_get_contents($url);
  $roomoramajson = json_decode($html);
  if ($roomoramajson->result)
  {
    foreach($roomoramajson->result as $aRoom)
    {
    $room['id'] = str_replace("-", "", filter_var($aRoom->result->id, FILTER_SANITIZE_NUMBER_INT));
    $room['uri'] = $room['id'];
      $room['idtype'] = "roomorama";
      $room['roomImg'] = $aRoom->result->thumbnail;
      $room['profileImg'] = "img/noprofile.jpg";
      $room['profileName'] = $aRoom->result->host->display;
      $room['price'] = $aRoom->result->price;
      $room['price2'] = $aRoom->result->price;
      $room['desc'] = str_replace("'", "", $aRoom->result->title);
      $room['link'] = $aRoom->result->url;
      $room['iconPath'] = "img/roomorama.ico";
      $room['infoWindowIcon'] = "img/roomorama.png";
      //$room['moreinfo'] = ;
      $room['latLng'] = array($aRoom->result->lat, $aRoom->result->lng);
      $room['type'] = $aRoom->result->subtype; // could be subtype or type
      $room['neigh'] = $aRoom->result->city;
      $room['origin'] = $room['neigh'];
    
      $output[] = $room;
    }
  }
  
  echo $_GET['callback'] . '('.json_encode($output).')';

?>

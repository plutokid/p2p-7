<?php
  error_reporting(0);

  // For JSONP convinience
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");

  // Gather the params
  // eloc=Montreal%2C+QC%2C+Canada&destlat=45.513575277797784&destlon=-73.55735711472185&destState=QC&destCountry=CA&sloc=&origlat=&origlon=&origState=&origCountry=
  // &sdate=&edate=&guests=1&price_min=10&price_max=300&room_type%5B%5D=entire_home&room_type%5B%5D=private_room&room_type%5B%5D=shared_room&page=1&_=1372448131844
  $startLocation = $_GET["sloc"];
  $endLocation = $_GET["eloc"];
  $endLat = $_GET["destlat"];
  $endLon = $_GET["destlon"];
  $startDate = $_GET["sdate"];
  $endDate = $_GET["edate"];
  $guests = $_GET["guests"];
  $page = $_GET["page"];
  $min = $_GET["price_min"];
  $max = $_GET["price_max"];
  $roomType = $_GET["room_type"];
  $idtype = $_GET["idtype"];

  // Convert to int
  $min = 0 + $min;
  $max = 0 + $max;

  // 300$ max cap should be maxed out to 10000
  if ($max == 300) {
    $max = 10000;
  }

  // If destination is not defined, grab the origin city instead
  if (!$endLocation) {
    $endLocation = $startLocation;
  }

  // Define the city only
  $city = explode(',', $endLocation);
  $city = urlencode($city[0]);

  // Encode this since it may have spaces and wierd chars
  $endLocation = urlencode($endLocation);

  // Converting dates to dashes for some providers
  $startDate_dash = '';
  $endDate_dash = '';
  if ($startDate) {
    $startDate_dash = date('Y-m-d', strtotime($startDate));
  }

  if ($endDate) {
    $endDate_dash = date('Y-m-d', strtotime($endDate));
  }

  /*
    Setting up the room_type filter for each provider
    $roomType is an array which holds all or some of these
    data: ["entire_home", "shared_room", "private_room"]
    The roomType array will NEVER be empty
    Depending on the API, everyone has different ways of appending
    the roomTypes in the GET URI. Looping over each one and doing a switch
    statement to make sure everything is right for every case.
  */
  $airRoomType = '';
  $nflatsroomtype = '';
  $roomaramaRoomtype = '';
  $crt = '';
  for ($z=0; $z < count($roomType); $z++) {
    $nflatsroomtype .= $roomType[$z].'+';
    switch ($roomType[$z]) {
      case 'entire_home':
        $airRoomType .= "&room_types[]=".urlencode("Entire home/apt");
        $roomaramaRoomtype .= "other";
        $crt .= "home";
        break;
      case 'private_room':
        $airRoomType .= "&room_types[]=".urlencode("Private room");
        $roomaramaRoomtype .= "room";
        $crt .= "pr";
        break;
      case 'shared_room':
        $airRoomType .= "&room_types[]=".urlencode("Shared room");
        $roomaramaRoomtype .= "room";
        $crt .= "sr";
        break;
      default:
        $airRoomType .= '';
        break;
    }
  }

  // Declare the globar array for us to feed on
  $output = array();

  // Start crawling
  switch ($idtype) {
    case 'nflats':
      $url = "https://api.9flats.com/api/v4/places";
      $qry_str = "?search[query]={$endLocation}&search[start_date]={$startDate_dash}&search[end_date]={$endDate_dash}&search[number_of_beds]={$guests}&search[price_min]={$min}&search[price_max]={$max}&search[page]={$page}&search[place_type]={$nflatsroomtype}&search[per_page]=11&client_id=nubHrbRJUVPVlUjaH7SeO1RmmcZBug8Qm9Uyizus";
      $url = $url.$qry_str;
      $html = file_get_contents($url);
      $nflatsjson = json_decode($html);
      if (isset($nflatsjson->places)) {
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
          $room['infoWindowIcon'] = "img/9flats.png";
          $room['latLng'] = array($aRoom->place->place_details->lat, $aRoom->place->place_details->lng);
          $room['type'] = $aRoom->place->place_details->place_type;
          $room['origin'] = $aRoom->place->place_details->city;

          $output[] = $room;
        }
      }
      break;
    case 'craigslist':
      if ($crt === "home" || $crt === "homepr" || $crt === "homeprsr" || $crt === "homesr") {
        $max = $max == 10000 ? 300 : $max;
        $page = 0 + $page - 1;
        $url = "http://search.3taps.com/?auth_token=c19ae6773494ae4d0a4236c59eeaaf39";
        $qry_str = "&category=RVAC&lat={$endLat}&long={$endLon}&radius=7mi&price={$min}..{$max}&sort=price&has_image=1&page={$page}";
        $extra = "&rpp=21&retvals=id,account_id,source,category,category_group,location,external_id,external_url,heading,body,timestamp,expires,language,price,currency,images,annotations,status,immortal";
        $url = $url.$qry_str.$extra;
        $html = file_get_contents($url);
        $json = json_decode($html);
        $dups = array();
        foreach ($json->postings as $key => $aRoom) {
          $room['origin'] = isset($aRoom->annotations->source_neighborhood) ? $aRoom->annotations->source_neighborhood : $aRoom->annotations->source_loc;
          $room['price'] = 0 + $aRoom->price;
          $room['sanitize'] = $room['price'].preg_replace("/[^A-Z]+/", "", $room['origin']);
          if (isset($aRoom->location->state)) {
            if (in_array($room['sanitize'], $dups)) {
              continue;
            }
            $dups[] = $room['sanitize'];
            $room['id'] = $aRoom->id;
            $room['uri'] = $aRoom->id;
            $room['currency'] = $aRoom->currency;
            $room['idtype'] = "craigslist";
            $room['roomImg'] = $aRoom->images[0]->full;
            $room['profileImg'] = "img/noprofile.jpg";
            $room['link'] = $aRoom->external_url;
            $room['infoWindowIcon'] = "img/craigslist.png";
            $room['latLng'] = array($aRoom->location->lat, $aRoom->location->long);
            $room['desc'] = $aRoom->heading;
            $room['type'] = "Entire Home/Apt";

            $output[] = $room;
          }
        }
      }
      break;
    case 'airbnb':
      $url = "https://www.airbnb.com/s";
      $qry_str = "?location={$endLocation}&checkin={$startDate}&checkout={$endDate}&guests={$guests}&price_min={$min}&price_max={$max}&page={$page}{$airRoomType}";
      $url = $url.$qry_str;
      $html = file_get_contents($url);

      // Request DOM Scraper library
      require_once('../../simple_html_dom.php');

      // Instantiate a new DOM Scrapping object
      $rooms = new simple_html_dom();
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
        $room['infoWindowIcon'] = "img/airbnb.png";
        $room['latLng'] = "";
        $var = trim($aRoom->find('.descriptor', 0)->plaintext);
        $mixed = explode("&mdash;", $var);
        $room['type'] = trim($mixed[0]);
        $room['origin'] = trim(str_replace('>', '', $mixed[1]));
        $room['origin'] = $room['origin'] == "Quebec" ? "Quebec city" : $room['origin'];

        $output[] = $room;
      }
      break;
    case 'roomorama':
      if (!$startDate_dash || !$endDate_dash) {
        $startDate_dash = '';
        $endDate_dash = '';
      }
      $url = "https://api.roomorama.com/v1.0/rooms.json";
      $qry_str = "?destination={$city}&check_in={$startDate_dash}&check_out={$endDate_dash}&num_guests={$guests}&min_price={$min}&max_price={$max}&page={$page}&limit=11";
      $url = $url . $qry_str;
      $html = file_get_contents($url);
      $roomoramajson = json_decode($html);
      if (isset($roomoramajson->result)) {
        foreach($roomoramajson->result as $aRoom) {
          $room['type'] = $aRoom->type;
          switch ($room['type']) {
            case 'room':
              $roomTypeRoo = "room";
              break;
            default:
              $roomTypeRoo = "other";
              break;
          }

          if ($roomTypeRoo == "room" && $roomaramaRoomtype == "other") {
            continue;
          }


          if ($roomTypeRoo == "other" && ($roomaramaRoomtype == "room" || $roomaramaRoomtype == "roomroom")) {
            continue;
          }


          $room['id'] = $aRoom->id;
          $room['uri'] = $room['id'];
          $room['idtype'] = "roomorama";
          $room['roomImg'] = $aRoom->thumbnail;
          $room['profileImg'] = "img/noprofile.jpg";
          $room['profileName'] = $aRoom->host->display;
          $room['price'] = $aRoom->price;
          $room['desc'] = str_replace("'", "", $aRoom->title);
          $room['link'] = $aRoom->url;
          $room['infoWindowIcon'] = "img/roomorama.png";
          $room['latLng'] = array($aRoom->lat, $aRoom->lng);
          if (isset($aRoom->subtype) && $room['type'] !== $aRoom->subtype) {
            $room['type'] = $room['type'] . ' - ' . $aRoom->subtype;
          }
          $room['origin'] = $aRoom->city;

          $output[] = $room;
        }
      }
      break;
  }

  echo $_GET['callback'] . '('.json_encode($output).')';
?>

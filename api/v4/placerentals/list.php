<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");

  // "Montreal, QC, CA", "Maui, HI", "Canada"
  $location = !empty($_GET["loc"]) ? $_GET["loc"] : "";

  // 33.2212710258196
  $lat = !empty($_GET["lat"]) ? (float)$_GET["lat"] : "";
  $lng = !empty($_GET["lng"]) ? (float)$_GET["lng"] : "";

  // "QC", "NY", "BC", "ON"
  $state = !empty($_GET["state"]) ? $_GET["state"] : "";

  // "CA", "US", "UK", "AU"
  $country = !empty($_GET["country"]) ? $_GET["country"] : "";

  // 1377835200
  $startDate = !empty($_GET["sdate"]) ? $_GET["sdate"] : "";
  $endDate = !empty($_GET["edate"]) ? $_GET["edate"] : "";

  // 3
  $guests = !empty($_GET["guests"]) ? (int)$_GET["guests"] : 1;

  // 20
  $min = !empty($_GET["min"]) ? (int)$_GET["min"] : 0;
  $max = !empty($_GET["max"]) ? (int)$_GET["max"] : 10000;

  // "low2high", "high2low", "relevance"
  $sort = !empty($_GET["sort"]) ? $_GET["sort"] : "relevance";

  // 1.5
  $radius = !empty($_GET["radius"]) ? (float)$_GET["radius"] : 0.7;

  // ["entire_place", "private_room", "shared_room"]
  $roomType = !empty($_GET["roomType"]) ? $_GET["roomType"] : array("entire_place", "private_room", "shared_room");

  // ["apartment", "bnb", "cabin", "dorm", "house", "loft", "villa"]
  $propertyType = !empty($_GET["propertyType"]) ? $_GET["propertyType"] : array("apartment", "bnb", "chalet", "house", "other");

  // 25
  $rpp = !empty($_GET["rpp"]) ? (int)$_GET["rpp"] : 25;

  // 1
  $page = !empty($_GET["page"]) ? (int)$_GET["page"] : 1;

  // Start the madness
  $listings = array();
  $latLng = array($lat, $lng);
  if ($max == 1000) {
    $max = 10000;
  }

  // Configuration
  $dbhost = 'api.outpost.travel:27017';
  $dbname = 'outpost';

  // Connect to outpost database
  $m = new Mongo("mongodb://$dbhost");
  $db = $m->$dbname;

  // Get the flipkey collection
  $c_rentals = $db->placeRentals;

  // Build the query
  $query = array(
    'latLng' => array(
      '$within' => array(
        '$center' => array(
          $latLng, $radius
        )
      )
    ),
    'occupancy' => array(
      '$gte' => $guests
    ),
    'rate' => array(
      '$gte' => $min,
      '$lte' => $max
    ),
    'roomType' => array(
      '$in' => $roomType
    ),
    'propertyType' => array(
      '$in' => $propertyType
    )
  );

  try {
    switch ($sort) {
      case 'low2high':
        $cursor = $c_rentals->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => 1));
        break;
      case 'high2low':
        $cursor = $c_rentals->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => -1));
        break;
      default:
        $cursor = $c_rentals->find($query)->skip($rpp * ($page - 1))->limit($rpp);
        break;
    }
    $totalResults = $cursor->count();
    $totalPages = ceil($totalResults / $rpp);
    $totalPages = $totalPages == 0 ? 1 : $totalPages;
  } catch (Exception $e) {
    switch ($sort) {
      case 'low2high':
        $cursor = $c_rentals->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => 1));
        break;
      case 'high2low':
        $cursor = $c_rentals->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => -1));
        break;
      default:
        $cursor = $c_rentals->find($query)->skip($rpp * ($page - 1))->limit($rpp);
        break;
    }
    $cursor = $c_rentals->find($query)->skip($rpp * ($page - 1))->limit($rpp);

    $totalResults = $cursor->count();
    $totalPages = ceil($totalResults / $rpp);
    $totalPages = $totalPages == 0 ? 1 : $totalPages;
  }

  while ($cursor->hasNext()) {
    $aList = $cursor->getNext();

    $room = array();
    $room["id"] = $aList["microProvider"].$aList["pid"];
    $room["link"] = $aList["link"];

    $room["heading"] = htmlspecialchars($aList["heading"], ENT_QUOTES);

    $room["roomType"] = $aList["roomType"];
    $room["roomTypeAlias"] = htmlspecialchars($aList["roomTypeAlias"], ENT_QUOTES);
    $room["propertyTypeAlias"] = htmlspecialchars($aList["propertyTypeAlias"], ENT_QUOTES);
    $room["propertyType"] = $aList["propertyType"];

    $room["origin"] = htmlspecialchars($aList["origin"], ENT_QUOTES);
    $room["address"] = htmlspecialchars($aList["address"], ENT_QUOTES);
    $room["latLng"] = $aList["latLng"];

    $room["rate"] = $aList["rate"];
    $room["ratePer"] = $aList["ratePer"];
    $room["currency"] = $aList["currency"];
    $room["currencySign"] = $aList["currencySign"];

    $room["occupancy"] = $aList["occupancy"];
    $room["bedCount"] = $aList["bedCount"];
    $room["bedroomCount"] = $aList["bedroomCount"];
    $room["bathroomCount"] = $aList["bathroomCount"];

    $room["thumbnail"] = $aList["thumbnail"];
    $room["photos"] = $aList["photos"];
    $room["captions"] = $aList["captions"];

    $room["provider"] = $aList["provider"];
    $room["fullProvider"] = htmlspecialchars($aList["fullProvider"], ENT_QUOTES);

    $listings[] = $room;
  }


  $output = array();
  $output["type"] = "rentals";
  $output["status"] = 200;
  $output["page"] = $page;
  $output["totalPages"] = $totalPages;
  $output["resultsPerPage"] = $rpp;
  $output["totalResults"] = $totalResults;
  $output["rentals"] = $listings;

  if (isset($_GET['callback'])) {
    echo $_GET['callback'] . '('.json_encode($output).')';
  } else {
    echo json_encode($output);
  }
?>

<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");

  // "Montreal, QC, CA", "Maui, HI", "Canada"
  $location = isset($_GET["loc"]) ? $_GET["loc"] : "";

  // 33.2212710258196
  $lat = isset($_GET["lat"]) ? $_GET["lat"] : "";
  $lng = isset($_GET["lng"]) ? $_GET["lng"] : "";

  // "QC", "NY", "BC", "ON"
  $state = isset($_GET["state"]) ? $_GET["state"] : "";

  // "CA", "US", "UK", "AU"
  $country = isset($_GET["country"]) ? $_GET["country"] : "";

  // 1377835200
  $startDate = isset($_GET["sdate"]) ? $_GET["sdate"] : "";
  $endDate = isset($_GET["edate"]) ? $_GET["edate"] : "";

  // 3
  $guests = isset($_GET["guests"]) ? (int)$_GET["guests"] : 1;

  // 20
  $min = isset($_GET["min"]) ? (int)$_GET["min"] : 0;
  $max = isset($_GET["max"]) ? (int)$_GET["max"] : 10000;

  // "low2high", "high2low", "relevance"
  $sortBy = isset($_GET["sort"]) ? $_GET["sort"] : "relevance";

  // 1.5
  $radius = isset($_GET["radius"]) ? (float)$_GET["radius"] : 1.5;

  // ["entire_place", "private_room", "shared_room"]
  $roomType = isset($_GET["room_type"]) ? $_GET["room_type"] : array();

  // ["apartment", "bnb", "cabin", "dorm", "house", "loft", "villa"]
  $propertyType = isset($_GET["property_type"]) ? $_GET["property_type"] : array();

  // ["nflats", "craigslist", "airbnb", "flipkey", "roomorama"],
  $providers = isset($_GET["providers"]) ? $_GET["providers"] : array();

  // 25
  $rpp = isset($_GET["rpp"]) ? (int)$_GET["rpp"] : 25;

  // 1
  $page = isset($_GET["page"]) ? (int)$_GET["page"] : 1;

  // Start the madness
  $listings = array();

  // Configuration
  $dbhost = 'api.outpost.travel:27017';
  $dbname = 'outpost';

  // Connect to outpost database
  $m = new Mongo("mongodb://$dbhost");
  $db = $m->$dbname;

  // Get the flipkey collection
  $c_rentals = $db->placeRentals;

  // Build the query - find rows where origin === 'Hilton Head Island'
  $query = array(
    'origin' => 'Hilton Head Island'
  );

  $cursor = $c_rentals->find($query)->limit($rpp);

  $totalResults = $cursor->count();
  $totalPages = (int)($totalResults / $rpp);

  while ($cursor->hasNext()) {
    $aList = $cursor->getNext();

    $room = array();
    $room["origin"] = $aList["origin"];
    $room["title"] = $aList["title"];

    $listings[] = $room;
  }

  $output = array();
  $output["type"] = "rentals";
  $output["rpp"] = $rpp;
  $output["currentPage"] = $page;
  $output["totalPages"] = $totalPages;
  $output["totalResults"] = $totalResults;
  $output["rentals"] = $listings;

  if (isset($_GET['callback'])) {
    echo $_GET['callback'] . '('.json_encode($output).')';
  } else {
    echo json_encode($output);
  }

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

  // 3
  $guests = !empty($_GET["guests"]) ? (int)$_GET["guests"] : 1;

  // "low2high", "high2low", "relevance"
  $sort = !empty($_GET["sort"]) ? $_GET["sort"] : "relevance";

  // 1.5
  $radius = !empty($_GET["radius"]) ? (float)$_GET["radius"] : 0.7;

  // 25
  $rpp = !empty($_GET["rpp"]) ? (int)$_GET["rpp"] : 25;

  // 1
  $page = !empty($_GET["page"]) ? (int)$_GET["page"] : 1;

  // Start the madness
  $listings = array();
  $latLng = array($lat, $lng);

  // Configuration
  $dbhost = 'api.outpost.travel:27017';
  $dbname = 'outpost';

  // Connect to outpost database
  $m = new Mongo("mongodb://$dbhost");
  $db = $m->$dbname;
  $db->authenticate("read", "outpost123");

  // Get the flipkey collection
  $c_exp = $db->experiences;

  // Build the query
  $query = array(
    'latLng' => array(
      '$within' => array(
        '$center' => array(
          $latLng, $radius
        )
      )
    )
  );

  try {
    switch ($sort) {
      case 'low2high':
        $cursor = $c_exp->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => 1));
        break;
      case 'high2low':
        $cursor = $c_exp->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => -1));
        break;
      default:
        $cursor = $c_exp->find($query)->skip($rpp * ($page - 1))->limit($rpp);
        break;
    }
    $totalResults = $cursor->count();
    $totalPages = ceil($totalResults / $rpp);
    $totalPages = $totalPages == 0 ? 1 : $totalPages;
  } catch (Exception $e) {
    switch ($sort) {
      case 'low2high':
        $cursor = $c_exp->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => 1));
        break;
      case 'high2low':
        $cursor = $c_exp->find($query)->skip($rpp * ($page - 1))->limit($rpp)->sort(array('rate' => -1));
        break;
      default:
        $cursor = $c_exp->find($query)->skip($rpp * ($page - 1))->limit($rpp);
        break;
    }
    $cursor = $c_exp->find($query)->skip($rpp * ($page - 1))->limit($rpp);

    $totalResults = $cursor->count();
    $totalPages = ceil($totalResults / $rpp);
    $totalPages = $totalPages == 0 ? 1 : $totalPages;
  }

  while ($cursor->hasNext()) {
    $aList = $cursor->getNext();

    $tour = array();
    $tour["id"] = $aList["microProvider"].$aList["pid"];
    $tour["link"] = $aList["link"];

    $tour["heading"] = htmlspecialchars(str_replace('"', "'", $aList["heading"]), ENT_QUOTES);

    $tour["origin"] = htmlspecialchars(str_replace('"', "'", $aList["origin"]), ENT_QUOTES);
    $tour["latLng"] = $aList["latLng"];
    $tour["address"] = $tour["origin"];

    $tour["rate"] = $aList["rate"];
    $tour["ratePer"] = $aList["ratePer"];

    $tour["thumbnail"] = $aList["thumbnail"];
    $tour["photos"] = $aList["photos"];

    $tour["captions"] = array();
    foreach ($aList["captions"] as $value) {
      $tour["captions"][] = htmlspecialchars(str_replace('"', "'", $value), ENT_QUOTES);
    }

    $tour["provider"] = $aList["provider"];
    $tour["fullProvider"] = htmlspecialchars(str_replace('"', "'", $aList["fullProvider"]), ENT_QUOTES);

    $listings[] = $tour;
  }

  $output = array();
  $output["type"] = "experiences";
  $output["status"] = 200;
  $output["page"] = $page;
  $output["totalPages"] = $totalPages;
  $output["resultsPerPage"] = $rpp;
  $output["totalResults"] = $totalResults;
  $output["experiences"] = $listings;

  if (isset($_GET['callback'])) {
    echo $_GET['callback'] . '('.json_encode($output).')';
  } else {
    echo json_encode($output);
  }
?>

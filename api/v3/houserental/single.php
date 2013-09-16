<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");

  $pid = urldecode($_GET["uri"]);
  $provider = $_GET["idtype"];

  $output = array();
  $output["type"] = "rentals";
  $output["status"] = 200;

  // Configuration
  $dbhost = 'api.outpost.travel:27017';
  $dbname = 'outpost';

  // Connect to outpost database
  $m = new Mongo("mongodb://$dbhost");
  $db = $m->$dbname;
  $db->authenticate("read", "outpost123");

  // Get the flipkey collection
  $c_rentals = $db->placeRentals;

  // Build the query
  $query = array(
    'pid' => $pid,
    'provider' => $provider
  );

  try {
    $output = $c_rentals->findOne($query);
  } catch (Exception $e) {
    $output = $c_rentals->findOne($query);
  }

  if (isset($_GET['callback'])) {
    echo $_GET['callback'] . '('.json_encode($output).')';
  } else {
    echo json_encode($output);
  }
?>

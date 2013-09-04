<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");

  $output = array();

  // Configuration
  $dbhost = 'api.outpost.travel:27017';
  $dbname = 'outpost';

  // Connect to outpost database
  $m = new Mongo("mongodb://$dbhost");
  $db = $m->$dbname;

  $c_rentals = $db->placeRentals;

  try {
    $output["rentalsAmt"] = $c_rentals->find()->count();
    $output["rentalsAmtCity"] = count($c_rentals->distinct('origin'));
  } catch (Exception $e) {
    $output["rentalsAmt"] = $c_rentals->find()->count();
    $output["rentalsAmtCity"] = count($c_rentals->distinct('origin'));
  }

  if (isset($_GET['callback'])) {
    echo $_GET['callback'] . '('.json_encode($output).')';
  } else {
    echo json_encode($output);
  }
?>

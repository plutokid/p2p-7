<?php
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
    $output["rentalsAmtCity"] = $c_rentals->distinct('origin')->length;
  } catch (Exception $e) {
    $output["rentalsAmt"] = $c_rentals->find()->count();
    $output["rentalsAmtCity"] = $c_rentals->distinct('origin')->length;
  }

  $str = json_encode($output);
  echo "$str";
  $filestr = "infocount.json";
  $fp=@fopen($filestr, 'w');
  fwrite($fp, $str);
  fwrite($fp, "");
  fclose($fp);
  echo $str;
?>

<?php
  require_once('../simple_html_dom.php');
  $startLocation = urlencode($_GET["sloc"]);
  $endLocation = urlencode($_GET["eloc"]);
  $startDate = urlencode($_GET["sdate"]);
  $min = $_GET["price_min"];
  $max = $_GET["price_max"];
  $guests = $_GET["guests"];
  $min = 0 + $min;
  $max = 0 + $max;
  $guests = 0 + $guests;
  if ($max == 300) {
    $max = 10000;
  }
  $url = "http://www.blablacar.com/search-car-sharing-result";
  $qry_str = "?db={$startDate}&fn={$startLocation}&tn={$endLocation}&sort=trip_date&order=asc";
  $url = $url.$qry_str;
  $html = file_get_contents($url);

  $poolList = new simple_html_dom();
  $poolList->load($html);
  $output = array();

  foreach($poolList->find('.trip') as $aRide) {
    $price_full = trim($aRide->find('.price', 0)->plaintext);
    $price = 0 + filter_var($price_full, FILTER_SANITIZE_NUMBER_INT);
    if ($price >= $min && $price <= $max) {
      $seat = $aRide->find('.availability strong', 0)->plaintext;
      if ($seat) {
        $seat = 0 + $seat;
        if ($guests  > $seat) {
          continue;
        }
        $ride['seat'] = $seat;
      } else {
        continue;
      }
      $ride['img'] = $aRide->find('img', 0)->src;
      $ride['link'] = "http://www.blablacar.com".$aRide->find('a', 0)->href;
      $ride['id'] = substr($ride['link'], -6);
      $ride['dates'] =  trim($aRide->find('.time', 0)->plaintext);
      $ride['username'] = trim($aRide->find('.username', 0)->plaintext);
      $ride['iconPath'] = "img/blablacar.ico";
      $ride['infoWindowIcon'] = "img/blablacar.png";
      
      $origin = trim($aRide->find('.geo-from .tip', 0)->plaintext);
      $origin = explode(",", $origin);
      $ride['origin'] = $origin[count($origin - 1)];

      $destination = trim($aRide->find('.geo-to .tip', 0)->plaintext);
      $destination = explode(",", $destination);
      $ride['destination'] = $destination[count($destination - 1)];
      $ride['desc'] = trim($aRide->find('.fromto', 0)->plaintext);
      $ride['price'] = $price_full;
      $ride['price2'] = $price;

      $output[] = $ride;
    }
  }

  echo json_encode($output);
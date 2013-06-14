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
  $lastDate = null;
  if ($max == 300) {
    $max = 10000;
  }
  $url = "http://www.zimride.com/search";
  $qry_str = "?date={$startDate}&e={$endLocation}&s={$startLocation}&filterSearch=true&filter_type=offer";
  $url = $url.$qry_str;
  $html = file_get_contents($url);

  $poolList = new simple_html_dom();
  $poolList->load($html);
  $output = array();


  foreach($poolList->find('.ride_list a') as $aRide) {
    $price_full = trim($aRide->find('.price_box p', 0)->plaintext);
    $price = 0 + substr($price_full, 1);
    if ($price >= $min && $price <= $max && $ride['img'] = $aRide->find('img', 0)->src) {
      $seat = $aRide->find('.count', 0)->plaintext;
      if ($seat) {
        $seat = 0 + $seat;
        if ($guests  > $seat) {
          continue;
        }
        $ride['seat'] = $seat;
      } else {
        continue;
      }
      if ($aRide->prev_sibling()->hasAttribute('class')) {
        $lastDate = $aRide->prev_sibling()->plaintext;
        $lastDate = explode("&mdash;", $lastDate);
        $lastDate = $lastDate[1];
      }
      $ride['link'] = $aRide->href;
      $ride['id'] = filter_var($ride['link'], FILTER_SANITIZE_NUMBER_INT);
      $ride['dates'] =  $lastDate; //poollist find
      $ride['username'] = trim($aRide->find('.username', 0)->plaintext);
      $originfull = trim($aRide->find('.inner', 0)->innertext);
      $origin = explode('<span class="trip_type one_way"></span>', $originfull);

      if (!$origin[1]) {
        $origin = explode('<span class="trip_type round_trip"></span>', $originfull);
      }

      $ride['iconPath'] = "img/zimride.ico";
      $ride['origin'] = $origin[0];
      $ride['destination'] = $origin[1];
      $ride['desc'] = trim($aRide->find('h4', 0)->plaintext);
      $ride['price'] = $price_full;

      $output[] = $ride;
    }
  }

  echo json_encode($output);
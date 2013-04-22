<?php
  require_once('../../simple_html_dom.php');

  $startLocation = urlencode($_GET["sloc"]);
  $endLocation = urlencode($_GET["eloc"]);

  $startDate = urlencode($_GET["sdate"]);

  $origLat = $_GET["origlat"];
  $origLon = $_GET["origlon"];
  $destLat = $_GET["destlat"];
  $destLon = $_GET["destlon"];

  $guests = $_GET["guests"];
  $guests = 0 + $guests;

  $min = $_GET["price_min"];
  $max = $_GET["price_max"];
  $min = 0 + $min;
  $max = 0 + $max;
  if ($max == 300) {
    $max = 10000;
  }

  $output = array();
  $idarr = array();

  $url = "http://www.zimride.com/search";
  $qry_str = "?date={$startDate}&e={$endLocation}&s={$startLocation}&filterSearch=true&filter_type=offer";
  $url = $url.$qry_str;
  $html = file_get_contents($url);
  $poolList = new simple_html_dom();
  $poolList->load($html);
  $lastDate = trim($poolList->find('h3.headline span', 0)->plaintext);
  $lastDate = explode("&mdash;", $lastDate);
  if ($lastDate[1])
    $lastDate = $lastDate[1];
  else
    $lastDate = substr($lastDate[0], 10);
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
        if ($lastDate[1])
          $lastDate = $lastDate[1];
        else
          $lastDate = substr($lastDate[0], 10);
      }
      $ride['link'] = $aRide->href;
      $ride['id'] = filter_var($ride['link'], FILTER_SANITIZE_NUMBER_INT);
      $ride['idtype'] = "zimride";
      $ride['dates'] =  $lastDate; //poollist find
      $ride['username'] = trim($aRide->find('.username', 0)->plaintext);
      $originfull = trim($aRide->find('.inner', 0)->innertext);
      $origin = explode('<span class="trip_type one_way"></span>', $originfull);

      if (!$origin[1]) {
        $origin = explode('<span class="trip_type round_trip"></span>', $originfull);
      }

      $ride['iconPath'] = "img/zimride.ico";
      $ride['infoWindowIcon'] = "img/zimride.png";
      $ride['origin'] = $origin[0];
      $ride['destination'] = $origin[1];
      $ride['desc'] = trim($aRide->find('h4', 0)->plaintext);
      $ride['price'] = $price_full;

      $output[] = $ride;
    }
  }

  $url = "http://ridejoy.com/rides/search";
  $qry_str = "?type=ride_request&origin={$startLocation}&origin_latitude={$origLat}&origin_longitude={$origLon}&destination={$endLocation}&destination_latitude={$destLat}&destination_longitude={$destLon}&date={$startDate}";
  $url = $url.$qry_str;
  $html = file_get_contents($url);

  $poolList->load($html);

  foreach($poolList->find('.date') as $aBlock) {
    $date = trim($aBlock->find('.date_header', 0)->plaintext);
    foreach($aBlock->find('.result') as $aRide) {
      $ride['id'] = $aRide->getAttribute("data-ride-id");
      if (in_array($ride['id'], $idarr)) {
        continue;
      }
      $idarr[] = $ride['id'];

      $price_full = trim($aRide->find('.seats_container', 0)->plaintext);
      $price = 0 + substr($price_full, 1);
      if ($price >= $min && $price <= $max) {
        $ride['idtype'] = "ridejoy";
        $ride['dates'] = $date;
        $ride['img'] = $aRide->find('img', 0)->src;
        $ride['origin'] = trim($aRide->find('.origin', 0)->plaintext);
        $ride['destination'] = trim($aRide->find('.destination', 0)->plaintext);
        $ride['desc'] = trim($aRide->find('.extra_info', 0)->plaintext);
        $ride['price'] = $price_full;
        $ride['iconPath'] = "img/ridejoy.ico";
        $ride['infoWindowIcon'] = "img/ridejoy.png";
        $ride['link'] = trim($aRide->find('.view_details', 0)->href);

        $output[] = $ride;
      }
    }
  }

  $url = "http://www.blablacar.com/search-car-sharing-result";
  if ($startDate) {
    $startDate2 = urldecode($startDate);
    $startDate2 = explode("/", $startDate2);
    $startDate2 = $startDate2[1]."/".$startDate2[0]."/".$startDate2[2];
    $startDate2 = urlencode($startDate2);
  }
  $qry_str = "?db={$startDate2}&fn={$startLocation}&tn={$endLocation}&sort=trip_date&order=asc";
  $url = $url.$qry_str;
  $html = file_get_contents($url);
  $poolList->load($html);
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
      $ride['idtype'] = "blablacar";
      $ride['dates'] =  trim($aRide->find('.time', 0)->plaintext);
      $ride['username'] = trim($aRide->find('.username', 0)->plaintext);
      $ride['iconPath'] = "img/blablacar.ico";
      $ride['infoWindowIcon'] = "img/blablacar.png";
      $origin = trim($aRide->find('.geo-from .tip', 0)->plaintext);
      $origin = explode(",", $origin);
      $ride['origin'] = $origin[0];

      $destination = trim($aRide->find('.geo-to .tip', 0)->plaintext);
      $destination = explode(",", $destination);
      $ride['destination'] = $destination[0];
      $ride['desc'] = trim($aRide->find('.fromto', 0)->plaintext);
      $ride['price'] = $price_full;
      $ride['price2'] = $price;

      $output[] = $ride;
    }
  }

  echo json_encode($output);
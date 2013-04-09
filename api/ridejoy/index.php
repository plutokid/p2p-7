<?php
  require_once('../simple_html_dom.php');
  $startLocation = urlencode($_GET["sloc"]);
  $endLocation = urlencode($_GET["eloc"]);
  $origLat = $_GET["origlat"];
  $origLon = $_GET["origlon"];
  $destLat = $_GET["destlat"];
  $destLon = $_GET["destlon"];
  $startDate = $_GET["sdate"];

  $url = "http://ridejoy.com/rides/search";
  $qry_str = "?type=ride_request&origin={$startLocation}&origin_latitude={$origLat}&origin_longitude={$origLon}&destination={$endLocation}&destination_latitude={$destLat}&destination_longitude={$destLon}&date={$startDate}";
  $url = $url.$qry_str;
  $html = file_get_contents($url);

  $poolList = new simple_html_dom();
  $poolList->load($html);
  $output = array();
  $idarr = array();
  $datearr = array();
  $i = 0; $j = -1;

  foreach($poolList->find('.date') as $aBlock) {
    $date = trim($aBlock->find('.date_header', 0)->plaintext); // wed march 13
    foreach($aBlock->find('.result') as $aRide) {
      $ride['id'] = $aRide->getAttribute("data-ride-id"); // 36195
      if (in_array($ride['id'], $idarr)) {
        continue;
      }
      $idarr[] = $ride['id'];
      $ride['dates'] = $date;
      $ride['img'] = $aRide->find('img', 0)->src;
      $ride['origin'] = trim($aRide->find('.origin', 0)->plaintext);
      $ride['destination'] = trim($aRide->find('.destination', 0)->plaintext);
      $ride['desc'] = trim($aRide->find('.extra_info', 0)->plaintext);
      $ride['price'] = trim($aRide->find('.seats_container', 0)->plaintext);
      $ride['link'] = trim($aRide->find('.view_details', 0)->href);

      $output[] = $ride;
      // $j++;
    }
    // $output[$j]['date'][] = $date;
  }

  echo trim(json_encode($output));
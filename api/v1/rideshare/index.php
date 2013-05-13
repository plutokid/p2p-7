<?php
  require_once('../../simple_html_dom.php');

  $startLocation = urlencode($_GET["sloc"]);
  $endLocation = urlencode($_GET["eloc"]);

  $startDate = urlencode($_GET["sdate"]);
  $endDate = urlencode($_GET["edate"]);

  $origLat = $_GET["origlat"];
  $origLon = $_GET["origlon"];
  $destLat = $_GET["destlat"];
  $destLon = $_GET["destlon"];

  $state1 = $_GET["origState"];
  $state2 = $_GET["destState"];
  $city1 = explode(',', urldecode($startLocation));
  $city1 = str_replace(array("é", "è"), "e", $city1[0]);
  $city2 = explode(',', urldecode($endLocation));
  $city2 = str_replace(array("é", "è"), "e", $city2[0]);
  
  $country1 = $_GET["origCountry"];
  $country2 = $_GET["destCountry"];

  $country = $country1 ? $country1 : $country2;
  if (!$country) {
    $country = "world";
  } elseif ($country == "CA" || $country == "US") {
    $country = "NA";
  } else {
    $country = "world";
  }

  $guests = $_GET["guests"];
  $guests = 0 + $guests;

  $output = array();
  $idarr = array();

  $poolList = new simple_html_dom();

  if ($country == "NA" && ($country1 == "CA" || $country2 == "CA")) {
    $state1 = $state1 ? $state1."/" : '';
    $state2 = $state2 ? $state2."/" : '';

    if ($city1 && $city2) {
      $city1 = str_replace(' ', '_', $city1);
      $city2 = str_replace(' ', '_', $city2);
      $uri = "rideshares_from_{$city1}_to_{$city2}.html";
    } elseif ($city1) {
      $city1 = str_replace(' ', '_', $city1);
      $uri = "rideshares_from_{$city1}.html";
    } elseif ($city2) {
      $city2 = str_replace(' ', '_', $city2);
      $uri = "rideshares_to_{$city2}.html";
    }

    $startDate2 = '';
    if ($startDate) {
      $startDate2 = urldecode($startDate);
      $startDate2 = explode("/", $startDate2);
      $startDate2 = $startDate2[2]."-".$startDate2[0]."-".$startDate2[1];
      $startDate2 = '?startDate='.$startDate2; // startDate=2013-05-12
    }

    $endDate2 = '';
    if ($endDate) {
      $endDate2 = urldecode($endDate);
      $endDate2 = explode("/", $endDate2);
      $endDate2 = $endDate2[2]."-".$endDate2[0]."-".$endDate2[1];
      if ($startDate) {
        $endDate2 = '&endDate='.$endDate2; // startDate=2013-05-12
      } else {
        $endDate2 = '?endDate='.$endDate2;
      }
    }

    $qry_str = $state1.$state2.$uri.$startDate2.$endDate2;
  // http://www.kangaride.com/itinerarySearch/QC/ON/rideshares_from_Montreal_to_Toronto.html
  // http://www.kangaride.com/itinerarySearch/QC/rideshares_from_Montreal.html
  // http://www.kangaride.com/itinerarySearch/QC/rideshares_to_Montreal.html
  // http://www.kangaride.com/itinerarySearch/ON/QC/rideshares_from_Toronto_to_Montreal.html
  // http://www.kangaride.com/itinerarySearch/QC/NY/rideshares_from_Montreal_to_New_York.html
    $opts = array(
      'http'=>array(
        'method'=>"GET",
        'header'=>"Accept-language: en\r\n" .
                  "Cookie: foo=bar\r\n" . 
                  "Content-Type: text/html; charset=utf-8\r\n" . 
                  "User-Agent: Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/534.13 (KHTML, like Gecko) Chrome/19.0.597.107 Safari/534.13\r\n"
      )
    );
    $context = stream_context_create($opts);
    $url = "http://www.kangaride.com/itinerarySearch/";
    $url = $url.$qry_str;
    $html = file_get_contents($url, false, $context);
    $html = mb_convert_encoding($html, 'UTF-8', mb_detect_encoding($html, 'UTF-8, ISO-8859-1', true));
    $poolList->load($html);
    $crap = array();
    $crap[] = "window.location.href=";
    $crap[] = "'";

    $vroomList = new simple_html_dom();
    $vroom = $poolList->find('table');
    // $vroom = $vroomList->load($vroom);
    if ($vroom[4]) {
      $lastDate = $vroom[4]->find('tr', 0)->plaintext;
      foreach($vroom[4]->find('tr') as $aRide) {
        $price_full = trim($aRide->find('.itineraryPrice', 0)->plaintext);
        $price = 0 + $price_full;
          $seat = 0;
          foreach ($aRide->find('.blueMan') as $guy) {
            $seat++;
          }

          if ($seat) {
            if ($guests  > $seat) {
              continue;
            }
            $ride['seat'] = $seat;
          } else {
            continue;
          }

          if (!$aRide->prev_sibling()->hasAttribute('class')) {
            $lastDate = $aRide->prev_sibling()->plaintext;
          }

          $link = $aRide->getAttribute('onclick');
          $ride['link'] = str_replace($crap, '', $link);
          $ride['id'] = filter_var($ride['link'], FILTER_SANITIZE_NUMBER_INT) + rand(0, 200);
          $ride['idtype'] = "kangaride";
          $ride['dates'] =  $lastDate; //poollist find
          $ride['username'] = "n/a";
          $ride['origin'] = $aRide->find('strong', 0)->plaintext;
          $ride['destination'] = $aRide->find('strong', 1)->plaintext;
          $ride['desc'] = $aRide->find('.pickupDetails', 0)->plaintext . " → " .$aRide->find('.pickupDetails', 1)->plaintext;
          $ride['price'] = $price_full;
          $ride['price2'] = $price;
          $ride['img'] = "img/noprofile.jpg";
          $ride['iconPath'] = "img/kangaride.ico";
          $ride['infoWindowIcon'] = "img/kangaride.png";
          $output[] = $ride;
      }
    }
  }

 if ($country == "NA") {
    $url = "http://www.zimride.com/search";
    $qry_str = "?date={$startDate}&e={$endLocation}&s={$startLocation}&filterSearch=true&filter_type=offer";
    $url = $url.$qry_str;
    $html = file_get_contents($url);
    
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
      if ($ride['img'] = $aRide->find('img', 0)->src) {
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
        $ride['price2'] = $price;

        $output[] = $ride;
      }
    }

  }

  if ($country == "NA") {
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
        $ride['idtype'] = "ridejoy";
        $ride['dates'] = $date;
        $ride['img'] = $aRide->find('img', 0)->src;
        $ride['origin'] = trim($aRide->find('.origin', 0)->plaintext);
        $ride['destination'] = trim($aRide->find('.destination', 0)->plaintext);
        $ride['desc'] = trim($aRide->find('.extra_info', 0)->plaintext);
        $ride['price'] = $price_full;
        $ride['price2'] = $price;
        $ride['iconPath'] = "img/ridejoy.ico";
        $ride['infoWindowIcon'] = "img/ridejoy.png";
        $ride['link'] = trim($aRide->find('.view_details', 0)->href);

        $output[] = $ride;
      }
    }
  }

  if ($country == "world") {
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
<?php
  error_reporting(1);

  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  require_once('../../simple_html_dom.php');

  // "ridejoy", "kangaride", "craiglist" ..
  $idtype = $_GET["idtype"];

  // "Montreal, QC, Canada"
  $startLocation = urlencode($_GET["sloc"]);
  $endLocation = urlencode($_GET["eloc"]);

  // "06/27/2013"
  $startDate = urlencode($_GET["sdate"]);

  // 45.50770
  $origLat = $_GET["origlat"];
  $origLon = $_GET["origlon"];

  // -73.55417808195186
  $destLat = $_GET["destlat"];
  $destLon = $_GET["destlon"];

  // "QC"
  $origState = isset($_GET["origState"]) ? $_GET["origState"] : '';
  $destState = isset($_GET["destState"]) ? $_GET["destState"] : '';

  // "Quebec City", "Toronto", "Montreal"
  $origCity = explode(',', urldecode($startLocation));
  $origCity = str_replace(array("é", "è"), "e", $origCity[0]);
  $destCity = explode(',', urldecode($endLocation));
  $destCity = str_replace(array("é", "è"), "e", $destCity[0]);

  // "CA"
  $origCountry = $_GET["origCountry"];
  $destCountry = $_GET["destCountry"];

  // Just want one of them - i.e: As long as one of the cities is in US/CA
  $country = $origCountry ? $origCountry : $destCountry;

  // 1
  $page = $_GET["page"];

  // Telling the crawler what to load because some feeds don't support all
  // countries, thus saving performance for the end user by not doing
  // unecessary HTTP requests.
  if (!$country) {
    $country = "world";
  } elseif ($country == "CA" || $country == "US") {
    $country = "NA";
  } else {
    $country = "world";
  }

  // "3"
  $guests = $_GET["guests"];
  $guests = 0 + $guests;

  $output = array();

  $poolList = new simple_html_dom();

  // Start the crawling
  switch ($idtype) {
    case 'blablacar':
      if ($country == "world") {
        $url = "http://www.blablacar.com/search-car-sharing-result";
        $startDate2 = '';
        if ($startDate) {
          $startDate2 = urldecode($startDate);
          $startDate2 = explode("/", $startDate2);
          $startDate2 = $startDate2[1]."/".$startDate2[0]."/".$startDate2[2];
          $startDate2 = urlencode($startDate2);
        }
        $qry_str = "?db={$startDate2}&fn={$startLocation}&tn={$endLocation}&sort=trip_date&order=asc&page={$page}";
        $url = $url.$qry_str;
        $html = file_get_contents($url);
        $poolList->load($html);
        foreach($poolList->find('.trip') as $aRide) {
          $price_full = $aRide->find('.price', 0)->plaintext;
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
          $ride['uri'] = str_replace('http://www.blablacar.com/', '', $ride['link']);
          $ride['id'] = filter_var($ride["uri"], FILTER_SANITIZE_NUMBER_INT);
          $ride['idtype'] = "blablacar";
          $datetime = explode("-", $aRide->find('.time', 0)->plaintext);
          $ride['date'] = trim($datetime[0]);
          $ride['time'] =  trim($datetime[1]);
          $ride['timestamp'] = strtotime($ride['date']. " ".  $ride['time']);
          if (!$ride['timestamp'])
            $ride['timestamp'] = strtotime($ride['date']. " 2013 ".  $ride['time']);
          if (!$ride['timestamp'])
            $ride['timestamp'] = strtotime($ride['date']);
          $ride['username'] = $aRide->find('.username', 0)->plaintext;
          $ride['iconPath'] = "img/blablacar.ico";
          $ride['infoWindowIcon'] = "img/blablacar.png";
          $origin = str_replace("'", "", $aRide->find('.geo-from .tip', 0)->plaintext);
          $origin = explode(",", $origin);
          $ride['origin'] = $origin[0];

          $destination = $aRide->find('.geo-to .tip', 0)->plaintext;
          $destination = explode(",", $destination);
          $ride['destination'] = $destination[0];
          $ride['desc'] = $aRide->find('.fromto', 0)->plaintext;
          $ride['price'] = $price;
          $output[] = $ride;
        }
      }
      break;

    case 'craigslist':
      if (!empty($startLocation) && !empty($endLocation) && $country === "NA") {
        $page = 0 + $page - 1;
        $timestamp = empty($startDate) ? strtotime("today") : strtotime(urldecode($startDate));
        $date = empty($startDate) ? date("F", $timestamp) : date("F jS", $timestamp);
        $filter = urlencode("{$destCity} {$date}");
        $url = "http://search.3taps.com/?auth_token=c19ae6773494ae4d0a4236c59eeaaf39";
        $qry_str = "&category=CRID&lat={$origLat}&long={$origLon}&radius=20mi&page={$page}&heading={$filter}";
        $extra = "&rpp=100&retvals=id,account_id,source,category,category_group,location,external_id,external_url,heading,body,timestamp,expires,language,price,currency,images,annotations,status,immortal";
        $url = $url.$extra.$qry_str;
        $html = file_get_contents($url);
        $json = json_decode($html);
        $dups = array();
        foreach ($json->postings as $key => $aRide) {
          $heading = $aRide->heading;

          $ride['price'] = filterPrice($aRide->heading);
          if (property_exists($aRide, "body")) {
            $ride['desc'] = $aRide->body;
            if (!$ride['price']) {
              $ride['price'] = filterPrice($aRide->body);
            }
          }

          $ride['timestamp'] = filterTime($heading, date("F", $timestamp));
          if ($ride['price'] && $ride['timestamp']) {
            if (in_array($heading, $dups)) {
              continue;
            }
            $dups[] = $heading;
            $ride['sim'] = array();
            $dupDetected = false;
            foreach ($dups as $string) {
              similar_text($heading, $string, $pc);
              if ($pc >= 75 && $pc != 100) {
                $ride['sim'][] = $pc;
                $dupDetected = true;
                continue;
              }
            }

            if ($dupDetected) {
              continue;
            }

            $ride['idtype'] = "craigslist";
            $ride['origin'] = $origCity;
            $ride['destination'] = $destCity;
            $ride['link'] = $aRide->external_url;
            $ride['id'] = $aRide->id;
            $ride['uri'] = $aRide->id;
            $ride['date'] = $heading;
            $ride['seat'] = "1-5";
            $ride['time'] = "";
            $ride['img'] = "img/noprofile.jpg";
            $ride['infoWindowIcon'] = "img/craigslist.png";

            $output[] = $ride;
          }
        }
      }
      break;

    case 'kangaride':
      if ($country == "NA" && ($origCountry == "CA" || $destCountry == "CA")) {
        $origState = $origState ? $origState."/" : '';
        $destState = $destState ? $destState."/" : '';
        $origCity = $origCity == "Quebec City" ? "Quebec" : $origCity;
        $destCity = $destCity == "Quebec City" ? "Quebec" : $destCity;
        if ($origCity && $destCity) {
          $origCity = str_replace(' ', '_', $origCity);
          $destCity = str_replace(' ', '_', $destCity);
          $uri = "rideshares_from_{$origCity}_to_{$destCity}.html";
        } elseif ($origCity) {
          $origCity = str_replace(' ', '_', $origCity);
          $uri = "rideshares_from_{$origCity}.html";
        } elseif ($destCity) {
          $destCity = str_replace(' ', '_', $destCity);
          $uri = "rideshares_to_{$destCity}.html";
        }

        $startDate2 = '';
        if ($startDate) {
          $startDate2 = urldecode($startDate);
          $startDate2 = explode("/", $startDate2);
          $startDate2 = $startDate2[2]."-".$startDate2[0]."-".$startDate2[1];
          $startDate2 = '?startDate='.$startDate2; // startDate=2013-05-12
        }

        $endDate2 = '';
        if (isset($endDate)) {
          $endDate2 = urldecode($endDate);
          $endDate2 = explode("/", $endDate2);
          $endDate2 = $endDate2[2]."-".$endDate2[0]."-".$endDate2[1];
          if ($startDate) {
            $endDate2 = '&endDate='.$endDate2; // startDate=2013-05-12
          } else {
            $endDate2 = '?endDate='.$endDate2;
          }
        }

        if (!$startDate2 && !$endDate2) {
          $kangaPage = "?&p={$page}";
        } else {
          $kangaPage = "&p={$page}";
        }
        $qry_str = $origState.$destState.$uri.$startDate2.$endDate2.$kangaPage;
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

        $vroom = $poolList->find('table');
        $notif = $poolList->find('#notificationText', 0);
        $valid = true;
        if (empty($notif)) {
          $valid = true;
        } else {
          if ($notif->next_sibling()->getAttribute('id') === "sorryNoResults") {
            $valid = false;
          } else {
            $valid = true;
          }
        }
        if (isset($vroom[4]) && $valid) {
          $lastDate = $vroom[4]->find('tr', 0)->plaintext;
          foreach($vroom[4]->find('tr') as $aRide) {
            $seat = 0;
            foreach ($aRide->find('img[alt="White Man"]') as $guy) {
              $seat++;
            }

            if ($seat) {
              if ($guests > $seat) {
                continue;
              }
              $ride['seat'] = $seat;
            } else {
              continue;
            }

            if (!$aRide->prev_sibling()->hasAttribute('class')) {
              $lastDate = $aRide->prev_sibling()->plaintext;
            }

            $price_full = $aRide->find('.itineraryPrice', 0)->plaintext;
            $price = 0 + $price_full;
            $link = $aRide->getAttribute('onclick');
            $ride['link'] = str_replace($crap, '', $link);
            $cleanLink = str_replace("http://www.kangaride.com/", '', $ride['link']);
            $ride['id'] = explode("/", $cleanLink);
            $ride['id'] = $ride['id'][1];
            $ride['uri'] = $ride['id'];
            $ride['idtype'] = "kangaride";
            $ride['date'] =  $lastDate; //poollist find
            $ride['time'] = str_replace("Noon", "12", trim($aRide->find('.datetime', 0)->plaintext));
            $ride['timestamp'] =  strtotime($lastDate . " " . $ride['time']);
            if (!$ride['timestamp']) {
              $ride['timestamp'] =  strtotime($lastDate);
            }
            $ride['username'] = "n/a";
            $ride['origin'] = $aRide->find('strong', 0)->plaintext;
            $ride['origin'] = $ride['origin'] == "Québec" ? "Quebec city" : $ride['origin'];
            $ride['destination'] = $aRide->find('strong', 1)->plaintext;
            $ride['destination'] = $ride['destination'] == "Québec" ? "Quebec city" : $ride['destination'];
            $ride['desc'] = "";
            $ride['location1'] = str_replace("'", "", $aRide->find('.pickupDetails', 0)->plaintext);
            $ride['location2'] = str_replace("'", "", $aRide->find('.pickupDetails', 1)->plaintext);
            $ride['price'] = $price;
            $ride['img'] = "img/noprofile.jpg";
            $ride['iconPath'] = "img/kangaride.ico";
            $ride['infoWindowIcon'] = "img/kangaride.png";
            $output[] = $ride;
          }
        }
      }
      break;

    case 'ridejoy':
      if ($page == 1) {
        $url = "http://ridejoy.com/rides/search";
        $qry_str = "?type=ride_request&origin={$startLocation}&origin_latitude={$origLat}&origin_longitude={$origLon}&destination={$endLocation}&destination_latitude={$destLat}&destination_longitude={$destLon}&date={$startDate}";
        $url = $url.$qry_str;
        $html = file_get_contents($url);

        $poolList->load($html);
        $idarr = array();

        foreach($poolList->find('.date') as $aBlock) {
          $date = $aBlock->find('.date_header', 0)->plaintext;
          foreach($aBlock->find('.result') as $aRide) {
            $ride['id'] = $aRide->getAttribute("data-ride-id");
            if (in_array($ride['id'], $idarr)) {
              continue;
            }
            $idarr[] = $ride['id'];

            $ride['origin'] = trim($aRide->find('.origin', 0)->plaintext);
            $ride['destination'] = trim($aRide->find('.destination', 0)->plaintext);
            if (isset($origCity) && isset($destCity)) {
              if ($ride['origin'] === $origCity) {

              } else if ($ride['destination'] === $destCity) {

              } else {
                continue;
              }
            }
            $price_full = trim($aRide->find('.seats_container', 0)->plaintext);
            $price = 0 + substr($price_full, 1);
            $ride['idtype'] = "ridejoy";
            $ride['date'] = $date;
            $ride['img'] = $aRide->find('img', 0)->src;
            $ride['desc'] = str_replace(array("'", "&#x27;", "&quot;"), "", $aRide->find('.extra_info', 0)->plaintext);
            $ride['price'] = $price;
            $ride['iconPath'] = "img/ridejoy.ico";
            $ride['infoWindowIcon'] = "img/ridejoy.png";
            $ride['link'] = $aRide->find('.view_details', 0)->href;
            $ride['uri'] = $ride['id'];
            $ride['seat'] = "1-5";
            // im actually lieing here since  ridejoy isnt giving it on the go
            $ride['time'] = "Anytime";
            $ride['timestamp'] = strtotime($date. "12:00");
            $output[] = $ride;
          }
        }
      }
      break;

    case 'zimride':
      if ($page == 1) {
        $url = "http://www.zimride.com/search";
        $qry_str = "?date={$startDate}&e={$endLocation}&s={$startLocation}&filterSearch=true&filter_type=offer&pageID={$page}";
        $url = $url.$qry_str;
        $html = file_get_contents($url);

        $poolList->load($html);

        if ($lastDate = $poolList->find('h3.headline span', 0)) {
          $lastDate = $lastDate->plaintext;
          $lastDate = explode("&mdash;", $lastDate);
          if ($lastDate[1])
            $lastDate = $lastDate[1];
          else
            $lastDate = substr($lastDate[0], 10);
        }

        foreach($poolList->find('.ride_list a') as $aRide) {
         if ($aRide->find('img', 0)) {
           $ride['img'] = $aRide->find('img', 0)->src;
           if ($seat = $aRide->find('.count', 0)) {
             $seat = $seat->plaintext;
             $seat = 0 + $seat;
             if ($guests  > $seat) {
               continue;
             }
             $ride['seat'] = $seat;
           } else {
             continue;
           }

           $originfull = $aRide->find('.inner', 0)->innertext;
           $origin = explode('<span class="trip_type one_way"></span>', $originfull);

           if (!isset($origin[1])) {
             $origin = explode('<span class="trip_type round_trip"></span>', $originfull);
           }

           $ride['iconPath'] = "img/zimride.ico";
           $ride['infoWindowIcon'] = "img/zimride.png";
           $ride['origin'] = trim($origin[0]);
           $ride['destination'] = trim($origin[1]);
           if (isset($origCity) && isset($destCity)) {
             if ($ride['origin'] === $origCity) {

             } else if ($ride['destination'] === $destCity) {

             } else {
               continue;
             }
           }

           if ($aRide->prev_sibling()->hasAttribute('class')) {
             $lastDate = $aRide->prev_sibling()->plaintext;
             $lastDate = explode("&mdash;", $lastDate);
             if (isset($lastDate[1]))
               $lastDate = $lastDate[1];
             else
               $lastDate = substr($lastDate[0], 10);
           }
           $price_full = $aRide->find('.price_box p', 0)->plaintext;
           $price = 0 + substr($price_full, 1);
           $ride['link'] = $aRide->href;
           $ride['link'] = str_replace('&searchPageID=1', '', $ride['link']);
           $ride['id'] = filter_var($ride['link'], FILTER_SANITIZE_NUMBER_INT);
           $ride['uri'] = $ride['id'];
           $ride['idtype'] = "zimride";
           $ride['date'] =  $lastDate; //poollist find
           $ride['username'] = $aRide->find('.username', 0)->plaintext;

           $desc = str_replace("'", "", $aRide->find('h4', 0)->plaintext);
           $desc = explode('/', $desc);
           if (isset($desc[2])) {
             $ride['time'] = str_replace("Departs", "", $desc[2]);
             $ride['desc'] = $desc[0].$desc[1];
           } else {
             $ride['time'] = str_replace("Departs", "", $desc[1]);
             $ride['desc'] = $desc[0];
           }
           $ride['timestamp'] = false;
           $ride['time'] = preg_replace("/\s|&nbsp;/",'',$ride['time']);
           switch ($ride['time']) {
             case 'Morning':
               $ride['timestamp'] = strtotime($lastDate . "9:00");
               break;
             case 'Anytime':
               $ride['timestamp'] = strtotime($lastDate. "12:00");
               break;
             case 'Afternoon':
               $ride['timestamp'] = strtotime($lastDate. "15:00");
               break;
             case 'Evening':
               $ride['timestamp'] = strtotime($lastDate . "18:00");
               break;
             case 'Night':
               $ride['timestamp'] = strtotime($lastDate . "21:00");
               break;
             default:
               $ride['timestamp'] =  strtotime($lastDate . $ride['time']);
               break;
           }
           if (!$ride['timestamp']) {
             $ride['timestamp'] = strtotime($lastDate);
           }
           $ride['price'] = $price;

           $output[] = $ride;
          }
        }
      }
      break;
  }

  echo $_GET['callback'] . '('.json_encode($output).')';


function filterPrice($text) {
  $text = strtolower($text);
  $keywords = array('megabus', 'ticket', 'mega bus');
  foreach ($keywords as $value) {
    $needle = strpos($text, $value);
    if ($needle || $needle === 0) {
      return false;
    }
  }

  $pos = strpos($text, '$');

  if ($pos === 0 || $pos) {
    $price = 0 + filter_var(substr($text,  $pos, 4), FILTER_SANITIZE_NUMBER_INT);
    if ($price <= 1) {
      $price = 0 + filter_var(substr($text,  $pos - 4, 4), FILTER_SANITIZE_NUMBER_INT);
    }
  } else {
    $price = false;
  }

  return $price;
}

function filterTime($text, $m) {
  $text = strtolower($text);
  $pos = strpos($text, strtolower($m));

  if ($pos === 0 || $pos) {
    $day = 0 + filter_var(substr($text, $pos + strlen($m), 3), FILTER_SANITIZE_NUMBER_INT);
    if ($day < 1) {
      $day = 0 + filter_var(substr($text, $pos - 8, 3), FILTER_SANITIZE_NUMBER_INT);
    }
  } else {
    $day = date("Y");
  }

  $date = strtotime($m." ".$day);
  if (strtotime("today") <= $date) {
    return $date;
  } else {
    return false;
  }
}
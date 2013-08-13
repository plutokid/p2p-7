<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true' );
  require_once('../../simple_html_dom.php');
  $url = urldecode($_GET["uri"]);
  $idtype = $_GET["idtype"];

  switch ($idtype) {
    case 'kangaride':
      $json = kangaride($url);
      break;
    case 'zimride':
      $json = zimride($url);
      break;
    case 'ridejoy':
      $json = ridejoy($url);
      break;
    case 'blablacar':
      $json = blablacar($url);
      break;
    case 'craigslist':
      $json = craigslist($url);
      break;
    case 'ridester':
      $json = ridester($url);
      break;
  }
  echo $_GET['callback'] . '('.$json.')';

  // START THE FUNCTIONS
  function blablacar($url) {
    global $idtype;
    $url = "http://www.blablacar.com/".$url;
    $html = file_get_contents($url);
    $single = new simple_html_dom();
    $single->load($html);

    $json = array();

    $json['provider'] = "BlaBlaCar";
    $json["price"] = trim($single->find('.big-price', 0)->plaintext);

    $json["date"] = trim($single->find('strong', 3)->plaintext);
    $json["date"] .= " at " . trim($single->find('strong', 4)->plaintext);

    $json["origin"] = trim($single->find('.display-map', 1)->plaintext);
    $json["destination"] = trim($single->find('.display-map', 2)->plaintext);

    $json["description"] = trim($single->find('.comment-trip', 0)->plaintext);
    $json["numOfSeats"] = trim($single->find('.seats-available', 0)->plaintext) + 0;

    $json["link"] = $url;

    $json["profile_pic"] = $single->find('.user-picture', 0)->src;
    $json["name"] = trim($single->find('.user-infos-general a', 0)->plaintext);
    $json["age"] = trim($single->find('.user-infos-general li', 1)->plaintext);
    $json["logopath"] = "img/blablacar-final.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "BlaBlaCar connects drivers with empty seats and people travelling the same way - Over 3 Million trusted members saving up to 70% on inter-city travel!";

    foreach ($single->find(".verification-list .checked") as $label) {
      $json["labels"][] = trim($label->plaintext);
    }
    foreach ($single->find(".user-summary .tip") as $label) {
      $json["labels"][] = trim($label->plaintext);
    }

    return json_encode($json);
  }

  function craigslist($id) {
    global $idtype;
    $url = "http://search.3taps.com/?auth_token=c19ae6773494ae4d0a4236c59eeaaf39&id={$id}";
    $extra = "&retvals=id,account_id,source,category,category_group,location,external_id,external_url,heading,body,timestamp,expires,language,price,currency,images,annotations,status,immortal";
    $url = $url.$extra;
    $html = file_get_contents($url);
    $single = json_decode($html);

    $single = $single->postings;
    $json = array();
    if (empty($single)) {
      $json["date"] = "";
    } else {
      $single = $single[0];
      $filter_list = array(
        ' to ', ' / ', '--gt;', ' - ', '-', ' -> ', ' > ', ' → ', ' -', '- ', ' from ', '.'
      );

      $heading = strtolower($single->heading);
      $source_loc = strtolower($single->annotations->source_loc);
      $explodedLoc = explode($source_loc, $heading);
      if (isset($explodedLoc[1])) {
        if (!empty($explodedLoc[0])) {
          $newDest = urlencode(preg_replace("/[^A-Za-z]/", '', $explodedLoc[0]));
          $geourl = "http://maps.googleapis.com/maps/api/geocode/json?address={$newDest}&sensor=false";
          $geocode = file_get_contents($geourl);
          $geocode = json_decode($geocode);
          if ($geocode->status === "ZERO_RESULTS") {
            $json["destination"] = null;
          } else {
            $json["destination"] = $geocode->results[0]->formatted_address;
          }
        }
        $address = $explodedLoc[1];
      } else {
        $address = $explodedLoc[0];
      }

      if (!isset($json["destination"])) {
        $length = strlen($address);
        for ($i=0; $i < count($filter_list); $i++) {
          $newDest = explode($filter_list[$i], $address);
          if (isset($newDest[1]) && strlen($newDest[1]) !== $length) {
            break;
          }
        }
        $newDest = urlencode($newDest[1]);
        $geourl = "http://maps.googleapis.com/maps/api/geocode/json?address={$newDest}&sensor=false";
        $geocode = file_get_contents($geourl);
        $geocode = json_decode($geocode);
        $json["destination"] = $geocode->results[0]->formatted_address;
      }

      $geourl = "http://maps.googleapis.com/maps/api/geocode/json?address={$source_loc}&sensor=false";
      $geocode = file_get_contents($geourl);
      $geocode = json_decode($geocode);
      $json["origin"] = $geocode->results[0]->formatted_address;

      $json["price"] = "";
      $json['price'] = filterPrice($heading);

      if (property_exists($single, "body")) {
        $json['description'] = $single->body;
        if (!$json['price']) {
          $json['price'] = filterPrice($single->body);
        }
      }

      $json['provider'] = "Craigslist";
      $json['price'] = '$'.$json['price'];
      $json["date"] = $heading;

      $json["numOfSeats"] = "1-5";

      $json["link"] = $single->external_url;
      $json["id"] = $single->id;

      $json["profile_pic"] = "img/rsz_noavatar.png";
      $json["name"] = "";
      $json["age"] = "&nbsp;";
      $json["logopath"] = "img/craigslist_hp.png";
      $json["idtype"] = $idtype;
      $json["logodesc"] = "Craigslist has thousands of classifieds not limited to vacation rentals and rideshares.";

      $json["labels"] = array();
      if (property_exists($single->annotations, "phone")) {
        $json["labels"][] = "<b>Phone: </b>".$single->annotations->phone;
      }
      if (property_exists($single->annotations, "source_account")) {
        $json["labels"][] = "<b>Email: </b>".$single->annotations->source_account;
      }
    }
    return json_encode($json);
  }

  function kangaride($url) {
    global $idtype;
    $filter = array("&amp;#8234;", "&amp;#8235;", "&amp;#8236;", "Sortie Crémazie Sud, ");
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
    $url = "http://www.kangaride.com/".$url;
    $html = file_get_contents($url, false, $context);
    $html = mb_convert_encoding($html, 'UTF-8', mb_detect_encoding($html, 'UTF-8, ISO-8859-1', true));

    $single = new simple_html_dom();
    $single->load($html);
    $json = array();

    $json['provider'] = "Kangaride";
    $title = trim($single->find('#content h2', 0)->plaintext);
    $json["price"] = substr($title, -5) + 0;
    $json["price"] = '$'.$json["price"];
    $title = explode("(", $title);

    $json["date"] = $title[0];
    $json["origin"] = explode(")", $title[1]);
    $json["origin"] = trim($json["origin"][1]);

    $json["destination"] = explode(")", $title[2]);
    $json["destination"] = $json["destination"][1];
    $json["destination"] = trim(str_replace(" to ", "", $json["destination"]));

    if ($json["origin"] === "Québec") {
      $json["origin"] = "Quebec City";
    } else if ($json["destination"] === "Québec") {
      $json["destination"] = "Quebec City";
    }

    $desc = $single->find('em', 0);
    if (isset($desc)) {
      $json["description"] = trim(str_replace(array("«", "»"), "", $desc->plaintext));
    } else {
      $json["description"] = "";
    }
    $json["numOfSeats"] = count($single->find('option'));

    $cc = $single->find('#content .info', 0);
    $cc2 = $single->find('#content .info', 1);
    $f_meeting_loc = $cc->find('small', 0);
    $f_drop_loc = $cc2->find('small', 0);
    if (isset($f_meeting_loc)) {
      $json["f_meeting_loc"] = str_replace($filter, '', trim($f_meeting_loc->plaintext));
    } else {
      $json["f_meeting_loc"] = "";
    }
    if (isset($f_drop_loc)) {
      $json["f_drop_loc"] = str_replace($filter, '', trim($f_drop_loc->plaintext));
    } else {
      $json["f_drop_loc"] = "";
    }

    $json["s_meeting_loc"] = trim($single->find('#content .info', 0)->find('p', 0)->plaintext);
    $json["s_drop_loc"] = trim($single->find('#content .info', 1)->find('p', 0)->plaintext);

    $json["link"] = $url;

    $json["profile_pic"] = "img/rsz_noavatar.png";
    $json["name"] = "";
    $json["age"] = "&nbsp;";
    $json["logopath"] = "img/kangaride_logo_edited.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "Kangaride is a reliable, well supervised rideshare and carpooling service for Canada and the United States.";

    foreach ($single->find("#ridePrefsLegend .label") as $label) {
      $json["labels"][] = trim($label->plaintext);
    }

    return json_encode($json);
  }

  function ridejoy($url) {
    global $idtype;
    $url = "http://www.ridejoy.com/".$url;
    $html = file_get_contents($url);
    $single = new simple_html_dom();
    $single->load($html);

    $json = array();
    $title = trim($single->find('.info', 3)->plaintext);
    $title = explode('$', $title);
    $json["price"] = $title[1] + 0;
    $json["price"] = '$'.$json["price"];

    $json["date"] = trim($single->find('.info', 2)->plaintext);

    $fromTo = trim($single->find('.info', 1)->plaintext);
    $fromTo = explode("&rarr;", $fromTo);
    $json["origin"] = trim($fromTo[0]);
    $json["destination"] = trim($fromTo[1]);

    $json["description"] = trim($single->find('.section_content div', 0)->plaintext);
    $json["numOfSeats"] = filter_var($title[0], FILTER_SANITIZE_NUMBER_INT);

    $json["link"] = $url;
    $json['provider'] = "Ridejoy";

    $json["profile_pic"] = $single->find('.thumb_180', 0)->src;
    $json["name"] = trim($single->find('.details div', 2)->plaintext);
    $json["age"] = "&nbsp;";
    $json["logopath"] = "img/ridejoy_logo_edited.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "Ridejoy is a community marketplace for sharing rides. If you're going on a trip, you can list extra seat space in your car, and if you need to get somewhere, you can find a ride, using our site. Happy rideshares and carpools!";

    $json["labels"] = array();
    foreach ($single->find(".addon") as $label) {
      $json["labels"][] = $label->plaintext;
    }

    $tmp = $single->find('.verifications', 0);
    if (isset($tmp)) {
      $json["labels"][] = trim($single->find('.verifications', 0)->plaintext);
    }
    return json_encode($json);
  }

  function zimride($url) {
    global $idtype;
    $url = "http://www.zimride.com/".$url;
    $html = file_get_contents($url);
    $single = new simple_html_dom();
    $single->load($html);

    $json = array();
    $json["isReturn"] = trim($single->find('.legs_booked', 0)->plaintext);
    $json["date"] = trim($single->find('#detail h3', 0)->plaintext);

    $json["price"] = filter_var(trim($single->find('.template', 0)->plaintext), FILTER_SANITIZE_NUMBER_INT);

    $json["price"] = str_replace("-", "$", $json["price"]);

    $json["origin"] = trim($single->find('.start', 0)->plaintext);
    $json["destination"] = trim($single->find('.end', 0)->plaintext);

    $json["description"] = "";
    $desc = $single->find('.notes', 0);
    if (isset($desc)) {
      $json["description"] = trim($desc->plaintext);
    }
    $json["numOfSeats"] = trim($single->find('.seats strong', 0)->plaintext) + 0;

    $json["link"] = $url;

    $json["f_meeting_loc"] = trim($single->find('.locations .start', 0)->plaintext);
    $json["f_drop_loc"] = trim($single->find('.locations .end', 0)->plaintext);

    $json["profile_pic"] = str_replace(array("x:75/y:75", "x:27/y:27"), "x:225/y:225", $single->find('.head .pic .requires_login img', 0)->src);
    $json["name"] = trim($single->find('.name', 0)->plaintext);
    $json["age"] = "&nbsp;";

    $json["labels"] = array();
    $json['provider'] = "Zimride";

    $nosmoke = $single->find('.nosmoke', 0);
    if (isset($nosmoke)) {
      $json["labels"][] = "This car is non-smoking";
    }
    $rate = $single->find('.rate', 0);
    if (isset($rate)) {
      $json["labels"][] = trim($rate);
    }
    $time = $single->find('.time', 0);
    if (isset($time)) {
      $json["labels"][] = trim($time);
    }
    $fb = $single->find('.networks li', 0);
    if (isset($fb)) {
      $json["labels"][] = trim($fb);
    }
    $aboutme = $single->find('.about_me', 0);
    if (isset($aboutme)) {
      $json["labels"][] = trim($aboutme);
    }
    $json["logopath"] = "img/zimride-final.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "Zimride is a social ridesharing community, where drivers can sell the empty seats in their car and passengers can buy them.";

    if ($json["isReturn"] == "Return Trip") {
      $temp = $json["origin"];
      $json["origin"] = $json["destination"];
      $json["destination"] = $temp;

      $temp = $json["f_meeting_loc"];
      $json["f_meeting_loc"] = $json["f_drop_loc"];
      $json["f_drop_loc"] = $temp;
    }

    return json_encode($json);
  }

  function ridester($url) {
    global $idtype;
    $url = "http://api.outpost.travel/ridester/id={$url}";
    $html = file_get_contents($url);
    return $html;
  }

function filterPrice($text) {
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

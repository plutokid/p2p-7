<?php
  error_reporting(0);

  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  require_once('../../simple_html_dom.php');

  $idtype = $_GET["idtype"];
  $elocation = $_GET["eloc"];
  $page = $_GET["page"];

  $location = explode(",", $elocation);
  $location = $location[0];

  $location = urlencode($location);
  $elocation = urlencode($elocation);

  $tourList = new simple_html_dom();
  $output = array();

  // Start the crawling
  switch ($idtype) {
    case 'vayable':
      $url = "https://www.vayable.com/experiences/search";
      $qry_str = "?&query={$location}&page={$page}";
      $url = $url.$qry_str;
      $html = file_get_contents($url);

      $tourList->load($html);

      if (!$tourList->find(".noresults")) {
        foreach($tourList->find('.trip-card') as $aTrip) {
          $price_full = str_replace(' ', '', trim($aTrip->find('.amount', 0)->plaintext));
          $price = 0 + substr($price_full, 1);
          $trip['id'] = 0 + filter_var($aTrip->find('a', 0)->href, FILTER_SANITIZE_NUMBER_INT);
          $trip['idtype'] = "vayable";
          $trip['uri'] = $trip['id'];
          $trip['infoWindowIcon'] = "img/vayable.png";
          $trip['profileImg'] = "img/noprofile.jpg";
          $trip['img'] = extract_unit($aTrip->find('.card', 0)->getAttribute("style"), "'", "'");
          $trip['origin'] = trim($aTrip->find('.tagline', 0)->plaintext);
          $trip['origin'] = $trip['origin'] == "Quebec, Canada" ? "Quebec city" : $trip['origin'];
          $trip['desc'] = str_replace("'", "", trim($aTrip->find('.title', 0)->plaintext));
          $trip['price'] = $price;
          $trip['link'] = "https://www.vayable.com".$aTrip->find('a', 0)->href;
          $output[] = $trip;
        }
      }
      break;
  }

  echo $_GET['callback'] . '('.json_encode($output).')';



function extract_unit($string, $start, $end) {
  $pos = stripos($string, $start);

  $str = substr($string, $pos);

  $str_two = substr($str, strlen($start));

  $second_pos = stripos($str_two, $end);

  $str_three = substr($str_two, 0, $second_pos);

  $unit = trim($str_three); // remove whitespaces

  return $unit;
}

?>

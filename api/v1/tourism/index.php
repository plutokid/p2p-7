<?php
  require_once('../../simple_html_dom.php');
  $location = urlencode($_GET["eloc"]);
  $page = $_GET["page"];

  if (!$page)
    $page = 1;

  $url = "https://www.vayable.com/experiences/search";
  $qry_str = "?&query={$location}&page={$page}";
  $url = $url.$qry_str;
  $html = file_get_contents($url);

  $tourList = new simple_html_dom();
  $tourList->load($html);
  $output = array();

  if (!$tourList->find(".noresults")) {
    foreach($tourList->find('.trip-card') as $aTrip) {
      $price_full = str_replace(' ', '', trim($aTrip->find('.amount', 0)->plaintext));
      $price = 0 + substr($price_full, 1);
      $trip['id'] = substr($aTrip->find('a', 0)->href, 13, 4) + 0;
      $trip['idtype'] = "vayable";
      $trip['infoWindowIcon'] = "img/vayable.png";
      $trip['profileImg'] = "img/noprofile.jpg";
      $trip['img'] = extract_unit($aTrip->find('.card', 0)->getAttribute("style"), "'", "'");
      $trip['origin'] = trim($aTrip->find('.tagline', 0)->plaintext);
      $trip['desc'] = str_replace("'", "", trim($aTrip->find('.title', 0)->plaintext));
      $trip['price'] = $price_full;
      $trip['price2'] = $price;
      $trip['infoWindowIcon'] = "img/vayable.png";
      $trip['link'] = "https://www.vayable.com".$aTrip->find('a', 0)->href;
      $output[] = $trip;
    }
  }

  $str = json_encode($output);
  echo $str;


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
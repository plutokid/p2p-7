<?php
  error_reporting(0);

  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true' );
  require_once('../../simple_html_dom.php');
  $url = urldecode($_GET["uri"]);
  $idtype = $_GET["idtype"];

  switch ($idtype) {
    case 'vayable':
      $json = vayable($url);
      break;
  }
  echo $_GET['callback'] . '('.$json.')';

  // START THE MADDNESS
  function vayable($url) {
    global $idtype;
    $uri = $url;
    $url = "https://www.vayable.com/experiences/" . $url;
    $html = file_get_contents($url);
    $single = new simple_html_dom();
    $single->load($html);

    $json["title"] = trim($single->find('.trip-title h1', 0)->plaintext);
    $json["location"] = trim($single->find('.trip-header-prop', 0)->plaintext);
    $json["duration"] = trim($single->find('.trip-header-prop', 1)->plaintext);
    $json["amount"] = trim($single->find('.trip-header-prop', 2)->plaintext);

    $json["price"] = trim($single->find('.price', 0)->plaintext);
    $json["name"] = trim($single->find('.name', 0)->plaintext);
    $json["picture_url"] = trim($single->find('.user-picture', 1)->src);
    $json["image"] = trim($single->find('#trip-photos-carousel-0 img', 0)->src);

    $json["desc"] = trim($single->find('.trip-description', 0)->plaintext);
    $json["origin"] = trim($single->find('.text-center strong', 0)->plaintext);

    $json["logopath"] = "img/vayable_logo_edited.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "Vayable - Tours by locals and other things to do on vacation.";

    $json["link"] = $url;
    return json_encode($json);
  }

  function yesno($bool) {
    return $bool ? "Yes" : "No";
  }
?>

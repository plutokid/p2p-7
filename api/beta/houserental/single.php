<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true' );
  require_once('../../simple_html_dom.php');
  $url = urldecode($_GET["uri"]);
  $idtype = $_GET["idtype"];

  switch ($idtype) {
    case 'airbnb':
      $json = airbnb($url);
      break;
    case 'nflats':
      $json = nflats($url);
      break;
  }
  echo $_GET['callback'] . '('.$json.')';

  // START THE MADDNESS
  function airbnb($url) {
    global $idtype;
    file_get_contents("filename".$url);
  }
?>

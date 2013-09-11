<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true' );
  $url = urldecode($_GET["uri"]);
  $idtype = $_GET["idtype"];

  switch ($idtype) {
    case 'nflats':
      $json = nflats($url);
      break;
    case 'airbnb':
      $json = airbnb($url);
      break;
    case 'craigslist':
      $json = craigslist($url);
      break;
    case 'flipkey':
      $json = flipkey($url);
      break;
    case 'roomorama':
      $json = roomorama($url);
      break;
  }
  echo $_GET['callback'] . '('.$json.')';
?>

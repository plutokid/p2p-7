<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  $url = $_GET["uri"];
  $url = urldecode($url);
  $html = file_get_contents($url);
  echo $_GET['callback'] . '('.$html.')';
?>

<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  $json = file_get_contents("http://api.outpost.travel:8706/");
  echo "$json";
?>

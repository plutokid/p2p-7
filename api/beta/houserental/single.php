<?php
  header('Content-Type: application/json');
  header("Access-Control-Allow-Origin: *");
  $url = $_POST["uri"];
  $html = file_get_contents($url);
  echo $html;
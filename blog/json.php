<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  $json = file_get_contents("http://api.outpost.travel:8706/");
  if (isset($_GET['callback'])) {
    echo $_GET['callback'] . '('.$json.')';
  } else {
    echo json_encode($output);
  }
?>

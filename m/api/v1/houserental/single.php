<?php
  $url = $_POST["uri"];
  $html = file_get_contents($url);
  echo $html;
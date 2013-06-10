<?php
  header('Content-Type: application/javascript');
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true' );
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
    $uri = $url;
    $url = "https://api.airbnb.com/v1/listings/" . $url . "?key=d306zoyjsyarp7ifhu67rjxn52tv0t20";
    $html = file_get_contents($url);
    $single = json_decode($html);
    $single = $single->listing;

    $json["title"] = $single->name;
    $json["price"] = $single->price_formatted;
    $json["currency"] = $single->native_currency;
    $json["numOfBeds"] = $single->beds;
    $json["numOfBedrooms"] = $single->bedrooms;
    $json["house_rules"] = $single->house_rules;
    $json["link"] = "https://www.airbnb.com/rooms/".$uri;

    $json["picture_url"] = $single->user->user->picture_url;
    $json["name"] = $single->user->user->first_name;
    $json["response_time"] = "Responds ".$single->user->user->response_time;
    $json["amenities"] = $single->amenities;

    $json["city"] = $single->city;
    $json["property_type"] = $single->property_type;
    $json["room_type"] = $single->room_type;
    $json["address"] = $single->address;

    $json["logopath"] = "img/airbnb_logo_edited.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "Airbnb is the world leader in travel rentals, with more than 10 million nights booked worldwide. Discover amazing, unique accommodations in 192 countries.";

    $json["captions"] = $single->picture_captions;
    $json["imgs"] = $single->picture_urls;

    $json["lat"] = $single->lat;
    $json["lng"] = $single->lng;

    $json["desc"] = $single->description;

    $json["smallInfo"] = array();
    $json["smallInfo"][] = array(
      "Instant Bookable:",
      yesno($single->instant_bookable)
    );
    $json["smallInfo"][] = array(
      "Accommodates:",
      $single->person_capacity
    );
    $json["smallInfo"][] = array(
      "Cancellation:",
      $single->cancel_policy_short_str
    );
    $json["smallInfo"][] = array(
      "Bed Type:",
      $single->bed_type
    );
    $json["smallInfo"][] = array(
      "Bathrooms:",
      $single->bathrooms
    );
    $json["smallInfo"][] = array(
      "Minimum Stay:",
      $single->min_nights
    );
    $json["smallInfo"][] = array(
      "Extra People:",
      '$'."{$single->price_for_extra_person_native} {$json['currency']} / night after {$single->guests_included} guests"
    );
    $json["smallInfo"][] = array(
      "Security Deposit:",
      '$'.$single->security_deposit_native
    );
    $json["smallInfo"][] = array(
      "Check In:",
      $single->check_in_time.":00"
    );
    $json["smallInfo"][] = array(
      "Check Out:",
      $single->check_out_time.":00"
    );

    if ($single->reviews_count) {
      $json["review"] = array(
        "img" => $single->recent_review->review->reviewer->user->thumbnail_url,
        "name" => $single->recent_review->review->reviewer->user->first_name,
        "comment" => $single->recent_review->review->comments
      );
    } else {
      $json["review"] = false;
    }

    return json_encode($json);
  }

  function nflats($url) {
    global $idtype;
    $uri = $url;
    $url = "https://api.9flats.com/api/v3/places/" . $url . "?client_id=nubHrbRJUVPVlUjaH7SeO1RmmcZBug8Qm9Uyizus";
    $html = file_get_contents($url);
    $single = json_decode($html);
    $single = $single->place;

    $json["title"] = $single->place_details->name;
    $json["price"] = "$".round($single->pricing->price);
    $json["currency"] = $single->pricing->currency;
    $json["numOfBeds"] = $single->place_details->number_of_beds;
    $json["numOfBedrooms"] = $single->place_details->number_of_bedrooms;
    $json["house_rules"] = $single->place_details->house_rules;
    $json["link"] = "http://www.9flats.com/places/".$uri;

    $json["picture_url"] = "img/rsz_noavatar.png";
    $json["name"] = $single->place_details->host->name;
    $json["response_time"] = "&nbsp;";
    $json["amenities"] = $single->place_details->amenities_list;

    $json["city"] = $single->place_details->city;
    $json["zipcode"] = $single->place_details->zipcode;
    $json["country"] = $single->place_details->country;
    $json["property_type"] = $single->place_details->category;
    $json["room_type"] = $single->place_details->place_type;
    $json["address"] = "{$json['city']}, {$json['zipcode']}, {$json['country']}";

    $json["logopath"] = "img/9flats-final.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "9flats is a new kind of accommodation: private rooms, apartments and holiday houses, owned by friendly locals across the world.";

    $gallery = $single->place_details->additional_photos;
    $imgArr = array();
    $captions = array();
    for ($i = 0; $i < count($gallery); $i++) {
      $uri = $gallery[$i]->place_photo->url;
      $aCaption = $gallery[$i]->place_photo->title;
      $imgArr[] = str_replace("medium", "large", $uri);
      $captions[] = $aCaption;
    }
    $json["imgs"] = $imgArr;
    $json["captions"] = $captions;

    $json["lat"] = $single->place_details->lat;
    $json["lng"] = $single->place_details->lng;

    $json["desc"] = $single->place_details->description;

    $json["smallInfo"] = array();
    $json["smallInfo"][] = array(
      "Instant Bookable:",
      yesno($single->place_details->instant_bookable)
    );
    $json["smallInfo"][] = array(
      "Accommodates:",
      $single->place_details->charge_per_extra_person_limit
    );
    $json["smallInfo"][] = array(
      "Cancellation:",
      $single->place_details->cancellation_rules->type
    );
    $json["smallInfo"][] = array(
      "Bed Type:",
      $single->place_details->bed_type
    );
    $json["smallInfo"][] = array(
      "Bathrooms:",
      $single->place_details->number_of_bathrooms
    );
    $json["smallInfo"][] = array(
      "Minimum Stay:",
      $single->place_details->minimum_nights
    );
    $json["smallInfo"][] = array(
      "Extra People:",
      '$'."{$single->pricing->charge_per_extra_person} {$json['currency']} / night after {$single->place_details->charge_per_extra_person_limit} guests"
    );

    $json["review"] = false;

    return json_encode($json);
  }

  function yesno($bool) {
    return $bool ? "Yes" : "No";
  }
?>

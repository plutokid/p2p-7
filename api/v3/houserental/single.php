<?php
  error_reporting(0);

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

  // START THE MADDNESS
  function nflats($url) {
    global $idtype;
    $uri = $url;
    $url = "https://api.9flats.com/api/v4/places/" . $url . "?client_id=nubHrbRJUVPVlUjaH7SeO1RmmcZBug8Qm9Uyizus";
    $html = file_get_contents($url);
    $single = json_decode($html);
    $single = $single->place;

    $json["title"] = $single->place_details->name;
    $json["price"] = "$".round($single->pricing->price);
    $json["currency"] = $single->pricing->currency;
    $json["numOfBeds"] = $single->place_details->number_of_beds;
    $json["numOfBedrooms"] = $single->place_details->number_of_bedrooms;
    $json["house_rules"] = $single->place_details->house_rules;
    $json["link"] = "http://www.9flats.com/places/".$uri."?a_aid=51f14c6e0abce&a_bid=7c29c154&utm_source=coop-outpost&utm_campaign=outpost-integration&utm_medium=commission";

    $json["picture_url"] = "img/rsz_noavatar.png";
    $json["name"] = $single->place_details->host->name;
    $json["response_time"] = "&nbsp;";
    $json["amenities"] = $single->place_details->amenities_list;

    $json["city"] = $single->place_details->city;
    $json["zipcode"] = $single->place_details->zipcode;
    $json["country"] = $single->place_details->country;
    $json["property_type"] = $single->place_details->category." -";
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
    if ($single->place_details->charge_per_extra_person_limit) {
      $json["smallInfo"][] = array(
        "Accommodates:",
        $single->place_details->charge_per_extra_person_limit
      );
    }
    if ($single->place_details->cancellation_rules->type) {
      $json["smallInfo"][] = array(
        "Cancellation:",
        $single->place_details->cancellation_rules->type
      );
    }
    if ($single->place_details->number_of_bathrooms) {
      $json["smallInfo"][] = array(
        "Bathrooms:",
        $single->place_details->number_of_bathrooms
      );
    }
    if ($single->place_details->minimum_nights) {
      $json["smallInfo"][] = array(
        "Minimum Stay:",
        $single->place_details->minimum_nights
      );
    }
    $json["smallInfo"][] = array(
      "Extra People:",
      '$'."{$single->pricing->charge_per_extra_person} {$json['currency']} / night after {$single->place_details->charge_per_extra_person_limit} guests"
    );

    $json["review"] = false;

    return json_encode($json);
  }

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

    $json["house_rules"] = "";
    if (property_exists($single, "house_rules"))
      $json["house_rules"] = $single->house_rules;
    $json["link"] = "https://www.airbnb.com/rooms/".$uri;

    $json["picture_url"] = $single->user->user->picture_url;
    $json["name"] = $single->user->user->first_name;
    $json["response_time"] = "Responds ".$single->user->user->response_time;
    $json["amenities"] = $single->amenities;

    $json["city"] = $single->city;
    $json["property_type"] = $single->property_type." -";
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
    if (isset($single->person_capacity)) {
      $json["smallInfo"][] = array(
        "Accommodates:",
        $single->person_capacity
      );
    }
    if (isset($single->cancel_policy_short_str)) {
      $json["smallInfo"][] = array(
        "Cancellation:",
        $single->cancel_policy_short_str
      );
    }
    if (isset($single->bed_type)) {
      $json["smallInfo"][] = array(
        "Bed Type:",
        $single->bed_type
      );
    }
    if (isset($single->bathrooms)) {
      $json["smallInfo"][] = array(
        "Bathrooms:",
        $single->bathrooms
      );
    }
    if (isset($single->min_nights)) {
      $json["smallInfo"][] = array(
        "Minimum Stay:",
        $single->min_nights
      );
    }
    if (property_exists($single, "price_for_extra_person_native")) {
      $json["smallInfo"][] = array(
        "Extra People:",
        '$'."{$single->price_for_extra_person_native} {$json['currency']} / night after {$single->guests_included} guests"
      );
    }
    if (isset($single->security_deposit_native)) {
      $json["smallInfo"][] = array(
        "Security Deposit:",
        '$'.$single->security_deposit_native
      );
    }
    if (isset($single->check_in_time)) {
      $json["smallInfo"][] = array(
        "Check In:",
        $single->check_in_time.":00"
      );
    }
    if (isset($single->check_out_time)) {
      $json["smallInfo"][] = array(
        "Check Out:",
        $single->check_out_time.":00"
      );
    }

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

  function craigslist($id) {
    global $idtype;
    $url = "http://search.3taps.com/?auth_token=c19ae6773494ae4d0a4236c59eeaaf39&id={$id}";
    $extra = "&retvals=id,account_id,source,category,category_group,location,external_id,external_url,heading,body,timestamp,expires,language,price,currency,images,annotations,status,immortal";
    $url = $url.$extra;
    $html = file_get_contents($url);
    $single = json_decode($html);

    $single = $single->postings[0];

    $json = array();
    $json["title"] = $single->heading;
    $json["price"] = "$".$single->price;
    $json["currency"] = $single->currency;
    $json["numOfBeds"] = "";
    $json["numOfBedrooms"] = property_exists($single->annotations, "bedrooms") ? 0 + $single->annotations->bedrooms : "";
    $json["house_rules"] = "";
    $json["link"] = $single->external_url;

    $json["picture_url"] = "img/rsz_noavatar.png";
    $json["name"] = "";
    $json["response_time"] = "&nbsp;";


    $json["amenities"] = array();
    if (property_exists($single->annotations, "phone")) {
      $json["amenities"][] = $single->annotations->phone;
    }
    if (property_exists($single->annotations, "source_account")) {
      $json["amenities"][] = $single->annotations->source_account;
    }

    $json["room_type"] = "Entire Home/Apt";
    $json["property_type"] = "";
    $json["city"] = $single->annotations->source_loc;
    $json["address"] = isset($single->annotations->source_neighborhood) ? $single->annotations->source_neighborhood : $single->annotations->source_loc;

    $json["logopath"] = "img/craigslist_hp.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "Craigslist has thousands of classifieds not limited to vacation rentals and rideshares.";

    $gallery = $single->images;
    $imgArr = array();
    $captions = array();
    for ($i = 0; $i < count($gallery); $i++) {
      $imgArr[] = $gallery[$i]->full;
      $captions[] = "";
    }
    $json["imgs"] = $imgArr;
    $json["captions"] = $captions;

    $json["lat"] = $single->location->lat;
    $json["lng"] = $single->location->long;

    $json["desc"] = property_exists($single, "body") ? $single->body : "";

    $json["smallInfo"] = array();
    $json["smallInfo"][] = array(
      "Instant Bookable:",
      "No"
    );
    if (isset($single->annotations->sqft)) {
      $json["smallInfo"][] = array(
        "Sqaure FT:",
        $single->annotations->sqft
      );
    }
    if (isset($single->annotations->cats)) {
      $json["smallInfo"][] = array(
        "Allow Cats:",
        $single->annotations->cats === "YES" ? "Yes" : "No"
      );
    }
    if (isset($single->annotations->dogs)) {
      $json["smallInfo"][] = array(
        "Allow Dogs:",
        $single->annotations->dogs === "YES" ? "Yes" : "No"
      );
    }
    if (isset($single->annotations->year)) {
      $json["smallInfo"][] = array(
        "Year Model:",
        $single->annotations->year
      );
    }

    $json["review"] = false;

    return json_encode($json);
  }

  function flipkey($id) {
    global $idtype;
    $url = "http://api.outpost.travel/flipkey/id={$id}";
    $html = file_get_contents($url);
    return $html;
  }

  function roomorama($url) {
    global $idtype;
    $uri = $url;
    $url = "https://api.roomorama.com/v1.0/rooms/" . $url . ".json";
    $html = file_get_contents($url);
    $single = json_decode($html);
    $single = $single->result;

    $json["title"] = $single->title;
    $json["price"] = "$".round($single->price);
    $json["currency"] = $single->currency_code;

    $json["numOfBeds"] = 0;
    if (property_exists($single, "num_double_beds")) {
      $json["numOfBeds"] += $single->num_double_beds;
    }
    if (property_exists($single, "num_single_beds")) {
      $json["numOfBeds"] += $single->num_single_beds;
    }
    if (property_exists($single, "num_sofa_beds")) {
      $json["numOfBeds"] += $single->num_sofa_beds;
    }

    $json["numOfBedrooms"] = "";
    if (property_exists($single, "num_rooms")) {
      $json["numOfBedrooms"] = $single->num_rooms;
    }

    $json["house_rules"] = $single->cancellation_policy;
    $json["link"] = $single->url;

    $json["picture_url"] = "img/rsz_noavatar.png";
    $json["name"] = $single->host->display;
    $json["response_time"] = "&nbsp;";
    $json["amenities"] = explode(',', $single->amenities);

    $json["city"] = $single->city;
    $json["zipcode"] = "";
    $json["country"] = $single->country_code;
    $json["property_type"] = $single->type." -";
    $json["room_type"] = "";
    if (property_exists($single, "subtype")) {
      $json["room_type"] = $single->subtype;
    }
    $json["address"] = "{$json['city']}, {$json['country']}";

    $json["logopath"] = "img/roomorama.png";
    $json["idtype"] = $idtype;
    $json["logodesc"] = "With Roomorama, you can find short term rentals and short term apartments for short term stays in the most popular US, Canadian and European cities.";

    $gallery = $single->images;
    $imgArr = array();
    for ($i = 0; $i < count($gallery); $i++) {
      $imgArr[] = $gallery[$i]->image;
      $captions[] = "";
    }
    $json["imgs"] = $imgArr;
    $json["captions"] = $captions;

    $json["lat"] = $single->lat;
    $json["lng"] = $single->lng;

    $json["desc"] = $single->description;

    $json["smallInfo"] = array();
    if ($single->max_guests) {
      $json["smallInfo"][] = array(
        "Accommodates:",
        $single->max_guests
      );
    }
    $json["smallInfo"][] = array(
      "Cancellation:",
      $single->cancellation_policy ? "Strict" : "None"
    );
    if (isset($single->num_double_beds)) {
      $json["smallInfo"][] = array(
        "Double beds",
        $single->num_double_beds
      );
    }
    if (isset($single->num_single_beds)) {
      $json["smallInfo"][] = array(
        "Single beds",
        $single->num_single_beds
      );
    }
    if (isset($single->num_sofa_beds)) {
      $json["smallInfo"][] = array(
        "Sofa beds",
        $single->num_sofa_beds
      );
    }
    if ($single->num_bathrooms) {
      $json["smallInfo"][] = array(
        "Bathrooms:",
        $single->num_bathrooms
      );
    }
    if ($single->min_stay) {
      $json["smallInfo"][] = array(
        "Minimum Stay:",
        $single->min_stay
      );
    }
    if ($single->check_in_time) {
      $json["smallInfo"][] = array(
        "Check In:",
        $single->check_in_time
      );
    }
    if ($single->check_out_time) {
      $json["smallInfo"][] = array(
        "Check Out:",
        $single->check_out_time
      );
    }
    $json["review"] = false;

    return json_encode($json);
  }

  function yesno($bool) {
    return $bool ? "Yes" : "No";
  }
?>

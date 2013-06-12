(function(window, $) {
  Parse.initialize(
    "3BO6CIc8cRGVVoTCdnSk8VtcHWlo662UbPOQKl1K",
    "faZUcHycuTHBvrV0kTcqoTtpZsNQauN8IuXDLY7j"
  );

  $.ajaxSetup({
    timeout: 10000
  });

  $(document).ready(function() {
    // New google map
    google.maps.visualRefresh = true;

    // Initializes the MVC
    new Outpost.views.main();

    $.getJSON("https://api.twitter.com/1/statuses/user_timeline/outposttravel.json?count=1&include_rts=1&callback=?", function(data) {
      $("#latest-tweet").html(data[0].text);
    });
  });
})(window, jQuery, undefined);

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
  });
})(window, jQuery, undefined);

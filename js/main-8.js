(function(window, $) {
  Parse.initialize(
    "3BO6CIc8cRGVVoTCdnSk8VtcHWlo662UbPOQKl1K",
    "faZUcHycuTHBvrV0kTcqoTtpZsNQauN8IuXDLY7j"
  );

  $.ajaxSetup({
    timeout: 10000
  });
  $(document).ready(function() {
    // IE9 ajax fix
    $.support.cors = true;

    // Initializes the MVC
    new Outpost.views.main();

    // Navbar tracking
    $('.btn-nav, .header-logo-link').on("click", function() {
      _gaq.push(['_trackEvent',
        "navbar",
        $(this).text(),
        Outpost.values.destLocation
      ]);
    });

    // filter button
    $('.submit-filter').on("click", function() {
      _gaq.push(['_trackEvent',
        "sidebar",
        "submit-filter",
        $(this).prev().text()
      ]);
    });

    // sidebar goto icon
    $('#sidebar').on("click", ".ga-gotovendor", function() {
      _gaq.push(['_trackEvent',
        "sidebar",
        "gotolink",
        $(this).attr("href")
      ]);
    });
  });
})(window, jQuery, undefined);

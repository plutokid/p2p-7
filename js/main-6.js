(function(window, $) {
  Parse.initialize(
    "FFCnkzXkmqFWwKf4u0S4aISPKBaft8H0d42JhKb8",
    "mOlLt8cwIbHvz7vc6gtjOXfRO5rmfpcQLL4UJBF7"
  );
  $(document).ready(function() {
    $.ajaxSetup({
      timeout: 10000
    });
    // IE9 ajax fix
    $.support.cors = true;

    // Initializes the MVC
    new Outpost.views.main();

    // Navbar tracking
    $('.btn-nav, .header-logo-link').on("click", function() {
      _gaq.push(['_trackEvent',
        "navbar",
        $(this).text(),
        Outpost.values.origLocation
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

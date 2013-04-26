(function(window, $) {
  $(document).ready(function() {
    $.ajaxSetup({
      timeout: 10000
    });
    // IE9 ajax fix
    $.support.cors = true;

    // Load logo tooltips
    $('.tooly').tooltip();

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

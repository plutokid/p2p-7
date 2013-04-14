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
  });
})(window, jQuery, undefined);

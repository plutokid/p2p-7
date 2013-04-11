(function(window, $, _, Backbone) {
  $(document).ready(function() {
    // Initializes the MVC
    $.support.cors = true;
    new Outpost.views.main();
    $('.tooly').tooltip();
  });
})(window, jQuery, _, Backbone, undefined);

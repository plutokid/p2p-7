(function(window, $, _, Backbone) {
  $(document).ready(function() {
    // Initializes the MVC
    new Outpost.views.main();
    $('.tooly').tooltip();
  });
})(window, jQuery, _, Backbone, undefined);

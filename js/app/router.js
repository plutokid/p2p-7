(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.routes = {
    AppRouter: Backbone.Router.extend({
      routes: {
        "": "index",
        "!/mapview/:location": "showLocation"
      },

      index: function() {

      },

      showLocation: function(location) {
        new Outpost.views.map(location);
      }
    })
  };
})(window, jQuery, _, Backbone, undefined);

(function(window, $, _, Parse) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.routes = {
    AppRouter: Parse.Router.extend({
      routes: {
        "": "home",
        "!/mapview/:location": "mapview"
      },

      home: function() {
        if (Outpost.mvc.views.indexPage) {
          Outpost.mvc.views.indexPage.render();
        } else {
          Outpost.mvc.views.indexPage = new Outpost.views.indexPage();
        }
      },

      mapview: function(location) {
        if (Outpost.values.isFromSearch) {
          Outpost.helpers.defineOrigLoc(location);
        }

        if (Outpost.mvc.views.mapPage) {
          Outpost.mvc.views.mapPage.render();
        } else {
          Outpost.mvc.views.mapPage = new Outpost.views.mapPage();
        }
      }
    })
  };
})(window, jQuery, _, Parse, undefined);

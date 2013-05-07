(function(window, $, _, Parse) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.routes = {
    AppRouter: Parse.Router.extend({
      $title: $('title'),
      routes: {
        "!/mapview/:location": "mapview",
        "*actions": "home"
      },

      home: function(actions) {
        switch (actions) {
          case "!/mapview/":
          var geoPromise = Outpost.helpers.ipToGeo();
          geoPromise.done(function(data) {

            Outpost.helpers.defineLocFromIp(data);
            Outpost.state.isOriginOnly = true;
            if (Outpost.mvc.views.mapPage) {
              Outpost.mvc.views.mapPage.render();
            } else {
              Outpost.mvc.views.mapPage = new Outpost.views.mapPage();
            }
          });
          break;
          default:
          this.$title.text(
            "Outpost - Lookup peer to peer listings all in one place."
          );
          if (Outpost.mvc.views.indexPage) {
            Outpost.mvc.views.indexPage.render();
          } else {
            Outpost.mvc.views.indexPage = new Outpost.views.indexPage();
          }
        }
      },

      mapview: function(location) {
        location = decodeURI(location);
        this.$title.text(location + " - Outpost");
        if (Outpost.values.isFromSearch) {
          Outpost.helpers.defineDestLoc(location);
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

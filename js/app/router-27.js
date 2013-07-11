(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.routes = {
    AppRouter: Backbone.Router.extend({
      $title: $('title'),
      routes: {
        "!/item/:type/:provider/:id": "singleview",
        "!/item/:type/:provider/:id/": "singleview",

        "!/help/*hook": "helppage",
        "!/help/*hook/": "helppage",
        "!/help": "helppage",

        "!/:type": "listview",
        "!/:type/": "listview",

        "rentals": "tabRentals",
        "rentals/": "tabRentals",

        "rides": "tabRides",
        "rides/": "tabRides",

        "experiences": "tabExperiences",
        "experiences/": "tabExperiences",

        "*actions": "home"
      },

      home: function(actions, params) {
        var geoPromise;
        switch (actions) {
          default:
            this.$title.text(
              "Outpost - Compare thousands of unique, cheap and affordable ways of traveling"
            );
            if (Outpost.mvc.views.indexPage) {
              Outpost.mvc.views.indexPage.render();
            } else {
              Outpost.mvc.views.indexPage = new Outpost.views.indexPage();
            }
        }
      },

      tabRentals: function() {
        Outpost.helpers.alternateSEO({
          title: "Outpost - Cheap Vacation Rentals - " +
                 "Short Term Spaces and Rooms - " +
                 "Compare many P2P Travel Websites",
          description: "Find great vacation rental deals with Outpost Place " +
          "Rentals. Search for rates for cheap location rentals. " +
          "Compare prices, and reserve with confidence!"
        });
        Outpost.list.type = "rentals";
        if (Outpost.mvc.views.indexPage) {
          Outpost.mvc.views.indexPage.render();
        } else {
          Outpost.mvc.views.indexPage = new Outpost.views.indexPage();
        }
      },

      tabRides: function() {
        Outpost.helpers.alternateSEO({
          title: "Outpost - Rideshares and Carpools - " +
          "Long Distance, Commuter, Local, Private Groups - " +
          "Search from many P2P Travel Websites",
          description: "Find rideshares in any city on Outpost, book direct " +
          "with carpooling companies that you trust. Outpost searches many sites, you find the best ride." +
          "Compare prices, and reserve with confidence!"
        });
        Outpost.list.type = "rides";
        if (Outpost.mvc.views.indexPage) {
          Outpost.mvc.views.indexPage.render();
        } else {
          Outpost.mvc.views.indexPage = new Outpost.views.indexPage();
        }
      },

      tabExperiences: function() {
        Outpost.helpers.alternateSEO({
          title: "Outpost - Experiences and Activities - " +
          "Find the rarest and best locations from locals - " +
          "P2P Travel Aggregator Websites",
          description: "Find and discover, unique travel experiences, " +
          "including tours, activities and extended with Outpost."
        });
        Outpost.list.type = "experiences";
        if (Outpost.mvc.views.indexPage) {
          Outpost.mvc.views.indexPage.render();
        } else {
          Outpost.mvc.views.indexPage = new Outpost.views.indexPage();
        }
      },

      helppage: function(hook) {
        this.$title.text(
          "Outpost - Help and Information"
        );
        Outpost.help.hook = hook;
        if (Outpost.mvc.views.helpPage) {
          Outpost.mvc.views.helpPage.render();
        } else {
          Outpost.mvc.views.helpPage = new Outpost.views.helpPage();
        }
      },

      singleview: function(type, provider, id) {
        Outpost.single.type = type;
        Outpost.single.provider = provider;
        Outpost.single.id = id;
        if (Outpost.mvc.views.singlePage) {
          Outpost.mvc.views.singlePage.render();
        } else {
          Outpost.mvc.views.singlePage = new Outpost.views.singlePage();
        }
      },

      listview: function(type, params) {
        Outpost.list.type = type;
        if (params) {
          var searchQuery = Outpost.searchQuery;
          var origCity = Outpost.helpers.debarURI(params.origCity);
          var destCity = Outpost.helpers.debarURI(params.destCity);
          Outpost.helpers.defineOrigLoc(origCity);
          Outpost.helpers.defineDestLoc(destCity);
          searchQuery.sdate = params.sdate;
          searchQuery.edate = params.edate;
          searchQuery.guests = params.guests;

          if (searchQuery.sdate) {
            searchQuery.sdateObj = moment(searchQuery.sdate, "MM/DD/YYYY");
          } else {
            searchQuery.sdateObj = "";
          }

          if (searchQuery.edate) {
            searchQuery.edateObj = moment(searchQuery.edate, "MM/DD/YYYY");
          } else {
            searchQuery.edateObj = "";
          }

          if (Outpost.mvc.views.listPage) {
            Outpost.mvc.views.listPage.render();
          } else {
            Outpost.mvc.views.listPage = new Outpost.views.listPage();
          }
        } else {
          switch (type) {
            case "rides":
              this.tabRides();
              break;
            case "rentals":
              this.tabRentals();
              break;
            case "experiences":
              this.tabExperiences();
              break;
            default:
              this.tabRentals();
          }
        }
      }
    })
  };
})(window, jQuery, _, Backbone, undefined);

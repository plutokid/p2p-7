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
        "!/search/": "listview",
        "!/help/*hook": "helppage",
        "!/help/*hook/": "helppage",
        "*actions": "home"
      },

      home: function(actions, params) {
        var geoPromise;
        switch (actions) {
          case "!/search":
            this.listview();
            break;
          case "!/help":
            this.helppage();
            break;
          default:
            this.$title.text(
              "Outpost - Lookup peer to peer listings all in one place"
            );
            if (Outpost.mvc.views.indexPage) {
              Outpost.mvc.views.indexPage.render();
            } else {
              Outpost.mvc.views.indexPage = new Outpost.views.indexPage();
            }
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

      listview: function(params) {
        var geoPromise;
        var _this = this;
        var options = Outpost.searchQuery;
        var dff = $.Deferred();
        if (!params) {
          geoPromise = Outpost.helpers.ipToGeo();
          geoPromise.done(function(data) {
            dff.resolve({
              origCity: encodeURI(data.location),
              destCity: "",
              sdate: "",
              edate: "",
              guests: ""
            });
          });
        } else {
          dff.resolve(params);
        }

        dff.done(function(params) {
          var origCity = decodeURI(params.origCity);
          var destCity = decodeURI(params.destCity);

          if (destCity) {
            _this.$title.text(destCity + " - Outpost");
          } else {
            _this.$title.text(origCity + " - Outpost");
          }

          Outpost.helpers.defineOrigLoc(origCity);
          Outpost.helpers.defineDestLoc(destCity);
          options.sdate = params.sdate;
          options.edate = params.edate;
          options.guests = params.guests ? params.guests : "1";

          if (options.sdate) {
            options.sdateObj = moment(options.sdate, "MM/DD/YYYY");
          }

          if (options.edate) {
            options.edateObj = moment(options.edate, "MM/DD/YYYY");
          }

          if (Outpost.mvc.views.listPage) {
            Outpost.mvc.views.listPage.render();
          } else {
            Outpost.mvc.views.listPage = new Outpost.views.listPage();
          }
        });
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
      }
    })
  };
})(window, jQuery, _, Backbone, undefined);

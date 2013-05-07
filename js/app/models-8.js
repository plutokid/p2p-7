(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.models = {
    houserental: Backbone.Model.extend({}),
    rideshare: Backbone.Model.extend({}),
    tourism: Backbone.Model.extend({})
  };

  Outpost.collections = {
    // =======================================================
    // houserental Collection
    // =======================================================
    houserental: Backbone.Collection.extend({
      model: Outpost.models.houserental,
      url: "http://outpost.travel/api/v1/houserental/",

      parse: function(response) {
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var filter = Outpost.state.searchFilter;
        var min, max;
        if (Outpost.mvc.views.houserental) {
          min = Outpost.mvc.views.houserental.getMin();
          max = Outpost.mvc.views.houserental.getMax();
        } else {
          min = 0;
          max = 300;
        }
        var params = _.extend({
          data: {
            eloc: Outpost.values.destLocation,
            sdate: filter.sdate,
            edate: filter.edate,
            guests: filter.guests,
            page: Outpost.state.page.air,
            price_min: min,
            price_max: max
          },
          type: 'GET',
          dataType: 'json',
          url: _this.url
        }, options);

        return $.ajax(params);
      }
    }),

    // =======================================================
    // rideshare Collection
    // =======================================================
    rideshare: Backbone.Collection.extend({
      model: Outpost.models.rideshare,
      url: "http://outpost.travel/api/v1/rideshare/",

      parse: function(response) {
        Outpost.state.isOriginOnly = false;
        Outpost.values.origLocation = "";
        Outpost.values.origLocationLat = "";
        Outpost.values.origLocationLng = "";
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var filter = Outpost.state.searchFilter;
        var data = {};

        if (!Outpost.state.isOriginOnly) {
          data = {
            eloc: Outpost.values.destLocation,
            destlat: Outpost.values.destLocationLat,
            destlon: Outpost.values.destLocationLng
          };
        }

        data.sloc = Outpost.values.origLocation;
        data.origlat = Outpost.values.origLocationLat;
        data.origlon = Outpost.values.origLocationLng;
        data.sdate = filter.sdate;
        data.guests = filter.guests;

        var params = _.extend({
          data: data,
          type: 'GET',
          dataType: 'json',
          url: _this.url
        }, options);

        return $.ajax(params);
      }
    }),

    // =======================================================
    // tourism Collection
    // =======================================================
    tourism: Backbone.Collection.extend({
      model: Outpost.models.tourism,
      url: "http://outpost.travel/api/v1/tourism/",

      parse: function(response) {
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var loc = Outpost.values.destLocation;
        var filter = Outpost.state.searchFilter;
        var params = _.extend({
          data: {
            eloc: loc.substring(0, loc.indexOf(",")),
            page: Outpost.state.page.vay
          },
          type: 'GET',
          dataType: 'json',
          url: _this.url
        }, options);

        return $.ajax(params);
      }
    })
  };

})(window, jQuery, _, Backbone, undefined);

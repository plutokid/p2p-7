(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.models = {
    airbnb: Backbone.Model.extend({}),
    ridejoy: Backbone.Model.extend({}),
    vayable: Backbone.Model.extend({})
  };

  Outpost.collections = {
    // =======================================================
    // Airbnb Collection
    // =======================================================
    airbnb: Backbone.Collection.extend({
      model: Outpost.models.airbnb,
      url: "http://outpostp2p.com/api/airbnb/",

      parse: function(response) {
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var filter = Outpost.state.searchFilter;
        var params = _.extend({
          data: {
            eloc: Outpost.values.origLocation,
            sdate: filter.sdate,
            edate: filter.edate,
            guests: filter.guests,
            price_min: filter.minPrice,
            price_max: filter.maxPrice,
            page: Outpost.state.page.air
          },
          type: 'GET',
          dataType: 'json',
          url: _this.url
        }, options);

        return $.ajax(params);
      }
    }),

    // =======================================================
    // Ridejoy Collection
    // =======================================================
    ridejoy: Backbone.Collection.extend({
      model: Outpost.models.ridejoy,
      url: "http://outpostp2p.com/api/ridejoy/v1/",

      parse: function(response) {
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var filter = Outpost.state.searchFilter;
        var params = _.extend({
          data: {
            eloc: Outpost.values.origLocation,
            destlat: Outpost.values.origLocationLat,
            destlon: Outpost.values.origLocationLng,
            sdate: filter.sdate,
            price_min: filter.minPrice,
            price_max: filter.maxPrice
          },
          type: 'GET',
          dataType: 'json',
          url: _this.url
        }, options);

        return $.ajax(params);
      }
    }),

    // =======================================================
    // Vayable Collection
    // =======================================================
    vayable: Backbone.Collection.extend({
      model: Outpost.models.vayable,
      url: "http://outpostp2p.com/api/vayable/v1/",

      parse: function(response) {
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var loc = Outpost.values.origLocation;
        var filter = Outpost.state.searchFilter;
        var params = _.extend({
          data: {
            eloc: loc.substring(0, loc.indexOf(",")),
            page: Outpost.state.page.vay,
            price_min: filter.minPrice,
            price_max: filter.maxPrice
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

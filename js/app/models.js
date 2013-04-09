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
        var params = _.extend({
          data: {
            eloc: Outpost.values.origLocation
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
      url: "http://outpostp2p.com/api/ridejoy/",

      parse: function(response) {
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var params = _.extend({
          data: {
            eloc: Outpost.values.origLocation,
            destlat: Outpost.values.origLocationLat,
            destlon: Outpost.values.origLocationLng
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
      url: "http://outpostp2p.com/api/vayable/",

      parse: function(response) {
        return response;
      },

      sync: function(method, model, options) {
        var _this = this;
        var loc = Outpost.values.origLocation;
        var params = _.extend({
          data: {
            eloc: loc.substring(0, loc.indexOf(","))
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

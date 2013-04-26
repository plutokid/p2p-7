(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  // Used for ajax caching
  Outpost.cache = {};
  for (var i in localStorage) {
    Outpost.cache[i] = JSON.parse(localStorage[i]);
  }

  // To hold the app state
  Outpost.state = {
    rMapHeight: $(window).height() - 41,
    numOfRes: 0,
    page: {
      vay: 1,
      air: 1
    },
    searchFilter: {
      sdate: "",
      edate: "",
      guests: "1",
      minPrice: 0,
      maxPrice: 300,
      numOfNights: 0
    }
  };

  // To hold saved input values
  Outpost.values = {
    destLocation: "",
    destLocationLat: "",
    destLocationLng: "",
    airbnb: {
      min: 0,
      max: 300
    }
  };

  // To hold the MVC instatiation
  Outpost.mvc = {
    views: {},
    models: {}
  };

  // Extra helper functions
  Outpost.helpers = {
    genRdmLL: function(address) {
      var lat, lng, cached;
      var options = {
        url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&sensor=false",
        type: "GET",
        dataType: "json",
        async: false
      };

      var randomize = function randomize() {
        lat = lat + (Math.random()*0.01) -0.004;
        lng = lng + (Math.random()*0.01) -0.004;
      };

      if (!Outpost.cache[address]) {
        Outpost.cache[address] = $.ajax(options);
      }

      if (typeof Outpost.cache[address].done === 'function') {
        Outpost.cache[address].done(function(data) {
          if (data.status === "OK") {
            lat = data.results[0].geometry.location.lat;
            lng = data.results[0].geometry.location.lng;
            randomize();
          } else {
            lat = undefined;
            lng = undefined;
          }

        }).fail(function(xmlHttpRequest, textStatus, errorThrown) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Oops!</strong> something, somehow, somewhere went terribly wrong."
          });
          lat = undefined;
          lng = undefined;
        });
      } else {
        cached = Outpost.cache[address];
        if (cached.status === 200 && cached.responseJSON.results[0]) {
          lat = cached.responseJSON.results[0].geometry.location.lat;
          lng = cached.responseJSON.results[0].geometry.location.lng;
          randomize();
        } else {
          Outpost.cache[address] = $.ajax(options);
        }
      }

      localStorage[address] = JSON.stringify(Outpost.cache[address]);
      return [lat, lng];
    },

    ipToGeo: function() {
      var dff = $.Deferred();
      var ipajax = $.ajax({
        url: "http://freegeoip.net/json/",
        dataType: "json",
        type: "GET"
      });

      ipajax.done(function(data) {
        dff.resolve({
          location: data.city + ", " + data.region_code + ", " + data.country_code,
          latLng: [data.latitude, data.longitude]
        });
      });

      return dff.promise();
    },

    defineOrigLoc: function() {
      var orignalLocation = $("#js-orig-location-input").val();
      var origlatLng = Outpost.helpers.genRdmLL(orignalLocation);
      Outpost.values.origLocation = orignalLocation;
      Outpost.values.origLocationLat = origlatLng[0];
      Outpost.values.origLocationLng = origlatLng[1];
      _gaq.push(['_trackEvent',
        "mainsearch",
        "inputcity",
        orignalLocation
      ]);
    },

    defineDestLoc: function() {
      var orignalLocation = $("#js-dest-location-input").val();
      var origlatLng = Outpost.helpers.genRdmLL(orignalLocation);
      Outpost.values.destLocation = orignalLocation;
      Outpost.values.destLocationLat = origlatLng[0];
      Outpost.values.destLocationLng = origlatLng[1];
    },

    showAlertBox: function(data) {
      var $alertNodes = $('#alert-box');
      var tmpl = _.template($('#tmpl-alert').html());
      var html = tmpl(data);
      $alertNodes.append(html);
      setTimeout(function() {
        $alertNodes.find($(".alert")).alert('close');
      }, 3000);
    },

    showSLB: function(data) {
      var $alertNodes = $('#slb');
      var tmpl = _.template($('#tmpl-slb').html());
      var html = tmpl(data);
      $alertNodes.html(html);
      $alertNodes.modal();
    },

    resetPages: function() {
      for (var i in Outpost.state.page) {
        Outpost.state.page[i] = 1;
      }
    }
  };
})(window, jQuery, _, Backbone, undefined);

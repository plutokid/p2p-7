(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  // Used for ajax caching
  Outpost.cache = {};

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
  Outpost.values = {};

  // To hold the MVC instatiation
  Outpost.mvc = {
    views: {},
    models: {}
  };

  // Extra helper functions
  Outpost.helpers = {
    genRdmLL: function(address) {
      var i;
      if (!Outpost.cache[address]) {
        Outpost.cache[address] = $.ajax({
          url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&sensor=false",
          type: "GET",
          dataType: "json",
          async: false
        });
      }

      Outpost.cache[address].done(function(data) {
        var lat, lng;
        if (data.status === "OK") {
          lat = data.results[0].geometry.location.lat;
          lng = data.results[0].geometry.location.lng;
          lat = lat + (Math.random()*0.01) -0.004;
          lng = lng + (Math.random()*0.01) -0.004;
        } else {
          lat = undefined;
          lng = undefined;
        }

        i = [lat, lng];
      }).fail(function(xmlHttpRequest, textStatus, errorThrown) {
        Outpost.helpers.showAlertBox({
          type: "alert-error",
          text: "<strong>Oops!</strong> something, somehow, somewhere went terribly wrong."
        });
      });
      return i;
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
      $alertNodes.modal('show');
    },

    resetPages: function() {
      for (var i in Outpost.state.page) {
        Outpost.state.page[i] = 1;
      }
    }
  };
})(window, jQuery, _, Backbone, undefined);

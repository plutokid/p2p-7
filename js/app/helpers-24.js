(function(window, $, _, Parse) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;
  Outpost.rev = "-24";
  // Used for ajax caching
  Outpost.cache = {};
  Outpost.HTMLcache = {};
  Outpost.listingsCache = {};

  // To hold the app state
  Outpost.state = {
    $loader: $('#js-bsload')
  };

  Outpost.help = {};
  Outpost.single = {};
  Outpost.stash = {};

  // To hold the MVC instatiation
  Outpost.mvc = {
    views: {},
    models: {}
  };

  Outpost.searchQuery = {
    origLocation: "",
    origLocationLat: "",
    origLocationLng: "",
    destLocation: "",
    destLocationLat: "",
    destLocationLng: "",
    sdate: "",
    edate: "",
    sdateObj: "",
    edateObj: "",
    guests: ""
  };

  // Extra helper functions
  Outpost.helpers = {
    options: {
      url: "http://maps.googleapis.com/maps/api/geocode/json",
      data: {
        address: "",
        sensor: false
      },
      type: "GET",
      dataType: "json",
      async: false
    },

    randomize: function(x) {
      return x + (Math.random()*0.01) -0.004;
    },

    genRdmLLCC: function(address) {
      var lat, lng, cached, city, state, parts,
          country, response, length, i, objectData = {};
      var _this = this;
      _this.options.data.address = address;
      if (!Outpost.cache[address]) {
        Outpost.cache[address] = $.ajax(_this.options);
      }

      if (typeof Outpost.cache[address].done === 'function') {
        Outpost.cache[address].done(function(data) {
          if (data.status === "OK") {
            lat = _this.randomize(data.results[0].geometry.location.lat);
            lng = _this.randomize(data.results[0].geometry.location.lng);
            parts = data.results[0].address_components;
            length = parts.length;
            for (i = 0; i < length; i++) {
              if (parts[i].types[0] === "country") {
                objectData["country"] = parts[i].short_name;
              } else if (parts[i].short_name.length <= 2) {
                objectData["state"] = parts[i].short_name;
              }
            }
          } else {
            objectData.lat = undefined;
            objectData.lng = undefined;
          }

        }).fail(function(xmlHttpRequest, textStatus, errorThrown) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Oops!</strong> something, somehow," +
                  "somewhere went terribly wrong."
          });
          lat = undefined;
          lng = undefined;
        });
      } else {
        cached = Outpost.cache[address];
        response = cached.responseJSON.results[0];
        if (cached.status === 200 && response) {
          lat = _this.randomize(response.geometry.location.lat);
          lng = _this.randomize(response.geometry.location.lng);
          objectData.latLng = [lat, lng];
          parts = response.address_components;
          length = parts.length;
          for (i = 0; i < length; i++) {
            if (parts[i].types[0] === "country") {
              objectData["country"] = parts[i].short_name;
            } else if (parts[i].short_name.length <= 2) {
              objectData["state"] = parts[i].short_name;
            }
          }
        } else {
          Outpost.cache[address] = $.ajax(_this.options);
        }
      }

      objectData.latLng = [lat, lng];
      return objectData;
    },

    genLatLng: function() {

    },

    renderTemplate: function(tmpl_name, tmpl_data) {
      var ajaxPromise,
          tmpl_dir,
          tmpl_url,
          dff = $.Deferred(),
          cached,
          version = Outpost.rev,
          page = "Pages" + tmpl_name + version;

      if (!Outpost.HTMLcache[page]) {
        tmpl_dir = '/html';
        tmpl_url = tmpl_dir + '/' + tmpl_name + version + ".html";
        Outpost.HTMLcache[page] = $.ajax({
          url: tmpl_url,
          method: 'GET',
          dataType: 'html',
          beforeSend: function() {
            if (Outpost.state.$loader.is(":hidden")) {
              Outpost.state.$loader.show();
            }
          },
          complete: function() {
            Outpost.state.$loader.hide();
          }
        });
      }
      if (typeof Outpost.HTMLcache[page].done === 'function') {
        Outpost.HTMLcache[page].done(function(data){
          dff.resolve(_.template(data)(tmpl_data));
        });
      } else {
        cached = Outpost.HTMLcache[page].responseText;
        dff.resolve(_.template(cached)(tmpl_data));
      }

      return dff.promise();
    },

    genSearchQuery: function(query) {
      var str = "", len = query.length;
      for (var i = 0; i < len; i++) {
        str += query[i];
      }
      return str;
    },

    loadAPI: function(data) {
      var ajaxPromise, dff = $.Deferred();
      if (!Outpost.HTMLcache[data.uri]) {
        Outpost.HTMLcache[data.uri] = $.ajax({
          type: "GET",
          url: "http://outpost.travel/api/v2/" + data.apicat + "/single.php",
          data: {
            uri: encodeURIComponent(data.uri),
            idtype: data.idtype
          },
          dataType: "jsonp",
          beforeSend: function() {
            if (Outpost.state.$loader.is(":hidden")) {
              Outpost.state.$loader.show();
            }
          },
          complete: function() {
            Outpost.state.$loader.hide();
          }
        });
      }

      Outpost.HTMLcache[data.uri].done(function(data) {
        dff.resolve(data);
      });

      return dff.promise();
    },

    formURI: function(data) {
      var uri;
      switch (data.idtype) {
        case "kangaride":
          uri = "r/" + data.id;
          break;
        case "zimride":
          uri = "ride/share?ride=" + data.id;
          break;
        case "ridejoy":
          uri = "rides/" + data.id;
          break;
        case "blablacar":
          uri = data.id;
          break;
        case "airbnb":
          uri = data.id;
          break;
        case "nflats":
          uri = data.id;
          break;
        case "vayable":
          uri = data.id;
          break;
      }
      return uri;
    },

    ipToGeo: function() {
      var dff = $.Deferred();

      if (!Outpost.cache["ipaddress"]) {
        Outpost.cache["ipaddress"] = $.ajax({
          url: "http://ip-api.com/json/",
          dataType: "jsonp",
          type: "GET"
        });
      }

      Outpost.cache["ipaddress"].done(function(data) {
        dff.resolve({
          location: data.city + ", " +
                    data.region + ", " +
                    data.country,
          latLng: [Number(data.lat), Number(data.lon)],
          country: data.countryCode,
          state: data.region,
          city: data.city
        });
      });

      return dff.promise();
    },

    getDuration: function(origin, dest) {
      var dff = $.Deferred();

      if (!Outpost.cache[origin + dest]) {
        Outpost.cache[origin + dest] = $.ajax({
          url: "http://maps.googleapis.com/maps/api/directions/json",
          data: {
            origin: origin,
            destination: dest,
            sensor: false
          },
          dataType: "json",
          type: "GET"
        });
      }

      Outpost.cache[origin + dest].done(function(data) {
        dff.resolve(data);
      });

      return dff.promise();
    },

    defineDestLoc: function(destLocation) {
      if (destLocation) {
        var csc = Outpost.helpers.genRdmLLCC(destLocation);
        var destLng = csc.latLng;
        Outpost.searchQuery.destLocation = destLocation;
        Outpost.searchQuery.destLocationLat = destLng[0];
        Outpost.searchQuery.destLocationLng = destLng[1];

        Outpost.searchQuery.destCountry = csc.country;
        Outpost.searchQuery.destState = csc.state;
      }
    },

    defineOrigLoc: function(orignalLocation) {
      if (orignalLocation) {
        var csc = Outpost.helpers.genRdmLLCC(orignalLocation);
        var origlatLng = csc.latLng;
        Outpost.searchQuery.origLocation = orignalLocation;
        Outpost.searchQuery.origLocationLat = origlatLng[0];
        Outpost.searchQuery.origLocationLng = origlatLng[1];

        Outpost.searchQuery.origCountry = csc.country;
        Outpost.searchQuery.origState = csc.state;
      }
    },

    defineLocFromIp: function(data) {
      Outpost.searchQuery.origLocation = data.location;
      Outpost.searchQuery.origLocationLat = data.latLng[0];
      Outpost.searchQuery.origLocationLng = data.latLng[1];
      Outpost.searchQuery.origCountry = data.country;
      Outpost.searchQuery.origState = data.state;

      Outpost.searchQuery.destLocation = data.location;
      Outpost.searchQuery.destLocationLat = data.latLng[0];
      Outpost.searchQuery.destLocationLng = data.latLng[1];
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

    sortDate: function(collection) {
      var sorted = collection.sort(function (a, b) {
        var p1 = a.timestamp;
        var p2 = b.timestamp;
        return (p1 < p2) ? -1 : (p1 > p2) ? 1 : 0;
      });
      return sorted;
    },

    sortLowToHigh: function(collection) {
      var sorted = collection.sort(function (a, b) {
        var p1 = a.price;
        var p2 = b.price;
        return (p1 < p2) ? -1 : (p1 > p2) ? 1 : 0;
      });
      return sorted;
    },

    sortHighToLow: function(collection) {
      var sorted = collection.sort(function (a, b) {
        var p1 = a.price;
        var p2 = b.price;
        return (p1 > p2) ? -1 : (p1 < p2) ? 1 : 0;
      });
      return sorted;
    },

    cutCities: function() {
      var origcity = Outpost.searchQuery.origLocation;
      var destcity = Outpost.searchQuery.destLocation;
      var index;
      if (destcity) {
        index = destcity.indexOf(",");
        if (destcity.indexOf(",") !== -1) {
          destcity = destcity.substring(0, index);
        }
      } else {
        destcity = "Any city";
      }
      if (origcity) {
        index = origcity.indexOf(",");
        if (origcity.indexOf(",") !== -1) {
          origcity = origcity.substring(0, index);
        }
      } else {
        origcity = "Any city";
      }

      return {
        origcity: origcity,
        destcity: destcity
      };
    },

    connectFB: function(user) {
      FB.api('/me', function(response) {
        var data = {
          name: response.first_name
        };

        user.set("first_name", response.first_name);
        user.set("email", response.email);
        user.save(null, {});

        $('.modal').modal('hide');
        Outpost.mvc.views.navBar.render(data);
      });
    },

    fetchRideShares: function(state) {
      var dff = $.Deferred();
      var options = Outpost.searchQuery;
      var query = "";
      this.ridRequests = this.ridRequests || [];
      var data = {
        eloc: options.destLocation,
        destlat: options.destLocationLat,
        destlon: options.destLocationLng,
        destState: options.destState,
        destCountry: options.destCountry,

        sloc: options.origLocation,
        origlat: options.origLocationLat,
        origlon: options.origLocationLng,
        origState: options.origState,
        origCountry: options.origCountry,

        sdate: options.sdate,
        edate: options.edate,

        guests: options.guests,

        page: state.page
      };

      query = Outpost.helpers.genSearchQuery([
        data.sloc,
        data.eloc,
        data.sdate,
        data.edate,
        data.guests,
        data.page
      ]);

      if (!this.ridRequests[query]) {
        this.ridRequests[query] = $.ajax({
          url: 'http://outpost.travel/api/v2/rideshare/',
          type: 'GET',
          dataType: 'jsonp',
          data: data
        });
      }

      this.ridRequests[query].done(function(data) {
        dff.resolve(data);
      });

      return dff.promise();
    },

    fetchRentals: function(state) {
      var dff = $.Deferred();
      var options = Outpost.searchQuery;
      var query = "";
      this.houRequests = this.houRequests || [];

      var data = {
        eloc: options.destLocation,
        destlat: options.destLocationLat,
        destlon: options.destLocationLng,
        destState: options.destState,
        destCountry: options.destCountry,

        sloc: options.origLocation,
        origlat: options.origLocationLat,
        origlon: options.origLocationLng,
        origState: options.origState,
        origCountry: options.origCountry,

        sdate: options.sdate,
        edate: options.edate,

        guests: options.guests,
        price_min: state.min,
        price_max: state.max,
        room_type: state.roomType,
        page: state.page
      };

      query = Outpost.helpers.genSearchQuery([
        data.sloc,
        data.eloc,
        data.sdate,
        data.edate,
        data.guests,
        data.price_min,
        data.price_max,
        data.room_type.toString(),
        data.page
      ]);

      if (!this.houRequests[query]) {
        this.houRequests[query] = $.ajax({
          url: 'http://outpost.travel/api/v2/houserental/',
          type: 'GET',
          dataType: 'jsonp',
          data: data
        });
      }

      this.houRequests[query].done(function(data) {
        dff.resolve(data);
      });
      return dff.promise();
    },

    fetchGuides: function(state) {
      var dff = $.Deferred();
      var options = Outpost.searchQuery;
      var query = "";
      this.touRequests = this.touRequests || [];

      var data = {
        eloc: options.destLocation,
        destlat: options.destLocationLat,
        destlon: options.destLocationLng,
        destState: options.destState,
        destCountry: options.destCountry,

        sloc: options.origLocation,
        origlat: options.origLocationLat,
        origlon: options.origLocationLng,
        origState: options.origState,
        origCountry: options.origCountry,

        sdate: options.sdate,
        edate: options.edate,

        guests: options.guests,

        page: state.page
      };

      query = Outpost.helpers.genSearchQuery([
        data.sloc,
        data.eloc,
        data.sdate,
        data.edate,
        data.guests,
        data.page
      ]);

      if (!this.touRequests[query]) {
        this.touRequests[query] = $.ajax({
          url: 'http://outpost.travel/api/v2/tourism/',
          type: 'GET',
          dataType: 'jsonp',
          data: data
        });
      }

      this.touRequests[query].done(function(data) {
        dff.resolve(data);
      });
      return dff.promise();
    }
  };
})(window, jQuery, _, Parse, undefined);
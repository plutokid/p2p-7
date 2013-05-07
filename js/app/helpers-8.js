(function(window, $, _, Parse) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  // Used for ajax caching
  Outpost.cache = {};
  Outpost.HTMLcache = {};
  for (var i in localStorage) {
    if (i.substr(0, 5) === "Parse") {
      continue;
    }
    Outpost.cache[i] = JSON.parse(localStorage[i]);
  }

  // To hold the app state
  Outpost.state = {
    rMapHeight: $(window).height() - 41,
    numOfRes: 0,
    $loader: $('#js-bsload'),
    isOriginOnly: false,
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
    origLocation: "",
    origLocationLat: "",
    origLocationLng: "",
    destLocation: "",
    destLocationLat: "",
    destLocationLng: "",
    isFromSearch: true,
    coord: [25,0,28,1,30,2,31,3,32,4,33,5,34,6,35,7,36,8,36,9,37,10,37,11,38,
            12,38,13,38,14,38,15,38,16,38,17,38,18,38,19,38,20,38,21,38,22,38,
            23,37,24,37,25,36,26,35,27,35,28,34,29,34,30,33,31,32,32,32,33,31,
            34,30,35,30,36,29,37,28,38,28,39,27,40,27,41,26,42,25,43,25,44,24,
            45,23,46,23,47,22,48,21,49,17,49,16,48,15,47,15,46,14,45,13,44,13,
            43,12,42,11,41,11,40,10,39,10,38,9,37,8,36,8,35,7,34,6,33,6,32,5,
            31,5,30,4,29,3,28,3,27,2,26,1,25,1,24,0,23,0,22,0,21,0,20,0,19,0,
            18,0,17,0,16,0,15,0,14,0,13,0,12,1,11,1,10,2,9,2,8,3,7,4,6,5,5,6,
            4,7,3,8,2,10,1,13,0,25,0]
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
        url: "http://maps.googleapis.com/maps/api/geocode/json",
        data: {
          address: address,
          sensor: false
        },
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
            text: "<strong>Oops!</strong> something, somehow," +
                  "somewhere went terribly wrong."
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

    renderTemplate: function(tmpl_name, tmpl_data) {
      var ajaxPromise,
          tmpl_dir,
          tmpl_url,
          dff = $.Deferred();

      if (!Outpost.HTMLcache[tmpl_name]) {
        tmpl_dir = '/html';
        tmpl_url = tmpl_dir + '/' + tmpl_name;
        Outpost.HTMLcache[tmpl_name] = $.ajax({
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

      Outpost.HTMLcache[tmpl_name].done(function(data){
        dff.resolve(_.template(data)(tmpl_data));
      });

      return dff.promise();
    },

    loadAPI: function(url) {
      var ajaxPromise, dff = $.Deferred();
      if (!Outpost.HTMLcache[url]) {
        Outpost.HTMLcache[url] = $.ajax({
          type: "POST",
          url: "http://outpost.travel/api/v1/houserental/single.php",
          data: {
            uri: url
          },
          dataType: "json",
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

      Outpost.HTMLcache[url].done(function(data) {
        dff.resolve(data);
      });

      return dff.promise();
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
          location: data.city + ", " +
                    data.region_code + ", " +
                    data.country_code,
          latLng: [data.latitude, data.longitude]
        });
      });

      return dff.promise();
    },

    defineDestLoc: function(destLocation) {
      var destLng = Outpost.helpers.genRdmLL(destLocation);
      Outpost.values.destLocation = destLocation;
      Outpost.values.destLocationLat = destLng[0];
      Outpost.values.destLocationLng = destLng[1];
      _gaq.push(['_trackEvent',
        "mainsearch",
        "inputcity",
        destLocation
      ]);
    },

    defineOrigLoc: function() {
      var orignalLocation = $("#js-orig-location-input").val();
      var origlatLng = Outpost.helpers.genRdmLL(orignalLocation);
      Outpost.values.origLocation = orignalLocation;
      Outpost.values.origLocationLat = origlatLng[0];
      Outpost.values.origLocationLng = origlatLng[1];
    },

    defineLocFromIp: function(data) {
      Outpost.values.origLocation = data.location;
      Outpost.values.origLocationLat = data.latLng[0];
      Outpost.values.origLocationLng = data.latLng[1];
      Outpost.values.destLocation = data.location;
      Outpost.values.destLocationLat = data.latLng[0];
      Outpost.values.destLocationLng = data.latLng[1];
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
      var $modal = $('#slb');
      var tmpl = _.template($('#tmpl-slb').html());
      var html = tmpl(data);
      $modal.html(html);
      $modal.modal();
    },

    showCarousel: function(item) {
      var $modal = $('#hou-slb');
      var tmpl = _.template($('#tmpl-carousel').html());
      var imgArr = [],
          captions = [],
          amenities = [],
          smallInfo = [],
          latLng,
          address,
          carouselData,
          aCaption,
          review,
          profile,
          len, arr, uri, text;

      var airbnb, nflats;
      $modal.empty();
      $('<div class="modal-backdrop fade in"></div>').appendTo('body');
      this.loadAPI(item.moreinfo).done(function(data) {
        switch (item.idtype) {
          case "airbnb":
            airbnb = data.listing;
            imgArr = airbnb.picture_urls;
            captions = airbnb.picture_captions;
            text = airbnb.description;
            amenities = airbnb.amenities;
            address = airbnb.address;
            smallInfo = [
              ["Room Type:", airbnb.room_type],
              ["Property Type:", airbnb.property_type],
              ["Bed Type:", airbnb.bed_type],
              ["Beds:", airbnb.beds],
              ["Bedrooms:", airbnb.bedrooms],
              ["Bathrooms:", airbnb.bathrooms],
              ["Accommodates:", airbnb.person_capacity],
              ["Extra person:", "$"+airbnb.price_for_extra_person_native]
            ];
            latLng = [airbnb.lat, airbnb.lng];
            review = {
              img: airbnb.recent_review.review.reviewer.user.thumbnail_url,
              name: airbnb.recent_review.review.reviewer.user.first_name,
              comment: airbnb.recent_review.review.comments
            };
            profile = {
              img: airbnb.user.user.picture_url,
              name: airbnb.user.user.first_name,
              profileInfo: [
                ["Reviews:", airbnb.user.user.reviewee_count],
                ["Response rate:", airbnb.user.user.response_rate],
                ["Response time:", airbnb.user.user.response_time]
              ]
            };
            break;
          case "9flats":
            nflats = data.place.place_details;
            arr = nflats.additional_photos;
            len = arr.length;
            for (var i = 0; i < len; i++) {
              uri = arr[i].place_photo.url;
              aCaption = arr[i].place_photo.title;
              imgArr.push(uri.replace("medium", "large"));
              captions.push(aCaption);
            }
            smallInfo = [
              ["Room Type:", nflats.place_type],
              ["Property Type:", nflats.category],
              ["Bed Type:", nflats.bed_type],
              ["Beds:", nflats.number_of_beds],
              ["Bedrooms:", nflats.number_of_bedrooms],
              ["Bathroom Type:", nflats.bathroom_type],
              ["Bathrooms:", nflats.number_of_bathrooms],
              ["Accommodates:", nflats.charge_per_extra_person_limit],
              ["Extra person:", "$"+data.place.pricing.charge_per_extra_person]
            ];
            text = nflats.description;
            amenities = nflats.amenities_list;
            latLng = [nflats.lat, nflats.lng];
            address = nflats.district+", "+nflats.city+" - "+nflats.zipcode;
            profile = {
              img: "img/noavatar.png",
              name: nflats.host.name,
              profileInfo: [
                ["Cancellation Rules:", nflats.cancellation_rules.type],
                ["Allow pets:", yesno(nflats.pets_around)]
              ]
            };
            break;
        }

        carouselData = {
          imgs: imgArr,
          captions: captions,
          amenities: amenities,
          item: item,
          text: text,
          address: address,
          smallInfo: smallInfo,
          latLng: latLng,
          review: review,
          profile: profile
        };

        var html = tmpl(carouselData);
        $modal.html(html);
        $modal.find(".modal").modal();
      });

      function yesno(bool) {
        return bool ? "Yes" : "No";
      }
    },

    resetPages: function() {
      for (var i in Outpost.state.page) {
        Outpost.state.page[i] = 1;
      }
    },

    priceFilter: function(data) {
      var sorted = _(data.collection).map(function(value) {
        var price = $(value).data('item').price2;
        var max = data.max === 300 ? 10000 : data.max;
        if (price >= data.min && price <= max) {
          return $(value);
        }
      });

      $(data.itemStore.nodeList).html(sorted);
    },

    priceMarkerFilter: function(data) {
      _(data.collection).map(function(value) {
        var item = $(value).data('item');
        var price = item.price2;
        var max = data.max === 300 ? 10000 : data.max;
        if (price >= data.min && price <= max) {
          Outpost.mvc.views.map.addMarker(item, data.itemStore);
        } else {
          Outpost.mvc.views.map.removeMarker(item.markerid);
        }
      });
    },

    sortDiv: function(data) {
      var sorted, p1, p2;
      switch (data.itemStore.sortType) {
        case "low2high":
          sorted = $(data.itemStore.nodeUnit).sort(function (a, b) {
            p1 = $(a).data('item').price2;
            p2 = $(b).data('item').price2;
            return (p1 < p2) ? -1 : (p1 > p2) ? 1 : 0;
          });
          $(data.itemStore.nodeList).empty();
          $(data.itemStore.nodeList).html(sorted);
          break;
        case "high2low":
          sorted = $(data.itemStore.nodeUnit).sort(function (a, b) {
            p1 = $(a).data('item').price2;
            p2 = $(b).data('item').price2;
            return (p1 > p2) ? -1 : (p1 < p2) ? 1 : 0;
          });
          $(data.itemStore.nodeList).empty();
          $(data.itemStore.nodeList).html(sorted);
         break;
      }
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
    }
  };
})(window, jQuery, _, Parse, undefined);

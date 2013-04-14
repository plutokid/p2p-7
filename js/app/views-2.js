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
      applyTo: {
        airbnb: true,
        ridejoy: false,
        vayable: false
      }
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
        // do nothing for now
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

    showAlertBox: function(data) {
      var $alertNodes = $('#alert-box');
      var tmpl = _.template($('#tmpl-alert').html());
      var html = tmpl(data);
      $alertNodes.append(html);
      setTimeout(function() {
        $alertNodes.find($(".alert")).alert('close');
      }, 3000);
    }
  };

  Outpost.views = {
    // =======================================================
    // Main App View
    // =======================================================
    main: Backbone.View.extend({
      initialize: function() {
        // Initialize the router module
        new Outpost.routes.AppRouter();
        Backbone.history.start();

        // Initialize the menu
        Outpost.mvc.views.searchForm = new Outpost.views.searchForm();
      }
    }),

    // =======================================================
    // Home Search form
    // =======================================================
    searchForm: Backbone.View.extend({
      el: '#js-firstSearch',

      initialize: function() {
        this.initTypeahead();
      },

      events: {
        "submit #js-searchForm": "submitForm",
        "click #js-whataround": "whatIsAround"
      },

      whatIsAround: function() {
        var geoPromise = Outpost.helpers.ipToGeo();
        geoPromise.done(function(data) {
          Outpost.values.origLocation = data.location;
          Outpost.values.origLocationLat = data.latLng[0];
          Outpost.values.origLocationLng = data.latLng[1];
          Outpost.mvc.views.map = new Outpost.views.map();
        });
      },

      initTypeahead: function() {
        var origLocation = $("#js-orig-location-input")[0];
        var options = {
          types: ['(cities)']
        };
        new google.maps.places.Autocomplete(origLocation, options);
      },

      submitForm: function(e) {
        e.preventDefault();
        var orignalLocation = $("#js-orig-location-input").val();
        var origlatLng = Outpost.helpers.genRdmLL(orignalLocation);
        Outpost.values.origLocation = orignalLocation;
        Outpost.values.origLocationLat = origlatLng[0];
        Outpost.values.origLocationLng = origlatLng[1];
        Outpost.mvc.views.map = new Outpost.views.map();
      }
    }),

    // =======================================================
    // Map view
    // =======================================================
    map: Backbone.View.extend({
      el: '#map',
      isInterested: false,
      initialize: function() {
        $('.js-mainmenu').hide();
        this.setMapTerrain();
        this.render();
      },

      closeInfo: function() {
        $('#map').gmap3({clear:"overlay"});
      },

      routeRide: function(e) {
        var $node = $(e);
        var origin = $node.data("orig");
        var dest = $node.data("dest");
        var _this = this;
        _this.$el.gmap3({
          clear: {
            tag: "directions"
          },
          getroute: {
            options: {
              origin: origin,
              destination: dest,
              travelMode: google.maps.DirectionsTravelMode.DRIVING
            },
            callback: function(results) {
              if (!results) return;
              _this.$el.gmap3({
                directionsrenderer:{
                  options:{
                    directions: results
                  },
                  tag: "directions"
                }
              });
            }
          }
        });
        return false;
      },

      setMapTerrain: function() {
        $('#js-searchForm').remove();
        $('#landingpage').remove();
        $('#listings').show();
        $('.inner').css('min-height', Outpost.state.rMapHeight + 8);
        this.$el.css('height', Outpost.state.rMapHeight);
      },

      setMarkers: function(markers, opts) {
        var _this = this;
        _this.$el.gmap3({
          marker: {
            values: markers,
            options: {
              icon: opts.icon,
              shadow: opts.shadow,
              shape: opts.shape,
              animation: opts.animation
            },
            events: {
              click: function(marker, event, context) {
                $('.row-selected').removeClass('row-selected');
                $(opts.nodeList).find('.' + context.id).addClass('row-selected');
                $(opts.nodeTab).tab('show');
                $('body, html').animate({
                  scrollTop: $('.' + context.id).offset().top
                }, 300);
              },
              mouseover: function(marker, event, context) {
                _this.$el.gmap3({clear: "overlay"}, {
                  overlay: {
                    latLng: marker.getPosition(),
                    options: {
                      content: opts.infoWindowTmpl(context.data),
                      offset: {
                        x: -150,
                        y: -215
                      }
                    }
                  }
                });
                $('.row-selected').removeClass('row-selected');
                $(opts.nodeList).find('.' + context.id).addClass('row-selected');

                marker.setIcon(opts.iconHover);
                $(opts.nodeList).find('.' + context.id).addClass('row-hovered');
              },
              mouseout: function(marker, event, context) {
                marker.setIcon(opts.icon);
                $(opts.nodeList).find('.' + context.id).removeClass('row-hovered');
              }
            }
          }
        });
      },

      relateMarker: function(item, opts) {
        var _this = this;
        var map = this.$el.gmap3("get");
        _this.$el.gmap3({
          get: {
            name: "marker",
            id: opts.prefix + item.id,
            callback: function(marker) {
              if (typeof marker.getPosition === 'function') {
                if (marker.getPosition()) {
                  map.panTo(marker.getPosition());
                  _this.$el.gmap3({clear: "overlay"}, {
                    overlay: {
                      latLng: marker.getPosition(),
                      options: {
                        content: opts.infoWindowTmpl(item),
                        offset: {
                          x: -150,
                          y: -215
                        }
                      }
                    }
                  });
                }
              } else {
                // do nothing for now
              }
            }
          }
        });
      },

      highlightMarker: function(item, opts) {
        this.$el.gmap3({
          get: {
            name: "marker",
            id: opts.prefix + item.id,
            callback: function(marker) {
              if (typeof marker.setIcon === 'function') {
                marker.setIcon(opts.iconHover);
              } else {
                // do nothing for now
              }
            }
          }
        });
      },

      normalizeMarker: function(item, opts) {
        this.$el.gmap3({
          get: {
            name: "marker",
            id: opts.prefix + item.id,
            callback: function(marker) {
              if (typeof marker.setIcon === 'function') {
                marker.setIcon(opts.icon);
              } else {
                // do nothing for now
              }
            }
          }
        });
      },

      removeMarkers: function(tag) {
        this.$el.gmap3({
          clear: {
            tag: tag
          }
        });
        this.closeInfo();
      },

      render: function() {
        this.$el.gmap3({
          map: {
            address: Outpost.values.origLocation,
            options: {
              zoom: 13,
              mapTypeControl: false
            }
          }
        });

        new Outpost.views.sideBar();
      }
    }),

    // =======================================================
    // Sidebar view
    // =======================================================
    sideBar: Backbone.View.extend({
      el: '#filters',
      template: _.template($('#tmpl-resultInfo').html()),

      events: {
        'click #submit-filter': 'filterReulsts',
        'click #filter-applyto': 'toggleFilterTo'
      },

      initialize: function() {
        this.updateNavbarRes();
        this.initServices();
        this.initializeFilterGUI();
      },

      toggleFilterTo: function(e) {
        var $btn = $(e.target);
        if (!$btn.hasClass('active')) {
          Outpost.state.searchFilter.applyTo[$btn.data('to')] = true;
        } else {
          Outpost.state.searchFilter.applyTo[$btn.data('to')] = false;
        }
      },

      filterReulsts: function() {
        var filter = Outpost.state.searchFilter;
        filter.sdate = $('#js-sdate-input').val();
        filter.edate = $('#js-edate-input').val();
        filter.guests = $('#js-guest-input').val() || 1;
        filter.minPrice = $("#js-price-input").slider("values", 0);
        filter.maxPrice = $("#js-price-input").slider("values", 1);
        this.clearAndFetch();
      },

      clearAndFetch: function() {
        var hasFilter = Outpost.state.searchFilter.applyTo;
        if (hasFilter.airbnb) {
          Outpost.mvc.views.airbnb.clearData();
          Outpost.mvc.views.airbnb.fetchData();
        }

        if (hasFilter.ridejoy) {
          Outpost.mvc.views.ridejoy.clearData();
          Outpost.mvc.views.ridejoy.fetchData();
        }

        if (hasFilter.vayable) {
          Outpost.mvc.views.vayable.clearData();
          Outpost.mvc.views.vayable.fetchData();
        }
      },

      initializeFilterGUI: function() {
        $('#js-sdate-input').datepicker({
          minDate: 0,
          inline: true,
          onClose: function(selectedDate) {
            $("#js-edate-input").datepicker("option", "minDate", selectedDate);
            $("#js-edate-input").focus();
          }
        });

        $( "#js-edate-input" ).datepicker({
          inline: true,
          onClose: function() {
            $('#js-guest-input').focus();
          }
        });

        $("#js-price-input").slider({
          range: true,
          values: [10, 300],
          min: 1,
          max: 300,
          slide: function (event, ui) {
            $("#price-value-min").text(ui.values[0]);
            if (ui.values[1] === 300) {
              $("#price-value-max").text("300+");
            } else {
              $("#price-value-max").text(ui.values[1]);
            }
          }
        });
      },

      updateNavbarRes: function() {
        $('.resultInfo').html(this.template({
          numOfRes: Outpost.state.numOfRes,
          city: Outpost.values.origLocation
        }));
      },

      initServices: function() {
        Outpost.mvc.views.airbnb = new Outpost.views.airbnb();
        Outpost.mvc.views.ridejoy = new Outpost.views.ridejoy();
        Outpost.mvc.views.vayable = new Outpost.views.vayable();
      }
    }),

    // =======================================================
    // Airbnb list view
    // =======================================================
    airbnb: Backbone.View.extend({
      el: '#airbnb-table',
      template: _.template($('#tmpl-airbnbRow').html()),
      itemStore: {
        prefix: "air",
        infoWindowTmpl: Outpost.tmpl.airbnbInfo,
        icon: new google.maps.MarkerImage(
          'img/airbnb/image.png',
          new google.maps.Size(39,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shadow: new google.maps.MarkerImage(
          'img/airbnb/shadow.png',
          new google.maps.Size(67,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shape: {
          coord: [25,0,28,1,30,2,31,3,32,4,33,5,34,6,35,7,36,8,36,9,37,10,37,11,38,12,38,13,38,14,38,15,38,16,38,17,38,18,38,19,38,20,38,21,38,22,38,23,37,24,37,25,36,26,35,27,35,28,34,29,34,30,33,31,32,32,32,33,31,34,30,35,30,36,29,37,28,38,28,39,27,40,27,41,26,42,25,43,25,44,24,45,23,46,23,47,22,48,21,49,17,49,16,48,15,47,15,46,14,45,13,44,13,43,12,42,11,41,11,40,10,39,10,38,9,37,8,36,8,35,7,34,6,33,6,32,5,31,5,30,4,29,3,28,3,27,2,26,1,25,1,24,0,23,0,22,0,21,0,20,0,19,0,18,0,17,0,16,0,15,0,14,0,13,0,12,1,11,1,10,2,9,2,8,3,7,4,6,5,5,6,4,7,3,8,2,10,1,13,0,25,0],
          type: 'poly'
        },
        iconHover: "img/airbnb/hover.png",
        nodeList: "#airbnb-list",
        nodeTab: "#js-airbnbmenu",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.airbnb();
        this.fetchData();
      },

      events: {
        "click .tr-airbnb": "openInfoWindow",
        "click #lm-air": "loadMore",
        "mouseenter .tr-airbnb": "highlightMarker",
        "mouseleave .tr-airbnb": "normalizeMarker"
      },

      clearData: function() {
        this.itemStore.animation = "";
        Outpost.mvc.views.map.removeMarkers("air");
        Outpost.state.page.air = 1;
        this.$el
         .find('#airbnb-list')
         .empty();
      },

      loadMore: function() {
        this.itemStore.animation = google.maps.Animation.DROP;
        Outpost.state.page.air += 1;
        this.fetchData();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#airbnb-loading');
        var $loadMore = $('#lm-air');
        this.collection.fetch({
          beforeSend: function() {
            $loading.show();
            $loadMore.button('loading');
          },
          success: function () {
            $loading.hide();
            $loadMore.button('reset');
            _this.render();
          }
        });
      },

      openInfoWindow: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        $('.row-selected').removeClass('row-selected');
        $tr.addClass("row-selected");
        Outpost.mvc.views.map.relateMarker(item, this.itemStore);
      },

      highlightMarker: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.highlightMarker(item, this.itemStore);
      },

      normalizeMarker: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.normalizeMarker(item, this.itemStore);
      },

      render: function() {
        var collection = this.collection.toJSON();
        if (collection.length) {
          this.$el.find('#airbnb-list').append(this.template({
            items: collection
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(this.$el.data('markers'), this.itemStore);
          this.$el.removeData('markers');
        } else if (Outpost.state.page.air !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-air').button('reset');
        } else {
          this.$el
           .find('#airbnb-list')
           .html("No rentals in " + Outpost.values.origLocation + " found.");
        }
      }
    }),

    // =======================================================
    // Ridejoy list view
    // =======================================================
    ridejoy: Backbone.View.extend({
      el: '#ridejoy-table',
      template: _.template($('#tmpl-ridejoyRow').html()),
      itemStore: {
        prefix: "rid",
        infoWindowTmpl: Outpost.tmpl.ridejoyInfo,
        icon: new google.maps.MarkerImage(
          'img/ridejoy/image.png',
          new google.maps.Size(39,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shadow: new google.maps.MarkerImage(
          'img/ridejoy/shadow.png',
          new google.maps.Size(67,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shape: {
          coord: [25,0,28,1,30,2,31,3,32,4,33,5,34,6,35,7,36,8,36,9,37,10,37,11,38,12,38,13,38,14,38,15,38,16,38,17,38,18,38,19,38,20,38,21,38,22,38,23,37,24,37,25,36,26,35,27,35,28,34,29,34,30,33,31,32,32,31,33,31,34,30,35,30,36,29,37,28,38,28,39,27,40,26,41,26,42,25,43,25,44,24,45,23,46,23,47,22,48,21,49,17,49,16,48,15,47,15,46,14,45,13,44,13,43,12,42,12,41,11,40,10,39,10,38,9,37,8,36,8,35,7,34,7,33,6,32,5,31,5,30,4,29,3,28,3,27,2,26,1,25,1,24,1,23,0,22,0,21,0,20,0,19,0,18,0,17,0,16,0,15,0,14,0,13,0,12,1,11,1,10,2,9,2,8,3,7,4,6,5,5,6,4,7,3,9,2,10,1,13,0,25,0],
          type: 'poly'
        },
        iconHover: "img/ridejoy/hover.png",
        nodeList: "#ridejoy-list",
        nodeTab: "#js-ridejoymenu",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.ridejoy();
        this.fetchData();
      },

      events: {
        "click .tr-ridejoy": "openInfoWindow",
        "mouseenter .tr-ridejoy": "highlightMarker",
        "mouseleave .tr-ridejoy": "normalizeMarker"
      },

      clearData: function() {
        this.itemStore.animation = "";
        Outpost.mvc.views.map.removeMarkers("rid");
        this.$el
         .find('#ridejoy-list')
         .empty();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#ridejoy-loading');
        this.collection.fetch({
          beforeSend: function() {
            $loading.show();
          },
          success: function () {
            $loading.hide();
            _this.render();
          }
        });
      },

      openInfoWindow: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        $('.row-selected').removeClass('row-selected');
        $tr.addClass("row-selected");
        Outpost.mvc.views.map.relateMarker(item, this.itemStore);
      },

      highlightMarker: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.highlightMarker(item, this.itemStore);
      },

      normalizeMarker: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.normalizeMarker(item, this.itemStore);
      },

      render: function() {
        var collection = this.collection.toJSON();
        if (collection.length) {
          this.$el.find('#ridejoy-list').append(this.template({
            items: collection
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(this.$el.data('markers'), this.itemStore);
          this.$el.removeData('markers');
        } else {
          this.$el
           .find('#ridejoy-list')
           .html("No rides found towards " + Outpost.values.origLocation + ".");
        }
      }
    }),

    // =======================================================
    // Vayable list view
    // =======================================================
    vayable: Backbone.View.extend({
      el: '#vayable-table',
      template: _.template($('#tmpl-vayableRow').html()),
      itemStore: {
        prefix: "vay",
        infoWindowTmpl: Outpost.tmpl.vayableInfo,
        icon: new google.maps.MarkerImage(
          'img/vayable/image.png',
          new google.maps.Size(39,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shadow: new google.maps.MarkerImage(
          'img/vayable/shadow.png',
          new google.maps.Size(67,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shape: {
          coord: [26,0,28,1,30,2,31,3,32,4,33,5,34,6,35,7,36,8,36,9,37,10,37,11,38,12,38,13,38,14,38,15,38,16,38,17,38,18,38,19,38,20,38,21,38,22,38,23,37,24,37,25,36,26,36,27,35,28,34,29,34,30,33,31,32,32,32,33,31,34,30,35,30,36,29,37,28,38,28,39,27,40,26,41,26,42,25,43,25,44,24,45,23,46,23,47,22,48,21,49,17,49,16,48,15,47,15,46,14,45,13,44,13,43,12,42,12,41,11,40,10,39,10,38,9,37,8,36,8,35,7,34,6,33,6,32,5,31,4,30,4,29,3,28,3,27,2,26,1,25,1,24,1,23,0,22,0,21,0,20,0,19,0,18,0,17,0,16,0,15,0,14,0,13,0,12,1,11,1,10,2,9,2,8,3,7,4,6,5,5,6,4,7,3,9,2,10,1,13,0,26,0],
          type: 'poly'
        },
        iconHover: "img/vayable/hover.png",
        nodeList: "#vayable-list",
        nodeTab: "#js-vayablemenu",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.vayable();
        this.fetchData();
      },

      events: {
        "click .tr-vayable": "openInfoWindow",
        "click #lm-vay": "loadMore",
        "mouseenter .tr-vayable": "highlightMarker",
        "mouseleave .tr-vayable": "normalizeMarker"
      },


      clearData: function() {
        this.itemStore.animation = "";
        Outpost.mvc.views.map.removeMarkers("vay");
        Outpost.state.page.vay = 1;
        this.$el
         .find('#vayable-list')
         .empty();
      },

      loadMore: function() {
        this.itemStore.animation = google.maps.Animation.DROP;
        Outpost.state.page.vay += 1;
        this.fetchData();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#vayable-loading');
        var $loadMore = $('#lm-vay');
        this.collection.fetch({
          beforeSend: function() {
            $loading.show();
            $loadMore.button('loading');
          },
          success: function () {
            $loading.hide();
            $loadMore.button('reset');
            _this.render();
          }
        });
      },

      openInfoWindow: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        $('.row-selected').removeClass('row-selected');
        $tr.addClass("row-selected");
        Outpost.mvc.views.map.relateMarker(item, this.itemStore);
      },

      highlightMarker: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.highlightMarker(item, this.itemStore);
      },

      normalizeMarker: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.normalizeMarker(item, this.itemStore);
      },

      render: function() {
        var collection = this.collection.toJSON();
        if (collection.length) {
          this.$el.find('#vayable-list').append(this.template({
            items: collection
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(this.$el.data('markers'), this.itemStore);
          this.$el.removeData('markers');
        } else if (Outpost.state.page.vay !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-vay').button('reset');
        } else {
          this.$el.find('#vayable-list').html("No guides in " + Outpost.values.origLocation + " found.");
        }
      }
    })
  };
})(window, jQuery, _, Backbone, undefined);

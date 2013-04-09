(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  // Used for ajax caching
  Outpost.cache = {};

  // To hold the app state
  Outpost.state = {
    rMapHeight: $(window).height() - 41,
    numOfRes: 0
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
      }).fail(function() {
        // Do nothing for failure for now
      });

      return i;
    }
  };

  Outpost.views = {
    // =======================================================
    // Main App View
    // =======================================================
    main: Backbone.View.extend({
      el: "body",
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
        "submit #js-searchForm": "submitForm"
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
      template: _.template($('#tmpl-resultInfo').html()),

      initialize: function() {
        this.setMapTerrain();
        this.render();
      },

      events: {
        "click .routeit": "routeRide"
      },

      routeRide: function(e) {
        var $node = $(e.currentTarget);
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
      },

      setMapTerrain: function() {
        $('#js-searchForm').remove();
        $('body').css("background", "none");
        $('#landingpage').remove();
        $('#listings').show();
        $('#sidebar').css('height', Outpost.state.rMapHeight);
        $('.inner').css('height', Outpost.state.rMapHeight + 8);
        this.$el.css('height', Outpost.state.rMapHeight);
      },

      setMarkers: function(markers, opts) {
        var _this = this;
        _this.$el.gmap3({
          marker: {
            values: markers,
            options: {
              icon: opts.icon
            },
            events: {
              click: function(marker, event, context) {
                var map = _this.$el.gmap3("get");
                var infowindow = _this.$el.gmap3({get:{name:"infowindow"}});
                $('.row-selected').removeClass('row-selected');
                if (infowindow) {
                  infowindow.open(map, marker);
                  infowindow.setContent(context.data);
                } else {
                  _this.$el.gmap3({
                    infowindow: {
                      anchor:marker,
                      options:{content: context.data},
                      events: {
                        closeclick: function(infowindow) {
                          $('.row-selected').removeClass('row-selected');
                        }
                      }
                    }
                  });
                }
                $(opts.nodeList).find('.' + context.id).addClass('row-selected');
              },
              mouseover: function(marker, event, context) {
                marker.setIcon(opts.iconHover);
                $(opts.nodeTab).tab('show');
                $(opts.nodeList).find('.' + context.id).addClass('row-hovered');
                $('.inner').animate({
                  scrollTop: $('.' + context.id).offset().top
                }, 300);
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
        _this.$el.gmap3({
          get: {
            name: "marker",
            id: opts.prefix + item.id,
            callback: function(marker) {
              var map = _this.$el.gmap3("get");
              var infowindow = _this.$el.gmap3({get:{name:"infowindow"}});
              if (infowindow) {
                infowindow.open(map, marker);
                infowindow.setContent(opts.infoWindowTmpl(item));
              } else {
                _this.$el.gmap3({
                  infowindow: {
                    anchor:marker,
                    options:{content: opts.infoWindowTmpl(item)}
                  }
                });
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
              marker.setIcon(opts.iconHover);
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
              marker.setIcon(opts.icon);
            }
          }
        });
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

        $('.resultInfo').html(this.template({
          numOfRes: Outpost.state.numOfRes,
          city: Outpost.values.origLocation
        }));

        // Instantiate the madness
        new Outpost.views.airbnb();
        new Outpost.views.ridejoy();
        new Outpost.views.vayable();
      }
    }),

    // =======================================================
    // Airbnb list view
    // =======================================================
    airbnb: Backbone.View.extend({
      el: '#airbnb-list',
      template: _.template($('#tmpl-airbnbRow').html()),
      itemStore: {
        prefix: "air",
        infoWindowTmpl: Outpost.tmpl.airbnbInfo,
        icon: "img/airbnbmarker.png",
        iconHover: "img/airbnbmarker_hover.png",
        nodeList: "#airbnb-list",
        nodeTab: "#js-airbnbmenu"
      },

      initialize: function() {
        var _this = this;
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.airbnb();
        this.collection.fetch({
          beforeSend: function() {
            $('#airbnb-loading').show();
          },
          success: function () {
            $('#airbnb-loading').hide();
            _this.render();
          }
        });
      },

      events: {
        "click .tr-airbnb": "openInfoWindow",
        "mouseenter .tr-airbnb": "highlightMarker",
        "mouseleave .tr-airbnb": "normalizeMarker"
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
        this.$el.html(this.template({
          items: this.collection.toJSON()
        }));
        $('#js-counter').text(Outpost.state.numOfRes);
        Outpost.mvc.views.map.setMarkers(this.$el.data('markers'), this.itemStore);
      }
    }),

    // =======================================================
    // Ridejoy list view
    // =======================================================
    ridejoy: Backbone.View.extend({
      el: '#ridejoy-list',
      template: _.template($('#tmpl-ridejoyRow').html()),
      itemStore: {
        prefix: "rid",
        infoWindowTmpl: Outpost.tmpl.ridejoyInfo,
        icon: "img/ridejoymarker.png",
        iconHover: "img/ridejoymarker_hover.png",
        nodeList: "#ridejoy-list",
        nodeTab: "#js-ridejoymenu"
      },

      initialize: function() {
        var _this = this;
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.ridejoy();
        this.collection.fetch({
          beforeSend: function() {
            $('#ridejoy-loading').show();
          },
          success: function () {
            $('#ridejoy-loading').hide();
            _this.render();
          }
        });
      },

      events: {
        "click .tr-ridejoy": "openInfoWindow",
        "mouseenter .tr-ridejoy": "highlightMarker",
        "mouseleave .tr-ridejoy": "normalizeMarker"
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
        this.$el.html(this.template({
          items: this.collection.toJSON()
        }));
        $('#js-counter').text(Outpost.state.numOfRes);
        Outpost.mvc.views.map.setMarkers(this.$el.data('markers'), this.itemStore);
      }
    }),

    // =======================================================
    // Vayable list view
    // =======================================================
    vayable: Backbone.View.extend({
      el: '#vayable-list',
      template: _.template($('#tmpl-vayableRow').html()),
      itemStore: {
        prefix: "vay",
        infoWindowTmpl: Outpost.tmpl.vayableInfo,
        icon: "img/vayablemarker.png",
        iconHover: "img/vayablemarker_hover.png",
        nodeList: "#vayable-list",
        nodeTab: "#js-vayablemenu"
      },

      initialize: function() {
        var _this = this;
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.vayable();
        this.collection.fetch({
          beforeSend: function() {
            $('#vayable-loading').show();
          },
          success: function () {
            $('#vayable-loading').hide();
            _this.render();
          }
        });
      },

      events: {
        "click .tr-vayable": "openInfoWindow",
        "mouseenter .tr-vayable": "highlightMarker",
        "mouseleave .tr-vayable": "normalizeMarker"
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
        this.$el.html(this.template({
          items: this.collection.toJSON()
        }));
        $('#js-counter').text(Outpost.state.numOfRes);
        Outpost.mvc.views.map.setMarkers(this.$el.data('markers'), this.itemStore);
      }
    })
  };
})(window, jQuery, _, Backbone, undefined);
(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

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
        Outpost.mvc.views.navBar = new Outpost.views.navBar();
      }
    }),

    // =======================================================
    // Navbar View
    // =======================================================
    navBar: Backbone.View.extend({
      el: '#js-navbar',

      initialize: function() {
      },

      events: {
        "submit #js-refineSearch": "refineSearch"
      },

      refineSearch: function(e) {
        e.preventDefault();
        this.setFilterVar();
        Outpost.state.numOfRes = 0;
        Outpost.helpers.defineOrigLoc();
        Outpost.helpers.resetPages();
        Outpost.mvc.views.map.removeAllMarkers();
        Outpost.mvc.views.map.redefineMap();
        Outpost.mvc.views.sideBar.updateNavbarRes();
        Outpost.mvc.views.sideBar.clearAllListings();
        Outpost.mvc.views.sideBar.fetchAll();
      },

      setFilterVar: function() {
        var filter = Outpost.state.searchFilter;
        var calculateNumOfNights = function() {
          var sdate = $('#js-sdate-input').datepicker("getDate");
          var edate = $("#js-edate-input").datepicker("getDate");
          var diff = 0;
          if (sdate && edate) {
            diff = Math.floor((edate.getTime() - sdate.getTime()) / 86400000);
          }

          return diff;
        };

        filter.sdate = $('#js-sdate-input').val();
        filter.edate = $('#js-edate-input').val();
        filter.guests = $('#js-guest-input').val() || 1;
        filter.numOfNights = calculateNumOfNights(filter.sdate, filter.edate);
      },

      initRefineGUI: function() {
        $('#js-refineSearch').show();
        var $sdate = $('#js-sdate-input');
        var $edate = $("#js-edate-input");

        var customRange = function customRange(input) {
          var minDate;
          var startDateVal = $sdate.val();
          if (input.id === 'js-edate-input') {
            if (startDateVal) {
              minDate = new Date(startDateVal);
              minDate.setDate(minDate.getDate() + 1);
              return {
                minDate: minDate
              };
            } else {
              return {
                minDate: 1
              };
            }
          }
        };

        $sdate.datepicker({
          minDate: 0,
          inline: true,
          onClose: function(selectedDate) {
            $edate.focus();
          }
        });

        $edate.datepicker({
          inline: true,
          beforeShow: customRange,
          onClose: function() {
            $('#js-guest-input').focus();
          }
        });
      }
    }),

    // =======================================================
    // Search form
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
          _gaq.push(['_trackEvent',
            "mainsearch",
            "gpslocate",
            data.location
          ]);
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
        Outpost.helpers.defineOrigLoc();
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
        $('.js-mainmenu').remove();
        this.setMapTerrain();
        this.render();
        Outpost.mvc.views.sideBar = new Outpost.views.sideBar();
        Outpost.mvc.views.navBar.initRefineGUI();
      },

      closeInfo: function() {
        this.$el.gmap3({clear:"overlay"});
      },

      showInfo: function(marker, content, templateit) {
        this.$el.gmap3({
          overlay: {
            latLng: marker.getPosition(),
            options: {
              content: templateit(content),
              offset: {
                x: -150,
                y: -215
              }
            }
          }
        });
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
        var $searchInput = $('#js-orig-location-input').detach();
        $searchInput
         .removeClass("css-input-sea wearedual span11")
         .prependTo("#js-refineSearch");
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
                _this.closeInfo();
                _this.showInfo(marker, context.data, opts.infoWindowTmpl);
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
              if (typeof marker.getPosition === 'function' && marker.getPosition()) {
                map.panTo(marker.getPosition());
                _this.closeInfo();
                _this.showInfo(marker, item, opts.infoWindowTmpl);
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

      removeAllMarkers: function(tag) {
        this.$el.gmap3({
          clear: {
            name: "marker"
          }
        });
        this.closeInfo();
      },

      removeMarkers: function(tag) {
        this.$el.gmap3({
          clear: {
            tag: tag
          }
        });
        this.closeInfo();
      },

      redefineMap: function() {
        var _this = this;
        _this.$el.gmap3({
          getlatlng: {
            address: Outpost.values.origLocation,
            callback: function(results) {
              if (results) {
                _this.$el.gmap3({
                  map:{
                    options:{
                      zoom: 13,
                      center: results[0].geometry.location
                    }
                  }
                });
              } else {
                Outpost.helpers.showAlertBox({
                  type: "alert-error",
                  text: "<strong>Hmm..</strong> I coudln't recognize this location!"
                });
              }
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
      }
    }),

    // =======================================================
    // Sidebar view
    // =======================================================
    sideBar: Backbone.View.extend({
      el: '#sidebar',
      template: _.template($('#tmpl-resultInfo').html()),

      events: {
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

      clearAllListings: function() {
        $('tbody').empty();
      },

      fetchAll: function() {
        Outpost.mvc.views.airbnb.fetchData();
        Outpost.mvc.views.ridejoy.fetchData();
        Outpost.mvc.views.vayable.fetchData();
      },

      initializeFilterGUI: function() {
        $("#js-price-input-rid").slider({
          range: true,
          values: [10, 300],
          min: 1,
          max: 300,
          slide: function (event, ui) {
            $("#price-value-min-rid").text(ui.values[0]);
            if (ui.values[1] === 300) {
              $("#price-value-max-rid").text("300+");
            } else {
              $("#price-value-max-rid").text(ui.values[1]);
            }
          }
        });
        $("#js-price-input-hou").slider({
          range: true,
          values: [10, 300],
          min: 1,
          max: 300,
          slide: function (event, ui) {
            $("#price-value-min-hou").text(ui.values[0]);
            if (ui.values[1] === 300) {
              $("#price-value-max-hou").text("300+");
            } else {
              $("#price-value-max-hou").text(ui.values[1]);
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
      el: '#houserental',
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
        nodeTab: "#js-houserentalmenu",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.airbnb();
        this.fetchData();
      },

      slbPic: function(src) {
        var data;

        // for Airbnb (WPE)
        src = src.replace("x_small", "large");

        // for 9flats
        src = src.replace("small", "large");
        Outpost.helpers.showSLB({
          src: src
        });
      },

      events: {
        "click .tr-airbnb": "openInfoWindow",
        'click #submit-filter-hou': 'filterResults',
        "click #lm-air": "loadMore",
        "mouseenter .tr-airbnb": "highlightMarker",
        "mouseleave .tr-airbnb": "normalizeMarker"
      },

      filterResults: function() {
        var filter = Outpost.state.searchFilter;
        filter.minPrice = $("#js-price-input-hou").slider("values", 0);
        filter.maxPrice = $("#js-price-input-hou").slider("values", 1);
        this.clearAndFetch();
      },

      clearAndFetch: function() {
        this.clearData();
        this.fetchData();
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
           .html(
            "<td class='text-center' colspan='3'>" +
            "No rentals in " + Outpost.values.origLocation + " found." +
            "</td>"
           );
        }
      }
    }),

    // =======================================================
    // Ridejoy list view
    // =======================================================
    ridejoy: Backbone.View.extend({
      el: '#rideshare',
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
        nodeTab: "#js-ridesharemenu",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.collection = new Outpost.collections.ridejoy();
        this.fetchData();
      },

      events: {
        "click .tr-ridejoy": "openInfoWindow",
        'click #submit-filter-rid': 'filterResults',
        "mouseenter .tr-ridejoy": "highlightMarker",
        "mouseleave .tr-ridejoy": "normalizeMarker"
      },

      filterResults: function() {
        var filter = Outpost.state.searchFilter;
        filter.minPrice = $("#js-price-input-rid").slider("values", 0);
        filter.maxPrice = $("#js-price-input-rid").slider("values", 1);
        this.clearAndFetch();
      },

      clearAndFetch: function() {
        this.clearData();
        this.fetchData();
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
          },
          error: function() {
            Outpost.helpers.showAlertBox({
              type: "alert-error",
              text: "<strong>Sorry!</strong> something went wrong, please try again!"
            });
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
           .html(
            "<td class='text-center' colspan='3'>" +
            "No rides found towards " + Outpost.values.origLocation + "." +
            "</td>"
           );
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
        nodeTab: "#js-tourisimmenu",
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

      slbPic: function(src) {
        var data;
        Outpost.helpers.showSLB({
          src: src
        });
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
          this.$el.find('#vayable-list').html(
            "<td class='text-center'>" +
            "No guides in " + Outpost.values.origLocation + " found." +
            "</td>"
          );
        }
      }
    })
  };
})(window, jQuery, _, Backbone, undefined);

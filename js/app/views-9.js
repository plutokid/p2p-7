(function(window, $, _, Parse) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.views = {
    // =======================================================
    // Main App View
    // =======================================================
    main: Parse.View.extend({
      initialize: function() {
        // Initialize 
        Outpost.mvc.views.navBar = new Outpost.views.navBar();

        // Initialize the router module
        Outpost.mvc.router = new Outpost.routes.AppRouter();
        Parse.history.start();
      }
    }),

    // =======================================================
    // Navbar View
    // =======================================================
    navBar: Parse.View.extend({
      el: '#js-navbar',
      template: _.template($('#tmpl-navbar').html()),

      events: {
        "click .js-logout": "logoutUser"
      },

      initialize: function() {
        var user = Parse.User.current();
        var data = {};
        if (user) {
          data.name = user.get("first_name");
        }

        new Outpost.views.loginModal();
        new Outpost.views.signupModal();
        this.render(data);
      },

      logoutUser: function() {
        Parse.User.logOut();
        this.render({});
      },

      render: function(data) {
        this.$el.html(this.template(data));
      }
    }),

    // =======================================================
    // Map view
    // =======================================================
    map: Parse.View.extend({
      el: "#map",
      isInterested: false,

      initialize: function() {
        this.render();
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

                $(opts.nodeList)
                  .find('.' + context.id)
                    .addClass('row-selected');

                $(opts.nodeTab).tab('show');
                $('body, html').animate({
                  scrollTop: $('.' + context.id).offset().top
                }, 300);
              },
              mouseover: function(marker, event, context) {
                _this.closeInfo();
                _this.showInfo(marker, context.data, opts.infoWindowTmpl);
                $('.row-selected').removeClass('row-selected');
                $(opts.nodeList)
                  .find('.' + context.id)
                    .addClass('row-selected');

                marker.setIcon(opts.iconHover);
                $(opts.nodeList)
                  .find('.' + context.id)
                    .addClass('row-hovered');
              },
              mouseout: function(marker, event, context) {
                marker.setIcon(opts.icon);
                $(opts.nodeList)
                  .find('.' + context.id)
                    .removeClass('row-hovered');
              }
            }
          }
        });
      },

      addMarker: function(item, opts) {
        var _this = this;
        _this.$el.gmap3({
          get: {
            id: item.markerid,
            callback: function(marker) {
              if (typeof marker.getPosition === 'function' &&
                                                        marker.getPosition()) {
                // do nothing
              } else {
                _this.$el.gmap3({
                  marker: {
                    latLng:item.latLng || Outpost.helpers.genRdmLL(item.origin),
                    data: item,
                    id: item.markerid,
                    tag: item.prefix,
                    options: {
                      icon: opts.icon,
                      shadow: opts.shadow,
                      shape: opts.shape
                    },
                    events: {
                      click: function(marker, event, context) {
                        $('.row-selected').removeClass('row-selected');

                        $(opts.nodeList)
                          .find('.' + context.id)
                            .addClass('row-selected');

                        $(opts.nodeTab).tab('show');
                        $('body, html').animate({
                          scrollTop: $('.' + context.id).offset().top
                        }, 300);
                      },
                      mouseover: function(marker, event, context) {
                        _this.closeInfo();
                        _this.showInfo(marker,context.data,opts.infoWindowTmpl);
                        $('.row-selected').removeClass('row-selected');
                        $(opts.nodeList)
                          .find('.' + context.id)
                            .addClass('row-selected');

                        marker.setIcon(opts.iconHover);
                        $(opts.nodeList)
                          .find('.' + context.id)
                            .addClass('row-hovered');
                      },
                      mouseout: function(marker, event, context) {
                        marker.setIcon(opts.icon);
                        $(opts.nodeList)
                          .find('.' + context.id)
                            .removeClass('row-hovered');
                      }
                    }
                  }
                });
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
              if (typeof marker.getPosition === 'function' &&
                                                        marker.getPosition()) {
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

      removeMarker: function(markerid) {
        this.$el.gmap3({
          clear: {
            id: markerid
          }
        });
        this.closeInfo();
      },

      redefineMap: function() {
        var _this = this;
        _this.$el.gmap3({
          getlatlng: {
            address: Outpost.values.destLocation,
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
                  text: "<strong>Hmm..</strong> " +
                        "I coudln't recognize this location!"
                });
              }
            }
          }
        });
      },

      render: function() {
        this.$el.gmap3('destroy');
        this.$el.gmap3({
          map: {
            latLng: [Outpost.values.destLocationLat,
                    Outpost.values.destLocationLng],
            options: {
              zoom: 13,
              mapTypeControl: false,
              styles: Outpost.mapstyle
            }
          }
        });
      }
    }),

    // =======================================================
    // Sidebar view
    // =======================================================
    sideBar: Parse.View.extend({
      el: '#sidebar',
      template: Outpost.helpers.renderTemplate,
      templateOffline: _.template($('#tmpl-resultInfo').html()),

      initialize: function() {
        this.render();
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
        Outpost.mvc.views.houserental.clearData();
        Outpost.mvc.views.rideshare.clearData();
        Outpost.mvc.views.tourism.clearData();
        $('.js-lists').empty();
      },

      fetchAll: function() {
        Outpost.mvc.views.houserental.fetchData();
        Outpost.mvc.views.rideshare.fetchData();
        Outpost.mvc.views.tourism.fetchData();
      },

      updateNavbarRes: function() {
        $('.resultInfo').html(this.templateOffline({
          numOfRes: Outpost.state.numOfRes,
          city: Outpost.values.destLocation
        }));
      },

      initServices: function() {
        Outpost.mvc.views.houserental = new Outpost.views.houserental();
        Outpost.mvc.views.rideshare = new Outpost.views.rideshare();
        Outpost.mvc.views.tourism = new Outpost.views.tourism();
      },

      render: function() {
        var _this = this;
        _this.template('sidebar-1.html', {}).done(function(tmpl) {
          _this.$el.html(tmpl);
          _this.updateNavbarRes();
          _this.initServices();
        });
      }
    }),

    // =======================================================
    // Refine Search view
    // =======================================================
    refineSearch: Parse.View.extend({
      el: '#refine-search',
      template: _.template($('#tmpl-refine-search').html()),

      initialize: function() {
        this.render();
      },

      events: {
        "submit #js-refineSearch": "refineSearch"
      },

      refineSearch: function(e) {
        e.preventDefault();
        var value = $('#js-search-again').val();
        var path = "!/mapview/" + encodeURI(value);
        this.setFilterVar();
        Outpost.state.numOfRes = 0;
        Outpost.helpers.defineDestLoc(value);
        Outpost.helpers.defineOrigLoc();
        Outpost.helpers.resetPages();
        Outpost.mvc.views.map.removeAllMarkers();
        Outpost.mvc.views.map.redefineMap();
        Outpost.mvc.views.sideBar.updateNavbarRes();
        Outpost.mvc.views.sideBar.clearAllListings();
        Outpost.mvc.views.sideBar.fetchAll();
        Outpost.mvc.router.navigate(path);
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

      render: function() {
        this.$el.html(this.template());
      }
    }),

    // =======================================================
    // houserental list view
    // =======================================================
    houserental: Parse.View.extend({
      el: '#sidebar',
      template: _.template($('#tmpl-houserentalRow').html()),
      min: 0,
      max: 300,
      divCollection: [],
      itemStore: {
        prefix: "air",
        sortType: "relevance",
        infoWindowTmpl: Outpost.tmpl.houserentalInfo,
        icon: new google.maps.MarkerImage(
          'img/houserental/image.png',
          new google.maps.Size(39,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shadow: new google.maps.MarkerImage(
          'img/houserental/shadow.png',
          new google.maps.Size(67,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shape: {
          coord: Outpost.values.coord,
          type: 'poly'
        },
        iconHover: "img/houserental/hover.png",
        nodeList: "#houserental-list",
        nodeTab: "#js-houserentalmenu",
        nodeUnit: ".tr-houserental",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.initSliderGUI();
        this.collection = new Outpost.collections.houserental();
        this.fetchData();
      },

      events: {
        "change #js-sortby-input-hou": "sortBy",
        "click .tr-houserental": "openInfoWindow",
        "click #lm-air": "loadMore",
        "click .hou-listimg": "loadSLB",
        "click .info-details": "loadSLB",
        "mouseenter .tr-houserental": "highlightMarker",
        "mouseleave .tr-houserental": "normalizeMarker"
      },

      getMin: function() {
        return this.min;
      },

      getMax: function() {
        return this.max;
      },

      initSliderGUI: function() {
        var _this = this;
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
            _this.min = ui.values[0];
            _this.max = ui.values[1];
            _this.priceFilter();
          },
          change: function() {
            _this.priceMarkerFilter();
            Outpost.state.page.air = 1;
          }
        });
      },

      loadSLB: function(e) {
        var $node = $(e.currentTarget || e);
        var data = $("." + $node.data('id')).data('item');
        Outpost.helpers.showCarousel(data);
      },

      priceFilter: function() {
        Outpost.helpers.priceFilter({
          itemStore: this.itemStore,
          collection: this.divCollection,
          min: this.min,
          max: this.max
        });
      },

      priceMarkerFilter: function() {
        Outpost.helpers.priceMarkerFilter({
          itemStore: this.itemStore,
          collection: this.divCollection,
          min: this.min,
          max: this.max
        });
      },

      sortBy: function(e) {
        this.itemStore.sortType = $(e.currentTarget).val();
        this.sortDiv();
      },

      sortDiv: function() {
        Outpost.helpers.sortDiv({
          itemStore: this.itemStore
        });
        this.divCollection = $('.tr-houserental');
      },

      clearAndFetch: function() {
        Outpost.state.page.air = 1;
        this.clearData();
        this.fetchData();
      },

      clearData: function() {
        this.divCollection = [];
        this.itemStore.animation = "";
        Outpost.mvc.views.map.removeMarkers("air");
        Outpost.state.page.air = 1;
        this.$el
         .find('#houserental-list')
         .empty();
      },

      loadMore: function() {
        this.itemStore.animation = google.maps.Animation.DROP;
        Outpost.state.page.air += 1;
        this.fetchData();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#houserental-loading');
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
          },
          error: function() {
            Outpost.helpers.showAlertBox({
              type: "alert-error",
              text: "<strong>Sorry!</strong>" +
                    "something went wrong! Trying again.."
            });
            $('#lm-air').button('reset');
            this.clearAndFetch();
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
          $('#houserental-list').append(this.template({
            items: collection
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(
            $('#houserental').data('markers'),
            this.itemStore
          );
          $('#houserental').removeData('markers');
          this.sortDiv();
          this.priceFilter();
        } else if (Outpost.state.page.air !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-air').button('reset');
        } else {
          this.$el
           .find('#houserental-list')
           .html(
            "<div class='text-center'>" +
            "No rentals in " + Outpost.values.destLocation + " found." +
            "</div>"
           );
        }
      }
    }),

    // =======================================================
    // rideshare list view
    // =======================================================
    rideshare: Parse.View.extend({
      el: '#sidebar',
      template: _.template($('#tmpl-rideshareRow').html()),
      min: 0,
      max: 300,
      divCollection: [],
      itemStore: {
        prefix: "rid",
        sortType: "relevance",
        infoWindowTmpl: Outpost.tmpl.rideshareInfo,
        icon: new google.maps.MarkerImage(
          'img/rideshare/image.png',
          new google.maps.Size(39,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shadow: new google.maps.MarkerImage(
          'img/rideshare/shadow.png',
          new google.maps.Size(67,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shape: {
          coord: Outpost.values.coord,
          type: 'poly'
        },
        iconHover: "img/rideshare/hover.png",
        nodeList: "#rideshare-list",
        nodeTab: "#js-ridesharemenu",
        nodeUnit: ".tr-rideshare",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.initSliderGUI();
        this.collection = new Outpost.collections.rideshare();
        this.fetchData();
      },

      events: {
        "change #js-sortby-input-rid": "sortBy",
        "click .tr-rideshare": "openInfoWindow",
        "mouseenter .tr-rideshare": "highlightMarker",
        "mouseleave .tr-rideshare": "normalizeMarker"
      },

      initSliderGUI: function() {
        var _this = this;
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
            _this.min = ui.values[0];
            _this.max = ui.values[1];
            _this.priceFilter();
          },
          change: function() {
            _this.priceMarkerFilter();
          }
        });
      },

      priceFilter: function() {
        Outpost.helpers.priceFilter({
          itemStore: this.itemStore,
          collection: this.divCollection,
          min: this.min,
          max: this.max
        });
      },

      priceMarkerFilter: function() {
        Outpost.helpers.priceMarkerFilter({
          itemStore: this.itemStore,
          collection: this.divCollection,
          min: this.min,
          max: this.max
        });
      },

      sortBy: function(e) {
        this.itemStore.sortType = $(e.currentTarget).val();
        this.sortDiv();
      },

      sortDiv: function() {
        Outpost.helpers.sortDiv({
          itemStore: this.itemStore
        });
        this.divCollection = $('.tr-rideshare');
      },

      clearAndFetch: function() {
        this.clearData();
        this.fetchData();
      },

      clearData: function() {
        this.divCollection = [];
        this.itemStore.animation = "";
        Outpost.mvc.views.map.removeMarkers("rid");
        this.$el
         .find('#rideshare-list')
         .empty();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#rideshare-loading');
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
              text: "<strong>Sorry!</strong>" +
                    "something went wrong! Trying again.."
            });
            this.clearAndFetch();
          },
          complete: function() {
            $('#submit-filter-rid').button('reset');
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
          $('#rideshare-list').append(this.template({
            items: collection
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(
            $('#rideshare').data('markers'),
            this.itemStore
          );
          $('#rideshare').removeData('markers');
          this.sortDiv();
          this.priceFilter();
        } else {
          this.$el
           .find('#rideshare-list')
           .html(
            "<div class='text-center'>" +
            "No rides found towards " + Outpost.values.destLocation + "." +
            "</div>"
           );
        }
      }
    }),

    // =======================================================
    // tourism list view
    // =======================================================
    tourism: Parse.View.extend({
      el: '#sidebar',
      template: _.template($('#tmpl-tourismRow').html()),
      min: 0,
      max: 300,
      divCollection: [],
      itemStore: {
        prefix: "vay",
        sortType: "relevance",
        infoWindowTmpl: Outpost.tmpl.tourismInfo,
        icon: new google.maps.MarkerImage(
          'img/tourism/image.png',
          new google.maps.Size(39,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shadow: new google.maps.MarkerImage(
          'img/tourism/shadow.png',
          new google.maps.Size(67,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shape: {
          coord: Outpost.values.coord,
          type: 'poly'
        },
        iconHover: "img/tourism/hover.png",
        nodeList: "#tourism-list",
        nodeTab: "#js-tourismmenu",
        nodeUnit: ".tr-tourism",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.initSliderGUI();
        this.collection = new Outpost.collections.tourism();
        this.fetchData();
      },

      events: {
        "change #js-sortby-input-tou": "sortBy",
        "click .tr-tourism": "openInfoWindow",
        "click #lm-vay": "loadMore",
        "click .tou-listimg": "loadSLB",
        "mouseenter .tr-tourism": "highlightMarker",
        "mouseleave .tr-tourism": "normalizeMarker"
      },

      initSliderGUI: function() {
        var _this = this;
        $("#js-price-input-tou").slider({
          range: true,
          values: [10, 300],
          min: 1,
          max: 300,
          slide: function (event, ui) {
            $("#price-value-min-tou").text(ui.values[0]);
            if (ui.values[1] === 300) {
              $("#price-value-max-tou").text("300+");
            } else {
              $("#price-value-max-tou").text(ui.values[1]);
            }
            _this.min = ui.values[0];
            _this.max = ui.values[1];
            _this.priceFilter();
          },
          change: function() {
            _this.priceMarkerFilter();
          }
        });
      },

      loadSLB: function(e) {
        var $node = $(e.currentTarget);
        this.slbPic($node.attr('src'));
      },

      slbPic: function(src) {
        var data;
        Outpost.helpers.showSLB({
          src: src
        });
      },

      priceFilter: function() {
        Outpost.helpers.priceFilter({
          itemStore: this.itemStore,
          collection: this.divCollection,
          min: this.min,
          max: this.max
        });
      },

      priceMarkerFilter: function() {
        Outpost.helpers.priceMarkerFilter({
          itemStore: this.itemStore,
          collection: this.divCollection,
          min: this.min,
          max: this.max
        });
      },

      sortBy: function(e) {
        this.itemStore.sortType = $(e.currentTarget).val();
        this.sortDiv();
      },

      sortDiv: function() {
        Outpost.helpers.sortDiv({
          itemStore: this.itemStore
        });
        this.divCollection = $('.tr-tourism');
      },

      clearData: function() {
        this.divCollection = [];
        this.itemStore.animation = "";
        Outpost.mvc.views.map.removeMarkers("vay");
        Outpost.state.page.vay = 1;
        this.$el
         .find('#tourism-list')
         .empty();
      },

      loadMore: function() {
        this.itemStore.animation = google.maps.Animation.DROP;
        Outpost.state.page.vay += 1;
        this.fetchData();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#tourism-loading');
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
          },
          error: function() {
            Outpost.helpers.showAlertBox({
              type: "alert-error",
              text: "<strong>Sorry!</strong>" +
                    "something went wrong! Trying again.."
            });
            $('#lm-vay').button('reset');
            this.clearAndFetch();
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
          $('#tourism-list').append(this.template({
            items: collection
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(
            $('#tourism').data('markers'),
            this.itemStore
          );
          $('#tourism').removeData('markers');
          this.sortDiv();
          this.priceFilter();
        } else if (Outpost.state.page.vay !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-vay').button('reset');
        } else {
          $('#tourism-list').html(
            "<div class='text-center'>" +
            "No guides in " + Outpost.values.destLocation + " found." +
            "</div>"
          );
        }
      }
    }),

    // =======================================================
    // Home - Page
    // =======================================================
    indexPage: Parse.View.extend({
      el: "#pg-home",
      template: Outpost.helpers.renderTemplate,

      initialize: function() {
        this.render();
      },

      events: {
        "submit #js-searchForm": "submitForm",
        "click #js-whataround": "whatIsAround"
      },

      whatIsAround: function(e) {
        var _this = this;
        var geoPromise = Outpost.helpers.ipToGeo();
        var $node = $(e.currentTarget);
        $node.attr("disabled", "disabled");
        $node.text("Locating..");
        geoPromise.done(function(data) {
          Outpost.helpers.defineLocFromIp(data);
          Outpost.state.isOriginOnly = true;
          _this.navigateTo(data.location, false);
          _gaq.push(['_trackEvent',
            "mainsearch",
            "gpslocate",
            data.location
          ]);
        });
      },

      submitForm: function(e) {
        e.preventDefault();
        this.navigateTo($("#js-dest-location-input").val(), true);
      },

      navigateTo: function(value, isFromSearch) {
        Outpost.values.isFromSearch = isFromSearch;
        var path = "!/mapview/" + encodeURI(value);
        Outpost.mvc.router.navigate(path, true);
      },

      render: function() {
        var _this = this;
        $('.pg-page').empty();
        _this.template('home-1.html', {}).done(function(tmpl) {
          _this.$el.html(tmpl);
        });
      }
    }),

    // =======================================================
    // Mapview - Page
    // =======================================================
    mapPage: Parse.View.extend({
      el: "#pg-mapview",
      template: Outpost.helpers.renderTemplate,

      initialize: function() {
        this.render();
      },

      resizeMap: function() {
        console.log("this");
      },

      render: function() {
        var views = Outpost.mvc.views;
        $('.pg-page').empty();
        if (views.map) {
          views.map.render();
          views.sideBar.render();
          views.refineSearch.render();
        } else {
          views.map = new Outpost.views.map();
          views.sideBar = new Outpost.views.sideBar();
          views.refineSearch = new Outpost.views.refineSearch();
          new Outpost.views.houModal();
        }
      }
    }),

    // =======================================================
    // Signup - Modal
    // =======================================================
    signupModal: Parse.View.extend({
      el: '#js-signup-modal',

      initialize: function() {
        this.render();
      },

      events: {
        "submit #js-signup-form": "submitSignup",
        "click #js-su-show-passwd": "showPassword",
        "click #js-fb-su": "connectFB"
      },

      connectFB: function() {
        Parse.FacebookUtils.logIn('email', {
          success: function(user) {
            Outpost.helpers.connectFB(user);
          },
          error: function(user, error) {
            // do nothing
          }
        });
      },

      submitSignup: function(e) {
        var $nodeArr;
        var $target = $(e.target);
        if ($target.parsley('validate')) {
          $nodeArr = [
            $target,
            $target.find('#js-su-first_name'),
            $target.find('#js-su-email'),
            $target.find('#js-su-password')
          ];
          $target.find("#js-su-submit").attr("disabled", "true");
          this.signUpUser($nodeArr);
          Outpost.state.$loader.show();
        }
        e.preventDefault();
      },

      signUpUser: function($nodeArr) {
        var user = new Parse.User();
        user.set("first_name", $nodeArr[1].val());
        user.set("username", $nodeArr[2].val());
        user.set("email", $nodeArr[2].val());
        user.set("password", $nodeArr[3].val());

        user.signUp(null, {
          success: function(user) {
            var data = {};
            var first_name;

            Outpost.state.$loader.hide();
            $('#js-signup-modal').modal('hide');
            $nodeArr[0].find("#js-su-submit").removeAttr("disabled");
            $nodeArr[0][0].reset();

            data.name = user.get("first_name");
            Outpost.mvc.views.navBar.render(data);
          },
          error: function(user, error) {
            Outpost.state.$loader.hide();
            $nodeArr[0].find("#js-su-submit").removeAttr("disabled");
            alert("Error: " + error.code + " " + error.message);
          }
        });
      },

      showPassword: function(e) {
        var $target = $(e.target);
        if ($target.is(':checked')) {
          $('#js-su-password').attr('type', 'text');
        } else {
          $('#js-su-password').attr('type', 'password');
        }
      },

      render: function() {
        // nothin'
      }
    }),

    // =======================================================
    // Login - Modal
    // =======================================================
    loginModal: Parse.View.extend({
      el: '#js-login-modal',

      initialize: function() {
        this.render();
      },

      events: {
        "submit #js-login-form": "submitLogin",
        "click #js-lo-show-passwd": "showPassword",
        "click #js-fb-lo": "connectFB"
      },

      connectFB: function() {
        Parse.FacebookUtils.logIn('email', {
          success: function(user) {
            Outpost.helpers.connectFB(user);
          },
          error: function(user, error) {
            // do nothing
          }
        });
      },

      submitLogin: function(e) {
        var $nodeArr;
        var $target = $(e.target);
        if ($target.parsley('validate')) {
          $nodeArr = [
            $target,
            $target.find('#js-lo-email'),
            $target.find('#js-lo-password')
          ];
          $target.find("#js-lo-submit").attr("disabled", "true");
          this.signInUser($nodeArr);
          Outpost.state.$loader.show();
        }
        e.preventDefault();
      },

      signInUser: function($nodeArr) {
        Parse.User.logIn($nodeArr[1].val(), $nodeArr[2].val(), {
          success: function(user) {
            var data = {};
            var first_name;

            Outpost.state.$loader.hide();
            $('#js-login-modal').modal('hide');
            $nodeArr[0].find("#js-lo-submit").removeAttr("disabled");
            $nodeArr[0][0].reset();

            first_name = user.get("first_name");
            data.name = first_name.substring(0, first_name.indexOf(' '));
            data.name = data.name || first_name;
            Outpost.mvc.views.navBar.render(data);
            Outpost.helpers.showAlertBox({
              text: "You're logged in, happy hunting!&nbsp;",
              type: "alertbox-success"
            });
          },
          error: function(user, error) {
            Outpost.state.$loader.hide();
            $nodeArr[0].find("#js-lo-submit").removeAttr("disabled");
            alert("Error: " + error.code + " " + error.message);
          }
        });
      },

      showPassword: function(e) {
        var $target = $(e.target);
        if ($target.is(':checked')) {
          $('#js-lo-password').attr('type', 'text');
        } else {
          $('#js-lo-password').attr('type', 'password');
        }
      },

      render: function() {
        // nothin'
      }
    }),

    // =======================================================
    // Houserental - Modal
    // =======================================================
    houModal: Parse.View.extend({
      el: '#hou-slb',

      initialize: function() {
        // do nothing
      },

      events: {
        "click .menu-streetview": "loadStreetView",
        "hide .modal": "showOverflow",
        "show .modal": "hideOverflow"
      },

      loadStreetView: function(e) {
        var latLng = $(e.currentTarget).data('latlng');
        var street = new google.maps.LatLng(latLng[0],latLng[1]);
        var panoramaOptions = {
          position: street,
          pov: {
            heading: 34,
            pitch: 10
          }
        };

        new google.maps.StreetViewPanorama(
          $('.tab-streetview')[0],
          panoramaOptions
        );
      },

      showOverflow: function() {
        $('body').css("overflow-y", "scroll");
        $('.modal-backdrop').remove();
      },

      hideOverflow: function() {
        $('body').css("overflow-y", "hidden");
      }
    })
  };
})(window, jQuery, _, Parse, undefined);

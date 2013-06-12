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
        Backbone.history.start();
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
    // Home - Page
    // =======================================================
    indexPage: Parse.View.extend({
      el: "#pg-home",
      template: Outpost.helpers.renderTemplate,

      initialize: function() {
        this.render();
      },

      events: {
        "submit #js-searchForm": "submitForm"
      },

      submitForm: function(e) {
        e.preventDefault();
        var queryString = {
          origCity: encodeURI($("#ho-orig-location-input").val()),
          destCity: encodeURI($("#js-dest-location-input").val()),
          sdate: $('#ho-sdate-input').val(),
          edate: $('#ho-edate-input').val(),
          guests: $('#ho-guest-input').val()
        };
        queryString = $.param(queryString);
        this.navigateToListView(queryString);
      },

      navigateToListView: function(queryString) {
        var path = "!/search/?" + queryString;
        Outpost.mvc.router.navigate(path, true);
      },

      render: function() {
        var _this = this;
        $('.pg-page').empty();
        _this.template('home', {}).done(function(tmpl) {
          _this.$el.html(tmpl);
        });
      }
    }),

    // =======================================================
    // Listview - Page
    // =======================================================
    listPage: Parse.View.extend({
      el: "#pg-listview",
      template: Outpost.helpers.renderTemplate,

      initialize: function() {
        this.render();
      },

      events: {
        "submit #lp-refineSearch": "refineSearch",
        "shown .lp-aTab": "initLazyLoad"
      },

      initLazyLoad: function(e) {
        var target = $(e.target).attr("href");
        $.waypoints('destroy');
        switch(target) {
          case "#lp-ridesharing":
            Outpost.mvc.views.aListRid.infiniteScroll();
            break;
          case "#lp-spacerentals":
            Outpost.mvc.views.aListHou.infiniteScroll();
            break;
          case "#lp-localguides":
            Outpost.mvc.views.aListTou.infiniteScroll();
            break;
        }
      },

      refineSearch: function(e) {
        e.preventDefault();
        var queryString = {
          origCity: encodeURI($("#refine-orig-location").val()),
          destCity: encodeURI($("#refine-dest-location").val()),
          sdate: $('#refine-sdate').val(),
          edate: $('#refine-edate').val(),
          guests: $('#refine-guest').val()
        };
        queryString = $.param(queryString);
        this.navigateToListView(queryString);
      },

      navigateToListView: function(queryString) {
        var path = "!/search/?" + queryString;
        Outpost.mvc.router.navigate(path, true);
      },

      render: function() {
        var _this = this;
        $('.pg-page').empty();
        _this.template('listview', {}).done(function(tmpl) {
          _this.$el.html(tmpl);
          Outpost.mvc.views.aListRid = new Outpost.views.aListRid();
          Outpost.mvc.views.aListHou = new Outpost.views.aListHou();
          Outpost.mvc.views.aListTou = new Outpost.views.aListTou();
        });
      }
    }),

    // =======================================================
    // SingleView - Page
    // =======================================================
    singlePage: Parse.View.extend({
      el: "#pg-singleview",
      template: _.template($('#tmpl-single').html()),

      initialize: function() {
        this.render();
      },

      render: function() {
        $('.pg-page').empty();
        this.$el.html(this.template({}));
        switch (Outpost.single.type) {
          case "rideshare":
            new Outpost.views.singleRid();
            break;
          case "houserental":
            new Outpost.views.singleHou();
            break;
          case "localguide":
            new Outpost.views.singleTou();
            break;
        }
      }
    }),

    // =======================================================
    // Rideshare - Single Page View
    // =======================================================
    singleRid: Parse.View.extend({
      el: "#pg-singleview",
      template: Outpost.helpers.renderTemplate,

      initialize: function() {
        this.render();
      },

      events: {
        "click .btn-con-dri": "checkUserState"
      },

      paintMap: function(data) {
        var origin = data.f_meeting_loc || data.origin;
        var dest = data.f_drop_loc || data.destination;
        $("#single-map").gmap3({
          getroute:{
            options: {
              origin: origin,
              destination: dest,
              travelMode: google.maps.DirectionsTravelMode.DRIVING
            },
            callback: function(results){
              if (!results) return;
              $(this).gmap3({
                map: {
                  options: {
                    zoom: 13
                  }
                },
                directionsrenderer: {
                  container: $("<div>").addClass("googlemap").insertAfter($("#single-map")),
                  options: {
                    directions:results
                  }
                }
              });
            }
          }
        });
      },

      checkUserState: function(e) {
        var isLogged = Parse.User.current();
        if (!isLogged) {
          e.preventDefault();
          $('#js-signup-modal').modal('show');
        }
      },

      render: function() {
        var _this = this;
        var jhr = Outpost.helpers.loadAPI({
          uri: Outpost.helpers.formURI({
            id: Outpost.single.id,
            idtype: Outpost.single.provider
          }),
          idtype: Outpost.single.provider,
          apicat: "rideshare"
        });

        jhr.done(function(data) {
          $('.pg-page').empty();
          _this.template('sv-rideshare', data).done(function(tmpl) {
            _this.$el.html(tmpl);
            _this.paintMap(data);
          });
        });
      }
    }),

    // =======================================================
    // Houseretntals - Single Page View
    // =======================================================
    singleHou: Parse.View.extend({
      el: "#pg-singleview",
      template: Outpost.helpers.renderTemplate,
      data: {},
      panorama: {},

      initialize: function() {
        this.render();
      },

      events: {
        "shown .tab-street-view": "showPanorama",
        "shown .tab-map-view": "showMap",
        "click .btn-sv-hou": "checkUserState"
      },

      showPanorama: function() {
        this.panorama.setVisible(true);
      },

      showMap: function() {
        var $map = $("#single-map");
        $map.gmap3({trigger:"resize"});
        $map.gmap3("autofit");
        $map.gmap3({
          map: {
            options: {
              zoom: 14
            }
          }
        });
      },

      loadStreetView: function() {
        var data = this.data;
        var street = new google.maps.LatLng(data.lat,data.lng);
        var panoramaOptions = {
          position: street,
          pov: {
            heading: 34,
            pitch: 10
          }
        };

        this.panorama = new google.maps.StreetViewPanorama(
          $('#single-street')[0],
          panoramaOptions
        );
      },

      loadMapView: function() {
        var latLng = [this.data.lat, this.data.lng];
        $("#single-map").gmap3({
          marker: {
            latLng: latLng
          },
          map: {
            options: {
              zoom: 12
            }
          }
        });
      },

      checkUserState: function(e) {
        var isLogged = Parse.User.current();
        if (!isLogged) {
          e.preventDefault();
          $('#js-signup-modal').modal('show');
        }
      },

      render: function() {
        var _this = this;
        var jhr = Outpost.helpers.loadAPI({
          uri: Outpost.helpers.formURI({
            id: Outpost.single.id,
            idtype: Outpost.single.provider
          }),
          idtype: Outpost.single.provider,
          apicat: "houserental"
        });

        jhr.done(function(data) {
          $('.pg-page').empty();
          _this.template('sv-houserental', data).done(function(tmpl) {
            _this.$el.html(tmpl);
            _this.data = data;
            _this.loadStreetView();
            _this.loadMapView();
          });
        });
      }
    }),

    // =======================================================
    // Tourism - Single Page View
    // =======================================================
    singleTou: Parse.View.extend({
      el: "#pg-singleview",
      template: Outpost.helpers.renderTemplate,
      data: {},

      initialize: function() {
        this.render();
      },

      events: {
        "shown .tab-map-view": "showMap",
        "click .btn-sv-tou": "checkUserState"
      },

      showMap: function() {
        var $map = $("#single-map");
        $map.gmap3({trigger:"resize"});
        $map.gmap3("autofit");
        $map.gmap3({
          map: {
            options: {
              zoom: 14
            }
          }
        });
      },

      loadMapView: function() {
        var address = this.data.origin;
        $("#single-map").gmap3({
          marker: {
            address: address
          },
          map: {
            options: {
              zoom: 12
            }
          }
        });
      },

      checkUserState: function(e) {
        var isLogged = Parse.User.current();
        if (!isLogged) {
          e.preventDefault();
          $('#js-signup-modal').modal('show');
        }
      },

      render: function() {
        var _this = this;
        var jhr = Outpost.helpers.loadAPI({
          uri: Outpost.helpers.formURI({
            id: Outpost.single.id,
            idtype: Outpost.single.provider
          }),
          idtype: Outpost.single.provider,
          apicat: "tourism"
        });

        jhr.done(function(data) {
          $('.pg-page').empty();
          _this.template('sv-localguide', data).done(function(tmpl) {
            _this.$el.html(tmpl);
            _this.data = data;
            _this.loadMapView();
          });
        });
      }
    }),

    // =======================================================
    // aListRidview - listings
    // =======================================================
    aListRid: Parse.View.extend({
      el: "#pg-listview",
      templateList: _.template($('#tmpl-rid-aList').html()),
      templateWell: _.template($('#tmpl-rid-well').html()),
      collection: [],
      sortedCollection: [],
      state: {
        prevSize: 0,
        page: 1
      },

      initialize: function() {
        this.resetState();
        this.fetchRides();
      },

      events: {
        "change .lp-rid-providers": "filterProviders",
        "change #lp-rid-sortby": "sortListings",
        "click .btn-rid-map": "slideMap",
        "click .btn-rid-bookit": "checkUserState"
      },

      resetState: function() {
        this.state = {
          prevSize: 0,
          page: 1
        };
      },

      fetchRides: function() {
        var _this = this;
        _this.toggleLoading();
        Outpost.helpers.fetchRideShares(this.state).done(function(data) {
          _this.collection = _this.collection.concat(data);
          _this.render();
          _this.toggleLoading();
        });
      },

      toggleLoading: function() {
        var $loader = $('#lp-rid-ls');
        if ($loader.hasClass("lp-hidden")) {
          $loader.removeClass("lp-hidden");
          $loader.show();
        } else {
          $loader.addClass("lp-hidden");
          $loader.hide();
        }
      },

      loadMore: function() {
        $.waypoints('destroy');
        this.state.page += 1;
        this.fetchRides();
      },

      infiniteScroll: function() {
        var _this = this;
        var size = 0, index = 0;
        var tr = ".lp-aList-rid";

        size = _this.collection.length;
        if (_this.state.prevSize < size) {
          if (size <= 5) {
            _this.state.prevSize = size;
            _this.loadMore();
          } else {
            index = size - 5;
            $(tr + ':eq(' + index + ')').waypoint(function(direction) {
              if (direction === "down" &&  $(this).is(":visible")) {
                _this.state.prevSize = size;
                _this.loadMore();
              }
            });
          }
        }
      },

      slideMap: function(e) {
        var $this = $(e.currentTarget);
        var item = $("." + $this.data("id")).data('item');
        var jhr = Outpost.helpers.loadAPI({
          uri: Outpost.helpers.formURI({
            idtype: item.idtype,
            id: item.uri
          }),
          idtype: item.idtype,
          apicat: "rideshare"
        });

        jhr.done(function(data) {
          var origin, dest, $extra, xhrDuration, $duration;
          $extra = $(".erid" + item.id);
          $duration = $(".direcrid" + item.id);
          origin = data.f_meeting_loc || item.origin;
          dest = data.f_drop_loc || item.destination;

          origin = origin.trim(), dest = dest.trim();
          if (origin === "Quebec") {
            origin += " city";
          } else if (dest === "Quebec") {
            dest += " city";
          }

          xhrDuration = Outpost.helpers.getDuration(origin, dest);
          xhrDuration.done(function(data) {
            if (data.routes.length) {
              var km = data.routes[0].legs[0].distance.text;
              var dur = data.routes[0].legs[0].duration.text;
              $duration.find('.lp-rid-km').text(km);
              $duration.find('.lp-rid-dur').text(dur);
              $duration.show();
            }
          });

          $(".rid-extra").gmap3('destroy').empty().slideUp(function() {
            $extra.slideDown(function() {
              $extra.gmap3({
                getroute: {
                  options: {
                    origin: origin,
                    destination: dest,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                  },
                  callback: function(results) {
                    if (results) {
                      $(this).gmap3({
                        map: {
                          options: {
                            zoom: 13
                          }
                        },
                        directionsrenderer: {
                          options: {
                            directions: results
                          }
                        }
                      });
                    } else {
                      $extra.html("Location not properly located");
                    }
                  }
                }
              });
            });
          });
        });
      },

      checkUserState: function(e) {
        var isLogged = Parse.User.current();
        if (!isLogged) {
          e.preventDefault();
          $('#js-signup-modal').modal('show');
        }
      },

      sortListings: function(e) {
        var sortby = $(e.currentTarget).val();
        this.sortedCollection = _(this.collection).clone();
        switch (sortby) {
          case "relevance":
            this.sortedRender();
            break;
          case "date":
            Outpost.helpers.sortDate(this.sortedCollection);
            this.sortedRender();
            break;
          case "low2high":
            Outpost.helpers.sortLowToHigh(this.sortedCollection);
            this.sortedRender();
            break;
          case "high2low":
            Outpost.helpers.sortHighToLow(this.sortedCollection);
            this.sortedRender();
            break;
        }

        this.filterProviders();
      },

      filterProviders: function() {
        var $checked = $('.lp-rid-providers:checked');
        if (!$checked.length) {
          $('.lp-aList-rid').show();
        } else {
          $('.lp-aList-rid').hide();
          $checked.each(function() {
            $('.alist-' + $(this).val()).show();
          });
        }

        $.waypoints('destroy');
        this.infiniteScroll();
      },

      updateHeading: function() {
        var data = {
          numOfItems: this.collection.length,
          origLocation: Outpost.searchQuery.origLocation,
          destLocation: Outpost.searchQuery.destLocation,
          date: Outpost.searchQuery.sdateObj
        };
        var html = this.templateWell(data);
        $('#lp-rid-well').html(html);
      },

      updateProviders: function() {
        $('#fil-num-bbc').text($('.alist-blablacar').length);
        $('#fil-num-kan').text($('.alist-kangaride').length);
        $('#fil-num-rid').text($('.alist-ridejoy').length);
        $('#fil-num-zim').text($('.alist-zimride').length);
      },

      sortedRender: function() {
        var html = this.templateList({
          items: this.sortedCollection
        });
        $('#lp-rid-list').html(html);
      },

      render: function() {
        var html = this.templateList({
          items: this.collection
        });
        $('#lp-rid-list').html(html);
        $('#lp-rid-sortby').val("relevance");
        this.updateHeading();
        this.updateProviders();
        this.filterProviders();
      }
    }),

    // =======================================================
    // aListHouview - listings
    // =======================================================
    aListHou: Parse.View.extend({
      el: "#pg-listview",
      templateList: _.template($('#tmpl-hou-aList').html()),
      templateWell: _.template($('#tmpl-hou-well').html()),
      templateCarousel: _.template($('#tmpl-carousel').html()),
      collection: [],
      sortedCollection: [],
      state: {
        prevSize: 0,
        page: 1,
        min: 10,
        max: 300,
        roomType: [
          "entire_home",
          "private_room",
          "shared_room"
        ]
      },

      initialize: function() {
        this.resetState();
        this.fetchRentals();
        this.initSliderGUI();
      },

      events: {
        "change .lp-hou-providers": "filterProviders",
        "change .lp-hou-roomtype": "filterRoomType",
        "change #lp-hou-sortby": "sortListings",
        "click .btn-hou-map": "slideMap",
        "click .lp-list-img": "slideCarousel",
        "click .btn-hou-bookit": "checkUserState"
      },

      initSliderGUI: function() {
        var _this = this;
        $("#lp-price-input-hou").slider({
          range: true,
          values: [10, 300],
          min: 0,
          max: 300,
          step: 10,
          slide: function (event, ui) {
            $("#lp-price-value-min-hou").text(ui.values[0]);
            if (ui.values[1] === 300) {
              $("#lp-price-value-max-hou").text("300+");
            } else {
              $("#lp-price-value-max-hou").text(ui.values[1]);
            }
          },
          change: function(event, ui) {
            $.waypoints('destroy');
            _this.state.min = ui.values[0];
            _this.state.max = ui.values[1];
            _this.resetListings();
            _this.fetchRentals();
          }
        });
      },

      resetState: function() {
        this.state = {
          prevSize: 0,
          page: 1,
          min: 10,
          max: 300,
          roomType: [
            "entire_home",
            "private_room",
            "shared_room"
          ]
        };
      },

      resetListings: function() {
        this.collection = [];
        this.sortedCollection = [];
        this.state.page = 1;
        this.prevSize = 0;
        $('#lp-hou-list').empty();
      },

      fetchRentals: function() {
        var _this = this;
        _this.toggleLoading();
        Outpost.helpers.fetchRentals(this.state).done(function(data) {
          _this.collection = _this.collection.concat(data);
          _this.render();
          _this.toggleLoading();
        });
      },

      toggleLoading: function() {
        var $loader = $('#lp-hou-ls');
        if ($loader.hasClass("lp-hidden")) {
          $loader.removeClass("lp-hidden");
          $loader.show();
        } else {
          $loader.addClass("lp-hidden");
          $loader.hide();
        }
      },

      loadMore: function() {
        $.waypoints('destroy');
        this.state.page += 1;
        this.fetchRentals();
      },

      infiniteScroll: function() {
        var _this = this;
        var size = 0, index = 0;
        var tr = ".lp-aList-hou";

        size = _this.collection.length;
        if (_this.state.prevSize < size) {
          if (size <= 5) {
            _this.state.prevSize = size;
            _this.loadMore();
          } else {
            index = size - 5;
            $(tr + ':eq(' + index + ')').waypoint(function(direction) {
              if (direction === "down" &&  $(this).is(":visible")) {
                _this.state.prevSize = size;
                _this.loadMore();
              }
            });
          }
        }
      },

      slideCarousel: function(e) {
        var _this = this;
        var $this = $(e.currentTarget);
        var item = $("." + $this.data("id")).data('item');
        var jhr = Outpost.helpers.loadAPI({
          uri: Outpost.helpers.formURI({
            idtype: item.idtype,
            id: item.uri
          }),
          idtype: item.idtype,
          apicat: "houserental"
        });

        jhr.done(function(data) {
          var $extra = $(".ehou" + item.id);
          $(".hou-extra").gmap3('destroy').empty().slideUp(function() {
            $extra.slideDown(function(){
              var html = _this.templateCarousel(data);
              $extra.css("height", "425px");
              $extra.html(html);
            });
          });
        });
      },

      slideMap: function(e) {
        var $this = $(e.currentTarget);
        var item = $("." + $this.data("id")).data('item');
        var jhr = Outpost.helpers.loadAPI({
          uri: Outpost.helpers.formURI({
            idtype: item.idtype,
            id: item.uri
          }),
          idtype: item.idtype,
          apicat: "houserental"
        });

        jhr.done(function(data) {
          var origin, dest, $extra, xhrDuration, $duration;
          var latLng = [data.lat, data.lng];
          $extra = $(".ehou" + item.id);
          $extra.css("height", "225px");
          $(".hou-extra").gmap3('destroy').empty().slideUp(function() {
            $extra.slideDown(function(){
              $extra.gmap3({
                marker: {
                  latLng: latLng
                },
                map: {
                  options: {
                    zoom: 12
                  }
                }
              });
            });
          });
        });
      },

      checkUserState: function(e) {
        var isLogged = Parse.User.current();
        if (!isLogged) {
          e.preventDefault();
          $('#js-signup-modal').modal('show');
        }
      },

      sortListings: function(e) {
        var sortby = $(e.currentTarget).val();
        this.sortedCollection = _(this.collection).clone();
        switch (sortby) {
          case "relevance":
            this.sortedRender();
            break;
          case "date":
            Outpost.helpers.sortDate(this.sortedCollection);
            this.sortedRender();
            break;
          case "low2high":
            Outpost.helpers.sortLowToHigh(this.sortedCollection);
            this.sortedRender();
            break;
          case "high2low":
            Outpost.helpers.sortHighToLow(this.sortedCollection);
            this.sortedRender();
            break;
        }

        this.filterProviders();
      },

      filterProviders: function() {
        var $checked = $('.lp-hou-providers:checked');
        if (!$checked.length) {
          $('.lp-aList-hou').show();
        } else {
          $('.lp-aList-hou').hide();
          $checked.each(function() {
            $('.alist-' + $(this).val()).show();
          });
        }

        $.waypoints('destroy');
        this.infiniteScroll();
      },

      filterRoomType: function() {
        var $checked = $('.lp-hou-roomtype:checked');
        var _this = this;
        this.state.roomType = [];
        if (!$checked.length) {
          this.state.roomType = [
                                "entire_home",
                                "private_room",
                                "shared_room"
                              ];
        } else {
          $checked.each(function() {
            _this.state.roomType.push($(this).val());
          });
        }

        this.resetListings();
        this.fetchRentals();
      },

      updateHeading: function(items) {
        var data = {
          numOfItems: this.collection.length,
          origLocation: Outpost.searchQuery.origLocation,
          destLocation: Outpost.searchQuery.destLocation,
          sdate: Outpost.searchQuery.sdateObj,
          edate: Outpost.searchQuery.edateObj,
          guests: Outpost.searchQuery.guests
        };
        var html = this.templateWell(data);
        $('#lp-hou-well').html(html);
      },

      updateProviders: function() {
        $('#fil-num-air').text($('.alist-airbnb').length);
        $('#fil-num-nfl').text($('.alist-nflats').length);
      },

      sortedRender: function() {
        var html = this.templateList({
          items: this.sortedCollection
        });
        $('#lp-hou-list').html(html);
      },

      render: function() {
        var html = this.templateList({
          items: this.collection
        });
        $('#lp-hou-list').html(html);
        $('#lp-hou-sortby').val("relevance");
        this.updateHeading();
        this.updateProviders();
        this.filterProviders();
      }
    }),

    // =======================================================
    // aListTouview - listings
    // =======================================================
    aListTou: Parse.View.extend({
      el: "#pg-listview",
      templateList: _.template($('#tmpl-tou-aList').html()),
      templateWell: _.template($('#tmpl-tou-well').html()),
      collection: [],
      sortedCollection: [],
      state: {
        prevSize: 0,
        page: 1
      },

      initialize: function() {
        this.resetState();
        this.fetchGuides();
      },

      events: {
        "change .lp-tou-providers": "filterProviders",
        "change #lp-tou-sortby": "sortListings",
        "click .btn-tou-map": "slideMap",
        "click .btn-tou-bookit": "checkUserState"
      },

      resetState: function() {
        this.state = {
          prevSize: 0,
          page: 1
        };
      },

      fetchGuides: function() {
        var _this = this;
        _this.toggleLoading();
        Outpost.helpers.fetchGuides(this.state).done(function(data) {
          _this.collection = _this.collection.concat(data);
          _this.render();
          _this.toggleLoading();
        });
      },

      toggleLoading: function() {
        var $loader = $('#lp-tou-ls');
        if ($loader.hasClass("lp-hidden")) {
          $loader.removeClass("lp-hidden");
          $loader.show();
        } else {
          $loader.addClass("lp-hidden");
          $loader.hide();
        }
      },

      loadMore: function() {
        $.waypoints('destroy');
        this.state.page += 1;
        this.fetchGuides();
      },

      infiniteScroll: function() {
        var _this = this;
        var size = 0, index = 0;
        var tr = ".lp-aList-tou";

        size = _this.collection.length;
        if (_this.state.prevSize < size) {
          if (size <= 5) {
            _this.state.prevSize = size;
            _this.loadMore();
          } else {
            index = size - 5;
            $(tr + ':eq(' + index + ')').waypoint(function(direction) {
              if (direction === "down" &&  $(this).is(":visible")) {
                _this.state.prevSize = size;
                _this.loadMore();
              }
            });
          }
        }
      },

      slideMap: function(e) {
        var $this = $(e.currentTarget);
        var item = $("." + $this.data("id")).data('item');
        var jhr = Outpost.helpers.loadAPI({
          uri: Outpost.helpers.formURI({
            idtype: item.idtype,
            id: item.uri
          }),
          idtype: item.idtype,
          apicat: "tourism"
        });

        $(".tou-extra").gmap3('destroy').empty().slideUp(function() {
          jhr.done(function(data) {
            var origin, dest, $extra, xhrDuration, $duration;
            var address = data.origin;
            $extra = $(".etou" + item.id);
            $extra.css("height", "225px");
            $extra.slideDown(function(){
              $extra.gmap3({
                marker: {
                  address: address
                },
                map: {
                  options: {
                    zoom: 12
                  }
                }
              });
            });
          });
        });
      },

      checkUserState: function(e) {
        var isLogged = Parse.User.current();
        if (!isLogged) {
          e.preventDefault();
          $('#js-signup-modal').modal('show');
        }
      },

      sortListings: function(e) {
        var sortby = $(e.currentTarget).val();
        this.sortedCollection = _(this.collection).clone();
        switch (sortby) {
          case "relevance":
            this.sortedRender();
            break;
          case "date":
            Outpost.helpers.sortDate(this.sortedCollection);
            this.sortedRender();
            break;
          case "low2high":
            Outpost.helpers.sortLowToHigh(this.sortedCollection);
            this.sortedRender();
            break;
          case "high2low":
            Outpost.helpers.sortHighToLow(this.sortedCollection);
            this.sortedRender();
            break;
        }

        this.filterProviders();
      },

      filterProviders: function() {
        var $checked = $('.lp-tou-providers:checked');
        if (!$checked.length) {
          $('.lp-aList-tou').show();
        } else {
          $('.lp-aList-tou').hide();
          $checked.each(function() {
            $('.alist-' + $(this).val()).show();
          });
        }

        $.waypoints('destroy');
        this.infiniteScroll();
      },

      updateHeading: function() {
        var data = {
          numOfItems: this.collection.length,
          origLocation: Outpost.searchQuery.origLocation,
          destLocation: Outpost.searchQuery.destLocation
        };
        var html = this.templateWell(data);
        $('#lp-tou-well').html(html);
      },

      updateProviders: function() {
        $('#fil-num-vay').text($('.alist-vayable').length);
      },

      sortedRender: function() {
        var html = this.templateList({
          items: this.sortedCollection
        });
        $('#lp-tou-list').html(html);
      },

      render: function() {
        var html = this.templateList({
          items: this.collection
        });
        $('#lp-tou-list').html(html);
        $('#lp-tou-sortby').val("relevance");
        this.updateHeading();
        this.updateProviders();
        this.filterProviders();
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
        "click #js-fb-su": "connectFB",
        "submit #js-login-form": "submitLogin",
        "click .already-member": "switchRegistration"
      },

      switchRegistration: function(e) {
        var $signup = $('#signup-form');
        var $login = $('#login-form');
        var $header = $('#signup-outpost-header');
        if ($signup.is(":visible")) {
          $header.text("Log in to Outpost");
          $signup.slideUp(function(){
            $login.slideDown();
          });
        } else {
          $header.text("Sign up for Outpost");
          $login.slideUp(function(){
            $signup.slideDown();
          });
        }
      },

      connectFB: function() {
        Parse.FacebookUtils.logIn('email', {
          success: function(user) {
            Outpost.helpers.connectFB(user);
          },
          error: function(user, error) {
            alert(error);
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
            $('#js-signup-modal').modal('hide');
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
      }
    }),

    // =======================================================
    // Help - Page
    // =======================================================
    helpPage: Parse.View.extend({
      el: "#pg-help",
      template: Outpost.helpers.renderTemplate,

      initialize: function() {
        this.render();
      },

      events: {
        "click .hp-nav-link": "scrollTo"
      },

      scrollTo: function(e) {
        e.preventDefault();
        var $node = $(e.currentTarget);
        var href = $node.attr("href");
        var path = "#!/help/" + $node.data("route");
        $('body, html').animate({
          scrollTop: $(href).offset().top
        }, 300);

        Outpost.mvc.router.navigate(path);
      },

      render: function() {
        var _this = this;
        $('.pg-page').empty();
        _this.template('help', {}).done(function(tmpl) {
          var hook = Outpost.help.hook;
          _this.$el.html(tmpl);
          if (hook && hook !== "about") {
            $('body, html').animate({
              scrollTop: $("#hp-" + hook).offset().top
            }, 300);
          } else {
            $('body, html').animate({
              scrollTop: $("body").offset().top
            }, 300);
          }
        });
      }
    })
  };
})(window, jQuery, _, Parse, undefined);

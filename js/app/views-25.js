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
        // Initialize the navBar
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
        "submit #sl-hou-searchForm": "houSubmitForm",
        "submit #sl-rid-searchForm": "ridSubmitForm",
        "click .sl-tabs": "openTab",
        "shown .sl-tabs": "transitionTab"
      },

      openTab: function(e) {
        e.preventDefault();
        var path = "!/" + $(e.currentTarget).data("name");
        Outpost.mvc.router.navigate(path, false);
      },

      transitionTab: function(e) {
        var tab = $(e.currentTarget).data("name");
        var $title = $('title');
        var $ridOrig = $('#sl-rid-orig-location-input');
        var $ridDest = $('#sl-rid-dest-location-input');
        $('.ui-datepicker').hide();
        switch (tab) {
          case "rentals":
            $title.text(
              "Outpost - Cheap Vacation Rentals - " +
              "Short Term Spaces and Rooms - " +
              "Compare many P2P Travel Websites"
            );
            $('#sl-hou-dest-location-input').focus();
            $("#main-head").css({
              backgroundImage: "url(../img/rentalsbg.jpg)"
            });
            $(".marketing-wrapper").animate({
              backgroundColor: "rgba(41, 128, 185, 0.80)"
            }, 500);
            break;
          case "rides":
            $title.text(
              "Outpost - Rideshares and Carpools - " +
              "Long Distance, Commuter, Local, Private Groups - " +
              "Search from many P2P Travel Websites"
            );

            if ($ridOrig.val()) {
              $ridDest.focus();
            } else {
              $ridOrig.focus();
            }

            $("#main-head").css({
              backgroundImage: "url(../img/ridesbg.jpg)"
            });
            $(".marketing-wrapper").animate({
              backgroundColor: "rgba(192, 57, 43, 0.80)"
            }, 500);
            break;
          case "experiences":
            $title.text(
              "Outpost - Experiences and Activities - " +
              "Find the rarest and best locations from locals - " +
              "P2P Travel Aggregator Websites"
            );
            $('#sl-exp-dest-location-input').focus();
            $("#main-head").css({
              backgroundImage: "url(../img/expbg.jpg)"
            });
            $(".marketing-wrapper").animate({
              backgroundColor: "rgba(39, 174, 96, 0.80)"
            }, 500);
            break;
        }
      },

      houSubmitForm: function(e) {
        e.preventDefault();

        // Remove datepicker UI from page
        $('.ui-datepicker').hide();

        var destCity = $("#sl-hou-dest-location-input").val();
        var hasComma = destCity.indexOf(",");
        destCity = hasComma === -1 ? $('.pac-item:first').text() : destCity;
        var queryString = {
          origCity: "",
          destCity: Outpost.helpers.enbarURI(destCity),
          sdate: $('#sl-hou-sdate-input').val(),
          edate: $('#sl-hou-edate-input').val(),
          guests: $('#sl-hou-guest-input').val()
        };
        queryString = $.param(queryString);
        this.navigateTo("!/rentals?" + queryString);
      },

      ridSubmitForm: function(e) {
        e.preventDefault();

        // Remove datepicker UI from page
        $('.ui-datepicker').hide();

        var origCity = $("#sl-rid-orig-location-input").val();
        var destCity = $("#sl-rid-dest-location-input").val();
        var hasCommaOrig = origCity.indexOf(",");
        var hasCommaDest = destCity.indexOf(",");
        var $pcOrig = $('.pac-container:eq(1)');
        var $pcDest = $('.pac-container:eq(2)');
        var firstOrig = $pcOrig.find(".pac-item:first").text();
        var firstDest = $pcDest.find(".pac-item:first").text();
        origCity = hasCommaOrig === -1 ? firstOrig : origCity;
        destCity = hasCommaDest === -1 ? firstDest : destCity;
        var queryString = {
          origCity: Outpost.helpers.enbarURI(origCity),
          destCity: Outpost.helpers.enbarURI(destCity),
          sdate: $('#sl-rid-sdate-input').val(),
          edate: $('#sl-rid-edate-input').val(),
          guests: $('#sl-rid-guest-input').val()
        };
        queryString = $.param(queryString);
        this.navigateTo("!/rides?" + queryString);
      },

      navigateTo: function(queryString) {
        Outpost.mvc.router.navigate(queryString, true);
      },

      render: function() {
        var _this = this;
        $('.pg-page').empty();
        _this.template('home', {}).done(function(tmpl) {
          _this.$el.html(tmpl);
          $('.sl-tab-' + Outpost.list.type).tab('show');
        });
      }
    }),

    // =======================================================
    // SingleView - Page (@SPV)
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
    // ListView - Page (@LVP)
    // =======================================================
    listPage: Parse.View.extend({
      el: "#pg-listview",

      initialize: function() {
        this.render();
      },

      events: {
        "shown .lp-rid-aTab": "initLazyLoad"
      },

      initLazyLoad: function(e) {
        var target = $(e.target).attr("href");
        console.log(target);
        $.waypoints('destroy');
      },

      render: function() {
        this.$el.off().empty();
        $('.pg-page').empty();
        switch (Outpost.list.type) {
          case "rides":
            new Outpost.views.rid_listPage();
            break;
          case "rentals":
            new Outpost.views.ren_listPage();
            break;
          case "experiences":
            new Outpost.views.exp_listPage();
            break;
        }
      }
    }),

    // =======================================================
    // rentals list view - listings (@RENLP)
    // =======================================================
    ren_listPage: Parse.View.extend({
      el: "#pg-listview",
      template: Outpost.helpers.renderTemplate,
      templateList: _.template($('#tmpl-hou-aList').html()),
      templateWell: _.template($('#tmpl-hou-well').html()),
      templateCarousel: _.template($('#tmpl-carousel').html()),
      idtypes: ["nflats", "airbnb", "roomorama"],
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
        var _this = this;
        _this.template('ren_listview', {}).done(function(tmpl) {
          _this.$el.html(tmpl);
          _this.resetState();
          _this.initfetchRentals();
          _this.initSliderGUI();
        });
      },

      events: {
        "change .lp-hou-providers": "filterProviders",
        "change .lp-hou-roomtype": "filterRoomType",
        "change #lp-hou-sortby": "sortListings",
        "click .btn-hou-map": "slideMap",
        "click .lp-list-img": "slideCarousel",
        "click .btn-hou-bookit": "checkUserState",
        "submit #ref-ren-form": "refineSearch"
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
            $('.fil-num').empty();
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

      initfetchRentals: function() {
        var _this = this;
        var len = _this.idtypes.length;
        var parseHTML = function(data) {
          _this.collection = _this.collection.concat(data);
          _this.sortedCollection = _(_this.collection).clone();
          Outpost.helpers.sortLowToHigh(_this.sortedCollection);
          _this.sortedRender();
          _this.updateHeading();
          _this.updateProviders();
          _this.filterProviders();
          _this.toggleLoading();
          $('#lp-hou-sortby').val("low2high");
        };

        _this.toggleLoading();

        for (var i = 0; i < len; i++) {
          Outpost.helpers.fetchRentals(
            _this.state,
            _this.idtypes[i]
          ).done(parseHTML);
        }
      },

      fetchRentals: function() {
        var parseHTML = function(data) {
          _this.collection = _this.collection.concat(data);
          _this.render();
          _this.toggleLoading();
        };

        var _this = this;
        var len = this.idtypes.length;
        _this.toggleLoading();

        for (var i = 0; i < len; i++) {
          Outpost.helpers.fetchRentals(
            this.state,
            this.idtypes[i]
          ).done(parseHTML);
        }
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
          $(".hou-extra").gmap3('destroy').empty().slideUp();
          $extra.slideDown(function(){
            var html = _this.templateCarousel(data);
            $extra.css("height", "425px");
            $extra.html(html);
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
          $(".hou-extra").gmap3('destroy').empty().slideUp();
          $extra.slideDown(function(){
            $extra.gmap3({
              marker: {
                latLng: latLng,
                data: data.address,
                events: {
                  mouseover: function(marker, event, context) {
                    var map = $(this).gmap3("get"),
                      infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow) {
                      infowindow.open(map, marker);
                      infowindow.setContent(context.data);
                    } else {
                      $(this).gmap3({
                        infowindow:{
                          anchor:marker,
                          options:{content: context.data}
                        }
                      });
                    }
                  },
                  mouseout: function() {
                    var infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow) {
                      infowindow.close();
                    }
                  }
                }
              },
              map: {
                options: {
                  zoom: 12
                }
              }
            });
          });
        });
      },

      refineSearch: function(e) {
        e.preventDefault();
        var validatedValues = this.validate();
        var destCity = validatedValues.destCity;
        var queryString = {
          origCity: "",
          destCity: Outpost.helpers.enbarURI(destCity),
          sdate: $('#ref-ren-sdate').val(),
          edate: $('#ref-ren-edate').val(),
          guests: $('#ref-ren-guest').val()
        };
        queryString = $.param(queryString);
        this.navigateTo("!/rentals?" + queryString);
      },

      navigateTo: function(queryString) {
        Outpost.mvc.router.navigate(queryString, true);
      },

      validate: function() {
        var destCity = $("#ref-ren-dest-loc").val();
        var hasCommaDest = destCity.indexOf(",");
        var $pcDest = $('.pac-container');
        var firstDest = $pcDest.find(".pac-item:first").text();
        destCity = hasCommaDest === -1 ? firstDest : destCity;
        return {
          destCity: destCity
        };
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

        this.lazyLoad();
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

        $('.fil-num').empty();
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
        $('#fil-num-roo').text($('.alist-roomorama').length);
      },

      lazyLoad: function() {
        var $activeTab = $('.tab-pane.active');
        if ($activeTab.attr('id') === "lp-spacerentals") {
          $.waypoints('destroy');
          this.infiniteScroll();
        }
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
    // rides list view - listings (@RIDLP)
    // =======================================================
    rid_listPage: Parse.View.extend({
      el: "#pg-listview",
      template: Outpost.helpers.renderTemplate,
      templateList: _.template($('#tmpl-rid-aList').html()),
      templateWell: _.template($('#tmpl-rid-well').html()),
      idtypes: ["blablacar", "kangaride", "ridejoy", "zimride"],
      collection: [],
      sortedCollection: [],
      numOfLoadedBefore: 0,
      numOfLoadedAfter: 0,
      state: {
        prevSize: 0,
        page: 1
      },

      initialize: function() {
        var _this = this;
        _this.template('rid_listview', {}).done(function(tmpl)  {
          _this.$el.html(tmpl);
          _this.resetState();
          _this.initfetchRides();
          new Outpost.views.rid_listPageRet();
        });
      },

      events: {
        "change .lp-rid-providers": "filterProviders",
        "change #lp-rid-sortby": "sortListings",
        "click .btn-rid-map": "slideMap",
        "click .btn-rid-bookit": "checkUserState",
        "submit #ref-rid-form": "refineSearch"
      },

      resetState: function() {
        this.numOfLoadedBefore = 0;
        this.numOfLoadedAfter = 0;
        this.state = {
          prevSize: 0,
          page: 1
        };
      },

      initfetchRides: function() {
        var _this = this;
        var len = this.idtypes.length;
        var parseHTML = function(data) {
          isDone();
          _this.collection = _this.collection.concat(data);
          _this.sortedCollection = _(_this.collection).clone();
          Outpost.helpers.sortDate(_this.sortedCollection);
          _this.sortedRender();
          _this.updateHeading();
          _this.updateProviders();
          _this.filterProviders();
          $('#lp-rid-sortby').val("date");
        };

        var isDone = function() {
          _this.numOfLoadedBefore++;
          if (_this.numOfLoadedBefore && _this.numOfLoadedBefore % 4 === 0) {
            _this.toggleLoading();
          }
        };

        _this.toggleLoading();

        for (var i = 0; i < len; i++) {
          Outpost.helpers.fetchRideShares(
            this.state,
            this.idtypes[i]
          ).done(parseHTML);
        }
      },

      fetchRides: function() {
        var _this = this;
        var len = this.idtypes.length;

        var parseHTML = function(data) {
          isDone();
          _this.collection = _this.collection.concat(data);
          if (_this.numOfLoadedAfter <= 8) {
            _this.sortedCollection = _(_this.collection).clone();
            Outpost.helpers.sortDate(_this.sortedCollection);
            _this.sortedRender();
            _this.updateHeading();
            _this.updateProviders();
            _this.filterProviders();
            $('#lp-rid-sortby').val("date");
          } else {
            _this.render();
          }
        };

        var isDone = function() {
          _this.numOfLoadedAfter++;
          if (_this.numOfLoadedAfter && _this.numOfLoadedAfter % 4 === 0) {
            _this.toggleLoading();
          }
        };

        _this.toggleLoading();

        for (var i = 0; i < len; i++) {
          Outpost.helpers.fetchRideShares(
            this.state,
            this.idtypes[i]
          ).done(parseHTML);
        }
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

          $(".rid-extra").gmap3('destroy').empty().slideUp();
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

        this.lazyLoad();
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

      refineSearch: function(e) {
        e.preventDefault();
        var validatedValues = this.validate();
        var origCity = validatedValues.origCity;
        var destCity = validatedValues.destCity;
        var queryString = {
          origCity: Outpost.helpers.enbarURI(origCity),
          destCity: Outpost.helpers.enbarURI(destCity),
          sdate: $('#ref-rid-sdate').val(),
          edate: $('#ref-rid-edate').val(),
          guests: $('#ref-rid-guest').val()
        };
        queryString = "!/rides?" + $.param(queryString);
        Outpost.mvc.router.navigate(queryString, true);
      },

      validate: function() {
        var origCity = $("#ref-rid-orig-loc").val();
        var destCity = $("#ref-rid-dest-loc").val();
        var hasCommaOrig = origCity.indexOf(",");
        var hasCommaDest = destCity.indexOf(",");
        var $pcOrig = $('.pac-container:eq(0)');
        var $pcDest = $('.pac-container:eq(1)');
        var firstOrig = $pcOrig.find(".pac-item:first").text();
        var firstDest = $pcDest.find(".pac-item:first").text();
        origCity = hasCommaOrig === -1 ? firstOrig : origCity;
        destCity = hasCommaDest === -1 ? firstDest : destCity;
        return {
          origCity: origCity,
          destCity: destCity
        };
      },

      lazyLoad: function() {
        var $activeTab = $('.tab-pane.active');
        if ($activeTab.attr('id') === "lp-ridesharing") {
          $.waypoints('destroy');
          this.infiniteScroll();
        }
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
    // rides list view - listings (@RRIDLP)
    // =======================================================
    rid_listPageRet: Parse.View.extend({
      el: "#pg-listview",
      template: Outpost.helpers.renderTemplate,
      templateList: _.template($('#tmpl-rid-aList').html()),
      templateWell: _.template($('#tmpl-rid-well').html()),
      idtypes: ["blablacar", "kangaride", "ridejoy", "zimride"],
      collection: [],
      sortedCollection: [],
      numOfLoadedBefore: 0,
      numOfLoadedAfter: 0,
      state: {
        prevSize: 0,
        page: 1
      },

      initialize: function() {
        var _this = this;
        _this.resetState();
        _this.initfetchRides();
      },

      events: {
        "change .lp-rid-providers-ret": "filterProviders",
        "change #lp-rid-sortby-ret": "sortListings",
        "click .btn-rid-map": "slideMap",
        "click .btn-rid-bookit": "checkUserState"
      },

      resetState: function() {
        this.numOfLoadedBefore = 0;
        this.numOfLoadedAfter = 0;
        this.state = {
          prevSize: 0,
          page: 1
        };
      },

      initfetchRides: function() {
        var _this = this;
        var len = this.idtypes.length;
        var parseHTML = function(data) {
          isDone();
          _this.collection = _this.collection.concat(data);
          _this.sortedCollection = _(_this.collection).clone();
          Outpost.helpers.sortDate(_this.sortedCollection);
          _this.sortedRender();
          _this.updateHeading();
          _this.updateProviders();
          _this.filterProviders();
          $('#lp-rid-sortby-ret').val("date");
        };

        var isDone = function() {
          _this.numOfLoadedBefore++;
          if (_this.numOfLoadedBefore && _this.numOfLoadedBefore % 4 === 0) {
            _this.toggleLoading();
          }
        };

        _this.toggleLoading();

        for (var i = 0; i < len; i++) {
          Outpost.helpers.fetchRideSharesRet(
            this.state,
            this.idtypes[i]
          ).done(parseHTML);
        }
      },

      fetchRides: function() {
        var _this = this;
        var len = this.idtypes.length;

        var parseHTML = function(data) {
          isDone();
          _this.collection = _this.collection.concat(data);
          if (_this.numOfLoadedAfter <= 8) {
            _this.sortedCollection = _(_this.collection).clone();
            Outpost.helpers.sortDate(_this.sortedCollection);
            _this.sortedRender();
            _this.updateHeading();
            _this.updateProviders();
            _this.filterProviders();
            $('#lp-rid-sortby-ret').val("date");
          } else {
            _this.render();
          }
        };

        var isDone = function() {
          _this.numOfLoadedAfter++;
          if (_this.numOfLoadedAfter && _this.numOfLoadedAfter % 4 === 0) {
            _this.toggleLoading();
          }
        };

        _this.toggleLoading();

        for (var i = 0; i < len; i++) {
          Outpost.helpers.fetchRideSharesRet(
            this.state,
            this.idtypes[i]
          ).done(parseHTML);
        }
      },

      toggleLoading: function() {
        var $loader = $('#lp-rid-ls-ret');
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

          $(".rid-extra").gmap3('destroy').empty().slideUp();
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
        var $checked = $('.lp-rid-providers-ret:checked');
        if (!$checked.length) {
          $('.lp-aList-rid').show();
        } else {
          $('.lp-aList-rid').hide();
          $checked.each(function() {
            $('.alist-' + $(this).val()).show();
          });
        }

        this.lazyLoad();
      },

      updateHeading: function() {
        var data = {
          numOfItems: this.collection.length,
          destLocation: Outpost.searchQuery.origLocation,
          origLocation: Outpost.searchQuery.destLocation,
          date: Outpost.searchQuery.sdateObj
        };
        var html = this.templateWell(data);
        $('#lp-rid-well-ret').html(html);
      },

      updateProviders: function() {
        $('#fil-num-bbc-ret').text($('.alist-blablacar').length);
        $('#fil-num-kan-ret').text($('.alist-kangaride').length);
        $('#fil-num-rid-ret').text($('.alist-ridejoy').length);
        $('#fil-num-zim-ret').text($('.alist-zimride').length);
      },

      sortedRender: function() {
        var html = this.templateList({
          items: this.sortedCollection
        });
        $('#lp-rid-list-ret').html(html);
      },

      refineSearch: function(e) {
        e.preventDefault();
        var validatedValues = this.validate();
        var origCity = validatedValues.origCity;
        var destCity = validatedValues.destCity;
        var queryString = {
          origCity: Outpost.helpers.enbarURI(origCity),
          destCity: Outpost.helpers.enbarURI(destCity),
          sdate: $('#ref-rid-sdate').val(),
          edate: $('#ref-rid-edate').val(),
          guests: $('#ref-rid-guest').val()
        };
        queryString = "!/rides?" + $.param(queryString);
        Outpost.mvc.router.navigate(queryString, true);
      },

      validate: function() {
        var origCity = $("#ref-rid-orig-loc").val();
        var destCity = $("#ref-rid-dest-loc").val();
        var hasCommaOrig = origCity.indexOf(",");
        var hasCommaDest = destCity.indexOf(",");
        var $pcOrig = $('.pac-container:eq(0)');
        var $pcDest = $('.pac-container:eq(1)');
        var firstOrig = $pcOrig.find(".pac-item:first").text();
        var firstDest = $pcDest.find(".pac-item:first").text();
        origCity = hasCommaOrig === -1 ? firstOrig : origCity;
        destCity = hasCommaDest === -1 ? firstDest : destCity;
        return {
          origCity: origCity,
          destCity: destCity
        };
      },

      lazyLoad: function() {
        var $activeTab = $('.tab-pane.active');
        if ($activeTab.attr('id') === "lp-ridesharing-ret") {
          $.waypoints('destroy');
          this.infiniteScroll();
        }
      },

      render: function() {
        var html = this.templateList({
          items: this.collection
        });
        $('#lp-rid-list-ret').html(html);
        $('#lp-rid-sortby-ret').val("relevance");
        this.updateHeading();
        this.updateProviders();
        this.filterProviders();
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

        $(".tou-extra").gmap3('destroy').empty().slideUp();
        jhr.done(function(data) {
          var origin, dest, $extra, xhrDuration, $duration;
          var address = data.origin;
          $extra = $(".etou" + item.id);
          $extra.css("height", "225px");
          $extra.slideDown(function(){
            $extra.gmap3({
              marker: {
                address: address,
                data: address,
                events: {
                  mouseover: function(marker, event, context) {
                    var map = $(this).gmap3("get"),
                      infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow) {
                      infowindow.open(map, marker);
                      infowindow.setContent(context.data);
                    } else {
                      $(this).gmap3({
                        infowindow:{
                          anchor:marker,
                          options:{content: context.data}
                        }
                      });
                    }
                  },
                  mouseout: function() {
                    var infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow) {
                      infowindow.close();
                    }
                  }
                }
              },
              map: {
                options: {
                  zoom: 12
                }
              }
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

        this.lazyLoad();
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

      lazyLoad: function() {
        var $activeTab = $('.tab-pane.active');
        if ($activeTab.attr('id') === "lp-localguides") {
          $.waypoints('destroy');
          this.infiniteScroll();
        }
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

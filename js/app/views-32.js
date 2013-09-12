(function(window, $, _, Parse) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.views = {
    // ========================================================================
    // Main App View
    // ========================================================================
    main: Parse.View.extend({
      initialize: function() {
        // Initialize the navBar
        Outpost.mvc.views.navBar = new Outpost.views.navBar();

        // Initialize the router module
        Outpost.mvc.router = new Outpost.routes.AppRouter();
        Backbone.history.start();
      }
    }),

    // ========================================================================
    // Navbar View
    // ========================================================================
    navBar: Parse.View.extend({
      el: '#js-navbar',
      template: _.template($('#tmpl-navbar').html()),

      events: {
        "click .js-logout": "logoutUser",
        "click #sign-up-btn": "showSignupModal",
        "click #login-in-btn": "showLoginModal"
      },

      initialize: function() {
        var user = Parse.User.current();
        var data = {};
        if (user) {
          data.name = user.get("first_name");
        }

        new Outpost.views.signupModal();
        this.render(data);
        this.loadBlogPost();
      },

      showLoginModal: function() {
        var $signup = $('#signup-form');
        var $login = $('#login-form');
        var $header = $('#signup-outpost-header');
        $header.text("Log in to Outpost");
        $signup.slideUp(function() {
          $login.slideDown(function() {
            $('#js-lo-email').focus();
          });
        });
        setTimeout(function () {
          $('#js-lo-email').focus();
        }, 600);
      },

      showSignupModal: function() {
        var $signup = $('#signup-form');
        var $login = $('#login-form');
        var $header = $('#signup-outpost-header');
        $header.text("Sign up for Outpost");
        $login.slideUp(function() {
          $signup.slideDown(function() {
            $('#js-su-first_name').focus();
          });
        });
        setTimeout(function () {
          $('#js-su-first_name').focus();
        }, 600);
      },

      logoutUser: function() {
        Parse.User.logOut();
        this.render({});
      },

      loadBlogPost: function() {
        $.ajax({
          url: "http://api.tumblr.com/v2/blog/outposttravel.tumblr.com/posts",
          type: "GET",
          data: {
            api_key: "g1iguGKeyU5GYJbQXil31DGocG8gCsYvx32YDDv8vEpONMxfi9",
            limit: 1,
            type: "text"
          },
          dataType: "jsonp"
        }).done(function(data) {
          var text = "";
          var date = "";
          var timestamp = 0;
          if (data && data.meta.status === 200) {
            data = data.response.posts[0];
            text = ($(data.body).text()).substring(0, 160) + "... ";
            timestamp = moment.unix(data.timestamp);
            date = timestamp.format("MM/DD/YYYY");
            $('#blog-title').text(data.title + " [" + date + "]");
            $('#blog-text').html(
              text +
              '<a href="http://blog.outpost.travel/" target="_blank">[read more]</a>'
            );
          }
        });
      },

      render: function(data) {
        this.$el.html(this.template(data));
      }
    }),

    // ========================================================================
    // Home - Page
    // ========================================================================
    indexPage: Parse.View.extend({
      el: "#pg-home",
      template: Outpost.helpers.renderTemplate,

      initialize: function() {
        this.render();

        // Preload homepage images
        $(['/img/rentalsbg.jpg','/img/ridesbg.jpg','/img/expbg.jpg']).preload();
      },

      events: {
        "submit #sl-hou-searchForm": "houSubmitForm",
        "submit #sl-rid-searchForm": "ridSubmitForm",
        "submit #sl-exp-searchForm": "expSubmitForm",
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
            $('#sl-hou-dest-location-input').focus();
            $("#main-head").css({
              backgroundImage: "url(../img/rentalsbg.jpg)"
            });
            $(".marketing-wrapper").animate({
              backgroundColor: "rgba(41, 128, 185, 0.80)"
            }, 500);
            break;
          case "rides":
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
            $('#sl-exp-dest-location-input').focus();
            $("#main-head").css({
              backgroundImage: "url(../img/expbg.jpg)"
            });
            $(".marketing-wrapper").animate({
              backgroundColor: "rgba(39, 174, 96, 0.80)"
            }, 500);
            break;
        }
        Outpost.helpers.detectNavBar(tab);
      },

      houSubmitForm: function(e) {
        e.preventDefault();

        // Remove datepicker UI from page
        $('.ui-datepicker').hide();

        var destCity = $("#sl-hou-dest-location-input").val();
        var hasComma = destCity.indexOf(",");
        var newDestCity = hasComma === -1 ? $('.pac-item:first').text() : destCity;
        if (!newDestCity) {
          newDestCity =  destCity;
        }
        var queryString = {
          destCity: Outpost.helpers.enbarURI(newDestCity),
          sdate: $('#sl-hou-sdate-input').val(),
          edate: $('#sl-hou-edate-input').val(),
          guests: $('#sl-hou-guest-input').val(),
          page: 1
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
        var newOrigCity = hasCommaOrig === -1 ? firstOrig : origCity;
        var newDestCity = hasCommaDest === -1 ? firstDest : destCity;
        if (!newOrigCity) {
          newOrigCity =  origCity;
        }
        if (!newDestCity) {
          newDestCity =  destCity;
        }
        var queryString = {
          origCity: Outpost.helpers.enbarURI(newOrigCity),
          destCity: Outpost.helpers.enbarURI(newDestCity),
          sdate: $('#sl-rid-sdate-input').val(),
          guests: $('#sl-rid-guest-input').val()
        };
        queryString = $.param(queryString);
        this.navigateTo("!/rides?" + queryString);
      },

      expSubmitForm: function(e) {
        e.preventDefault();

        // Remove datepicker UI from page
        $('.ui-datepicker').hide();

        var destCity = $("#sl-exp-dest-location-input").val();
        var hasComma = destCity.indexOf(",");
        var $pcDest = $('.pac-container:eq(3)');
        var newDestCity = hasComma === -1 ? $pcDest.find('.pac-item:first').text() : destCity;
        if (!newDestCity) {
          newDestCity =  destCity;
        }
        var queryString = {
          destCity: Outpost.helpers.enbarURI(newDestCity)
        };
        queryString = $.param(queryString);
        this.navigateTo("!/experiences?" + queryString);
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
          Outpost.helpers.triggerReady();
        });
      }
    }),

    // ========================================================================
    // SingleView - Page (@SPV)
    // ========================================================================
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

    // ========================================================================
    // ListView - Page (@LVP)
    // ========================================================================
    listPage: Parse.View.extend({
      el: "#pg-listview",

      initialize: function() {
        this.render();
      },

      render: function() {
        var cities = Outpost.helpers.cutCities();
        var orig = cities.origcity;
        var dest = cities.destcity;
        var to = "";
        if (orig && dest) {
          to = " to ";
        }
        this.$el.off().empty();
        $('.pg-page').empty();
        switch (Outpost.list.type) {
          case "rentals":
            Outpost.helpers.alternateSEO({
              title: dest +
                " Vacation Rentals, Location and Place rentals, " +
                "including short term and long term rentals and Private and Shared " +
                "Rooms for Rent - Outpost",
              description: "Find great vacation rental deals in " + dest +
              " with Outpost Place " +
              "Rentals. Search for rates for cheap location rentals. " +
              "Compare prices, and reserve with confidence!"
            });
            new Outpost.views.ren_listPage();
            break;
          case "rides":
            Outpost.helpers.alternateSEO({
              title: orig + to + dest + " - Outpost, find rideshares and carpooling " +
                "from all over the world",
              description: "Find rides from " + orig + to + dest + " - Outpost " +
                "aggregates from many carpooling websites and shoves them into one place!"
            });
            new Outpost.views.rid_listPage();
            break;
          case "experiences":
            Outpost.helpers.alternateSEO({
              title: "Unique Travel Experiences, Things to do in " + dest + " - Outpost",
              description: "Find and discover, unique travel experiences, in " + dest +
                ", including tours, activities and extended with Outpost."
            });
            new Outpost.views.exp_listPage();
            break;
        }
      }
    }),

    // ========================================================================
    // rentals list view - listings (@RENLP)
    // ========================================================================
    ren_listPage: Parse.View.extend({
      el: "#pg-listview",
      template: Outpost.helpers.renderTemplate,
      templateList: _.template($('#tmpl-hou-aList').html()),
      templateWell: _.template($('#tmpl-hou-well').html()),
      templateCarousel: _.template($('#tmpl-carousel').html()),
      collection: [],

      initialize: function() {
        var _this = this;
        _this.template('ren_listview', {}).done(function(tmpl) {
          _this.$el.html(tmpl);
          _this.preDetermineSettings();
          _this.initSliderGUI();
          _this.fetchRentals();
        });
      },

      events: {
        "change .lp-hou-roomtype": "filterRoomType",
        "change .lp-hou-property": "filterPropType",
        "change #lp-hou-sortby": "sortListings",
        "change #ref-ren-guest": "guestChange",
        "click .btn-hou-map": "slideMap",
        "click .lp-list-img": "slideCarousel",
        "click .btn-hou-bookit": "checkUserState",
        "submit #ref-ren-form": "refineSearch"
      },

      initSliderGUI: function() {
        var _this = this;
        var min = Outpost.searchQuery.rentals.min;
        var max = Outpost.searchQuery.rentals.max;
        $("#lp-price-input-hou").slider({
          range: true,
          values: [min, max],
          min: 0,
          max: 1000,
          step: 10,
          slide: function (event, ui) {
            $("#lp-price-value-min-hou").text(ui.values[0]);
            if (ui.values[1] === 1000) {
              $("#lp-price-value-max-hou").text("1000+");
            } else {
              $("#lp-price-value-max-hou").text(ui.values[1]);
            }
          },
          change: function(event, ui) {
            Outpost.searchQuery.rentals.min = ui.values[0];
            Outpost.searchQuery.rentals.max = ui.values[1];
            _this.refreshQuery();
          }
        });
      },

      preDetermineSettings: function() {
        if (Outpost.searchQuery.guests >= 4) {
          $('#roomtype-entire_place').attr('checked', 'checked');
          $('#roomtype-private_room').attr('checked', false);
          $('#roomtype-shared_room').attr('checked', false);
          Outpost.searchQuery.rentals.roomType = ["entire_place"];
        }
      },

      fetchRentals: function() {
        var _this = this;
        var parseHTML = function(data) {
          if (data.status === 200) {
            _this.collection = _this.collection.concat(data.rentals);
            _this.toggleLoading();
            _this.initPagination(data.page, data.totalPages);
            _this.updateHeading(data.totalResults);
            _this.render();
            Outpost.helpers.triggerReady();
          } else {
            _this.toggleLoading();
            $('#lp-hou-well').html(
              '<b class="css-red">Something went wrong in our system..</b>&nbsp;' +
              '<a href="javascript:Outpost.helpers.genSearchParamsAndGo(\'rentals\', true)">Try again ?</a>'
            );
          }
        };

        _this.toggleLoading();
        Outpost.helpers.loadRentals().done(parseHTML);
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

      initPagination: function(currentPage, totalPages) {
        $('#ren-list-page').bootstrapPaginator({
          currentPage: currentPage,
          totalPages: totalPages,
          alignment:'right',
          useBootstrapTooltip: true,
          onPageChanged: function(e, oldPage, newPage) {
            Outpost.searchQuery.rentals.page = newPage;
            Outpost.helpers.genSearchParamsAndGo("rentals");
          },
          itemTexts: function (type, page, current) {
            switch (type) {
              case "first":
                  return "First";
              case "prev":
                  return "&laquo;";
              case "next":
                  return "&raquo;";
              case "last":
                  return "Last";
              case "page":
                  return page;
            }
          },
          itemContainerClass: function(type, page, current) {
            return (page === current) ? "active" : "pointer-cursor";
          }
        });
      },

      slideCarousel: function(e) {
        var _this = this;
        var $this = $(e.currentTarget);
        var rowClass = $("." + $this.data("id"));
        var item = rowClass.data('item');
        var $extra = $(".ehou" + item.id);
        $(".hou-extra").gmap3('destroy').empty().slideUp();
        $extra.slideDown(function() {
          var html = _this.templateCarousel(item);
          $extra.css("height", "425px");
          $extra.html(html);
          $('body, html').animate({
            scrollTop: $(rowClass).offset().top
          }, 300);
        });
      },

      slideMap: function(e) {
        var $this = $(e.currentTarget);
        var item = $("." + $this.data("id")).data('item');

        var origin, dest, $extra, xhrDuration, $duration;
        var latLng = item.latLng;
        $extra = $(".ehou" + item.id);
        $extra.css("height", "425px");
        $(".hou-extra").gmap3('destroy').empty().slideUp();
        $extra.slideDown(function() {
          $extra.gmap3({
            marker: {
              latLng: latLng,
              data: item.address,
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
      },

      refineSearch: function(e) {
        e.preventDefault();
        Outpost.searchQuery.destLocation = this.validate(
          $('#ref-ren-dest-loc').val()
        );
        this.refreshQuery();
      },

      validate: function(destCity) {
        var hasCommaDest = destCity.indexOf(",");
        var $pcDest = $('.pac-container');
        var firstDest = $pcDest.find(".pac-item:first").text();
        var newDestCity = hasCommaDest === -1 ? firstDest : destCity;
        if (!newDestCity) {
          newDestCity =  destCity;
        }
        return newDestCity;
      },

      refreshQuery: function() {
        $.xhrPool.abortAll();
        Outpost.searchQuery.rentals.page = 1;
        Outpost.helpers.genSearchParamsAndGo("rentals");
      },

      checkUserState: function(e) {
        Outpost.helpers.checkUserState(e);
      },

      sortListings: function(e) {
        Outpost.searchQuery.rentals.sortBy = $(e.currentTarget).val();
        this.refreshQuery();
      },

      guestChange: function(e) {
        Outpost.searchQuery.guests = $(e.currentTarget).val();
        this.refreshQuery();
      },

      filterRoomType: function() {
        var $checked = $('.lp-hou-roomtype:checked');
        var roomType = [];
        $checked.each(function() {
          roomType.push($(this).val());
        });
        Outpost.searchQuery.rentals.roomType = roomType;

        this.refreshQuery();
      },

      filterPropType: function() {
        var $checked = $('.lp-hou-property:checked');
        var propertyType = [];
        $checked.each(function() {
          propertyType.push($(this).val());
        });
        Outpost.searchQuery.rentals.propertyType = propertyType;

        this.refreshQuery();
      },

      updateHeading: function(totalResults) {
        var data = {
          numOfItems: totalResults,
          origLocation: Outpost.searchQuery.origLocation,
          destLocation: Outpost.searchQuery.destLocation,
          sdate: Outpost.searchQuery.sdateObj,
          edate: Outpost.searchQuery.edateObj,
          guests: Outpost.searchQuery.guests
        };
        var html = this.templateWell(data);
        $('#lp-hou-well').html(html);
      },

      render: function() {
        var html = this.templateList({
          items: this.collection
        });
        $('#lp-hou-list').html(html);
      }
    }),

    // ========================================================================
    // rides list view - listings (@RIDLP)
    // ========================================================================
    rid_listPage: Parse.View.extend({
      el: "#pg-listview",
      template: Outpost.helpers.renderTemplate,
      templateList: _.template($('#tmpl-rid-aList').html()),
      templateWell: _.template($('#tmpl-rid-well').html()),
      idtypes: ["blablacar", "craigslist", "kangaride",
                "ridejoy", "ridester", "zimride"],
      numOfLoaded: 0,
      collection: [],
      sortedCollection: [],
      state: {
        prevSize: 0,
        page: 1
      },

      initialize: function() {
        var _this = this;
        _this.template('rid_listview', {}).done(function(tmpl)  {
          _this.$el.html(tmpl);
          _this.resetState();
          _this.fetchRides();
        });
      },

      events: {
        "change .lp-rid-providers": "filterProviders",
        "change #lp-rid-sortby": "sortListings",
        "click .btn-rid-map": "slideMap",
        "click .btn-rid-bookit": "checkUserState",
        "click #ret-arrow": "swapCities",
        "submit #ref-rid-form": "refineSearch"
      },

      resetState: function() {
        this.numOfLoaded = 0;
        this.state = {
          prevSize: 0,
          page: 1
        };
      },

      fetchRides: function() {
        var _this = this;
        var len = this.idtypes.length;
        var i = 0;
        var parseHTML = function(data) {
          _this.collection = _this.collection.concat(data.rides);
          _this.render();
          _this.numOfLoaded++;
          if (_this.numOfLoaded % len === 0) {
            _this.toggleLoading();
            Outpost.helpers.triggerReady();
          }
          if (data.page === 1) {
            _this.updateProviders(
              data.provider, data.idtype, data.entries, false
            );
          } else {
            _this.updateProviders(
              data.provider, data.idtype, data.entries, true
            );
          }
        };

        _this.toggleLoading();

        for (i = 0; i < len; i++) {
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
          origin = origin.trim();
          dest = dest.trim();
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
        Outpost.helpers.checkUserState(e);
      },

      sortListings: function(e, value) {
        var sortby = value ? value : $(e.currentTarget).val();
        this.sortedCollection = _(this.collection).clone();
        switch (sortby) {
          case "provider":
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
          // numOfResults
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
        $('#fil-num-cra').text($('.alist-craigslist').length);
        $('#fil-num-kan').text($('.alist-kangaride').length);
        $('#fil-num-rid').text($('.alist-ridejoy').length);
        $('#fil-num-rids').text($('.alist-ridester').length);
        $('#fil-num-zim').text($('.alist-zimride').length);
      },

      sortedRender: function() {
        var html = this.templateList({
          items: this.sortedCollection
        });
        $('#lp-rid-list').html(html);
      },

      swapCities: function() {
        var $orig = $("#ref-rid-orig-loc"),
            $dest = $("#ref-rid-dest-loc");

        var origCity = $orig.val(),
            destCity = $dest.val();

        $orig.val(destCity);
        $dest.val(origCity);

        this.refineSearch();
      },

      refineSearch: function(e) {
        var temp = e && e.preventDefault();
        var validatedValues = this.validate();
        var origCity = validatedValues.origCity;
        var destCity = validatedValues.destCity;
        var queryString = {
          origCity: Outpost.helpers.enbarURI(origCity),
          destCity: Outpost.helpers.enbarURI(destCity),
          sdate: $('#ref-rid-sdate').val(),
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
        var newOrigCity = origCity ? hasCommaOrig === -1 ? firstOrig : origCity : '';
        var newDestCity = destCity ? hasCommaDest === -1 ? firstDest : destCity : '';
        if (!newOrigCity) {
          newOrigCity =  origCity;
        }
        if (!newDestCity) {
          newDestCity =  destCity;
        }
        return {
          origCity: newOrigCity,
          destCity: newDestCity
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
        this.sortListings("", $('#lp-rid-sortby').val());
        this.updateHeading();
        this.filterProviders();
      }
    }),


    // ========================================================================
    // experiences list view - listings (@EXPLP)
    // ========================================================================
    exp_listPage: Parse.View.extend({
      el: "#pg-listview",
      template: Outpost.helpers.renderTemplate,
      templateList: _.template($('#tmpl-tou-aList').html()),
      templateWell: _.template($('#tmpl-tou-well').html()),
      idtypes: ["vayable"],
      numOfLoaded: 0,
      collection: [],
      sortedCollection: [],
      state: {
        prevSize: 0,
        page: 1
      },

      initialize: function() {
        var _this = this;
        _this.template('exp_listview', {}).done(function(tmpl)  {
          _this.$el.html(tmpl);
          _this.resetState();
          _this.fetchGuides();
        });

      },

      events: {
        "change .lp-tou-providers": "filterProviders",
        "change #lp-tou-sortby": "sortListings",
        "click .btn-tou-map": "slideMap",
        "click .btn-tou-bookit": "checkUserState",
        "submit #ref-exp-form": "refineSearch"
      },

      resetState: function() {
        this.numOfLoaded = 0;
        this.state = {
          prevSize: 0,
          page: 1
        };
      },

      fetchGuides: function() {
        var _this = this;
        var len = this.idtypes.length;
        var parseHTML = function(data) {
          _this.collection = _this.collection.concat(data);
          _this.render();
          _this.numOfLoaded++;
          if (_this.numOfLoaded % len === 0) {
            _this.toggleLoading();
            Outpost.helpers.triggerReady();
          }
        };

        _this.toggleLoading();

        for (var i = 0; i < len; i++) {
          Outpost.helpers.fetchGuides(
            this.state,
            this.idtypes[i]
          ).done(parseHTML);
        }
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
        Outpost.helpers.checkUserState(e);
      },

      sortListings: function(e, value) {
        var sortby = value ? value : $(e.currentTarget).val();
        this.sortedCollection = _(this.collection).clone();
        switch (sortby) {
          case "provider":
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

      refineSearch: function(e) {
        e.preventDefault();
        var destCity = $("#ref-exp-dest-loc").val();
        var hasComma = destCity.indexOf(",");
        var newDestCity = hasComma === -1 ? $('.pac-item:first').text() : destCity;
        if (!newDestCity) {
          newDestCity =  destCity;
        }
        var queryString = {
          destCity: Outpost.helpers.enbarURI(newDestCity)
        };
        queryString = "!/experiences?" + $.param(queryString);
        Outpost.mvc.router.navigate(queryString, true);
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
        this.sortListings("", $('#lp-tou-sortby').val());
        this.updateHeading();
        this.updateProviders();
        this.filterProviders();
      }
    }),

    // ========================================================================
    // Rideshare - Single Page View
    // ========================================================================
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
          getroute: {
            options: {
              origin: origin,
              destination: dest,
              travelMode: google.maps.DirectionsTravelMode.DRIVING
            },
            callback: function(results) {
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
        Outpost.helpers.checkUserState(e);
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
            Outpost.helpers.triggerReady();
          });
        });
      }
    }),

    // ========================================================================
    // Houseretntals - Single Page View
    // ========================================================================
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
        var street = new google.maps.LatLng(data.latLng[0],data.latLng[1]);
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
        var latLng = this.data.latLng;
        var jhr = Outpost.helpers.latLngToAddr(latLng);
        jhr.done(function(address) {
          address = address.results[0].formatted_address;
          $("#single-map").gmap3({
            marker: {
              latLng: latLng,
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
      },

      checkUserState: function(e) {
        Outpost.helpers.checkUserState(e);
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
            Outpost.helpers.triggerReady();
          });
        });
      }
    }),

    // ========================================================================
    // Tourism - Single Page View
    // ========================================================================
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
        Outpost.helpers.checkUserState(e);
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
            Outpost.helpers.triggerReady();
          });
        });
      }
    }),

    // ========================================================================
    // Signup - Modal
    // ========================================================================
    signupModal: Parse.View.extend({
      el: '#js-signup-modal',

      initialize: function() {
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
          $signup.slideUp(function() {
            $login.slideDown(function() {
              $('#js-lo-email').focus();
            });
          });
        } else {
          $header.text("Sign up for Outpost");
          $login.slideUp(function() {
            $signup.slideDown(function() {
              $('#js-su-first_name').focus();
            });
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

            _gaq.push(['_trackEvent', 'registration', 'signedup', $nodeArr[2].val()]);
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

    // ========================================================================
    // Help - Page
    // ========================================================================
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
          Outpost.helpers.triggerReady();
        });
      }
    })
  };
})(window, jQuery, _, Parse, undefined);

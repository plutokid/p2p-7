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
    // Sidebar view
    // =======================================================
    sideBar: Parse.View.extend({
      el: '#sidebar',
      template: Outpost.helpers.renderTemplate,
      templateOffline: _.template($('#tmpl-resultInfo').html()),

      initialize: function() {
        this.render();
      },

      events: {
        "shown .mv-tab": "initLazyLoad"
      },

      initLazyLoad: function(e) {
        var target = $(e.target).attr("id");
        $.waypoints('destroy');
        switch(target) {
          case "js-houserentalmenu":
            Outpost.mvc.views.houserental.infiniteScroll();
            break;
          case "js-ridesharemenu":
            Outpost.mvc.views.rideshare.infiniteScroll();
            break;
          case "js-tourismmenu":
            Outpost.mvc.views.tourism.infiniteScroll();
            break;
        }
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
        Outpost.mvc.views.rideshare.clearDataReturn();
        Outpost.mvc.views.tourism.clearData();
        $('.js-lists').empty();
      },

      fetchAll: function() {
        Outpost.mvc.views.houserental.fetchData();
        Outpost.mvc.views.rideshare.fetchData();
        Outpost.mvc.views.rideshare.fetchDataReturn();
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
        _this.template('sidebar', {}).done(function(tmpl) {
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
        var destValue = $('#js-search-again').val();
        var destPath = "!/mapview/" + encodeURI(destValue);
        var origValue = $('#js-orig-location-input').val();
        var origPath = "!/mapview/" + encodeURI(origValue);
        if (destValue === '') {
          if (origValue === '') {
            return;
          } else {
            Outpost.state.numOfRes = 0;
            Outpost.state.isOriginOnly = true;
            Outpost.helpers.defineDestLoc(origValue);
            Outpost.helpers.defineOrigLoc(origValue);
            Outpost.mvc.router.navigate(origPath);
            Outpost.helpers.resetPages();
            Outpost.mvc.views.map.removeAllMarkers();
            Outpost.mvc.views.map.redefineMap();
            Outpost.mvc.views.sideBar.updateNavbarRes();
            Outpost.mvc.views.sideBar.clearAllListings();
            Outpost.mvc.views.sideBar.fetchAll();
          }
        } else {
          this.setFilterVar();
          Outpost.state.isOriginOnly = false;
          Outpost.state.numOfRes = 0;
          Outpost.helpers.defineDestLoc(destValue);
          Outpost.helpers.defineOrigLoc(origValue);
          Outpost.helpers.resetPages();
          Outpost.mvc.views.map.removeAllMarkers();
          Outpost.mvc.views.map.redefineMap();
          Outpost.mvc.views.sideBar.updateNavbarRes();
          Outpost.mvc.views.sideBar.clearAllListings();
          Outpost.mvc.views.sideBar.fetchAll();
          Outpost.mvc.router.navigate(destPath);
        }

        var cities = Outpost.helpers.cutCities();
        var origcity = cities.origcity;
        var destcity = cities.destcity;
        $('.rid-menu-first').text(origcity + ' → ' + destcity);
        $('.rid-menu-second').text(destcity + ' → ' + origcity);
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
        var options = {
          types: ['(cities)']
        };
        new google.maps.places.Autocomplete($('#js-orig-location-input')[0], options);
        new google.maps.places.Autocomplete($('#js-search-again')[0], options);

        if (Outpost.state.isOriginOnly) {
          $('#js-orig-location-input').val(Outpost.values.origLocation);
        } else {
          $('#js-search-again').val(Outpost.values.destLocation);
        }

        $('#map').css('height', Outpost.state.rMapHeight);
        $('#js-inner').css('min-height', Outpost.state.rMapHeight + 8);

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

        $(window).resize(function() {
          Outpost.state.rMapHeight = $(window).height() - 41;
          $('#map').css('height', Outpost.state.rMapHeight);
        });
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
      prevSize: 0,
      divCollection: [],
      itemStore: {
        prefix: "hou",
        sortType: "relevance",
        infoWindowTmpl: Outpost.tmpl.houserentalInfo,
        icon: new google.maps.MarkerImage(
          'img/houserental/image.png',
          new google.maps.Size(39,50),
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
        "click .roomtypebtn": "filterRoomType",
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
            _this.prevSize = 0;
            _this.infiniteScroll();
            $.waypoints('destroy');
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
        Outpost.mvc.views.map.removeMarkers("hou");
        Outpost.state.page.air = 1;
        Outpost.state.readyHOU = false;
        this.$el
         .find('#houserental-list')
         .empty();
      },

      loadMore: function() {
        $.waypoints('destroy');
        this.itemStore.animation = google.maps.Animation.DROP;
        Outpost.state.page.air += 1;
        this.fetchData();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#houserental-loading');
        var $loadMore = $('#lm-air');
        var query = Outpost.helpers.genSearchQuery();
        query += String(Outpost.state.page.air) +
                String(this.min) + String(this.max) + "hou";
        query += $('.roomtypebtn.filterme').text();
        if (!Outpost.listingsCache[query]) {
          Outpost.listingsCache[query] = this.collection.fetch({
            beforeSend: function() {
              $loading.show();
              $loadMore.button('loading');
            },
            error: function() {
              Outpost.helpers.showAlertBox({
                type: "alert-error",
                text: "<strong>Sorry!</strong>" +
                      " something went wrong! Trying again.."
              });
              $('#lm-air').button('reset');
              Outpost.values.numOfTimeout++;
              if (Outpost.values.numOfTimeout < 9) {
                _this.clearAndFetch();
              }
            }
          });
        }

        if (typeof Outpost.listingsCache[query].done === 'function') {
          Outpost.listingsCache[query].done(function(data) {
            _this.arrCollection = data;
            $loading.hide();
            $loadMore.button('reset');
            _this.render();
            sessionStorage[query] = JSON.stringify(Outpost.listingsCache[query]);
          });
        } else {
          this.arrCollection = Outpost.listingsCache[query].responseJSON;
          $loading.hide();
          $loadMore.button('reset');
          _this.render();
        }

      },

      filterRoomType: function(e) {
        var $curr = $(e.currentTarget);
        if ($curr.hasClass("filterme")) {
          $curr.removeClass("filterme");
        } else {
          $curr.addClass("filterme");
        }
        this.clearAndFetch();
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

      infiniteScroll: function() {
        var size, _this = this, tr;
        tr = this.itemStore.nodeUnit;
        size = $(tr).length;
        _this.prevSize = size;
        size =  _this.prevSize - 10;
        if (size < 0) {
          if (size - _this.prevSize < 8) {
            _this.loadMore();
          }
          size = 0;
        }

        $(tr + ':eq(' + size + ')').waypoint(function(direction) {
          if (direction === "down" && Outpost.state.readyHOU) {
            _this.loadMore();
          }
        });

        Outpost.state.readyHOU = true;
      },

      render: function() {
        var collection, _this = this;
        if (this.collection.length) {
          collection = this.collection.toJSON();
        } else {
          collection = this.arrCollection;
        }
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
          this.infiniteScroll();
        } else if (Outpost.state.page.air !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-air').button('reset');
          $.waypoints('destroy');
        } else if (!$('.tr-houserental').length) {
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
      templateReturn: _.template($('#tmpl-rideshareRowReturn').html()),
      min: 0,
      max: 300,
      divCollection: [],
      divCollectionReturn: [],
      prevSize: 0,
      prevSizeReturn: 0,
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
        shape: {
          coord: Outpost.values.coord,
          type: 'poly'
        },
        iconHover: "img/rideshare/hover.png",
        nodeList: "#rideshare-list",
        nodeListReturn: "#rideshare-list-return",
        nodeTab: "#js-ridesharemenu",
        nodeUnit: ".tr-rideshare",
        nodeUnitReturn: ".tr-rideshareReturn",
        animation: ""
      },

      itemStoreReturn: {
        prefix: "rid",
        sortType: "relevance",
        infoWindowTmpl: Outpost.tmpl.rideshareInfo,
        icon: new google.maps.MarkerImage(
          'img/rideshare/image.png',
          new google.maps.Size(39,50),
          new google.maps.Point(0,0),
          new google.maps.Point(20,50)
        ),
        shape: {
          coord: Outpost.values.coord,
          type: 'poly'
        },
        iconHover: "img/rideshare/hover.png",
        nodeList: "#rideshare-list-return",
        nodeListReturn: "#rideshare-list-return",
        nodeTab: "#js-ridesharemenu",
        nodeUnit: ".tr-rideshareReturn",
        nodeUnitReturn: ".tr-rideshareReturn",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.initSliderGUI();
        this.collection = new Outpost.collections.rideshare();
        this.collectionReturn = new Outpost.collections.rideshareReturn();
        this.fetchData();
        this.fetchDataReturn();
      },

      events: {
        "change #js-sortby-input-rid": "sortBy",
        "click .tr-rideshare": "openInfoWindow",
        "click .tr-rideshareReturn": "openInfoWindowReturn",
        "click .routeit": "routeIt",
        "click #lm-rid": "loadMore",
        "click #lm-ridReturn": "loadMoreReturn",
        "mouseenter .tr-rideshare": "highlightMarker",
        "mouseleave .tr-rideshare": "normalizeMarker",
        "mouseenter .tr-rideshareReturn": "highlightMarkerReturn",
        "mouseleave .tr-rideshareReturn": "normalizeMarkerReturn"
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
            _this.priceFilterReturn();
          },
          change: function() {
            _this.priceMarkerFilter();
            _this.priceMarkerFilterReturn();
            _this.prevSize = 0;
            _this.prevSizeReturn = 0;
            _this.infiniteScroll();
            _this.infiniteScrollReturn();
            $.waypoints('destroy');
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

      priceFilterReturn: function() {
        Outpost.helpers.priceFilter({
          itemStore: this.itemStoreReturn,
          collection: this.divCollectionReturn,
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

      priceMarkerFilterReturn: function() {
        Outpost.helpers.priceMarkerFilter({
          itemStore: this.itemStoreReturn,
          collection: this.divCollectionReturn,
          min: this.min,
          max: this.max
        });
      },

      sortBy: function(e) {
        this.itemStore.sortType = $(e.currentTarget).val();
        this.itemStoreReturn.sortType = $(e.currentTarget).val();
        this.sortDiv();
        this.sortDivReturn();
      },

      sortDiv: function() {
        Outpost.helpers.sortDiv({
          itemStore: this.itemStore
        });
        this.divCollection = $('.tr-rideshare');
      },

      sortDivReturn: function() {
        Outpost.helpers.sortDiv({
          itemStore: this.itemStoreReturn
        });
        this.divCollectionReturn = $('.tr-rideshareReturn');
      },

      clearAndFetch: function() {
        this.clearData();
        this.fetchData();
      },

      clearAndFetchReturn: function() {
        this.clearDataReturn();
        this.fetchDataReturn();
      },

      clearData: function() {
        this.divCollection = [];
        this.itemStore.animation = "";
        Outpost.mvc.views.map.removeMarkers("rid");
        Outpost.state.page.rid = 1;
        Outpost.state.readyRID = false;
        this.$el
         .find('#rideshare-list')
         .empty();
      },

      clearDataReturn: function() {
        this.divCollectionReturn = [];
        this.itemStoreReturn.animation = "";
        Outpost.mvc.views.map.removeMarkers("rid");
        Outpost.state.page.ridReturn = 1;
        Outpost.state.readyRID = false;
        this.$el
         .find('#rideshare-list-return')
         .empty();
      },

      loadMore: function() {
        $.waypoints('destroy');
        this.itemStore.animation = google.maps.Animation.DROP;
        Outpost.state.page.rid += 1;
        this.fetchData();
      },

      loadMoreReturn: function() {
        $.waypoints('destroy');
        this.itemStoreReturn.animation = google.maps.Animation.DROP;
        Outpost.state.page.ridReturn += 1;
        this.fetchDataReturn();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#rideshare-loading');
        var query = Outpost.helpers.genSearchQuery() + "rid" +
            Outpost.state.page.rid;
        var $loadMore = $('#lm-rid');

        if (!Outpost.listingsCache[query]) {
          Outpost.listingsCache[query] = this.collection.fetch({
            beforeSend: function() {
              $loading.show();
              $loadMore.button('loading');
            },
            error: function() {
              Outpost.helpers.showAlertBox({
                type: "alert-error",
                text: "<strong>Sorry!</strong>" +
                      " something went wrong! Trying again.."
              });
              $loadMore.button('reset');
              Outpost.values.numOfTimeout++;
              if (Outpost.values.numOfTimeout < 9) {
                _this.clearAndFetch();
              }
            }
          });
        }

        if (typeof Outpost.listingsCache[query].done === 'function') {
          Outpost.listingsCache[query].done(function(data) {
            _this.arrCollection = data;
            $loading.hide();
            $loadMore.button('reset');
            _this.render();
            sessionStorage[query] = JSON.stringify(Outpost.listingsCache[query]);
          });
        } else {
          this.arrCollection = Outpost.listingsCache[query].responseJSON;
          $loading.hide();
          $loadMore.button('reset');
          _this.render();
        }
      },

      fetchDataReturn: function() {
        var _this = this;
        var $loadingReturn = $('#rideshare-loading-return');
        var query = Outpost.helpers.genSearchQuery() + "rid" +
            Outpost.state.page.rid;
        var $loadMoreReturn = $('#m-rid-return');
        var queryReturn = query + "return";

        if (!Outpost.listingsCache[queryReturn]) {
          Outpost.listingsCache[queryReturn] = this.collectionReturn.fetch({
            beforeSend: function() {
              $loadingReturn.show();
              $loadMoreReturn.button('loading');
            },
            error: function() {
              Outpost.helpers.showAlertBox({
                type: "alert-error",
                text: "<strong>Sorry!</strong>" +
                      " something went wrong! Trying again.."
              });
              $loadMoreReturn.button('reset');
              Outpost.values.numOfTimeout++;
              if (Outpost.values.numOfTimeout < 9) {
                _this.clearAndFetchReturn();
              }
            }
          });
        }

        if (typeof Outpost.listingsCache[queryReturn].done === 'function') {
          Outpost.listingsCache[queryReturn].done(function(data) {
            _this.arrCollectionReturn = data;
            $loadingReturn.hide();
            $loadMoreReturn.button('reset');
            _this.renderReturn();
            sessionStorage[queryReturn] = JSON.stringify(Outpost.listingsCache[queryReturn]);
          });
        } else {
          this.arrCollectionReturn = Outpost.listingsCache[queryReturn].responseJSON;
          $loadingReturn.hide();
          $loadMoreReturn.button('reset');
          _this.renderReturn();
        }
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

      openInfoWindowReturn: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        $('.row-selected').removeClass('row-selected');
        $tr.addClass("row-selected");
        Outpost.mvc.views.map.relateMarker(item, this.itemStoreReturn);
      },

      highlightMarkerReturn: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.highlightMarker(item, this.itemStoreReturn);
      },

      normalizeMarkerReturn: function(e) {
        var $tr = $(e.currentTarget);
        var item = $tr.data('item');
        Outpost.mvc.views.map.normalizeMarker(item, this.itemStoreReturn);
      },

      routeIt: function(e) {
        Outpost.mvc.views.map.routeRide(e.currentTarget);
      },

      infiniteScroll: function() {
        var size, _this = this, tr;
        tr = this.itemStore.nodeUnit;
        size = $(tr).length;
        _this.prevSize = size;
        size =  _this.prevSize - 10;
        if (size < 0) {
          if (size - _this.prevSize < 8) {
            _this.loadMore();
          }
          size = 0;
        }

        $(tr + ':eq(' + size + ')').waypoint(function(direction) {
          if (direction === "down" && Outpost.state.readyRID) {
            _this.loadMore();
          }
        });

        Outpost.state.readyRID = true;
      },

      infiniteScrollReturn: function() {
        var size, _this = this, tr;
        tr = this.itemStoreReturn.nodeUnitReturn;
        size = $(tr).length;
        _this.prevSizeReturn = size;
        size =  _this.prevSizeReturn - 10;
        if (size < 0) {
          if (size - _this.prevSizeReturn < 8) {
            _this.loadMoreReturn();
          }
          size = 0;
        }

        $(tr + ':eq(' + size + ')').waypoint(function(direction) {
          if (direction === "down" && Outpost.state.readyRID) {
            _this.loadMoreReturn();
          }
        });

        Outpost.state.readyRID = true;
      },

      renderReturn: function() {
        var collectionReturn;
        if (this.collectionReturn.length) {
          collectionReturn = this.collectionReturn.toJSON();
        } else {
          collectionReturn = this.arrCollectionReturn;
        }
        if (collectionReturn.length) {
          $('#rideshare-list-return').append(this.templateReturn({
            items: collectionReturn
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(
            $('#rid-tab-return').data('markers'),
            this.itemStore
          );
          $('#rid-tab-return').removeData('markers');
          this.sortDivReturn();
          this.priceFilterReturn();
        } else if (Outpost.state.page.ridReturn !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-rid-return').button('reset');
          $.waypoints('destroy');
        } else {
          this.$el
           .find('#rideshare-list-return')
           .html(
            "<div class='text-center'>" +
            "No rides found towards " + Outpost.values.destLocation + "." +
            "</div>"
           );
        }
      },

      render: function() {
        var collection;
        if (this.collection.length) {
          collection = this.collection.toJSON();
        } else {
          collection = this.arrCollection;
        }
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
          this.infiniteScroll();
        } else if (Outpost.state.page.rid !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-rid').button('reset');
          $.waypoints('destroy');
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
      prevSize: 0,
      itemStore: {
        prefix: "tou",
        sortType: "relevance",
        infoWindowTmpl: Outpost.tmpl.tourismInfo,
        icon: new google.maps.MarkerImage(
          'img/tourism/image.png',
          new google.maps.Size(39,50),
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
            _this.prevSize = 0;
            _this.infiniteScroll();
            $.waypoints('destroy');
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
        Outpost.mvc.views.map.removeMarkers("tou");
        Outpost.state.page.vay = 1;
        Outpost.state.readyTOU = false;
        this.$el
         .find('#tourism-list')
         .empty();
      },

      loadMore: function() {
        $.waypoints('destroy');
        this.itemStore.animation = google.maps.Animation.DROP;
        Outpost.state.page.vay += 1;
        this.fetchData();
      },

      fetchData: function() {
        var _this = this;
        var $loading = $('#tourism-loading');
        var $loadMore = $('#lm-vay');
        var query = Outpost.helpers.genSearchQuery() + "tou";
        query += String(Outpost.state.page.vay);
        if (!Outpost.listingsCache[query]) {
           Outpost.listingsCache[query] = this.collection.fetch({
            beforeSend: function() {
              $loading.show();
              $loadMore.button('loading');
            },
            error: function() {
              Outpost.helpers.showAlertBox({
                type: "alert-error",
                text: "<strong>Sorry!</strong>" +
                      " something went wrong! Trying again.."
              });
              $('#lm-vay').button('reset');
              Outpost.values.numOfTimeout++;
              if (Outpost.values.numOfTimeout < 9) {
                _this.clearData();
              }
            }
          });
        }

        if (typeof Outpost.listingsCache[query].done === 'function') {
          Outpost.listingsCache[query].done(function(data) {
            _this.arrCollection = data;
            $loading.hide();
            $loadMore.button('reset');
            _this.render();
            sessionStorage[query] = JSON.stringify(Outpost.listingsCache[query]);
          });
        } else {
          this.arrCollection = Outpost.listingsCache[query].responseJSON;
          $loading.hide();
          $loadMore.button('reset');
          _this.render();
        }
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

      infiniteScroll: function() {
        var size, _this = this, tr;
        tr = this.itemStore.nodeUnit;
        size = $(tr).length;
        _this.prevSize = size;
        size =  _this.prevSize - 2;
        if (size < 0) {
          if (size - _this.prevSize < 8) {
            _this.loadMore();
          }
          size = 0;
        }

        $(tr + ':eq(' + size + ')').waypoint(function(direction) {
          if (direction === "down" && Outpost.state.readyTOU) {
            _this.loadMore();
          }
        });

        Outpost.state.readyTOU = true;
      },

      render: function() {
        var collection;
        if (this.collection.length) {
          collection = this.collection.toJSON();
        } else {
          collection = this.arrCollection;
        }
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
          this.infiniteScroll();
        } else if (Outpost.state.page.vay !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-vay').button('reset');
          $.waypoints('destroy');
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
        $('body, html').animate({
          scrollTop: $(href).offset().top
        }, 300);
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

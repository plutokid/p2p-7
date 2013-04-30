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

        // Initialize the menu
        // Outpost.mvc.views.searchForm = new Outpost.views.searchForm();
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
        var fullname;
        if (user) {
          fullname = user.get("fullname");
          data.name = fullname.substring(0, fullname.indexOf(' '));
          data.name = data.name || fullname;
          data.isSocial = false;
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
        // $('.js-mainmenu').remove();
        // this.setMapTerrain();
        this.render();
        this.$el.css('height', Outpost.state.rMapHeight);
        // Outpost.mvc.views.navBar.initRefineGUI();
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
        // var $searchInput = $('#js-orig-location-input').detach();
        // $searchInput
        //  .removeClass("css-input-sea wearedual span11")
        //  .prependTo("#js-refineSearch");
        // $('#landingpage').remove();
        // $('#listings').show();
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

      addMarker: function(item, opts) {
        var _this = this;
        _this.$el.gmap3({
          get: {
            id: item.markerid,
            callback: function(marker) {
              if (typeof marker.getPosition === 'function' && marker.getPosition()) {
                // do nothing
              } else {
                _this.$el.gmap3({
                  marker: {
                    latLng: item.latLng || Outpost.helpers.genRdmLL(item.origin),
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
        this.$el.gmap3('destroy');
        this.$el.gmap3({
          map: {
            // put latlng instead since we got them anyways..
            latLng: [Outpost.values.origLocationLat, Outpost.values.origLocationLng],
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
        Outpost.mvc.views.airbnb.clearData();
        Outpost.mvc.views.ridejoy.clearData();
        Outpost.mvc.views.vayable.clearData();
        $('.js-lists').empty();
      },

      fetchAll: function() {
        Outpost.mvc.views.airbnb.fetchData();
        Outpost.mvc.views.ridejoy.fetchData();
        Outpost.mvc.views.vayable.fetchData();
      },

      updateNavbarRes: function() {
        $('.resultInfo').html(this.templateOffline({
          numOfRes: Outpost.state.numOfRes,
          city: Outpost.values.origLocation
        }));
      },

      initServices: function() {
        Outpost.mvc.views.airbnb = new Outpost.views.airbnb();
        Outpost.mvc.views.ridejoy = new Outpost.views.ridejoy();
        Outpost.mvc.views.vayable = new Outpost.views.vayable();
      },

      render: function() {
        var _this = this;
        _this.template('sidebar.html', {}).done(function(tmpl) {
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
        var path = "!/mapview/" + value;
        this.setFilterVar();
        Outpost.state.numOfRes = 0;
        Outpost.helpers.defineOrigLoc(value);
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

      initRefineGUI: function() {
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

        var input = document.getElementById('js-search-again');
        input.value = Outpost.values.origLocation;
        var options = {
          types: ['(cities)']
        };
        new google.maps.places.Autocomplete(input, options);
      },

      render: function() {
        this.$el.html(this.template());
        this.initRefineGUI();
      }
    }),

    // =======================================================
    // Airbnb list view
    // =======================================================
    airbnb: Parse.View.extend({
      el: '#sidebar',
      template: _.template($('#tmpl-airbnbRow').html()),
      divCollection: [],
      sortType: "relevance",
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
        this.initSliderGUI();
        this.collection = new Outpost.collections.airbnb();
        this.fetchData();
      },

      events: {
        "change #js-sortby-input-hou": "sortBy",
        "click .tr-airbnb": "openInfoWindow",
        "click #lm-air": "loadMore",
        "click .hou-listimg": "loadSLB",
        "mouseenter .tr-airbnb": "highlightMarker",
        "mouseleave .tr-airbnb": "normalizeMarker"
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
            Outpost.values.airbnb.min = ui.values[0];
            Outpost.values.airbnb.max = ui.values[1];
            _this.priceFilter();
          },
          change: function() {
            _this.priceMarkerFilter();
            Outpost.state.page.air = 1;
          }
        });
      },

      priceFilter: function() {
        var _this = this;
        var sorted = _(_this.divCollection).map(function(value) {
          var item = $(value).data('item');
          var price = item.price2;
          if (price >= Outpost.values.airbnb.min && price <= Outpost.values.airbnb.max) {
            return $(value);
          }
        });
        _this.$el.find('#airbnb-list').html(sorted);
      },

      priceMarkerFilter: function() {
        var _this = this;
        var sorted = _(_this.divCollection).map(function(value) {
          var item = $(value).data('item');
          var price = item.price2;
          if (price >= Outpost.values.airbnb.min && price <= Outpost.values.airbnb.max) {
            Outpost.mvc.views.map.addMarker(item, _this.itemStore);
          } else {
            Outpost.mvc.views.map.removeMarker(item.markerid);
          }
        });
      },

      sortBy: function(e) {
        this.sortType = $(e.currentTarget).val();
        this.sortDiv();
      },

      sortDiv: function() {
        var sorted;
        switch (this.sortType) {
          case "low2high":
            sorted = $('.tr-airbnb').sort(function (a, b) {
              var p1 = $(a).data('item').price2;
              var p2 = $(b).data('item').price2;
              return (p1 < p2) ? -1 : (p1 > p2) ? 1 : 0;
            });
            this.$el.find('#airbnb-list').empty();
            this.$el.find('#airbnb-list').html(sorted);
            break;
          case "high2low":
            sorted = $('.tr-airbnb').sort(function (a, b) {
              var p1 = $(a).data('item').price2;
              var p2 = $(b).data('item').price2;
              return (p1 > p2) ? -1 : (p1 < p2) ? 1 : 0;
            });
            this.$el.find('#airbnb-list').empty();
            this.$el.find('#airbnb-list').html(sorted);
           break;
        }
        this.divCollection = $('.tr-airbnb');
      },

      filterResults: function(e) {
        e.preventDefault();
        $('#submit-filter-rid').button('loading');
        Outpost.helpers.defineDestLoc();
        this.clearAndFetch();
      },

      loadSLB: function(e) {
        var $node = $(e.currentTarget);
        this.slbPic($node.attr('src'));
      },

      clearAndFetch: function() {
        this.clearData();
        this.fetchData();
      },

      clearData: function() {
        this.divCollection = [];
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
          Outpost.mvc.views.map.setMarkers(this.$el.find('#houserental').data('markers'), this.itemStore);
          this.$el.find('#houserental').removeData('markers');
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
           .find('#airbnb-list')
           .html(
            "<div class='text-center'>" +
            "No rentals in " + Outpost.values.origLocation + " found." +
            "</div>"
           );
        }
      }
    }),

    // =======================================================
    // Ridejoy list view
    // =======================================================
    ridejoy: Parse.View.extend({
      el: '#sidebar',
      template: _.template($('#tmpl-ridejoyRow').html()),
      divCollection: [],
      sortType: "relevance",
      min: 0,
      max: 300,
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
        this.initSliderGUI();
        this.collection = new Outpost.collections.ridejoy();
        this.fetchData();
      },

      events: {
        "change #js-sortby-input-rid": "sortBy",
        'submit #filter-form-rid': 'filterResults',
        "click .tr-ridejoy": "openInfoWindow",
        "mouseenter .tr-ridejoy": "highlightMarker",
        "mouseleave .tr-ridejoy": "normalizeMarker"
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
        var _this = this;
        var sorted = _(_this.divCollection).map(function(value) {
          var price = $(value).data('item').price2;
          if (price >= _this.min && price <= _this.max) {
            return $(value);
          }
        });
        _this.$el.find('#ridejoy-list').html(sorted);
      },

      priceMarkerFilter: function() {
        var _this = this;
        var sorted = _(_this.divCollection).map(function(value) {
          var item = $(value).data('item');
          var price = item.price2;
          if (price >= _this.min && price <= _this.max) {
            Outpost.mvc.views.map.addMarker(item, _this.itemStore);
          } else {
            Outpost.mvc.views.map.removeMarker(item.markerid);
          }
        });
      },

      sortBy: function(e) {
        this.sortType = $(e.currentTarget).val();
        this.sortDiv();
      },

      sortDiv: function() {
        var sorted;
        switch (this.sortType) {
          case "low2high":
            sorted = $('.tr-ridejoy').sort(function (a, b) {
              var p1 = $(a).data('item').price2;
              var p2 = $(b).data('item').price2;
              return (p1 < p2) ? -1 : (p1 > p2) ? 1 : 0;
            });
            this.$el.find('#ridejoy-list').empty();
            this.$el.find('#ridejoy-list').html(sorted);
            break;
          case "high2low":
            sorted = $('.tr-ridejoy').sort(function (a, b) {
              var p1 = $(a).data('item').price2;
              var p2 = $(b).data('item').price2;
              return (p1 > p2) ? -1 : (p1 < p2) ? 1 : 0;
            });
            this.$el.find('#ridejoy-list').empty();
            this.$el.find('#ridejoy-list').html(sorted);
           break;
        }
        this.divCollection = $('.tr-ridejoy');
      },

      filterResults: function(e) {
        e.preventDefault();
        $('#submit-filter-rid').button('loading');
        Outpost.helpers.defineDestLoc();
        this.clearAndFetch();
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
          this.$el.find('#ridejoy-list').append(this.template({
            items: collection
          }));
          $('#js-counter').text(Outpost.state.numOfRes);
          Outpost.mvc.views.map.setMarkers(this.$el.find('#rideshare').data('markers'), this.itemStore);
          this.$el.find('#rideshare').removeData('markers');
          this.sortDiv();
          this.priceFilter();
        } else {
          this.$el
           .find('#ridejoy-list')
           .html(
            "<div class='text-center'>" +
            "No rides found towards " + Outpost.values.origLocation + "." +
            "</div>"
           );
        }
      }
    }),

    // =======================================================
    // Vayable list view
    // =======================================================
    vayable: Parse.View.extend({
      el: '#sidebar',
      template: _.template($('#tmpl-vayableRow').html()),
      min: 0,
      max: 300,
      divCollection: [],
      sortType: "relevance",
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
        nodeTab: "#js-tourismmenu",
        animation: ""
      },

      initialize: function() {
        _.bindAll(this, 'render');
        this.initSliderGUI();
        this.collection = new Outpost.collections.vayable();
        this.fetchData();
      },

      events: {
        "change #js-sortby-input-tou": "sortBy",
        "click .tr-vayable": "openInfoWindow",
        "click #lm-vay": "loadMore",
        "click .tou-listimg": "loadSLB",
        "mouseenter .tr-vayable": "highlightMarker",
        "mouseleave .tr-vayable": "normalizeMarker"
      },

      initSliderGUI: function() {
        var _this = this;
        _this.$el.find("#js-price-input-tou").slider({
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

      priceFilter: function() {
        var _this = this;
        var sorted = _(_this.divCollection).map(function(value) {
          var price = $(value).data('item').price2;
          if (price >= _this.min && price <= _this.max) {
            return $(value);
          }
        });
        _this.$el.find('#vayable-list').html(sorted);
      },

      priceMarkerFilter: function() {
        var _this = this;
        var sorted = _(_this.divCollection).map(function(value) {
          var item = $(value).data('item');
          var price = item.price2;
          if (price >= _this.min && price <= _this.max) {
            Outpost.mvc.views.map.addMarker(item, _this.itemStore);
          } else {
            Outpost.mvc.views.map.removeMarker(item.markerid);
          }
        });
      },

      sortBy: function(e) {
        this.sortType = $(e.currentTarget).val();
        this.sortDiv();
      },

      sortDiv: function() {
        var sorted;
        switch (this.sortType) {
          case "low2high":
            sorted = $('.tr-vayable').sort(function (a, b) {
              var p1 = $(a).data('item').price2;
              var p2 = $(b).data('item').price2;
              return (p1 < p2) ? -1 : (p1 > p2) ? 1 : 0;
            });
            this.$el.find('#vayable-list').empty();
            this.$el.find('#vayable-list').html(sorted);
            break;
          case "high2low":
            sorted = $('.tr-vayable').sort(function (a, b) {
              var p1 = $(a).data('item').price2;
              var p2 = $(b).data('item').price2;
              return (p1 > p2) ? -1 : (p1 < p2) ? 1 : 0;
            });
            this.$el.find('#vayable-list').empty();
            this.$el.find('#vayable-list').html(sorted);
           break;
        }
        this.divCollection = $('.tr-vayable');
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

      clearData: function() {
        this.divCollection = [];
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
          Outpost.mvc.views.map.setMarkers(this.$el.find('#tourism').data('markers'), this.itemStore);
          this.$el.find('#tourism').removeData('markers');
          this.sortDiv();
          this.priceFilter();
        } else if (Outpost.state.page.vay !== 1) {
          Outpost.helpers.showAlertBox({
            type: "alert-error",
            text: "<strong>Sorry!</strong> no more feeds found!"
          });
          $('#lm-vay').button('reset');
        } else {
          this.$el.find('#vayable-list').html(
            "<div class='text-center'>" +
            "No guides in " + Outpost.values.origLocation + " found." +
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
          Outpost.values.origLocation = data.location;
          Outpost.values.origLocationLat = data.latLng[0];
          Outpost.values.origLocationLng = data.latLng[1];
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
        this.navigateTo($("#js-orig-location-input").val(), true);
      },

      navigateTo: function(value, isFromSearch) {
        Outpost.values.isFromSearch = isFromSearch;
        var path = "!/mapview/" + value;
        Outpost.mvc.router.navigate(path, true);
      },

      render: function() {
        var _this = this;
        $('.pg-page').empty();
        _this.template('home.html', {}).done(function(tmpl) {
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

      events: {
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
        "click #js-su-show-passwd": "showPassword"
      },

      submitSignup: function(e) {
        var $nodeArr;
        var $target = $(e.target);
        if ($target.parsley('validate')) {
          $nodeArr = [
            $target,
            $target.find('#js-su-fullname'),
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
        user.set("fullname", $nodeArr[1].val());
        user.set("username", $nodeArr[2].val());
        user.set("password", $nodeArr[3].val());

        user.signUp(null, {
          success: function(user) {
            var data = {};
            var fullname;

            Outpost.state.$loader.hide();
            $('#js-signup-modal').modal('hide');
            $nodeArr[0].find("#js-su-submit").removeAttr("disabled");
            $nodeArr[0][0].reset();

            fullname = user.get("fullname");
            data.name = fullname.substring(0, fullname.indexOf(' '));
            data.name = data.name || fullname;
            data.isSocial = false;
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
        "click #js-lo-show-passwd": "showPassword"
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
            var fullname;

            Outpost.state.$loader.hide();
            $('#js-login-modal').modal('hide');
            $nodeArr[0].find("#js-lo-submit").removeAttr("disabled");
            $nodeArr[0][0].reset();

            fullname = user.get("fullname");
            data.name = fullname.substring(0, fullname.indexOf(' '));
            data.name = data.name || fullname;
            data.isSocial = false;
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
    })
  };
})(window, jQuery, _, Parse, undefined);

(function($) {
$(document).ready(function($) {
  var p2p = {
    $map: $('#map'),
    hasSearchedOnce: false,
    inVal: {
      sloc: "",
      eloc: "",
      origlat: "",
      origlon: "",
      destlat: "",
      destlon: "",
      sdate: "",
      edate: "",
      guests: "",
      destBound: {}
    },

    init: function() {
      this.initInputs();
      this.declareEvents();
    },

    initInputs: function() {
      var oloc = document.getElementById("js-orig-location-input");
      var dloc = document.getElementById("js-dest-location-input");
      var options = {
        types: ['(cities)']
      };
      new google.maps.places.Autocomplete(oloc, options);
      new google.maps.places.Autocomplete(dloc, options);

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
          $('#js-guest').focus();
        }
      });
    },

    declareEvents: function() {
      var _this = this;

      $('#searchForm').on('submit', function(e) {
        e.preventDefault();

        var nodes;
        var orig = $('#js-orig-location-input').val();
        var dest = $('#js-dest-location-input').val();
        if (!p2p.hasSearchedOnce) {
          $('body').css("background", "none");
          $(this).addClass("navbar-form pull-right");
          nodes = $(this).detach();
          nodes.appendTo("#appendToNav");
          $('#landing').remove();
          $('.listings').show();
        } else {
          $('.list').empty();
          $('.loading').show();
        }

        p2p.inVal.sloc = orig;
        p2p.inVal.eloc = dest;
        p2p.inVal.sdate = $('#js-sdate-input').val();
        p2p.inVal.edate = $('#js-edate-input').val();
        p2p.inVal.guests = $('#js-guest').val();

        _this.searchJoyRide();
        _this.searchAirbnb();
        _this.searchVayable();
        _this.searchFoursquare();
        _this.mapIt(orig, dest);
        p2p.hasSearchedOnce = true;
      });

      $('#js-orig-location-input').blur(function() {
        if ($(this).val()) {
          $.ajax({
            url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + $(this).val() + "&sensor=false",
            type: "GET",
            dataType: "json",
            success: function(data) {
              p2p.inVal.origlat = data.results[0].geometry.location.lat;
              p2p.inVal.origlon = data.results[0].geometry.location.lng;
            }
          });
        }
      });

      $('#js-dest-location-input').blur(function() {
        if ($(this).val()) {
          $.ajax({
            url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + $(this).val() + "&sensor=false",
            type: "GET",
            dataType: "json",
            success: function(data) {
              p2p.inVal.destlat = data.results[0].geometry.location.lat;
              p2p.inVal.destlon = data.results[0].geometry.location.lng;
              p2p.inVal.destBound = data.results[0].geometry.bounds;
            }
          });
        }
      });

      $('#joyride-list').on({
        click: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          $('.row-selected').removeClass('row-selected');
          $tr.addClass("row-selected");
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.rideid,
              callback: function(marker) {
                var map = p2p.$map.gmap3("get");
                var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                if (infowindow) {
                  infowindow.open(map, marker);
                  infowindow.setContent(_this.joyRideInfo(obj));
                } else {
                  p2p.$map.gmap3({
                    infowindow: {
                      anchor:marker,
                      options:{content: _this.joyRideInfo(obj)}
                    }
                  });
                }
              }
            }
          });
        },
        mouseenter: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.rideid,
              callback: function(marker) {
                marker.setIcon("img/carmarker.png");
              }
            }
          });
        },
        mouseleave: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.rideid,
              callback: function(marker) {
                marker.setIcon("img/carmarker_hover.png");
              }
            }
          });
        }
      }, '.tr-joyride');

      $('#airbnb-list').on({
        click: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          $('.row-selected').removeClass('row-selected');
          $tr.addClass("row-selected");
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.airbnbid,
              callback: function(marker) {
                var map = p2p.$map.gmap3("get");
                var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                if (infowindow) {
                  infowindow.open(map, marker);
                  infowindow.setContent(_this.airbnbInfo(obj));
                } else {
                  p2p.$map.gmap3({
                    infowindow: {
                      anchor:marker,
                      options:{content: _this.airbnbInfo(obj)}
                    }
                  });
                }
              }
            }
          });
        },
        mouseenter: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.airbnbid,
              callback: function(marker) {
                marker.setIcon("img/housemarker_hover.png");
              }
            }
          });
        },
        mouseleave: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.airbnbid,
              callback: function(marker) {
                marker.setIcon("img/housemarker.png");
              }
            }
          });
        }
      }, '.tr-airbnb');

      $('#vayable-list').on({
        click: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          $('.row-selected').removeClass('row-selected');
          $tr.addClass("row-selected");
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.tripid,
              callback: function(marker) {
                var map = p2p.$map.gmap3("get");
                var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                if (infowindow) {
                  infowindow.open(map, marker);
                  infowindow.setContent(_this.vayableInfo(obj));
                } else {
                  p2p.$map.gmap3({
                    infowindow: {
                      anchor:marker,
                      options:{content: _this.vayableInfo(obj)}
                    }
                  });
                }
              }
            }
          });
        },
        mouseenter: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.tripid,
              callback: function(marker) {
                marker.setIcon("img/humanicon_hover.png");
              }
            }
          });
        },
        mouseleave: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.tripid,
              callback: function(marker) {
                marker.setIcon("img/humanicon.png");
              }
            }
          });
        }
      }, '.tr-vayable');

      $('#foursquare-list').on({
        click: function() {
          var $tr = $(this);
          var obj = $tr.data('obj');
          $('.row-selected').removeClass('row-selected');
          $tr.addClass("row-selected");
          p2p.$map.gmap3({
            get: {
              name: "marker",
              tag: obj.tripid,
              callback: function(marker) {
                var map = p2p.$map.gmap3("get");
                var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                if (infowindow) {
                  infowindow.open(map, marker);
                  infowindow.setContent(_this.fourSquareInfo(obj));
                } else {
                  p2p.$map.gmap3({
                    infowindow: {
                      anchor:marker,
                      options:{content: _this.fourSquareInfo(obj)}
                    }
                  });
                }
              }
            }
          });
        }
      }, '.tr-foursquare');

      p2p.$map.on("click", ".routeit", function() {
        var origin = $(this).data("orig");
        var dest = $(this).data("dest");
        p2p.$map.gmap3({
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
              $(this).gmap3({
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
      });
    },

    airbnbInfo: function(obj) {
      return '<div class="js-infowindow">' +
        '<div class="info-desc">' + obj.unitName + '</div>' +
        '<div class="info-img img-polaroid"><img src="' + obj.unitThumb + '"></div>' +
        '<div class="info-price">' + obj.price + ' ' + obj.priceModifier + '</div>' +
        '<a class="btn btn-small btn-primary" href="' + obj.link + '" target="_blank"><i class="icon-check"></i>&nbsp;Book Now</a></div>' +
        '</div>';
    },

    joyRideInfo: function(obj) {
      return '<div class="js-infowindow">' +
        '<div class="info-desc">' + obj.desc + '</div>' +
        '<div class="info-img img-polaroid"><img src="' + obj.pic + '"></div>' +
        '<div class="info-price">' + obj.price + '</div>' +
        '<div><a data-orig="' + obj.origin + '" data-dest="' + obj.dest + '" class="btn btn-small routeit" href="javascript:void(0)"><i class="icon-random"></i>&nbsp;Route it</a>&nbsp;' +
        '<a class="btn btn-small btn-primary" href="' + obj.link + '" target="_blank"><i class="icon-check"></i>&nbsp;Grab a seat</a></div>' +
        '<p class="info-desc">' + obj.origin + ' → ' + obj.dest + '</p>' +
        '</div>';
    },

    vayableInfo: function(obj) {
      return '<div class="js-infowindow">' +
        '<div class="info-desc">' + obj.origin + '</div>' +
        '<div class="info-desc">' + obj.desc + '</div>' +
        '<div class="info-img img-polaroid"><img height="96px" width="96px" src="' + obj.pic + '"></div>' +
        '<div class="info-price">' + obj.price + ' per person</div>' +
        '<a class="btn btn-small btn-primary" href="' + obj.link + '" target="_blank"><i class="icon-check"></i>&nbsp;Book It</a></div>' +
        '</div>';
    },

    fourSquareInfo: function(obj) {
      return '<div class="js-infowindow">' +
        '<div class="info-desc">' + obj.origin + '</div>' +
        '<div class="info-desc">' + obj.desc + '</div>' +
        '<div class="info-price">There are currently <b>' + obj.live + '</b> visitors there.</div>' +
        '<a class="btn btn-small btn-primary" href="' + obj.link + '" target="_blank"><i class="icon-check"></i>&nbsp;More info</a></div>' +
        '</div>';
    },

    ll: function(org, isBounded) {
      var i;
      var url;
      var bounds;
      if (isBounded) {
        bounds = p2p.inVal.destBound;
        url = "http://maps.googleapis.com/maps/api/geocode/json?address=" + org + "&bounds="+bounds.southwest.lat+","+bounds.southwest.lng+"|"+bounds.northeast.lat+","+bounds.northeast.lng+"&sensor=false";
      } else {
        url = "http://maps.googleapis.com/maps/api/geocode/json?address=" + org + "&sensor=false";
      }
      $.ajax({
        url: url,
        type: "GET",
        dataType: "JSON",
        async: false,
        success: function(data) {
          var lat, lng;
          try {
            lat = data.results[0].geometry.location.lat;
            lng = data.results[0].geometry.location.lng;
          } catch(e) {
            lat = undefined;
            lng = undefined;
          }

          lat = lat + (Math.random()*0.01) -0.004;
          lng = lng + (Math.random()*0.01) -0.004;
          i = [lat, lng];
        }
      });
      return i;
    },

    searchJoyRide: function() {
      var _this = this;
      $.ajax({
        url: "http://dotaprj.me/joyride/",
        data: {
          sloc: p2p.inVal.sloc,
          origlat: p2p.inVal.origlat,
          origlon: p2p.inVal.origlon,
          eloc: p2p.inVal.eloc,
          destlat: p2p.inVal.destlat,
          destlon: p2p.inVal.destlon,
          sdate: p2p.inVal.sdate
        },
        type: "GET",
        dataType: "json",
        success: function(data) {
          var len = data.length;
          var markers = [];
          var html = "";
          var origLonglat;
          var rideid;
          var ridedata;
          var json_ride;

          $('#joyride-loading').hide();

          for (var i = 0; i < len; i++) {
            origLonglat = _this.ll(data[i].origin);
            rideid = data[i].id;
            classname = rideid + "class";
            ridedata = {
              rideid: rideid,
              origLonglat: origLonglat,
              desc: data[i].desc,
              origin: data[i].origin,
              dest: data[i].destination,
              price: $.trim(data[i].price),
              link: data[i].link,
              pic: data[i].img
            };

            markers.push({
              latLng: origLonglat,
              "data": _this.joyRideInfo(ridedata),
              tag: rideid,
              id: classname,
              options: {
                icon: "img/carmarker_hover.png"
              }
            });

            json_ride = JSON.stringify(ridedata);
            html += '' +
            "<tr class='tr-joyride tr " + classname + "' data-obj='" + json_ride + "'>" +
              "<td><img class='img-circle' src='" + data[i].img + "'></td>" +
              "<td class='ownerAdd'>" + data[i].origin + " → " + data[i].destination + "</td>" +
              "<td><a href='" + data[i].link + "' target='_blank'><i class='icon-share' title='go to " + data[i].link + "'></i></td>" +
            "</tr>";
          }


          if (!len) {
            $('#joyride-list').html("No rides found");
          } else {
            $('#joyride-list').html(html);
          }

          p2p.$map.gmap3({
            marker: {
              values: markers,
              events: {
                click: function(marker, event, context) {
                  $('.row-selected').removeClass('row-selected');
                  var map = p2p.$map.gmap3("get");
                  var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                  if (infowindow) {
                    infowindow.open(map, marker);
                    infowindow.setContent(context.data);
                  } else {
                    p2p.$map.gmap3({
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
                  $('#joyride-list').find('.' + context.id).addClass('row-selected');
                },
                mouseover: function(marker, event, context) {
                  marker.setIcon("img/carmarker.png");
                  $('#js-jayridemenu').tab('show');
                  $('#joyride-list').find('.' + context.id).addClass('row-hovered');
                },
                mouseout: function(marker, event, context) {
                  marker.setIcon("img/carmarker_hover.png");
                  $('#joyride-list .' + context.id).removeClass('row-hovered');
                }
              }
            }
          });
        }
      });
    },

    searchAirbnb: function() {
      var _this = this;
      $.ajax({
        url: "http://dotaprj.me/airbnb/",
        data: {
          eloc: p2p.inVal.eloc,
          sdate: p2p.inVal.sdate,
          edate: p2p.inVal.edate,
          guests: p2p.inVal.guests
        },
        type: "GET",
        dataType: "json",
        success: function(data) {
          var len = data.body.results.length,
              base = data.body.results,
              markers = [],
              html = "",
              origLonglat,
              airbnbid,
              i,
              bnbdata,
              json_bnb;

          $('#airbnb-loading').hide();

          for (i = 0; i < len; i++) {
            origLonglat = _this.ll(base[i].unitAddress, true);
            airbnbid = "bnb" + base[i].unitLink.substring(32);
            classname = airbnbid + "class";
            bnbdata = {
              airbnbid: airbnbid,
              origLonglat: origLonglat,
              desc: base[i].unitDesc,
              origin: base[i].unitAddress,
              price: base[i].unitPrice,
              link: base[i].unitLink,
              ownerThumb: base[i].ownerThumb,
              unitThumb: base[i].unitThumb,
              unitName: base[i].unitName,
              ownerProfile: base[i].ownerProfile,
              unitReviews: base[i].unitReviews,
              priceModifier: base[i].priceModifier
            };

            markers.push({
              latLng: origLonglat,
              "data": _this.airbnbInfo(bnbdata),
              tag: airbnbid,
              id: classname
            });

            json_bnb = JSON.stringify(bnbdata);
            html += '' +
            "<tr class='tr-airbnb tr " + classname + "' data-obj='" + json_bnb + "'>" +
              '<td><a href="' +  base[i].ownerProfile + '" target="_blank"><img class="img-circle" src="' + base[i].ownerThumb + '"></a></td>' +
              '<td class="ownerAdd">' + base[i].unitDesc + '</td>' +
            '</tr>';
          }

          if (!len) {
            $('#airbnb-list').html("No owners found");
          } else {
            $('#airbnb-list').html(html);
          }

          p2p.$map.gmap3({
            marker: {
              values: markers,
              options: {
                icon: "img/housemarker.png"
              },
              events: {
                click: function(marker, event, context) {
                  $('.row-selected').removeClass('row-selected');
                  var map = p2p.$map.gmap3("get");
                  var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                  if (infowindow) {
                    infowindow.open(map, marker);
                    infowindow.setContent(context.data);
                  } else {
                    p2p.$map.gmap3({
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
                  $('#airbnb-list').find('.' + context.id).addClass('row-selected');
                },
                mouseover: function(marker, event, context) {
                  marker.setIcon("img/housemarker_hover.png");
                  $('#js-airbnbmenu').tab('show');
                  $('#airbnb-list').find('.' + context.id).addClass('row-hovered');
                },
                mouseout: function(marker, event, context) {
                  marker.setIcon("img/housemarker.png");
                  $('#airbnb-list .' + context.id).removeClass('row-hovered');
                }
              }
            }
          });
        }
      });
    },

    searchVayable: function() {
      var _this = this;
      var loc;
      if (p2p.inVal.eloc.indexOf(",") !== -1) {
        loc = p2p.inVal.eloc.substring(0, p2p.inVal.eloc.indexOf(","));
      }
      $.ajax({
        url: "http://dotaprj.me/vayable/",
        data: {
          location: loc || p2p.inVal.eloc
        },
        type: "GET",
        dataType: "json",
        success: function(data) {
          var len = data.length;
          var markers = [];
          var html = "";
          var origLonglat;
          var tripid;
          var tripdata;
          var json_trip;

          $('#vayable-loading').hide();

          for (var i = 0; i < len; i++) {
            origLonglat = _this.ll(data[i].origin);
            tripid = data[i].id;
            classname = tripid + "class";
            tripdata = {
              tripid: tripid,
              origLonglat: origLonglat,
              desc: data[i].desc,
              origin: data[i].origin,
              price: data[i].price,
              link: data[i].link,
              pic: data[i].img
            };

            markers.push({
              latLng: origLonglat,
              "data": _this.vayableInfo(tripdata),
              tag: tripid,
              id: classname,
              options: {
                icon: "img/humanicon.png"
              }
            });

            json_trip = JSON.stringify(tripdata);
            html += '' +
            "<tr class='tr-vayable tr " + classname + "' data-obj='" + json_trip + "'>" +
              "<td><img class='img-circle' height='32px' width='32px' src='" + data[i].img + "'></td>" +
              "<td class='ownerAdd'>" + data[i].desc + "</td>" +
              "<td><a href='" + data[i].link + "' target='_blank'><i class='icon-share' title='go to " + data[i].link + "'></i></td>" +
            "</tr>";
          }

          if (!len) {
            $('#vayable-list').html("No tourisim action found");
          } else {
            $('#vayable-list').html(html);
          }

          $('#vayable-list').html(html);
          p2p.$map.gmap3({
            marker: {
              values: markers,
              events: {
                click: function(marker, event, context) {
                  $('.row-selected').removeClass('row-selected');
                  var map = p2p.$map.gmap3("get");
                  var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                  if (infowindow) {
                    infowindow.open(map, marker);
                    infowindow.setContent(context.data);
                  } else {
                    p2p.$map.gmap3({
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
                  $('#vayable-list').find('.' + context.id).addClass('row-selected');
                },
                mouseover: function(marker, event, context) {
                  marker.setIcon("img/humanicon_hover.png");
                  $('#js-vayablemenu').tab('show');
                  $('#vayable-list').find('.' + context.id).addClass('row-hovered');
                },
                mouseout: function(marker, event, context) {
                  marker.setIcon("img/humanicon.png");
                  $('#vayable-list .' + context.id).removeClass('row-hovered');
                }
              }
            }
          });
        }
      });
    },

    searchFoursquare: function() {
      var _this = this;
      var loc;
      $.ajax({
        url: "https://api.foursquare.com/v2/venues/trending",
        data: {
          ll: p2p.inVal.destlat + "," + p2p.inVal.destlon,
          oauth_token: "UKU0UMG0XYMT40IAXVCVMUEB0LG1PFLOKFSOVLNMQO3JHSH3"
        },
        type: "GET",
        dataType: "json",
        success: function(data) {
          var len = data.response.venues.length;
          var markers = [];
          var html = "";
          var tripid;
          var tripdata;
          var json_trip;
          var icon, ext, pic;

          $('#foursquare-loading').hide();

          for (var i = 0; i < len; i++) {
            tripid = data.response.venues[i].id;
            classname = tripid;
            icon = data.response.venues[i].categories[0].icon;
            if (!icon) {
              icon = data.response.venues[i].categories[0].icon.prefix;
              ext = data.response.venues[i].categories[0].icon.suffix;
              icon = icon.substring(0, icon.length - 1) + ext;
            }

            tripdata = {
              tripid: tripid,
              origLonglat: [data.response.venues[i].location.lat, data.response.venues[i].location.lng],
              desc: data.response.venues[i].name,
              origin: data.response.venues[i].location.address + " " + data.response.venues[i].location.state,
              live: data.response.venues[i].hereNow.count,
              link: data.response.venues[i].canonicalUrl,
              pic: icon
            };

            markers.push({
              latLng: tripdata.origLonglat,
              "data": _this.fourSquareInfo(tripdata),
              tag: tripid,
              id: classname,
              options: {
                icon: icon
              }
            });

            json_trip = JSON.stringify(tripdata);
            html += '' +
            "<tr class='tr-foursquare tr " + classname + "' data-obj='" + json_trip + "'>" +
              "<td><img class='img-circle' height='32px' width='32px' src='" + tripdata.pic + "'></td>" +
              "<td class='ownerAdd'>" + tripdata.desc + "</td>" +
              "<td><a href='" + tripdata.link + "' target='_blank'><i class='icon-share' title='go to " + tripdata.link + "'></i></td>" +
            "</tr>";
          }

          if (!len) {
            $('#foursquare-list').html("Nobody's chillin' in this neighbourhood, sorry.");
          } else {
            $('#foursquare-list').html(html);
          }

          $('#foursquare-list').html(html);
          p2p.$map.gmap3({
            marker: {
              values: markers,
              events: {
                click: function(marker, event, context) {
                  $('.row-selected').removeClass('row-selected');
                  var map = p2p.$map.gmap3("get");
                  var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                  if (infowindow) {
                    infowindow.open(map, marker);
                    infowindow.setContent(context.data);
                  } else {
                    p2p.$map.gmap3({
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
                  $('#foursquare-list').find('.' + context.id).addClass('row-selected');
                },
                mouseover: function(marker, event, context) {
                  $('#js-foursquaremenu').tab('show');
                  $('#foursquare-list').find('.' + context.id).addClass('row-hovered');
                },
                mouseout: function(marker, event, context) {
                  $('#foursquare-list .' + context.id).removeClass('row-hovered');
                }
              }
            }
          });
        }
      });
    },

    mapIt: function(orig, dest) {
      if (!p2p.hasSearchedOnce) {
        p2p.$map.css({
          'height': $(window).height() - 41,
          'width': $(window).width() - $('#sidebar').width()
        });
        $('#sidebar').css('height', $(window).height() - 41);
      }
      p2p.$map.gmap3({
        clear: {
          tag: "directions"
        },
        getroute: {
          options: {
            origin: orig,
            destination: dest,
            travelMode: google.maps.DirectionsTravelMode.DRIVING
          },
          callback: function(results) {
            if (!results) return;
            $(this).gmap3({
              map:{
                options:{
                  zoom: 13,
                  center: [-33.879, 151.235]
                }
              },
              directionsrenderer:{
                options:{
                  directions:results
                },
                tag: "directions"
              }
            });
          }
        }
      });
    }
  };

  p2p.init();
  $('.tooly').tooltip();
});
})(jQuery);

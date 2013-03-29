(function($) {
$(document).ready(function($) {
  var p2p = {
    $map: $('#map'),
    inVal: {
      sloc: "",
      eloc: "",
      origlat: "",
      origlon: "",
      destlat: "",
      destlon: "",
      sdate: "",
      edate: "",
      guests: ""
    },

    init: function() {
      this.initInputs();
      this.declareEvents();
      // this.initMap();
      // this.autocompleteIt('js-location-input');
      // this.declareEvents();
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
        var nodes;
        var orig = $('#js-orig-location-input').val();
        var dest = $('#js-dest-location-input').val();
        $('body').css("background", "none");
        $(this).addClass("navbar-form pull-right");
        nodes = $(this).detach();
        nodes.appendTo("#appendToNav");
        $('#landing').remove();
        $('.listings').show();
        p2p.inVal.sloc = orig;
        p2p.inVal.eloc = dest;
        p2p.inVal.sdate = $('#js-sdate-input').val();
        p2p.inVal.edate = $('#js-edate-input').val();
        p2p.inVal.guests = $('#js-guest').val();

        _this.searchJoyRide();
        // $.ajax({
        //   url: "http://dotaprj.me/airbnb/",
        //   data: {
        //     eloc: p2p.inVal.eloc,
        //     sdate: p2p.inVal.sdate,
        //     edate: p2p.inVal.edate,
        //     guests: p2p.inVal.guests
        //   },
        //   type: "GET",
        //   dataType: "json",
        //   success: function(data) {
        //     console.log(data);
        //   }
        // });
        _this.mapIt(orig, dest);
        e.preventDefault();
      });

      $('#js-orig-location-input').blur(function() {
        if ($(this).val()) {
          $.ajax({
            url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + $(this).val() + "&sensor=false",
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
            success: function(data) {
              p2p.inVal.destlat = data.results[0].geometry.location.lat;
              p2p.inVal.destlon = data.results[0].geometry.location.lng;
            }
          });
        }
      });

      // $('#listings').on("click", "tr", function(){
      //   var $tr = $(this);
      //   $('.row-selected').removeClass('row-selected');
      //   $tr.addClass("row-selected");
      //   p2p.$map.gmap3({
      //     marker: {
      //       address: $tr.find($('.ownerAdd')).text(),
      //       events: {
      //         click: function(marker, event, context) {
      //           var map = p2p.$map.gmap3("get"),
      //               infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
      //            if (infowindow) {
      //             infowindow.close();
      //             infowindow.open(map, marker);
      //             infowindow.setContent(_this.generateInfw($tr));
      //           } else {
      //             p2p.$map.gmap3({
      //               infowindow: {
      //                 anchor:marker,
      //                 options:{content: _this.generateInfw($tr)}
      //               }
      //             });
      //           }
      //         }
      //       }
      //     },
      //     infowindow: {
      //       address: $tr.find($('.ownerAdd')).text(),
      //       options: {
      //         content: _this.generateInfw($tr)
      //       }
      //     }
      //   });
      // });

      $('#listings').on("click", ".tr-joyride", function() {
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
      });

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

    generateInfw: function($tr) {
      return "" +
        '<div class="info-desc">' + $tr.data("desc") + '</div>' +
        '<div class="info-img img-polaroid"><img src="' + $tr.data("thumb") + '"></div>' +
        '<div class="info-price">' + $tr.data("price") + ' ' + $tr.data("pmod") + '&nbsp;' +
        '<a class="btn btn-small" href="' + $tr.data("link") + '" target="_blank"><i class="icon-check"></i>Book Now</a></div>'
        ;
    },

    joyRideInfo: function(obj) {
      return '<div class="js-infowindow">' +
        '<div class="info-desc">' + obj.desc + '</div>' +
        '<div class="info-img img-polaroid"><img src="' + obj.pic + '"></div>' +
        '<div class="info-price">' + obj.price + '</div>' +
        '<div><a data-orig="' + obj.origin + '" data-dest="' + obj.dest + '" class="btn btn-small routeit" href="javascript:void(0)"><i class="icon-random"></i>&nbsp;Route it</a>&nbsp;' +
        '<a class="btn btn-small btn-primary" href="' + obj.link + '" target="_blank"><i class="icon-check"></i>&nbsp;Grab a seat</a></div>' +
        '<p>' + obj.origin + ' → ' + obj.dest + '</p>' +
        '</div>';
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

          var ll = function(org) {
            var i;
            $.ajax({
              url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + org + "&sensor=false",
              async: false,
              success: function(data) {
                var lat = data.results[0].geometry.location.lat;
                var lng = data.results[0].geometry.location.lng;
                lat = lat + (Math.random()*0.01) -0.004;
                lng = lng + (Math.random()*0.01) -0.004;
                i = [lat, lng];
              }
            });
            return i;
          };

          for (var i = 0; i < len; i++) {
            origLonglat = ll(data[i].origin);
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
                icon: "img/carmarker.png"
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

          $('#listings').html(html);
          p2p.$map.gmap3({
            marker: {
              values: markers,
              events: {
                click: function(marker, event, context) {
                  var map = p2p.$map.gmap3("get");
                  var infowindow = p2p.$map.gmap3({get:{name:"infowindow"}});
                  if (infowindow) {
                    infowindow.open(map, marker);
                    infowindow.setContent(context.data);
                  } else {
                    p2p.$map.gmap3({
                      infowindow: {
                        anchor:marker,
                        options:{content: context.data}
                      }
                    });
                  }
                },
                mouseover: function(marker, event, context) {
                  // marker.setIcon("http://maps.google.com/mapfiles/marker_orange.png");
                  console.log(context.id);
                  $('#listings').find('.' + context.id).addClass('row-hovered');
                },
                mouseout: function(marker, event, context) {
                  // marker.setIcon("img/carmarker.png");
                  $('#listings .' + context.id).removeClass('row-hovered');
                }
              }
            }
          });
        }
      });
    },

    searchAirbnb: function(location) {
      $.ajax({
        url: "http://dotaprj.me/airbnb/sample.php",
        data: {
          location: location
        },
        dataType: "json",
        beforeSend: function() {
          $('#loading').slideDown();
        },
        success: function(data) {
          var html = "";
          var len = data.body.results.length;
          var base = data.body.results;
          for (var i = 0; i < len; i++) {
            html += '' +
            '<tr data-desc="' + base[i].unitDesc + '" data-price="' + base[i].unitPrice + '" data-thumb="' + base[i].unitThumb + '" data-pmod="' + base[i].priceModifier + '" data-link="' + base[i].unitLink + '">' +
              '<td><a href="' +  base[i].ownerProfile + '"><img class="img-circle" src="' + base[i].ownerThumb + '"></a></td>' +
              '<td class="ownerAdd">' + $.trim(base[i].unitAddress) + '</td>' +
              '<td><a href="' + base[i].unitLink + '" target="_blank"><i class="icon-share"></i></td>' +
            '</tr>';
          }
          $('#loading').slideUp();
        }
      });
    },

    autocompleteIt: function(id) {
      var input = document.getElementById(id);
      var options = {
        types: ['(cities)']
      };
      var autocomplete = new google.maps.places.Autocomplete(input, options);
    },

    initMap: function() {
      p2p.$map.css('height', $(window).height());
      p2p.$map.gmap3({
        getgeoloc: {
          callback: function(latLng) {
            if (latLng) {
              $(this).gmap3({
                marker: {
                  latLng:latLng
                },
                map: {
                  options:{
                    zoom: 12
                  }
                }
              });
              $.ajax({
                url: "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + latLng.jb + "," + latLng.kb + "&sensor=false",
                success: function(data) {
                  p2p.searchAirbnb(data.results[0].address_components[2].long_name);
                }
              });
            }
          }
        }
      });
    },

    mapIt: function(orig, dest) {
      p2p.$map.css({
        'height': $(window).height(),
        'width': $(window).width() - $('#sidebar').width()
      });
      p2p.$map.gmap3({
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
  $('#js-orig-location-input').focus();
});
})(jQuery);

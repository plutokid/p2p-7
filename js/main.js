(function($) {
  $(document).ready(function($) {
    var p2p = {
      init: function() {
        this.autocompleteIt('js-location-input');
        this.declareEvents();
      },

      declareEvents: function() {
        var _this = this;

        $('#searchForm').on('submit', function(e) {
          var val = $('#js-location-input').val();
          _this.mapIt(val);
          _this.searchAirbnb(val);
          e.preventDefault();
        });

        $('#listings').on("click", "tr", function(){
          var $tr = $(this);
          var $map = $('#map');
          $('.row-selected').removeClass('row-selected');
          $tr.addClass("row-selected");
          $map.gmap3({
            clear: "marker",
            marker: {
              address: $tr.find($('.ownerAdd')).text(),
              events: {
                click: function(marker, event, context) {
                  var map = $map.gmap3("get"),
                      infowindow = $map.gmap3({get:{name:"infowindow"}});
                   if (infowindow) {
                    infowindow.close();
                    infowindow.open(map, marker);
                    infowindow.setContent(_this.generateInfw($tr));
                  } else {
                    $map.gmap3({
                      infowindow: {
                        anchor:marker,
                        options:{content: _this.generateInfw($tr)}
                      }
                    });
                  }
                }
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
            $('#count').text(data.body.results_count);
            $('#loading').slideUp();
            for (var i = 0; i < len; i++) {
              html += '<tr  data-desc="' + base[i].unitDesc + '" data-price="' + base[i].unitPrice + '" data-thumb="' + base[i].unitThumb + '" data-pmod="' + base[i].priceModifier + '" data-link="' + base[i].unitLink + '">' +
                        '<td><a href="' +  base[i].ownerProfile + '"><img class="img-circle" src="' + base[i].ownerThumb + '"></a></td>' +
                        '<td class="ownerAdd">' + $.trim(base[i].unitAddress) + '</td>' +
                        '<td><a href="' + base[i].unitLink + '" target="_blank"><i class="icon-tag"></i></td>' +
                      '</tr>';
            }
            $('#listings').html(html);
            $('.list-wrapper').css('height', $(window).height());
            $(".list-wrapper").mCustomScrollbar();
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

      mapIt: function(location) {
        var $map = $('#map');
        $map.css('height', $(window).height());
        $map.gmap3({
          map: {
            address: location,
            options: {
              zoom: 11
            }
          }
        });
      }
    };

    p2p.init();
  });
})(jQuery);

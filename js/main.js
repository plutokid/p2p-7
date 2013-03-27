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
            $('#loading').slideUp();
            for (var i = 0; i < len; i++) {
              html += '<tr>' +
                        '<td><img src="' + base[i].ownerThumb + '"></td>' +
                        '<td>' + base[i].unitAddress + '</td>' +
                        '<td><a href="' + base[i].unitLink + '" target="_blank"><i class="icon-tag"></i></td>' +
                      '</tr>';
            }
            $('#listings').html(html);
          },
          complete: function() {
            console.log("compelte");
          }
        });
      },

      autocompleteIt: function(id) {
        var input = document.getElementById(id);
        var options = {
          types: ['(cities)'],
          componentRestrictions: {country: 'ca'}
        };
        var autocomplete = new google.maps.places.Autocomplete(input, options);
      },

      mapIt: function(location) {
        $('#map').css('height', $(window).height());
        $("#map").gmap3({
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

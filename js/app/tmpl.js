(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.tmpl = {
    // =======================================================
    //  Airbnb Infowindow
    // =======================================================
    airbnbInfo : function(item) {
      return '' +
      '<div class="js-infowindow">' +
        '<div class="info-desc">' + item.type + ' - ' +  item.neigh +'</div>' +
        '<div class="info-img img-polaroid"><img src="' + item.roomImg + '"></div>' +
        '<div class="info-price">' + item.price + '</div>' +
        '<a class="btn btn-small btn-primary" href="' + item.link + '" target="_blank">' +
        '<i class="icon-check"></i>&nbsp;Book Now</a></div>' +
      '</div>';
    },

    // =======================================================
    //  Ridejoy Infowindow
    // =======================================================
    ridejoyInfo : function(item) {
      return '' +
      '<div class="js-infowindow">' +
        '<div class="info-desc">' + item.desc +'</div>' +
        '<div class="info-price">' + item.price + '</div>' +
        '<div>' +
          '<a data-orig="' + item.origin + '" data-dest="' + item.destination + '" ' +
           'class="btn btn-small routeit" href="javascript:void(0)">' +
           '<i class="icon-random"></i>&nbsp;Route it</a>&nbsp;' +
          '<a class="btn btn-small btn-primary" href="' + item.link + '" target="_blank">' +
          '<i class="icon-check"></i>&nbsp;Grab a seat</a>' +
        '</div>' +
      '</div>';
    },

    // =======================================================
    //  Vayable Infowindow
    // =======================================================
    vayableInfo : function(item) {
      return '' +
      '<div class="js-infowindow">' +
        '<div class="info-desc">' + item.desc +'</div>' +
        '<div class="info-img img-polaroid"><img width="128px" height="128px" src="' + item.img + '"></div>' +
        '<div class="info-price">' + item.price + '</div>' +
        '<a class="btn btn-small btn-primary" href="' + item.link + '" target="_blank">' +
        '<i class="icon-check"></i>&nbsp;Book It</a></div>' +
      '</div>';
    }
  };
})(window, jQuery, _, Backbone, undefined);

(function(window, $, _, Backbone) {
  "use strict";
  window.Outpost = window.Outpost || {};
  var Outpost = window.Outpost;

  Outpost.tmpl = {
    // =======================================================
    //  Airbnb Infowindow
    // =======================================================
    airbnbInfo : function(item) {
      var numOfNights = Outpost.state.searchFilter.numOfNights;
      var subtotal  = item.price2 * numOfNights;
      var nightStr;
      if (subtotal) {
        nightStr = numOfNights > 1 ? " nights" : " nigth";
        subtotal = "$" + subtotal + " for " + numOfNights + nightStr;
      } else {
        subtotal = "$" + item.price2 + " per night";
      }

      return '' +
      '<div class="js-infowindow">' +
        '<div class="info-desc css-bgblue">' +
          '<a class="icon-remove js-closeInfoWindow css-bgblue" onmouseover="Outpost.mvc.views.map.closeInfo()"></a>' +
          '<div class="info-text">' + item.desc + '</div>' +
          '<div class="info-logo">' +
            '<img src="' + item.infoWindowIcon + '">' +
          '</div>' +
        '</div>' +
        '<div class="info-img img-polaroid pull-left info-imghover"><img class="info-imgrentals" src="' + item.roomImg + '" onclick="javascript:Outpost.mvc.views.airbnb.slbPic(this.src)"></div>' +
        '<div class="info-content pull-left">' +
          '<ul>' +
            '<li>' +
              '<span class="icon-home css-blue"></span>' +
              '<span>' + item.type + '</span>' +
            '</li>' +
            '<li>' +
              '<span class="icon-map-marker css-green"></span>' +
              '<span class="info-origin">' + item.neigh + '</span>' +
            '</li>' +
            '<li>' +
              '<span class="icon-money css-red"></span>' +
              '<span>' + subtotal + '</span>' +
            '</li>' +
          '</ul>' +
          '<a class="btn btn-small info-book-air" onClick="_gaq.push([\'_trackEvent\', \'info-btn\',\'' + item.idtype + '\', this.href]);" href="' + item.link + '" target="_blank">' +
           '<i class="icon-check"></i>&nbsp;Book It' +
          '</a>' +
        '</div>' +
      '</div>';
    },
    // =======================================================
    //  Ridejoy Infowindow
    // =======================================================
    ridejoyInfo : function(item) {
      return '' +
      '<div class="js-infowindow">' +
        '<div class="info-desc css-bgred">' +
          '<a class="icon-remove js-closeInfoWindow css-bgred" onmouseover="Outpost.mvc.views.map.closeInfo()"></a>' +
          '<div class="info-text">' + item.desc + '</div>' +
          '<div class="info-logo">' +
            '<img src="' + item.infoWindowIcon + '">' +
          '</div>' +
        '</div>' +
        '<div class="info-picinfo">' +
          '<div class="info-img img-polaroid pull-left"><img width="76px" src="' + item.img + '"></div>' +
          '<div class="info-content pull-left">' +
            '<ul>' +
              '<li>' +
                '<span class="icon-time css-blue"></span>' +
                '<span>' + item.dates + '</span>' +
              '</li>' +
              '<li>' +
                '<span class="icon-map-marker css-green"></span>' +
                '<span class="info-origin info-oridest">' + item.origin + ' → ' +  item.destination + '</span>' +
              '</li>' +
              '<li>' +
                '<span class="icon-money css-red"></span>' +
                '<span>' + item.price + '</span>' +
              '</li>' +
            '</ul>' +
            '<a data-orig="' + item.origin + '" data-dest="' + item.destination + '" ' +
             'class="btn btn-small routeit" onclick="Outpost.mvc.views.map.routeRide(this)">' +
             '<i class="icon-random"></i>&nbsp;See route' +
            '</a>&nbsp;' +
            '<a class="btn btn-small info-book-rid" onClick="_gaq.push([\'_trackEvent\', \'info-btn\',\'' + item.idtype + '\', this.href]);" href="' + item.link + '" target="_blank">' +
             '<i class="icon-check"></i>&nbsp;Grab a seat</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    // =======================================================
    //  Vayable Infowindow
    // =======================================================
    vayableInfo : function(item) {
      return '' +
      '<div class="js-infowindow">' +
        '<div class="info-desc css-bggreen">' +
          '<a class="icon-remove js-closeInfoWindow css-bggreen" onmouseover="Outpost.mvc.views.map.closeInfo()"></a>' +
          '<div class="info-text">' + item.desc + '</div>' +
          '<div class="info-logo">' +
            '<img src="img/vayable.png" alt="coutersy of vayable">' +
          '</div>' +
        '</div>' +
        '<div class="info-img img-polaroid pull-left info-imghover"><img style="width:128px;" src="' + item.img + '" onclick="javascript:Outpost.mvc.views.vayable.slbPic(this.src)"></div>' +
        '<div class="info-content pull-left">' +
          '<ul>' +
            '<li>' +
              '<span class="icon-user css-blue"></span>' +
              '<span>City guide</span>' +
            '</li>' +
            '<li>' +
              '<span class="icon-map-marker css-green"></span>' +
              '<span class="info-origin">' + item.origin + '</span>' +
            '</li>' +
            '<li>' +
              '<span class="icon-money css-red"></span>' +
              '<span>' + item.price + ' per person</span>' +
            '</li>' +
          '</ul>' +
          '<a class="btn btn-small info-book-vay" onClick="_gaq.push([\'_trackEvent\', \'info-btn\',\'' + item.idtype + '\', this.href]);" href="' + item.link + '" target="_blank">' +
           '<i class="icon-check"></i>&nbsp;Book It' +
          '</a>' +
        '</div>' +
      '</div>';
    }
  };
})(window, jQuery, _, Backbone, undefined);

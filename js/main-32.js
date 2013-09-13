(function(window, $) {
  Parse.initialize(
    "3BO6CIc8cRGVVoTCdnSk8VtcHWlo662UbPOQKl1K",
    "faZUcHycuTHBvrV0kTcqoTtpZsNQauN8IuXDLY7j"
  );

  $.xhrPool = [];
  $.xhrPool.abortAll = function() {
    $(this).each(function(idx, jqXHR) {
      jqXHR.abort();
    });
    $.xhrPool.length = 0;
  };

  $.ajaxSetup({
    timeout: 3000,
    beforeSend: function(jqXHR) {
      $.xhrPool.push(jqXHR);
    },
    complete: function(jqXHR) {
      var index = $.xhrPool.indexOf(jqXHR);
      if (~index) {
        $.xhrPool.splice(index, 1);
      }
    }
  });

  $(document).ready(function() {
    new Outpost.views.main();
  });
})(window, jQuery, undefined);

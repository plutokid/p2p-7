(function(window, $) {
  $(document).ready(function() {
    $.ajaxSetup({
      timeout: 10000
    });

    // IE9 ajax fix
    $.support.cors = true;

    // Load logo tooltips
    $('.tooly').tooltip();
    // Initializes the MVC
    new Outpost.views.main();
  });
})(window, jQuery, undefined);

/*
* Detect if the website is opened in the mobie device
*/
function isMobileDevice(){
	return true;
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
		return true;
	}else{
		return false;
	}
}
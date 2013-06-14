(function(window, $) {
  $(document).ready(function() {
	  $('.mobile-menu-button').click(function(e){
		  $('.mobile-menu-popup').slideToggle("slow");
		  e.preventDefault();
	  });
	  $('.mobile-menu-popup-close').click(function(){
		  $('.mobile-menu-popup').slideUp("slow");
	  });
	  $(window).resize(function(){
		if ($(window).width() > 450) {
			$('.mobile-menu-popup').hide();
		}
	  });
	  $(".mobile-how-it-works").click(function(){
		$('.mobile-menu-popup').hide();
		$('html, body').animate({
			scrollTop: $("#how-it-works").offset().top-50
		}, 1000);
	  });
	  $('.mobile-contact').click(function(){
		$('.mobile-menu-popup').hide();
		$("#about").modal('show');
	  });
	  $('.question-button').click(function(){
		$("#about").modal('show');
	  });
  });
})(window, jQuery, undefined);
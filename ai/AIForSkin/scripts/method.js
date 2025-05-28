$(document).ready(function(){
    var msvg1 = $("#method1");
    var msvg2 = $("#method2");
	msvg2.show();
	msvg1.hide();
	var flag=0;
	$("p#sp2").click(function(){
		msvg2.hide();
		msvg1.fadeIn();
	});
	$("p#sp1").click(function(){
		msvg1.hide();
		msvg2.fadeIn();
	});

});
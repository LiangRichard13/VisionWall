$(document).ready(function(){
    var oDiv = $("#scrolldiv");
    var oUl = $("#ul1");
    var oLi = $("li.scrollli");
    var iSpeed = -8;
    oUl.append(oUl.html());
    oUl.width(2*oLi[0].offsetWidth+2);
	oUl.height(oDiv.height());
	
    function fnMove()
    {
		if(oUl[0].offsetWidth<=0){
			oUl.width(2*oLi[0].offsetWidth+2);
		};
        if (parseInt(oUl.css('left'))<-oUl[0].offsetWidth/2)
        {
			oUl.css('left',0);
        };
        oUl.css('left',parseInt(oUl.css('left')) +iSpeed);
    };
    setInterval(fnMove,100);
});
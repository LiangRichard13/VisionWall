$(document).ready(function(){
	$("div#demo1").hide();
	$("div#demo2").show();
	$("p#tsne_result").click(function(){
		$("div#demo1").hide();
		$("div#demo2").show();
	});
	$("img.demoimg").mouseenter(function(){
		$(this).css("border-image","-webkit-linear-gradient(top left,white 12.5%,transparent 12.5%,transparent 37.5%,white 37.5%,white 62.5%,transparent 62.5%,transparent 87.5%,white 87.5%,white ) 3");
		$(this).css("border-image","-moz-linear-gradient(top left,white 12.5%,transparent 12.5%,transparent 37.5%,white 37.5%,white 62.5%,transparent 62.5%,transparent 87.5%,white 87.5%,white ) 3");
	});
	$("img.demoimg").mouseleave(function(){
		$(this).css("border-image","none");
		$(this).css("border-color","transparent");
	});
	$("img.demoimg").click(function(){
		$("div#demo2").hide();
		$("div#demo1").show();
		$("svg#svg_diag").empty();
		var imageid=$(this).data("imid");
		var ml=0.25*$("svg#svg_diag").width();
		var mt=0.01*$("svg#svg_diag").height();
		var mr=0.15*$("svg#svg_diag").width();
		var mb=0.05*$("svg#svg_diag").height();
		var margin = {top: mt, right: mr, bottom: mb, left: ml};
		var width = $("svg#svg_diag").width() - margin.left - margin.right;
		var height  = $("svg#svg_diag").height() - margin.top - margin.bottom;
		var x = d3.scaleLinear().domain([0, 100]).range([0,width]);
		var y = d3.scaleBand().rangeRound([0,height], 0.5);

		var xAxis = d3.axisTop(x).ticks(10);
		var yAxis = d3.axisLeft(y);

		var svg = d3.select('svg#svg_diag')
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		d3.json("json/"+imageid+".json").then(function(indata) {
			var data=indata;
			y.domain(data.map(function (d)
			{
				return d.diag;
			}));

			svg.append("g")
				.call(yAxis)
				.selectAll("text")
				.style("font-size","0.8vmax")

			svg.selectAll("rect")
				.data(data)
				.enter()
				.append("rect")
				.style("fill", 'yellow')
				.attr("y", function(d)
				{
					return y(d.diag);
				})
				.attr("height", y.bandwidth())
				.attr("x", function (d)
				{
					return x(0);
				})
				.attr("width", function (d)
				{
					return x(0);
				})
				.transition()
				.duration(2000)
				.attr('width', function(d) {
					return x(100*d.prob);
				});
				
			svg.append("g").selectAll("text")
				.data(data)
				.enter()
				.append("text")
				.style('font-size', "0.8vmax")
				.style('fill', "white")
				.attr('text-anchor', 'start')
				.attr('x',function(d){
					return x(0);
				})
				.attr('y', function(d){
					return y(d.diag)+y.bandwidth()/2;
				})
				.attr('dy','0.4em')
				.text('0.00%')
				.transition()
				.duration(2000)
				.tween('text', function(d,i,a){
					return function(t) {
						d3.select(this).attr('x', x(0) + t*(x(100*d.prob)-x(0))).text((t*100*d.prob).toFixed(2)+'%')
					}
				});
		});
	});
});


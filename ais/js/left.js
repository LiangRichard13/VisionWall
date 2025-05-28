var BiClusterSize = 10;
var BiClusterHeight = 12;
var BiClusterWidth = 25;
var PositiveColor = "#70AD47";
var LightPositiveColor = "#98c879";
var NegativeColor = "#ED7D31";
var ScreenWidth = 1680;
var ScreenHeight = 880;
var Margin = 30;
var LabelDisplayHeight = 20;
var InfoDisplayHeight = 15;
var DAGHeight = ScreenHeight - Margin * 2 - LabelDisplayHeight - InfoDisplayHeight;

var duration = 400;

var LabelHeight = 20;
var LabelWidth = 65;
var MinGap = 5;
var MaxGap = 15;

var svg = d3.select("#main-part").select(".container-fluid")
    .append("svg")
    .attr("width", ScreenWidth)
    .attr("height", ScreenHeight);

var DrawMaps = [];
var VisibleDrawMaps = [];

var Categorys = [];
var Clusters = [];
var BiClusters = [];
var Layers = [];
var Edges = [];
var MaxWidth = 0;
var MaxHeight = 0;
var DataPath = "";
var Input = null;
var LoadingProcess = "Loading";
var IsInit = true;
var changePatchEnabled = false;
var tooltipEnabled = false;

var DrawMapTooltip = "DrawMapTooltip";
var BiClusterTooltip = "BiClusterTooltip";
var ActivationTooltip = "ActivationTooltip";
var ChangeViewTooltip = "ChangeViewTooltip";
var LayerLabelTooltip = "LayerLabelTooltip";

$("#edgeOpacity").val("1.0");

$(".ui-repaint").mouseover(function(){
    //if (tooltipEnabled) tooltip.pop(this, 'this is a tooltip')
});
$(".ui-colorEncoding").mouseover(function(){
    //if (tooltipEnabled) tooltip.pop(this, 'this is a tooltip')
});
$(".ui-neuronFacet").mouseover(function(){
    //if (tooltipEnabled) tooltip.pop(this, 'this is a tooltip')
});


var tooltipCount = 0;

function showTooltip(d) {
    if (tooltipEnabled == false) return;
    tooltipCount++;

    var text = "this is not a tooltip";
    if (d != null && d.Type != null) {
        if (d.Type == "BiCluster") {
            text = "An edge cluster";
        }
        else if (d.Type == "DrawMap") {
            //TODO
            text = "The learned feature of a neuron";
        }
        else if (d.Type == "Input") {
            //TODO
            text = "In put of the network";
        }
        else if (d.Type == "Cluster") {
            //TODO (Cluster means a activation matrix.)
            text = "A neuron cluster";
        }
        else if (d.Type == "Layer") {
            //TODO (means a layer label)
            text = "A layer in the network";
        }
        else {
            //TODO
        }
    }
    d3.select("#tooltip100084")
        .style("position", "absolute")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .style("display", "block");

    d3.select("#tooltip100084 .tooltip-inner")
        .html(text);

    setTimeout(function(){
        console.log(tooltipCount);
        tooltipCount--;
        if (tooltipCount == 0)
            hiddenTooltip(d);
    }, 3000);
}

function hiddenTooltip(d){

    d3.select("#tooltip100084")
        .style("display", "none");
}




function LoadData()
{
    LoadingProcess = "Loading";
    $("#repaint-button").val("Loading...");
    DrawMaps = [];
    VisibleDrawMaps = [];

    Categorys = [];
    Clusters = [];
    BiClusters = [];
    Layers = [];
    Edges = [];
    MaxWidth = 0;
    MaxHeight = 0;
    DataPath = "data/" + $("#dataSet").val() + "/" + $("#category").val();


    d3.json(DataPath + "/data.txt", function(error, nodeData){
        d3.json(DataPath + "/structure.txt", function(error, structData) {
            for (var i in structData)
            {
                var d = structData[i];
                var parent = nodeData[d[0]];
                var child = nodeData[d[1]];
                if (parent.Children == null)
                    parent.Children = [];
                parent.Children.push(child);
                if (child.Parent == null || child.Parent.Type != "Cluster")
                    child.Parent = parent;
            }

            nodeData.forEach(function(d){
                var dict = [];
                d.Data.forEach(function(item){
                    var val = item.Value;
                    if (item.Key == "X" || item.Key == "Y" || item.Key == "Size" || item.Key == "Ratio")
                    {
                        val = parseFloat(val);
                    }
                    else if (item.Key == "IsLeaf")
                    {
                        val = val == "True";
                    }
                    else if (item.Key == "Images")
                    {
                        val = JSON.parse("[" + val + "]");
                    }

                    if (item.Key == "Size")
                    {
                        dict["Size"] = val;
                        dict["Width"] = val;
                        dict["Height"] = val;
                    }
                    else
                    {
                        dict[item.Key] = val;
                    }
                });
                d.Data = dict;
            });

            nodeData.forEach(function(d){
                if (d.Type == "Category")
                {
                    Categorys.push(d);
                }
                else if (d.Type == "Cluster" && d.Children != null && d.Children.length == 2)
                {
                    d.Data.Width *= 2;
                }
                if (d.Data.X + d.Data.Width / 2 + Margin > MaxWidth)
                    MaxWidth = d.Data.X + d.Data.Width / 2 + Margin;
                if (d.Data.Y + d.Data.Height / 2 + Margin > MaxHeight)
                    MaxHeight = d.Data.Y + d.Data.Height / 2 + Margin;
            });

            var Scale = Math.min(
                (ScreenWidth - 2 * Margin) / MaxWidth,
                (DAGHeight) / MaxHeight
            );

            //console.log([Margin, Margin + MaxWidth * Scale]);
            //console.log([Margin + LabelDisplayHeight, Margin + LabelDisplayHeight + MaxHeight * Scale]);

            var x = d3.scale.linear()
                .domain([0, MaxWidth])
                .range([Margin, ScreenWidth - Margin]);

            var y = d3.scale.linear()
                .domain([0, MaxHeight])
                .range([Margin + LabelDisplayHeight, ScreenHeight - InfoDisplayHeight - Margin]);

            nodeData.forEach(function(d){
                d.Data.X = x(d.Data.X);
                d.Data.Y = y(d.Data.Y);
                d.Data.Width *= Scale;
                d.Data.Height *= Scale;
                d.Data.Size *= Scale;
                //console.log(d.Data);
            });

            d3.json(DataPath + "/edge.txt", function(error, edgeData){
                edgeData.forEach(function(d){

                    var dict = [];
                    d.Data.forEach(function(item){
                        var val = parseFloat(item.Value);
                        dict[item.Key] = val;
                    });
                    d.Data = dict;
                    d.Start = nodeData[d.Start];
                    d.End = nodeData[d.End];
                    if (d.Start.OutEdges == null) d.Start.OutEdges = [];
                    if (d.End.InEdges == null) d.End.InEdges = [];
                    d.Start.OutEdges.push(d);
                    d.End.InEdges.push(d);
                });
                LoadingProcess = "Finish";
                $("#repaint-button").val("Paint");
                if (IsInit){ RepaintAll(); IsInit = false; }
            });
        });
    });
}

$("#dataSet").change(function(){
    var dataSet = $("#dataSet").val();
    if (dataSet == "mnist_LeNet") {
        var text = "";
        var name = ["RootCategory", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        for (var i in name) {
            var n = name[i];
            text = text + '<option value="' + n + '">' + n + '</option>\n';
        }

        $("#category").html(text);
    }
    else {
        var text = "";
        var name = ["RootCategory", "airplane", "automobile", "bird", "cat", "deer", "dog", "frog", "horse", "ship", "truck"];
        for (var i in name) {
            var n = name[i];
            text = text + '<option value="' + n + '">' + n + '</option>\n';
        }

        $("#category").html(text);
    }
    LoadData();
});
$("#category").change(function(){
    LoadData();
});
LoadData();

$("#repaint-button").click(RepaintAll);

function Place(cluster)
{
    if (cluster.Width == 0 || cluster.Height == 0) return;
    var num = (cluster.Rank + 1) * (cluster.Rank + 1);
    if (cluster.Children.length < num)
        num = cluster.Children.length;
    if (num < 1) {
        return;
    }
    else if (num == 1) {
        cluster.Children[0].Data.X = cluster.Data.X;
        cluster.Children[0].Data.Y = cluster.Data.Y;
        cluster.Children[0].Data.Width = cluster.Data.Width;
        cluster.Children[0].Data.Height = cluster.Data.Height;
    }
    else if (num == 2) {
        for (var i = 0; i < 2; ++i)
        {
            cluster.Children[i].Data.X = cluster.Data.X - cluster.Data.Width / 4 + i * cluster.Data.Width / 2;
            cluster.Children[i].Data.Y = cluster.Data.Y;
            cluster.Children[i].Data.Width = cluster.Data.Width / 2;
            cluster.Children[i].Data.Height = cluster.Data.Height;
        }
    }
    else {
        var DrawMapSet = new Set();
        VisibleDrawMaps.forEach(function(d){
            DrawMapSet.add(d);
        });
        var m = cluster.Rank + 1;
        //console.log(cluster);
        for (var i = 0; i < m; ++i)
            for (var j = 0; j < m; ++j) if (i * m + j < cluster.Children.length)
            {
                var t = cluster.Children[i * m + j];
                t.Data.X = cluster.Data.X + (j - 0.5 * cluster.Rank) * cluster.Data.Width / m;
                t.Data.Y = cluster.Data.Y + (i - 0.5 * cluster.Rank) * cluster.Data.Height / m;
                t.Data.Width = cluster.Data.Width / m;
                t.Data.Height = cluster.Data.Height / m;
                if (!DrawMapSet.has(t)) VisibleDrawMaps.push(t);
            }
        for (var i = m * m; i < cluster.Children.length; ++i)
        {
            var t = cluster.Children[i];
            if (DrawMapSet.has(t)) VisibleDrawMaps.splice(VisibleDrawMaps.indexOf(t), 1);
        }
    }
}

function LayoutNodeY(layer) {
    var y0 = d3.min(layer.Children, function(d){ return d.Data.Y - d.Data.Height / 2; });
    var y1 = d3.max(layer.Children, function(d){ return d.Data.Y + d.Data.Height / 2; });
    var totHeight = d3.sum(layer.Children, function(d){ return d.Data.Height; });
    var tot = layer.Children.length;
    var scale = 1.0;
    while ((y1 - y0 - totHeight) / (tot - 1) < MinGap) {
        scale *= 0.9;
        totHeight *= 0.9;
    }
    while ((y1 - y0 - totHeight) / (tot - 1) > MaxGap) {
        scale /= 0.9;
        totHeight /= 0.9;
    }
    var gap = (y1 - y0 - totHeight) / (tot - 1);
    for (var i = 0; i < layer.Children.length; ++i) {
        var t = layer.Children[i];
        t.Data.Height *= scale;
        t.Data.Width *= scale;
        t.Data.Y = y0 + t.Data.Height / 2;
        y0 += t.Data.Height + gap;
        if (t.Type == "Cluster") Place(t);
    }
}


function InitData(category)
{
    var visited = new Set();
    Layers = [];
    BiClusters = [];
    Layers = [];
    Edges = [];
    Clusters = [];
    visit(category);
    Clusters.forEach(function(d){
        Place(d);
    });
    /*
    DrawMaps.forEach(function(d) {
        //console.log(d.Data.X, d.Data.Y);
        var count = 0;
        for (var i in Clusters) {
            var c = Clusters[i];
            if (c.Data.Width > 0)
                if (d.Data.X >= c.Data.X - c.Data.Width / 2 && d.Data.X <= c.Data.X + c.Data.Width / 2) {
                    if (d.Data.Y >= c.Data.Y - c.Data.Height / 2 && d.Data.Y <= c.Data.Y + c.Data.Height / 2) {
                        ++count;
                        if (c.Children == null) c.Children = [];
                        c.Children.push(d);
                        //if (count > 1) console.log(c.Data.X - c.Data.Width / 2, c.Data.X + c.Data.Width / 2, c.Data.Y - c.Data.Height / 2, c.Data.Y + c.Data.Height / 2, c);
                    }
                }
        }
        //console.log("================");
    });*/

    function visit(d)
    {
        if (d == null) return;
        if (visited.has(d)) return;

        if (d.Type == "BiCluster")
        {
            d.Data["Width"] = BiClusterWidth;
            d.Data["Height"] = BiClusterHeight;
            d.Widget = null;
            BiClusters.push(d);
        }
        else if (d.Type == "Layer")
        {
            if (d.Children != null && d.Data.Label != "data")
                Layers.push(d);
        }
        else if (d.Type == "DrawMap" || d.Type == "Output")
        {
            d.Rank = 0;
            DrawMaps.push(d);
            if (d.Data.Width > 0) VisibleDrawMaps.push(d);
        }
        else if (d.Type == "Cluster")
        {
            //console.log(d.Children);
            d.Rank = 1;
            Clusters.push(d);
        }
        else if (d.Type == "Input")
        {
            Input = d;
            var Num = 1;
            for (var i = 1; i <= 4; ++i) {
                if (i * i > Input.Data.Images.length) break;
                Num = i * i;
                Input.Rank = i - 1;
            }
            Input.Children = [];
            for (var i = 0; i < Num; ++i) {
                var t = { Type:"DrawMap", Data : { Images : [Input.Data.Images[i]]}};
                Input.Children.push(t);
                VisibleDrawMaps.push(t);
                t.Parent = Input;
            }
            Place(Input);
        }

        if (d.InEdges != null) {
            d.InEdges.forEach(function(e){
                Edges.push(e);
            });
        }

        if (d.Children != null)
            d.Children.forEach(function(child){
                visit(child);
            });
    }
}

function RepaintAll()
{
    if (LoadingProcess == "Loading") return;
    var category = 0;
    var edgeOpacity = parseFloat($("#edgeOpacity").val());
    var edgeFilter = parseFloat($("#edgeFilter").val());
    var neuronFacet = $("#neuronFacet").val();
    var colorEncoding = $("#colorEncoding").val();
    InitData(Categorys[category]);
    Clusters.forEach(function(d){
        d.isActivationMatrix = (neuronFacet == "activation matrix");
    });

    svg.remove();

    svg = d3.select("#main-part").select(".container-fluid")
        .append("svg")
        .attr("width", ScreenWidth)
        .attr("height", ScreenHeight);


    svg.append("rect")
        .attr("x", Margin / 2)
        .attr("y", Margin / 2)
        .attr("width", ScreenWidth - Margin * 2)
        .attr("height", ScreenHeight - Margin)
        .attr("rx", 5)
        .attr("ry", 5)
        .style("stroke-width", 3)
        .style("stroke", "#36b099")
        .style("opacity", 0.0)
        .style("stroke-dasharray", "10,10")
        .style("fill", "white")
        .on("click", function(d){
            svg.selectAll(".widget").remove();
        });



    svg.append("circle")
        .attr("cx", Margin + 140)
        .attr("cy", Margin + LabelHeight + DAGHeight + InfoDisplayHeight / 2)
        .attr("r", 8)
        .style("stroke", "#649B3F")
        .style("stroke-width", 1.5)
        .style("opacity", 0.9)
        .style("fill", changePatchEnabled ? "#b1cd9f" : "white")
        .on("click", function(){
            changePatchEnabled = !changePatchEnabled;
            d3.select(this).style("fill", changePatchEnabled ? "#b1cd9f" : "white");
        });

    svg.append("text")
        .attr("x", Margin + 5)
        .attr("y", Margin + LabelHeight + DAGHeight + InfoDisplayHeight / 2 + 4)
        .attr("font-size", "12px")
        .attr("fill", "#F8F8FF")
        .text("Click to change patch");

    svg.append("circle")
        .attr("cx", Margin + 270)
        .attr("cy", Margin + LabelHeight + DAGHeight + InfoDisplayHeight / 2)
        .attr("r", 8)
        .style("stroke", "#649B3F")
        .style("stroke-width", 1.5)
        .style("opacity", 0.9)
        .style("fill", tooltipEnabled ? "#b1cd9f" : "white")
        .on("click", function(){
            tooltipEnabled = !tooltipEnabled;
            $(function () {
                if (tooltipEnabled)
                    $('[data-toggle="tooltip"]').tooltip();
                else
                    $('[data-toggle="tooltip"]').tooltip("destroy");
            });
            d3.select(this).style("fill", tooltipEnabled ? "#b1cd9f" : "white");
        });

    svg.append("text")
        .attr("x", Margin + 170)
        .attr("y", Margin + LabelHeight + DAGHeight + InfoDisplayHeight / 2 + 4)
        .attr("font-size", "12px")
        .attr("fill", "#F8F8FF")
        .text("Tooltip enabled");

    var edge = svg.selectAll(".edge")
        .data(Edges)
        .enter();


    var edgeValue = null;
    if (colorEncoding == "Weight")
    {
        edgeValue = function(d) {
            if (d.Data.WeightP > -d.Data.WeightN)
                return d.Data.WeightP;
            else
                return -d.Data.WeightN;
        }
    }
    else if (colorEncoding == "Gradient")
    {
        edgeValue = function(d) {
            if (d.Data.GradientP > -d.Data.GradientN)
                return d.Data.GradientP;
            else
                return -d.Data.GradientN;
        }
    }
    else {
        edgeValue = function(d) {
            return d.Data.Relative;
        }
    }

    var maxValue = d3.max(Edges, edgeValue);

    var edgeColor = null;
    if (colorEncoding == "Weight")
    {
        edgeColor = function(d) {
            if (d.Data.WeightP > -d.Data.WeightN)
                return PositiveColor;
            else
                return NegativeColor;
        }
    }
    else if (colorEncoding == "Gradient")
    {
        edgeColor = function(d) {
            if (d.Data.GradientP > -d.Data.GradientN)
                return PositiveColor;
            else
                return NegativeColor;
        }
    }
    else {
        edgeColor = function(d) {
            return PositiveColor;
        }
    }

    var PaintEdges = function()
    {
        edge.append("path")
            .attr("class", "edge")
            .attr("d", function(d){
                var start = d.Start;
                var end = d.End;
                if (start.Data.X > end.Data.X)
                {
                    var t = start;
                    start = end;
                    end = t;
                }
                var startX = start.Data.X + start.Data.Width / 2;
                var endX = end.Data.X - end.Data.Width / 2;
                var midX = (startX + endX) / 2;
                var path = "M" + startX + " " + start.Data.Y + " " +
                    "C" + midX + " " + start.Data.Y + " " + midX + " " + end.Data.Y + " " + endX + " " + end.Data.Y;
                return path;
            })
            .style("fill", "none")
            .style("stroke-width", 2)
            .style("stroke", function(d){
                return edgeColor(d);
            })
            .style("opacity", function(d){
                return 0;
            });

        svg.selectAll(".edge")
            .data(Edges)
            .transition().duration(duration)
            .attr("d", function(d){
                var start = d.Start;
                var end = d.End;
                if (start.Data.X > end.Data.X)
                {
                    var t = start;
                    start = end;
                    end = t;
                }
                var startX = start.Data.X + start.Data.Width / 2;
                var endX = end.Data.X - end.Data.Width / 2;
                var midX = (startX + endX) / 2;
                var path = "M" + startX + " " + start.Data.Y + " " +
                    "C" + midX + " " + start.Data.Y + " " + midX + " " + end.Data.Y + " " + endX + " " + end.Data.Y;
                return path;
            })
            .style("fill", "none")
            .style("stroke-width", 2)
            .style("stroke", function(d){
                return edgeColor(d);
            })
            .style("opacity", function(d){
                var t = edgeValue(d) / maxValue;
                if (t > 1e-4) t = t * 0.97 + 0.03;
                if (t < edgeFilter) t = 0;
                t *= edgeOpacity;
                return t;
            });

        svg.selectAll(".edge")
            .data(Edges)
            .exit()
            .transition().duration(duration)
            .style("opacity", 0)
            .remove();
    };

    var patch = null;
    var PaintNodes = function() {

        patch = svg.selectAll(".patch")
            .data(VisibleDrawMaps)
            .enter()
            .append("image")
            .attr("class", "patch");

        patch.attr("x", function(d){ return d.Data.X - d.Data.Width / 2; })
            .attr("y", function(d){ return d.Data.Y - d.Data.Height / 2; })
            .attr("width", function(d){ return d.Data.Width; })
            .attr("height", function(d){ return d.Data.Height; })
            .attr("xlink:href", function(d){ return DataPath + "/fig/" + d.Data.Images[0] + ".png"; })
            .style("display", function(d){
                if (d.Parent != null && d.Parent.Type == "Cluster" && d.Parent.isActivationMatrix)
                    return "none";
                return "block";
            })
            .style("opacity", 1);


        svg.selectAll(".patch")
            .data(VisibleDrawMaps)
            .attr("x", function(d){ return d.Data.X - d.Data.Width / 2; })
            .attr("y", function(d){ return d.Data.Y - d.Data.Height / 2; })
            .attr("width", function(d){ return d.Data.Width; })
            .attr("height", function(d){ return d.Data.Height; })
            .attr("xlink:href", function(d){ return DataPath + "/fig/" + d.Data.Images[d.Rank] + ".png"; })
            .style("display", function(d){
                if (d.Parent != null && d.Parent.Type == "Cluster" && d.Parent.isActivationMatrix)
                    return "none";
                return "block";
            })
            .style("opacity", 1)
            .on("mouseover", function(d){
                showTooltip(d);
            })
            .on("mouseout", function(d){
                hiddenTooltip(d);
            });



        patch
            .on("click", function(d)
            {
                if (changePatchEnabled)
                {
                    d.Rank += 1;
                    if (d.Rank == d.Data.Images.length)
                        d.Rank = 0;
                    d3.select(this)
                        .attr("xlink:href", function(d){ return DataPath + "/fig/" + d.Data.Images[d.Rank] + ".png"; });
                }
                else {
                    if (d.Parent == null || d.Parent.Type != "Cluster") return;
                    d = d.Parent;
                    if (d.Widget == null) {
                        d.Widget = svg.append("g")
                            .attr("transform", "translate(" + (d.Data.X + d.Data.Width / 2) + "," + (d.Data.Y - d.Data.Width / 2) + ")")
                            .attr("class", "widget");

                        var ZoomIn = d.Widget.append("g");
                        var x1 = 20;
                        var y1 = 5;

                        var color0 = "#b1cd9f";
                        var color1 = "#649B3F";

                        ZoomIn.append("circle")
                            .attr("cx", x1)
                            .attr("cy", y1)
                            .attr("r", 10)
                            .style("stroke", "none")
                            .style("fill", color0)
                            .style("opacity", 0.5)
                            .on("mouseover", function(d){
                                d3.select(this).style("opacity", 1);
                            })
                            .on("mouseout", function(d){
                                d3.select(this).style("opacity", 0.5);
                            });

                        ZoomIn.append("line")
                            .attr("x1", x1 - 5)
                            .attr("x2", x1 + 5)
                            .attr("y1", y1)
                            .attr("y2", y1)
                            .style("stroke", color1)
                            .style("stroke-width", 1.5);

                        ZoomIn.append("line")
                            .attr("x1", x1)
                            .attr("x2", x1)
                            .attr("y1", y1 - 5)
                            .attr("y2", y1 + 5)
                            .style("stroke", color1)
                            .style("stroke-width", 1.5);

                        ZoomIn
                            .on("mouseover", function(d){
                                showTooltip(d);
                            })
                            .on("mouseout", function(d){
                                hiddenTooltip(d);
                            });

                        var ZoomOut = d.Widget.append("g");
                        var x2 = 45;
                        var y2 = 5;

                        ZoomOut.append("circle")
                            .attr("cx", x2)
                            .attr("cy", y2)
                            .attr("r", 10)
                            .style("stroke", "none")
                            .style("fill", color0)
                            .style("opacity", 0.5)
                            .on("mouseover", function(d){
                                d3.select(this).style("opacity", 1);
                            })
                            .on("mouseout", function(d){
                                d3.select(this).style("opacity", 0.5);
                            });

                        ZoomOut.append("line")
                            .attr("x1", x2 - 5)
                            .attr("x2", x2 + 5)
                            .attr("y1", y2)
                            .attr("y2", y2)
                            .style("stroke", color1)
                            .style("stroke-width", 1.5);

                        ZoomOut
                            .on("mouseover", function(d){
                                showTooltip(d);
                            })
                            .on("mouseout", function(d){
                                hiddenTooltip(d);
                            });

                        var View = d.Widget.append("g");
                        var x3 = 70;
                        var y3 = 5;

                        View.append("circle")
                            .attr("cx", x3)
                            .attr("cy", y3)
                            .attr("r", 10)
                            .style("stroke", "none")
                            .style("fill", color0)
                            .style("opacity", 0.5)
                            .on("mouseover", function(d){
                                d3.select(this).style("opacity", 1);
                            })
                            .on("mouseout", function(d){
                                d3.select(this).style("opacity", 0.5);
                            });

                        View.append("text")
                            .attr("x", x3 - 3)
                            .attr("y", y3 + 3)
                            .style("font-size", "12px")
                            .style("fill", color1)
                            .text("A");

                        View
                            .on("mouseover", function(d){
                                showTooltip(d);
                            })
                            .on("mouseout", function(d){
                                hiddenTooltip(d);
                            });

                        ZoomIn.on("click", function(){
                            if ((d.Rank + 1) * (d.Rank + 1) >= d.Children.length){
                                return;
                            }
                            else {
                                d.Data.Height = d.Data.Height / (d.Rank + 1) * (d.Rank + 2);
                                d.Data.Width = d.Data.Width / (d.Rank + 1) * (d.Rank + 2);
                                d.Rank += 1;
                            }
                            LayoutNodeY(d.Parent);
                            PaintNodes();
                            PaintEdges();
                            d.Widget
                                .transition()
                                .duration(duration)
                                .attr("transform", "translate(" + (d.Data.X + d.Data.Width / 2) + "," + (d.Data.Y - d.Data.Width / 2) + ")");
                        });


                        ZoomOut.on("click", function(){
                            if (d.Rank == 1) {
                                return;
                            }
                            else {
                                d.Data.Height = d.Data.Height / (d.Rank + 1) * (d.Rank);
                                d.Data.Width = d.Data.Width / (d.Rank + 1) * (d.Rank);
                                d.Rank -= 1;
                            }
                            LayoutNodeY(d.Parent);
                            PaintNodes();
                            PaintEdges();
                            d.Widget
                                .transition()
                                .duration(duration)
                                .attr("transform", "translate(" + (d.Data.X + d.Data.Width / 2) + "," + (d.Data.Y - d.Data.Width / 2) + ")");
                        });

                        View.on("click", function(){
                            d.isActivationMatrix = !d.isActivationMatrix;
                            PaintNodes();
                        });
                    }
                    else {
                        d.Widget.remove();
                        d.Widget = null;
                    }

                }
                /*
                else if (leftClickOption == "ZoomIn")
                {
                    if (d.Parent == null || d.Parent.Type != "Cluster") return;
                    d = d.Parent;
                    if ((d.Rank + 1) * (d.Rank + 1) >= d.Children.length){
                        return;
                    }
                    else {
                        d.Data.Height = d.Data.Height / (d.Rank + 1) * (d.Rank + 2);
                        d.Data.Width = d.Data.Width / (d.Rank + 1) * (d.Rank + 2);
                        d.Rank += 1;
                    }
                    LayoutNodeY(d.Parent);
                    PaintNodes();
                    PaintEdges();
                }
                else if (leftClickOption == "ZoomOut")
                {
                    if (d.Parent == null || d.Parent.Type != "Cluster") return;
                    d = d.Parent;
                    if (d.Rank == 1) {
                        return;
                    }
                    else {
                        d.Data.Height = d.Data.Height / (d.Rank + 1) * (d.Rank);
                        d.Data.Width = d.Data.Width / (d.Rank + 1) * (d.Rank);
                        d.Rank -= 1;
                    }
                    LayoutNodeY(d.Parent);
                    PaintNodes();
                    PaintEdges();
                }
                else if (leftClickOption == "ChangeView")
                {
                    if (d.Parent == null || d.Parent.Type != "Cluster") return;
                    d = d.Parent;
                    d.isActivationMatrix = !d.isActivationMatrix;
                    PaintNodes();
                }*/
            });

        svg.selectAll(".patch")
            .data(VisibleDrawMaps)
            .exit()
            .transition().duration(duration)
            .style("opacity", 0)
            .remove();


        var activationMatrix = svg.selectAll(".matrix")
            .data(Clusters)
            .enter()
            .append("image")
            .attr("class", "matrix")
            .attr("x", function(d){ return d.Data.X - d.Data.Width / 2; })
            .attr("y", function(d){ return d.Data.Y - d.Data.Height / 2; })
            .attr("width", function(d){ return d.Data.Width; })
            .attr("height", function(d){ return d.Data.Height; })
            .attr("xlink:href", function(d){ return DataPath + "/fig/" + d.Data.activation + ".png"; })
            .attr("display", function(d){ return d.isActivationMatrix ? "block" : "none";})
            .style("opacity", 0.7);

        svg.selectAll(".matrix")
            .data(Clusters)
            .attr("x", function(d){ return d.Data.X - d.Data.Width / 2; })
            .attr("y", function(d){ return d.Data.Y - d.Data.Height / 2; })
            .attr("width", function(d){ return d.Data.Width; })
            .attr("height", function(d){ return d.Data.Height; })
            .attr("xlink:href", function(d){ return DataPath + "/fig/" + d.Data.activation + ".png"; })
            .attr("display", function(d){ return d.isActivationMatrix ? "block" : "none";})
            .style("opacity", 0.7);

        svg.selectAll(".matrix")
            .data(Clusters).exit().remove();

        activationMatrix
            .on("mouseover", function(d){
                showTooltip(d);
            })
            .on("mouseout", function(d){
                hiddenTooltip(d);
            })
            .on("click", function(d){
                d.isActivationMatrix = !d.isActivationMatrix;
                PaintNodes();
            });


        var cluster = svg.selectAll(".cluster")
            .data(Clusters)
            .enter()
            .append("rect")
            .attr("class", "cluster");

        cluster
            .attr("x", function(d){ return d.Data.X - d.Data.Width / 2; })
            .attr("y", function(d){ return d.Data.Y - d.Data.Height / 2; })
            .attr("width", function(d){ return d.Data.Width; })
            .attr("height", function(d){ return d.Data.Height; })
            .style("stroke-width", 2)
            .style("stroke", "lightgrey")
            .style("fill", "none")
            .style("opacity", 0.0);

        svg.selectAll(".cluster")
            .data(Clusters)
            .transition().duration(duration)
            .attr("x", function(d){ return d.Data.X - d.Data.Width / 2; })
            .attr("y", function(d){ return d.Data.Y - d.Data.Height / 2; })
            .attr("width", function(d){ return d.Data.Width; })
            .attr("height", function(d){ return d.Data.Height; })
            .style("stroke-width", 2)
            .style("stroke", "lightgrey")
            .style("fill", "none")
            .style("opacity", 0.7);

        svg.selectAll(".cluster")
            .data(Clusters)
            .exit()
            .transition().duration(duration)
            .style("opacity", 0)
            .remove();

        var layer = svg.selectAll(".layer")
            .data(Layers)
            .enter()
            .append("g")
            .attr("class", "layer");

        // layer.append("rect")
        //     .attr("x", function(d){ return d.Data.X - LabelWidth / 2; })
        //     .attr("y", Margin + (LabelDisplayHeight - LabelHeight) / 2)
        //     .attr("width", LabelWidth)
        //     .attr("height", LabelHeight)
        //     .attr("rx", 3)
        //     .attr("ry", 3)
        //     .attr("stroke-width", 1)
        //     .attr("stroke", "#B0C4DE")
        //     .style("fill", "white")
        //     .style("opacity", 0)
        //     .style("stroke-opacity", 0.0)
        //     .on("mouseover", function(d){
        //         showTooltip(d);
        //     })
        //     .on("mouseout", function(d){
        //         hiddenTooltip(d);
        //     });

        layer.append("text")
            .attr("x", function(d){ return d.Data.X - LabelWidth / 2 + 15; })
            .attr("y", Margin + (LabelDisplayHeight) / 2 + 7)
            .attr("font-size", "20px")
            .style("fill", "#F8F8FF")
            .style("opacity", 0)
            .text(function(d){ return d.Data.Label; });


        svg.selectAll(".layer rect")
            .data(Layers)
            .transition().duration(duration)
            .attr("x", function(d){ return d.Data.X - LabelWidth / 2; })
            .attr("y", Margin + (LabelDisplayHeight - LabelHeight) / 2)
            .attr("width", LabelWidth)
            .attr("height", LabelHeight)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("stroke-width", 1)
            .attr("stroke", "#B0C4DE")
            .style("fill", "white")
            .style("display", function(d){ return (d.Children[0].Type == "BiCluster") ? "none" : "block"; })
            .style("opacity", 0.6)
            .style("stroke-opacity", 0.6);

        svg.selectAll(".layer text")
            .data(Layers)
            .transition().duration(duration)
            .attr("x", function(d){ return d.Data.X - LabelWidth / 2 + 15; })
            .attr("y", Margin + (LabelDisplayHeight) / 2 + 7)
            .attr("font-size", "20px")
            .style("fill", "#F8F8FF")
            .style("display", function(d){ return (d.Children[0].Type == "BiCluster") ? "none" : "block"; })
            .style("opacity", 1)
            .text(function(d){ return d.Data.Label; });

        svg.selectAll(".layer")
            .data(Layers)
            .exit()
            .transition().duration(duration)
            .style("opacity", 0)
            .remove();


        var bicluster = svg.selectAll(".bicluster")
            .data(BiClusters)
            .enter()
            .append("g")
            .attr("class", "bicluster");


        var nodeMouseEnter = function(d){
            if (d.Type == "DrawMap" &&
                d.Parent != null &&
                (d.Parent.Type == "Cluster" || d.Parent.Type == "Input"))
                d = d.Parent;

            var adjNodes = [d];
            var adjEdges = [];

            if (d.InEdges != null)
                d.InEdges.forEach(function(e){
                    adjNodes.push(e.Start);
                    adjEdges.push(e);
                });

            if (d.OutEdges != null)
                d.OutEdges.forEach(function(e){
                    adjNodes.push(e.End);
                    adjEdges.push(e);
                });


            var highlightNode = svg.selectAll(".highlightnode")
                .data(adjNodes)
                .enter()
                .append("g")
                .attr("class", "highlightnode");

            highlightNode.append("rect")
                .attr("x", function(d){ return d.Data.X - d.Data.Width / 2 - 3; })
                .attr("y", function(d){ return d.Data.Y - d.Data.Height / 2 - 3; })
                .attr("width", function(d){ return d.Data.Width + 6; })
                .attr("height", function(d){ return d.Data.Height + 6; })
                .attr("rx", 3)
                .attr("ry", 3)
                .style("stroke-width", 3)
                .style("stroke", "steelblue")
                .style("fill", "none")
                .style("opacity", 0.8);

            var highlightEdge = svg.selectAll(".highlightedge")
                .data(adjEdges)
                .enter()
                .append("g")
                .attr("class", "highlightedge");


            highlightEdge.append("path")
                .attr("d", function(d){
                    var start = d.Start;
                    var end = d.End;
                    if (start.Data.X > end.Data.X)
                    {
                        var t = start;
                        start = end;
                        end = t;
                    }
                    var startX = start.Data.X + start.Data.Width / 2;
                    var endX = end.Data.X - end.Data.Width / 2;
                    var midX = (startX + endX) / 2;
                    var path = "M" + startX + " " + start.Data.Y + " " +
                        "C" + midX + " " + start.Data.Y + " " + midX + " " + end.Data.Y + " " + endX + " " + end.Data.Y;
                    return path;
                })
                .style("fill", "none")
                .style("stroke-width", 4)
                .style("stroke", function(d){
                    return edgeColor(d);
                })
                .style("opacity", function(d){
                    var t = edgeValue(d) / maxValue;
                    if (t < edgeFilter) t = 0;
                    t *= edgeOpacity;
                    return t;
                });
        };

        var nodeMouseOut = function(d) {
            svg.selectAll(".highlightnode").remove();
            svg.selectAll(".highlightedge").remove();
        };

        bicluster
            .on("mouseover", function(d){
                showTooltip(d);
            })
            .on("mouseout", function(d){
                hiddenTooltip(d);
            })
            .on("mouseenter", nodeMouseEnter)
            .on("mouseout", nodeMouseOut);

        patch
            .on("mouseenter", nodeMouseEnter)
            .on("mouseout", nodeMouseOut);

        bicluster.append("rect")
            .attr("class", "rect1")
            .attr("x", function(d){ return d.Data.X - BiClusterWidth / 2; })
            .attr("y", function(d){ return d.Data.Y - BiClusterHeight / 2; })
            .attr("width", BiClusterWidth)
            .attr("height", BiClusterHeight)
            .attr("rx", 2)
            .attr("ry", 2)
            .style("stroke-width", 0)
            .style("fill", NegativeColor)
            .style("opacity", 0.9);

        bicluster.append("rect")
            .attr("class", "rect2")
            .attr("x", function(d){ return d.Data.X - BiClusterWidth / 2; })
            .attr("y", function(d){ return d.Data.Y - BiClusterHeight / 2; })
            .attr("width", function(d){ return d.Data.Ratio * BiClusterWidth; })
            .attr("height", BiClusterHeight)
            .attr("rx", 2)
            .attr("ry", 2)
            .style("stroke-width", 0)
            .style("fill", PositiveColor)
            .style("opacity", 0.9);

        bicluster.append("rect")
            .attr("class", "rect3")
            .attr("x", function(d){ return d.Data.X - BiClusterWidth / 2 + 2; })
            .attr("y", function(d){ return d.Data.Y - BiClusterHeight / 2; })
            .attr("width", function(d){ return d.Data.Ratio * BiClusterWidth - 2; })
            .attr("height", BiClusterHeight)
            .style("stroke-width", 0)
            .style("fill", PositiveColor)
            .style("opacity", 0.9);

        svg.selectAll(".bicluster .rect1")
            .data(BiClusters)
            .transition().duration(duration)
            .attr("x", function(d){ return d.Data.X - BiClusterWidth / 2; })
            .attr("y", function(d){ return d.Data.Y - BiClusterHeight / 2; })
            .attr("width", BiClusterWidth)
            .attr("height", BiClusterHeight)
            .attr("rx", 2)
            .attr("ry", 2)
            .style("stroke-width", 0)
            .style("fill", NegativeColor)
            .style("opacity", 0.9);

        svg.selectAll(".bicluster .rect2")
            .data(BiClusters)
            .transition().duration(duration)
            .attr("x", function(d){ return d.Data.X - BiClusterWidth / 2; })
            .attr("y", function(d){ return d.Data.Y - BiClusterHeight / 2; })
            .attr("width", function(d){ return d.Data.Ratio * BiClusterWidth; })
            .attr("height", BiClusterHeight)
            .attr("rx", 2)
            .attr("ry", 2)
            .style("stroke-width", 0)
            .style("fill", PositiveColor)
            .style("opacity", 0.9);

        svg.selectAll(".bicluster .rect3")
            .data(BiClusters)
            .transition().duration(duration)
            .attr("x", function(d){ return d.Data.X - BiClusterWidth / 2 + 2; })
            .attr("y", function(d){ return d.Data.Y - BiClusterHeight / 2; })
            .attr("width", function(d){ return d.Data.Ratio * BiClusterWidth - 2; })
            .attr("height", BiClusterHeight)
            .style("stroke-width", 0)
            .style("fill", PositiveColor)
            .style("opacity", 0.9);

        svg.selectAll(".bicluster")
            .data(BiClusters)
            .exit()
            .transition().duration(duration)
            .style("opacity", 0)
            .remove();
    };

    PaintEdges();
    PaintNodes();
}
//Canvas dimensions and margins
var width = 800,
    height = 800;

var margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
}

//Creating a categorical color scale for the protein type and establishing the category color coding by protein type.
var color = d3.scaleOrdinal(d3.schemeDark2),
    proteinType = ["Cell signaling","Immunity", "Metabolism", "Molecular traffic", "Structural", "Transcription factor", "Unknown"];

//Central node in the simulation
var selectedNodesZebrafish = ["foxp2"];

//Percentile 98 of interactions to be drawn
var percentileZebrafish = 0.857110500335693;

// create an svg to draw in
var svgZebrafish = d3.select("#zebrafish_network")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g')
    .attr('transform', 'translate(' + margin.top + ',' + margin.left + ')');

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

var simulationZebrafish = d3.forceSimulation()
    // pull nodes together based on the links between them
    .force("link", d3.forceLink().id(function(d) {
        return d.name;
    })
    .strength(0.025))
    // push nodes apart to space them out
    .force("charge", d3.forceManyBody().strength(-1000))
    // add some collision detection so they don't overlap
    .force("collide", d3.forceCollide().radius(30))
    // and draw them around the centre of the space
    .force("center", d3.forceCenter(width / 2, height / 2));

// load the graph
d3.json("datasets/zebrafish_foxp2.json", function(error, graphZebrafish) {
    // set the nodes
    var nodesZebrafish = graphZebrafish.nodes;
    // links between nodes
    var linksZebrafish = graphZebrafish.edges;
    
    // add the curved links to our graphic
    var drawLinkZebrafish = svgZebrafish.selectAll(".link")
        .data(linksZebrafish)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr('stroke', function(d){
            return "#ddd";
        })
  			.filter(function (d){if (d.weight > percentileZebrafish){return this}});

    // add the nodes to the graphic
    var drawNodeZebrafish = svgZebrafish.selectAll(".node")
        .data(nodesZebrafish)
        .enter().append("g")

    // a circle to represent the node
    drawNodeZebrafish.append("circle")
        .attr("class", "node")
    		.attr("id", function (d){return d.name})
        .attr("r", 5)
        .attr("fill", function(d) {return color(proteinType.indexOf(d.type));})
          .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        .on("mouseover", mouseOver(.2))
        .on("mouseout", mouseOut);

    // hover text for the node
    drawNodeZebrafish.append("title")
        .text(function(d) {
            return "Protein: " + d.name + "\n" + "Molecular function: " + d.type;
        });

    // add a label to each node
    drawNodeZebrafish.append("text")
        .attr("dx", 8)
        .attr("dy", ".35em")
    		.attr("font-size", "12px")
        .text(function(d) {
            return d.name;
        })
        .style("fill", function(d) {
            return color(proteinType.indexOf(d.type));
        });

    // add the nodes to the simulation and
    // tell it what to do on each tick
    simulationZebrafish
        .nodes(nodesZebrafish)
        .on("tick", ticked);

    // add the links to the simulation
    simulationZebrafish
        .force("link")
        .links(linksZebrafish);

    // on each tick, update node and link positions
    function ticked() {
        drawLinkZebrafish.attr("d", positionLink);
        drawNodeZebrafish.attr("transform", positionNode);
    }

    // links are drawn as curved paths between nodes,
    // through the intermediate nodes
    function positionLink(d) {
        var offset = 30;

        var midpoint_x = (d.source.x + d.target.x) / 2;
        var midpoint_y = (d.source.y + d.target.y) / 2;

        var dx = (d.target.x - d.source.x);
        var dy = (d.target.y - d.source.y);

        var normalise = Math.sqrt((dx * dx) + (dy * dy));

        var offSetX = midpoint_x + offset*(dy/normalise);
        var offSetY = midpoint_y - offset*(dx/normalise);

        return "M" + d.source.x + "," + d.source.y +
            "S" + offSetX + "," + offSetY +
            " " + d.target.x + "," + d.target.y;
    }

    // move the node based on forces calculations
    function positionNode(d) {
    // keep the node within the boundaries of the svg      
		
      	if(selectedNodesZebrafish.indexOf(d.name) > -1){
      		d.fx = width / 2;
          d.fy = height / 2;
    		};        
      	if (d.x < 0) {
            d.x = 0
        };
        if (d.y < 0) {
            d.y = 0
        };
        if (d.x > width) {
            d.x = width
        };
        if (d.y > height) {
            d.y = height
        };
   
        return "translate(" + d.x + "," + d.y + ")";
    }

    // build a dictionary of nodes that are linked
    var linkedByIndexZebrafish = {};
    linksZebrafish.forEach(function(d) {
        linkedByIndexZebrafish[d.source.name + "," + d.target.name] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndexZebrafish[a.name + "," + b.name] || linkedByIndexZebrafish[b.name + "," + a.name] || a.name === b.name;
    }
  
  //Fits a linear width scale for the links on mouseover
  var min_width = 0.3,
      max_width = 5,  
      scale_converterZebrafish = d3.scaleLinear().domain([d3.min(graphZebrafish.edges, function(d){return d.weight}),d3.max(graphZebrafish.edges, function(d){return d.weight})]).range([min_width,max_width]);
  
    // fade nodes on hover
    function mouseOver(opacity) {
        return function(d) {
            // check all other nodes to see if they're connected
            // to this one. if so, keep the opacity at 1, otherwise
            // fade
            drawNodeZebrafish.style("stroke-opacity", function(o) { 
              thisOpacity = isConnected(d, o) ? 1 : opacity;
                return thisOpacity;
            });
            drawNodeZebrafish.style("fill-opacity", function(o) {
                thisOpacity = isConnected(d, o) ? 1 : opacity;
                return thisOpacity;
            });
            // also style link accordingly
            drawLinkZebrafish.style("stroke-opacity", function(o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });
            drawLinkZebrafish.style("stroke", function(o){
                return o.source === d || o.target === d ? color(proteinType.indexOf(o.source.type)) : "#ddd";
            });
            drawLinkZebrafish.style("stroke-width", function(o){return scale_converterZebrafish(o.weight)});          
        };
    }

//Restore original colors and opacity after mouse out
    function mouseOut() {
        drawNodeZebrafish.style("stroke-opacity", 1);
        drawNodeZebrafish.style("fill-opacity", 1);
        drawLinkZebrafish.style("stroke-opacity", 1);
        drawLinkZebrafish.style("stroke", "#ddd");
      	drawLinkZebrafish.style("stroke-width", 1);
    }
  

//Drag actions
  function dragstarted(d) {
  if (!d3.event.active) simulationZebrafish.alphaTarget(0.5).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulationZebrafish.alphaTarget(0.01);
  d.fx = null;
  d.fy = null;
}

  
//Insert legend by color coding in the graph
var legendRectSize = 18,
    legendSpacing = 4; //Legend square size
  
var legendZebrafish = svgZebrafish.selectAll('.legend')
  .data(proteinType)
  .enter()
  .append('g')
  .attr('class', 'legend')
  .attr('transform', function(d, i) {
    var heightLegend = legendRectSize + legendSpacing;
    var offset = 600;
    var horz = -legendRectSize;
    var vert = (i * heightLegend) + offset;
    return 'translate(' + horz + ',' + vert + ')';
  });

legendZebrafish.append('rect')
  .attr('width', legendRectSize)
  .attr('height', legendRectSize)
  .style('fill', function(d,i){return color(i)})
  .style('stroke', function(d,i){return color(i)});

  legendZebrafish.append('text')
  .attr('x', legendRectSize + legendSpacing)
  .attr('y', legendRectSize - legendSpacing)
  .attr ("font-size", "14px")
  .text(function(d, i) { return d;});
  
});
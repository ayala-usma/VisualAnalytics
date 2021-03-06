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
var selectedNodesMouse = ["Foxp2"];

//Percentile 98 of interactions to be drawn
var percentileMouse = 0.523949682712555;

// create an svg to draw in
var svgMouse = d3.select("#mouse_network")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g')
    .attr('transform', 'translate(' + margin.top + ',' + margin.left + ')');

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

var simulationMouse = d3.forceSimulation()
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
d3.json("datasets/mouse_foxp2.json", function(error, graphMouse) {
    // set the nodes
    var nodesMouse = graphMouse.nodes;
    // links between nodes
    var linksMouse = graphMouse.edges;
    
    // add the curved links to our graphic
    var drawLinkMouse = svgMouse.selectAll(".link")
        .data(linksMouse)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr('stroke', function(d){
            return "#ddd";
        })
  			.filter(function (d){if (d.weight > percentileMouse){return this}});

    // add the nodes to the graphic
    var drawNodeMouse = svgMouse.selectAll(".node")
        .data(nodesMouse)
        .enter().append("g")

    // a circle to represent the node
    drawNodeMouse.append("circle")
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
    drawNodeMouse.append("title")
        .text(function(d) {
            return "Protein: " + d.name + "\n" + "Molecular function: " + d.type;
        });

    // add a label to each node
    drawNodeMouse.append("text")
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
    simulationMouse
        .nodes(nodesMouse)
        .on("tick", ticked);

    // add the links to the simulation
    simulationMouse
        .force("link")
        .links(linksMouse);

    // on each tick, update node and link positions
    function ticked() {
        drawLinkMouse.attr("d", positionLink);
        drawNodeMouse.attr("transform", positionNode);
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
		
      	if(selectedNodesMouse.indexOf(d.name) > -1){
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
    var linkedByIndexMouse = {};
    linksMouse.forEach(function(d) {
        linkedByIndexMouse[d.source.name + "," + d.target.name] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndexMouse[a.name + "," + b.name] || linkedByIndexMouse[b.name + "," + a.name] || a.name === b.name;
    }
  
  //Fits a linear width scale for the links on mouseover
  var min_width = 0.3,
      max_width = 5,  
      scale_converterMouse = d3.scaleLinear().domain([d3.min(graphMouse.edges, function(d){return d.weight}),d3.max(graphMouse.edges, function(d){return d.weight})]).range([min_width,max_width]);
  
    // fade nodes on hover
    function mouseOver(opacity) {
        return function(d) {
            // check all other nodes to see if they're connected
            // to this one. if so, keep the opacity at 1, otherwise
            // fade
            drawNodeMouse.style("stroke-opacity", function(o) { 
              thisOpacity = isConnected(d, o) ? 1 : opacity;
                return thisOpacity;
            });
            drawNodeMouse.style("fill-opacity", function(o) {
                thisOpacity = isConnected(d, o) ? 1 : opacity;
                return thisOpacity;
            });
            // also style link accordingly
            drawLinkMouse.style("stroke-opacity", function(o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });
            drawLinkMouse.style("stroke", function(o){
                return o.source === d || o.target === d ? color(proteinType.indexOf(o.source.type)) : "#ddd";
            });
            drawLinkMouse.style("stroke-width", function(o){return scale_converterMouse(o.weight)});          
        };
    }

//Restore original colors and opacity after mouse out
    function mouseOut() {
        drawNodeMouse.style("stroke-opacity", 1);
        drawNodeMouse.style("fill-opacity", 1);
        drawLinkMouse.style("stroke-opacity", 1);
        drawLinkMouse.style("stroke", "#ddd");
      	drawLinkMouse.style("stroke-width", 1);
    }
  

//Drag actions
  function dragstarted(d) {
  if (!d3.event.active) simulationMouse.alphaTarget(0.5).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulationMouse.alphaTarget(0.01);
  d.fx = null;
  d.fy = null;
}

  
//Insert legend by color coding in the graph
var legendRectSize = 18,
    legendSpacing = 4; //Legend square size
  
var legendMouse = svgMouse.selectAll('.legend')
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

legendMouse.append('rect')
  .attr('width', legendRectSize)
  .attr('height', legendRectSize)
  .style('fill', function(d,i){return color(i)})
  .style('stroke', function(d,i){return color(i)});

  legendMouse.append('text')
  .attr('x', legendRectSize + legendSpacing)
  .attr('y', legendRectSize - legendSpacing)
  .attr ("font-size", "14px")
  .text(function(d, i) { return d;});
  
});
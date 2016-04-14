addBaseline(4, 16);
function addBaseline(x, X) {
  var guides = false;
  d3.select("body")
    .on("keydown", function() {
      if(d3.event.keyCode == 72) {
        if(guides) {
          guides = false;
          d3.select("div#baseline-overlay").remove();
        } else {
          guides = true;
          var grid = d3.select("body").append("div")
            .attr("id", "baseline-overlay")
            .style("position", "absolute")
            .style("top", "0px")
            .style("left", "0px")
            .style("z-index", "9998")
            .style("pointer-events", "none")
            .style("opacity", 1)
            .style("width", width + "px")
            .style("height", height + "px")
            .style("display", "block")
              .append("svg")
              .attr("width", "100%")
              .attr("height", "100%")

            grid.append("defs")
              .selectAll("pattern")
              .data([x, X])
              .enter()
              .append("pattern")
              .attr("id", function (d, i) { return "grid" + i;  })
              .attr("width", function (d) { return d;  })
              .attr("height", function (d) { return d;  })
              .attr("patternUnits", "userSpaceOnUse")
                .append("path")
                .attr("d", function (d) { return "M " + d + " 0 L 0 0 0 " + d;  })
                .style("fill", "none")
                .style("stroke", "lightgray")
                .style("stroke-width", function (d, i) { return (i + 1) * 0.5;  })

            grid.select("pattern:last-child")
              .append("rect")
              .attr("width", function (d) { return d; })
              .attr("height", function (d) { return d; })
              .style("fill", "url(#grid0)")

            grid.append("rect")
              .attr("width", "100%")
              .attr("height", "100%")
              .style("fill", "url(#grid1)")
        }
      }
    })
  //url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='4'><rect style='fill: rgb(196,196,196);'  width='1' height='0.25px' x='0' y='3'/></svg>&quot;);"></div>
  //<div id="baseline-overlay" style="position: absolute; top: 0px; left: 0px; z-index: 9998; pointer-events: none; opacity: 1; width: 1440px; height: 785px; display: block; background-image: url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='4'><rect style='fill: rgb(196,196,196);'  width='1' height='0.25px' x='0' y='3'/></svg>&quot;);"></div>
}
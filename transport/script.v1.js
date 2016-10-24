var radius = 100;
mapboxgl.accessToken = 'pk.eyJ1IjoidzJlayIsImEiOiI4M2ZLOEVJIn0.g0A0zBZy5rJz00A1fVgDTg';
var basemap = new mapboxgl.Map({
  container: "basemap",
  style: "mapbox://styles/w2ek/cindjb8o1011ix9norxhd4tox",
  center: [56.238723,58.011399],
  zoom: 12,
  scrollZoom: false,
  doubleClickZoom: false,
  touchZoomRotate: false,
  maxBounds: [[55.715103, 57.909376], [56.694946, 58.173962]]
  //maxBounds: new mapboxgl.LngLatBounds(new mapboxgl.LngLat(55.785828, 57.871053), new mapboxgl.LngLat(56.66748, 58.184461))
});
basemap.on('load', function () {
    basemap.addSource("regions_data", {
    "type": "geojson",
    "data": "data/regions.geojson"
    });
    basemap.addLayer({
        'id': 'regions',
        'type': 'fill',
        'source': 'regions_data',
        'layout': {},
        'paint': {
            'fill-opacity': 0.001
        }
    });
});
var width = window.innerWidth;
var height = window.innerHeight;
var container = basemap.getCanvasContainer();
var offset = {
  "x": 0,
  "y": 0
}
function project(lon, lat) {
  return basemap.project(function getLL() {
    return new mapboxgl.LngLat(lon, lat)
  }());
}
//addFPSCounter();

d3.xml("data/map.svg", "image/svg+xml", function(error, xml) {
  if (error) throw error;
  container.appendChild(xml.documentElement);
  var svg = d3.select("svg").attr("id", "map");
  svg.selectAll("circle").attr("r", 0);
  var hiddenLayers = d3.select(container).append("svg").attr("id", "hiddenLayers").style("display", "none");
  var largeScale = hiddenLayers.append("g").attr("id", "largeScale").style("opacity", 0);
  var underlay = svg.append("g").attr("id", "underlay");
  var smallScale = svg.append("g").attr("id", "smallScale");
  // smallScale.append("g").attr("id", "links");
  // smallScale.append("g").attr("id", "nodes");
  var railpads = d3.select("#rail_layer").node().cloneNode(true);
  d3.select(railpads).attr("id", "railpad_layer");
  d3.select(railpads).selectAll(".rail").attr("class", "railpad").attr("id", null);
  svg.node().insertBefore(railpads, d3.select("#rail_layer").node());
  underlay.node().appendChild(d3.select("#river_layer").node());
  underlay.node().appendChild(d3.select("#sewer_layer").node());
  underlay.node().appendChild(d3.select("#railroadpad_layer").node());
  underlay.node().appendChild(d3.select(d3.select("#railroadpad_layer").node().cloneNode(true)).attr("id", "railroad_layer").node());
  d3.select("#railroadpad_layer").selectAll(".railroad").attr("class", "railroadpad");
  smallScale.node().appendChild(d3.select("#link_layer").node());
  smallScale.node().appendChild(d3.select("#node_layer").node());
  smallScale.node().insertBefore(d3.select(d3.select("#node_layer").node().cloneNode(true)).attr("id", "area_node_layer").node(), d3.select("#node_layer").node());
  largeScale.node().appendChild(d3.select("#cross_layer").node());
  largeScale.node().appendChild(d3.select("#road_layer").node());
  largeScale.node().appendChild(d3.select("#railpad_layer").node());
  largeScale.node().appendChild(d3.select("#rail_layer").node());
  largeScale.node().appendChild(d3.select("#tram_layer").node());
  largeScale.node().appendChild(d3.select("#bus_layer").node());
  d3.select("#node_layer").append("defs")
  d3.selectAll(".node").each(function () {
    var node = d3.select(this)
    createShadow(node.node().parentNode, node.attr("id"));
    d3.select(this).attr("filter", "url(#shadow_" + node.attr("id")  + ")");
    changeShadow(node.attr("id"), 2, 3, 0, "cubic-out");
  })
  d3.select("#area_node_layer").selectAll(".node").attr("class", "area_node")
    .each(function () {
      d3.select(this).attr("id", "area_" + d3.select(this).attr("id"));
    })
  var crosses = d3.selectAll(".cross");
  var roads = d3.selectAll(".road");
  railpads = d3.selectAll(".railpad");
  var rails = d3.selectAll(".rail");
  var buses = d3.selectAll(".bus");
  var trams = d3.selectAll(".tram");
  var links = d3.selectAll(".link");
  var nodes = d3.selectAll(".node");
  var rivers = d3.selectAll(".river");
  var sewers = d3.selectAll(".sewer");
  var railroads = d3.selectAll(".railroad");
  var railroadpads = d3.selectAll(".railroadpad");
  d3.selectAll(".hex").on("mousemove", function () {
    console.log(this);
  })
  // nodes.style("fill", "white")
  // links.style("fill", "none")
  //nodes.attr("r", 0);
  var popup = d3.select("#interface").append("div").attr("id", "popup")//.style("left", "-1000px")
  popup.append("div").attr("id", "location").text("Юбилейный")
  popup.append("div").attr("id", "routes")
  popup.select("#routes").append("div").attr("id", "bus").attr("class", "routes_type").style("display", "none").append("div").attr("class", "routes_logo")//;
  popup.select("#routes").append("br").attr("clear", "all").attr("id", "first_br").style("display", "none")
  popup.select("#routes").append("div").attr("id", "tram").attr("class", "routes_type").style("display", "none").append("div").attr("class", "routes_logo");
  popup.select("#routes").append("br").attr("clear", "all").attr("id", "second_br").style("display", "none")
  popup.select("#routes").append("div").attr("id", "tbus").attr("class", "routes_type").style("display", "none").append("div").attr("class", "routes_logo");
  d3.xml("pics/bus.svg", "image/svg+xml", function(error, xml) {
    if (error) throw error;
    popup.select("#bus").select(".routes_logo").node().appendChild(xml.documentElement);
  })
  d3.xml("pics/tbus.svg", "image/svg+xml", function(error, xml) {
    if (error) throw error;
    popup.select("#tbus").select(".routes_logo").node().appendChild(xml.documentElement);
  })
  d3.xml("pics/tram.svg", "image/svg+xml", function(error, xml) {
    if (error) throw error;
    popup.select("#tram").select(".routes_logo").node().appendChild(xml.documentElement);
  })
  // popup.append("div").attr("id", "bus")
  // popup.append("div").attr("id", "tram")
  // popup.append("div").attr("id", "tbus")

  d3.select("body").on("mousemove", function () {
    d3.select("#popup").style("left", (event.x + 16) + "px")
      .style("top", (event.y + 15) + "px");
  })
  d3.select("body").on("dragstart", function () {
    d3.select("#popup").style("left", (event.x + 16) + "px")
      .style("top", (event.y + 16) + "px");
  })
  function render() {
   var z = Math.pow(2, basemap.getZoom() - 13);
   offset.x = -project(55.626526, 58.20346).x / z;
   offset.y = -project(55.626526, 58.20346).y / z;
   svg.attr("viewBox", offset.x + "," + offset.y + "," + (width / z) + "," + (height / z) + "")
  }
  render();
  basemap.on("viewreset", function() {
    //render();
  })
  basemap.on("move", function() {
     //basemap.featuresAt(
    render();
  })
  queue()
  .defer(d3.json, "data/data.json")
  .await(function(error, data) {
    data = formattingData(data);
    var dataMaster = JSON.parse(JSON.stringify(data));
    //console.log(data.links);
    var zoom = new function() {
      var time = 500;
      this.levels = [10, 12, 15];
      this.mouse;
      this.stage = 1;
      this.changeState = function (b, a) {
        var s = this.stage;
        b ? this.stage++ : this.stage--
        this.stage = Math.max(0, Math.min(2, this.stage));
        if(s != this.stage) {
          s = this.stage;
          var r = Math.pow(2, this.levels[s] - 12);
          switch (s) {
            case 0:
              //time = time * 2;
              basemap.fitBounds([[55.715103, 57.909376], [56.694946, 58.173962]], {
                //padding: 300,
                duration: time,
                easing: function(t) {
                  return t;
                },
                maxZoom: 10.1
              });
              // links.transition().ease("cubic-out").duration(time)
              //   .style("stroke-width", 3 / r);
              break;
            case 1:
              if(!b) {
                svg.node().appendChild(smallScale.node());
                // underlay.transition().ease("cubic-out").duration(time)
                //   .style("opacity", 1);
                rivers.transition().ease("cubic-out").duration(time)
                  .style("stroke-width", 3)
                sewers.transition().ease("cubic-out").duration(time)
                  .style("stroke-width", 3)
                  .style("stroke-dasharray", "8,8")
                railroads.transition().ease("cubic-out").duration(time)
                  .style("stroke-width", 3)
                  .style("stroke-dasharray", "18,18")
                railroadpads.transition().ease("cubic-out").duration(time)
                  .style("stroke-width", 3)
                largeScale.transition().ease("cubic-out").duration(time)
                  .style("opacity", 0)
                  .call(function () {
                    setTimeout(function () {
                        hiddenLayers.node().appendChild(largeScale.node());
                      }, time)
                  });
              }
              // d3.selectAll(".node").transition().ease("cubic-out").duration(time)
              //   .attr("r", 0)
              links.transition().ease("cubic-out").duration(time)
                .style("opacity", 1)
                .style("stroke", "#263238")
                .style("stroke-width", 6);
              basemap.easeTo({
                  offset: [a[0] - window.innerWidth / 2, a[1] - window.innerHeight / 2],
                  duration: time,
                  zoom: this.levels[s]
              })
              break;
            case 2:
              svg.node().appendChild(largeScale.node());
              rivers.transition().ease("cubic-out").duration(time)
                .style("stroke-width", 1)
              sewers.transition().ease("cubic-out").duration(time)
                .style("stroke-width", 0)
              railroads.transition().ease("cubic-out").duration(time)
                .style("stroke-width", 1)
              railroadpads.transition().ease("cubic-out").duration(time)
                .style("stroke-width", 1)

              largeScale.transition().ease("cubic-out").duration(time)
                .style("opacity", 1);
              links.transition().ease("cubic-out").duration(time)
                .style("stroke-width", 0)
                .style("stroke", "#546e7a")
                .call(function () {
                  setTimeout(function () {
                      hiddenLayers.node().appendChild(smallScale.node());
                    }, time)
                });
              basemap.easeTo({
                  offset: [a[0] - window.innerWidth / 2, a[1] - window.innerHeight / 2],
                  duration: time,
                  zoom: this.levels[s]
              })
              break;
          }
        }
      }
    }
    d3.select("div#basemap").on("mousewheel", function(e) {
      d3.event.deltaY < 0 ? zoom.changeState(true, [d3.event.x, d3.event.y]) : zoom.changeState(false, [d3.event.x, d3.event.y])
    })
    var pin = new Pin;
    basemap.on("mousemove", function(event) {
      var relatedFeatures = basemap.queryRenderedFeatures(event.point, {
          layers: ['regions']
      });
      if(relatedFeatures.length != 0) {
        d3.select("#location").text(relatedFeatures[0].properties.name);
        d3.select("#popup").style("display", null);
        //console.log();
      } else {
        d3.select("#location").text("");
        d3.select("#popup").style("display", "none");
      }
      var active = new Array;
      var r = Math.pow(2, basemap.getZoom() - 13);
      for(item in data.nodes) {
        var x = (data.nodes[item].x - offset.x) * r - event.originalEvent.x;
        var y = (data.nodes[item].y - offset.y) * r - event.originalEvent.y;
        var h = Math.sqrt(x * x + y * y);
        var b = h < radius * r;
        b ? active.push(item) : null
        //h < 100 * r ? data.nodes[item].status = true : data.nodes[item].status = false
        data.nodes[item].h = h;
      }
      pin.highlightLinks(active);
    })

    /// PIN <---------------////
    function Pin() {
      var pinned = false;
      basemap.on("click", function (event) {
        //underlay.append("pattern")
        if(!pinned) {
          pinned = true;
          //radius = 50;
          underlay.append("g")
            .attr("id", "pointA")
            .append("defs").append("pattern")
              .attr("id", "pointApattern")
              .attr("width", 12)
              .attr("height", 12)
              .attr("patternUnits", "userSpaceOnUse")
              .attr("viewBox", "0 0 12 12")
              .attr("patternTransform", "rotate(45)")
                .append("line")
                .attr("x1", 0)
                .attr("y1", 6)
                .attr("x2", 12)
                .attr("y2", 6)
                .style("stroke-width", 4)
                .style("opacity", .3)
                .style("stroke", colors.orange.less)
                .style("stroke-linecap", "square")

          d3.select("#pointA").append("circle")
            .attr("cx", event.point.x / Math.pow(2, basemap.getZoom() - 13) + offset.x)
            .attr("cy", event.point.y / Math.pow(2, basemap.getZoom() - 13) + offset.y)
            .attr("r", 0)
            .transition().ease("cubic-out").duration(500)
            .attr("r", radius)
            .style("fill", "url(#pointApattern)")

          for(item in data.nodes) {
            if(data.nodes[item].status) {
              dataMaster.nodes[item].pinned = true;
              //d3.select("#" + item).attr("id", item + "_pinned")//.attr("class", "pinned");
              //d3.select("#area_" + item).attr("id", "area_" + item + "_pinned")//.attr("class", "pinned_area");
            }
          }

          for(item in data.links) {
            //data.links[item].status ? dataMaster.links[item].status = true : null
            data.links[item].status ? data.links[item].nodes = new Array : delete data.links[item]
          }
          data.nodes = new Object;
          for(item in data.routes) {
            if(data.routes[item].status) {
              data.routes[item].nodes.forEach(function (node) {
                if(data.nodes[node] == undefined) {
                  data.nodes[node] = JSON.parse(JSON.stringify(dataMaster.nodes[node]));
                }
              })
            } else {  delete data.routes[item]  }
          }
          for(item in data.nodes) {
            data.nodes[item].routes.forEach(function (route) {
              if(data.routes[route] != undefined) {
                data.routes[route].links.forEach(function (link) {
                  data.links[link].nodes.push(item);
                })
              }
            })
          }
        } else {
          d3.selectAll("#pointA").select("circle").transition().ease("cubic-in").duration(500)
            .attr("r", 0)
            .each("end", function () {
              d3.selectAll("#pointA").remove();
            })
          pinned = false;

          data = JSON.parse(JSON.stringify(dataMaster));

          var active = new Array;
          var r = Math.pow(2, basemap.getZoom() - 13);
          for(item in data.nodes) {
            var x = (data.nodes[item].x - offset.x) * r - event.originalEvent.x;
            var y = (data.nodes[item].y - offset.y) * r - event.originalEvent.y;
            var h = Math.sqrt(x * x + y * y);
            var b = h < radius * r;
            b ? active.push(item) : null
            //h < 100 * r ? data.nodes[item].status = true : data.nodes[item].status = false
            data.nodes[item].h = h;
          }
          for(item in data.links) {
            var b = checkStatus(data.links[item].nodes, active);
            if(b) {
              d3.select("#" + item).transition().ease("cubic-out").duration(1000)
                .style("stroke", colors.orange.main)
                .style("stroke-width", 6)
                .each(function () {
                  this.parentNode.appendChild(this)
                })
            } else {
              d3.select("#" + item).transition().ease("cubic-out").duration(1000)
                .style("stroke", colors.road.l)
                .style("stroke-width", 6)
                .each(function () {
                  this.parentNode.insertBefore(this, this.parentNode.firstChild);
                })
            }
            data.links[item].status = b;
          }
          var activeRoutes = new Array;
          for(item in data.routes) {
            if(b) {
              activeRoutes.push(item);
            }
          }
          var circleSize = d3.scale.linear().range([0, 15]).domain([400 * r, radius * r]).clamp(true);
          for(item in data.nodes) {
            // d3.select("#area_" + item).transition().ease("cubic-out").duration(1000)
            //   .attr("r", circleSize(data.nodes[item].h));
            var b = checkStatus(data.nodes[item].routes, activeRoutes);
            d3.select("#area_" + item).transition().ease("cubic-out").duration(1000)
              .attr("id", function () { return data.nodes[item].pinned ? "area_" + item + "_animated" : "area_" + item })
              .attr("r", circleSize(data.nodes[item].h))
              .style("fill", function () {  return b ? colors.orange.main : colors.road.l })
              .style("opacity", .66);
            data.nodes[item].onRoute = b;
            var b = data.nodes[item].h < radius * r;
            if(b) {
              d3.select("#" + item).transition().ease("cubic-out").duration(1000)
                .attr("r", 6)
            } else {
              d3.select("#" + item).transition().ease("cubic-out").duration(1000)
                .attr("r", 0)
            }
            data.nodes[item].status = b;
          }
          setTimeout(function () {
            for(item in data.nodes) {
              if(data.nodes[item].pinned) {
                data.nodes[item].pinned = false;
                dataMaster.nodes[item].pinned = false;
                d3.select("#area_" + item + "_animated").attr("id", "area_" + item);
              }
            }
          }, 1000)
        }
      })
      this.highlightLinks = function (a) {
        for(item in data.links) {
          var b = checkStatus(data.links[item].nodes, a);
          if(b && !data.links[item].status) {
            d3.select("#" + item).transition().ease("cubic-out").duration(500)
              .style("stroke", colors.orange.main)
              .style("stroke-width", 6)
              .each(function () {
                this.parentNode.appendChild(this)
              })
          }
          if(!b && data.links[item].status) {
            d3.select("#" + item).transition().ease("cubic-out").duration(500)
              .style("stroke", function () {
                return pinned ? colors.orange.dark : colors.road.l
              })
              .style("stroke-width", function () {
                return pinned ? 2 : 6
              })
              .each(function () {
                if(!pinned) {
                  this.parentNode.insertBefore(this, this.parentNode.firstChild);
                }
              })
          }
          data.links[item].status = b;
        }
        var activeRoutes = new Array;
        if(!pinned) {
          popup.selectAll(".route_num").remove();
          for(item in data.routes) {
            var b = checkStatus(data.routes[item].nodes, a);
            if(b) {
              activeRoutes.push(item);
              d3.select("#" + data.routes[item].type).append("div").attr("class", "route_num").attr("id", item).text(item.split("_")[1]);
            }
            data.routes[item].status = b;
          }
          if(activeRoutes.length != 0) {
            d3.select("#location").style("margin-bottom", "8px").style("border-bottom", "1px solid " + colors.grey[700]).style("height", "18px");
          } else {
            d3.select("#location").style("margin-bottom", null).style("border-bottom", null).style("height", null);
          }
          d3.select("#bus").selectAll(".route_num")[0].length != 0 ? d3.select("#bus").style("display", null) : d3.select("#bus").style("display", "none")
          d3.select("#tbus").selectAll(".route_num")[0].length != 0 ? d3.select("#tbus").style("display", null) : d3.select("#tbus").style("display", "none")
          d3.select("#tram").selectAll(".route_num")[0].length != 0 ? d3.select("#tram").style("display", null) : d3.select("#tram").style("display", "none")
          if((d3.select("#bus").selectAll(".route_num")[0].length != 0 && d3.select("#tram").selectAll(".route_num")[0].length != 0) || (d3.select("#bus").selectAll(".route_num")[0].length != 0 && d3.select("#tbus").selectAll(".route_num")[0].length != 0)) {
            d3.select("#first_br").style("display", null)
          } else {
            d3.select("#first_br").style("display", "none")
          }
          d3.select("#tbus").selectAll(".route_num")[0].length != 0 && d3.select("#tram").selectAll(".route_num")[0].length != 0 ? d3.select("#second_br").style("display", null) : d3.select("#second_br").style("display", "none")
        } else {
          var types = {
            "bus" : false,
            "tram" : false,
            "tbus" : false
          }
          for(item in data.routes) {
            var b = checkStatus(data.routes[item].nodes, a);
            b ? types[data.routes[item].type] = true : null
            b ? activeRoutes.push(item) : null
            // d3.select("div#" + item).style("background-color", function () {
            //   return b ? colors.orange.main : colors.grey[900]
            // });
            if(b && !data.routes[item].status) {
              d3.select("div#" + item).transition().ease("cubic-out").duration(500)
                .style("color", colors.grey[300])
                .style("background-color", colors.grey[800]);
            }
            if(!b && data.routes[item].status) {
              d3.select("div#" + item).transition().ease("cubic-out").duration(500)
                .style("color", colors.grey[700])
                .style("background-color", colors.grey[900]);
            }
            data.routes[item].status = b;
          }
          for(item in types) {
            d3.select("div#" + item).select("path.t_logo").transition().ease("cubic-out").duration(500)
              .style("fill", function () {
                return types[item] ? colors.grey[300] : colors.grey[800]
              })
          }
        }

        for(item in data.nodes) {
          var r = Math.pow(2, basemap.getZoom() - 13);
          var circleSize = d3.scale.linear().range([0, 15]).domain([400 * r, radius * r]).clamp(true);
          d3.select("#area_" + item).attr("r", function () {
            return data.nodes[item].pinned ? 15 : circleSize(data.nodes[item].h)
          });
          var b = checkStatus(data.nodes[item].routes, activeRoutes);
          if(b && !data.nodes[item].onRoute) {
            d3.select("#area_" + item).transition().ease("cubic-out").duration(500)
              .style("fill", colors.orange.main);
          }
          if(!b && data.nodes[item].onRoute) {
            d3.select("#area_" + item).transition().ease("cubic-out").duration(500)
              .style("fill", function () {
                return pinned ? colors.orange.dark : colors.road.l
              })
              .style("opacity", function () {
                return pinned ? .33 : .66
              });
          }
          data.nodes[item].onRoute = b;
          var b = data.nodes[item].h < radius * r;
          if(b && !data.nodes[item].status) {
            d3.select("#" + item).transition().ease("cubic-out").duration(500)
              .attr("r", 6)
          }
          if(!b && data.nodes[item].status) {
            d3.select("#" + item).transition().ease("cubic-out").duration(500)
              .attr("r", function () {
                return data.nodes[item].pinned ? 6 : 0
              })
          }
          data.nodes[item].status = b;
        }
      }
      function checkStatus(a1, a2) {
          var b = false;
          for(var i = 0; i < a1.length; i++) {
            for(var j = 0; j < a2.length; j++) {
              if(a1[i] == a2[j]) {
                b = true;
                break;
              }
            }
            if(b) { break; }
          }
          return b;
        }
    }
  })

  function createShadow(node, id) {
    var shadow = d3.select(node).select("defs").append("filter")
      .attr("id", "shadow_" + id)
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "150%")
      .attr("height", "150%")

    shadow.append("feOffset")
      .attr("result", "offOut")
      .attr("in", "SourceAlpha")
      .attr("dx", 0)
      .attr("dy", 0)

    shadow.append("feGaussianBlur")
      .attr("result", "blurOut")
      .attr("in", "offOut")
      .attr("stdDeviation", 0)

    shadow.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "blurOut")
      .attr("mode", "normal")

    shadow.append("feComponentTransfer")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.25)

    shadow.append("feMerge")
      .append("feMergeNode")

    shadow.select("feMerge")
      .append("feMergeNode")
      .attr("in", "SourceGraphic")
  }
  function changeShadow(id, x, y, b, ease) {
    d3.select("#shadow_" + id).select("feOffset")
      .transition().ease(ease).duration(500)
      .attr("dx", x)
      .attr("dy", y)

    d3.select("#shadow_" + id).select("feGaussianBlur")
      .transition().ease(ease).duration(500)
      .attr("stdDeviation", b)
  }
})

function formattingData(data) {
  data.links = new Object;
  d3.selectAll(".link").each(function () {
    var id = d3.select(this).attr("id");
    data.links[id] = new Object;
    data.links[id].status = false;
    data.links[id].routes = new Array;
    data.links[id].nodes = new Array;
  });

  //onsole.log(data.links);
  for(item in data.routes) {
    //data.routes[item].status = false;
    data.routes[item].ids.divided = new Object;
    data.routes[item].ids.divided.links = data.routes[item].ids.links;
    data.routes[item].ids.divided.nodes = data.routes[item].ids.nodes;
    data.routes[item].ids.links = mergeIDs(data.routes[item].ids.links, "link");
    data.routes[item].ids.nodes = mergeIDs(data.routes[item].ids.nodes, "node");
    data.routes[item].ids.links.forEach(function (id) {
      data.links[id].routes.push(item);
    })
    function mergeIDs(o, type) {
      var a = new Array;
      o.common.forEach(function (el) {  a.push(type + "_" + el);  });
      for(dir in o.unique) {
        o.unique[dir].forEach(function (el) {  a.push(type + "_" + el);  });
      }
      return a;
    }
    data.routes[item].divided = data.routes[item].ids.divided;
    data.routes[item].links = data.routes[item].ids.links;
    data.routes[item].nodes = data.routes[item].ids.nodes;
    delete data.routes[item].ids;
  }
  for(item in data.nodes) {
    data.nodes[item].pinned = false;
    data.nodes[item].x = d3.round(data.nodes[item].x, 1);
    data.nodes[item].y = d3.round(data.nodes[item].y, 1);
    data.nodes[item].routes.forEach(function (line) {
      data.routes[line].links.forEach(function (id) {
        data.links[id].nodes.push(item);
      })
    })
  }
  for(item in data.links) {
    if(data.links[item].routes.length == 0) {
      delete data.links[item];
      d3.select("#" + item).remove();
    }
  }
  return data;
}

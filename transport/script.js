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
  var smallScale = svg.append("g").attr("id", "smallScale");
  smallScale.append("g").attr("id", "links");
  smallScale.append("g").attr("id", "nodes");
  var railpads = d3.select("#rail_layer").node().cloneNode(true);
  d3.select(railpads).attr("id", "railpad_layer");
  d3.select(railpads).selectAll(".rail").attr("class", "railpad").attr("id", null);
  svg.node().insertBefore(railpads, d3.select("#rail_layer").node());
  smallScale.select("#links").node().appendChild(d3.select("#link_layer").node());
  smallScale.select("#nodes").node().appendChild(d3.select("#node_layer").node());
  largeScale.node().appendChild(d3.select("#cross_layer").node());
  largeScale.node().appendChild(d3.select("#road_layer").node());
  largeScale.node().appendChild(d3.select("#railpad_layer").node());
  largeScale.node().appendChild(d3.select("#rail_layer").node());
  largeScale.node().appendChild(d3.select("#tram_layer").node());
  largeScale.node().appendChild(d3.select("#bus_layer").node());
  var crosses = d3.selectAll(".cross");
  var roads = d3.selectAll(".road");
  railpads = d3.selectAll(".railpad");
  var rails = d3.selectAll(".rail");
  var buses = d3.selectAll(".bus");
  var trams = d3.selectAll(".tram");
  var links = d3.selectAll(".link");
  var nodes = d3.selectAll(".node");
  nodes.style("fill", "white")
  links.style("fill", "none")
  //nodes.attr("r", 0);
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
    render();
  })
  queue()
  .defer(d3.json, "data/data.json")
  //.defer(d3.json, "data/buses.json")
  //.defer(d3.json, "data/trams.json")
  .await(function(error, data) {
    data = formattingData(data);
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
              links.transition().ease("cubic-out").duration(time)
                .style("stroke-width", 3 / r);
              break;
            case 1:
              if(!b) {
                svg.node().appendChild(smallScale.node());
                largeScale.transition().ease("cubic-out").duration(time)
                  .style("opacity", 1)
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
                .style("stroke-width", 6);
              basemap.easeTo({
                  offset: [a[0] - window.innerWidth / 2, a[1] - window.innerHeight / 2],
                  duration: time,
                  zoom: this.levels[s]
              })
              break;
            case 2:
              svg.node().insertBefore(largeScale.node(), svg.node().childNodes[0]);
              largeScale.transition().ease("cubic-out").duration(time)
                .style("opacity", 1);
              links.transition().ease("cubic-out").duration(time)
                .style("stroke-width", 0)
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
    // nodes.on("click", function () {
    //   console.log(d3.select(this).node());
    // })
    // links.on("click", function () {
    //   console.log(d3.select(this).attr("id"));
    // })
    //active = ["node_197"];

    // d3.selectAll(".mainLink").style("stroke", "black").style("fill", "none")
    // d3.selectAll(".rightLink").style("stroke", "red").style("fill", "none")
    // d3.selectAll(".leftLink").style("stroke", "blue").style("fill", "none")
    // d3.selectAll(".mainLink").style("stroke", "black").style("fill", "none")
    //d3.select("#link_layer").remove();
    var pins = new Array;
    pins[0] = new Pin;
    d3.select("div#basemap").on("mousewheel", function(e) {
      d3.event.deltaY < 0 ? zoom.changeState(true, [d3.event.x, d3.event.y]) : zoom.changeState(false, [d3.event.x, d3.event.y])
    })
    basemap.on("dblclick", function (e) {
      zoom.changeState(true);
    })
    basemap.on("mousemove", function(event) {
      var active = new Array;
      var r = Math.pow(2, basemap.getZoom() - 13);
      for(item in data.nodes) {
        var x = (data.nodes[item].x - offset.x) * r - event.originalEvent.x;
        var y = (data.nodes[item].y - offset.y) * r - event.originalEvent.y;
        var h = Math.sqrt(x * x + y * y);
        var b = h < 100 * r;
        b ? active.push(item) : null
        //h < 100 * r ? data.nodes[item].status = true : data.nodes[item].status = false
        data.nodes[item].h = h;
      }
      //console.log(data.links["link_147"].status);
      pins.forEach(function (pin, i) {
        pin.highlightLinks(active);
      })
    })
    d3.selectAll(".link").each(function () {
      d3.select(this).datum(data.links[d3.select(this).attr("id")]);
      d3.select(this).each(function (d) {
        d.d0 = d3.select(this).attr("d");
        d.d1 = d3.select(this).attr("d1");
        d.d2 = d3.select(this).attr("d2");
        d3.select(this).attr("d1", null);
        d3.select(this).attr("d2", null);
      })
    })
    d3.selectAll(".node").each(function () {
      d3.select(this).datum(data.nodes[d3.select(this).attr("id")]);
    })
    function Pin() {
      var index = pins.length;
      // var linksData = (JSON.parse(JSON.stringify(data.links)));
      // var routesData = (JSON.parse(JSON.stringify(data.routes)));
      // var nodesData = (JSON.parse(JSON.stringify(data.nodes)));
      var linksData = data.links;
      var routesData = data.routes;
      var nodesData = JSON.parse(JSON.stringify(data.nodes));
      var pinned = false;
      // var colorA = ["#b71c1c", "#2196F3", "#3F51B5", "#03A9F4", "#009688", "#8BC34A", "#FFC107", "FF9800"][index % 8];
      // var colorB = "#aaa";
      var colorA = "#FF9800";
      var colorB = "#263238";
      var colorC = "#FF9800";
      var colorD = "#263238";
      var links = d3.selectAll(".link")
      var nodes = d3.selectAll(".node")
      // links.each(function (d, i) {
      //   console.log(d);
      // })
      // var links = d3.selectAll(".link").filter(function (d, i) {
      //   var id = d3.select(this).attr("id");
      //   return !data.links[id].status;
      // });
      basemap.on("click", function () {
        colorB = "#E65100";
        colorC = "#03A9F4";

        links = links.each(function (d) {
          d.nodes = new Array;
          d.pinned = d.status;
          //return d.status;
        })
        for(item in routesData) {
          routesData[item].pinned = routesData[item].status;
        }
        nodes.each(function (d) {
          var id = d3.select(this).attr("id");
          if(d.status) {
            d.routes.forEach(function (line) {
              if(routesData[line].status) {
                routesData[line].links.forEach(function (link) {
                  d3.select("#" + link).each(function (d) { d.nodes.push(id); })
                })
              }
            })
          } else {
            d.routes.forEach(function (line) {
              if(!routesData[line].status) {
                routesData[line].links.forEach(function (link) {
                  d3.select("#" + link).each(function (d) {
                    if(!d.status) {
                      d.nodes.push(id)
                    }
                  })
                })
              }
            })
          }
        })
        pinned = true;
      })

      this.highlightLinks = function (a) {
        // var right = main.parentNode.insertBefore(d3.select(main.cloneNode(true)).attr("class", "sideLink").attr("id", "rightLink_" + id).node(), main);
        var temp = new Array;
        for(item in routesData) {
          var b = checkStatus(routesData[item].nodes, a);
          b ? temp.push(item) : null
          routesData[item].status = b;
        }
        links.each(function (d, i) {
          var id = d3.select(this).attr("id");
          var b = checkStatus(d.nodes, a);
          //var b = checkStatus(d.routes, temp);
          var b1 = function () {
            if(pinned) {
              for (var i = 0; i < d.routes.length; i++) {
                if(routesData[d.routes[i]].pinned === false && routesData[d.routes[i]].status === true) {
                  return true;
                  break;
                }
              }
            }
            return false;
          }();
          if(b && !d.status) {
            d3.select(this).transition().ease("cubic-out").duration(500)
              .style("stroke", function () {
                return d.pinned ? colorA : colorC
              });
          }
          if(!b && d.status) {
            d3.select(this).transition().ease("cubic-out").duration(500)
              .style("stroke", function () {
                return d.pinned ? colorB : colorD
              });
          }
          d.status = b;
          if(d.pinned) {
            if(b1 && !d.double) {
              var right = d3.select(this).node();
              var left = right.parentNode.insertBefore(d3.select(right.cloneNode(true)).attr("class", "sideLink").node(), right);
              d3.select(right).transition().ease("cubic-out").duration(500)
                .attr("d", d.d1)
              d3.select(left).style("stroke", colorC)
                .transition().ease("cubic-out").duration(500)
                .attr("d", d.d2)
            }
            if(!b1 && d.double) {
              // var right = d3.select(this).node();
              // var left = right.parentNode.insertBefore(d3.select(right.cloneNode(true)).attr("class", "sideLink").node(), right);
              d3.selectAll("#" + d3.select(this).attr("id")).transition().ease("cubic-out").duration(500)
                .attr("d", d.d0)
                .each("end", function () {
                  d3.select(this).attr("class") == "sideLink" ? d3.select(this).remove() : null
                });
            }
            d.double = b1;
          }
          // if(d.pinned) {
          //   var b = function () {
          //     var b = false;
          //     for(var i = 0; i < d.routes.length; i++) {
          //       if(routesData[d.routes[i]].pinned === false) {
          //         b = true;
          //         break;
          //       }
          //     }
          //     return b;
          //   }();
          //   if(b && !d.double) {
          //     d.d = d3.select(this).attr("d");
          //     var right = d3.select(this).node();
          //     // .attr("id", "rightLink_" + id)
          //     var left = right.parentNode.insertBefore(d3.select(right.cloneNode(true)).attr("class", "sideLink").node(), right);
          //     d3.select(this).transition().ease("cubic-out").duration(500)
          //       .attr("d", d3.select(right).attr("d1"))
          //     d3.select(this).style("stroke", colorC).transition().ease("cubic-out").duration(500)
          //       .attr("d", d3.select(right).attr("d2"))
          //   }
          //   if(!b && d.double) {
          //     d.d = d3.select(this).attr("d");
          //     // .attr("id", "rightLink_" + id)
          //     //var left = main.parentNode.insertBefore(d3.select(right.cloneNode(true)).attr("class", "sideLink").node(), right);
          //     d3.selectAll(d3.select(this).attr("id")).transition().ease("cubic-out").duration(500)
          //       .attr("d", d.d)
          //       .each("end", function () {
          //         if(d3.select(this).attr("class") == "sideLink") {
          //           d3.select(this).remove();
          //         }
          //       })
          //   }
          //   d.double = b;
          // }
        })
        //console.log(temp);
        nodes.each(function (d) {
          var r = Math.pow(2, basemap.getZoom() - 13);
          var circleSize = d3.scale.linear().range([0, 13]).domain([300 * r, 0]).clamp(true);
          d3.select(this).attr("r", circleSize(d.h))
            // .transition().ease("cubic-out").duration(500)
            // .style("fill", function () {
            //   return d.h < 50 ? "white" : colorA
            // });
          var b = checkStatus(d.routes, temp);
          //console.log(d.routes + " and " + temp);
          if(b && !d.status) {
            d3.select(this).transition().ease("cubic-out").duration(500)
            .style("stroke", colorA)
            // .style("fill", function () {
            //   return d.h < 100 ? "white" : colorA
            // });
          }
          if(!b && d.status) {
            d3.select(this).transition().ease("cubic-out").duration(500)
            .style("stroke", colorB)
            // .style("fill", function () {
            //   return d.h < 100 ? "white" : colorA
            // });
          }
          d.status = b
        })

        // for(item in nodesData) {
        //   var r = Math.pow(2, basemap.getZoom() - 13);
        //   var circleSize = d3.scale.linear().range([0, 13]).domain([300 * r, 0]).clamp(true);
        //   nodesLayer.select("#" + item + addon).attr("r", circleSize(data.nodes[item].h));
        //   var b = checkStatus(nodesData[item].routes, temp);
        //   if(b && !nodesData[item].status) {
        //     nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
        //       .style("stroke", colorA)
        //       //.style("fill", colorA);
        //       .style("fill", "white");
        //       //.style("fill", function() { return pinnedNode ? colorA : "white"  });
        //   }
        //   if(!b && nodesData[item].status) {
        //     nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
        //       .style("stroke", colorB)
        //       // .style("fill", colorB);
        //       .style("fill", "white");
        //       //.style("fill", function() { return pinnedNode ? colorB : "white"  });
        //   }
        //   nodesData[item].status = b;
        // }
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
    }
    // function Pin() {
    //   var index = pins.length;
    //   var linksData = (JSON.parse(JSON.stringify(data.links)));
    //   //linksData = data.links;
    //   var routesData = (JSON.parse(JSON.stringify(data.routes)));
    //   var nodesData = (JSON.parse(JSON.stringify(data.nodes)));
    //   //routesData = data.routes;
    //   // for(item in linksData) {
    //   //   linksData[item].status = false;
    //   // }
    //   var pinned = false;
    //   var colorA = ["#b71c1c", "#2196F3", "#3F51B5", "#03A9F4", "#009688", "#8BC34A", "#FFC107", "FF9800"][index % 8];
    //   var colorB = "#aaa";
    //   var linksLayer = d3.select("#link_layer");
    //   var nodesLayer = d3.select("#node_layer");
    //   var addon = "";
    //   var div = d3.select("#sidebar").append("div").attr("class", "dir");
    //   div.append("div").attr("class", "dirHeader").text("Укажите пункт назначения");
    //   div.append("div").attr("class", "bus").append("div").attr("class", "icon").append("img").attr("src", "pics/bus.svg");
    //   div.append("div").attr("class", "tbus").append("div").attr("class", "icon").append("img").attr("src", "pics/tbus.svg");
    //   div.append("div").attr("class", "tram").append("div").attr("class", "icon").append("img").attr("src", "pics/tram.svg");
    //   div.select(".bus").append("div").attr("class", "busItems");
    //   div.select(".tbus").append("div").attr("class", "tbusItems");
    //   div.select(".tram").append("div").attr("class", "tramItems");
    //   //var linksSelection = linksLayer.selectAll(".link");

    //   basemap.on("click", function (event) {
    //     if(!pinned) {
    //       pinned = true;
    //       pins[pins.length] = new Pin;
    //       // addon = "_" + index;
    //       colorB = "#ef9a9a";
    //       //colorB = ["#ef9a9a", "#90CAF9", "#3F51B5", "#03A9F4", "#009688", "#8BC34A", "#FFC107", "FF9800"][index % 8];
    //       colorA = ["#b71c1c", "#2196F3", "#3F51B5", "#03A9F4", "#009688", "#8BC34A", "#FFC107", "FF9800"][index % 8];
    //       linksLayer = smallScale.select("#links").insert("g").attr("id", "link_pinned_" + index);
    //       nodesLayer = smallScale.select("#nodes").append("g").attr("id", "node_pinned_" + index);
    //       for(item in linksData) {
    //         if(linksData[item].status) {
    //           //linksLayer.node().appendChild(d3.select(d3.select("#" + item).node().cloneNode(true)).attr("id", item + addon).node());
    //           linksLayer.node().appendChild(d3.select("#" + item).attr("id", item + addon).node());
    //           linksLayer.select("#" + item + addon).transition().ease("cubic-out").duration(1500)
    //             .style("stroke", colorA);
    //           linksData[item].nodes = new Array;
    //         } else {
    //           delete linksData[item];
    //         }
    //       }
    //       nodesData = new Object;
    //       for(item in routesData) {
    //         if(routesData[item].status) {
    //           routesData[item].nodes.forEach(function (node) {
    //             if(nodesData[node] == undefined) {
    //               nodesData[node] = (JSON.parse(JSON.stringify(data.nodes[node])));
    //             }
    //           })
    //         } else {
    //           delete routesData[item];
    //         }
    //       }
    //       for(item in nodesData) {
    //         nodesData[item].routes.forEach(function (line) {
    //           if(routesData[line] != undefined) {
    //             routesData[line].links.forEach(function (id) {
    //               linksData[id].nodes.push(item);
    //             })
    //           }
    //         })
    //         //nodesLayer.node().appendChild(d3.select(d3.select("#" + item).node().cloneNode(true)).attr("id", item + addon).node());
    //         nodesLayer.node().appendChild(d3.select("#" + item).attr("id", item + addon).node());
    //         if(data.nodes[item].status) {
    //            nodesLayer.select("#" + item + addon).attr("class", "node_pinned").transition().ease("cubic-out").duration(500)
    //             .attr("r", 13)
    //             //.style("fill", colorA);
    //         }
    //         div.selectAll(".item").transition().ease("cubic-out").duration(500)
    //           .style("background-color", colorA);
    //         // if(nodesData[item].status) {
    //         //   nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
    //         //     .style("stroke", colorA)
    //         //     .style("fill", "white")
    //         //     .attr("r", 13);
    //         // } else {
    //         //   nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
    //         //     .style("stroke", colorA)
    //         //     .style("fill", "white")
    //         // }
    //       }
    //     }
    //   })

    //   this.highlightLinks = function (a) {
    //     for(item in linksData) {
    //       var b = checkStatus(linksData[item].nodes, a);
    //       if(b && !linksData[item].status) {
    //         //linksLayer.select("#" + item + addon).node().parentNode.appendChild(linksLayer.select("#" + item + addon).node());
    //         linksLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
    //           .style("stroke", colorA);
    //       }
    //       if(!b && linksData[item].status) {
    //         //layer.select("#" + item).node().parentNode.appendChild(layer.select("#" + item).node());
    //         linksLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
    //           .style("stroke", colorB);
    //       }
    //       linksData[item].status = b;
    //     }
    //     // var nest = d3.nest()
    //     // .key(function (d) { return d.status})
    //     // .entries(linksData)
    //     var temp = new Array;
    //     div.selectAll(".item").remove();

    //     for(item in routesData) {
    //       var b = checkStatus(routesData[item].nodes, a);
    //       routesData[item].status = b;
    //       if(b) {
    //         var type = item.split("_")[0];
    //         var name = item.split("_")[1];
    //         div.select("." + type + "Items").append("div")
    //           .attr("class", "item")
    //           .text(name)
    //           .style("background-color", function () {
    //             if(pinned) {
    //               return colorA;
    //             } else {
    //               return colorB;
    //             }
    //           });
    //         temp.push(item);
    //       } else {
    //         if(pinned) {
    //           var type = item.split("_")[0];
    //           var name = item.split("_")[1];
    //           div.select("." + type + "Items").append("div")
    //             .attr("class", "item")
    //             .text(name)
    //             .style("background-color", colorB);
    //         }
    //       }
    //     }
    //     div.select(".bus").style("display", function() {
    //       return div.select(".bus").selectAll(".item")[0].length == 0 ? "none" : "block"
    //     })
    //     div.select(".tbus").style("display", function() {
    //       return div.select(".tbus").selectAll(".item")[0].length == 0 ? "none" : "block"
    //     })
    //     div.select(".tram").style("display", function() {
    //       return div.select(".tram").selectAll(".item")[0].length == 0 ? "none" : "block"
    //     })
    //     for(item in nodesData) {
    //       var pinnedNode = nodesLayer.select("#" + item + addon).attr("class") == "node_pinned";
    //       if(!pinnedNode) {
    //         var r = Math.pow(2, basemap.getZoom() - 13);
    //         var circleSize = d3.scale.linear().range([0, 13]).domain([300 * r, 0]).clamp(true);
    //         nodesLayer.select("#" + item + addon).attr("r", circleSize(data.nodes[item].h));
    //       }
    //       var b = checkStatus(nodesData[item].routes, temp);
    //       if(b && !nodesData[item].status) {
    //         nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
    //           .style("stroke", colorA)
    //           //.style("fill", colorA);
    //           .style("fill", "white");
    //           //.style("fill", function() { return pinnedNode ? colorA : "white"  });
    //       }
    //       if(!b && nodesData[item].status) {
    //         nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
    //           .style("stroke", colorB)
    //           // .style("fill", colorB);
    //           .style("fill", "white");
    //           //.style("fill", function() { return pinnedNode ? colorB : "white"  });
    //       }
    //       nodesData[item].status = b;
    //     }
    //     function checkStatus(a1, a2) {
    //       var b = false;
    //       for(var i = 0; i < a1.length; i++) {
    //         for(var j = 0; j < a2.length; j++) {
    //           if(a1[i] == a2[j]) {
    //             b = true;
    //             break;
    //           }
    //         }
    //         if(b) { break; }
    //       }
    //       return b;
    //     }
    //   }
    // }
    //debugTools(nodes, lines);
  })
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

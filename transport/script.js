mapboxgl.accessToken = 'pk.eyJ1IjoidzJlayIsImEiOiI4M2ZLOEVJIn0.g0A0zBZy5rJz00A1fVgDTg';
var basemap = new mapboxgl.Map({
  container: "basemap",
  style: "mapbox://styles/w2ek/cil7resyl00ewc8lzg9b7jkqk",
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
        h < 100 * r ? data.nodes[item].status = true : data.nodes[item].status = false
        data.nodes[item].h = h;
      }
      //console.log(data.links["link_147"].status);
      pins.forEach(function (pin, i) {
        pin.highlightLinks(active);
      })
    })
    function Pin() {
      var index = pins.length;
      var linksData = (JSON.parse(JSON.stringify(data.links)));
      //linksData = data.links;
      var routesData = (JSON.parse(JSON.stringify(data.routes)));
      var nodesData = (JSON.parse(JSON.stringify(data.nodes)));
      //routesData = data.routes;
      // for(item in linksData) {
      //   linksData[item].status = false;
      // }
      var pinned = false;
      var colorA = ["#b71c1c", "#2196F3", "#3F51B5", "#03A9F4", "#009688", "#8BC34A", "#FFC107", "FF9800"][index % 8];
      var colorB = "#aaa";
      var linksLayer = d3.select("#link_layer");
      var nodesLayer = d3.select("#node_layer");
      var addon = "";
      var div = d3.select("#sidebar").append("div").attr("class", "dir");
      div.append("div").attr("class", "dirHeader").text("Укажите пункт назначения");
      div.append("div").attr("class", "bus").append("div").attr("class", "icon").append("img").attr("src", "pics/bus.svg");
      div.append("div").attr("class", "tbus").append("div").attr("class", "icon").append("img").attr("src", "pics/tbus.svg");
      div.append("div").attr("class", "tram").append("div").attr("class", "icon").append("img").attr("src", "pics/tram.svg");
      div.select(".bus").append("div").attr("class", "busItems");
      div.select(".tbus").append("div").attr("class", "tbusItems");
      div.select(".tram").append("div").attr("class", "tramItems");
      //var linksSelection = linksLayer.selectAll(".link");
      basemap.on("click", function (event) {
        if(!pinned) {
          pinned = true;
          //pins[pins.length] = new Pin;
          //addon = "_" + index;
          colorB = "#ef9a9a";
          //colorB = ["#ef9a9a", "#90CAF9", "#3F51B5", "#03A9F4", "#009688", "#8BC34A", "#FFC107", "FF9800"][index % 8];
          colorA = ["#b71c1c", "#2196F3", "#3F51B5", "#03A9F4", "#009688", "#8BC34A", "#FFC107", "FF9800"][index % 8];
          linksLayer = smallScale.select("#links").insert("g").attr("id", "link_pinned_" + index);
          nodesLayer = smallScale.select("#nodes").append("g").attr("id", "node_pinned_" + index);
          for(item in linksData) {
            if(linksData[item].status) {
              //linksLayer.node().appendChild(d3.select(d3.select("#" + item).node().cloneNode(true)).attr("id", item + addon).node());
              linksLayer.node().appendChild(d3.select("#" + item).attr("id", item + addon).node());
              linksLayer.select("#" + item + addon).transition().ease("cubic-out").duration(1500)
                .style("stroke", colorA);
              linksData[item].nodes = new Array;
            } else {
              delete linksData[item];
            }
          }
          nodesData = new Object;
          for(item in routesData) {
            if(routesData[item].status) {
              routesData[item].nodes.forEach(function (node) {
                if(nodesData[node] == undefined) {
                  nodesData[node] = (JSON.parse(JSON.stringify(data.nodes[node])));
                }
              })
            } else {
              delete routesData[item];
            }
          }
          for(item in nodesData) {
            nodesData[item].routes.forEach(function (line) {
              if(routesData[line] != undefined) {
                routesData[line].links.forEach(function (id) {
                  linksData[id].nodes.push(item);
                })
              }
            })
            //nodesLayer.node().appendChild(d3.select(d3.select("#" + item).node().cloneNode(true)).attr("id", item + addon).node());
            nodesLayer.node().appendChild(d3.select("#" + item).attr("id", item + addon).node());
            if(data.nodes[item].status) {
               nodesLayer.select("#" + item + addon).attr("class", "node_pinned").transition().ease("cubic-out").duration(500)
                .attr("r", 13)
                //.style("fill", colorA);
            }
            div.selectAll(".item").transition().ease("cubic-out").duration(500)
              .style("background-color", colorA);
            // if(nodesData[item].status) {
            //   nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
            //     .style("stroke", colorA)
            //     .style("fill", "white")
            //     .attr("r", 13);
            // } else {
            //   nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
            //     .style("stroke", colorA)
            //     .style("fill", "white")
            // }
          }
        }
      })
      this.highlightLinks = function (a) {
        for(item in linksData) {
          var b = checkStatus(linksData[item].nodes, a);
          if(b && !linksData[item].status) {
            //linksLayer.select("#" + item + addon).node().parentNode.appendChild(linksLayer.select("#" + item + addon).node());
            linksLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
              .style("stroke", colorA);
          }
          if(!b && linksData[item].status) {
            //layer.select("#" + item).node().parentNode.appendChild(layer.select("#" + item).node());
            linksLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
              .style("stroke", colorB);
          }
          linksData[item].status = b;
        }
        // var nest = d3.nest()
        // .key(function (d) { return d.status})
        // .entries(linksData)
        var temp = new Array;
        div.selectAll(".item").remove();
        for(item in routesData) {
          var b = checkStatus(routesData[item].nodes, a);
          routesData[item].status = b;
          if(b) {
            var type = item.split("_")[0];
            var name = item.split("_")[1];
            div.select("." + type + "Items").append("div")
              .attr("class", "item")
              .text(name)
              .style("background-color", function () {
                if(pinned) {
                  return colorA;
                } else {
                  return colorB;
                }
              });
            temp.push(item);
          } else {
            if(pinned) {
              var type = item.split("_")[0];
              var name = item.split("_")[1];
              div.select("." + type + "Items").append("div")
                .attr("class", "item")
                .text(name)
                .style("background-color", colorB);
            }
          }
        }
        div.select(".bus").style("display", function() {
          return div.select(".bus").selectAll(".item")[0].length == 0 ? "none" : "block"
        })
        div.select(".tbus").style("display", function() {
          return div.select(".tbus").selectAll(".item")[0].length == 0 ? "none" : "block"
        })
        div.select(".tram").style("display", function() {
          return div.select(".tram").selectAll(".item")[0].length == 0 ? "none" : "block"
        })
        for(item in nodesData) {
          var pinnedNode = nodesLayer.select("#" + item + addon).attr("class") == "node_pinned";
          if(!pinnedNode) {
            var r = Math.pow(2, basemap.getZoom() - 13);
            var circleSize = d3.scale.linear().range([0, 13]).domain([300 * r, 0]).clamp(true);
            nodesLayer.select("#" + item + addon).attr("r", circleSize(data.nodes[item].h));
          }
          var b = checkStatus(nodesData[item].routes, temp);
          if(b && !nodesData[item].status) {
            nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
              .style("stroke", colorA)
              //.style("fill", colorA);
              .style("fill", "white");
              //.style("fill", function() { return pinnedNode ? colorA : "white"  });
          }
          if(!b && nodesData[item].status) {
            nodesLayer.select("#" + item + addon).transition().ease("cubic-out").duration(500)
              .style("stroke", colorB)
              // .style("fill", colorB);
              .style("fill", "white");
              //.style("fill", function() { return pinnedNode ? colorB : "white"  });
          }
          nodesData[item].status = b;
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
    }
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
    //data.nodes[item].status = false;
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

function debugTools(node, lines) {
  //console.log(JSON.stringify(lines));
  var backup = new Object;
  //editRoutes();
  //findUniques();
  //editNodes();
  //createViz();
  function createViz() {
    var links = function () {
      var newObj = new Object;
      for(item in lines) {
        lines[item].ids.links.common.forEach(addLine);
        for(dir in lines[item].ids.links.unique) {
          lines[item].ids.links.unique[dir].forEach(addLine);
        }
        function addLine(el) {
          // var obj = new Object;
          // obj.id = ;
          // obj.type = lines[item].type;
          newObj[el] == undefined ? newObj[el] = new Array : null
          newObj[el].push(item);
        }
      }
      return newObj;
    }();
    var circleSize = d3.scale.sqrt().range([0, 6]).domain([0, 1]);
    var strokeSize = d3.scale.sqrt().range([0, 5]).domain([0, 1]);
    //d3.scale.linear().range(["red", "blue", "green", "yellow"]).domain([0, line.links.length * 0.333, line.links.length  * 0.666, line.links.length]);
    d3.selectAll(".node").attr("r", function () {
      var id = d3.select(this).attr("id").split("_")[1];
      return circleSize(nodes[id].routes.length);
    })
    .style("opacity", .7)
    .style("stroke", "none")
    .style("fill", "red")
  d3.selectAll(".link").style("stroke-width", function () {
    var id = d3.select(this).attr("id").split("_")[1];
    var x;
    links[id] == undefined ? x = 0 : x = links[id].length
    return strokeSize(x);
  })
  .style("stroke", "black")
  }
  function editNodes() {
    //var temp = new Object;
    console.log(lines);
    for(item in nodes) {
      nodes[item].routes = new Array;
    }
    for(item in lines) {
      lines[item].ids.stops.common.forEach(addLine);
      for(dir in lines[item].ids.stops.unique) {
        lines[item].ids.stops.unique[dir].forEach(addLine);
      }
      function addLine(el) {
        // var obj = new Object;
        // obj.id = ;
        // obj.type = lines[item].type;
        nodes[el].routes.push(item);
      }
    }
    //console.log(JSON.stringify(nodes));
  }
  function findUniques() {
    for (key in lines) {
      for(item in lines[key]) {
        var ids = {
          "links": {
            "common": new Array,
            "unique": new Object
          },
          "stops": {
            "common": new Array,
            "unique": new Object
          }
        };
        for(direction in lines[key][item].line) {
          ids.links.unique[direction] = new Array;
          lines[key][item].line[direction].links.forEach(function (a) {
            var unique = true;
            for(d in ids.links.unique) {
              for(var i = 0; i < ids.links.unique[d].length; i++) {
                if(a == ids.links.unique[d][i]) {
                  unique = false;
                  ids.links.unique[d] = dropElement(ids.links.unique[d], i);
                  ids.links.common.push(a);
                  i = ids.links.unique[d].length;
                }
              }
            }
            ids.links.common.forEach(function (b, i) {  a == b ? unique = false : null  })
            if(unique) {
              ids.links.unique[direction].push(a);
            }
          })
          ids.stops.unique[direction] = new Array;
          if(lines[key][item].line[direction].stops == undefined) {
            lines[key][item].line[direction].stops = new Array;
          }
          lines[key][item].line[direction].stops.forEach(function (a) {
            var unique = true;
            for(d in ids.stops.unique) {
              for(var i = 0; i < ids.stops.unique[d].length; i++) {
                if(a == ids.stops.unique[d][i]) {
                  unique = false;
                  ids.stops.unique[d] = dropElement(ids.stops.unique[d], i);
                  ids.stops.common.push(a);
                  i = ids.stops.unique[d].length;
                }
              }
            }
            ids.stops.common.forEach(function (b, i) {  a == b ? unique = false : null  })
            if(unique) {
              ids.stops.unique[direction].push(a);
            }
          })
          function dropElement(o, i) {
            o = o.slice(0, i).concat(o.slice(i + 1, o.length));
            return o;
          }
        }
        //console.log(ids);
        lines[key][item].ids = ids;
      }
    }
  }
  function editRoutes() {
    var keys = new Array;
    var c = 0;
    var selected = {
      "line": true,
      "type": {
        "true": "link",
        "false": "stop"
      },
      "name": {
        "true": "link",
        "false": "node"
      },
      "id": null
    }
    for (key in lines) {
      for(item in lines[key]) {
        var type = "line";
        for(direction in lines[key][item][type]) {
          keys[c] = new Object;
          keys[c].key = key;
          keys[c].item = item;
          keys[c].type = type;
          keys[c].dir = direction;
          //lines[key][item][type][direction];
          c++;
          //console.log(lines[key][item][type][direction]);
        }
      }
    }
    c = 0;
    highlightRoute();
    d3.select("body")
    .on("keydown", function() {
      // console.log(d3.event.keyCode);
      switch (d3.event.keyCode) {
        case 33:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          for(var i = 0; i < line.sequence.length; i++) {
            if(line.sequence[i].id == selected.id && line.sequence[i].type == selected.type[selected.line]) {
              i = Math.max(i - 1, 0);
              line.sequence[i].type == "link" ? selected.line = true : selected.line = false
              selected.id = line.sequence[i].id;
              i = line.sequence.length;
            }
          }
          highlightRoute();
          break;
        case 34:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          for(var i = 0; i < line.sequence.length; i++) {
            if(line.sequence[i].id == selected.id && line.sequence[i].type == selected.type[selected.line]) {
              i = Math.min(i + 1, line.sequence.length - 1);
              line.sequence[i].type == "link" ? selected.line = true : selected.line = false
              selected.id = line.sequence[i].id;
              i = line.sequence.length;
            }
          }
          highlightRoute();
          break;
        case 66:
          var check = confirm("Востановить исходное состояние?");
          if(check) {
            lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir] = backup;
            highlightRoute();
          }
          break;
        case 79:
          c = Math.max(c - 1, 0);
          backup = Object.assign({}, lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir]);
          //backup = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          highlightRoute();
          break;
        case 76:
          c = Math.min(c + 1, keys.length - 1);
          backup = Object.assign({}, lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir]);
          //backup = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          highlightRoute();
          break;
        case 80:
          console.log(JSON.stringify(lines));
          break;
        case 65:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          var b = false;
          var n = 0;
          line.sequence.forEach(function (el, i) {
            if(el.id == selected.id && el.type == selected.type[selected.line]) {
              b = true;
              n = i;
            }
          })
          if(b) {
            var el = line.sequence[n];
            line.sequence = line.sequence = line.sequence.slice(0, n).concat(line.sequence.slice(n + 1, line.sequence.length));
            line.sequence.push(el);
            line = makeMap(line);
            lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir] = line;
            highlightRoute();
          }
          break;
        case 81:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          var b = false;
          var n = 0;
          line.sequence.forEach(function (el, i) {
            if(el.id == selected.id && el.type == selected.type[selected.line]) {
              b = true;
              n = i;
            }
          })
          if(b) {
            var el = line.sequence[n];
            line.sequence = line.sequence = line.sequence.slice(0, n).concat(line.sequence.slice(n + 1, line.sequence.length));
            line.sequence.unshift(el);
            line = makeMap(line);
            lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir] = line;
            highlightRoute();
          }
          break;
        case 87:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          var b = false;
          var n = 0;
          line.sequence.forEach(function (el, i) {
            if(el.id == selected.id && el.type == selected.type[selected.line]) {
              b = true;
              n = i;
            }
          })
          if(b) {
            line.sequence = moveSelection(line.sequence, n, n - 1);
            line = makeMap(line);
            lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir] = line;
            highlightRoute();
          }
          break;
        case 83:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          var b = false;
          var n = 0;
          line.sequence.forEach(function (el, i) {
            if(el.id == selected.id && el.type == selected.type[selected.line]) {
              b = true;
              n = i;
            }
          })
          if(b) {
            line.sequence = moveSelection(line.sequence, n, n + 1);
            line = makeMap(line);
            lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir] = line;
            highlightRoute();
          }
          break;
        case 45:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          var b = true;
          line.sequence.forEach(function (el, i) {
            if(el.id == selected.id && el.type == selected.type[selected.line]) {
              b = false
            }
          })
          if(b) {
            var check = confirm("Добавить?");
            if(check) {
              //console.log(line);
              line.sequence = line.sequence.concat([{
                "id": parseInt(selected.id),
                "type": selected.type[selected.line],
              }]);
              var nest = d3.nest()
                .key(function(d) { return d.type; })
                .rollup(function(v) {
                for(var i = 0; i < v.length; i++) {
                  v[i] = v[i].id;
                }
                return v;
                })
                .map(line.sequence);
              line.links = nest.link;
              line.stops = nest.stop;
              lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir] = line;
              //console.log(line);
              highlightRoute();
            }
          }
          break;
        case 46:
          var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
          line.sequence.forEach(function (el, i) {
            if(el.id == selected.id && el.type == selected.type[selected.line]) {
              var check = confirm("Удалить?");
              if(check) {
                //console.log(line);
                line.sequence = line.sequence.slice(0, i).concat(line.sequence.slice(i + 1, line.sequence.length));
                var nest = d3.nest()
                  .key(function(d) { return d.type; })
                  .rollup(function(v) {
                  for(var i = 0; i < v.length; i++) {
                    v[i] = v[i].id;
                  }
                  return v;
                  })
                  .map(line.sequence);
                line.links = nest.link;
                line.stops = nest.stop;
                lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir] = line;
                //console.log(line);
                highlightRoute();
              }
            }
          })
          break;
      }
      function moveSelection(a, n, i) {
        i = Math.max(0, Math.min(a.length - 1, i));
        var el1 = a[n];
        var el2 = a[i];
        a[n] = el2;
        a[i] = el1;
        return a;
      }
      function makeMap(el) {
        var nest = d3.nest()
          .key(function(d) { return d.type; })
          .rollup(function(v) {
          for(var i = 0; i < v.length; i++) {
            v[i] = v[i].id;
          }
          return v;
          })
          .map(el.sequence);
        el.links = nest.link;
        el.stops = nest.stop;
        return el;
      }
    })

    function highlightRoute() {
      d3.selectAll(".link").style("stroke", null).style("stroke-width", null);
      d3.selectAll(".node").style("fill", null).style("stroke", null);
      d3.select("#stopSequence").remove();
      d3.select("h1").remove();
      d3.select("ul").remove();
      var line = lines[keys[c].key][keys[c].item][keys[c].type][keys[c].dir];
      var lineScale = d3.scale.linear().range(["red", "blue", "green", "yellow"]).domain([0, line.links.length * 0.333, line.links.length  * 0.666, line.links.length]);
      line.links.forEach(function (d, i) {
        d3.select("#link_" + d).style("stroke", lineScale(i)).each(function(){
          this.parentNode.appendChild(this);
        });
      })
      var polyline = "";
      if(line.stops != null) {
        //var circleScale = d3.scale.linear().range(["red", "blue", "green"]).domain([0, line.stops.length / 2, line.stops.length]);
        line.stops.forEach(function (d, i) {
          d3.select("#node_" + d)
            .style("fill", "none")
            .style("stroke", "black")
            //.style("fill", circleScale(i))
            //.style("stroke", "white")
          polyline = polyline + d3.select("#node_" + d).attr("cx") + "," + d3.select("#node_" + d).attr("cy") + " ";
        })
        svg.append("polyline")
          .attr("id", "stopSequence")
          .attr("points", polyline)
          .style("fill", "none")
          .style("stroke", "black")
          .style("stroke-width", "2px")
          .style("pointer-events", "none")
          .style("stroke-dasharray", "5,5");
      }
      d3.select("#sidebar")
        .append("h1")
        .text("#" + keys[c].item + keys[c].dir + " (" + keys[c].key + ")")
        .style("font-weight", 700)
        .style("margin-left", "10px");

      d3.select("#sidebar")
        .append("ul")
        .selectAll("li")
        .data(line.sequence)
          .enter()
          .append("li")
          .attr("class", function (d) { return d.type == "link" ? "square" : "cirlce" })
          .text(function (d) {  return d.type + " " + d.id; })
          .style("background-color", function (d) {
            return d.type == selected.type[selected.line] && d.id == selected.id ? "yellow" : "white"
          })

      if(selected.line) {
        d3.select("#link_" + selected.id).style("stroke-width", "14px");
      } else {
        //console.log("node_" + selected.id);
        d3.select("#node_" + selected.id).style("stroke", "black").style("fill", "black");
      }
      d3.selectAll("li").on("click", function () {
        var id = d3.select(this).text().split(" ");
        id[0] == "link" ? selected.line = true : selected.line = false
        if(selected.id != id[1]) {
          selected.id = id[1];
        } else {
          selected.id = null;
        }
        highlightRoute();
      })
    }
    d3.selectAll(".node").on("click", function () {
      selected.line = false;
      var id = d3.select(this).attr("id").split("_");
      if(selected.id != id[1]) {
        selected.id = id[1];
      } else {
        selected.id = null;
      }
      highlightRoute();
    })
    d3.selectAll(".link").on("click", function () {
      selected.line = true;
      var id = d3.select(this).attr("id").split("_");
      if(selected.id != id[1]) {
        selected.id = id[1];
      } else {
        selected.id = null;
      }
      highlightRoute();
    })
  }
}

function addFPSCounter() {
  var h = 30;
  var w = h * 4;
  var time0, time1;
  var fps = d3.select("body").append("div")
    .attr("id", "fpsCounter")
    .style("background-color", "black")
    .style("position", "absolute")
    .style("padding", "10px")
    //.style("width", "100%")
    //.style("height", "40px")
    //.style("text-align", "center")
    .style("margin-top", "50%")
    .style("margin-left", "90%")
    //.style("color", "white")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      //.style("background", "white")

  fps.append("text")
    .attr("id", "fpsNum")
    .attr("x", h * 3 + h / 2)
    .attr("y", h / 2 + 1)
    .style("fill", "white")
    .style("text-anchor", "middle")
    .style("font-size", 16)
    .text("60");

  fps.append("text")
    .attr("x", h * 3 + h / 2)
    .attr("y", h - 2)
    .style("fill", "white")
    .style("text-anchor", "middle")
    .text("fps");
  var l = 30;
  var data = new Array;
  for(var i = 0; i < l; i++) {  data[i] = 0; }
  var lp = 5;
  var dataPoint = new Array;
  for(var i = 0; i < lp; i++) {  dataPoint[i] = 0; }
  var x = d3.scale.linear().range([0, h * 3]).domain([0, l]);
  var y = d3.scale.linear().range([h - 1, 1]).domain([0, 60]).clamp(true);
  var scale = d3.svg.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d); });

  var line = fps.append("path")
    .attr("d", scale(data))
    .style("fill", "none")
    .style("stroke", "white")
    .style("stroke-width", "1px");
  data.splice(0, 1);
  var c = 0;
  d3.timer(function() {
    dataPoint.splice(0, 1);
    //line.attr("d", scale(data));
    //console.log(data);
    time1 = Date.now();
    dataPoint[dataPoint.length] = Math.round(1000 / (time1 - time0));
    // if(c != 3) {
    //   c++;
    // } else {
    //   data.splice(0, 1);
    //   data[data.length] = d3.mean(dataPoint);
    //   line.attr("d", scale(data));
    //   fps.select("text#fpsNum").text(parseInt(d3.mean(dataPoint)));
    //   c = 0;
    // }
    data.splice(0, 1);
    data[data.length] = d3.mean(dataPoint);
    line.attr("d", scale(data));
    //fps.select("text#fpsNum").text(parseInt(d3.mean(dataPoint)));
    fps.select("text#fpsNum").text(parseInt(d3.min(dataPoint)));
    time0 = time1;
  });
}

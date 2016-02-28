var langN;
var lang;
switch (navigator.language) {
  case "uk":
    lang = "ua";
    langN = 0;
    break;
  case "uk-UA":
    lang = "ua";
    langN = 0;
    break;
  case "ru":
    lang = "ru"
    langN = 1;
    break;
  case "ru-RU":
    lang = "ru"
    langN = 1;
    break;
  default:
    lang = "en";
    langN = 2;
}
var width = window.innerWidth;
var height = window.innerHeight;
var svg = d3.select("div#graphic").append("svg")
  .attr("width", 100)
  .attr("height", 100)
  .style("background", colors.ground)
  .style("cursor", "default")
var pinchActive = false;
var collapsePanel = new CollapsePanel;
collapsePanel.start();
changeHTMLLang(1);
moveLangSelected(0);
d3.select("div#collapseButton").text(local.html.loading[lang]);

width = window.innerWidth;
height = window.innerHeight;
svg.attr("width", width)
  .attr("height", height)

queue()
  .defer(d3.json, "data/data.geojson")
  .defer(d3.json, "data/bbox.geojson")
  .defer(d3.json, "data/basemap.json")
  .await(function(error, data, bbox, basemap) {
    var zoom = {
      active : "minZoom",
      minZoom : 1,
      maxZoom : 2
    }
    var pathPoints, oldPathPoints, ticks, changeRoom, yAxis, bins;
    var popups = new Array;
    var filter = null;
    var controllerAngle = {left: 0, right: 0};
    var bubbles = {
      master: d3.selection(),
      full: {
        visible: d3.selection(),
        hidden: d3.selection()
      },
      null: {
        visible: d3.selection(),
        hidden: d3.selection()
      }
    };
    var map = svg.append("g").attr("id", "map");
    svg.append("g").attr("id", "popups");
    svg.append("g").attr("id", "bins");
    map.append("g").attr("id", "basemap");
    map.append("g").attr("id", "bubbles");
    map.append("g").attr("id", "foreground");
    var projection = d3.geo.mercator()
      .scale(160000)
      .center(function () {
        var nw = bbox.features[0].geometry.coordinates[0][0];
        var se = bbox.features[0].geometry.coordinates[0][2];
        var a = [];
        a[0] = (se[0] - nw[0]) / 2 + nw[0];
        a[1] = (nw[1] - se[1]) / 2 + se[1];
        return a;
      }())
      .translate([width / 2, height / 2]);
    var geoPath = d3.geo.path().projection(projection);
    var hexWidth = function () {
      for(var i = 1; i < data.features.length; i++) {
        if(data.features[i].properties.HEXid - data.features[i - 1].properties.HEXid == 1) {
          return (projection(data.features[i].geometry.coordinates)[1] - projection(data.features[i - 1].geometry.coordinates)[1]) * -1;
    }}}();
    // circleSize = d3.scale.sqrt().domain([0, 11000000]).range([0, hexWidth / 2]);
    var circleSize = function(x) {
      var max = [10000000, 10000000, 12000000, 14000000];
      var scale = d3.scale.sqrt().domain([0, max[data.room - 1]]).range([0, hexWidth / 2]);
      return scale(x);
    }
    var circleColor = {
      hue : d3.scale.ordinal().domain([0, 1, 2, 3, 4]).range([colors.bluegrey, colors.red, colors.orange, colors.teal, colors.lightblue]),
      tint : [
        d3.scale.ordinal().domain([0, 1, 2, 3, 4, 5, 6]).range(["50", "200", "300", "400", "500", "800", "900"]),
        d3.scale.ordinal().domain([0, 1, 2, 3, 4, 5, 6]).range(["50", "200", "300", "400", "500", "800", "900"]),
        d3.scale.ordinal().domain([0, 1, 2, 3, 4, 5, 6]).range(["50", "200", "300", "400", "500", "800", "900"]),
        d3.scale.ordinal().domain([0, 1, 2, 3, 4, 5, 6]).range(["50", "200", "300", "400", "500", "800", "900"]),
        d3.scale.ordinal().domain([0, 1, 2, 3, 4, 5, 6]).range(["50", "200", "300", "400", "500", "800", "900"])
      ],
      colorTint: function (d, i) {
        var r = [];
        for (var j = 0; j < 7; j++) { r[j] = this.hue(i)[this.tint[i](j)];  }
        var a = [
          [0, 3, 5, 10, 20, 43, 542],
          [0, 3, 4, 6, 10, 19, 141],
          [0, 3, 4, 7, 11, 22, 141],
          [0, 3, 4, 7, 11, 23, 223],
          [0, 3, 4, 6, 10, 24, 117]
        ];
        var color = d3.scale.linear().domain(a[i]).range(r);
        return color(d);
      }
    }
    data.room = 1;
    data.min = 1;
    data.color = "#f44336";
    data.mean = "r1_mean";
    data.count = "r1_count";
    data.filter = { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
    data.features = data.features.sort(function(a, b) { return b.properties.r1_mean - a.properties.r1_mean;});
    data.max = new Array();
    data.min = new Array();
    for (var i = 0; i < 5; i++) {
      data.max[i] = d3.max(data.features, function (el) { return el.properties["r" + i + "_mean"];  });
      data.min[i] = d3.min(data.features, function (el) { return el.properties["r" + i + "_mean"];  });
    }

    bbox.x = projection(bbox.features[0].geometry.coordinates[0][0])[0];
    bbox.y = projection(bbox.features[0].geometry.coordinates[0][0])[1];
    bbox.width = projection(bbox.features[0].geometry.coordinates[0][2])[0] - bbox.x;
    bbox.height = projection(bbox.features[0].geometry.coordinates[0][2])[1] - bbox.y;
    if(width > 488) {
      map.x = width / 1.6 - width / 2;
      map.y = height / 1.35 - height / 2;
    } else {
      map.x = width / 2;
      map.y = height - height / 2;
    }
    map.dx = 0;
    map.dy = 0;

    var roomButtons = d3.selectAll("div.roomButton");
    roomButtons.change = function (i) {
      d3.select(roomButtons[0][i - 1])
        .transition().duration(500).ease("linear")
        .style("background-color", circleColor.hue(i)["500"])
        .styleTween("box-shadow", function() {
          var x = d3.interpolate(0, 1);
          var y = d3.interpolate(0, 4);
          var z = d3.interpolate(0, 2);
          return function(t) {
            return x(t) + "px " + y(t) + "px " + z(t) + "px rgba(0,0,0,.25) inset";
          };
        })

      d3.select(roomButtons[0][data.room - 1])
        .transition().duration(500).ease("linear")
        .style("background-color", "white")
        .styleTween("box-shadow", function() {
          var x = d3.interpolate(1, 0);
          var y = d3.interpolate(4, 0);
          var z = d3.interpolate(2, 0);
          return function(t) {
            return x(t) + "px " + y(t) + "px " + z(t) + "px rgba(0,0,0,.25) inset";
          };
        });
    };

    roomButtons.on("click", function (d, i) {
      i = i + 1;
      if(data.room != i) {
        changeRoom(i);
      }
    })

    var langButtons = d3.selectAll("div.langButton");
    langButtons.on("click", function (d, i) {
      if(langN != i) {
        langN = i;
        changeLang(i);
        moveLangSelected(500);
      }
    })

    d3.selectAll("div.socialButton").on("mouseover", function () {
      if(width > 488) {
        d3.select(this).transition().ease("cubic-out").duration(500)
          .style("background-color", function () {
            return circleColor.hue(data.room)["600"];
          })
      }
    })
    d3.selectAll("div.socialButton").on("mouseout", function () {
      if(width > 488) {
        d3.select(this).transition().ease("cubic-out").duration(500)
          .style("background-color", function () {
            return circleColor.hue(data.room)["500"];
          })
      }
    })
    drawBasemap();
    function drawBasemap() {
      d3.select("g#basemap")
        .data(bbox.features)
        .append("path")
        .attr("id", "background")
        .attr("d", geoPath)
        .style("fill", colors.ground);

      d3.select("g#basemap").append("g")
        .attr("id", "waterLayer")
        .selectAll("path.water")
        .data(basemap.water.features)
        .enter()
        .append("path")
        .attr("clas", "water")
        .attr("d", geoPath)
        .style("fill", colors.water);

      d3.select("g#basemap").append("g")
        .attr("id", "islandsLayer")
        .selectAll("path.islands")
        .data(basemap.islands.features)
        .enter()
        .append("path")
        .attr("class", "islands")
        .attr("d", geoPath)
        .style("fill", colors.ground);

      d3.select("g#basemap").append("g")
        .attr("id", "roadsLayer")
        .selectAll("path.roads")
        .data(basemap.roads.features)
        .enter()
        .append("path")
        .attr("class", "roads")
        .attr("d", geoPath)
        .style("fill", "none")
        .style("stroke", colors.roads)
        .style("stroke-width", function (d) {
          switch (d.properties.class) {
            case 0:
              return 0.5;
              break;
            case 1:
              return 0.5;
              break;
            case 2:
              return 1;
              break;
        }});

      d3.select("g#foreground").append("g")
        .attr("id", "subwayLayer")
        .selectAll("path")
        .data(basemap.subway.features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .style("fill", "none")
        .style("stroke", colors.black)
        .style("stroke-width", 1.5)
        .style("pointer-events", "none")

      d3.select("g#foreground").append("g")
        .attr("id", "stationsLayer")
        .selectAll("path")
        .data(basemap.stations.features)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0]; })
        .attr("cy", function(d) { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1]; })
        .attr("r", 2)
        .style("fill", colors.white)
        .style("stroke", colors.black)
        .style("stroke-width", 1.5)
        .style("pointer-events", "none")

      d3.select("g#foreground").append("g")
        .attr("id", "namesOutlineLayer")
        .selectAll("text")
        .data(basemap.names.features)
        .enter()
        .append("text")
        .attr("class", "namesOutline")
        .each(function (d) {
          var textdata = d.properties["name_" + lang].split(" ")
          d3.select(this).selectAll("tspan")
            .data(textdata)
            .enter()
            .append("tspan")
            .attr("x", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0]; })
            .attr("y", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1]; })
            .attr("dy", function(d, i) { return i * 12; })
            .html(function (t) { return t;  })
        })
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .style("stroke", colors.ground)
        .style("stroke-width", 3)

      d3.select("g#foreground").append("g")
        .attr("id", "namesLayer")
        .selectAll("text")
        .data(basemap.names.features)
        .enter()
        .append("text")
        .attr("class", "names")
        .each(function (d) {
          var textdata = d.properties["name_" + lang].split(" ")
          d3.select(this).selectAll("tspan")
            .data(textdata)
            .enter()
            .append("tspan")
            .attr("x", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0]; })
            .attr("y", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1]; })
            .attr("dy", function(d, i) { return i * 12; })
            .html(function (t) { return t;  })
        })
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .style("fill", colors.black);
    }

    bubbles.master = d3.select("g#bubbles")
      .selectAll("circle.bubble")
      .data(data.features)
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .each(function (d) {  d.properties.filter = false; })
      .each(function (d) {  d.properties.popup = true; })
      .attr("cx", function(d) { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0]; })
      .attr("cy", function(d) { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1]; })
      .attr("r", 0)
      .style("stroke", function (d) { return circleColor.colorTint(d.properties["r" + data.room + "_count"], data.room);  })
      .style("stroke-width", 0)
      .style("cursor", "pointer")

    findVisible();
    function findVisible() {
      var divided = divideSelection(bubbles.master, function (el) {
        var s;
        d3.select(el).each(function (d) {  s = d.properties[data.mean];});
        return s !== null;
      });
      full = divideSelection(divided.true, function (el) {
        var x = parseFloat(d3.select(el).attr("cx")) + map.x;
        var y = parseFloat(d3.select(el).attr("cy")) + map.y;
        var r = parseFloat(d3.select(el).attr("r"));
        return x + r > 0 && x - r < width && y + r > 0 && y - r < height;
      });

      bubbles.full.visible = full.true;
      bubbles.full.hidden = full.false;

      Null = divideSelection(divided.false, function (el) {
        var x = parseFloat(d3.select(el).attr("cx")) + map.x;
        var y = parseFloat(d3.select(el).attr("cy")) + map.y;
        var r = parseFloat(d3.select(el).attr("r"));
        return x + r > 0 && x - r < width && y + r > 0 && y - r < height;
      });
      bubbles.null.visible = Null.true;
      bubbles.null.hidden = Null.false;
    }
    drawBars();
    ticks = new Ticks;
    ticks.addTicks(true);
    transformMap(map.x, map.y, false);
    function zoomed() {
      if (d3.event.deltaY < 0)
      {
        zoom.active == "minZoom" ? transformMap(d3.event.x, d3.event.y, true) : null
      } else {
        zoom.active == "maxZoom" ? transformMap(d3.event.x, d3.event.y, true) : null
      }
    }

    function transformMap(x, y, scaling) {
      if(scaling) {
        if(zoom.active == "minZoom")
        {
          zoom.active = "maxZoom";
          //Zoom to Mouse
          x = (map.x * zoom[zoom.active]) - (x * (zoom[zoom.active] - 1));
          y = (map.y * zoom[zoom.active]) - (y * (zoom[zoom.active] - 1));

        } else {
          x = (map.x + width / 2 * (zoom[zoom.active] - 1)) / zoom[zoom.active];
          y = (map.y + height / 2 * (zoom[zoom.active] - 1)) / zoom[zoom.active];
          zoom.active = "minZoom";
        }
      }
      map.x = Math.max(bbox.width * -zoom[zoom.active] + width  + (bbox.width - width) / 2 * zoom[zoom.active] - width + window.innerWidth, Math.min((bbox.width - width) / 2 * zoom[zoom.active], x))
      map.y = Math.max(bbox.height * -zoom[zoom.active] + height + (bbox.height - height) / 2 * zoom[zoom.active] - height + window.innerHeight, Math.min((bbox.height - height) / 2 * zoom[zoom.active], y));

      if(scaling) {
        map.transition().duration(500).ease("linear")
          .attr("transform", function () { return "translate(" + map.x + "," + map.y + ") scale(" + zoom[zoom.active] + ")"; })
          .each("end", function () {
            visibleBubbles();
        })
        var ratio;
        zoom.active == "minZoom" ? ratio = 1 : ratio = 0.75
        map.select("g#foreground").selectAll("text")
          .transition().duration(500).ease("linear")
          .style("font-size", 12 * ratio)
          .selectAll("tspan")
          .attr("dy", function () {
            var y;
            zoom.active == "minZoom" ? y = d3.select(this).attr("dy") / 0.75 : y = d3.select(this).attr("dy") * 0.75
            return y;
          });

        map.selectAll("path.roads")
          .transition().duration(500).ease("linear")
          .style("stroke-width", function (d) {
            switch (d.properties.class) {
              case 0:
                return 0.5 * ratio;
                break;
              case 1:
                return 0.5 * ratio;
                break;
              case 2:
                return 1 * ratio;
                break;
        }});

        map.select("g#subwayLayer").selectAll("path")
          .transition().duration(500).ease("linear")
          .style("stroke-width", 1.5 * ratio);

        map.select("g#subwayLayer").selectAll("path")
          .transition().duration(500).ease("linear")
          .style("stroke-width", 1.5 * ratio);

        map.select("g#stationsLayer").selectAll("circle")
          .transition().duration(500).ease("linear")
          .attr("r", 2 * ratio)
          .style("stroke-width", 1.5 * ratio);
      } else {
        map.attr("transform", function () { return "translate(" + map.x + "," + map.y + ") scale(" + zoom[zoom.active] + ")"; });
      }
      popups.forEach(function (el, i) {
        if(el != undefined) {
          scaling ? el.changeLineCenter(500) : el.changeLineCenter(0)
        }
      })
    }
    d3.select("g#basemap").style("opacity", 0)
      .transition().ease("cubic-in-out").duration(2500)
      .style("opacity", 1);
    d3.select("g#foreground").style("opacity", 0)
      .transition().ease("cubic-in-out").duration(2500)
      .style("opacity", 1);
    d3.select("g#bins").style("opacity", 0)
      .transition().ease("cubic-in-out").duration(2500)
      .style("opacity", 1);
    bubbles.master
      .each(function () {
        d3.select(this)
        .attr("r", 0)
        .style("fill", colors.ground)
        .transition().ease("cubic-out").duration(2500).delay(0)
        .style("fill", function (d) { return circleColor.colorTint(d.properties["r" + data.room + "_count"], data.room);  })
        .attr("r", function(d) {  return circleSize(d.properties["r" + data.room + "_mean"]); })
      })

    changeColor(2500);
    d3.selectAll("div:first-child .roomButton")
      .transition().duration(2500).ease("linear")
      .style("background-color", data.color)

    function changeLang(i) {
      lang = ["ua", "ru", "en"][i];
      changeHTMLLang(data.room);
      d3.select("div#collapsePanel").select("div").text(local.html.panel[collapsePanel.state][lang])
      d3.selectAll("text.namesOutline")
        .each(function (d) {
          var textdata = d.properties["name_" + lang].split(" ")
          d3.select(this).selectAll("tspan").remove();
          d3.select(this).selectAll("tspan")
            .data(textdata)
            .enter()
            .append("tspan")
            .attr("x", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0]; })
            .attr("y", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1]; })
            .attr("dy", function(d, i) { return i * 12; })
            .html(function (t) { return t;  })
      })
      d3.selectAll("text.names")
        .each(function (d) {
          var textdata = d.properties["name_" + lang].split(" ")
          d3.select(this).selectAll("tspan").remove();
          d3.select(this).selectAll("tspan")
            .data(textdata)
            .enter()
            .append("tspan")
            .attr("x", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0]; })
            .attr("y", function() { return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1]; })
            .attr("dy", function(d, i) { return i * 12; })
            .html(function (t) { return t;  })
      })
      d3.select("g#ticks").remove();
      ticks.addTicks(true);
      popups.forEach(function (el, i) {
        if(el != undefined) {
          el.changePopupLang();
        }
      })
    }
    changeRoom = function(i) {
      roomButtons.change(i);

      data.room = i;
      data.mean = "r" + i + "_mean";
      data.count = "r" + i + "_count";
      changeColor(1500);
      bubbles.master.sort(function(a, b) { return b.properties[data.mean] - a.properties[data.mean];});
      oldPathPoints = pathPoints;
      updateBars();
      ticks.updateTicks(false);
      filter == null ? full2null() : updateFilterController()
      d3.select("div#headline").select("p:nth-child(2)").text(local.html.headline.secondString.variable[lang][data.room - 1] + local.html.headline.secondString.constant[lang]);
      popups.forEach(function (el, i) {
        if(el != undefined) {
          el.changePopupRoom(i - 1);
        }
      })
      function full2null() {
        var v = ["hidden", "visible"];
        for (var i = 0; i < 2; i++) {
          var formerNull = splitAndSort(bubbles.null[v[i]]);
          var formerFull = splitAndSort(bubbles.full[v[i]]);
          bubbles.full[v[i]] = joinSelections([formerNull.true, formerFull.true]);
          bubbles.null[v[i]][0] = formerNull.false[0].concat(formerFull.false[0]);

          animatons[v[i]].nullToFill(formerNull.true, 2000);
          animatons[v[i]].fillToNull(formerFull.false, 2000);
          animatons[v[i]].fill(formerFull.true, 2000);
        }
        function joinSelections(a) {
          var selection = d3.select(null);
          selection[0] = new Array;
          var counter = new Array;
          var price = new Array;

          for(var i = 0; i < a.length; i++) {
            counter[i] = 0;
            price[i] = getPrice(a[i][0][counter[i]]);
          }
          while(statement(price)) {
            var c = findMax(price);
            selection[0].push(a[c][0][counter[c]]);
            counter[c]++
            price[c] = getPrice(a[c][0][counter[c]]);
          }
          return selection;

          function statement(a) {
            var b = false;
            for(var i = 0; i < a.length; i++) {
              a[i] != null ? b = true : null
            }
            return b;
          }
          function getPrice(o) {
            var price = null;
            d3.select(o).each(function (d) {  price = d.properties[data.mean] });
            return price;
          }
          function findMax(a) {
            var max = 0;
            for(var i = 1; i < a.length; i++) {
              a[max] < a[i] ? max = i : null
            }
            return max;
          }
        }
        function splitAndSort(o) {
          var selection = divideSelection(o, function (el) {
            var s;
            d3.select(el).each(function (d) {  s = d.properties[data.mean];});
            return s != null;
          });
          selection.true.sort(function(a, b) { return b.properties[data.mean] - a.properties[data.mean];});
          return selection;
        }
      }
    }

    function changeColor(t) {
      data.pColor = data.color;
      data.color = circleColor.hue(data.room)["500"];

      if(width > 488) {
        d3.selectAll("div.socialButton")
          .transition().duration(t).ease("cubic-out")
          .style("background-color", data.color)
          .style("border-color", data.color)
      } else {
        d3.selectAll("div.socialButton")
          .transition().duration(t).ease("cubic-out")
          .style("border-color", data.color)

        d3.selectAll(".social")
          .transition().duration(t).ease("cubic-out")
          .style("fill", data.color)
      }

      d3.selectAll("circle.mapKeyCircle")
        .transition().duration(t).ease("cubic-out")
        .style("fill", data.color)
      d3.select("div#langSelected")
        .transition().duration(t).ease("cubic-out")
        .style("background-color", data.color)
      d3.select("rect#brush")
        .transition().ease("cubic-out").duration(t)
        .style("fill", data.color)
      d3.select("line#leftLine")
        .transition().ease("cubic-out").duration(t)
        .style("stroke", data.color)
      d3.select("g#leftController").selectAll("rect")
        .transition().ease("cubic-out").duration(t)
        .style("fill", data.color)
      d3.select("g#leftController").selectAll("circle")
        .transition().ease("cubic-out").duration(t)
        .style("fill", data.color)
      d3.select("line#rightLine")
        .transition().ease("cubic-out").duration(t)
        .style("stroke", data.color)
      d3.select("g#rightController").selectAll("rect")
        .transition().ease("cubic-out").duration(t)
        .style("fill", data.color)
      d3.select("g#rightController").selectAll("circle")
        .transition().ease("cubic-out").duration(t)
        .style("fill", data.color)

      d3.selectAll("meta")
        .each(function () {
          if(d3.select(this).attr("name") == "theme-color") {
            d3.select(this).transition().ease("cubic-out").duration(t)
              .attr("content", data.color);
          }
        })

    }

    var drag = d3.behavior.drag()
      .on("dragend", function () {
        if(!pinchActive) {
          visibleBubbles();
        }
      })
      .on("drag", function() {
        if(!pinchActive) {
          map.dx = d3.event.dx;
          map.dy = d3.event.dy;
          transformMap(map.x + d3.event.dx, map.y + d3.event.dy, false);
        }
      });
    d3.select("g#map").call(drag)
      .on("mousewheel", function() {zoomed();})
    var mc = new Hammer(map.node());
    mc.on("pinchstart", function() {  pinchActive = true;  })
      .on("pinchend", function() {  pinchActive = false;  })
      .on("pinchout", function (ev) {
        zoom.active == "minZoom" ? transformMap(ev.pointers[0].clientX, ev.pointers[0].clientY, true) : null
      })
      .on("pinchin", function (ev) {
        zoom.active == "maxZoom" ? transformMap(ev.pointers[0].clientX, ev.pointers[0].clientY, true) : null
      })
    mc.get("pinch").set({ enable: true });

    window.onresize = function() {
      d3.select("div#collapsePanel")
        .style("top", null)
        .style("left", null)
        .style("width", null)
        .style("height", null)

      svg.attr("width", 0)
        .attr("height", 0);

      width = window.innerWidth;
      height = window.innerHeight;

      svg.attr("width", width)
        .attr("height", height);
      collapsePanel.resize();
      if(collapsePanel.state && width > 488) {
        collapsePanel.changeState(false, 0)
      }
      if(collapsePanel.state && width <= 488) {
        collapsePanel.changeState(true, 0)
      }
      visibleBubbles();
      redrawBars();
      moveLangSelected(0);
      if(width > 488) {
        d3.selectAll(".social").style("fill", null);
        d3.selectAll("div.socialButton").style("background-color", data.color);
      } else {
        d3.selectAll(".social").style("fill", data.color);
        d3.selectAll("div.socialButton").style("background-color", null);
      }
    }

    function visibleBubbles() {
      bubbles.full.visible[0] = bubbles.full.visible[0].concat(bubbles.full.hidden[0]);
      bubbles.full.visible.sort(function(a, b) { return b.properties[data.mean] - a.properties[data.mean];});
      var divided = divideSelection(bubbles.full.visible, function (el) {
        var x = parseFloat(d3.select(el).attr("cx")) * zoom[zoom.active] + map.x;
        var y = parseFloat(d3.select(el).attr("cy")) * zoom[zoom.active] + map.y;
        var r = parseFloat(d3.select(el).attr("r")) * zoom[zoom.active];
        return x + r > 0 && x - r < width && y + r > 0 && y - r < height;
      });
      bubbles.full.visible = divided.true;
      bubbles.full.hidden = divided.false;

      bubbles.null.visible[0] = bubbles.null.visible[0].concat(bubbles.null.hidden[0]);
      divided = divideSelection(bubbles.null.visible, function (el) {
        var x = parseFloat(d3.select(el).attr("cx")) + map.x / zoom[zoom.active];
        var y = parseFloat(d3.select(el).attr("cy")) + map.y / zoom[zoom.active];
        var r = parseFloat(d3.select(el).attr("r")) * zoom[zoom.active];
        return x + r > 0 && x - r < width && y + r > 0 && y - r < height;
      });
      bubbles.null.visible = divided.true;
      bubbles.null.hidden = divided.false;
      if(filter != null) {
        filter.updateVisible();
      }
    }

    function divideSelection(a, statement) {
      var selection = {
        true: d3.select(null),
        false: d3.select(null)
      }
      var i = 0;
      var j = 0;
      a.each(function () {
        if(statement(this)) { selection.true[0][i] = this; i++ }
        else {  selection.false[0][j] = this; j++ }
      });
      return selection;
    }


    function drawBars() {
      data.bins = new Object();
      data.bins.n = 4;
      data.bins.x = 0;
      data.bins.c = 13;
      data.bins.a = new Array();
      width % data.bins.n == 0 ? data.bins.a.length = width / data.bins.n : data.bins.a.length = parseInt(width / data.bins.n) + 1;

      d3.select("g#bins").append("defs").append("clipPath").attr("id", "clipPath")
        .append("path")
        .attr("id", "barMask")
        .datum(data.bins.a);

      bins = d3.select("g#bins")
        .append("g")
        .attr("id", "bars")
        .selectAll("line.bar")
        .data(data.bins.a)
        .enter()
        .append("line")
        .attr("class", "bar")
        .attr("clip-path", "url(#clipPath)")
        .attr("x1", function (d, i) { return i * data.bins.n + data.bins.n / 2;  })
        .attr("x2", function (d, i) { return i * data.bins.n + data.bins.n / 2;  })
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke-width", 1)
        .style("stroke", colors.bars)
        .style("shape-rendering", "crispEdges")

      d3.select("g#bins").append("g").attr("id", "brushContainer")
        .append("rect")
        .attr("id", "brushcontroller")
        .attr("clip-path", "url(#clipPath)")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("opacity", 0)
        .style("cursor", "pointer")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")

      d3.select("g#brushContainer")
        .append("rect")
        .attr("id", "brush")
        .attr("clip-path", "url(#clipPath)")
        .attr("y", 0)
        .attr("height", height)
        .style("fill", data.color)
        .style("cursor", "pointer")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")

      d3.select("g#brushContainer")
        .append("line")
        .attr("id", "rightLine")
        .attr("clip-path", "url(#clipPath)")
        .attr("x0", -10).attr("x1", -10)
        .attr("y0", 0).attr("y1", height)
        .style("cursor", "ew-resize")
        .style("stroke", data.color)
        .style("stroke-width", "5px")

      d3.select("g#brushContainer")
        .append("line")
        .attr("id", "leftLine")
        .attr("clip-path", "url(#clipPath)")
        .attr("x0", -10).attr("x1", -10)
        .attr("y0", 0).attr("y1", height)
        .style("cursor", "ew-resize")
        .style("stroke", data.color)
        .style("stroke-width", "5px")

      d3.select("g#brushContainer").append("g").attr("id", "rightController").attr("cursor", "ew-resize")


      d3.select("g#rightController")
        .append("rect")
        .attr("x", -data.bins.c).attr("y", -data.bins.c)
        .attr("width", data.bins.c).attr("height", data.bins.c)
        .style("stroke", colors.ground)
        .style("stroke-width", 4)

      d3.select("g#rightController")
        .append("circle")
        .attr("r", data.bins.c)
        .attr("cx", -data.bins.c).attr("cy", -data.bins.c)
        .style("stroke", colors.ground)
        .style("stroke-width", 4)

      d3.select("g#rightController")
        .append("rect")
        .attr("x", -data.bins.c).attr("y", -data.bins.c)
        .attr("width", data.bins.c).attr("height", data.bins.c)
        .style("fill", data.color)

      d3.select("g#rightController")
        .append("circle")
        .attr("r", data.bins.c)
        .attr("cx", -data.bins.c).attr("cy", -data.bins.c)
        .style("fill", data.color)

      d3.select("g#rightController")
        .append("g")
        .attr("id", "rightText")
        .attr("transform", "translate(" + -data.bins.c + "," + -data.bins.c + ")")
          .append("text")
          .attr("y", 7.314 / 2)
          .style("fill", "white")
          .style("text-anchor", "middle")
          .style("font-size", "10px")
          .attr("cursor", "ew-resize")

      d3.select("g#brushContainer").append("g").attr("id", "leftController").attr("cursor", "ew-resize")
        .append("rect")
        .attr("x", 0).attr("y", -data.bins.c)
        .attr("width", 15).attr("height", data.bins.c)
        .style("stroke", colors.ground)
        .style("stroke-width", 4)

      d3.select("g#leftController")


      d3.select("g#leftController")
        .append("circle")
        .attr("r", data.bins.c)
        .attr("cx", data.bins.c).attr("cy", -data.bins.c)
        .style("stroke", colors.ground)
        .style("stroke-width", 4)

      d3.select("g#leftController")
        .append("rect")
        .attr("x", 0).attr("y", -data.bins.c)
        .attr("width", 15).attr("height", data.bins.c)
        .style("fill", data.color)

      d3.select("g#leftController")
        .append("circle")
        .attr("r", data.bins.c)
        .attr("cx", data.bins.c).attr("cy", -data.bins.c)
        .style("fill", data.color)

      d3.select("g#leftController")
        .append("g")
        .attr("id", "leftText")
        .attr("transform", "translate(" + data.bins.c + "," + -data.bins.c + ")")
          .append("text")
          .attr("y", 7.314 / 2)
          .style("fill", "white")
          .style("text-anchor", "middle")
          .style("font-size", "10px")
          .attr("cursor", "ew-resize")

      updateBars();
      filterInteraction();
    }

    function redrawBars() {
      data.bins.a = new Array();
      width % data.bins.n == 0 ? data.bins.a.length = width / data.bins.n : data.bins.a.length = parseInt(width / data.bins.n) + 1;

      d3.select("g#bins").selectAll("line").remove();
      bins = d3.select("g#bars").selectAll("line.bar")
        .data(data.bins.a)
        .enter()
        .append("line")
        .attr("class", "bar")
        .attr("clip-path", "url(#clipPath)")
        .attr("x1", function (d, i) { return i * data.bins.n + data.bins.n / 2;  })
        .attr("x2", function (d, i) { return i * data.bins.n + data.bins.n / 2;  })
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke-width", 1)
        .style("stroke", colors.bars)
        .style("shape-rendering", "crispEdges")

      d3.select("rect#brushcontroller")
        .attr("width", width)
        .attr("height", height)

      d3.select("line#rightLine")
        .attr("y2", height)
      d3.select("line#leftLine")
        .attr("y2", height)

      d3.select("rect#brush")
        .attr("height", height)

      d3.select("g#bins").select("defs").remove();
      d3.select("g#bins").append("defs").append("clipPath").attr("id", "clipPath")
        .append("path")
        .attr("id", "barMask")
        .datum(data.bins.a);
      d3.select("g#ticks").remove();
      updateBars();
      oldPathPoints = pathPoints;
      ticks.addTicks(true);
      if(filter != null) {
        var price = 0;
        var c = 0;
        while(price < data.filter.min && bins[0][c] != undefined) {
          d3.select(bins[0][c]).each(function (d) {  price = d; });
          c++;
        }
        bins[0][c] != undefined ? data.bins.x0 = parseInt(d3.select(bins[0][c]).attr("x1")) : data.bins.x0 = width
        data.filter.min = price;
        while(price < data.filter.max && bins[0][c] != undefined) {
          d3.select(bins[0][c]).each(function (d) {  price = d; });
          c++;
        }
        bins[0][c] != undefined ? data.bins.x1 = parseInt(d3.select(bins[0][c]).attr("x1")) : data.bins.x1 = width
        data.filter.max = price;
        data.bins.width = data.bins.x1 - data.bins.x0;
        d3.select("rect#brush")
          .attr("height", height)
          .attr("x", data.bins.x0)
          .attr("width", Math.max(0.1, data.bins.width))

        d3.select("g#leftController")
          .attr("transform", controllerPosture(data.bins.x0, yAxis(data.filter.min), 1, true))
          .select("text")
          .text(roundPrice(data.filter.min * local.svg.currency.rate[lang]))

        d3.select("g#rightController")
          .attr("transform", controllerPosture(data.bins.x1, yAxis(data.filter.max), 1, false))
          .select("text")
          .text(roundPrice(data.filter.max * local.svg.currency.rate[lang]))
      }


    }
    function updateBars() {
      yAxis = d3.scale.linear().domain([0, 75000000]).range([height, 0]);
      for (var i = 0; i < data.bins.a.length; i++) {
        data.bins.a[i] = {
          prices: 0,
          counts: 0
        }
      }
      var binsData = data.features.filter(function(el) { return el.properties[data.mean] != null});
      binsData = binsData.sort(function(a, b) { return a.properties[data.mean] - b.properties[data.mean];});
      data.bins.size = binsData.length / (data.bins.a.length - 2);
      data.bins.a[0].prices = data.min[data.room] - 1;
      data.bins.a[0].counts = 1;
      data.bins.a[data.bins.a.length - 1].prices = data.max[data.room] + 1;
      data.bins.a[data.bins.a.length - 1].counts = 1;
      for (var i = 0; i < binsData.length - 1; i++) {
        var c = (i / data.bins.size - i / data.bins.size % 1) + 1;
        data.bins.a[c].prices = data.bins.a[c].prices + binsData[i].properties[data.mean];
        data.bins.a[c].counts++;
      }
      pathPoints = new Array;
      for(var i = 0; i < data.bins.a.length; i++) {
        data.bins.a[i] = data.bins.a[i].prices / data.bins.a[i].counts;
        pathPoints[i] = [i * data.bins.n + data.bins.n / 2, yAxis(data.bins.a[i])];
      }
      bins.data(data.bins.a)

      if(ticks === undefined) {
        oldPathPoints = new Array;
        for(var i = 0; i < data.bins.a.length; i++) {
          oldPathPoints[i] = [i * data.bins.n + data.bins.n / 2, height];
        }
        d3.select("path#barMask")
          .attr("d", createPath(oldPathPoints, 0, pathPoints.length) + "L" + width + "," + yAxis(data.bins.a[data.bins.a.length - 1]) + "L" + width + "," + height + "L" + 0 + "," + height + "Z");
      }

      d3.select("path#barMask")
        .transition().ease("cubic-out").duration(1500)
        .attr("d", createPath(pathPoints, 0, pathPoints.length) + "L" + width + "," + yAxis(data.bins.a[data.bins.a.length - 1]) + "L" + width + "," + height + "L" + 0 + "," + height + "Z");

      function createPath(a, x0, x1) {
        var s = new Array;
        for (var i = x0; i < x1; i++) {
          s[i] = a[i].join(",");
        }
        s = s.join("L");
        s = "M" + s;
        return s;
      }
    }

    function Ticks() {
      var ticks;
      var ticksValues =  {
        "ua": {
          value: [1, 2, 3, 5, 10, 15],
          max: [3, 5, 5, 25]
        },
        "ru": {
          value: [3, 5, 10, 15, 30, 50],
          max: [10, 15, 15, 50]
        },
        "en": {
          value: [30, 50, 100, 150, 250, 500],
          max: [100, 150, 250, 500]
        }
      }
      for(var i in ticksValues) {
        ticksValues[i].value.forEach(function (n, j) {
          ticksValues[i].value[j] = n / local.svg.currency.rate[i];
        })
        ticksValues[i].max.forEach(function (n, j) {
          ticksValues[i].max[j] = n / local.svg.currency.rate[i];
        })
      }
      var tickIndex = new Array;
      this.addTicks = function(firstRun) {
        ticks = d3.select("g#bins").insert("g", ":first-child").attr("id", "ticks")
          .selectAll("map.tick")
          .data(ticksValues[lang].value)
          .enter()
          .append("g")
          .attr("class", "tick")
          .attr("transform", function (d) { return "translate(" + pathPoints[pathPoints.length - 1][0] + "," + yAxis(d * 1000000) + ")"; })
          .style("opacity", 0)

        ticks.append("line")
            .attr("x1", 0)
            .attr("y1", 1)
            .attr("x2", 0)
            .attr("y2", -10)
            .style("stroke-width", 1)
            .style("stroke", colors.bars)
            .style("shape-rendering", "crispEdges");

          ticks.append("text")
            .attr("x", 0)
            .attr("y", -data.bins.c)
            .style("fill", colors.bars)
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .style("cursor", "default")
            .text(function (d) {  return local.svg.currency.symbol[lang] + (d * local.svg.currency.rate[lang]) + local.svg.currency.units[lang];  });

          this.updateTicks(firstRun);
      }
      this.updateTicks = function(firstRun) {
        findTickIndex();
        ticks.each(function (d, i) {
          if(firstRun) {
            d3.select(this).attr("transform", "translate(" + pathPoints[tickIndex[i]][0] + "," + pathPoints[tickIndex[i]][1] + ")")
              .style("opacity", function (d, i) {
                var n;
                d > ticksValues[lang].max[data.room - 1] ? n = 0 : n = 1
                return n;
              });
          } else {
            d3.select(this).transition().ease("cubic-out").duration(1500)
              .attrTween("transform", moveTickAlongPath(this, i))
              .style("opacity", function (d, i) {
                var n;
                d > ticksValues[lang].max[data.room - 1] ? n = 0 : n = 1
                return n;
              });
          }
        })

      }
      this.changeTicksLang = function () {
        ticks.selectAll("text")
          .text(function (d) {  return local.svg.currency.symbol[lang] + d + local.svg.currency.units[lang];  });
      }
      function moveTickAlongPath(node, c) {
        var transform = d3.transform(d3.select(node).attr("transform"))
        var i0 = parseInt((transform.translate[0] - data.bins.n / 2) / data.bins.n)
        var i1 = tickIndex[c];
        return function() {
          var i = d3.interpolateRound(i0, i1);
          return function(t) {
            var iY = d3.interpolateNumber(oldPathPoints[i(t)][1], pathPoints[i(t)][1]);
            transform.translate = [pathPoints[i(t)][0], iY(t)];
            return transform.toString();
          }
        }
      }
      function findTickIndex() {
        var c = 0;
        var price = 0;
        for(var i = 0; i < ticksValues[lang].value.length; i++) {
          while(price < ticksValues[lang].value[i] * 1000000 && bins[0][c] != undefined) {
            c++;
            d3.select(bins[0][c]).each(function (d) {  price = d; });
          }
          if(bins[0][c] != undefined) {
            tickIndex[i] = c;
          } else {
            tickIndex[i] = pathPoints.length - 1;
          }
        }
      }
    }

    function updateFilterController() {
      var i = 0;
      var price;
      var x0, x1;
      d3.select(bins[0][i]).each(function (d) {  price = d; });
      while(price < data.filter.min && bins[0][i] != undefined) {
        i++;
        d3.select(bins[0][i]).each(function (d) {  price = d; });
      }
      bins[0][i] != undefined ? data.bins.x0 = parseInt(d3.select(bins[0][i]).attr("x1")) : data.bins.x0 = width

      while(price < data.filter.max && bins[0][i] != undefined) {
        i++;
        d3.select(bins[0][i]).each(function (d) {  price = d; });
      }
      bins[0][i] != undefined ? data.bins.x1 = parseInt(d3.select(bins[0][i]).attr("x1")) : data.bins.x1 = width

      filter.roomUpdate(data.bins.x1 - (data.bins.x1 - data.bins.x0) / 2);
      data.bins.width = data.bins.x1 - data.bins.x0;
      d3.select("rect#brush")
        .transition().ease("cubic-out").duration(1500)
        .attr("x", data.bins.x0)
        .attr("width", Math.max(0.1, data.bins.width))
        .style("fill", data.color)

      d3.select("g#leftController")
        .transition().ease("cubic-out").duration(1500)
        .attrTween("transform", moveController(d3.select("g#leftController"), data.bins.x0, true))
        .select("text")
        .text(roundPrice(data.filter.min * local.svg.currency.rate[lang]))

      d3.select("g#rightController")
        .transition().ease("cubic-out").duration(1500)
        .attrTween("transform", moveController(d3.select("g#rightController"), data.bins.x1, false))
        .select("text")
        .text(roundPrice(data.filter.max * local.svg.currency.rate[lang]))

      d3.select("line#leftLine")
        .transition().ease("cubic-out").duration(1500)
        .attr("x1", data.bins.x0).attr("x2", data.bins.x0)
        .style("stroke", data.color)

      d3.select("line#rightLine")
        .transition().ease("cubic-out").duration(1500)
        .attr("x1", data.bins.x1).attr("x2", data.bins.x1)
        .style("stroke", data.color)

      popups.forEach(function (el, i) {
        if(el != undefined) {
          el.filterPopup();
        }
      })

      function moveController(o, x1, left) {
        var transform = d3.transform(o.attr("transform"))
        var s0 = transform.scale[0]
        var x0 = transform.translate[0]
        var i0 = Math.min(pathPoints.length - 1, Math.max(0, parseInt(x0 / data.bins.n)));
        var i1 = Math.min(pathPoints.length - 1, Math.max(0, parseInt(x1 / data.bins.n)));
        return function() {
          var iX = d3.interpolateRound(x0, x1);
          var iI = d3.interpolateRound(i0, i1);
          var i = d3.interpolateRound(i0, i1);
          return function(t) {
            var iY = d3.interpolateNumber(oldPathPoints[i(t)][1], pathPoints[i(t)][1]);
            return controllerPosture(iX(t), iY(t), 1, left);
          };
        };
      }
    }

    function filterInteraction() {
      d3.select("rect#brushcontroller").on("click", function () {
        var firstRun = false;
        var delay = 0;
        if(filter === null) {
          data.bins.width = width / 4;
          d3.select("rect#brush")
            .attr("x", d3.event.x)
            .attr("width", 0)
            .style("stroke-width", 3)

          d3.select("line#leftLine")
            .attr("x1", d3.event.x).attr("x2", d3.event.x)

          d3.select("line#rightLine")
            .attr("x1", d3.event.x).attr("x2", d3.event.x)
          firstRun = true;
          delay = 300;
        }
        data.bins.x0 = x0(d3.event.clientX - data.bins.width / 2);
        data.bins.x1 = x1(d3.event.clientX + data.bins.width / 2);
        data.bins.width = data.bins.x1 - data.bins.x0;
        updateFilterValues();

        d3.select("rect#brush")
          .transition().ease("cubic-out").duration(500)
          .attr("x", data.bins.x0)
          .attr("width", Math.max(0.1, data.bins.width))

        if(firstRun) {
            d3.select("g#leftController")
              .attr("transform", controllerPosture(data.bins.x0, yAxis(data.filter.min), 0, true))
              .style("opacity", 1)

            d3.select("g#rightController")
              .attr("transform", controllerPosture(data.bins.x1, yAxis(data.filter.max), 0, false))
              .style("opacity", 1)
        }
        d3.select("g#leftController")
          .transition().ease("cubic-out").delay(delay).duration(500)
          .attrTween("transform", moveControllerAlongPath(d3.select("g#leftController"), data.bins.x0, 1, true))
          .select("text")
          .text(roundPrice(data.filter.min * local.svg.currency.rate[lang]))

        d3.select("g#rightController")
          .transition().ease("cubic-out").delay(delay).duration(500)
          .attrTween("transform", moveControllerAlongPath(d3.select("g#rightController"), data.bins.x1, 1, false))
          .select("text")
          .text(roundPrice(data.filter.max * local.svg.currency.rate[lang]))

        d3.select("line#leftLine")
          .transition().ease("cubic-out").duration(500)
          .attr("x1", data.bins.x0).attr("x2", data.bins.x0)

        d3.select("line#rightLine")
          .transition().ease("cubic-out").duration(500)
          .attr("x1", data.bins.x1).attr("x2", data.bins.x1)

        function x0(x) {  return Math.max(0, Math.min(width - data.bins.width, x)); }
        function x1(x) {  return Math.max(data.bins.width, Math.min(width, x)); }
      })

      var dragBrush = d3.behavior.drag().on("drag", function () {
        data.bins.x0 = x0(data.bins.x0 + d3.event.dx);
        data.bins.x1 = x1(data.bins.x1 + d3.event.dx);
        data.bins.width = data.bins.x1 - data.bins.x0;
        updateFilterValues();
        redrawContollers();
        function x0(x) {  return Math.max(0, Math.min(width - data.bins.width, x)); }
        function x1(x) {  return Math.max(data.bins.width, Math.min(width, x)); }
      })
      d3.select("rect#brush").call(dragBrush);

      var left;
      var dragController = d3.behavior.drag()
        .on("dragstart", function () {  d3.select(this).attr("id").search("left") == 0 ? left = true : left = false })
        .on("drag", function () {
        if(left) {
          data.bins.x0 + d3.event.dx > data.bins.x1 ? left = false : null
        } else {
          data.bins.x1 + d3.event.dx < data.bins.x0 ? left = true : null
        }
        updateX(left);
        data.bins.width = data.bins.x1 - data.bins.x0;
        updateFilterValues();
        var o;
        left ? o = d3.select("g#leftController") : o = d3.select("g#rightController")
        o.each(function(){  this.parentNode.appendChild(this);  });
        redrawContollers()
        function updateX(b) {
          b ? data.bins.x0 = getX(data.bins.x0 + d3.event.dx) : data.bins.x1 = getX(data.bins.x1 + d3.event.dx)
        }
        function getX(x) {
          return Math.max(0, Math.min(width, x));
        }
      })
      d3.select("g#leftController").call(dragController);
      d3.select("g#rightController").call(dragController);
      d3.select("line#leftLine").call(dragController);
      d3.select("line#rightLine").call(dragController);
      d3.select("rect#brush").on("click", function () {
        if(!d3.event.defaultPrevented) {
          data.bins.x = (data.bins.x1 - data.bins.x0) / 2 + data.bins.x0;
          filter.deleteFilter();
          d3.select("rect#brush")
            .transition().ease("cubic-out").duration(500)
            .attr("x", data.bins.x)
            .attr("width", 0)
            .style("stroke-width", 0)
            .each("end", function () { d3.select(this).attr("x", 0); })

          d3.select("line#leftLine")
            .transition().ease("cubic-out").duration(500)
            .attr("x1", data.bins.x).attr("x2", data.bins.x)
            .each("end", function () {
              d3.select(this).attr("x1", -20).attr("x2", -20)
            })

          d3.select("line#rightLine")
            .transition().ease("cubic-out").duration(500)
            .attr("x1", data.bins.x).attr("x2", data.bins.x)
            .each("end", function () {
              d3.select(this).attr("x1", -20).attr("x2", -20)
            })

          d3.select("g#leftController")
            .transition().ease("cubic-out").duration(500)
            .attrTween("transform", moveControllerAlongPath(d3.select("g#leftController"), data.bins.x, 0, true))
            .each("end", function () {
              d3.select(this).attr("transform", null)
            })
          d3.select("g#rightController")
            .transition().ease("cubic-out").duration(500)
            .attrTween("transform", moveControllerAlongPath(d3.select("g#rightController"), data.bins.x, 0, false))
            .each("end", function () {
              d3.select(this).attr("transform", null)
              d3.select("div#rightBlock")
                .attr("pointer-events", "auto")
                .transition().ease("cubic-out").duration(500)
                .style("opacity", 1)
            })
          data.bins.x = 0;
          popups.forEach(function (el, i) {
            if(el != undefined) {
              el.filterPopup();
            }
          })
        }
      })

      function redrawContollers() {
        d3.select("rect#brush")
          .attr("x", data.bins.x0)
          .attr("width", Math.max(0.1, data.bins.width))

        d3.select("g#leftController")
          .attr("transform", controllerPosture(data.bins.x0, yAxis(data.filter.min), 1, true))
          .select("text")
          .text(roundPrice(data.filter.min * local.svg.currency.rate[lang]))

        d3.select("g#rightController")
          .attr("transform", controllerPosture(data.bins.x1, yAxis(data.filter.max), 1, false))
          .select("text")
          .text(roundPrice(data.filter.max * local.svg.currency.rate[lang]))

        d3.select("line#leftLine")
          .attr("x1", data.bins.x0).attr("x2", data.bins.x0)

        d3.select("line#rightLine")
          .attr("x1", data.bins.x1).attr("x2", data.bins.x1)
      }
    }

    function controllerPosture(x, y, s, left) {
      x = Math.max(2, Math.min(width - 2, x));
      y = Math.max(2, y - 5);
      var side = getSide(left);
      var o = d3.select("g#" + side + "Controller");
      var transform = d3.transform(o.attr("transform"));
      transform.translate = [x, y];
      transform.scale = [s, s];
      textTransform = d3.transform(o.select("g#" + side + "Text").attr("transform"));
      if(transform.translate[1] < height / 2) {
        var targerAngle;
        left ? targerAngle = -180 : targerAngle = -90
        var rotateScale = d3.scale.linear().domain([height / 2, height / 3]).range([controllerAngle[side], targerAngle]).clamp(true);
        var angle = rotateScale(transform.translate[1]);
        rotateControllers(angle);
      } else {
        if(transform.translate[0] > width - data.bins.c * 2) {
          var targerAngle;
          left ? targerAngle = -90 : targerAngle = 0
          var rotateScale = d3.scale.linear().domain([width - data.bins.c * 2, width - 2]).range([controllerAngle[side], targerAngle]).clamp(true);
          var angle = rotateScale(x);
          rotateControllers(angle);
        } else {
          if(transform.translate[0] < data.bins.c * 2) {
            var targerAngle;
            left ? targerAngle = 0 : targerAngle = 90
            var rotateScale = d3.scale.linear().domain([data.bins.c * 2, 2]).range([controllerAngle[side], targerAngle]).clamp(true);
            var angle = rotateScale(x);
            rotateControllers(angle);
          } else {
            transform.rotate = 0;
            textTransform.rotate = 0;
            if(data.bins.width < data.bins.c * 6) {
              var targerAngle;
              left ? targerAngle = -45 : targerAngle = 45
              var rotateScale = d3.scale.linear().domain([data.bins.c * 6, 0]).range([0, targerAngle]).clamp(true);
              var angle = rotateScale(data.bins.width);
              rotateControllers(angle)
              controllerAngle[side] = transform.rotate;
            }
          }
        }
      }
      if(transform.translate[1] < 168) {
        d3.select("div#rightBlock")
          .attr("pointer-events", "none")
          .transition().ease("cubic-out").duration(500)
          .style("opacity", 0);
      } else {
        d3.select("div#rightBlock")
          .attr("pointer-events", "auto")
          .transition().ease("cubic-out").duration(500)
          .style("opacity", 1);
      }
      o.select("g#" + side + "Text").attr("transform", textTransform.toString());
      return transform.toString();
      function rotateControllers(angle) {
        transform.rotate = angle;
        textTransform.rotate = -angle;
      }
      function getSide(b) {
        var s;
        b ? s = "left" : s = "right"
        return s;
      }
    }

    function moveControllerAlongPath(o, x1, s1, left) {
      var transform = d3.transform(o.attr("transform"))
      var s0 = transform.scale[0]
      var x0 = transform.translate[0];
      var i0 = Math.min(pathPoints.length - 1, Math.max(0, parseInt(x0 / data.bins.n)));
      var i1 = Math.min(pathPoints.length - 1, Math.max(0, parseInt(x1 / data.bins.n)));
      return function() {
        var iX = d3.interpolateRound(x0, x1);
        var iS = d3.interpolateNumber(s0, s1);
        var iI = d3.interpolateRound(i0, i1);
        return function(t) {
          controllerPosture(iX(t), pathPoints[iI(t)][1], iS(t), left)
          return controllerPosture(iX(t), pathPoints[iI(t)][1], iS(t), left);
        };
      };
    }

    function updateFilterValues() {
      var min, max, direction, trend, left, right;
      var x = getX(data.bins.x0, data.bins.x1);
      var x0 = Math.max(0, Math.round((data.bins.x0 - data.bins.n / 2) / data.bins.n));
      var x1 = Math.min(bins[0].length - 1, Math.round((data.bins.x1 - data.bins.n / 2) / data.bins.n));
      d3.select(bins[0][x0]).each(function (d) { min = d;  })
      d3.select(bins[0][x1]).each(function (d) { max = d;  })
      if(filter === null) {
        data.filter.min = min;
        data.filter.max = max;
        filter = new Filter();
        filter.createFilter(x);
        data.bins.x = x;
      } else {
        if(min > data.filter.max || max < data.filter.min) {
          data.filter.min = min;
          data.filter.max = max;
          filter.updateFilter(x);
        }
        if(data.filter.min != min) {
          data.filter.min = min;
          filter.moveFilter(x, true);
        }
        if(data.filter.max != max) {
          data.filter.max = max;
          filter.moveFilter(x, false);
        }
        data.bins.x = x;
      }
      function getX(x0, x1) {
        var x = x1 - (x1 - x0) / 2;
        return x;
      }
      popups.forEach(function (el, i) {
        if(el != undefined) {
          el.filterPopup();
        }
      })
    }

    function Filter() {
      this.num;
      this.hidden = new Object;
      this.visible = new Object;
      this.createFilter = function(x) {
        var v = ["hidden", "visible"];
        for (var i = 0; i < 2; i++) {
          var firstHalf;
          x < width / 2 ? firstHalf = true : firstHalf = false
          this[v[i]] = trinitySelecetion(bubbles.full[v[i]], firstHalf);
          animatons[v[i]].fillToStroke(this[v[i]].less, 1000);
          animatons[v[i]].fillToStroke(this[v[i]].more, 1000);
        }
        this.num = this.hidden.less[0].length + this.hidden.equal[0].length + this.hidden.more[0].length + this.visible.less[0].length + this.visible.equal[0].length + this.visible.more[0].length;
      }
      this.updateFilter = function(x) {
        var v = ["hidden", "visible"];
        for(var i = 0; i < 2; i++) {
          var firstHalf, growth, n;
          x > data.bins.x ? growth = true : growth = false
          growth ? n = (width - data.bins.x) / 2 - (x - data.bins.x) : n = data.bins.x / 2 - x
          n > 0 ? firstHalf = true : firstHalf = false
          var name = getName(!growth);
          var concat = getConcat(growth);
          var selection = trinitySelecetion(this[v[i]][name], firstHalf);
          animatons[v[i]].fillToStroke(this[v[i]].equal, 1000);
          animatons[v[i]].strokeToFill(selection.equal, 1000);
          this[v[i]][name] = selection[name];
          name = getName(growth);
          this[v[i]][name] = concat(this[v[i]][name], this[v[i]].equal);
          this[v[i]].equal = selection.equal;
          this[v[i]][name] = concat(this[v[i]][name], selection[name]);
        }
        checkLength(this);
      }
      this.moveFilter = function (x, left) {
        var v = ["hidden", "visible"];
        for(var i = 0; i < 2; i++) {
          var growth;
          x > data.bins.x ? growth = true : growth = false
          var increment = getIncrement(growth);
          var statement = getStatement(growth);
          var pushMethod = getPushMethod(growth);
          var sliceMethod = getSliceMethod(growth);
          var conversion = getConversion(growth, left);
          var concat = getConcat(growth);
          var names = getNames(growth, left);
          var n = getNumber(left);
          var c = getCounter(growth, this[v[i]][names[0]]);
          var selection = splitSelection(this[v[i]][names[0]], increment, statement, pushMethod, sliceMethod, n, c);
          animatons[v[i]][conversion](selection.splitted, 1000);
          this[v[i]][names[0]] = selection.other;
          this[v[i]][names[1]] = concat(this[v[i]][names[1]], selection.splitted);
        }
        checkLength(this);
      }
      this.updateVisible = function () {
        var v = ["visible", "hidden"]
        var p = ["less", "equal", "more"];
        for (var i = 0; i < 3; i++) {
          var visible = divideSelection(this.visible[p[i]], function (el) {
            var x = parseFloat(d3.select(el).attr("cx")) + map.x;
            var y = parseFloat(d3.select(el).attr("cy")) + map.y;
            var r = parseFloat(d3.select(el).attr("r"));
            return x + r > 0 && x - r < width && y + r > 0 && y - r < height;
          });
          var hidden = divideSelection(this.hidden[p[i]], function (el) {
            var x = parseFloat(d3.select(el).attr("cx")) + map.x;
            var y = parseFloat(d3.select(el).attr("cy")) + map.y;
            var r = parseFloat(d3.select(el).attr("r"));
            return x + r > 0 && x - r < width && y + r > 0 && y - r < height;
          });
          this.visible[p[i]][0] = visible.true[0].concat(hidden.true[0]);
          this.hidden[p[i]][0] = visible.false[0].concat(hidden.false[0]);
          this.hidden[p[i]].sort(function(a, b) { return b.properties[data.mean] - a.properties[data.mean]; });
          this.visible[p[i]].sort(function(a, b) { return b.properties[data.mean] - a.properties[data.mean]; });
        }
      }
      this.deleteFilter = function() {
        var v = ["hidden", "visible"];
        var p = ["less", "more"];
        for(var i = 0; i < 2; i++) {
          for(var j = 0; j < 2; j++) {
            animatons[v[i]].strokeToFill(this[v[i]][p[j]], 1000);
          }
        }
        data.filter.min = Number.NEGATIVE_INFINITY;
        data.filter.max = Number.POSITIVE_INFINITY;
        filter = null;
      }
      this.roomUpdate = function (x) {
        var v = ["hidden", "visible"];
        for (var i = 0; i < 2; i++) {
          var firstHalf;
          x < width / 2 ? firstHalf = true : firstHalf = false

          var formerNull = filterSortAndSplit(bubbles.null[v[i]], firstHalf);
          var formerLess = filterSortAndSplit(this[v[i]].less, firstHalf);
          var formerEqual = filterSortAndSplit(this[v[i]].equal, firstHalf);
          var formerMore = filterSortAndSplit(this[v[i]].more, firstHalf);
          this[v[i]].less = joinSelections([formerNull.true.less, formerLess.true.less, formerEqual.true.less, formerMore.true.less]);
          this[v[i]].equal = joinSelections([formerNull.true.equal, formerLess.true.equal, formerEqual.true.equal, formerMore.true.equal]);
          this[v[i]].more = joinSelections([formerNull.true.more, formerLess.true.more, formerEqual.true.more, formerMore.true.more]);
          bubbles.null[v[i]][0] = formerNull.false[0].concat(formerLess.false[0].concat(formerEqual.false[0].concat(formerMore.false[0])));
          bubbles.full[v[i]][0] = this[v[i]].more[0].concat(this[v[i]].equal[0].concat(this[v[i]].less[0]))

          animatons[v[i]].nullToStroke(formerNull.true.less, 2000);
          animatons[v[i]].nullToStroke(formerNull.true.more, 2000);
          animatons[v[i]].nullToFill(formerNull.true.equal, 2000);

          animatons[v[i]].strokeToNull(formerLess.false, 2000);
          animatons[v[i]].strokeToNull(formerMore.false, 2000);

          animatons[v[i]].fillToNull(formerEqual.false, 2000);

          animatons[v[i]].fillToStrokeA(formerEqual.true.less, 2000);
          animatons[v[i]].fillToStrokeA(formerEqual.true.more, 2000);

          animatons[v[i]].strokeToFill(formerLess.true.equal, 2000);
          animatons[v[i]].strokeToFill(formerMore.true.equal, 2000);

          animatons[v[i]].stroke(formerLess.true.less, 2000);
          animatons[v[i]].stroke(formerLess.true.more, 2000);
          animatons[v[i]].stroke(formerMore.true.less, 2000);
          animatons[v[i]].stroke(formerMore.true.more, 2000);

          animatons[v[i]].fill(formerEqual.true.equal, 2000);
        }
        function joinSelections(a) {
          var selection = d3.select(null);
          selection[0] = new Array;
          var counter = new Array;
          var price = new Array;

          for(var i = 0; i < a.length; i++) {
            counter[i] = 0;
            price[i] = getPrice(a[i][0][counter[i]]);
          }
          while(statement(price)) {
            var c = findMax(price);
            selection[0].push(a[c][0][counter[c]]);
            counter[c]++
            price[c] = getPrice(a[c][0][counter[c]]);
          }
          return selection;

          function statement(a) {
            var b = false;
            for(var i = 0; i < a.length; i++) {
              a[i] != null ? b = true : null
            }
            return b;
          }
          function getPrice(o) {
            var price = null;
            d3.select(o).each(function (d) {  price = d.properties[data.mean] });
            return price;
          }
          function findMax(a) {
            var max = 0;
            for(var i = 1; i < a.length; i++) {
              a[max] < a[i] ? max = i : null
            }
            return max;
          }
        }
        function filterSortAndSplit(o, firstHalf) {
          var selection = divideSelection(o, function (el) {
            var s;
            d3.select(el).each(function (d) {  s = d.properties[data.mean];});
            return s != null;
          });
          selection.true.sort(function(a, b) { return b.properties[data.mean] - a.properties[data.mean];});
          selection.true = trinitySelecetion(selection.true, firstHalf);
          return selection;
        }
      }
      function calcLength(a) {
        var n = 0;
        for(var i = 0; i < a.length; i++) {
          n = n + a[i][0].length;
        }
      }
      function checkLength(o) {
        var x = o.num = o.hidden.less[0].length + o.hidden.equal[0].length + o.hidden.more[0].length + o.visible.less[0].length + o.visible.equal[0].length + o.visible.more[0].length;
      }
      function trinitySelecetion(o, firstHalf) {
        var selection = {
            less: d3.select(null),
            equal: d3.select(null),
            more: d3.select(null)
        };
        selection.less[0] = new Array;
        selection.equal[0] = new Array;
        selection.more[0] = new Array;
        var increment = getIncrement(firstHalf);
        var statement = getStatement(firstHalf);
        var pushMethod = getPushMethod(firstHalf);
        var sliceMethod = getSliceMethod(firstHalf);
        var name = getName(firstHalf);
        var n = getNumber(firstHalf);
        var c = getCounter(firstHalf, o);
        var phase0 = splitSelection(o, increment, statement, pushMethod, sliceMethod, n, c);
        n = getNumber(!firstHalf);
        c = getCounter(firstHalf, phase0.other);
        var phase1 = splitSelection(phase0.other, increment, statement, pushMethod, sliceMethod, n, c);
        selection[name] = phase0.splitted;
        selection.equal = phase1.splitted;
        name = getName(!firstHalf);
        selection[name] = phase1.other;
        return selection;
      }
      function splitSelection(o, increment, statement, pushMethod, sliceMethod, n, i) {
        var selection = {
            splitted: d3.select(null),
            other: d3.select(null)
        };
        selection.splitted[0] = new Array;
        selection.other[0] = new Array;
        var price;
        d3.select(o[0][i]).each(function (d) {  price = d.properties[data.mean] });
        while(statement(price, n) && o[0][i] != undefined) {
          selection.splitted[0][pushMethod](o[0][i]);
          i = increment(i);
          d3.select(o[0][i]).each(function (d) {  price = d.properties[data.mean]; });
        }
        selection.other[0] = sliceMethod(o[0], i);
        return selection;
      }
      function getConcat(b) {
        var f;
        b ? f = function (o2, o1) {
          var o = d3.select(null);
          o[0] = new Array;
          o[0] = o1[0].concat(o2[0]);
          return o;
        } : f = function (o1, o2) {
          var o = d3.select(null);
          o[0] = new Array;
          o[0] = o1[0].concat(o2[0]);
          return o;
        }
        return f;
      }
      function getConversion(growth, left) {
        var v1 = "fillToStroke";
        var v2 = "strokeToFill";
        var s;
        if(growth) {
          left ? s = v1 : s = v2
        } else {
          left ? s = v2 : s = v1
        }
        return s;
      }
      function getNames(growth, left) {
        var name = getName(left);
        var v1 = ["equal", name];
        var v2 = [name, "equal"];
        var a;
        if(growth) {
          left ? a = v1 : a = v2
        } else {
          left ? a = v2 : a = v1
        }
        return a;
      }
      function getName(b) {
        var s;
        b ? s = "less" : s = "more"
        return s;
      }
      function getCounter(b, o) {
        var i;
        b ? i = o[0].length - 1 : i = 0
        return i;
      }
      function getNumber(b) {
        var n;
        b ? n = data.filter.min : n = data.filter.max
        return n;
      }
      function getSliceMethod(b) {
        var f;
        b ? f = function(o, i) { return o.slice(0, i + 1);  } : f = function(o, i) { return o.slice(i, o.length);  }
        return f;
      }
      function getPushMethod(b) {
        var s;
        b ? s = "unshift" : s = "push"
        return s;
      }
      function getStatement(b) {
        var f;
        b ? f = function(x, n) { return x < n; } : f = function(x, n) { return x > n; }
        return f;
      }
      function getIncrement(b) {
        var f;
        b ? f = function (i) { return i - 1; } : f = function (i) { return i + 1; }
        return f;
      }
    }

    function delimiter(s) {
      if(lang != "en") {
        s = s.toString().split(".").join(",")
      }
      return s;
    }

    function endall(transition, callback) {
      if (transition.size() === 0) { callback() }
      var n = 0;
      transition
          .each(function() { ++n; })
          .each("end", function() { if (!--n) callback.apply(this, arguments); });
    }

    var animatons = {
      visible: {
        fill : function(o, t) {
          o.style("pointer-events", "auto")
            .interrupt()
            .style("stroke-width", 0)
            .transition().ease("cubic-out").duration(t)
            .attr("r", function (d) { return circleSize(d.properties[data.mean]);  })
            .style("fill", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
        },
        fillToNull: function(o, t) {
          o.transition().ease("cubic-out").duration(t)
            .attr("r", 0)
            .style("fill", data.color)
        },
        nullToFill: function(o, t) {
          o.interrupt()
            .style("fill", data.pColor)
          animatons.visible.fill(o, t);

        },
        fillToStroke : function(o, t) {
          o.interrupt()
            .style("stroke-width", function (d) { return circleSize(d.properties[data.mean]);  })
            .attr("r", function (d) { return circleSize(d.properties[data.mean]) / 2; })
            .style("stroke", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
            .style("fill", colors.ground)
            .style("cursor", "default")
          animatons.visible.stroke(o, t);
        },
        fillToStrokeA : function(o, t) {
          o.style("stroke-width", function () { return d3.select(this).attr("r");  })
            .attr("r", function () { return d3.select(this).attr("r") / 2; })
            .style("stroke", function () { return d3.select(this).style("fill"); })
            .style("fill", colors.ground)
            .style("cursor", "default")
          animatons.visible.stroke(o, t);
        },
        stroke: function(o, t) {
          o.style("pointer-events", "none")
            .transition().ease("cubic-out").duration(t)
            .attr("r", function(d) {  return Math.max(circleSize(d.properties[data.mean]) - 0.5, 1);  })
            .style("stroke", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
            .style("stroke-width", 1)
            .style("opacity", 0.3)
            .style("fill", colors.ground)
        },
        strokeToFill: function(o, t) {
          o.transition().ease("cubic-out").duration(t)
            .style("stroke", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
            .style("stroke-width", function (d) { return circleSize(d.properties[data.mean]);  })
            .attr("r", function (d) { return circleSize(d.properties[data.mean]) / 2; })
            .style("opacity", 1)
            .each("end", function (d) {
              d3.select(this).style("pointer-events", "auto")
                .attr("r", function (d) { return circleSize(d.properties[data.mean]);  })
                .style("fill", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
                .style("stroke-width", 0)
                .style("cursor", "pointer");
            });
        },
        nullToStroke: function (o, t) {
          o.style("fill", colors.ground)
            .style("stroke", data.pColor)
            .style("cursor", "default")
          animatons.visible.stroke(o, t);
        },
        strokeToNull: function (o, t) {
          o.transition().ease("cubic-out").duration(t)
            .style("stroke", data.color)
            .attr("r", 0)
            .each("end", function (d) {
              d3.select(this).style("fill", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
                .style("stroke-width", 0)
                .style("cursor", "pointer")
                .style("opacity", 1);
            });
        }
      },
      hidden: {
        fill : function(o, t) {
          o.style("pointer-events", "auto")
            .attr("r", function (d) { return circleSize(d.properties[data.mean]);  })
            .style("fill", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
        },
          fillToNull: function(o, t) {
            o.attr("r", 0)
        },
          nullToFill: function(o, t) {
            animatons.hidden.fill(o, t);
        },
        fillToStroke : function(o, t) {
          animatons.hidden.stroke(o, t);
        },
        fillToStrokeA : function(o, t) {
          animatons.hidden.stroke(o, t);
        },
        stroke: function(o, t) {
          o.style("pointer-events", "none")
            .style("fill", colors.ground)
            .style("cursor", "default")
            .attr("r", function(d) {  return Math.max(circleSize(d.properties[data.mean]) - 0.5, 1);  })
            .style("stroke", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
            .style("stroke-width", 1)
            .style("opacity", 0)
        },
        strokeToFill: function(o, t) {
          o.style("pointer-events", "auto")
            .attr("r", function (d) { return circleSize(d.properties[data.mean]);  })
            .style("stroke-width", 0)
            .style("cursor", "pointer")
            .style("fill", function (d) { return circleColor.colorTint(d.properties[data.count], data.room); })
            .style("opacity", 1)
        },
        nullToStroke: function (o, t) {
          animatons.hidden.stroke(o, t);
        },
        strokeToNull: function (o, t) {
          o.style("stroke-width", 0)
            .style("cursor", "pointer")
            .style("opacity", 1)
            .attr("r", 0)
        }
      }
    }

    function roundPrice(x) {
      var d;
      if(lang == "en") {
        x > 9995000 ? d = 0 : d = 1
      } else {
        x > 9995000 ? d = 1 : d = 2
      }
      x = x / 1000000;
      x = x.toFixed(d);
      x = delimiter(x);
      return x;
    bubbles.master.on("mouseover", function (d, i) {
      var b = this;
      setTimeout(function () {
        if(d.properties.popup) {
          d.properties.popup = false;
          popups.push(new Popup(b, d, i));
          var n = popups.length - 1;
          popups[n].addPopup(n);
          d3.select("g#map").on("mouseover", function () {
            popups[n] != undefined ? popups[n].mouseout() : null
            d3.select("g#map").on("mouseover", null)
          })
        }
        d.properties.popup = true;
      }, 100);
    })
    bubbles.master.on("mouseout", function (d) {
      d.properties.popup = false;
    })

    function Popup(bubble, d, id) {
      var popup, shadow, container, graph, graphValues, address, selection, popupObject, n;
      var bR, bX, bY, bF;
      var value = true;
      var values = [
        {
          true: d.properties.r1_mean,
          false: d.properties.r1_count,
        },
        {
          true: d.properties.r2_mean,
          false: d.properties.r2_count,
        },
        {
          true: d.properties.r3_mean,
          false: d.properties.r3_count,
        },
        {
          true: d.properties.r4_mean,
          false: d.properties.r4_count,
        }
      ];
      var xScale = {
        true: d3.scale.linear().domain([0, d3.max([values[0].true, values[1].true, values[2].true, values[3].true])]).range([0, 160]),
        false: d3.scale.linear().domain([0, d3.max([values[0].false, values[1].false, values[2].false, values[3].false])]).range([0, 160])
      }
      var click = false;
      var phase = 0;
      var growth = true;
      var r = 28;
      this.addPopup = function (N) {
        n = N;
        getBubbleValues();
        popup = d3.select("g#popups").append("g")
          .attr("class", "popup")
          .attr("transform", "translate(" + bX + "," + bY + ")")
          .style("cursor", "pointer")
          .style("-webkit-tap-highlight-color", "rgba(0, 0, 0, 0)");

        popup.append("line").attr("class", "hPointer")
          .attr("x1", 0).attr("y1", 0)
          .attr("x2", 0).attr("y2", 0)
          .style("stroke", colors.black)
          .style("stroke-width", 1)
          .style("shape-rendering", "crispEdges")
          .style("pointer-events", "none")
          .style("stroke-dasharray", "5,5")

        popup.append("line").attr("class", "vPointer")
          .attr("x1", 0).attr("y1", 0)
          .attr("x2", 0).attr("y2", 0)
          .style("stroke", colors.black)
          .style("stroke-width", 1)
          .style("shape-rendering", "crispEdges")
          .style("pointer-events", "none")
          .style("stroke-dasharray", "5,5")

        popup.append("circle").attr("class", "pointer")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", 2)
          .style("fill", colors.black)
          .style("pointer-events", "none")

        createShadow();
        popup.append("rect")
          .attr("class", "paperRect")
          .attr("filter", "url(#shadow" + id + ")")
          .attr("x", -bR)
          .attr("y", -bR)
          .attr("width", bR * 2)
          .attr("height", bR * 2)
          .attr("rx", bR)
          .attr("ry", bR)
          .style("fill", bF)
          .style("opacity", function () { bR < r ? 1 : 0 });

        popup.append("rect")
          .attr("class", "paperRect")
          .attr("x", -bR)
          .attr("y", -bR)
          .attr("width", bR * 2)
          .attr("height", bR * 2)
          .attr("rx", bR)
          .attr("ry", bR)
          .style("fill", bF)
          .style("opacity", function () { bR < r ? 1 : 0 });

        container = popup.append("g").attr("class", "container")
          .attr("transform", "translate(" + -156 + "," + -4 + ") scale(1, 1)")
          .style("pointer-events", "none")
          .style("opacity", 0);

        container.append("g")
          .attr("class", "popupHeadline")
          .attr("transform", "translate(0,8)")
          .style("cursor", "pointer")
            .append("text")
            .text(local.svg.popup.headline[value][lang])
            .style("font-weight", 700)
            .style("text-transform", "uppercase")

        container.select("g.popupHeadline")
          .each(function () {
            var bbox = this.getBBox();
            d3.select(this).append("line")
              .attr("x1", 0).attr("x2", bbox.width)
              .attr("y1", 2.5).attr("y2", 2.5)
              .style("stroke", "black")
              .style("stroke-dasharray", "2,2")
              .style("shape-rendering", "crispEdges")
          })
        graph = container.append("g")
          .attr("class", "graph")
          .selectAll("g")
          .data(values)
          .enter()
            .append("g")
            .attr("transform", function (d, i) { return "translate(0,4)";  })
            .style("cursor", "pointer")

        graph.append("line")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", 7.5).attr("y2", 7.5)
          .style("shape-rendering", "crispEdges")
          .style("pointer-events", "none")
          .style("stroke", function (d, i) {
            var c;
            i != data.room - 1 ? c = colors.lines : c = data.color
            return c;
          })

        container.append("g")
          .attr("class", "borders")
          .attr("transform", "translate(0,23.5) scale(1,0)")
          .style("pointer-events", "none")
          .style("shape-rendering", "crispEdges")
          .style("stroke", colors.lines)
            .append("line")
            .attr("x1", 0).attr("x2", 160)
            .style("opacity", 0)

        container.select("g.borders")
          .append("line")
          .attr("x1", 0).attr("x2", 160)
          .attr("y1", 120).attr("y2", 120)

        graph.append("text")
          .attr("class", "graphName")
          .text(function (d, i) { return local.svg.popup.legend[lang][i]; })
          .style("fill", function (d, i) {
            var n;
            i != data.room - 1 ? n = colors.lines : n = "black"
            return n;

        graph.append("text")
          .attr("class", "graphValue")
          .attr("x", 160)
          .text(function (d, i) { return roundPrice(d[value]) })
          .style("opacity", function (d, i) { return i != data.room - 1 ? 1 : 0 })
          .style("font-family", function (d) { return d[value] != null ? "Roboto Mono" : "Roboto Slab";  })
          .style("text-anchor", "end")
          .style("fill", function (d, i) {
            var n;
            i != data.room - 1 ? n = colors.lines : n = "black"
            return n;
          })
          .style("font-weight", function (d, i) {
            var n;
            i != data.room - 1 ? n = 400 : n = 700
            return n;
          })

        address = container.append("a")
          .attr("class", "address")
          .attr("xlink:href", "http://maps.google.com/maps/place/" + d.geometry.coordinates[1] + "," + d.geometry.coordinates[0] + "/@" + d.geometry.coordinates[1] + "," + d.geometry.coordinates[0] + ",15z")
          .attr("target", "_blank")
          .append("g")
          .attr("transform", "translate(0,4)")
        addAdress(address, d.properties["place_" + lang], d.properties["street_" + lang]);

        popup.append("g")
          .attr("class", "value")
          .attr("transform", "scale(0,0)")
            .append("text")
            .attr("class", "num")
            .attr("x", 0).attr("y", 0)
            .style("text-anchor", "middle")
            .style("font-weight", 700)
            .style("fill", "white")
            .style("font-family", "Roboto Mono")
            .text(roundPrice(d.properties[data.mean]))
            .style("cursor", "pointer")

        popup.select("g.value")
          .append("text")
          .attr("class", "units")
          .attr("x", 0).attr("y", 10)
          .style("text-anchor", "middle")
          .style("font-size", "10px")
          .style("fill", "white")
          .text(local.svg.popup.units[value][lang])
          .style("pointer-events", "none");

        popup.append("g")
          .attr("class", "cross")
          .attr("transform", "scale(0,0) rotate(0)")
          .style("cursor", "pointer")
            .append("circle")
            .attr("r", 12)
            .style("opacity", 0)

        popup.select("g.cross")
          .append("line")
          .attr("x1", -7).attr("y1", 0)
          .attr("x2", 7).attr("y2", 0)
          .style("stroke-width", 2)
          .style("stroke", "white");

        popup.select("g.cross")
          .append("line")
          .attr("x1", 0).attr("y1", -7)
          .attr("x2", 0).attr("y2", 7)
          .style("stroke-width", 2)
          .style("stroke", "white")

        popupInteraction();
        stages[growth][phase]();
      }
      this.mouseout = function () {
        if(phase < 4 && !click) {
          if(growth) {
            growth = false;
            stages[growth][phase]();
          }
        }
      }
      this.changePopupRoom = function(k) {
        getBubbleValues();
        graph.each(function (d, i) {
            d3.select(this).select("line").transition().ease("cubic-out").duration(500)
              .style("stroke", function () {
                var c;
                i != data.room - 1 ? c = colors.lines : c = data.color
                return c;
              })
            d3.select(this).selectAll("text.graphName").transition().ease("cubic-out").duration(500)
              .style("fill", function () {
                var n;
                i != data.room - 1 ? n = colors.lines : n = "black"
                return n;
              })

            d3.select(this).selectAll("text.graphValue").transition().ease("cubic-out").duration(500)
              .style("font-family", function () { return d[value] != null ? "Roboto Mono" : "Roboto Slab";  })
              .style("font-weight", function () {
                  var n;
                  i != data.room - 1 ? n = 400 : n = 700
                  d[value] == null ? n = 400 : null
                  return n;
              })
              .style("fill", function () {
                var n;
                i != data.room - 1 ? n = colors.lines : n = "black"
                return n;
              })
          })
        popup.select("text.units").transition().ease("cubic-out").duration(500)
          .style("fill", data.room != 4 ? n = colors.lines : n = "black")
      }
      this.changePopupLang = function () {
        container.selectAll("text.graphValue").text(function (d, i) { return roundPrice(d[value]) })
        container.selectAll("text.graphName").text(function (d, i) { return local.svg.popup.legend[lang][i]; })
        popup.select("text.units").text(local.svg.popup.units[value][lang])
        container.select("g.popupHeadline").select("text").text(local.svg.popup.headline[value][lang]);
        container.select("g.popupHeadline").select("line").remove();
        container.select("g.popupHeadline")
          .each(function () {
            var bbox = this.getBBox();
            d3.select(this).append("line")
              .attr("x1", 0).attr("x2", bbox.width)
              .attr("y1", 2.5).attr("y2", 2.5)
              .style("stroke", "black")
              .style("stroke-dasharray", "2,2")
              .style("shape-rendering", "crispEdges")
          })
        address.selectAll("text").remove();
        addAdress(address, d.properties["place_" + lang], d.properties["street_" + lang]);
      }
      this.changeLineCenter = function (t) {
        if(phase < 5 && !click) {
          if(d3.select(popup.node().parentNode).attr("id") == "popups") {
            d3.select("g#map").node().appendChild(popup.node());
            bX = parseFloat(d3.select(bubble).attr("cx"));
            bY = parseFloat(d3.select(bubble).attr("cy"));
            bR = circleSize(d.properties[data.mean]);
            bF = circleColor.colorTint(d.properties[data.count], data.room);
            popup.interrupt()
              .attr("transform", "translate(" + bX + "," + (bY + bR - parseFloat(popup.selectAll("rect.paperRect").attr("height")) / 2) + ")")
            if(true) {
              growth = false;
              stages[growth][phase]();
            }
          }
        } else {
          getBubbleValues();
          var transform = d3.transform(popup.attr("transform"));
          popup.selectAll("line.hPointer")
            .transition().duration(t).ease("linear")
            .attr("x2",parseFloat(bX) - transform.translate[0])
          popup.selectAll("line.vPointer")
            .transition().duration(t).ease("linear")
            .attr("x1",parseFloat(bX) - transform.translate[0])
            .attr("x2",parseFloat(bX) - transform.translate[0])
            .attr("y2", parseFloat(bY) - transform.translate[1])
          popup.select("circle.pointer")
            .transition().duration(t).ease("linear")
            .attr("cx",parseFloat(bX) - transform.translate[0])
            .attr("cy", parseFloat(bY) - transform.translate[1])
          }
      }
      this.filterPopup = function () {
        if(filter === null || (d.properties[data.mean] > data.filter.min && d.properties[data.mean] < data.filter.max)) {
          container.transition().ease("cubic-out").duration(500)
            .style("opacity", 1)
          popup.select("g.graphValues").transition().ease("cubic-out").duration(500)
            .style("opacity", 1)
          popup.select("g.value").transition().ease("cubic-out").duration(500)
            .style("opacity", 1)
        } else {
          container.transition().ease("cubic-out").duration(500)
            .style("opacity", 0.5)
          popup.select("g.graphValues").transition().ease("cubic-out").duration(500)
            .style("opacity", 0.5)
          popup.select("g.value").transition().ease("cubic-out").duration(500)
            .style("opacity", 0.5)
        }
      }
      function getBubbleValues() {
        bX = parseFloat(d3.select(bubble).attr("cx")) * zoom[zoom.active] + map.x;
        bY = parseFloat(d3.select(bubble).attr("cy")) * zoom[zoom.active] + map.y;
        bR = circleSize(d.properties[data.mean]) * zoom[zoom.active];
        bF = circleColor.colorTint(d.properties[data.count], data.room);
      }
      var stages = {
        true: {
          0: function () {
            if(bR < r) {
              popup.transition().ease("cubic-out").duration(500)
                .attr("transform", "translate(" + bX + "," + (bY - (r - bR)) + ")")

              popup.selectAll("rect.paperRect")
                .transition().ease("cubic-out").duration(500)
                .attr("x", -r)
                .attr("y", -r)
                .attr("width", r * 2)
                .attr("height", r * 2)
                .attr("rx", r)
                .attr("ry", r)
                .style("fill", data.color)
            } else {
              popup.selectAll("rect.paperRect")
                .transition().ease("cubic-out").duration(500)
                .style("fill", data.color)
                .style("opacity", 1)
            }

            changeShadow(0, 2, 1, "cubic-out");

            popup.select("g.value")
              .transition().ease("cubic-out").duration(500)
              .attr("transform", "scale(1,1)")
              .each(function () {
                phase = 3;
                if(phase) {
                  if(click) {
                    stages[growth][phase]();
                  } else {
                    setTimeout(function () {
                      if(!click) {
                        phase = 1;
                        stages[growth][phase]();
                      }
                    }, 2000);
                  }
                }
              });

          },
          1: function () {
            popup.select("g.value")
              .transition().ease("cubic-out").duration(500)
              .style("opacity", 0)

            popup.select("g.cross")
              .transition().ease("cubic-out").duration(500).delay(100)
              .attr("transform", "scale(1,1) rotate(0)")
              .each(function () {
                phase = 4;
                if(growth) {
                  if(click) {
                    stages[growth][phase]();
                  } else {
                    setTimeout(function () {
                      if(!click) {
                        phase = 2;
                        stages[growth][phase]();
                      }
                    }, 2000);
                  }
                }
              });
          },
          2: function () {
            popup.select("g.cross")
              .transition().ease("cubic-out").duration(500)
              .attr("transform", "scale(0,0) rotate(0)")

            popup.select("g.value")
              .transition().ease("cubic-out").duration(500).delay(200)
              .style("opacity", 1)
              .each(function () {
                phase = 3;
                if(growth) {
                  if(click) {
                    stages[growth][phase]();
                  } else {
                  }
                }
              });
          },
          3: function () {
            popup.style("cursor", "default");
            popup.selectAll("rect.paperRect")
              .transition().ease("cubic-in").duration(700)
              .attr("x", -152 - r)
              .attr("y", -r)
              .attr("width", 152 + r * 2)
              .attr("height", r * 2)
              .attr("rx", 2)
              .attr("ry", 2)
              .style("fill", "white")
              .each("end", function () {
                phase = 5;
                stages[growth][phase]();
              })

            changeShadow(0, 6, 3, "cubic-out");

            popup.select("text.units")
              .style("cursor", "default")
              .transition().ease("cubic-out").duration(700).delay(100)
              .style("fill", "black")
              .attr("x", function () {
                var bbox = this.getBBox();
                return bbox.width / -2 + 4;
              })
              .each("end", function () {
                d3.select(this).attr("x", 4)
                  .style("text-anchor", "end")
              })

            popup.select("text.num")
              .transition().ease("cubic-out").duration(700).delay(100)
              .style("fill", "black")
              .attr("x", function () {
                var bbox = this.getBBox();
                return bbox.width / -2 + 4;
              })
              .each("end", function () {
                d3.select(this).attr("x", 4)
                  .style("text-anchor", "end")
              })

          },
          4: function () {
            popup.style("cursor", "default");
            popup.selectAll("rect.paperRect")
              .transition().ease("cubic-in").duration(700)
              .attr("x", -152 - r)
              .attr("y", -r)
              .attr("width", 152 + r * 2)
              .attr("rx", 2)
              .attr("ry", 2)
              .style("fill", "white")
              .each("end", function () {
                phase = 5;
                stages[growth][phase]();
              })

            changeShadow(0, 6, 3, "cubic-out");

            popup.select("g.cross")
              .transition().ease("cubic-out").duration(700).delay(200)
              .attr("transform", "scale(1,1) rotate(45)")
              .selectAll("line")
              .style("stroke", colors.lines)

            popup.select("text.units")
              .style("cursor", "default")
              .attr("x", 4)
              .style("text-anchor", "end")

            popup.select("text.num")
              .style("cursor", "default")
              .attr("x", 4)
              .style("text-anchor", "end")

          },
          5: function () {
            popup.selectAll("rect.paperRect")
              .transition().ease("cubic-out").duration(700)
              .attr("height", 152 + r * 2)
              .style("cursor", "all-scroll")

            popup.select("g.value")
              .transition().ease("cubic-out").duration(700)
              .style("opacity", 1)

            popup.select("g.cross")
              .transition().ease("cubic-out").duration(700)
              .attr("transform", "scale(1,1) rotate(45)")
              .selectAll("line")
              .style("stroke", colors.lines)

            popup.select("text.units")
              .transition().ease("cubic-out").duration(700)
              .attr("y", 130)
              .style("fill", data.room != 4 ? n = colors.lines : n = "black")
              .each("end", function () {
                d3.select(this)
                  .style("text-anchor", "end")
                  .attr("x", 4)
              })

            popup.select("text.num")
              .transition().ease("cubic-out").duration(700)
              .attr("y", (data.room - 1) * 24 + 40 - 4)
              .style("fill", "black")
              .each("end", function () {
                d3.select(this).remove();
                d3.select(graph[0][data.room - 1]).select("text.graphValue").style("opacity", null);
              })

            graph.transition().ease("cubic-out").duration(700)
              .attr("transform", function (d, i) { return "translate(0," + (i * 24 + 40) + ")";  })

            graph.selectAll("line")
              .transition().ease("cubic-out").duration(700).delay(500)
              .attr("x2", function (d) {  return xScale[value](d[value]);  })

            container.transition().ease("cubic-out").duration(700)
              .style("pointer-events", "auto")
              .style("opacity", 1)

            popup.select("g.graphValues")
              .transition().ease("cubic-out").duration(700)
              .style("opacity", 1)

            container.select("g.borders")
              .transition().ease("cubic-out").duration(700)
              .attr("transform", "translate(0,23.5) scale(1,1)")

            container.select("g.borders").select("line")
              .transition().ease("cubic-out").duration(500).delay(200)
              .style("opacity", 1)

            address.style("cursor", "pointer")
              .transition().ease("cubic-out").duration(700)//.delay(500)
              .attr("transform", "translate(0,160)")

            var dragPopup = d3.behavior.drag()
              .on("drag", function () {
                popup != null ? popup.each(function(){  this.parentNode.appendChild(this);  }) : null
                if(phase < 5 && !click) {
                } else {
                  var transform = d3.transform(popup.attr("transform"));
                  transform.translate[0] += + d3.event.dx;
                  transform.translate[1] += + d3.event.dy;
                  popup.selectAll("line.hPointer")
                    .attr("x2",parseFloat(bX) - transform.translate[0])
                  popup.selectAll("line.vPointer")
                    .attr("x1",parseFloat(bX) - transform.translate[0])
                    .attr("x2",parseFloat(bX) - transform.translate[0])
                    .attr("y2", parseFloat(bY) - transform.translate[1])
                  popup.select("circle.pointer")
                    .attr("cx",parseFloat(bX) - transform.translate[0])
                    .attr("cy", parseFloat(bY) - transform.translate[1])
                  popup.attr("transform", transform.toString());
                }
              })
            popup.call(dragPopup);
          }
        },
        false: {
          0: function () {
            if(dragged()) {
              popup.transition().ease("cubic-in").duration(500)
                .attr("transform", "translate(" + bX + "," + bY + ")")
            } else {
              popup.transition().ease("cubic-in").duration(500)
                .style("opacity", 0)
            }

            function dragged() {
              var transform = d3.transform(popup.attr("transform"));
              var dX = transform.translate[0] - bX;
              var dY = transform.translate[1] - bY - bR + r;
              return Math.sqrt(dX * dX + dY * dY) < r;
            }

            changeShadow(0, 0, 0, "cubic-in");

            popup.select("g.value")
              .transition().ease("cubic-in").duration(500)
              .attr("transform", "scale(0,0)")

            popup.selectAll("rect.paperRect")
              .transition().ease("cubic-in").duration(500)
              .attr("x", function () { return bR < r ? -bR : 0 })
              .attr("y", function () { return bR < r ? -bR : 0 })
              .attr("width", function () { return bR < r ? bR * 2 : 0 })
              .attr("height", function () { return bR < r ? bR * 2 : 0 })
              .attr("rx", function () { return bR < r ? bR : 0 })
              .attr("ry", function () { return bR < r ? bR : 0 })
              .style("fill", function () { return bR < r ? bF : data.color })
              .each("end", function () {
                deletePopup();
              });
          },
          1: function () {
            popup.select("g.cross")
              .transition().ease("cubic-in").duration(500)
              .attr("transform", "scale(0,0)")

            phase = 0;
            stages[growth][phase]();
          },
          2: function () {
            phase = 1;
            stages[growth][phase]();
          },
          3: function () {
            phase = 2;
            stages[growth][phase]();
          },
          4: function () {
            phase = 3;
            stages[growth][phase]();
          },
          5: function () {

            popup.selectAll("line.vPointer")
              .transition().ease("cubic-in").duration(500)
              .style("opacity", 0)

            popup.selectAll("line.hPointer")
              .transition().ease("cubic-in").duration(500)
              .style("opacity", 0)

            popup.select("circle.pointer")
              .transition().ease("cubic-in").duration(500)
              .style("opacity", 0)

            popup.select("g.cross")
              .transition().ease("cubic-in").duration(500)
              .attr("transform", "scale(0,0) rotate(0)")
              .selectAll("line")
                .style("stroke", "white")

            popup.select("g.value")
              .transition().ease("cubic-in").duration(500)
              .attr("transform", "translate(0,0) scale(0,0)")

            container.transition().ease("cubic-in").duration(500)
              .attr("transform", "translate(0,0) scale(0,0)")

            changeShadow(0, 2, 1, "cubic-out");

            popup.selectAll("rect.paperRect")
              .transition().ease("cubic-in").duration(500)
              .attr("x", -r)
              .attr("y", -r)
              .attr("width", r * 2)
              .attr("height", r * 2)
              .attr("rx", r)
              .attr("ry", r)
              .style("fill", data.color)
              .each("end", function () {
                phase = 1;
                stages[growth][phase]();
              })
          }
        }
      }
      function popupInteraction() {
        popup.select("g.cross").on("click", function() {
          if(phase == 5) {
            if(growth) {
              growth = false;
              stages[growth][phase]();
            }
          }
        })
        popup.on("click", function () {
          if(phase < 5) {
            click = true;
            phase > 1 ? stages[growth][phase]() : null
          }
        })
        popup.on("mouseleave", function () {
          if(phase < 5 && !click) {
            if(growth) {
              growth = false;
              stages[growth][phase]();
            }
          }
        })

        //var hammer = new Hammer(map.node());
        mc.on("tap", function(e) {
          if(phase < 5 && !click) {
            if(growth) {
              growth = false;
              stages[growth][phase]();
            }
          }
        })
        container.select("g.popupHeadline").on("click" , function () {
          changeValue();
        })

        graph.on("click", function (d, i) {
          if(i + 1 != data.room) {
            changeRoom(i + 1);
            getBubbleValues();
          }
        })
      }
      function changeValue() {
        value = !value;
        container.select("g.popupHeadline").select("text").text(local.svg.popup.headline[value][lang]);
        container.select("g.popupHeadline").select("line").remove();
        container.select("g.popupHeadline")
          .each(function () {
            var bbox = this.getBBox();
            d3.select(this).append("line")
              .attr("x1", 0).attr("x2", bbox.width)
              .attr("y1", 2.5).attr("y2", 2.5)
              .style("stroke", "black")
              .style("stroke-dasharray", "2,2")
              .style("shape-rendering", "crispEdges")
          })
        graph.selectAll("line").transition().ease("cubic-out").duration(700)
          .attr("x2", function (d) {  return xScale[value](d[value]);  })

        graph.selectAll("text.graphValue")
          .text(function (d) { return roundPrice(d[value]) })
          .style("font-family", function (d) { return d[value] != null ? "Roboto Mono" : "Roboto Slab";  })
        popup.select("text.units").text(local.svg.popup.units[value][lang])
      }
      function addAdress(o, place, street) {
        if(street == null) {
          o.append("text")
            .style("font-size", "10px")
              .append("tspan")
              .attr("class", "locality")
              .style("font-weight", 700)
              .text(place)
        } else {
          o.append("text")
            .style("font-size", "10px")
              .append("tspan")
              .attr("class", "localityName")
              .style("font-weight", 700)
              .text(place + ", ")

          o.select("text")
            .append("tspan")
            .attr("class", "streetName")
            .text(street)

          var box = o.node().getBBox();
          if(box.width > 160) {
            o.select("tspan.streetName")
              .attr("x", 0)
              .attr("dy", 12)
          }
          box = o.node().getBBox();
          if(box.width > 160) {
            o.select("tspan.streetName")
              .attr("x", null)
              .attr("dy", null)

            o.append("text")
              .attr("y", 12)
              .style("font-size", "10px")
              .append("tspan")
              .attr("class", "moreStreetName")
            var words = street.split(" ");
            for(var i = 0; i < words.length; i++) {
              var first = words.slice(0, i);
              var second = words.slice(i, words.length);
              o.select("tspan.streetName")
                .text(first.join(" "));

              o.select("tspan.moreStreetName")
                .text(second.join(" "));

              box = o.select("tspan.moreStreetName").node().getBBox();
              box.width < 160 ? i = words.length : null
            }
          }
        }
      }
      function deletePopup () {
        d3.select(bubble).each(function (d) {  d.properties.popup = true; })
        popup.remove();
        popups[n] = undefined;
      }
      function roundPrice(x) {
        var s;
        var d;
        if(value) {
          x = x * local.svg.currency.rate[lang]
          lang == "en" ? d = 1 : d = 2
          x = x / 1000000;
          x = x.toFixed(d);
          x == "0.00" ? x = "―" : null
          x == "0.0" ? x = "―" : null
          x = delimiter(x);
          s = x
        } else {
          x == null ? x = "―" : null
        }
        s = x;
        return s;
      }
      function changeShadow(x, y, b, ease) {
        shadow.select("feOffset")
          .transition().ease(ease).duration(500)
          .attr("dx", x)
          .attr("dy", y)

        shadow.select("feGaussianBlur")
          .transition().ease(ease).duration(500)
          .attr("stdDeviation", b)
      }
      function createShadow() {
        shadow = popup.append("defs").append("filter")
          .attr("id", "shadow" + id)
          .attr("x", "-10%")
          .attr("y", "-10%")
          .attr("width", "120%")
          .attr("height", "120%")

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
    }
    collapsePanel.end();
});

function changeHTMLLang(i) {
  d3.select("title").text(local.html.title[lang]);
  d3.select("div#headline").select("p:first-child").text(local.html.headline.firstString[lang]);
  d3.select("div#headline").select("p:nth-child(2)").text(local.html.headline.secondString.variable[lang][i - 1] + local.html.headline.secondString.constant[lang]);
  d3.select("div#headline").select("p:last-child").text(local.html.headline.thirdString[lang]);
  d3.select("div.mapKeyItem:first-child").select("div.mapKeyDescription").text(local.html.mapKey.first[lang]);
  d3.select("div.mapKeyItem:last-child").select("div.mapKeyDescription").text(local.html.mapKey.second[lang]);
  d3.select("div.source:first-child").select("a").html(local.html.rightBlock.author.name[lang]);
  d3.select("div.source:last-child").select("a").html(local.html.rightBlock.data.name[lang]);
  d3.select("div.source:first-child").select("p").text(local.html.rightBlock.author.description[lang]);
  d3.select("div.source:last-child").select("p").text(local.html.rightBlock.data.description[lang]);
}

function moveLangSelected(t) {
  var i;
  switch (lang) {
    case "ua":
      i = 0;
      break;
    case "ru":
      i = 1;
      break;
    case "en":
      i = 2;
      break;
  }
  if(width > 488) {
    var l, r, w, o;
    w = 96
    i == 0 ? o = 0 : o = 1
    i == 0 ? l = "2px" : l = "0px"
    i == 2 ? r = "2px" : r = "0px"
    d3.select("div#langSelected")
      .transition().duration(t).ease("cubic-out")
      .style("width", (w + o) + "px")
      .style("left", (i * w - o) + "px")
      .style("border-bottom-left-radius", l)
      .style("border-bottom-right-radius", r);
  } else {
    var w, o;
    w = Math.floor(width / 3) - 1
    i == 0 ? o = 0 : o = 1
    d3.select("div#langSelected")
      .transition().duration(t).ease("cubic-out")
      .style("width", (w + i)  + "px")
      .style("left", (i * w - i) + "px")
      .style("border-bottom-left-radius", 0)
      .style("border-bottom-right-radius", 0);
  }
}

function CollapsePanel() {
  var panel;
  var panelPosition = {
    true: {
      "top" : "177px",
      "height" : "24px"
    },
    false: {
      "top" : "319px",
      "height" : null
    },
  };
  var panelTop;
  this.state = false;
  this.start = function () {
    panel = d3.select("div#collapsePanel")
      .style("display", "block")
      .style("pointer-events", "none");
    resizePanel();
    panel.on("click", function () {
      collapsePanel.state = !collapsePanel.state;
      collapsePanel.changeState(collapsePanel.state, 1000);
    })
  }
  this.end = function () {
    d3.select("div#collapsePanel")
      .style("display", null)
      .style("pointer-events", null)
      .select("div")
        .text(local.html.panel[collapsePanel.state][lang]);
  }
  this.changeState = function (b, t) {
    b ? collapse(t) : expand(t)
  }
  this.resize = function () {
    resizePanel();
  }
  function resizePanel() {
    var menuHeight;
    var menuWidth = 304;
    var bbox = d3.select("div#collapseButton").node().getBoundingClientRect();
    findMenuHeight();
    panelPosition[false].height = (height - 319) + "px";
    var state = [
      {
        "left" : "0px",
        "top" : "0px",
        "width" : "100%",
        "height" : "100%"
      },
      {
        "left" : "0px",
        "top" : panelPosition[collapsePanel.state].top,
        "width" : "100%",
        "height" : panelPosition[collapsePanel.state].height
      },
      {
        "left" : "0px",
        "top" : (menuHeight + 32) + "px",
        "width" : "100%",
        "height" : (height - menuHeight - 32) + "px"
      },
      {
        "left" : menuWidth + "px",
        "top" : "16px",
        "width" : (width - menuWidth) + "px",
        "height" : (menuHeight + 16) + "px"
      }
    ];
    var i = 0;
    findState();
    panel.style("left", state[i].left)
         .style("top", state[i].top)
         .style("width", state[i].width)
         .style("height", state[i].height)

     function findState() {
       width < menuWidth * 2 + 16 * 3 + bbox.width ? i = 2 : null
       height < menuHeight + 16 * 3 ? i = 3 : null
       height > (menuHeight + 16 * 4) * 2 ? i = 0 : null
       width <= 488 ? i = 1 : null
     }
    function findMenuHeight() {
      menuHeight = 0;
      menuHeight += d3.select("div#langPanel").node().getBoundingClientRect().height;
      menuHeight += d3.select("div#main").node().getBoundingClientRect().height;
      if(width <= 488) {
        menuHeight += d3.select("div#rightBlock").node().getBoundingClientRect().height;
      }
    }
  }
  function collapse(t) {
    d3.select("div#interface")
      .transition().ease("cubic-out").duration(t)
      .style("top", "-24px")

    d3.select("div#mapKeyPanel")
      .style("pointer-events", "none")
      .transition().ease("cubic-out").duration(t / 2)
      .style("opacity", 0);

    d3.select("div#socialPanel")
      .style("pointer-events", "none")
      .transition().ease("cubic-out").duration(t / 2)
      .style("opacity", 0);

    d3.select("div#sourcePanel")
      .style("pointer-events", "none")
      .transition().ease("cubic-out").duration(t / 2)
      .style("opacity", 0);
    d3.select("div#main")
      .style("height", "224px")
      .transition().ease("cubic-out").duration(t)
      .style("height", "154px")

    d3.select("div#rightBlock")
      .transition().ease("cubic-out").duration(t)
      .style("height", "0px")
      .styleTween("box-shadow", shadowTween(0, 0, 2, 0, 1, 0, 0.25, 0))

    d3.select("div#collapsePanel").transition().ease("cubic-out").duration(t)
      .style("top", panelPosition[collapsePanel.state].top)
      .style("height", panelPosition[collapsePanel.state].height)
      .styleTween("box-shadow", shadowTween(0, 0, 0, 2, 0, 1, 0, 0.25))
      .styleTween("background-color", rgbaTween(255, 255, 255, 255, 255, 255, 0.5, 1))
        .select("div")
        .text(local.html.panel[collapsePanel.state][lang])
  }
  function expand(t) {
    d3.select("div#interface")
      .transition().ease("cubic-out").duration(t)
      .style("top", "0px")

    d3.select("div#mapKeyPanel")
      .style("pointer-events", "auto")
      .transition().ease("cubic-out").delay(t / 4).duration(t / 2)
      .style("opacity", 1);

    d3.select("div#socialPanel")
      .style("pointer-events", "auto")
      .transition().ease("cubic-out").delay(t / 3).duration(t / 2)
      .style("opacity", 1);

    d3.select("div#sourcePanel")
      .style("pointer-events", "auto")
      .transition().ease("cubic-out").delay(t / 2).duration(t / 2)
      .style("opacity", 1);

    d3.select("div#main")
      .transition().ease("cubic-out").duration(t)
      .style("height", "224px")

    d3.select("div#rightBlock")
      .transition().ease("cubic-out").duration(t)
      .style("height", "71px")
      .styleTween("box-shadow", shadowTween(0, 0, 0, 2, 0, 1, 0, 0.25))
      .each("end", function () {
        d3.select(this).style("box-shadow", null)
      })

    d3.select("div#collapsePanel").transition().ease("cubic-out").duration(t)
      .style("top", panelPosition[collapsePanel.state].top)
      .style("height", panelPosition[collapsePanel.state].height)
      .styleTween("box-shadow", shadowTween(0, 0, 2, 0, 1, 0, 0.25, 0))
      .styleTween("background-color", rgbaTween(255, 255, 255, 255, 255, 255, 1, 0.5))
        .select("div")
        .text(local.html.panel[collapsePanel.state][lang])
  }
}

function shadowTween(x0, x1, y0, y1, z0, z1, o0, o1) {
  var x = d3.interpolate(x0, x1);
  var y = d3.interpolate(y0, y1);
  var z = d3.interpolate(z0, z1);
  return function () {
    return function(t) {
      return x(t) + "px " + y(t) + "px " + z(t) + "px " + rgbaTween(0, 0, 0, 0, 0, 0, o0, o1)()(t);
    }
  }
}
function rgbaTween(r0, r1, b0, b1, g0, g1, o0, o1) {
  var o = d3.interpolate(o0, o1);
  var r = d3.interpolate(r0, r1);
  var g = d3.interpolate(g0, g1);
  var b = d3.interpolate(b0, b1);
  return function () {
    return function(t) {
      return "rgba(" + r(t) + "," + g(t) + "," + b(t) + "," + o(t) + ")";
    }
  }
}

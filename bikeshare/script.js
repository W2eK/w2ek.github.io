class Map {
	constructor(basemapProps, svgMap, svgOrigin) {
		mapboxgl.accessToken = 'pk.eyJ1IjoidzJlayIsImEiOiI4M2ZLOEVJIn0.g0A0zBZy5rJz00A1fVgDTg';
		this.basemap = new mapboxgl.Map(basemapProps);
		this.container = this.basemap.getCanvasContainer();
		this.map = d3.select(this.container.appendChild(svgMap.documentElement))
			.attr('id', 'map');
		this.map.lon = svgOrigin.lon;
		this.map.lat = svgOrigin.lat;
		this.map.z = svgOrigin.z;
		this.basemap.on('move', () => {
			this.moveMap();
		});
		this.basemap.on('mousemove', (e) => {
			this.basemap.mouse = e.lngLat;
		})
	}
	moveMap() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.z = Math.pow(2, this.basemap.getZoom() - this.map.z);
		this.offset = new Object();
		this.offset.x = (this.project(this.map.lon, this.map.lat)).x / -this.z;
		this.offset.y = (this.project(this.map.lon, this.map.lat)).y / -this.z;
		this.map.attr('viewBox', this.offset.x + ',' + this.offset.y + ',' + (this.width / this.z) + ',' + (this.height / this.z) + '');
	}
	project(lon, lat) {
		return this.basemap.project(function getLL() {
			return new mapboxgl.LngLat(lon, lat)
		}());
	}
}

class BikeShare extends Map {
	constructor(incoming) {
		super({
			container: 'basemap',
			style: 'mapbox://styles/w2ek/cjacj3ytj4csa2rpkka04pefa',
			center: [37.62, 55.73],
			zoom: 10.5,
			scrollZoom: false
		}, incoming, {	'lon': 37.470245, 'lat': 55.85831, 'z': 11})
	}
}

d3.queue()
	.defer(d3.xml, 'data/map.svg')
	.defer(d3.json, 'data/stations.geojson')
	.defer(d3.xml, 'export.svg')
	.await(function(error, ...incoming) {
		if (error) throw error;
		let map = new BikeShare(incoming[0]);
		let stations = turf.featureCollection(incoming[1].features.map(feature => turf.point(feature.geometry.coordinates, feature.properties)))
		// printValues();
		map.moveMap();
		let mapbox_layer;
		map.basemap.on('load', () => {
			/*

			map.basemap.addLayer({
				'id': 'directions',
				'type': 'line',
				'source': {
					'type': 'geojson',
					'data': turf.featureCollection(
						stations.features.reduce((prev, centroid) => {
							return prev.concat(Object.keys(centroid.properties.stations).reduce((prev, year) => {
								let start = centroid.geometry.coordinates;
								return prev.concat(centroid.properties.stations[year].map(point => {
									return turf.lineString([start, point.geometry.coordinates], point.properties);
								}));
							}, new Array()));
						}, new Array())
					)
				},
				'paint': {
					'line-width': {
						'stops': [[12.5, 0], [14, 0.5], [16, 1]]
					},
					'line-dasharray': [3, 3],
					'line-color': 'black'
				}
			})
			map.basemap.addLayer({
				'id': 'stations',
				'type': 'circle',
				'source': {
					'type': 'geojson',
					'data': turf.featureCollection(
						stations.features.reduce((prev, centroid) => {
							return prev.concat(Object.keys(centroid.properties.stations).reduce((prev, year, i) => {
								let center = turf.point(centroid.geometry.coordinates)
								Object.keys(centroid.properties).forEach(key => {
									let prop = centroid.properties[key]
									center.properties[key] = prop.constructor === Array ? prop[i] : prop

								})
								// console.log(center.properties.toString());
								return prev.concat(centroid.properties.stations[year]).concat([center])
							}, new Array()))
						}, new Array())
					)
				},
				'paint': {
					'circle-radius': {
						'property': 'iscentroid',
						'type': 'categorical',
						'stops': [
							[{'zoom': 12.5,	'value': true}, 0],
							[{'zoom': 12.5,	'value': false}, 0],
							[{'zoom': 14,	'value': true}, 1.5],
							[{'zoom': 14,	'value': false}, 2],
							[{'zoom': 16.5,	'value': true}, 3],
							[{'zoom': 16.5,	'value': false}, 5]
						]
					}
				}
			})
			updateLayers();
			// 'property': 'year',
			// 'type': 'categorical',
			// 'default': 0,
			// 'stops': [[settings.year + 2013, 1]]
			*/
		})
		const projection = d3.geoMercator()
			.center([map.basemap.getCenter().lng, map.basemap.getCenter().lat])
			.scale((512) * 0.5 / Math.PI * Math.pow(2, map.basemap.getZoom() + 0.5))

		const geoPath = d3.geoPath().projection(projection);
		let layer = map.map.append('g').attr('transform', 'translate(-43.807, 414.802)')
		let defs = layer.append('defs');
		let settings = {
			'year': 3,
			'value': 'sum_all'
		}
		const size = d3.scaleSqrt().range([0, 4.5]).domain([0, 75]);
		let color;

		defs.append('mask')
			.attr('id', 'zone_mask')
			.append('rect')
			.attr('x', -4000)
			.attr('y', -4000)
			.attr('width', 721.44 + 8000)
			.attr('height', 1186.25 + 8000)
			.style('fill', 'white')

		// let pattern  = map.map.append('defs').append('pattern')
		// 	.attr('id', 'pattern')
		// 	.attr('x', 0)
		// 	.attr('y', 0)
		// 	.attr('width', 10)
		// 	.attr('height', 10)
		// 	.attr('patternUnits', 'userSpaceOnUse')
		// pattern.append('image')
		// 	.attr('xlink:href', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzEnLz4KPC9zdmc+Cg==')

		let pattern  = map.map.append('defs').append('pattern')
			.attr('id', 'pattern')
			.attr('width', 6)
			.attr('height', 6)
			.attr('patternUnits', 'userSpaceOnUse')
			.attr('viewBox', '0 0 6 6')
			// .attr
		pattern.append('line')
			.attr('x1', 0)
			.attr('y1', 1)
			.attr('x2', 8)
			.attr('y2', 1)
			.attr('style', 'stroke-width: 1px; stroke: rgb(230, 230, 230); stroke-linecap: square; shape-rendering: crispEdges')
		let zones = defs.select('mask');

		layer.append('rect')
			.attr('x', -4000)
			.attr('y', -4000)
			.attr('width', 721.44 + 8000)
			.attr('height', 1186.25 + 8000)
			.attr('fill', 'url(#pattern)')
			.attr('mask', 'url(#zone_mask)')
		let background = layer.append('g')
		let groups = layer.append('g').selectAll('circle')
			.data(stations.features)
			.enter()
			.append('g')
			.attr('transform', d =>  `translate(${projection(d.geometry.coordinates).join(', ')})`)

		let circles = groups.append('circle')
			.attr('id', d => 'station_' + d.properties.id)
			.attr('class', 'circle');
		let crowns = groups.filter(d => d.properties.transit)
			.append('circle')
			.attr('class', 'ring');
		let rings = groups.append('circle')
			.attr('class', 'ring');

		// let labels = groups.append('text')
		// 	.text(d => d.properties.address)

		let halo = zones.selectAll('circle')
			.data(stations.features)
			.enter()
			.append('circle')
			.attr('class', 'halo')
			.attr('cx', d => projection(d.geometry.coordinates)[0])
			.attr('cy', d => projection(d.geometry.coordinates)[1])


		let scales = {
			'opacity': d3.scaleLinear().domain([12, 14, 16]).range([1, 0.5, 0.1]).clamp(true),
			'pow': (value) => { return value / Math.pow(2, targetZoom - 10.5) },
			'size': (value) => {
				d3.scaleSqrt().range([0, 4.5]).domain([0, 50])(value) *
				d3.scaleLinear().domain([12, 16]).range([1, 0.2]).clamp(true)(targetZoom)
			}
		}
		let targetZoom = 10.5;
		let colors_colors = ['#e91e63', '#6a7b89', '#607d8b'].reverse();
		resize();
		redraw();
		redrawArea(stations.features.filter(feature => feature.properties.year[settings.year]));
		let delayedId;
		d3.select('div#basemap').on('mousewheel', event => {
			targetZoom = Math.max(10.5, Math.min(16.5, targetZoom - d3.event.deltaY / 100));
			delayedId = Math.random();
			let test = delayedId;
			setTimeout(() => {
				if(delayedId == test) {
					if(targetZoom == 10.5) {
						map.basemap.easeTo({	zoom: targetZoom	});
					}	else {
						map.basemap.easeTo({
							easing: d3.interpolateNumber(0, 1),
							duration: 500,
							center: [map.basemap.mouse.lng, map.basemap.mouse.lat],
							zoom: targetZoom
						});
					}
					resize();
				}
			}, 50);
		})
		let chartplot = d3.select('#chartplot');
		let chart = {
			scale: {
				x: d3.scaleLinear().range([0, 256]),
				y: d3.scaleLinear().range([256, 0])
			},
			getX(feature) {
				return this.scale.x(this.values[this.x].func(feature.properties))
			},
			getY(feature) {
				return this.scale.y(this.values[this.y].func(feature.properties))
			},
			set setX(i) {
				this.x = i;
				this.scale.x.domain(d3.extent(stations.features, feature => this.values[i].func(feature.properties)))
			},
			set setY(i) {
				this.y = i;
				this.scale.y.domain(d3.extent(stations.features, feature => this.values[i].func(feature.properties)))
			},
			resize() {
				this.scale.x.domain(d3.extent(stations.features, feature => this.values[this.x].func(feature.properties)))
				this.scale.y.domain(d3.extent(stations.features, feature => this.values[this.y].func(feature.properties)))
			},
			default(properties) {
				return properties[this.key][settings.year];
			}
		}
		chart.values = [
			{
				name: 'Количество слотов',
				'key': 'total_slots',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: 'Прибытий и отправлений',
				'key': 'sum_all',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: '... на буднях',
				'key': 'sum_workday',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: '... на выходных',
				'key': 'sum_weekend',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: 'Баланс прибытий и отправлений',
				'key': 'balance_all',
				'colors': ['#e91e63', '#c8c8c8', '#607d8b'],
				func: chart.default
			},
			{
				name: '... на буднях',
				'key': 'balance_workday',
				'colors': ['#e91e63', '#c8c8c8', '#607d8b'],
				func: chart.default
			},
			{
				name: '... на выходных',
				'key': 'balance_weekend',
				'colors': ['#e91e63', '#c8c8c8', '#607d8b'],
				func: chart.default
			},
			{
				name: 'Простой станции',
				'key': 'mean_all_interval',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: '... на буднях',
				'key': 'mean_workday_interval',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: '... на выходных',
				'key': 'mean_weekend_interval',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: 'Возвраты на ту же станцию',
				'key': 'percent_same_return',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				'name': 'Соотношение будни к выходным',
				'key': 'sum_type_ratio',
				'colors': ['#e91e63', '#c8c8c8', '#607d8b'],
				'func': chart.default
			},
			{
				name: 'Станций в радиусе 1 км',
				'key': 'nearest_1km',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: 'Станций в радиусе 2 км',
				'key': 'nearest_2km',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			},
			{
				name: 'Станций в радиусе 3 км',
				'key': 'nearest_3km',
				'colors': ['#e91e63', '#6a7b89', '#607d8b'].reverse(),
				func: chart.default
			}
		]
		// console.log(chart.values[0].func(stations.features[0].properties));
		// chart.values[1].func;
		chart.setX = 14;
		chart.setY = 1;
		let margin_x = chartplot.append('g')
			.attr('transform', 'translate(0, 256)')
			.on('mouseover', () => { margin_x.transition().style('opacity', 1) })
			.on('mouseleave', () => { margin_x.transition().style('opacity', 0); unfilter(); })
			.on('mousemove', function () {
				let min = Math.max(0, d3.event.offsetX - 24)
				let max = Math.min(254, d3.event.offsetX + 24)
				ticks_x.data([min, max])
					.attr('transform', d => 'translate(' + d + ', 0)')

				margin_x.select('rect')
					.attr('x', min)
					.attr('width', max - min)

				margin_x.selectAll('g:nth-child(3)')
					.select('text')
					.text(Math.round(chart.scale.x.invert(min)))

				margin_x.selectAll('g:nth-child(4)')
					.select('text')
					.text(Math.round(chart.scale.x.invert(max)))
				filter(chart.values[chart.x], min, max)
			})

		margin_x.append('rect')
			.style('fill', 'rgba(0, 0, 0, 0.1)')
			.attr('height', 255)
			.attr('y', -256)

		margin_x.append('rect')
			.attr('y', -256)
			.attr('width', 256)
			.attr('height', 256 + 32)
			.style('opacity', 0)

		let ticks_x = margin_x.selectAll(null)
			.data([0, 0])
			.enter()
			.append('g')
			.attr('transform', 'translate(0, 0)')

		ticks_x.append('line')
			.attr('y2', 12)
			.style('stroke', 'black')
			.style('shape-rendering', 'crispEdges')

		ticks_x.append('text')
			.attr('y', 24)
			.style('text-anchor', 'middle')
			.text(0)

		let dots = chartplot.append('g')
			.selectAll('circle')
			.data(stations.features)
			.enter()
			.append('circle')
			.attr('r', 1.5)

		d3.selectAll('.axis-list')
			.data(['x', 'y'])
			.on('change', function (d) {
				chart['set' + d.toUpperCase()] = parseInt(this.value);
				redrawChart();
			})
				.selectAll('option')
				.data(chart.values)
				.enter()
				.append('option')
				.attr('value', (d, i) => i)
				.property('selected', (d, i, a) => i == chart[a[0].parentNode.name.split('-')[0]])
				.text(d => d.name)

		redrawChart();
		d3.select('#timeline-container')
			.selectAll('button')
			.on('click', function () {
				d3.select('#timeline-container')
					.selectAll('button')
					.property('disabled', false)

				d3.select(this).property('disabled', true)
				settings.year = parseInt(this.name) - 2013;
				resize();
				redraw();
				redrawChart();
				redrawArea(stations.features.filter(feature => feature.properties.year[settings.year]));
				// updateLayers();
			})

		let modes = [
			{
				'name': 'Прибытий и отправлений',
				'key': 'sum_all'
			},
			{
				'name': 'Баланс прибытий и отправлений',
				'key': 'balance_all'
			}
		]
		let modes_current = 1;
		let selectors = d3.select('#graphs')
			.selectAll('div')
			.data(chart.values)
			.enter()
			.append('div')

		selectors.append('input')
			.attr('type', 'radio')
			.attr('name', 'mode')
			.attr('value', d => d.key)
			.attr('id', (d, i) => 'mode_' + i)
			.property('checked', (d, i) => i == modes_current)

		selectors.append('label')
			.attr('for', (d, i) => 'mode_' + i)
			.text(d => d.name);

		selectors.on('change', function (d, i) {
			modes_current = i
			settings.value = this.getElementsByTagName('input')[0].value
			colors_colors = d.colors
			redraw()
		})

		selectors.append('div')
			.style('height', '1px')
		function redrawChart() {
			chart.resize();
			dots.selectAll('circle')
				// .classed('hidden-dot', d => d.properties[chart.x][settings.year] && d.properties[chart.x][settings.year])

			dots.transition().duration(500)
				.attr('cx', d => chart.getX(d))
				.attr('cy', d => chart.getY(d))
				// .attr('r', d => chart.getX(d) && chart.getY(d) ? 1.5 : 0)
				// .attr('transform', d => `translate(${chart.getX(d)}, ${chart.getY(d)})`)

		}
		function filter(values, min, max) {
			redrawArea(stations.features.filter(d => values.func(d.properties) > chart.scale.x.invert(min) && values.func(d.properties) <= chart.scale.x.invert(max)), true);
			groups.filter(d => values.func(d.properties) > chart.scale.x.invert(min) && values.func(d.properties) <= chart.scale.x.invert(max))
				.classed('filtred', false)
			groups.filter(d => values.func(d.properties) <= chart.scale.x.invert(min) || values.func(d.properties) > chart.scale.x.invert(max))
				.classed('filtred', true)
		}
		function unfilter() {
    	d3.selectAll('.filtred').classed('filtred', false)
			redrawArea(stations.features.filter(feature => feature.properties.year[settings.year]));
		}
		function resize() {

			halo.attr('r', d => {
				if(d.properties.mean_all_departures[settings.year] != 0) {
					return d.properties.transit ? size(d.properties.mean_all_departures[settings.year]) + scales.pow(7) : size(d.properties.mean_all_departures[settings.year]) + scales.pow(3)
				}	else {
					return 0;
				}
			})
			circles//.transition().duration(500)
				.attr('r', d => d.properties.mean_all_departures[settings.year] != 0 ? size(d.properties.mean_all_departures[settings.year]) : 0)
				.style('opacity', scales.opacity(targetZoom));
			crowns//.transition().duration(500)
				.style('stroke-width', scales.pow(1.5) + 'px')
				.attr('r', d => d.properties.mean_all_departures[settings.year] != 0 ? size(d.properties.mean_all_departures[settings.year]) + scales.pow(3) : 0)

			rings//.transition().duration(500)
				.style('stroke-width', scales.pow(1.5) + 'px')
				.attr('r', d => d.properties.mean_all_departures[settings.year] != 0 ? Math.max(0, size(d.properties.mean_all_departures[settings.year]) - scales.pow(1.5)) : 0)

			pattern.transition().duration(500)
				.attr('patternTransform', `rotate(45) scale(${scales.pow(1)})`);

		}
		function redraw() {
			let a = stations.features.map(feature => feature.properties[settings.value][settings.year])
			a.sort((a, b) => a - b)
			// console.log(a);
			// a = a.filter(x => x < 120)
			color = d3.scaleSequential(d3.interpolateHcl('#607d8b', '#E91E63'))
				.domain([d3.min(a), d3.max(a)])

			// color = d3.scaleQuantile().range(['#e91e63', '#6a7b89', '#607d8b']).domain([d3.min(a), d3.max(a)])
				// .domain(d3.extent(stations.features, f => f.properties[settings.value][settings.year]))

			// a.forEach(x => {console.log(x)})
			// console.log();

			// console.log(color.domain());
			// color = d3.scaleLinear().range(['#607d8b','#7a8f9a','#93a2a9','#adb5b8','#c8c8c8','#d8a8ad','#e28493','#e75d7b','#e91e63'])
			// 	.domain([-25, -10, -3, -2, 2, 3, 10, 25]).clamp(true);


			// console.log(d3.range(0, 1, 1 / 10).concat([1]));
			// console.log(quantile);
			let array = stations.features.map(f => f.properties[settings.value][settings.year]);
			array = array.filter(x => x);
			array.sort((a, b) => a - b)
			let range = d3.range(0, 1, 1 / 20).concat([1])
			let quantile = range.map(step => d3.quantile(array, step));
			// let range = (() => {
			// 	let colors = ['#e91e63', '#c8c8c8', '#607d8b'];
			// 	let output = new Array();
			// 	let q = (quantile.length - 1) / 2;
			// 	let pos = q;
			// 	while (quantile[q] == quantile[pos] && pos < quantile.length) {
			// 		output.push(colors[1]);
			// 		pos++;
			// 	}
			// 	let colorsEnd = chroma.bezier([colors[1], colors[2]]).scale().colors(quantile.length - pos + 1)
			// 	colorsEnd.shift();
			// 	output = output.concat(colorsEnd);
			// 	pos = q - 1;
			// 	while (quantile[q] == quantile[pos] && pos >= 0) {
			// 		output.unshift(colors[1]);
			// 		pos--;
			// 	}
			// 	let colorsStart = chroma.bezier([colors[0], colors[1]]).scale().colors(pos + 2)
			// 	colorsStart.pop();
			// 	return colorsStart.concat(output);
			// })()
			// console.log(range);
			// console.log(quantile);
			// color = d3.scaleLinear().range(range).domain(quantile)
			range = range.map((k, i) => {
				let half = range.length / 2;
				let colors = JSON.parse(JSON.stringify(colors_colors));
				if(i < Math.floor(half)) {
					colors.pop();
					return chroma.bezier(colors).scale().colors(Math.ceil(half))[i];
				}	else if(i > Math.floor(range.length / 2)) {
					colors.shift();
					return chroma.bezier(colors).scale().colors(Math.ceil(half))[i - Math.floor(half)];
				}	else {
					return colors[1];
				}
			})
			color = d3.scaleLinear().range(range).domain(quantile)
			// color = d3.scaleQuantile().range(['#e91e63', '#6a7b89', '#607d8b'].reverse()).domain([d3.min(a), d3.max(a)])


			// color = d3.scaleLinear().range(['#e91e63', '#c8c8c8', '#607d8b']).domain([d3.min(a), d3.median(a), d3.max(a)])



			circles//.transition().duration(500)
				.style('fill', d => color(d.properties[settings.value][settings.year]))
				// .attr('r', d => size(d.properties.total_slots[settings.year]))

			crowns//.transition().duration(500)
				.style('stroke', d => color(d.properties[settings.value][settings.year]))
				// .attr('r', d => d.properties.total_slots[settings.year] != 0 ? size(d.properties.total_slots[settings.year]) + scales.pow(3) : 0)

			rings//.transition().duration(500)
				.style('stroke', d => color(d.properties[settings.value][settings.year]))
				// .attr('r', d => d.properties.total_slots[settings.year] != 0 ? size(d.properties.total_slots[settings.year]) - scales.pow(1.5) : 0)

		}
		d3.select('#sidebar').selectAll('div').remove();
		d3.select('#sidebar').node().appendChild(incoming[2].documentElement)
		d3.select('#sidebar').selectAll('text').style('font-family', null)
		d3.select('#sidebar').selectAll('tspan').style('font-family', null)
		// d3.select('#sidebar').selectAll('text')
		// 	.style('font-family', null)

		// d3.select('#sidebar').selectAll('tspan')
		// 	.style('font-family', null)
		function updateLayers() {
			let domain = color.domain();
			let colorSettings = {
				'property': settings.value,
				'type': 'interval',
				'default': 'white',
				'stops': d3.range(...domain, (domain[1] - domain[0]) / 10).concat(domain[1]).map(value => [value, color(value)])
			};
			let opacitySettings = {
				'property': 'year',
				'type': 'categorical',
				'default': 0,
				'stops': [[settings.year + 2013, 1]]
			}
			map.basemap.setPaintProperty('stations', 'circle-color', colorSettings);
			map.basemap.setPaintProperty('stations', 'circle-opacity', opacitySettings);
			map.basemap.setPaintProperty('directions', 'line-color', colorSettings);
			map.basemap.setPaintProperty('directions', 'line-opacity', opacitySettings);
		}
		function redrawArea(features, b) {
			let clusteredPoints = turf.clustersDbscan(
				turf.featureCollection(features.map(feature => turf.point(feature.geometry.coordinates))),
				1.5,
				{ minPoints: 1 }
			)
			let clusters = new Array();
			clusteredPoints.features.forEach(station => {
				let cluster = station.properties.cluster;
				clusters[cluster] ? clusters[cluster].push(station) : clusters[cluster] = [station];
			})

			let coverage_area = new Array();
			let coverage_line = new Array();
			let coverage_point = new Array();
			clusters.forEach(cluster => {
				let points = turf.featureCollection(
					cluster.map(station => turf.point(station.geometry.coordinates))
				);
				if(points.features.length > 2) {
					coverage_area.push(turf.concave(points, {'maxEdge': 2}))
					// coverage_area.push(turf.convex(points, {'concavity': 2}))
				}	else if(points.features.length == 2) {
					coverage_line.push(turf.lineString(
						points.features.map(point => point.geometry.coordinates)
					));
				}	else {
					coverage_point.push(points.features[0]);
				}
			})
			coverage_area = coverage_area.concat(coverage_line).concat(coverage_point).map(feature => {
				if(feature) {
					let buffer = turf.buffer(feature, 0.8, {steps: 0});
					return buffer;
				}	else {
					return false
				}
			});
			coverage_area = coverage_area.filter(feature => feature);
			zones.selectAll('path')
				.transition().duration(b ? 0 : 400).delay(200)
				.style('opacity', 0)
			zones.selectAll(null)
				.data(coverage_area)
				.enter()
				.append('path')
				.attr('class', 'coverage')
				.attr('d', d => geoPath(d).split('Z')[0] + 'Z')
				.style('opacity', 0)
				.transition().duration(b ? 0 : 600)
				.style('opacity', 1)
			// console.log(coverage_area.length + '\t' +  coverage_line.length + '\t' + coverage_point.length);
		}
		function printValues() {
			let year = 4;
			let func = d3.mean;
			let polygon;
			let input = stations.features.filter(feature => feature.properties.mean_all_departures[year] > 200)
			let answer = [
				'mean_all_departures',
				'mean_workday_departures',
				'mean_weekend_departures',
				'mean_all_returns',
				'mean_workday_returns',
				'mean_weekend_returns'

			].map(item => mean(item))
			// console.log(answer.join('\n'));

			// console.log(
			// 	stations.map(feature => (feature.properties.mean_all_departures[year] + feature.properties.mean_all_departures[year]) + '\t' + stations.reduce((prev, station) => {
			// 		return turf.distance(feature, station) < 3 ? prev + 1 : prev}, 0)
			// 	).join('\n')
			// );
			// console.log(
			// 	stations.features.map(feature => feature.properties.mean_all_interval[year] + '\t' + feature.properties.mean_workday_interval[year]).join('\n')
			// );
			// let station = stations.features[310].properties
			// console.log(station.nearest_1km[4].concat(station.nearest_2km[4]).concat(station.nearest_3km[4]).map(x => x.distance + '\t 0').join('\n'));
			// let a = station.nearest_1km[4].concat(station.nearest_2km[4]).concat(station.nearest_3km[4]).map(x => x.distance)
			// a.sort((a, b) => a - b)
			// console.log(a.map((x, i) => i + '\t' + x).join('\n'));



			function mean(key) {
				let result = input.reduce((prev, feature) => {
					let value = feature.properties[key][year];
					return value ? prev.concat([value]) : prev
				}, new Array())
				return func(result);
			}
		}
		/*
		let colors = incoming[2];
		let any = 0;
		d3.select('body').on('keypress', () => {
			any = parseInt(d3.event.key)
		})
		d3.select('#graphs')
			.style('display', 'flex')
			.style('align-content', 'flex-start')
			.style('flex', 1)
			.style('flex-wrap', 'wrap')
			// .style('width', '224px')
			.selectAll('div')
			.data(Object.keys(incoming[2]).reduce((prev, color) => {
				return prev.concat(Object.keys(colors[color]).reduce((prev, name) => {
					return prev.concat([colors[color][name]])
				}, new Array))
			}, new Array()))
			.enter()
			.append('div')
			.style('border', '1px solid white')
			.style('width', '16px')
			.style('height', '16px')
			.style('background-color', d => d)
			.on('click', function(d) {
				d3.select('#graphs').selectAll('div').style('border-color', 'white')
				d3.select(this).style('border-color', 'black')
				let range = color.range()
				range[any] = d;
				color.range(range);
				redraw();
				some
					.data(color.range())
					.style('background-color', d => d)
			})
		let some = d3.select('#graphss')
			.style('display', 'flex')
			.style('flex-wrap', 'wrap')
			.style('width', '224px')
			.selectAll('div')
			.data(color.range())
			.enter()
			.append('div')
			.style('width', '16px')
			.style('height', '16px')
			.style('box-sizing', 'border-box')
			.style('background-color', d => d)
			.on('click', function (d, i) {
				some.style('border', 'none')
				d3.select(this).style('border', '1px solid white')
				any = i;
			})
			*/
	}
)


Array.prototype.unique = function() {
    var a = [];
    for ( i = 0; i < this.length; i++ ) {
        var current = this[i];
        if (a.indexOf(current) < 0) a.push(current);
    }
    return a;
}

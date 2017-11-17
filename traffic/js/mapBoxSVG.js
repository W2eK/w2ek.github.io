
// var basemap;
// var time = 24;
// var container = basemap.getCanvasContainer();
// var offset = {
// 	'x': 0,
// 	'y': 0
// }
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



class TrafficMap extends Map {
	constructor(...incoming) {
		super({
			container: 'basemap',
			style: 'mapbox://styles/w2ek/ciwlswubv000t2qo508v4icpt',
			center: [30.315868,59.939095],
			zoom: 11.5,
			maxBounds: [[29.53125,59.74647966004178], [30.673828125,60.18710886319766]]
		}, incoming[2], {	'lon': 29.53125, 'lat': 60.18710886319766, 'z': 11})
		this.hour = 18;
		// this.colorScale = d3.scaleLinear().domain([10, 20, 30, 45, 60]).range(['#191919', '#192069', '#41199E', '#D500F9', '#FFFFFF']).clamp(true)
		this.transformMisc(incoming[1], incoming[3]);
		this.joinData(incoming[0]);
		this.meanValues = this.getMeanValues(this.map.selectAll('.paths'));
		this.moveMap();
		this.moveMapEnd();
		// this.redrawMap(1500);
		this.addListiners();
		d3.select('#loading').remove();
		// console.log(JSON.stringify(this.meanValues[24]));
		// for(let i = 0; i < 24; i++) {
		// 	console.log(JSON.stringify(this.meanValues[i]));
		// }
	}
	joinData(data) {
		this.data = data;
		// let labelsData = new Array();
		for(let id in this.data) {
			let path = this.data[id];
			// d3.select('rect').remove();
			// -------- Calculate missing data --------
			path.type == 'link' ? path.speed = this.data[path.to].speed : null
			path.type == 'filler' ? path.speed = this.data[path.from].speed : null

			// -------- Join Data to Paths --------
			if(path.type == 'smooth' || path.type == 'link') {
				let childs = getChilds(d3.select('#' + id));
				let incriments = new Array();
				for(let i = 0; i < childs.length - 1; i++) {
					let speed = new Array();
					for(let j = 0; j < path.speed.length; j++) {
						i == 0 ? incriments[j] = (path.speed[j] - this.data[path.from].speed[j]) / childs.length : null
						speed[speed.length] = this.data[path.from].speed[j] + incriments[j] * i;
					}
					joinData2Path(childs[i], speed, false);
				}
				joinData2Path(childs[childs.length - 1], path.speed, path.type == 'smooth', path.length);
			}	else {
				joinData2Path(d3.select('#' + id), path.speed, path.type == 'solid', path.length);
			}
			if(path.mask) {
				d3.select('#' + id).attr('mask', 'url(#' + path.mask + ')');
			}

			// -------- Join Data to Arrows --------
			if(path.oneway) {
				let idNum = id.split('_')[1];
				if(d3.select('#arrow_' + idNum).node() != null) {
					d3.select('#arrow_' + idNum).datum(path.speed)
				}
			}
			// -------- Join Data to Labels --------

			if(path.label) {
				let datum = d3.select('#' + path.label).datum();
				path.speed.forEach((d, i) => {
					datum.speed[i] = datum.speed[i] ? datum.speed[i] += d : d
				})
				datum.counter++
			}
		}
		d3.selectAll('.labels').datum((d) => {
			let a = new Array();
			d.speed.forEach((s, i) => {
				a[i] = s / d.counter;
			})
			return a;
		})
		function joinData2Path(selection, speed, checker, length) {
			let data = new Object();
			data.length = checker ? length : false
			data.speed = speed;
			data.speed[24] = Math.round(d3.mean(speed));
			// data.mean = d3.mean(speed);
			data.bbox = selection.node().getBBox();
			selection.datum(data);
		}
		function getChilds(selection) {
			let a = new Array();
			selection.selectAll('path, line, polyline').each(function () {
				a[a.length] = d3.select(this);
			})
			return a;
		}
	}
	transformMisc(names, arrowShape) {
		// this.names = names;
		let that = this;
		let defs = this.map.append('defs');
		this.map.node().insertBefore(defs.node(), this.map.node().childNodes[0]);

		// -------- Make Masks --------
		let bbox = this.map.select('.bbox');
		let masks = this.map.selectAll('.masks')
			.each(function () {
			let path = d3.select(this);
			let mask = defs.append('mask').attr('id', path.attr('id'));
			path.attr('id', null);
			mask.node().appendChild(bbox.node().cloneNode(true));
			mask.node().appendChild(path.node());
		})
		bbox.remove();

		// -------- Make Labels --------
		let labelPaths = this.map.selectAll('.labels')
			.attr('class', 'labelPaths')
			.each(function () {
				let path = d3.select(this);
				if(path.node().tagName == 'polyline') {
					let s = path.node().outerHTML
						.replace(/(<polyline[\w\W]+?)points=([''])([\.\d, ]+?)([''])/g, '$1d=$2M$3$4')
						.replace(/poly(gon|line)/g, 'path');
					path.html(s);
					let inside = path.select('path');
					path = inside;
					d3.select('polyline' + '#' + path.attr('id')).remove();
				}
				if(path.node().tagName == 'line') {
					let s = path.node().outerHTML
						.replace('x1=\'', 'd=\'M')
						.replace('\' y1=\'', ',')
						.replace('\' x2=\'', ' ')
						.replace('\' y2=\'', ',')
						.replace(/line/g, 'path');
					path.html(s);
					let inside = path.select('path');
					path = inside;
					d3.select('line' + '#' + path.attr('id')).remove();
				}
				let id = path.attr('id').split('_');
				path.attr('id', 'labelPaths_' + id[1]);
				defs.node().append(path.node());
				let labelKnockout = d3.select('#knockouts')
					.append('text')
					.attr('id', 'labelKnockout_' + id[1])
					.attr('class', 'labelKnockouts');

				labelKnockout.append('textPath')
					.attr('startOffset', '50%')
					.attr('xlink:href', '#labelPaths_' + id[1])
					.text(names[id[0] + '_' + id[1]]);
				let label = d3.select(labelKnockout.node().cloneNode(true));
				label.attr('class', 'labels')
					.datum({
						'counter': 0,
						'speed': new Array(25)
					})
					.attr('id', id[0] + '_' + id[1]);
				that.map.select('#labels').node().appendChild(label.node());
			})

		// -------- Make Place's labels --------
		let places = this.map.selectAll('.places')
			.each(function () {
				let place = d3.select(this);
				let id = place.attr('id').split('_');
				let text = that.map.select('#labels').append('text')
					.attr('class', 'places')
					.attr('x', place.attr('cx'))
					.attr('y', place.attr('cy'))
					.attr('id', id[0] + '_' + id[1])
					.text(names[id[0] + '_' + id[1]]);

				let clone = d3.select(text.node().cloneNode(true));
				clone.attr('class', 'places_knockout')
					.attr('id', 'places_knockout_' + id[1]);

				that.map.select('#knockouts').node().appendChild(clone.node());
			})
		places.remove();

		// -------- Make Arrows --------
		let arrows = this.map.selectAll('.arrows')
			.each(function () {
				let line = d3.select(this);
				let clone = arrowShape.documentElement.cloneNode(true);
				let center = d3.select(clone).select('circle');
				let id = line.attr('id').split('_')
				let x1 = parseFloat(line.attr('x1'));
				let x2 = parseFloat(line.attr('x2'));
				let y1 = parseFloat(line.attr('y1'));
				let y2 = parseFloat(line.attr('y2'));
				let cx = parseFloat(center.attr('cx'));
				let cy = parseFloat(center.attr('cy'));
				line.remove();
				let sector = function () {
					if(y1 < y2) {
		        return 180;
		      }  else {
		        if(x1 > x2) {
		          return 360;
		        }	else {
							return 0;
						}
		      }
				}();
				let angle =  Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 90;
				let g = that.map.select('#arrows')
					.append('g')
					.attr('id', id[0] + '_' + id[1])
					.attr('class', 'arrows')
					.attr('transform', 'translate(' + ((x1 + x2) / 2) + ',' + ((y1 + y2) / 2) + ')' + 'rotate(' + angle + ') translate(' + (-cx) + ',' + (-cy) + ')');

				center.remove();
				let arrow = d3.select(clone).select('svg > *')
				g.node().appendChild(arrow.node());
			})

		// -------- Make Blur --------
		// this.filterMask = defs.append('rect')
		// 	.attr('id', 'sideFilterMask')
		// 	.attr('width', 5000)
		// 	.attr('height', 5000)
		// this.filter = defs.append('filter').attr('id', 'sideFilter')
		// this.filter.append('feGaussianBlur')
		// 	.attr('color-interpolation-filters', 'sRGB')
		// 	.attr('stdDeviation', 10)
		// 	.attr('result', 'SIDEFILTERBLUR')
		//
		// this.filter.append('feImage')
		// 	.attr('id', 'sideFilterFeImage')
		// 	.attr('link:href', '#sideFilterMask')
		// 	.attr('result', 'SIDEFILTERMASK')
		//
		// this.filter.append('feComposite')
		// 	.attr('in2', 'SIDEFILTERMASK')
		// 	.attr('in', 'SIDEFILTERBLUR')
		// 	.attr('operator', 'in')
		// 	.attr('result', 'SIDEFILTERCOMP')
		//
		// this.filter.append('feMerge')
		// 	.attr('result', 'SIDEFILTERMERGE')
		// 		.append('feMergeNode')
		// 		.attr('in', 'SourceGraphic')
		//
		// this.filter.select('feMerge')
		// 	.append('feMergeNode')
		// 	.attr('in', 'SIDEFILTERCOMP')
		//
		// this.map.select('#paths').style('filter', 'url(#sideFilter)')
	}
	redrawMap(duration, delay = 1) {
		// TrafficMap.transition
		setTimeout(() => {
			let transition = d3.transition().duration(duration);
			this.hidden
			.style('stroke', (d) => this.colorScale(d.speed[this.hour]));

			this.map.selectAll('.closed').transition(transition)
			.style('stroke', this.colorScale(0));

			this.map.selectAll('.squares').transition(transition)
			.style('fill', this.colorScale(0));

			this.map.selectAll('.places').transition(transition)
			.style('fill', uiColors[2]);

			this.paths.transition(transition)
			.style('stroke', (d) => this.colorScale(d.speed[this.hour]));

			this.map.selectAll('.arrows').transition(transition)
			.style('fill', (d) => this.colorScale(d[this.hour]));

			this.map.selectAll('.labels').transition(transition)
			.style('fill', (d) => this.colorScale(d[this.hour]));
		}, delay)
	}
	addListiners() {
		this.basemap.on('moveend', () => {
			this.moveMapEnd();
		});
		d3.select('body').on('keydown', () => {
			// console.log(d3.event.keyCode);
			switch (d3.event.keyCode) {
				case 221:
					this.hour = this.hour == 24 ? 0 : this.hour += 1
					this.redrawMap(1000);
					console.log(this.hour);
					break;
				case 219:
					this.hour = this.hour == 0 ? 24 : this.hour -= 1
					this.redrawMap(1000);
					console.log(this.hour);
					break;
			}
		})
	}
	moveMapEnd() {
		let that = this;
		this.map.selectAll('.paths').each(function (d) {
			if(d.bbox.x + d.bbox.width < that.offset.x ||
				d.bbox.x > that.offset.x + that.width / that.z ||
				d.bbox.y + d.bbox.height < that.offset.y ||
				d.bbox.y > that.offset.y + that.height / that.z) {
				d3.select(this).attr('class', 'hiddenPaths')
			}
		})
		this.map.selectAll('.hiddenPaths').each(function (d) {
			if(d.bbox.x + d.bbox.width > that.offset.x &&
				d.bbox.x < that.offset.x + that.width / that.z &&
				d.bbox.y + d.bbox.height > that.offset.y &&
				d.bbox.y < that.offset.y + that.height / that.z) {
				d3.select(this).attr('class', 'paths')
			}
		})
		this.paths = this.map.selectAll('.paths');
		this.hidden = this.map.selectAll('.hiddenPaths');
	}
	getMeanValues(selection) {
		let a = new Array();
		for(let i = 0; i < 25; i++) {
			a[i] = new Array();
			for(let j = 0; j < 110; j++) {
				a[i][j] = 0;
			}
		}
		selection.each((d) => {
			if(d.length) {
				d.speed.forEach((value, i) => {
					if(i != 24) {
						a[i][Math.max(0, Math.round(value))] += d.length;
						a[24][Math.max(0, Math.round(value))] += d.length;
					}
				})
			}
		})
		// for(let i = 0; i < 25; i++) {
		// 	let n = new Array();
		// 	for(let j = 0; j < 90; j++) {
		// 		n[j] = a[i].lengths[j] /
		// 		a[i].lengths[j] = 0;
		// 		a[i].counters[j] = 0;
		// 	}
		// }
		return a;
	}
}

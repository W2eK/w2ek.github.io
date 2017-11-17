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
		this.basemap.on('mousemove', (e) => {
			this.basemap.mouse = e.lngLat;
		})
		this.basemap.on('move', () => {
			this.moveMap();
		});
		this.moveMap()
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
	converter(n, t) {
		if(n.constructor !== Array) {
			return this.offset[t] + n / this.z;
		}	else {
			return [
				this.converter(n[0], 'x'),
				this.converter(n[1], 'y')
			]
		}
	}
}

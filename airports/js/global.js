// bbox = [-30.1,32.2,60.1,71.6]; //Europe
// bbox = [-131.2,23.0,-64.7,53.5]; //USA
// bbox = [-180, -55, 180, 75]; // World
// bbox = [-10,30,50,65]; // Small Europe
const global = {
	basemap: d3.select('svg#basemap'),
	bbox: [-30.1,32.2,60.1,71.6], // Europe
	// bbox: [-180, -55, 180, 75], // World
	direction: true,
	date: '181210'
};
global.projection = d3.geoEckert1()
	.fitSize([window.innerWidth, window.innerHeight],
		turf.featureCollection([
			turf.point(global.bbox.slice(0, 2)),
			turf.point(global.bbox.slice(2))
		])
	)

global.geoPath = d3.geoPath(global.projection);
global.lineGen = d3.line().curve(d3.curveCatmullRom)
global.smoothPath = function(feature) {
	const polygon = polygon => global.lineGen(polygon.map(global.projection));
	const multipolygon = multipolygon => multipolygon.map(polygon).join('Z');
	const {coordinates, type} = feature.geometry;
	if(type === 'MultiPolygon') {
		return coordinates.map(multipolygon)
	} else if(type === 'Polygon') {
		return coordinates.map(polygon)
	} else {
		return global.lineGen(coordinates.map(global.projection))
	}
}
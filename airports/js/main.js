import {airports} from './airports.js';
import {Component} from './utils.js';
//1. Map hover
//2. Map click
//3. Date selection
//4. Controls
//---Bonus---------
//5. Label Placement
//6. Different zooms
const border = new Component(global.basemap.insert('g', 'g'), d3.json('../maps/natural earth/borders_50m.geojson'), 'path', sel => sel.attr('class', 'border').attr('d', global.smoothPath))
const land = new Component(global.basemap.insert('g', 'g'), d3.json('../maps/natural earth/land_50m.geojson'), 'path', sel => sel.attr('class', 'border').attr('d', global.smoothPath))


global.basemap.on('mousemove', () => {
    const r = 30;
    const {x, y} = d3.event;
    airports.emit('mousemove', {x, y, r})
}).on('wheel', () => {
    airports.emit('changeDate', d3.event.wheelDeltaY > 0)
}).on('click', () => {
    airports.emit('click')
})


//_____________________________________
//__________ Initizalization __________
// const basemap = d3.select('svg');
/*
const bbox = [-10,30,50,65]; // Small Europe
const projection = d3.geoEckert1()
	.fitSize([window.innerWidth, window.innerHeight],
		turf.featureCollection([
			turf.point(bbox.slice(0, 2)),
			turf.point(bbox.slice(2))
		])
    )
*/
/*
const airports = {
    view: new AirportsView(basemap.append('g')),
    model: new AirportsModel(Promise.all([
        d3.csv('../data/sample.csv'),
        d3.json('../data/airports.geojson')
    ]), true)
}
//____________________________________
//__________ Event Handlers __________
airports.model.on('loaded', airports.view.init.bind(airports.view))
basemap.on('mousemove', () => {
    if(!basemap.clicked) {
        const {x, y} = d3.event;
        // const origins = airports.model.handleMouseMove(x, y, 30);
        airports.view.handleMouseMove(
            airports.model.handleMouseMove(x, y, 30)
        )
    }
})
*/

// return {airports}
// console.log(AirportsModel)
/*
import {Component} from './component.js';
//_____________________________________
//__________ Initizalization __________



//___________________________________
//__________ Fetching Data __________
Promise.all([d3.csv('../data/sample.csv'), d3.json('../data/airports.geojson')])
    .then(res => airports.handleData.call(airports, res, projection))


//_______________________________________
//__________ Making Components __________
const dots = new Component(svg.append('g'));

//_________________________________________
//__________ Set Event Listener  __________
airports.on('loaded', (data) => {
    dots.bind(data, 'g')
        .attr('class', 'container')
        .attr('id', d => d.code)
        .sort((a, b) => a.quantile - b.quantile)
    dots.selection.append('circle')
        .attr('class', 'circle')
    dots.selection.append('text')
        .attr('class', 'label')
        .text(d => d.name)
})
*/
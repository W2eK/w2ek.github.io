import {EventEmitter, Model, View} from './utils.js';

// ___________________________________
// ________ Working with data ________
const model = new Model(Promise.all([
	d3.csv('data/flights.csv'),
	d3.json('data/airports.geojson')
]));

model.handleData = function(data) {
	const [flights, airports] = data;
	this.dates = new Set();
	flights.forEach(flight => this.dates.add(flight.date));
	this.dates = [...this.dates]
	this.i = 0;
	this.flights = d3.rollup(flights, d => parseInt(d[0].price) || NaN, d => d.from, d => d.to, d => d.date)
	this.airports = airports.features.reduce((map, d) => {
		const coordinates = d.geometry.coordinates;
		const position = global.projection(coordinates)
		const obj = {
			...d.properties,
			coordinates,
			position
		}
		map.set(obj.code, obj)
		return map;
	}, new Map())
	const rollout = (a) => {
		if(this.flights.has(a[0])) {
			return this.flights.get(a[0]).get(a[1])
		}
	}
	this.airports.forEach(d => {
		d.connections = new Set(
			d.connections.map(code => this.airports.get(code))
		)
		const point_a = turf.point(d.coordinates)
		d.prices = new Map([...d.connections].map(x => {
			const point_b = turf.point(x.coordinates)
			return [x, {
				true: rollout([d.code, x.code]) || new Map(),
				false: rollout([x.code, d.code]) || new Map(),
				angle: turf.bearing(point_a, point_b),
				dist: turf.distance(point_a, point_b)
			}]
		}))
	})
	this.origins = new Set();
	this.targets = new Set();
	const arr = [...this.airports].map(pair => pair[1])
		.sort((a, b) => b.quantile - a.quantile)
	this.quadtree = d3.quadtree()
		.x(d => d.position[0])
		.y(d => d.position[1])
		.addAll(arr)
	view.init(arr)
}
model.search = function(x, y, r) {
	const [x0, y0, x3, y3] = [x - r, y - r, x + r, y + r];
	let arr = [];
	this.quadtree.visit(function(node, x1, y1, x2, y2) {
		if (!node.length) {
			do {
				var d = node.data;
				if((d.position[0] >= x0) && (d.position[0] < x3) && (d.position[1] >= y0) && (d.position[1] < y3)) arr.push(d)
			} while (node = node.next);
			}
			return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
	});
	// arr = arr.map(d => { d.dist = Math.sqrt((d.location[0] - x) ** 2 + (d.location[1] - y) ** 2); return d})
	// 	.sort((a, b) => a.dist - b.dist)
	// 	.filter(d => d.dist < radius);
	// arr.length = Math.min(arr.length, 3)
	return new Set(arr);
}
model.handleMouseMove = function(x, y, r) {		
	// Deal with changes in origins
	const old_origins = this.origins;
	const new_origins = this.search(x, y, r);
	const origin_intersection = split(new_origins, old_origins);
	this.origins = new Set([...origin_intersection, ...new_origins]);

	// Deal with changes in targets
	this.targets = new Set();
	const old_targets = new Set();
	const new_targets = new Set();
	new_origins.forEach(d => d.connections.forEach(d => new_targets.add(d)));
	old_origins.forEach(d => d.connections.forEach(d => old_targets.add(d)));
	origin_intersection.forEach(d => d.connections.forEach(d => this.targets.add(d)));
	const modified_targets = split(old_targets, new_targets);
	this.targets.forEach(d => {
		const a = new_targets.has(d);
		const b = old_targets.has(d);
		if(a || b) {
			this.targets.delete(d);
			modified_targets.add(d)
		}
		if(a) new_targets.delete(d);
		if(b) old_targets.delete(d);
	})
	this.targets = new Set([...this.targets, ...modified_targets, ...new_targets]);
	[...modified_targets, ...new_targets].forEach(d => {
		d.flights = [...this.origins].filter(x => d.connections.has(x)).map(x => x.prices.get(d));
		const prices = d.flights.filter(direction => direction[global.direction].has(global.date));
		d.color = prices.length ?  colorScale(d3.min(prices.map(x => x[global.direction].get(this.dates[this.i])))) : 'rgb(200, 200, 200)'
	})
	// view.changeColor(modified_targets)
	// view.changeColor(new_targets)
	// view.changeState(new_origins, 'origin')
	// view.changeState(old_origins, -'origin')
	// view.changeState([...new_origins, old_origins, new_targets])
	return { new_origins, old_origins, old_targets, new_targets, modified_targets }
	function split(a, b) {
		const result = new Set();
		if(a.size > 0 && b.size > 0) {
			a.forEach(d => {
				if(b.has(d)) {
					result.add(d)
					a.delete(d)
					b.delete(d)
				}
			})
		}
		return result
	}
	
}

model.changeDate = function() {
	this.targets.forEach(d => {
		d.flights = [...this.origins].filter(x => d.connections.has(x)).map(x => x.prices.get(d));
		const prices = d.flights.filter(direction => direction[global.direction].has(global.date));
		d.color = prices.length ?  colorScale(d3.min(prices.map(x => x[global.direction].get(this.dates[this.i])))) : 'rgb(200, 200, 200)'
	})
	return this.targets
}


// __________________________________
// ________ Working with svg ________
const colorScale = d3.scaleLinear()
	.domain([1000, 2000, 3000, 4000, 5000, 6000, 7000])
	.range(['#D50000', '#E91E63', '#8E24AA', '#512DA8', '#283593', '#0D47A1', '#014174'])
	.clamp(true)

const view = new View(global.basemap.append('g'));
view.init = function(data) {
	const map = new Map();
	this.selection = this.parent.selectAll()
		.data(data)
		.enter()
		.append('g')
		.attr('class', 'container')
		.attr('id', d => d.code)
		.on('click', console.log)
	this.selection.append('circle')
		.attr('class', 'point')
	this.selection.append('text')
		.attr('class', 'label')
		.selectAll()
		.data(d => d.name.split('\n'))
		.enter()
		.append('tspan')
		.text(d => d)
		.attr('x', 0)
		.attr('dy', (d, i) => i > 0 ? i * 1 + 'em' : null)
	const quadtree = d3.quadtree()
		.x(d => !d.next ? d.left : d.right)
		.y(d => !d.next ? d.top : d.bottom)
	this.selection.each(function(d) {
			const node = d3.select(this);
			d.circle = node.select('cirlce.point')
			d.labels = node.selectAll('tspan')
			const spans = [];
			d.labels.each(function() { spans.push(this.getComputedTextLength())})
			const boxes = [
				[...d.position.map(n => n - 3), ...d.position.map(n => n + 3)],
				...spans.map((n, i) => {
					const [x, y] = d.position;
					const w = n / 2 + 2;
					const h = 10;
					// return [x - w, y + i * h + 5, x + w, y + (i + 1) * h + 2]
					return [x - w, y + i * h + 5, x + w, y + (i + 1) * h + 2]
				})
			].map(d => ({left: d[0], top: d[1], right: d[2], bottom: d[3]}))
			map.set(d, d3.select(this))
			d.visible = d.quantile > 20 && boxes.every(box => checkPlacement(box));
			if(d.visible) {
				boxes.forEach(box => {
					quadtree.add(box);
					box.next = true;
					quadtree.add(box);
				})
			}
			/*
			node.insert('g', 'circle')
				.selectAll()
				.data(boxes)
				.enter()
				.append('rect')
				.attr('x', x => x.left - d.position[0])
				.attr('y', x => x.top - d.position[1])
				.attr('width', x => x.right - x.left)
				.attr('height', x => x.bottom - x.top)
				// .style('opacity', 0.15)
				// .style('fill', d.visible ? 'blue': 'red')
			*/
		})
	this.selection
		// .classed('hidden', d => !d.visible)
		.style('pointer-events', d => d.visible ? 'auto' : 'none')
		.style('transform', d => `translate(${d.position.map(Math.round).join('px,')}px)`)
		.classed('container', true)
		.sort((a, b) => a.quantile - b.quantile)
	const layer = global.basemap.append('hidden').node()
	this.selection.filter(d => !d.visible ||
		d.position[0] < 0 ||
		d.position[1] < 0 ||
		d.position[0] > window.innerWidth ||
		d.position[1] > window.innerHeight).each(function(d) {		
		layer.appendChild(this)
	})
	function checkPlacement(box) {
		let intersected = false
		const offset = 10;
		quadtree.visit((node, left, top, right, bottom) => {
			if(!node.length) {
				do {
					const d = node.data;
					const b = !(box.left >= d.right || box.right <= d.left || box.top >= d.bottom || box.bottom <= d.top);
					if(!intersected) intersected = b;
				} while(node = node.next)
			}
			return (box.left - offset) > right || (box.top - offset) > bottom || (box.right + offset) < left || (box.bottom + offset) < top || intersected;
			return box.left > right || box.top > bottom || box.right < left || box.bottom < top || intersected;
			return intersected;
		})
		return !intersected
	}
	this.map = map
}
view.color = (sel, color = null) => sel.style('fill', color)
view.state = (sel, className, state = false) => sel.classed(className, state)
view.modify = function(set, func, ...args) {
	set.forEach(key => {
		if(key.visible) {
			func(this.map.get(key), ...args)
		} else {
			window.requestIdleCallback(() => {
				func(this.map.get(key), ...args)
			})
		}	
	})
}
/*
view.changeColor = function(set) {
	set.forEach(key => {
		this.map.get(key).style('fill', d => d.color)
	})
}
view.changeState = function(set, state) {
	console.log(state)
	set.forEach(key => {
		const node = this.map.get(key);
		// node.attr('class', )
	})
}
view.resetState = function(set, className) {
	this.plunk(set, sel => {
		sel.classed(className, false)
	})
}
view.plunk = function(set, func) {
	set.forEach(key => func(this.map.get(key)))
}
*/
// __________________________________
// ________ Handling Events ________
export const airports = new EventEmitter();
airports.on('mousemove', (props) => {
	const {x, y, r} = props;	
	const { new_origins, old_origins, old_targets, new_targets, modified_targets } = model.handleMouseMove(x, y, r)
	view.modify(new_origins, view.state, 'origin', true);
	view.modify(old_origins, view.state, 'origin');
	view.modify(new_targets, view.color, d => d.color);
	view.modify(modified_targets, view.color, d => d.color);
	view.modify(old_targets, view.color);
})

airports.on('changeDate', dir => {
	model.i += dir ? -1 : 1
	model.i = Math.max(0, Math.min(model.dates.length - 1, model.i))
	console.log(model.dates[model.i])	
	view.modify(model.changeDate(), view.color, d => d.color);
})

global.airports = model;
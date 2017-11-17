let colors = {
	'yellow': {
		'main': '#ff9800',
		'secondary': '#ef6c00',
		// 'shaded': '#bf360c'
		'shaded': '#8f2909'
	},
	'blue': {
		'main': '#03a9f4',
		'secondary': '#0277bd',
		// 'shaded': '#01579b'
		// 'main': '#9C27B0',
		'shaded': '#013761'
	},
	'grey': '#263238'
}
let tails = {
	'nodes': new Array(),
	'routes': new Array()
}

class TransportMap extends Map {
	constructor(...incoming) {
		class List extends Array {
			constructor(Constructor, sel, parent) {
				super();
				sel.each((d, i, a) => {
					this.push(new Constructor(d3.select(a[i]), parent))
				})
			}
			update() {
				this.forEach(function (o) { 	o.update();	})
			}
		}
		class NodeList extends List {
			constructor(Constructor, sel, parent) {
				parent.map.insert('g', '#node_layer').attr('id', 'halo_layer');
				createShadow({'x': 0, 'y': 4, 'b': 1}, parent.defs, 'pointShadow');
				super(Constructor, sel, parent);
			}
		}
		class Node {
			constructor(point, parent) {
				this.parent = parent;
				this.zoom = parent.z
				this.inside = parent.inside;
				this.point = point;
				this.id = point.attr('id');
				// this.point.attr('r')
				this.data = parent.data.nodes[this.id];
				this.halo = d3.select(
					Node.haloLayer.node().appendChild(
						point.node().cloneNode(true)
					)
				);
				this.halo.attr('class', 'halo')
					.attr('id', null)


				point.attr('filter', 'url(#pointShadow)')
					// .on('mouseover', () => {
						// console.log(this.id);
						// console.log(this.data.directions.duration);
						// console.log(this.data.directions.inbound.fastest[0].length);
						// console.log(this.data.directions.outbound.fastest[0].length);
						// console.log('');
					// })
			}
			update() {
				let scale = this.parent.resized ? 2 : 1;
				// if(this.any) {
				// 	this.halo.attr('r', Node.scale(this.data.distance, this.zoom, 100))
				// }
				// this.halo.attr('r', this.data.pinned ? 16 : Node.scale(this.data.distance, this.zoom, 100))
				// this.halo.attr('r', Node.scale(this.data.distance, this.zoom, 100))
				// this.halo.attr('r', !this.any ? 0 : Node.scale(this.data.distance, this.zoom, 100))
				this.halo.attr('r', !this.any ? 0 : this.data.pinned ? 16 * scale : Node.scale(this.data.distance, this.zoom, 100))
				if(this.updated) {
					this.data.pinA.update = false;
					this.data.pinB.update = false;
					this.data.update = false;
					this.redraw();
				}
			}
			redraw() {
				let scale = this.parent.resized ? 2 : 1;
				let fill;
				let delay = 0;
				// let delay = this.data.pinA.active ? this.data.pinA.delay * 12 : this.data.pinB.delay * 12
				if(this.active) {
					fill = this.data.pinA.active ? colors.yellow.main : colors.blue.main
				}	else if(this.selected) {
					fill = this.data.pinA.selected ? colors.yellow.shaded : colors.blue.shaded
				}	else {
					fill = colors.grey;
					delay = 0;
				}
				if(delay != 0) console.log(delay);
				// let scale = d3.line
				this.halo.transition().delay(delay)
					.style('fill', fill)
				this.point.transition().delay(delay)
					.style('fill', this.data.pinned ? 'white' : colors.grey)
					.attr('r', this.data.pinned ? 5 * scale : 0)
					// .attr('r', this.data.size * 2)
			}
			get any() {
				return this.active || this.selected || this.data.pinned
			}
			get selected() {
				return this.boolean('selected');
			}
			get active() {
				return this.boolean('active');
			}
			get updated() {
				return this.boolean('update') || this.data.update;
			}
			boolean(boolean) {
				return this.data.pinA[boolean] || this.data.pinB[boolean]
			}
			static get haloLayer() {
				return d3.select('#halo_layer');
			}
			static scale(x, z, r) {
				return d3.scaleLinear().range([0, 16]).domain([200, 50]).clamp(true)(x);
			}
		}
		class Link {
			constructor(seg, parent) {
				this.parent = parent;
				this.layer = parent.map.select('#link_layer');
				this.overlay = parent.map.select('#link_overlay')
				this.bottom = this.layer.select('#bottom-line').node()
				this.upper = this.layer.select('#upper-line').node()
				this.main = seg;
				// this.main.appendShadow({'x': 0, 'y': 0, 'b': 0}, parent.map.select('defs'));
				this.id = seg.attr('id');
				this.data = parent.data.links[this.id];
				this.d = this.main.attr('d')
				this.d1 = this.main.attr('d1')
				this.d2 = this.main.attr('d2')
				this.main
					.attr('d1', null)
					.attr('d2', null)
				// this.main.on('mouseover', () => {})

				this.twin = false;
			}
			update() {
				if(this.updated) {
					this.data.pinA.update = false;
					this.data.pinB.update = false;
					// if(!this.twin && this.data.pinA.selected && this.data.pinB.selected) {
					if(!this.twin && this.both) {
						this.twin = true;
						this.split();
					}
					// if(this.twin && (this.data.pinA.selected != this.data.pinB.selected)) {
					if(this.twin && !this.both) {
						this.twin = false;
						this.join();
					}
					this.reorder();
					this.redraw();
				}
			}
			redraw() {
				let scale = this.parent.resized ? 3 : 1;
				let styles = {
					'linkA_active': (transition, path) => {
						transition
						.style('stroke', colors.yellow.main)
						.style('stroke-width', 2.5 * scale + 'px')
						.attr('d', path)
					},
					'linkB_active': (transition, path) => {
						transition
						.style('stroke', colors.blue.main)
						.style('stroke-width', 2.5 * scale  + 'px')
						.attr('d', path)
					},
					'linkA_selected': (transition, path) => {
						transition
						.style('stroke', colors.yellow.shaded)
						.style('stroke-width', 2.5 * scale  + 'px')
						.attr('d', path)
					},
					'linkB_selected': (transition, path) => {
						transition
						.style('stroke', colors.blue.shaded)
						.style('stroke-width', 2.5 * scale  + 'px')
						.attr('d', path)
					},
					'default': (transition, path) => {
						transition
						.style('stroke', colors.grey)
						.style('stroke-width', 2.5 * scale  + 'px')
						.attr('d', path)
					}
				}

				// let ratio = this.data.active ? 0 : 12
				let ratio = 12 / scale;
				if(!this.twin) {
					let func, delay, shadow;
					delay = this.data.pinA.selected ? this.data.pinA.delay * ratio : this.data.pinB.delay * ratio
					if(this.active) {
						func = this.data.pinA.active ? 'linkA_active' : 'linkB_active'
						shadow = true;
					}	else if(this.selected) {
						func = this.data.pinA.selected ? 'linkA_selected' : 'linkB_selected'
						shadow = false;
					}	else {
						func = 'default'
						delay = 0;
						shadow = false;
					}
					// console.log(this.data.pinA.active ? this.data.pinA.delay * 12 : this.data.pinB.delay * 12);
					// let delay = this.data.pinA.delay ? this.data.delay * 12 : 0
					this.main.transition().delay(delay).call(styles[func], this.d)
					// this.main.shadow.redraw(shadow ? {'x': 0, 'y': 3, 'b': 6} : {'x': 0, 'y': 0, 'b': 0})

				}	else {
					let funcA, funcB;
					if(this.data.pinA.active) {
						funcA = 'linkA_active'
					}	else if(this.data.pinA.selected) {
						funcA = 'linkA_selected'
					}	else {
						funcA = 'default'
					}

					if(this.data.pinB.active) {
						funcB = 'linkB_active'
					}	else if(this.data.pinB.selected) {
						funcB = 'linkB_selected'
					}	else {
						funcB = 'default'
					}
					// delay = 0;
					this.main.transition().delay(this.data.pinA.delay * ratio).call(styles[funcA], this.d)
					this.extra.transition().delay(this.data.pinA.delay * ratio).call(styles[funcB], this.d2)
					this.center.transition().delay(200 + Math.min(this.data.pinA.delay, this.data.pinB.delay) * 12).duration(100)
						.attr('stroke-width', '0px')
					// this.main.shadow.redraw(this.active ? {'x': 0, 'y': 3, 'b': 6} : {'x': 0, 'y': 0, 'b': 0})
				}
				this.data.active = this.active || this.selected
			}
			split() {
				this.extra = d3.select(
					this.layer.node().insertBefore(
						this.main.node().cloneNode(),
						this.main.node()
					)
				)
				this.center = this.overlay.append('path')
					.attr('class', 'center')
					.attr('d', this.d)
			}
			join() {
				this.extra.transition()
					.attr('d', this.d)
					.on('end', function () {
						d3.select(this).remove()
					})

				this.center.transition()
					.attr('stroke-width', '0px')
					.on('end', function () {
						d3.select(this).remove()
					})
			}
			reorder() {
				let that = this;
				if(!this.twin) {
					conditions(this.main, this.active, this.selected);
				}	else {
					conditions(this.main, this.data.pinA.active, this.data.pinA.selected);
					conditions(this.extra, this.data.pinB.active, this.data.pinB.selected);
				}
				function conditions(node, b1, b2) {
					if(b1) {
						up(node);
					}	else if(b2) {
						middle(node);
					} else {
						bottom(node);
					}
					function up(node) {
						move(node, that.upper.nextSibling)
					}
					function middle(node) {
						move(node, that.upper)
					}
					function bottom(node) {
						move(node, that.bottom)
					}
					function move(node, ref) {
					that.layer.node().insertBefore(
						node.node(),
						ref
					)
				}
				}
			}
			// both(pin) {
			// 	return this.data[pin].active || this.data[pin].selected
			// }
			get both() {
				return (this.data.pinA.selected || this.data.pinA.active) && (this.data.pinB.selected || this.data.pinB.active)
			}
			get selected() {
				return this.boolean('selected');
			}
			get active() {
				return this.boolean('active');
			}
			get updated() {
				return this.boolean('update');
			}
			boolean(boolean) {
				return this.data.pinA[boolean] || this.data.pinB[boolean]
			}
		}
		class Directions {
			constructor(id) {
				class Trips extends Array {
					constructor() {
						super();
					}
					add(args) {
						class Ride {
							constructor() {
								[this.duration, this.route, this.frequency, this.links, this.nodes] = args;
								this.links = new Array().concat(this.links);
								this.nodes = new Array().concat(this.nodes);
							}
						}
						let ride = new Ride(args);
						let i;
						let unique = this.every((el, j) => {
							let b = el[0].duration != ride.duration
							!b ? i = j : null
							return b;
						})
						if(unique) {
							this.push([ride]);
						}	else {
							this[i].push(ride)
						}
					}
					filter() {
						let temp = new this.constructor()
						this.forEach((item, i) => {
							let index = temp.findIndex((item, j) => compareArrays(this.names(i), temp.names(j)));
							if(index == -1) {
								temp.push(item);
							}	else {
								if(temp[index][0].duration > item[0].duration) temp[index] = item
							}
						})
						temp.sort((a, b) => a[0].duration > b[0].duration)
						this.splice(0, this.length, ...temp);
					}
					names(i) {
						return this[i].map(item => item.route);
					}
					// get names() {
					// 	return this.map(array => array.map(item => item.route));
					// }
					get trips() {
						return this.map(item => {
							let temp = new this.constructor();
							temp[0] = item;
							return temp;
						})
					}
					get fastest() {
						let trips = new Trips();
						trips[0] = this.reduce((acc, array) => acc[0].duration + Trips.frequencies(acc) < array[0].duration + Trips.frequencies(array) ? acc : array, [{'duration': Number.POSITIVE_INFINITY, 'frequency': 0}]);
						// trips[0] = this.reduce((acc, array) => acc[0].duration < array[0].duration ? acc : array, [{'duration': Number.POSITIVE_INFINITY, 'frequency': 0}]);
						return trips;
					}
					get duration() {
						let fastest = this.fastest[0];
						return fastest[0].duration + Trips.frequencies(fastest);
					}
					get links() {
						return this.reduce((acc, array) => {
							return acc.concat(
								array.reduce((acc, item) => acc.concat(item.links), new Array())
							)
						}, new Array())
					}
					get nodes() {
						return this.reduce((acc, array) => {
							return acc.concat(
								array.reduce((acc, item) => acc.concat(item.nodes), new Array())
							)
						}, new Array())
					}
					get routes() {
						return this.map(array => array.map(item => item.route))
					}
					static frequencies(array) {
						// console.log(array);
						let a = array.map(x => 1 / x.frequency);
						let n = a.reduce((a, b) => a + b);
						// console.log(1 / n);
						return 1 / n;
					}
				}
				this.id = id;
				this.inbound  = new Trips();
				this.outbound = new Trips();
				// let duration = item['pinA'].trips.fastest.time + 2 + item['pinB'].trips.frequencies + item['pinB'].trips.fastest.duration;
			}
			add(type, ...args) {
				type == 'pinA' ? this.inbound.add(args) : this.outbound.add(args)
			}
			get duration() {
				return this.inbound.duration + this.outbound.duration + 2;
			}
			get direct() {
				return this.inbound.length != 0 ? this.inbound : false
			}
			clear(type) {
				type == 'pinA' ?
					this.inbound  = new this.inbound.constructor() :
					this.outbound = new this.outbound.constructor()
			}
		}
		class Journey {
			constructor() {
				this.reset();
			}
			reset(b) {
				if(!b) this.direct = new new Directions().inbound.constructor();
				this.transferA = new Directions();
				this.transferB = new Directions();
				// this.foot = new Directions();
			}
			add(trips) {
				this.direct = this.direct.concat(trips);
			}
		}
		class Controller {
			constructor(parent) {
				class Pin {
					constructor(parent, status) {
						this.parent = parent;
						this.master = parent.data;
						this.data = parent.data;
						this.radius = parent.radius;
						this.layer = d3.select('#bottom-line');
						this.status = status;
						this.pinned = false;
						this.any = false;
						this.grab = false;
						this.name = status ? 'pinA' : 'pinB'
						this.other = !status ? 'pinA' : 'pinB'
						this.select = Pin.reset();
						this.active = Pin.reset();
						this.circle = this.layer.append('circle')
							.attr('r', 0)
							.style('opacity', 1)
							.style('fill', `url(#${this.name}_pattern)`)
							.on('click', () => {
								// console.log(d3.event.defaultPrevented);
								// this.grab = d3.event.defaultPrevented;
								this.pinup();
								if(this.name == 'pinA') {
									if(this.parent.pinB.pinned) this.parent.pinB.pinup();
								}
								// this.parent.update(d3.event)
							})
							.call(d3.drag()
								.on('start', () => {
									this.pinned = false;
									this.grab = true;
									// this.parent[this.other].pinned = false
								})
								.on('end', () => {
									this.pinned = true;
									this.grab = false;
									// this.parent[this.other].pinned = true
								})
								.on('drag', () => {
									this.parent.drag(d3.event.sourceEvent);
									this.circle.attr('cx', this.parent.mouse.x)
									this.circle.attr('cy', this.parent.mouse.y)
									this.parent.parent.redraw();
								})
							)
					}
					static reset() {
						return {
							'routes': new Array(),
							'links': new Array(),
							'nodes': new Array()
						}
					}
					pindown() {
						this.pinned = true;
						this.circle.attr('r', this.parent.radius * 3)
							.attr('cx', this.parent.mouse.x)
							.attr('cy', this.parent.mouse.y)
							.transition()
							.attr('r', this.parent.radius)
							.style('opacity', 1)

						if(this.name == 'pinA') {
							this.select.links.forEach(key => {
								let item = this.data.links[key];
								// Controller.difference(item[this.name], this.name == 'pinA' ? 'active' : 'selected', true);
								Controller.difference(item[this.name], 'active', true);
								this.data.active = false;
							})
						}	else {
							this.select.links.forEach(key => {
								let item = this.data.links[key];
								Controller.difference(item[this.name], 'selected', true);
								this.data.active = false;
							})
						}
					}
					pinup() {
						Controller.sortout(this.data.routes, (key, item) => {
							item[this.name].active = false;
							item[this.name].selected = false;
							item[this.name].update = true;
						})
						Controller.sortout(this.data.links, (key, item) => {
							item[this.name].active = false;
							item[this.name].selected = false;
							item[this.name].update = true;
						})
						Controller.sortout(this.data.nodes, (key, item) => {
							item[this.name].active = false;
							item[this.name].selected = false;
							item[this.name].update = true;
						})
						this.pinned = false;
						if(this.name == 'pinA') this.parent.pinB.start = new Array();
						// this.start = new Array();
						this.circle.transition()
							.attr('r', this.parent.radius * 3)
							.style('opacity', 0)
							.on('end', function () {
								d3.select(this).attr('r', 0)
							})
					}
					move(other) {
						this.start = new Array();
						this.select = Pin.reset();
						if(!this.pinned) {
							this.x = this.parent.mouse.x;
							this.y = this.parent.mouse.y;
						}

						// ------------ Get Active Points ------------
						Controller.sortout(this.data.nodes, (key, item) => {
							item[this.name].distance = getDistance(
								[item.x, item.y],
								[this.x, this.y]
							)
							item[this.name].status = item[this.name].distance < this.radius// || compareArrays(key, tails.nodes)
							if(item[this.name].status) this.start.push(key)
							item[this.name].status = item[this.name].status || compareArrays(key, tails.nodes)
							item.directions.clear(this.name);
						})
						// console.log(this.start);

						// ------------ Get Active Routes ------------
						Controller.sortout(this.data.routes, (key, item) => {
							if(this.name == 'pinA' || !compareArrays(key, this.parent[this.other].select.routes)) {
								let b = compareArrays(item.nodes, this.start) || compareArrays(key, tails.routes)
								if(b) {
									let nodes = this.start.concat(tails.nodes);
									let seq = Controller.sequence(item.small, nodes, this.data, this.name, key)
									this.select.links = this.select.links.concat(seq.links)
									this.select.nodes = this.select.nodes.concat(seq.nodes)
									b = seq.links.length != 0
									if(b) this.select.routes.push(key)
								}
								Controller.difference(item[this.name], 'selected', b && other);
							}
						})
						this.start = this.start.concat(tails.nodes);
						// ------------ Get Active Links ------------
						this.select.links = findDuplicates(this.select.links);
						this.any = this.select.links.length != 0;
						Controller.sortout(this.data.links, (key, item) => {
							let b = compareArrays(key, this.select.links)
							Controller.difference(item[this.name], 'selected', b && other);
						})
						// ------------ Get Active Nodes ------------
						this.select.nodes = findDuplicates(this.select.nodes);
						// this.select.nodes = findDuplicates(this.select.nodes);
						// Controller.sortout(this.data.nodes, (key, item) => {
						// 	let b = compareArrays(key, this.select.nodes)
						// 	Controller.difference(item[this.name], 'selected', b && other);
						// })
					}
					get inside() {
						return getDistance([this.parent.mouse.x, this.parent.mouse.y], [this.circle.attr('cx'), this.circle.attr('cy')]) < this.radius && this.pinned
					}
					set coordinates(o) {
						if(!this.pinned) {
							this.x = o.x;
							this.y = o.y;
						}
					}
				}
				class Popup {
					constructor() {
						class Bar {
							constructor(container, routes, duration, icons) {
								this.icons = icons
								this.paper = container.append('div').attr('class', 'paper');
								let wrapper = this.paper.append('div').attr('class', 'wrapper');
								this.content = wrapper.append('div').attr('class', 'content');
								if(duration) {
									this.duration = wrapper.append('div').attr('class', 'duration').text(parseInt(duration) + ' min');
								}
								this.bar = this.paper.append('div').attr('class', 'bar')
									.style('width', Math.min(parseInt(duration * 5), 264) + 'px');
								if(this.bar.style('width') == '264px') {
									this.bar.style('border-bottom-right-radius', '2px')
								}
								this.fill(routes[0], duration ? '#ff9800' : '#bf360c');
								if(routes.length > 1) {
									this.content.node().appendChild(this.icons.arrow.cloneNode(true));
									this.fill(routes[1], '#03a9f4');
								}
								// this.dataA = this.fill(master);
								// this.dataB = this.fill(master);
							}
							fill(routes, color) {
								let type;
								routes.forEach(item => {
									let id = item.split('_');
									if(type != id[0]) {
										this.content.node().appendChild(this.icons[id[0]].cloneNode(true));
									}
									type = id[0];
									if(id[1]) this.content.append('div').attr('class', 'item').style('border-bottom-color', color).text(id[1]);
								})
							}
							remove() {
								this.paper.remove();
							}
						}
						class Block extends Array {
							constructor(container, icons, type) {
								super();
								this.container = container;
								this.icons = icons;
								this.block = container.append('div');
								this.header = this.block.append('span').text(type + ':');
							}
							add(routes, duration) {
								let bar = new Bar(this.block, routes, duration, this.icons);
								this.push(bar);
							}
							reset() {
								this.forEach(item => {
									item.remove();
								})
							}
						}
						class Overview {
							constructor(container, icons) {
								// this.header.text('');
								this.block = container.append('div');
								this.icons = icons;
								this.header = this.block.append('span');
								this.paper = this.block.append('div').attr('class', 'paper')
									.style('padding-bottom', '2px');
								this.bus = this.paper.append('div').attr('class', 'wrapper')
								this.tbus = this.paper.append('div').attr('class', 'wrapper')
								this.tram = this.paper.append('div').attr('class', 'wrapper')
								this.bus.node().appendChild(this.icons.bus.cloneNode(true));
								this.tbus.node().appendChild(this.icons.tbus.cloneNode(true));
								this.tram.node().appendChild(this.icons.tram.cloneNode(true));
								this.bus.content = this.bus.append('div').attr('class', 'content');
								this.tbus.content = this.tbus.append('div').attr('class', 'content');
								this.tram.content = this.tram.append('div').attr('class', 'content');

							}
							add(routes, mouse) {
								let type;
								routes.forEach(item => {
									let id = item.split('_');
									if(id[0] != type) {
										type = id[0];
										this[type].style('display', 'flex')
									}
									this[type].content.append('div').attr('class', 'item').style('border-bottom-color', '#bf360c').text(id[1]);
								})
								let nearest = {
									'distance': Number.POSITIVE_INFINITY,
									'name': ''
								}
								d3.selectAll('.label').each((d) => {
									let distance = getDistance(
										[d.x, d.y],
										[mouse.x, mouse.y]
									)
									if(nearest.distance > distance) {
										nearest.distance = distance;
										nearest.name = d.name;
									}
								})
								this.header.text(nearest.name + ':')
							}
							reset() {
								this.block.selectAll('.item').remove();
								this.bus.style('display', 'none')
								this.tbus.style('display', 'none')
								this.tram.style('display', 'none')
							}
						}
						this.container = d3.select('#popup');
						this.icons = new Object();
						this.icons.bus  = d3.select('#icons').select('svg:nth-child(1)').node();
						this.icons.tbus = d3.select('#icons').select('svg:nth-child(2)').node();
						this.icons.tram = d3.select('#icons').select('svg:nth-child(3)').node();
						this.icons.foot = d3.select('#icons').select('svg:nth-child(4)').node();
						this.icons.arrow = d3.select('#icons').select('svg:nth-child(5)').node();
						d3.select(this.icons.bus).attr('class', 'icon');
						d3.select(this.icons.tbus).attr('class', 'icon');
						d3.select(this.icons.tram).attr('class', 'icon');
						d3.select(this.icons.foot).attr('class', 'icon');
						d3.select(this.icons.arrow).attr('class', 'icon');
						// this.overview = new Block(this.container, this.icons, data);
						// this.overview.block.style('display', 'none');
						this.direct = new Block(this.container, this.icons, 'direct');
						this.transfer = new Block(this.container, this.icons, 'transfer');
						this.overview = new Overview(this.container, this.icons);
						this.direct.block.style('display', 'none');
						this.transfer.block.style('display', 'none');
						this.overview.block.style('display', 'none');
						// this.constructor = Bar;

					}
					update(journey, pinA, mouse) {
						this.direct.reset();
						this.direct.length = 0;
						this.direct.block.style('display', 'none');
						this.transfer.reset();
						this.transfer.length = 0;
						this.transfer.block.style('display', 'none');
						this.overview.reset();
						this.overview.block.style('display', 'none');
						if(!pinA.pinned && pinA.select.routes.length != 0) {
							this.overview.block.style('display', 'block');
							this.overview.add(pinA.select.routes, mouse);
						}
						if(journey.direct.length != 0) {
							journey.direct.sort((a, b) => {
								let A = new journey.direct.constructor();
								let B = new journey.direct.constructor();
								A[0] = a;
								B[0] = b;
								return A.duration - B.duration;
							})
							let b = false;
							let fastest = Number.POSITIVE_INFINITY;
							let prev = { array: new Array(), duration: Number.POSITIVE_INFINITY}
							journey.direct.forEach(array => {
								let trip = new journey.direct.constructor();
								trip[0] = array;
								let duration = trip.duration;
								if(trip[0][0].duration > 2) {
									// if(false) {
									if(journey.direct.length > 3) {
										if(duration - prev.duration > 3) {
											// console.log(prev.array);
											// console.log(prev.array.sort());
											this.direct.add(
												[prev.array.sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))],
												prev.duration
											);
											prev.array = array.map(item => item.route);
											prev.duration = duration;
										}	else {
											prev.array = prev.array.concat(array.map(item => item.route));
										}
										if(prev.duration == Number.POSITIVE_INFINITY) prev.duration = duration;
									}	else {
										this.direct.add(
											[array.map(item => item.route)],
											duration
										);
									}
									b = true;
									fastest = Math.min(array[0].duration * 5, fastest);
								}
							})
							// if(false) {
							if(journey.direct.length > 3) {
								this.direct.add(
									[prev.array.sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))],
									prev.duration
								);
							}
							if(fastest < 30.5) {
								this.direct.add(
									[['foot']],
									fastest
								);
							}
							if(b) this.direct.block.style('display', 'block');
						}
						if(journey.transferA.id) {
							this.transfer.block.style('display', 'block');
							this.transfer.add(
								[
									journey.transferA.inbound.fastest[0].map(item => item.route),
									journey.transferA.outbound.fastest[0].map(item => item.route)
								],
								journey.transferA.duration
							);
							let durationIn = journey.transferA.inbound.fastest[0][0].duration;
							let durationOut = journey.transferA.outbound.fastest[0][0].duration;
							if(durationOut * 5 < 30.5) {
								this.transfer.add(
									[
										journey.transferA.inbound.fastest[0].map(item => item.route),
										['foot']
									],
									journey.transferA.inbound.duration + durationOut * 5
								);
							}	else if(durationIn * 5 < 30.5) {
								this.transfer.add(
									[
										['foot'],
										journey.transferA.outbound.fastest[0].map(item => item.route)
									],
									durationIn * 5 + journey.transferA.outbound.duration
								);
							}
							// console.log(journey);
						}
						if(journey.transferB.id) {
							this.transfer.block.style('display', 'block');
							this.transfer.add(
								[
									journey.transferB.inbound.fastest[0].map(item => item.route),
									journey.transferB.outbound.fastest[0].map(item => item.route)
								],
								journey.transferB.duration
							);
							let durationIn = journey.transferB.inbound.fastest[0][0].duration;
							let durationOut = journey.transferB.outbound.fastest[0][0].duration;
							if(durationOut * 5 < 30.5) {
								this.transfer.add(
									[
										journey.transferB.inbound.fastest[0].map(item => item.route),
										['foot']
									],
									journey.transferB.inbound.duration + durationOut * 5
								);
							}	else if(durationIn * 5 < 30.5) {
								this.transfer.add(
									[
										['foot'],
										journey.transferB.outbound.fastest[0].map(item => item.route)
									],
									durationIn * 5 + journey.transferB.outbound.duration
								);
							}
							// console.log(journey);
						}
					}
				}
				this.parent = parent;
				this.data = parent.data;
				this.journey = parent.journey;
				this.converter = (...args) => parent.converter(...args);
				this.mouse = new Object();
				this.radius = 100;
				this.pinned = false;
				this.pinA = new Pin(this, true);
				this.pinB = new Pin(this, false);
				this.mouseMoved = false;
				this.current = false;
				this.both = false;
				this.delayed = false;
				this.temp = false;
				this.end = new Array();
				this.popup = new Popup();
				// this.popup.overview.fill(this.data.routes);
				// this.delay = false;
				// this.split = false;
				// this.delay = false;
				// this.timer
			}
			drag(e) {
				this.mouse.x = this.converter(e.clientX, 'x');
				this.mouse.y = this.converter(e.clientY, 'y');
				// console.log(this);
				this.update(e);
				// this.pinB.move(true);
			}
			update(e) {
				// if(!this.pinB.pinned && this.pinA.pinned) this.end = new Array();
				// this.temp = this.pinA.pinned && this.pinB.pinned ? JSON.parse(JSON.stringify(this.middle)) : JSON.parse(JSON.stringify(this.end))
				let lastPhase = this.pinA.pinned && this.pinB.pinned
				this.temp = lastPhase ? JSON.parse(JSON.stringify(this.middle)) : JSON.parse(JSON.stringify(this.end))
				this.end = new Array();
				this.middle = new Array();
				this.routes = new Array();
				this.mouse.x = this.converter(e.clientX, 'x');
				this.mouse.y = this.converter(e.clientY, 'y');
				// Controller.sortout(this.data.links, (key, item) => {
				// 	item.delay = 0;
				// })

				// ------------ Distance to Points ------------
				Controller.sortout(this.data.nodes, (key, item) => {
					item.size = 0;
					item.distance = getDistance(
						[item.x, item.y],
						[this.mouse.x, this.mouse.y]
					)
					if(item.distance < this.radius) {
						// if(this.pinB.pinned && this.pinA.pinned)
						// !this.pinB.pinned && this.pinA.pinned ? this.end.push(key) : this.middle.push(key)
						lastPhase ? this.middle.push(key) : this.end.push(key)
					}
				})
				if(!equalArrays(this.temp, lastPhase ? this.middle : this.end)) {
					if(!this.pinA.pinned) this.pinA.move(true);
					this.journey.reset(this.pinB.pinned);
					let nodes = {
						'a': new Array(),
						'b': new Array(),
						'pinned': new Array()
					}

					//------------ Active Links ------------
					if(this.pinA.pinned || this.pinA.grab) {
						if(!this.pinB.pinned) {
							this.end = this.end.concat(tails.nodes);
							this.end = findDuplicates(this.end);
							// if(this.end.length == 0) this.end = this.end.concat(tails.nodes);
						}	else {
							this.middle = this.middle.concat(tails.nodes);
							this.middle = findDuplicates(this.middle);
							// if(this.middle.length == 0) this.middle = this.middle.concat(tails.nodes);
						}
						this.end = !this.pinA.pinned ? this.pinB.start : this.end
						// console.log('');
						this.end.forEach(key => {
							let item = this.data.nodes[key];
							if(item.directions.direct) {
								this.journey.add(item.directions.direct)
							}
						})
						if(!this.pinB.pinned) this.pinB.move(this.both);
						let common = this.pinB.select.nodes.filter(key => compareArrays(key, this.pinA.select.nodes));
						common.forEach(key => {
							let item = this.data.nodes[key];
							let x = 0;
							item.directions.inbound.forEach(array => {
								x += array.length;
							})
							item.directions.outbound.forEach(array => {
								x += array.length;
							})
							item.size = x;
							if(item.directions.duration + 5 < this.journey.direct.duration) {
								if(Math.abs(item.directions.duration - this.journey.transferA.duration) < 0.5) {
									if(item.directions.inbound.fastest[0].length + item.directions.outbound.fastest[0].length >
										this.journey.transferA.inbound.fastest[0].length + this.journey.transferA.outbound.fastest[0].length) {
											this.journey.transferA = item.directions;
										}
									}	else if(item.directions.duration < this.journey.transferA.duration) {
										this.journey.transferA = item.directions;
									}
								}
							})

							if(this.pinB.pinned) {
								this.middle.forEach(key => {
									let item = this.data.nodes[key];
									if(item.directions.inbound.length != 0 && item.directions.outbound.length != 0 ) {
										if(Math.abs(item.directions.duration - this.journey.transferB.duration) < 0.5) {
											if(item.directions.inbound.fastest[0].length + item.directions.outbound.fastest[0].length >
												this.journey.transferB.inbound.fastest[0].length + this.journey.transferB.outbound.fastest[0].length) {
													this.journey.transferB = item.directions;
												}
											}	else if(item.directions.duration < this.journey.transferB.duration) {
												this.journey.transferB = item.directions;
											}
										}
									})
								}
								// console.log(linksA);
								let linksA = this.journey.direct.links;
								linksA = linksA.concat(this.journey.transferA.inbound.fastest.links);
								linksA = linksA.concat(this.journey.transferB.inbound.fastest.links);
								linksA = findDuplicates(linksA);

								let linksB = this.journey.transferA.outbound.fastest.links;
								linksB = linksB.concat(this.journey.transferB.outbound.fastest.links);
								linksB = findDuplicates(linksB);


								concat('a', this.journey.direct.nodes);
								concat('a', this.journey.transferA.inbound.fastest.nodes);
								concat('a', this.journey.transferB.inbound.fastest.nodes);
								concat('b', this.journey.transferA.outbound.fastest.nodes);
								concat('b', this.journey.transferB.outbound.fastest.nodes);
								nodes.a = findDuplicates(nodes.a);
								nodes.b = findDuplicates(nodes.b);
								nodes.pinned = findDuplicates(nodes.pinned);

								Controller.sortout(this.data.links, (key, item) => {
									// let a = compareArrays(key, linksA) || (compareArrays(key, this.pinA.select.links) && this.pinA.inside && !this.pinB.pinned);
									let a = compareArrays(key, linksA)
									let b = compareArrays(key, linksB)
									if(!this.pinA.inside) {
										Controller.difference(item['pinA'], 'active', a);
									}
									Controller.difference(item['pinB'], 'active', b);
								})
								function concat(key, array) {
									nodes[key] = nodes[key].concat(array);
									nodes.pinned = nodes.pinned.concat(getEnds());
									function getEnds() {
										if(array.length == 1) {
											return [array[0]];
										}	else if(array.length > 1) {
											return [array[0], array[array.length - 1]]
										}
									}
								}
								this.journey.direct.filter();
							}

							this.both = this.journey.direct.length == 0;
							// if(this.temp) {
							// 	setTimeout(() => {
							// 		if(this.temp) {
							// 			this.delayed = true;
							// 		}	else {
							// 			this.delayed = false;
							// 		}
							// 	}, 5000)
							// }
							// this.both = this.temp && this.delayed;

							//------------ Active Nodes ------------
							nodes.pinned = this.pinA.start.concat(this.pinB.start)
							nodes.pinned.push(this.journey.transferA.id);
							nodes.pinned.push(this.journey.transferB.id);
							Controller.sortout(this.data.nodes, (key, item) => {
								let a = compareArrays(key, this.pinA.select.nodes);
								let b = compareArrays(key, this.pinB.select.nodes) && (this.both || this.pinB.pinned);// && this.pinB.pinned;
								let c = compareArrays(key, nodes.a);
								let d = compareArrays(key, nodes.b);
								let e = compareArrays(key, nodes.pinned) && (a || c || d)// && (a || b || c || d);
								// if(key == 'node_406') {
								// 	// console.log(compareArrays(key, nodes.pinned));
								// }
								Controller.difference(item['pinA'], 'selected', a);// && !(this.pinA.pinned && this.pinB.pinned));
								Controller.difference(item['pinB'], 'selected', b);// && !(this.pinA.pinned && this.pinB.pinned));
								Controller.difference(item['pinA'], 'active', c);// && !(this.pinA.pinned && this.pinB.pinned));
								Controller.difference(item['pinB'], 'active', d);// && !(this.pinA.pinned && this.pinB.pinned));
								Controller.difference(item, 'pinned', e);
							})

							if(false) {
								console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
								// console.clear();
								if(this.journey.direct.length) {
									console.log('DIRECT:');
									this.journey.direct.trips.forEach(item => {
										console.log('[' + item.names(0).join('] [') + ']:');
										let s = '';
										for (let i = 0; i < Math.round(item.duration); i++) {
											s = s + '—';
										}
										let t = item.duration.toFixed(1) + ' min';
										t = t.length == 7 ? t + ' ' : t
										console.log(t + '\t' + s);
									})
								}
								if(this.journey.transferA.inbound.length) {
									console.log('TRANSFER_A: ' + this.journey.transferA.id);
									console.log('[' + this.journey.transferA.inbound.fastest.names(0).join('] [') + '] -> [' + this.journey.transferA.outbound.fastest.names(0).join('] [') + ']');
									let t = this.journey.transferA.duration.toFixed(1) + ' min';
									t = t.length == 7 ? t + ' ' : t
									let s = '';
									for (let i = 0; i < Math.round(this.journey.transferA.inbound.duration); i++) {
										s = s + '—';
									}
									s = s + '||';
									for (let i = 0; i < Math.round(this.journey.transferA.outbound.duration); i++) {
										s = s + '—';
									}
									console.log(t + '\t' + s);
									// console.log(this.journey.transferA.inbound.constructor().frequencies(this.journey.transferA.inbound.fastest[0].duration));
									// let fastest = this.fastest[0];
									// return fastest[0].duration + Trips.frequencies(fastest);
								}
								if(this.journey.transferB.inbound.length) {
									console.log('TRANSFER_B: ' + this.journey.transferB.id);
									console.log('[' + this.journey.transferB.inbound.fastest.names(0).join('] [') + '] -> [' + this.journey.transferB.outbound.fastest.names(0).join('] [') + ']');
									let t = this.journey.transferB.duration.toFixed(1) + ' min';
									t = t.length == 7 ? t + ' ' : t
									let s = '';
									for (let i = 0; i < Math.round(this.journey.transferB.inbound.duration); i++) {
										s = s + '—';
									}
									s = s + '||';
									for (let i = 0; i < Math.round(this.journey.transferB.outbound.duration); i++) {
										s = s + '—';
									}
									console.log(t + '\t' + s);
								}
							}
							// console.log(this);
							// this.pinA.select.routes.forEach(key => {
							// 	let item = this.data.routes[key]
							// 	console.log(item);
							// })
							// if(this.end.length != 0) {
							//
							// }	else {
							//
							// }
							// if(this.pinA.pinned) {
							// 	// this.journey
							// 	if(this.popup.direct == undefined) {
							// 		this.popup.direct = new this.popup.constructor(this.popup.container, this.popup.icons, this.data.routes);//this.container, this.icons, data
							// 	}
							// 	// console.log(this.popup);
							// }
							this.popup.update(this.journey, this.pinA, this.mouse);
							// console.log(this.journey.direct);
				}
				function equalArrays(a1, a2) {
					var b = true;
					if(a1.length == a2.length) {
						for(let i = 0; i < a1.length; i++) {
							if(a1[i] != a2[i]) {
								b = false;
								break;
							}
						}
					}	else {
						b = false;
					}
					return b;
				}
			}
			click(e) {
				this.update(e);
				if(this.mouseMoved) {
					if(!this.pinA.pinned) {
						this.pinA.pindown();
					}	else if(!this.pinB.pinned) {
						this.pinB.pindown();
					}
					this.mouseMoved = false;
				}
			}
			static difference(item, key, b) {
				item.update = item[key] != b || item.update;
				item[key] = b;
			}
			static sortout(object, func) {
				for(let item in object) {
					func(item, object[item]);
				}
			}
			/*
			static sequence_simple(item, start, end, data) {
				let getId = o => o.type + '_' + o.id;
				let reset = () => ({
					'links': new Array(),
					'nodes': new Array(),
					'time': 0
				})
				let func = seq => {
					let follow = false;
					let out = reset();
					let temp = reset();
					seq.forEach(o => {
						let id = getId(o);
						// console.log(follow);
						if(o.type == 'node') {
							if(!follow) {
								follow = compareArrays(id, start);
							}	else {
								temp.time += 0.2
								temp.nodes.push(id);
								let b = compareArrays(id, end);
								if(b) {
									out.links = out.links.concat(temp.links);
									out.nodes = out.nodes.concat(temp.nodes);
									out.time += temp.time;
									temp = reset();
								}
							}
						}	else if(follow) {
							temp.links.push(id);
							temp.time += data.links[id].time
						}
					})
					out.trip = new Trip(out.time, id, data.links[id].frequency, out.links, out.nodes);
					return out;
				}
				let out1 = func(item.a.sequence)
				if(item.b) {
					let out2 = func(item.b.sequence)
					out1.links = out1.links.concat(out2.links)
					out1.nodes = out1.nodes.concat(out2.nodes)
					out1.tripA = out1.trip;
					out1.tripB = out2.trip;
				}
				return out1
			}
			*/
			static sequence(item, start, data, pin, name) {
				let initialization, condition, expression, method
				if(pin == 'pinA') {
					initialization = x => 0;
					condition = (i, l) => i < l
					expression = i => i += 1
					method = 'push';
				}	else {
					initialization = x => x.length - 1;
					condition = (i, l) => i >= 0
					expression = i => i -= 1
					method = 'unshift';
				}
				let getId = o => o.type + '_' + o.id;
				let func = seq => {
					let links = new Array();
					let nodes = new Array();
					let extra_links = new Array();
					let extra_nodes = new Array();
					let time = 0;
					let follow = false;
					for(let i = initialization(seq); condition(i, seq.length); i = expression(i)) {
						let id = getId(seq[i]);
						if(seq[i].type == 'node') {
							if(compareArrays(id, start)) {
								extra_nodes = extra_nodes.concat(nodes);
								extra_links = extra_links.concat(links);
								nodes = new Array();
								links = new Array();
								time = 0;
								follow = true;
							}
							if(follow) {
								nodes[method](id);
								time += 0.2;
								data.nodes[id][pin].delay = time;
								data.nodes[id].directions.add(
									pin,
									time,
									name,
									data.routes[name].frequency,
									links.concat(extra_links),
									nodes.concat(extra_nodes)
								)
							}
						}	else if(follow) {
							time += data.links[id].time
							data.links[id][pin].delay = time;
							links[method](id);
						}
					}
					return {
						'links': links.concat(extra_links),
						'nodes': nodes.concat(extra_nodes)
					};
				}
				let out1 = func(item.a.sequence)
				if(item.b) {
					let out2 = func(item.b.sequence)
					out1.links = out1.links.concat(out2.links)
					out1.nodes = out1.nodes.concat(out2.nodes)
				}
				return out1
			}
		}
		super({
			container: 'basemap',
			style: 'mapbox://styles/w2ek/cindjb8o1011ix9norxhd4tox',
			// center: [56.238723,58.011399],
			center: [56.2111164,58.000325],
			// 58.000325,56.2111164
			zoom: 12,
			// maxZoom: 12,
			// minZoom: 10,
			// dragPan: false,
  		scrollZoom: false,
  		doubleClickZoom: false,
  		touchZoomRotate: false,
			maxBounds: [[55.715103, 57.909376], [56.694946, 58.173962]]
		}, incoming[2], {	'lon': 55.626526, 'lat': 58.20346, 'z': 13})
		let that = this;
		// this.radius = 50;
		// this.inside = (d, r = this.radius) => {
		// 	return d < r * this.z
		// }
		// this.basemap.dragPan.disable();
		this.data = incoming[0];
		this.formatData();
		this.map.selectAll('circle').attr('r', 0);
		this.map.select('#cross_layer').remove();
		this.map.select('#rail_layer').remove();
		this.map.select('#road_layer').remove();
		this.map.select('#tram_layer').remove();
		this.map.select('#bus_layer').remove();
		this.defs = this.map.insert('defs', '#river_layer');
		this.map.node().insertBefore(
			this.map.select('#railroad_layer').node().cloneNode(true),
			this.map.select('#railroad_layer').node()
		);
		this.map.select('#railroad_layer')
			.attr('id', 'railroadKnockout_layer')
			.selectAll('.railroad')
			.attr('class', 'railroadKnockout')
		this.map.insert('g', '#node_layer')
			.attr('id', 'link_overlay')
		d3.select(
			this.map.node().insertBefore(
				this.map.select('#link_layer').node().cloneNode(true),
				this.map.select('#link_layer').node()
			)
		)
			.attr('id', 'link_event')
			.on('mouseleave', () => {
			tails = {
				'nodes': new Array(),
				'routes': new Array()
			}
		})
			.selectAll('.link')
			.attr('class', 'linkEvent')
			.each(function () {
				let id = d3.select(this).attr('id')
				d3.select(this).datum(that.data.links[id])
					.attr('id', null)
					.attr('d1', null)
					.attr('d2', null)
			})
			.on('mousemove', (d) => {
				tails = {
					'nodes': d.ends,
					'routes': d.routes
				};
			})
		this.map.select('#link_layer')
			.append('g')
			.attr('id', 'bottom-line')
		this.map.select('#link_layer')
			.append('g')
			.attr('id', 'upper-line')
		this.defs.append('pattern')
	    .attr('id', 'pinA_pattern')
	    .attr('width', 12)
	    .attr('height', 12)
	    .attr('patternUnits', 'userSpaceOnUse')
	    .attr('viewBox', '0 0 12 12')
	    .attr('patternTransform', 'rotate(45)')
	      .append('line')
	      .attr('x1', 0)
	      .attr('y1', 2)
	      .attr('x2', 16)
	      .attr('y2', 2)
	      .style('stroke-width', 4)
	      .style('opacity', .3)
	      .style('stroke', colors.yellow.secondary)
	      .style('stroke-linecap', 'square')
		this.defs.node().appendChild(
			d3.select(
				this.defs.select('#pinA_pattern').node().cloneNode(true)
			).attr('id', 'pinB_pattern').node()
		)
		this.defs.select('#pinB_pattern')
			.select('line')
			.style('stroke', colors.blue.secondary)
			.attr('y1', 8)
			.attr('y2', 8)
			// .attr('x1', 2)
			// .attr('x2', 14)
		for(let key in this.data.nodes) this.data.nodes[key].directions = new Directions(key);
		this.journey = new Journey();
		this.nodes = new NodeList(Node, this.map.selectAll('.node'), this);
		this.links = new List(Link, this.map.selectAll('.link'), this);
		this.pins = new Controller(this);
		this.resized = false;
		this.labels = this.map.select('#labels_layer')//.style('opacity', 0);
		this.labels.selectAll('circle').each(function () {
			let circle = d3.select(this);
			let name = circle.attr('id').split('_');
			let text = that.labels.append('g')
				.attr('transform', 'translate(' + circle.attr('cx') + ',' + circle.attr('cy') + ')')
				.append('text')
				.attr('class', 'label')
				.datum({
					'name': name.join(' '),
					'x': circle.attr('cx'),
					'y': circle.attr('cy')
				})

			text.append('tspan')
				.attr('x', 0)
				.attr('dy', -30)
				.text(name[0]);
			if(name.length > 1) {
				text.append('tspan')
					.attr('x', 0)
					.attr('dy', '1.1em')
					.text(name[1]);
			}
			circle.remove();
		})
		// this.pinA = new MainPin(this, true);
		// this.pinA.activate();
		// this.pinB = new ExtraPin(this, false);
		// this.mouseXY();
	}
	/*
	update(event) {
		this.active = new Array();
		for(let item in this.data.nodes) {
			this.data.nodes[item].distance = getDistance(
				this.screenToMap([event.originalEvent.x, event.originalEvent.y]),
				[this.data.nodes[item].x, this.data.nodes[item].y]
			)
			this.data.nodes[item].active = this.data.nodes[item].distance < this.radius / this.z || compareArrays(item, this.tails)
		}
		this.pinA.update(event);
		this.pinB.update(event);
	}
	*/
	redraw() {
		this.nodes.update();
		this.links.update();
	}
	resize(b) {
		this.resized = b;
		this.labels.transition().style('opacity', b ? 1 : 0)
		// fill: #607d8b;
		// opacity: 0.3;
		// font-family: "Roboto Slab", "Lucida Sans Unicode", sans-serif;
		// text-anchor: middle;
	  // font-size: 28px;
	  // font-weight: 700;
		// text-transform: uppercase;
		// letter-spacing: 0.15em;
		// this.map.selectAll('.label')
		// 	.style('text-transform', b ? 'none' : 'uppercase')
		// 		.transition()
		// 		.style('font-weight', b ? '300' : '700')
		// 		.style('opacity', b ? 0.2 : 0.3)
		// 		.style('fill', b ? 'white' : '#607d8b')
		// 		.style('font-size', b ? '78px' : '32px')
		this.map.selectAll('.river, .sewer, .railroad, .railroadKnockout').transition().style('stroke-width', b ? '7px' : '3px')
		this.map.selectAll('.linkEvent').style('stroke-width', b ? '400px' : '75px')
		this.map.select('#pinA_pattern').select('line').transition().style('opacity', b ? 1 : 0.3)
		this.map.select('#pinB_pattern').select('line').transition().style('opacity', b ? 1 : 0.3)
		for(let key in this.data.nodes) {
			this.data.nodes[key].update = true;
		}
		for(let key in this.data.links) {
			this.data.links[key].pinA.update = true;
		}
		this.nodes.update();
		this.links.update();
	}
	formatData() {
		this.data.links = new Object();
		let that = this;
		this.map.selectAll('.link').each(function () {
			let id = d3.select(this).attr('id');
			that.data.links[id] = new Object();
			that.data.links[id].status = false;
			that.data.links[id].routes = new Array();
			that.data.links[id].nodes = new Array();
			that.data.links[id].time = d3.select(this).node().getTotalLength() / 100;
			that.data.links[id].ends = new Array();
		})

		for(let item in this.data.routes) {
			let ends = (a) => {
				let start;
				let end;
				let links = new Array();
				for(let i = 0; i < a.length; i++) {
					if(a[i].type == 'node') {
						end = 'node_' + a[i].id;
						links.forEach((item) => {
							// console.log(item);
							that.data.links[item].ends.push(start);
							that.data.links[item].ends.push(end);
						})
						links = new Array();
						start = 'node_' + a[i].id;
					}	else {
						links.push('link_' + a[i].id)
					}
				}
			}
			ends(this.data.routes[item].small.a.sequence);
			if(this.data.routes[item].small.b) {
				ends(this.data.routes[item].small.b.sequence);
			}
			this.data.routes[item].id = item;
			this.data.routes[item].divided = new Object;
			this.data.routes[item].divided.links = this.data.routes[item].ids.links;
			this.data.routes[item].divided.node = this.data.routes[item].ids.nodes;
			this.data.routes[item].links = mergeIDs(this.data.routes[item].ids.links, 'link');
			this.data.routes[item].nodes = mergeIDs(this.data.routes[item].ids.nodes, 'node');
			this.data.routes[item].links.forEach((id) => {
	      this.data.links[id].routes.push(item);
	    })
			delete this.data.routes[item].ids;
			function mergeIDs(o, type) {
	      var a = new Array;
	      o.common.forEach(function (el) {  a.push(type + '_' + el);  });
	      for(let dir in o.unique) {
	        o.unique[dir].forEach(function (el) {  a.push(type + '_' + el);  });
	      }
	      return a;
	    }
			this.data.routes[item] = addPin(this.data.routes[item]);
		}

		for(let item in this.data.nodes) {
			this.data.nodes[item].pinned = false;
			this.data.nodes[item].x = Math.round(this.data.nodes[item].x * 10) / 10;
	    this.data.nodes[item].y = Math.round(this.data.nodes[item].y * 10) / 10
			this.data.nodes[item].routes.forEach((line) => {
				this.data.routes[line].links.forEach((id) => {
					this.data.links[id].nodes.push(item);
				})
			})
			this.data.nodes[item] = addPin(this.data.nodes[item]);
		}
		for(let item in this.data.links) {
	    if(this.data.links[item].routes.length == 0) {
	      delete data.links[item];
	      this.map.select('#' + item).remove();
	    }
			this.data.links[item].ends = findDuplicates(this.data.links[item].ends)
			this.data.links[item] = addPin(this.data.links[item]);
	  }
		function addPin(o) {
			o.pinA = {
				'active': false,
				'selected': false,
				'update': true,
				'delay': 0
			}
			o.pinB = {
				'active': false,
				'selected': false,
				'update': true,
				'delay': 0
			}
			return o;
		}
	}
}

d3.queue()
	.defer(d3.json, 'data/data.json')
	.defer(d3.json, 'data/names.geojson')
	.defer(d3.xml, 'data/map.svg')
	.defer(d3.xml, 'pics/bus.svg')
	.defer(d3.xml, 'pics/tbus.svg')
	.defer(d3.xml, 'pics/tram.svg')
	.defer(d3.xml, 'pics/foot.svg')
	.defer(d3.xml, 'pics/arrow.svg')
	.await(function(error, ...incoming) {
		if (error) throw error;
		let icons = d3.select('#popup').append('div')
			.attr('id', 'icons').node()
		icons.appendChild(incoming[3].documentElement);
		icons.appendChild(incoming[4].documentElement);
		icons.appendChild(incoming[5].documentElement);
		icons.appendChild(incoming[6].documentElement);
		icons.appendChild(incoming[7].documentElement);
		let transport = new TransportMap(...incoming);
		document.mouseleave = function() {
  alert('out');
};
		transport.basemap.on('mousemove', function (e) {
			d3.select('#popup')
				.style('left', function () {
					return Math.max(Math.min(e.originalEvent.clientX, window.innerWidth - this.clientWidth - 32), 16) + 'px';
				})
				.style('top', function () {
					return Math.max(Math.min(e.originalEvent.clientY, window.innerHeight - this.clientHeight - 32), 16) + 'px';
				})
			transport.pins.mouseMoved = true;
			transport.pins.update(e.originalEvent);
			transport.redraw();
			setTimeout(() => {
			}, 100);
			// transport.redraw();
			// function borders(x, max, width) {
			// 	console.log(this.clientWidth);
			// 	let margin = 16;
			// 	return '100px'
			// 	// return Math.max(Math.min(x, max - margin - margin - width), margin);
			// }
		})
		transport.basemap.on('drag', function (e) {
			d3.select('#popup')
				.style('left', e.originalEvent.clientX + 'px')
				.style('top',  e.originalEvent.clientY + 'px')
		})
		transport.basemap.on('click', function (e) {
			transport.pins.click(e.originalEvent);
			transport.redraw();
			// console.log(transport.basemap.getZoom());
		})
		d3.select('div#basemap').on('mousewheel', event => {
			if(d3.event.deltaY > 0 && transport.basemap.getZoom() == 12) {
				transport.basemap.dragPan.disable();
				transport.basemap.fitBounds([[55.715103, 57.909376], [56.694946, 58.173962]]);
				transport.resize(true);
			}
			if(d3.event.deltaY < 0 && transport.basemap.getZoom() != 12) {
				zoomRatio = 1;
				transport.basemap.dragPan.enable();
				transport.resize(false);
				transport.basemap.easeTo({
					center: [transport.basemap.mouse.lng, transport.basemap.mouse.lat],
					zoom: 12
				});
			}
		})
		// transport.basemap.on('zoom', function (e) {
		// 	console.log(transport);
		// 	// d3.event.deltaY < 0 ?
		// })
		// transport.basemap.on('mousemove', transport.mouseMove)
	})

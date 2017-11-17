class LinearGradient {
	constructor(selection, stopsNum) {
		this.IDs = new Array()
		this.selection = selection.append('linearGradient')
			.attr('id', () => {
				this.IDs[this.IDs.length] = 'linearGradient_' + parseInt(Math.random() * 10000000);
				return this.IDs[this.IDs.length - 1];
			})
		this.stops = this.selection
			.selectAll('stop')
			.data(new Array(stopsNum + 1))
			.enter()
			.append('stop')
			.attr('offset', (d, i, a) => {	return i / (a.length - 1) * 100  + '%';	})
	}
}

class ColorPicker {
	constructor(parent) {
		class Graphs {
			constructor(container) {
				this.container = container;
				this.yScale = d3.scaleLinear().domain([0, 5000]).range([0, 0]);
				this.curves = this.container
					.selectAll('path')
					.data(new Array(24))
					.enter()
					.append('path')
					.attr('class', 'graphLines')

				// this.redraw();
			}
			redraw(t) {
				let generator = d3.line()
					.x((d, i, a) => d3.scaleLinear().domain([0, a.length]).range([0, 288])(i))
					.y(d => this.yScale(d))
				this.curves.attr('d', generator)
			}
		}
		class ColorRamp {
			constructor(parent, container) {
				this.container = container;
				this.scale = parent.scale;
				// this.segments = 95;
				// this.step = 3;
				this.gradients = new LinearGradient(this.container.append('defs'), this.scale.domain()[1]);
				this.ramp = this.container.append('rect').attr('width', this.scale.range()[1]).attr('height', 1)
					.style('fill', `url(#${this.gradients.IDs[0]})`)

				this.units = this.container.append('text')
					.attr('class', 'ticksUnits')
					.attr('x', this.scale.range()[1])
					.attr('y', 20)
					.text('speed, km/h')

				this.ticks = this.container.append('g')
			}
			// initial() {
			// 	this.ticks = this.ticks.data(this.colorScale.domain())
			// 		.enter()
			// 		.append('line')
			// 		.attr('class', 'ticks')
			// }
			redraw() {
				this.ticks.selectAll('line').remove();
				this.ticks.selectAll('text').remove();
				let data = this.colorScale.domain();

				this.ticks.selectAll('text')
					.data(data)
					.enter()
					.append('text')
					.attr('class', 'ticksLabels')
					.attr('x', (d, i) => this.scale(data[i]))
					.attr('y', 20)
					.text(d => d)

				// data.unshift(0);
				// data.push(this.scale.domain()[1]);

				this.ticks.selectAll('line')
					.data(data)
					.enter()
					.append('line')
					.attr('class', 'ticks')
					.attr('x1', (d, i) => this.scale(data[i]))
					.attr('x2', (d, i) => this.scale(data[i]))
					.attr('y1', -4)
					.attr('y2', 4)
					.style('stroke', d => this.colorScale(d))

				this.gradients.stops.transition()
					.attr('stop-color', (d, i) => this.colorScale(i))
			}
		}
		class ModesPanel {
			constructor(parent, container) {
				this.container = container;
				this.container.attr('transform', 'translate(0,' + -24 + ')')
				this.label = this.container.append('text')
					.attr('id', 'colorPickerLabel')

				this.blindType = 'Deuteranomaly';
				this.data = [
					{
						'icon': 'tonality',
						'label': ['color', 'blind'],
						'status': false,
						'function': 'colorblind'
					},
					{
						'icon': 'multiline_chart',
						'label': ['speed', 'graphs'],
						'status': false,
						'function': 'distribution'
					},
					{
						'icon': 'crop_free',
						'label': ['crop to', 'screen'],
						'status': false,
						'function': 'crop'
					},
					{
						'icon': 'tune',
						'label': ['tune', 'colors'],
						'status': false,
						'function': 'curves'
					},
					{
						'icon': 'palette',
						'label': ['color', 'swatches'],
						'status': false,
						'function': 'swatches'
					},
					{
						'icon': 'compare',
						'label': ['turn to', 'white'],
						'status': false,
						'function': 'invert'
					}
				]
				this.modes = this.container.selectAll('g')
					.data(this.data)
					.enter()
					.append('g')
					.attr('class', 'modesButtons')
					.attr('id', d => d.function + 'ModeButton')
					.attr('transform', (d, i) => `translate(${i * 20 + 184})`)
					.style('opacity', d => d.status ? 1 : 0.3)

				this.modes.append('rect')
					// .attr('class', 'modesKnockout')
					.attr('x', -10).attr('y', -14)
					.attr('width', 20).attr('height', 20)
					.style('opacity', 0)

				this.modes.append('text')
					.attr('class', 'modesIcons')
					.text(d => d.icon);

				let that = this;
				this.inlineModes = d3.selectAll('.modes')
				this.inlineModes.each(function () {
					let f = d3.select(this).attr('id').split('Mode')[0];
					let n = 0;
					while (f != that.data[n].function) n++
					d3.select(this).datum(that.data[n]);
				})
				this.modes.on('click', changeModeState)
				this.inlineModes.on('click', changeModeState)

				this.blindTypeModes = d3.selectAll('.blindType');
				this.blindTypeModes.each(function () {
					d3.select(this).datum(d3.select(this).attr('id'))
				})
				this.blindTypeModes.on('click', d => {
					if(this.blindType == d) {
						this.data[0].status = false;
					}	else {
						this.data[0].status = true;
						this.blindType = d;
					}
					parent.colorblind();
				})

				function changeModeState(d) {
					d.status = !d.status;
					parent[d.function]();
				}
			}
			redraw() {
				this.modes.transition()
					.style('opacity', d => d.status ? 1 : 0.3)

				this.inlineModes.transition()
					.style('opacity', d => d.status ? 1 : 0.3)

				this.blindTypeModes.transition()
					.style('opacity', d => d == this.blindType && this.data[0].status ? 1 : 0.3)
			}
		}
		this.parent = parent;
		this.container = parent.append('svg').attr('id', 'colorPicker')
			.append('g')
			.attr('transform', 'translate(16, 48)')
			// .attr('viewBox', '0, -48, 288, 104')

		this.scale = d3.scaleLinear().domain([0, 110]).range([0, 288]);

		this.header = this.parent.select('.subheader')
		// this.header.selectAll('*').style('opacity', 0)
		this.header.addToogle(function (t, n, b) {
			t.style('border-top', b ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0)')
				.style('height', b ? '32px' : '0px')
		})

		this.graphs = new Graphs(this.container.append('g').attr('id', 'graphs'));
		this.colorRamp = new ColorRamp(this, this.container.append('g').attr('id', 'colorRamp'));
		this.modesPanel = new ModesPanel(this, this.container.append('g').attr('id', 'modesPanel'));

	}
	// initial() {
	// 	this.colorRamp.colorScale = this.colorScale;
	// 	this.colorRamp.initial();
	// }
	redraw(data) {
		if(this.modesPanel.data[0].status) {
			this.colorScale.range(data.colorRange.map(d => d3.rgb(...fBlind[this.modesPanel.blindType](Object.values(d3.color(d)))) ))
		}	else {
			this.colorScale.range(data.colorRange)
		}

		this.modesPanel.label.text('colorscheme by ' + data.author.name);
		this.colorRamp.colorScale = this.colorScale;
		this.colorRamp.redraw();
		this.modesPanel.redraw();
	}
	distribution() {
		this.graphs.yScale.range(this.modesPanel.data[1].status ? [0, -96] : [0, 0])

		this.container.transition()
			.attr('transform', `translate(16, ${48 - this.graphs.yScale.range()[1]})`)

		d3.select('#colorPicker').transition()
			.style('height', 104 - this.graphs.yScale.range()[1] + 'px');

		d3.select('#fadeOut').transition()
			.style('bottom', 136 - this.graphs.yScale.range()[1] + 'px');

		this.modesPanel.container.transition()
			.attr('transform', 'translate(0,' + (-24 + this.graphs.yScale.range()[1]) + ')')

		this.modesPanel.redraw();
		this.graphs.redraw();

		// console.log();
	}
}

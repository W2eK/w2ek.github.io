let uiColors = ['black', 'grey', 'white'];

d3.select('head').append('link')
	.attr('rel', 'stylesheet')
	.attr('type', 'text/css')
	.attr('href', 'css/trafficMap.css');

d3.select('head').append('link')
	.attr('rel', 'stylesheet')
	.attr('type', 'text/css')
	.attr('href', 'css/colorPicker.css');

d3.queue()
	.defer(d3.json, 'data/data.js')
	.defer(d3.json, 'data/names.js')
	.defer(d3.xml, 'data/map.svg')
	.defer(d3.xml, 'data/arrow.svg')
	.await(function(error, ...incoming) {
		// let colorScale;
		if (error) throw error;
		let map = new TrafficMap(...incoming);
		let intro = new Intro();
		let article = new Article();
		let colorPicker = new ColorPicker(d3.select('#constructor'));
		d3.select('#map').transition().style('background-color', 'rgba(19, 19, 19, 0)');

		class Phases {
			constructor(n) {
				this._current = n
				this.data = [
					{
						'colorScale': d3.scaleLinear().domain([10, 20, 30, 45, 60]).clamp(true),
						'colorRange': ['#191919', '#192069', '#41199E', '#D500F9', '#FFFFFF'],
						'author': {
							'name': 'Vladimir Osokin',
							'link': 'http://w2ek.github.io/'
						},
						'inversion': false
					},
					{
						'colorScale': d3.scaleLinear().domain([5, 10, 20, 40]).clamp(true),
						'colorRange': ['#B00000', '#EF1014', '#FCC203', '#0ABE0A'],
						'author': {
							'name': 'Yandex Maps',
							'link': 'https://yandex.com/maps/'
						},
						'inversion': false
					},
					{
						'colorScale': d3.scaleLinear().domain([5, 10, 20, 40]).clamp(true),
						'colorRange': ['#9E1313', '#E60000', '#F07D02', '#84CA50'],
						'author': {
							'name': 'Google Maps',
							'link': 'https://www.google.com/maps/'
						},
						'inversion': false
					}
				];
			}
			change(n) {
				this._current = n;
				map.colorScale = this.data[n].colorScale;
				colorPicker.colorScale = this.data[n].colorScale;
				colorPicker.redraw(this.data[n]);
				map.redrawMap(1500);
			}
			set current(n) {
				this._current != n ? this.change(n) : null
			}
		}
		let phases = new Phases(0);
		colorPicker.colorScale = phases.data[0].colorScale;
		// colorPicker.initial();
		phases.change(0);

		// colorPicker.graphs.curves.data(map.meanValues)
		// colorPicker.graphs.redraw()

		// ----------LISTENERS----------
		intro.nodes.container.on('wheel', () => {
			if(!intro.folded && d3.event.wheelDeltaY < 0) {
				changeState(0);
			}
			if(intro.folded && d3.event.wheelDeltaY > 0) {
				changeState(1);
			}
		})
		intro.nodes.container.on('click', () => {
			if(intro.folded) {
				changeState(1);
			}
		})
		colorPicker.colorblind = function (blindType = 'Deuteranomaly') {
			let n = phases._current;
			phases.data[n].blindType = blindType;
			map.colorScale = phases.data[n].colorScale;
			colorPicker.colorScale = phases.data[n].colorScale;
			colorPicker.redraw(phases.data[n]);
			map.redrawMap(1000, 100);
		}
		// d3.selectAll('.colorBlind').on('click', function () {
		// 	colorPicker.modesPanel.modes.data()[0].status = true;
		// 	d3.select(`#colorblindMode`).transition().style('opacity', 1)
		// 	d3.select(`#colorblindModeButton`).transition().style('opacity', 1)
		// 	colorPicker.colorblind(d3.select(this).attr('id'));
		// })
		article.nodes.container
			.on('wheel.zoom', scroll)
			.on('mousewheel.zoom', scroll)
			.on('DOMMouseScroll.zoom', scroll)

		function scroll() {
			article.offset -= 96 * d3.event.deltaY / 100;
			article.maxOffset = article.nodes.container.node().clientHeight - article.nodes.container.node().scrollHeight - 56;
			article.unfold();
			if(article.offset > 0 && intro.folded) {
				if(article.delayed) {
					changeState(1);
				}	else {
					article.delayed = true;
				}
			}
			if(article.offset < 0 && article.offset > article.maxOffset) {
				article.delayed = false;
			}
			article.offset = Math.min(0, Math.max(article.maxOffset, article.offset));

			article.nodes.wrapper.transition()
				.style('top', article.offset + 'px')
		}

		function changeState(n) {
			switch (n) {
				case 0:
					intro.fold();
					colorPicker.header.toogle(true);
					article.o = 30;
					article.unfold();
					article.o = 0;
					phases.current = 1;
					break;
				case 1:
					intro.fold();
					// article.o = -30;
					article.fold();
					// article.o = 0;
					colorPicker.header.toogle(false);
					phases.current = 0;
					break;
				case 2:
					article.fold();
					break;
			}
		}
})

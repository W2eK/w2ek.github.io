d3.selection.prototype.addShadow = function (props = {'x': 2, 'y': 3, 'b': 6}, defs = d3.select(this.node().parentNode).select('defs')) {
	if(defs.empty()) {
		defs = d3.select(this.node().parentNode).append('defs');
	}
	let id = 'shadow_' + parseInt(Math.random() * 10000000)
	this.shadow = defs.append('filter')
		.attr('id', id)
		.attr('x', -1)
		.attr('y', -1)
		.attr('width', "2000%")
		.attr('height', "2000%")

	this.shadow.blur = this.shadow.append('feGaussianBlur')
		.attr('in', 'SourceAlpha')
		// .attr('result', 'blurOut')
		.attr('stdDeviation', props.b)

	this.shadow.offset = this.shadow.append('feOffset')
		// .attr('in', 'SourceAlpha')
		.attr('result', 'offsetblur')
		.attr('dx', props.x)
		.attr('dy', props.y)


		this.shadow.append('feComponentTransfer')
			.append('feFuncA')
			.attr('type', 'linear')
			.attr('slope', 0.3)

		this.shadow.append('feMerge')
			.append('feMergeNode')

		this.shadow.select('feMerge')
				.append('feMergeNode')
			.attr('in', 'SourceGraphic')

	// this.shadow.append('feBlend')
	// 	.attr('in', 'SourceGraphic')
	// 	.attr('in2', 'blurOut')
	// 	.attr('mode', 'normal')

	this.attr('filter', 'url(#' + id + ')')
}

let colors = ['white','#bfd3e6','#9ebcda','#8c96c6','#8856a7','#810f7c'];
d3.queue()
	.defer(d3.csv, 'data/data.csv')
	.defer(d3.xml, 'data/map.svg')
	.defer(d3.json, 'data/meta.json')
	.await(function(error, data, incomingSVG, meta) {
		// console.log(meta);
		let originalMap = d3.select(incomingSVG.documentElement);
		originalMap.selectAll('g').attr('id', function () {
			return d3.select(this).select('path').attr('id');
		})
		originalMap.selectAll('g').attr('class', 'region');
		originalMap.selectAll('g').select('circle').attr('r', 10);
		originalMap.selectAll('g').select('path').attr('id', null).attr('class', null).style('fill', 'inherit');
		d3.selectAll('div.mapBox').each(function (d, i) {
			let n = i;
			let container = d3.select(this)
			container.node().appendChild(originalMap.node().cloneNode(true));
			let colorScale = d3.scaleLinear().domain(meta[n].breaks).range(colors).clamp(true)
			let mapKey = container.selectAll('.mapKey > div')
			mapKey.data(meta[n].breaks)
			mapKey.select('.bullet').style('background-color', d => colorScale(d))
			mapKey.style('opacity', 1)
				.style('border-bottom', d => {
					let rgb = d3.rgb(colorScale(d));
					return `1px dotted rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`
				})
			mapKey.select('div > p')
				.attr('class', 'popUpDigit')
				.html(d => format(d, meta[n].divider,  false) + `<span class='units'>${meta[n].units}</span>`)

			// container.select('.mapKey').selectAll('li').each(function () {
			// 	console.log(this);
			// })

			// container.style('background-color', d3.scaleQuantile().domain([0, 2.5, 5]).range(['red', 'green', 'blue'])(n))
			// let colorScale = d3.scaleThreshold().domain(meta[n].breaks).range(colors)//.clamp(true)
			container.select('h3').text(meta[n].header);

			data.forEach(d => {
				container.select('#' + d.ISO).datum(d);
				container.select('#' + d.ISO)
			})
			let regions = container.selectAll('.region')
			regions.each(function () {
				d3.select(this).addShadow({'x': 0, 'y': 0, 'b': 0});
			})
			regions.transition()
				.style('fill', d => colorScale(parseFloat(d['data_' + n])))
				// .style('stroke', d => colorScale(parseFloat(d['data_' + n])))

			regions
				.on('mouseover', mouseOver)
				.on('mousemove', mouseMove)
				.on('mouseleave', mouseLeave)

			mapKey
				.on('click', function () {
					this.pinned = !this.pinned;
				})
				.on('mouseover', function (d, i) {
					let filterScale = d3.scaleLinear().domain(meta[n].breaks).range(colors.map((d, j) => i == j ? d : 'white')).clamp(true)
					// let filterScale = d3.scaleLinear().domain(meta[n].breaks).range(colors.map((d, j) => {
					// 	if(i == j - 1) {
					// 		return d3.hcl(d).darker()
					// 	}
					// 	if(i == j + 1) {
					// 		return d3.hcl(d).brighter()
					// 	}
					// 	if(i == j) {
					// 		return d
					// 	}
					// 	return 'white'
					// })).clamp(true)
					d3.select(this).transition()
					.style('border-bottom', d => {
						let rgb = d3.rgb(colorScale(d));
						return `1px dotted rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`
					})

					regions.transition()
						.style('fill', d => filterScale(parseFloat(d['data_' + n])))
				})
				.on('mouseleave', function () {
					if(!this.pinned) {
						d3.select(this).transition()
						.style('border-bottom', d => {
							let rgb = d3.rgb(colorScale(d));
							return `1px dotted rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`
						})

						regions.transition()
						.style('fill', d => colorScale(parseFloat(d['data_' + n])))
					}
				})

			function mouseOver(d) {
				this.parentNode.insertBefore(this, d3.select(this.parentNode).select('g').node());
				this.region =  d3.select(this);
				this.container = d3.select(this.parentNode.parentNode);
				let shadowID = this.region.attr('filter').replace('url(#', '').replace(')', '');
				this.shadow = d3.select(this.parentNode).select('#' + shadowID);
				this.shadow.offset = this.shadow.select('feOffset');
				this.shadow.blur = this.shadow.select('feGaussianBlur');
				this.popup = d3.select('#mapPopUp')
				this.popup.style('opacity', 1)
				this.popup.select('.popUpText')
					.text(d.ru_name)
				this.popup.select('.popUpDigit')
					.html(d['data_' + n] == 0 ? `Нет данных` : `${format(d['data_' + n], meta[n].divider,  meta[n].decimal)}<span class='units'>${meta[n].units}</span>`)

				this.shadow.offset.transition()
					// .attr('dx', 0)
					.attr('dy', 2)

				this.shadow.blur.transition()
					.attr('stdDeviation', 4)

			}

			function mouseMove(d) {
				this.popup
					.style('left', d3.event.pageX + 16)
					.style('top', d3.event.pageY + 16)
			}

			function mouseLeave(d) {
				this.popup.style('opacity', 0)

				this.shadow.offset.transition()
					// .attr('dx', 0)
					.attr('dy', 0)

				this.shadow.blur.transition()
					.attr('stdDeviation', 0)
			}

		})
		// console.log(meta);
	})

function format(n, d, b) {
	// console.log(n);
	let float = parseFloat(n) / d;
	let int = Math.round(float) + '';
	let decimal = Math.round(float % 1 * 10) + '';
	let string = '';
	if(int.length > 4) {
		for(let i = int.length - 1; i > -1; i-- )	{
			if((int.length - i - 1) % 3 == 0 && i != int.length - 1) {
				string = int[i] + '<span class="space"> </span>' + string
			}	else {
				string = int[i] + string
			}
		}
	}	else {
		string = int;
	}
	return b ? string + ',' + decimal : string
}

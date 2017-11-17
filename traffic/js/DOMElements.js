d3.selection.prototype.addToogle = function (call) {
	class Toogle {
		constructor(node) {
			this.status = true;
			this.call = call;
			node.toogled = this.status;
		}
		turn(b = this._toogle.status, t = d3.transition()) {
			this.transition(t).call(this._toogle.call, this, b);
			this._toogle.status = !b;
		}
	}
	this._toogle = new Toogle(this);
	this.toogle = this._toogle.turn;
}
class Panel {
	constructor(folded) {
		this.nodes = new Object();
		this.folded = folded;
	}
	fold(t) {
		for(let node in this.nodes) {
			// console.log(this.nodes[node].toogle);
			this.nodes[node].toogle(t);
		}
	}
}
class Intro extends Panel {
	constructor() {
		super(false);
		this.nodes.container = d3.select('#intro')
		this.nodes.main = this.nodes.container.selectAll('.wrapper > :not(#headlinePanel)');
		this.nodes.headline = this.nodes.container.select('#headlinePanel');
		this.nodes.h1 = this.nodes.headline.select('h1');
		this.nodes.h2 = this.nodes.headline.select('h2');
		this.nodes.spanA = this.nodes.h2.select('span:first-child');
		this.nodes.spanB = this.nodes.h2.select('span:last-child');

		this.nodes.container.select('#scrolldown').transition(d3.transition().duration(500).delay(500)).style('opacity', 1);

		this.nodes.container.addToogle(function (t, n, b) {
			n.style('cursor', b ? 'pointer' : 'auto')
			if(b) {
					t.style('height', '56px')
			}	else {
					t.styleTween('height', function() {
						let begin = (56 / (n.node().parentNode.clientHeight - 32) * 100);
						let end = 100;
						let i = d3.interpolateNumber(begin, end);
						return function(t) {
							return i(t) + '%';
						};
					})
			}
		})

		this.nodes.main.addToogle(function (t, n, b) {
			n.style('pointer-events', b ? 'none' : 'auto')
			t.style('opacity', b ? 0 : 1)
		})
		this.nodes.headline.addToogle(function (t, n, b) {
			n.style('pointer-events', b ? 'none' : 'auto')
			t.style('top', b ? '220px' : '0px')
		})
		this.nodes.h1.addToogle(function (t, n, b) {
			t.style('font-size', b ? '46px' : '86px')
				.style('line-height', b ? '32px' : '64px')
				.style('height', b ? '32px' : '64px')
		})
		this.nodes.h2.addToogle(function (t, n, b) {
			t.style('font-size', b ? '20px' : '33.5px')
				.style('line-height', b ? '20px' : '32px')
		})
		this.nodes.spanA.addToogle(function (t, n, b) {
			t.style('top', b ? '-40px' : '0px')
				.style('left', b ? '180px' : '0px')
		})
		this.nodes.spanB.addToogle(function (t, n, b) {
			t.style('top', b ? '-20px' : '0px')
				.style('left', b ? '70px' : '0px')
		})
	}
	fold() {
		this.folded = !this.folded;
		super.fold(this.folded, d3.transition().duration(500));
	}
}

class Article {
	constructor() {
		this.nodes = new Object();
		this.nodes.container = d3.select('#article').style('pointer-events', 'none').style('opacity', 0);
		this.nodes.wrapper = this.nodes.container.select('#article > section').style('top', '0px');
		this.nodes.scroll = this.nodes.container.select('#scrollbar').style('height', '0px');
		this.nodes.scrollbar = this.nodes.scroll.select('div').style('height', '0px');

		this.nodes.scroll.resize = (h) => {
			this.nodes.scroll.transition()
				.style('height', h + 'px');
		}
		this.nodes.scrollbar.resize = (h, o) => {
			this.nodes.scrollbar.transition()
				.style('height', h + 'px')
				.style('top', o + 'px');
		}

		this.nodes.fadeIn = this.nodes.container.select('#fadeIn');
		this.nodes.fadeOut = this.nodes.container.select('#fadeOut');
		this.nodes.fadeOut.place = () => {
			// this.nodes.fadeOut.style('bottom', (this.height + 24 - this.o) + 'px');
			// this.nodes.fadeOut.style('top', (this.height + 24 - this.o) + 'px');
			// console.log(this.height);
		}

		this.nodes.fadeIn.addToogle(function (t, n, b) {
			t.style('opacity', b ? 1 : 0)
		})

		// this.nodes.fadeOut.addToogle(function (t, n, b) {
		// 	t.style('opacity', b ? 1 : 0)
		// 		.style('top', b ? '136px': '104px');
		// })

		this.offset = 0;
		this.delayed = false;
		this.o = 0;
	}
	fold() {
		this.nodes.fadeIn.toogle(false);
		// this.nodes.fadeOut.toogle(false);
		this.delayed = false;
		this.nodes.scroll.resize(0);
		this.nodes.scrollbar.resize(0, 0);
		this.nodes.container.style('pointer-events', 'none').transition()
			.style('opacity', 0);
	}
	unfold() {
		this.nodes.fadeOut.place();
		this.nodes.scroll.resize(this.height);
		this.nodes.scrollbar.resize(this.height / this.fullHeight * this.height, Math.max(0, Math.min(this.height - this.height / this.fullHeight * this.height, -this.offset / this.fullHeight * this.height)));
		this.nodes.container.style('pointer-events', 'auto').transition()
			.style('opacity', 1);
		if(this.offset > -36) {
			this.nodes.fadeIn.toogle(false);
		} else {
			this.nodes.fadeIn.toogle(true);
		}
		if(this.offset <= this.maxOffset) {
			// this.nodes.fadeOut.toogle(false);
			this.nodes.fadeOut.transition()
				.style('opacity', 0)
				.style('top', '0px');
		} else {
			// this.nodes.fadeOut.toogle(true);
			this.nodes.fadeOut.transition()
				.style('opacity', 1)
				.style('top', this.height + 32 + 'px');
		}
	}
	get height() {
		return this.nodes.container.node().clientHeight - 56 - this.o;
	}
	get fullHeight() {
		return this.nodes.container.node().scrollHeight - 16;
	}
}

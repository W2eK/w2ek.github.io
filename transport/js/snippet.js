//--------D3 things--------

class SvgShadow {
	constructor(container, id, props = {'x': 2, 'y': 3, 'b': 6}) {
		this.id = id;
		this.props = props;
		this.node = container.append('filter')
			.attr('id', id)
			.attr('x', -1)
			.attr('y', -1)
			.attr('width', '2000%')
			.attr('height', '2000%')

		this.blur = this.node.append('feGaussianBlur')
			.attr('in', 'SourceAlpha')
			.attr('stdDeviation', props.b)

		this.offset = this.node.append('feOffset')
			.attr('result', 'offsetblur')
			.attr('dx', props.x)
			.attr('dy', props.y)

		this.node.append('feComponentTransfer')
			.append('feFuncA')
			.attr('type', 'linear')
			.attr('slope', 0.3)

		this.node.append('feMerge')
			.append('feMergeNode')

		this.node.select('feMerge')
			.append('feMergeNode')
			.attr('in', 'SourceGraphic')
	}
	redraw(props = {'x': 2, 'y': 3, 'b': 6}, t = d3.transition) {
		this.setOffset(props.x, props.y, t);
		this.setBlur(props.b, t);
	}
	setOffset(x, y, t = d3.transition) {
		this.props.x = x;
		this.props.y = y;
		this.offset.transition(t)
			.attr('dx', x)
			.attr('dy', y)
	}
	setBlur(b, t = d3.transition) {
		this.props.b = b;
		this.blur.transition(t)
			.attr('stdDeviation', b)
	}
}

function createShadow(
	props = {'x': 2, 'y': 3, 'b': 6},
	defs = d3.select(this.node().parentNode).select('defs'),
	id = 'shadow_' + parseInt(Math.random() * 10000000000)
) {
	return new SvgShadow(defs, id, props);
}

d3.selection.prototype.appendShadow = function (props = {'x': 2, 'y': 3, 'b': 6}, defs = d3.select(this.node().parentNode).select('defs')) {
	if(defs.empty()) {
		defs = d3.select(this.node().parentNode).append('defs');
	}
	this.shadow = createShadow(props, defs);
	this.attr('filter', 'url(#' + this.shadow.id + ')')
}

//--------Logical things--------
function compareArrays(a1, a2) {
	if(a1.constructor !== Array) {
		a1 = [a1];
	}
	if(a2.constructor !== Array) {
		a2 = [a2];
	}
	var b = false;
	for(let i = 0; i < a1.length; i++) {
		for(let j = 0; j < a2.length; j++) {
			if(a1[i] == a2[j]) {
				b = true;
				break;
			}
		}
		if(b) { break; }
	}
	return b;
}

function findDuplicates(input) {
	let a = new Array();
	input.forEach((el, i) => {
		if(a.indexOf(el) === -1) {
			a.push(el);
		}
	})
	return a;
}

function getDistance(a, b = [0, 0]) {
	return Math.sqrt(
		Math.pow(	a[0] - b[0], 2) +
		Math.pow(	a[1] - b[1], 2)
	)
}

// function passThru(d) {
// 	let e = d3.event;
// 	let prev = this.style.pointerEvents;
// 	this.style.pointerEvents = 'none'
// 	let el = document.elementFromPoint(d3.event.x, d3.event.y);
// 	let e2 = document.createEvent('MouseEvent');
// 	e2.initMouseEvent(e.type,e.bubbles,e.cancelable,e.view, e.detail,e.screenX,e.screenY,e.clientX,e.clientY,e.ctrlKey,e.altKey,e.shiftKey,e.metaKey,e.button,e.relatedTarget);
// 	el.dispatchEvent(e2);
// 	this.style.pointerEvents = prev;
// }

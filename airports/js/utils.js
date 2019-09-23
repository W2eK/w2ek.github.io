export class EventEmitter {
	constructor() {
		this.events = {};
	}
	on(type, listener) {
		this.events[type] = this.events[type] || [];
		this.events[type].push(listener);
	}
	emit(type, arg) {
		if(this.events[type]) {
			this.events[type].forEach(listener => listener(arg))
		}
	}
}
export class Model {
	constructor(promise) {
        promise.then(res => this.handleData(res))
    }
}
export class View {
    constructor(parent) {
        this.parent = parent;
    }
    bind(data, tag) {
        this.selection = this.parent
            .selectAll()
            .data(data)
            .enter()
			.append(tag)
        return this.selection;
    }
}

export class Component extends View {
	constructor(parent, promise, tag, init) {
		super(parent);
		promise.then(res => init(this.bind(res.features, tag)))
	}
}
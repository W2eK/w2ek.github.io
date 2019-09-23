import {EventEmitter} from './utils.js';
export class Component extends EventEmitter {
    constructor(parent) {
        super();
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
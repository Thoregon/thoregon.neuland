import { TEXT, STATE } from "./constants.js";
export class Text {
    constructor(text) {
        if (typeof text === "string") {
            this.elems = [...text];
        }
        else if (Array.isArray(text)) {
            this.elems = text;
        }
        else if (text === undefined) {
            this.elems = [];
        }
        else {
            throw new TypeError(`Unsupported initial value for Text: ${text}`);
        }
        Reflect.defineProperty(this, TEXT, { value: true });
    }
    get length() {
        return this.elems.length;
    }
    get(index) {
        return this.elems[index];
    }
    /**
     * Iterates over the text elements character by character, including any
     * inline objects.
     */
    [Symbol.iterator]() {
        const elems = this.elems;
        let index = -1;
        return {
            next() {
                index += 1;
                if (index < elems.length) {
                    return { done: false, value: elems[index] };
                }
                else {
                    return { done: true };
                }
            },
        };
    }
    /**
     * Returns the content of the Text object as a simple string, ignoring any
     * non-character elements.
     */
    toString() {
        if (!this.str) {
            // Concatting to a string is faster than creating an array and then
            // .join()ing for small (<100KB) arrays.
            // https://jsperf.com/join-vs-loop-w-type-test
            this.str = "";
            for (const elem of this.elems) {
                if (typeof elem === "string")
                    this.str += elem;
                else
                    this.str += "\uFFFC";
            }
        }
        return this.str;
    }
    /**
     * Returns the content of the Text object as a sequence of strings,
     * interleaved with non-character elements.
     *
     * For example, the value `['a', 'b', {x: 3}, 'c', 'd']` has spans:
     * `=> ['ab', {x: 3}, 'cd']`
     */
    toSpans() {
        if (!this.spans) {
            this.spans = [];
            let chars = "";
            for (const elem of this.elems) {
                if (typeof elem === "string") {
                    chars += elem;
                }
                else {
                    if (chars.length > 0) {
                        this.spans.push(chars);
                        chars = "";
                    }
                    this.spans.push(elem);
                }
            }
            if (chars.length > 0) {
                this.spans.push(chars);
            }
        }
        return this.spans;
    }
    /**
     * Returns the content of the Text object as a simple string, so that the
     * JSON serialization of an Automerge document represents text nicely.
     */
    toJSON() {
        return this.toString();
    }
    /**
     * Updates the list item at position `index` to a new value `value`.
     */
    set(index, value) {
        if (this[STATE]) {
            throw new RangeError("object cannot be modified outside of a change block");
        }
        this.elems[index] = value;
    }
    /**
     * Inserts new list items `values` starting at position `index`.
     */
    insertAt(index, ...values) {
        if (this[STATE]) {
            throw new RangeError("object cannot be modified outside of a change block");
        }
        this.elems.splice(index, 0, ...values);
    }
    /**
     * Deletes `numDelete` list items starting at position `index`.
     * if `numDelete` is not given, one item is deleted.
     */
    deleteAt(index, numDelete = 1) {
        if (this[STATE]) {
            throw new RangeError("object cannot be modified outside of a change block");
        }
        this.elems.splice(index, numDelete);
    }
    map(callback) {
        this.elems.map(callback);
    }
    lastIndexOf(searchElement, fromIndex) {
        this.elems.lastIndexOf(searchElement, fromIndex);
    }
    concat(other) {
        return new Text(this.elems.concat(other.elems));
    }
    every(test) {
        return this.elems.every(test);
    }
    filter(test) {
        return new Text(this.elems.filter(test));
    }
    find(test) {
        return this.elems.find(test);
    }
    findIndex(test) {
        return this.elems.findIndex(test);
    }
    forEach(f) {
        this.elems.forEach(f);
    }
    includes(elem) {
        return this.elems.includes(elem);
    }
    indexOf(elem) {
        return this.elems.indexOf(elem);
    }
    join(sep) {
        return this.elems.join(sep);
    }
    reduce(f) {
        this.elems.reduce(f);
    }
    reduceRight(f) {
        this.elems.reduceRight(f);
    }
    slice(start, end) {
        new Text(this.elems.slice(start, end));
    }
    some(test) {
        return this.elems.some(test);
    }
    toLocaleString() {
        this.toString();
    }
}

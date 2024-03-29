import { Text } from "./text.js";
import { Counter, getWriteableCounter } from "./counter.js";
import { STATE, TRACE, IS_PROXY, OBJECT_ID, COUNTER, INT, UINT, F64, } from "./constants.js";
import { RawString } from "./raw_string.js";
function parseListIndex(key) {
    if (typeof key === "string" && /^[0-9]+$/.test(key))
        key = parseInt(key, 10);
    if (typeof key !== "number") {
        return key;
    }
    if (key < 0 || isNaN(key) || key === Infinity || key === -Infinity) {
        throw new RangeError("A list index must be positive, but you passed " + key);
    }
    return key;
}
function valueAt(target, prop) {
    const { context, objectId, path, readonly, heads, textV2 } = target;
    const value = context.getWithType(objectId, prop, heads);
    if (value === null) {
        return;
    }
    const datatype = value[0];
    const val = value[1];
    switch (datatype) {
        case undefined:
            return;
        case "map":
            return mapProxy(context, val, textV2, [...path, prop], readonly, heads);
        case "list":
            return listProxy(context, val, textV2, [...path, prop], readonly, heads);
        case "text":
            if (textV2) {
                return context.text(val, heads);
            }
            else {
                return textProxy(context, val, [...path, prop], readonly, heads);
            }
        case "str":
            return val;
        case "uint":
            return val;
        case "int":
            return val;
        case "f64":
            return val;
        case "boolean":
            return val;
        case "null":
            return null;
        case "bytes":
            return val;
        case "timestamp":
            return val;
        case "counter": {
            if (readonly) {
                return new Counter(val);
            }
            else {
                return getWriteableCounter(val, context, path, objectId, prop);
            }
        }
        default:
            throw RangeError(`datatype ${datatype} unimplemented`);
    }
}
function import_value(value, textV2) {
    switch (typeof value) {
        case "object":
            if (value == null) {
                return [null, "null"];
            }
            else if (value[UINT]) {
                return [value.value, "uint"];
            }
            else if (value[INT]) {
                return [value.value, "int"];
            }
            else if (value[F64]) {
                return [value.value, "f64"];
            }
            else if (value[COUNTER]) {
                return [value.value, "counter"];
            }
            else if (value instanceof Date) {
                return [value.getTime(), "timestamp"];
            }
            else if (value instanceof RawString) {
                return [value.val, "str"];
            }
            else if (value instanceof Text) {
                return [value, "text"];
            }
            else if (value instanceof Uint8Array) {
                return [value, "bytes"];
            }
            else if (value instanceof Array) {
                return [value, "list"];
            }
            else if (Object.getPrototypeOf(value) === Object.getPrototypeOf({})) {
                return [value, "map"];
            }
            else if (value[OBJECT_ID]) {
                throw new RangeError("Cannot create a reference to an existing document object");
            }
            else {
                throw new RangeError(`Cannot assign unknown object: ${value}`);
            }
        case "boolean":
            return [value, "boolean"];
        case "number":
            if (Number.isInteger(value)) {
                return [value, "int"];
            }
            else {
                return [value, "f64"];
            }
        case "string":
            if (textV2) {
                return [value, "text"];
            }
            else {
                return [value, "str"];
            }
        default:
            throw new RangeError(`Unsupported type of value: ${typeof value}`);
    }
}
const MapHandler = {
    get(target, key) {
        const { context, objectId, cache } = target;
        if (key === Symbol.toStringTag) {
            return target[Symbol.toStringTag];
        }
        if (key === OBJECT_ID)
            return objectId;
        if (key === IS_PROXY)
            return true;
        if (key === TRACE)
            return target.trace;
        if (key === STATE)
            return { handle: context };
        if (!cache[key]) {
            cache[key] = valueAt(target, key);
        }
        return cache[key];
    },
    set(target, key, val) {
        const { context, objectId, path, readonly, frozen, textV2 } = target;
        target.cache = {}; // reset cache on set
        if (val && val[OBJECT_ID]) {
            throw new RangeError("Cannot create a reference to an existing document object");
        }
        if (key === TRACE) {
            target.trace = val;
            return true;
        }
        const [value, datatype] = import_value(val, textV2);
        if (frozen) {
            throw new RangeError("Attempting to use an outdated Automerge document");
        }
        if (readonly) {
            throw new RangeError(`Object property "${key}" cannot be modified`);
        }
        switch (datatype) {
            case "list": {
                const list = context.putObject(objectId, key, []);
                const proxyList = listProxy(context, list, textV2, [...path, key], readonly);
                for (let i = 0; i < value.length; i++) {
                    proxyList[i] = value[i];
                }
                break;
            }
            case "text": {
                if (textV2) {
                    context.putObject(objectId, key, value);
                }
                else {
                    const text = context.putObject(objectId, key, "");
                    const proxyText = textProxy(context, text, [...path, key], readonly);
                    for (let i = 0; i < value.length; i++) {
                        proxyText[i] = value.get(i);
                    }
                }
                break;
            }
            case "map": {
                const map = context.putObject(objectId, key, {});
                const proxyMap = mapProxy(context, map, textV2, [...path, key], readonly);
                for (const key in value) {
                    proxyMap[key] = value[key];
                }
                break;
            }
            default:
                context.put(objectId, key, value, datatype);
        }
        return true;
    },
    deleteProperty(target, key) {
        const { context, objectId, readonly } = target;
        target.cache = {}; // reset cache on delete
        if (readonly) {
            throw new RangeError(`Object property "${key}" cannot be modified`);
        }
        context.delete(objectId, key);
        return true;
    },
    has(target, key) {
        const value = this.get(target, key);
        return value !== undefined;
    },
    getOwnPropertyDescriptor(target, key) {
        // const { context, objectId } = target
        const value = this.get(target, key);
        if (typeof value !== "undefined") {
            return {
                configurable: true,
                enumerable: true,
                value,
            };
        }
    },
    ownKeys(target) {
        const { context, objectId, heads } = target;
        // FIXME - this is a tmp workaround until fix the dupe key bug in keys()
        const keys = context.keys(objectId, heads);
        return [...new Set(keys)];
    },
};
const ListHandler = {
    get(target, index) {
        const { context, objectId, heads } = target;
        index = parseListIndex(index);
        if (index === Symbol.hasInstance) {
            return instance => {
                return Array.isArray(instance);
            };
        }
        if (index === Symbol.toStringTag) {
            return target[Symbol.toStringTag];
        }
        if (index === OBJECT_ID)
            return objectId;
        if (index === IS_PROXY)
            return true;
        if (index === TRACE)
            return target.trace;
        if (index === STATE)
            return { handle: context };
        if (index === "length")
            return context.length(objectId, heads);
        if (typeof index === "number") {
            return valueAt(target, index);
        }
        else {
            return listMethods(target)[index];
        }
    },
    set(target, index, val) {
        const { context, objectId, path, readonly, frozen, textV2 } = target;
        index = parseListIndex(index);
        if (val && val[OBJECT_ID]) {
            throw new RangeError("Cannot create a reference to an existing document object");
        }
        if (index === TRACE) {
            target.trace = val;
            return true;
        }
        if (typeof index == "string") {
            throw new RangeError("list index must be a number");
        }
        const [value, datatype] = import_value(val, textV2);
        if (frozen) {
            throw new RangeError("Attempting to use an outdated Automerge document");
        }
        if (readonly) {
            throw new RangeError(`Object property "${index}" cannot be modified`);
        }
        switch (datatype) {
            case "list": {
                let list;
                if (index >= context.length(objectId)) {
                    list = context.insertObject(objectId, index, []);
                }
                else {
                    list = context.putObject(objectId, index, []);
                }
                const proxyList = listProxy(context, list, textV2, [...path, index], readonly);
                proxyList.splice(0, 0, ...value);
                break;
            }
            case "text": {
                if (textV2) {
                    if (index >= context.length(objectId)) {
                        context.insertObject(objectId, index, value);
                    }
                    else {
                        context.putObject(objectId, index, value);
                    }
                }
                else {
                    let text;
                    if (index >= context.length(objectId)) {
                        text = context.insertObject(objectId, index, "");
                    }
                    else {
                        text = context.putObject(objectId, index, "");
                    }
                    const proxyText = textProxy(context, text, [...path, index], readonly);
                    proxyText.splice(0, 0, ...value);
                }
                break;
            }
            case "map": {
                let map;
                if (index >= context.length(objectId)) {
                    map = context.insertObject(objectId, index, {});
                }
                else {
                    map = context.putObject(objectId, index, {});
                }
                const proxyMap = mapProxy(context, map, textV2, [...path, index], readonly);
                for (const key in value) {
                    proxyMap[key] = value[key];
                }
                break;
            }
            default:
                if (index >= context.length(objectId)) {
                    context.insert(objectId, index, value, datatype);
                }
                else {
                    context.put(objectId, index, value, datatype);
                }
        }
        return true;
    },
    deleteProperty(target, index) {
        const { context, objectId } = target;
        index = parseListIndex(index);
        const elem = context.get(objectId, index);
        if (elem != null && elem[0] == "counter") {
            throw new TypeError("Unsupported operation: deleting a counter from a list");
        }
        context.delete(objectId, index);
        return true;
    },
    has(target, index) {
        const { context, objectId, heads } = target;
        index = parseListIndex(index);
        if (typeof index === "number") {
            return index < context.length(objectId, heads);
        }
        return index === "length";
    },
    getOwnPropertyDescriptor(target, index) {
        const { context, objectId, heads } = target;
        if (index === "length")
            return { writable: true, value: context.length(objectId, heads) };
        if (index === OBJECT_ID)
            return { configurable: false, enumerable: false, value: objectId };
        index = parseListIndex(index);
        const value = valueAt(target, index);
        return { configurable: true, enumerable: true, value };
    },
    getPrototypeOf(target) {
        return Object.getPrototypeOf(target);
    },
    ownKeys( /*target*/) {
        const keys = [];
        // uncommenting this causes assert.deepEqual() to fail when comparing to a pojo array
        // but not uncommenting it causes for (i in list) {} to not enumerate values properly
        //const {context, objectId, heads } = target
        //for (let i = 0; i < target.context.length(objectId, heads); i++) { keys.push(i.toString()) }
        keys.push("length");
        return keys;
    },
};
const TextHandler = Object.assign({}, ListHandler, {
    get(target, index) {
        const { context, objectId, heads } = target;
        index = parseListIndex(index);
        if (index === Symbol.hasInstance) {
            return (instance) => {
                return Array.isArray(instance);
            };
        }
        if (index === Symbol.toStringTag) {
            return target[Symbol.toStringTag];
        }
        if (index === OBJECT_ID)
            return objectId;
        if (index === IS_PROXY)
            return true;
        if (index === TRACE)
            return target.trace;
        if (index === STATE)
            return { handle: context };
        if (index === "length")
            return context.length(objectId, heads);
        if (typeof index === "number") {
            return valueAt(target, index);
        }
        else {
            return textMethods(target)[index] || listMethods(target)[index];
        }
    },
    getPrototypeOf( /*target*/) {
        return Object.getPrototypeOf(new Text());
    },
});
export function mapProxy(context, objectId, textV2, path, readonly, heads) {
    const target = {
        context,
        objectId,
        path: path || [],
        readonly: !!readonly,
        frozen: false,
        heads,
        cache: {},
        textV2,
    };
    const proxied = {};
    Object.assign(proxied, target);
    let result = new Proxy(proxied, MapHandler);
    // conversion through unknown is necessary because the types are so different
    return result;
}
export function listProxy(context, objectId, textV2, path, readonly, heads) {
    const target = {
        context,
        objectId,
        path: path || [],
        readonly: !!readonly,
        frozen: false,
        heads,
        cache: {},
        textV2,
    };
    const proxied = [];
    Object.assign(proxied, target);
    // @ts-ignore
    return new Proxy(proxied, ListHandler);
}
export function textProxy(context, objectId, path, readonly, heads) {
    const target = {
        context,
        objectId,
        path: path || [],
        readonly: !!readonly,
        frozen: false,
        heads,
        cache: {},
        textV2: false,
    };
    return new Proxy(target, TextHandler);
}
export function rootProxy(context, textV2, readonly) {
    /* eslint-disable-next-line */
    return mapProxy(context, "_root", textV2, [], !!readonly);
}
function listMethods(target) {
    const { context, objectId, path, readonly, frozen, heads, textV2 } = target;
    const methods = {
        deleteAt(index, numDelete) {
            if (typeof numDelete === "number") {
                context.splice(objectId, index, numDelete);
            }
            else {
                context.delete(objectId, index);
            }
            return this;
        },
        fill(val, start, end) {
            const [value, datatype] = import_value(val, textV2);
            const length = context.length(objectId);
            start = parseListIndex(start || 0);
            end = parseListIndex(end || length);
            for (let i = start; i < Math.min(end, length); i++) {
                if (datatype === "text" || datatype === "list" || datatype === "map") {
                    context.putObject(objectId, i, value);
                }
                else {
                    context.put(objectId, i, value, datatype);
                }
            }
            return this;
        },
        indexOf(o, start = 0) {
            const length = context.length(objectId);
            for (let i = start; i < length; i++) {
                const value = context.getWithType(objectId, i, heads);
                if (value && (value[1] === o[OBJECT_ID] || value[1] === o)) {
                    return i;
                }
            }
            return -1;
        },
        insertAt(index, ...values) {
            this.splice(index, 0, ...values);
            return this;
        },
        pop() {
            const length = context.length(objectId);
            if (length == 0) {
                return undefined;
            }
            const last = valueAt(target, length - 1);
            context.delete(objectId, length - 1);
            return last;
        },
        push(...values) {
            const len = context.length(objectId);
            this.splice(len, 0, ...values);
            return context.length(objectId);
        },
        shift() {
            if (context.length(objectId) == 0)
                return;
            const first = valueAt(target, 0);
            context.delete(objectId, 0);
            return first;
        },
        splice(index, del, ...vals) {
            index = parseListIndex(index);
            del = parseListIndex(del);
            for (const val of vals) {
                if (val && val[OBJECT_ID]) {
                    throw new RangeError("Cannot create a reference to an existing document object");
                }
            }
            if (frozen) {
                throw new RangeError("Attempting to use an outdated Automerge document");
            }
            if (readonly) {
                throw new RangeError("Sequence object cannot be modified outside of a change block");
            }
            const result = [];
            for (let i = 0; i < del; i++) {
                const value = valueAt(target, index);
                if (value !== undefined) {
                    result.push(value);
                }
                context.delete(objectId, index);
            }
            const values = vals.map(val => import_value(val, textV2));
            for (const [value, datatype] of values) {
                switch (datatype) {
                    case "list": {
                        const list = context.insertObject(objectId, index, []);
                        const proxyList = listProxy(context, list, textV2, [...path, index], readonly);
                        proxyList.splice(0, 0, ...value);
                        break;
                    }
                    case "text": {
                        if (textV2) {
                            context.insertObject(objectId, index, value);
                        }
                        else {
                            const text = context.insertObject(objectId, index, "");
                            const proxyText = textProxy(context, text, [...path, index], readonly);
                            proxyText.splice(0, 0, ...value);
                        }
                        break;
                    }
                    case "map": {
                        const map = context.insertObject(objectId, index, {});
                        const proxyMap = mapProxy(context, map, textV2, [...path, index], readonly);
                        for (const key in value) {
                            proxyMap[key] = value[key];
                        }
                        break;
                    }
                    default:
                        context.insert(objectId, index, value, datatype);
                }
                index += 1;
            }
            return result;
        },
        unshift(...values) {
            this.splice(0, 0, ...values);
            return context.length(objectId);
        },
        entries() {
            const i = 0;
            const iterator = {
                next: () => {
                    const value = valueAt(target, i);
                    if (value === undefined) {
                        return { value: undefined, done: true };
                    }
                    else {
                        return { value: [i, value], done: false };
                    }
                },
            };
            return iterator;
        },
        keys() {
            let i = 0;
            const len = context.length(objectId, heads);
            const iterator = {
                next: () => {
                    let value = undefined;
                    if (i < len) {
                        value = i;
                        i++;
                    }
                    return { value, done: true };
                },
            };
            return iterator;
        },
        values() {
            const i = 0;
            const iterator = {
                next: () => {
                    const value = valueAt(target, i);
                    if (value === undefined) {
                        return { value: undefined, done: true };
                    }
                    else {
                        return { value, done: false };
                    }
                },
            };
            return iterator;
        },
        toArray() {
            const list = [];
            let value;
            do {
                value = valueAt(target, list.length);
                if (value !== undefined) {
                    list.push(value);
                }
            } while (value !== undefined);
            return list;
        },
        map(f) {
            return this.toArray().map(f);
        },
        toString() {
            return this.toArray().toString();
        },
        toLocaleString() {
            return this.toArray().toLocaleString();
        },
        forEach(f) {
            return this.toArray().forEach(f);
        },
        // todo: real concat function is different
        concat(other) {
            return this.toArray().concat(other);
        },
        every(f) {
            return this.toArray().every(f);
        },
        filter(f) {
            return this.toArray().filter(f);
        },
        find(f) {
            let index = 0;
            for (const v of this) {
                if (f(v, index)) {
                    return v;
                }
                index += 1;
            }
        },
        findIndex(f) {
            let index = 0;
            for (const v of this) {
                if (f(v, index)) {
                    return index;
                }
                index += 1;
            }
            return -1;
        },
        includes(elem) {
            return this.find(e => e === elem) !== undefined;
        },
        join(sep) {
            return this.toArray().join(sep);
        },
        // todo: remove the any
        reduce(f, initalValue) {
            return this.toArray().reduce(f, initalValue);
        },
        // todo: remove the any
        reduceRight(f, initalValue) {
            return this.toArray().reduceRight(f, initalValue);
        },
        lastIndexOf(search, fromIndex = +Infinity) {
            // this can be faster
            return this.toArray().lastIndexOf(search, fromIndex);
        },
        slice(index, num) {
            return this.toArray().slice(index, num);
        },
        some(f) {
            let index = 0;
            for (const v of this) {
                if (f(v, index)) {
                    return true;
                }
                index += 1;
            }
            return false;
        },
        [Symbol.iterator]: function* () {
            let i = 0;
            let value = valueAt(target, i);
            while (value !== undefined) {
                yield value;
                i += 1;
                value = valueAt(target, i);
            }
        },
    };
    return methods;
}
function textMethods(target) {
    const { context, objectId, heads } = target;
    const methods = {
        set(index, value) {
            return (this[index] = value);
        },
        get(index) {
            return this[index];
        },
        toString() {
            return context.text(objectId, heads).replace(/￼/g, "");
        },
        toSpans() {
            const spans = [];
            let chars = "";
            const length = context.length(objectId);
            for (let i = 0; i < length; i++) {
                const value = this[i];
                if (typeof value === "string") {
                    chars += value;
                }
                else {
                    if (chars.length > 0) {
                        spans.push(chars);
                        chars = "";
                    }
                    spans.push(value);
                }
            }
            if (chars.length > 0) {
                spans.push(chars);
            }
            return spans;
        },
        toJSON() {
            return this.toString();
        },
        indexOf(o, start = 0) {
            const text = context.text(objectId);
            return text.indexOf(o, start);
        },
    };
    return methods;
}

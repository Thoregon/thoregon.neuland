import { STATE, OBJECT_ID, TRACE, IS_PROXY } from "./constants.js";
export function _state(doc, checkroot = true) {
    if (typeof doc !== "object") {
        throw new RangeError("must be the document root");
    }
    const state = Reflect.get(doc, STATE);
    if (state === undefined ||
        state == null ||
        (checkroot && _obj(doc) !== "_root")) {
        throw new RangeError("must be the document root");
    }
    return state;
}
export function _trace(doc) {
    return Reflect.get(doc, TRACE);
}
export function _obj(doc) {
    if (!(typeof doc === "object") || doc === null) {
        return null;
    }
    return Reflect.get(doc, OBJECT_ID);
}
export function _is_proxy(doc) {
    return !!Reflect.get(doc, IS_PROXY);
}

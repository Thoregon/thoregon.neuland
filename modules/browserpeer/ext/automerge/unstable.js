export { Counter, Int, Uint, Float64 } from "./types.js";
export { view, free, getHeads, change, emptyChange, loadIncremental, save, merge, getActorId, getLastLocalChange, getChanges, getAllChanges, applyChanges, getHistory, equals, encodeSyncState, decodeSyncState, generateSyncMessage, receiveSyncMessage, initSyncState, encodeChange, decodeChange, encodeSyncMessage, decodeSyncMessage, getMissingDeps, dump, toJS, isAutomerge, getObjectId, } from "./stable.js";
import * as stable from "./stable.js";
export { RawString } from "./raw_string.js";
/** @hidden */
export const getBackend = stable.getBackend;
import { _is_proxy, _state, _obj } from "./internal_state.js";
/**
 * Create a new automerge document
 *
 * @typeParam T - The type of value contained in the document. This will be the
 *     type that is passed to the change closure in {@link change}
 * @param _opts - Either an actorId or an {@link InitOptions} (which may
 *     contain an actorId). If this is null the document will be initialised with a
 *     random actor ID
 */
export function init(_opts) {
    let opts = importOpts(_opts);
    opts.enableTextV2 = true;
    return stable.init(opts);
}
/**
 * Make a full writable copy of an automerge document
 *
 * @remarks
 * Unlike {@link view} this function makes a full copy of the memory backing
 * the document and can thus be passed to {@link change}. It also generates a
 * new actor ID so that changes made in the new document do not create duplicate
 * sequence numbers with respect to the old document. If you need control over
 * the actor ID which is generated you can pass the actor ID as the second
 * argument
 *
 * @typeParam T - The type of the value contained in the document
 * @param doc - The document to clone
 * @param _opts - Either an actor ID to use for the new doc or an {@link InitOptions}
 */
export function clone(doc, _opts) {
    let opts = importOpts(_opts);
    opts.enableTextV2 = true;
    return stable.clone(doc, opts);
}
/**
 * Create an automerge document from a POJO
 *
 * @param initialState - The initial state which will be copied into the document
 * @typeParam T - The type of the value passed to `from` _and_ the type the resulting document will contain
 * @typeParam actor - The actor ID of the resulting document, if this is null a random actor ID will be used
 *
 * @example
 * ```
 * const doc = automerge.from({
 *     tasks: [
 *         {description: "feed dogs", done: false}
 *     ]
 * })
 * ```
 */
export function from(initialState, _opts) {
    const opts = importOpts(_opts);
    opts.enableTextV2 = true;
    return stable.from(initialState, opts);
}
/**
 * Load an automerge document from a compressed document produce by {@link save}
 *
 * @typeParam T - The type of the value which is contained in the document.
 *                Note that no validation is done to make sure this type is in
 *                fact the type of the contained value so be a bit careful
 * @param data  - The compressed document
 * @param _opts - Either an actor ID or some {@link InitOptions}, if the actor
 *                ID is null a random actor ID will be created
 *
 * Note that `load` will throw an error if passed incomplete content (for
 * example if you are receiving content over the network and don't know if you
 * have the complete document yet). If you need to handle incomplete content use
 * {@link init} followed by {@link loadIncremental}.
 */
export function load(data, _opts) {
    const opts = importOpts(_opts);
    opts.enableTextV2 = true;
    return stable.load(data, opts);
}
function importOpts(_actor) {
    if (typeof _actor === "object") {
        return _actor;
    }
    else {
        return { actor: _actor };
    }
}
export function splice(doc, prop, index, del, newText) {
    if (!_is_proxy(doc)) {
        throw new RangeError("object cannot be modified outside of a change block");
    }
    const state = _state(doc, false);
    const objectId = _obj(doc);
    if (!objectId) {
        throw new RangeError("invalid object for splice");
    }
    const value = `${objectId}/${prop}`;
    try {
        return state.handle.splice(value, index, del, newText);
    }
    catch (e) {
        throw new RangeError(`Cannot splice: ${e}`);
    }
}
/**
 * Get the conflicts associated with a property
 *
 * The values of properties in a map in automerge can be conflicted if there
 * are concurrent "put" operations to the same key. Automerge chooses one value
 * arbitrarily (but deterministically, any two nodes who have the same set of
 * changes will choose the same value) from the set of conflicting values to
 * present as the value of the key.
 *
 * Sometimes you may want to examine these conflicts, in this case you can use
 * {@link getConflicts} to get the conflicts for the key.
 *
 * @example
 * ```
 * import * as automerge from "@automerge/automerge"
 *
 * type Profile = {
 *     pets: Array<{name: string, type: string}>
 * }
 *
 * let doc1 = automerge.init<Profile>("aaaa")
 * doc1 = automerge.change(doc1, d => {
 *     d.pets = [{name: "Lassie", type: "dog"}]
 * })
 * let doc2 = automerge.init<Profile>("bbbb")
 * doc2 = automerge.merge(doc2, automerge.clone(doc1))
 *
 * doc2 = automerge.change(doc2, d => {
 *     d.pets[0].name = "Beethoven"
 * })
 *
 * doc1 = automerge.change(doc1, d => {
 *     d.pets[0].name = "Babe"
 * })
 *
 * const doc3 = automerge.merge(doc1, doc2)
 *
 * // Note that here we pass `doc3.pets`, not `doc3`
 * let conflicts = automerge.getConflicts(doc3.pets[0], "name")
 *
 * // The two conflicting values are the keys of the conflicts object
 * assert.deepEqual(Object.values(conflicts), ["Babe", Beethoven"])
 * ```
 */
export function getConflicts(doc, prop) {
    // this function only exists to get the types to line up with future.AutomergeValue
    return stable.getConflicts(doc, prop);
}

var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
/** @hidden **/
export { /** @hidden */ uuid } from "./uuid.js";
import { rootProxy, listProxy, mapProxy, textProxy } from "./proxies.js";
import { STATE } from "./constants.js";
import { Counter } from "./types.js";
export { Counter, Int, Uint, Float64, Text, } from "./types.js";
import { Text } from "./text.js";
import { ApiHandler, UseApi } from "./low_level.js";
import { RawString } from "./raw_string.js";
import { _state, _is_proxy, _trace, _obj } from "./internal_state.js";
/** @hidden **/
export function use(api) {
    UseApi(api);
}

//
// WASM
//

import * as wasm from "./wasm/automerge_wasm.js";
use(wasm);

//
// WASM
//

/** @hidden */
export function getBackend(doc) {
    return _state(doc).handle;
}
function importOpts(_actor) {
    if (typeof _actor === "object") {
        return _actor;
    }
    else {
        return { actor: _actor };
    }
}
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
    const opts = importOpts(_opts);
    const freeze = !!opts.freeze;
    const patchCallback = opts.patchCallback;
    const handle = ApiHandler.create(opts.enableTextV2 || false, opts.actor);
    handle.enablePatches(true);
    handle.enableFreeze(!!opts.freeze);
    handle.registerDatatype("counter", (n) => new Counter(n));
    let textV2 = opts.enableTextV2 || false;
    if (textV2) {
        handle.registerDatatype("str", (n) => new RawString(n));
    }
    else {
        handle.registerDatatype("text", (n) => new Text(n));
    }
    const doc = handle.materialize("/", undefined, {
        handle,
        heads: undefined,
        freeze,
        patchCallback,
        textV2,
    });
    return doc;
}
/**
 * Make an immutable view of an automerge document as at `heads`
 *
 * @remarks
 * The document returned from this function cannot be passed to {@link change}.
 * This is because it shares the same underlying memory as `doc`, but it is
 * consequently a very cheap copy.
 *
 * Note that this function will throw an error if any of the hashes in `heads`
 * are not in the document.
 *
 * @typeParam T - The type of the value contained in the document
 * @param doc - The document to create a view of
 * @param heads - The hashes of the heads to create a view at
 */
export function view(doc, heads) {
    const state = _state(doc);
    const handle = state.handle;
    return state.handle.materialize("/", heads, Object.assign(Object.assign({}, state), { handle,
        heads }));
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
    const state = _state(doc);
    const heads = state.heads;
    const opts = importOpts(_opts);
    const handle = state.handle.fork(opts.actor, heads);
    // `change` uses the presence of state.heads to determine if we are in a view
    // set it to undefined to indicate that this is a full fat document
    const { heads: oldHeads } = state, stateSansHeads = __rest(state, ["heads"]);
    return handle.applyPatches(doc, Object.assign(Object.assign({}, stateSansHeads), { handle }));
}
/** Explicity free the memory backing a document. Note that this is note
 * necessary in environments which support
 * [`FinalizationRegistry`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)
 */
export function free(doc) {
    return _state(doc).handle.free();
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
    return change(init(_opts), d => Object.assign(d, initialState));
}
/**
 * Update the contents of an automerge document
 * @typeParam T - The type of the value contained in the document
 * @param doc - The document to update
 * @param options - Either a message, an {@link ChangeOptions}, or a {@link ChangeFn}
 * @param callback - A `ChangeFn` to be used if `options` was a `string`
 *
 * Note that if the second argument is a function it will be used as the `ChangeFn` regardless of what the third argument is.
 *
 * @example A simple change
 * ```
 * let doc1 = automerge.init()
 * doc1 = automerge.change(doc1, d => {
 *     d.key = "value"
 * })
 * assert.equal(doc1.key, "value")
 * ```
 *
 * @example A change with a message
 *
 * ```
 * doc1 = automerge.change(doc1, "add another value", d => {
 *     d.key2 = "value2"
 * })
 * ```
 *
 * @example A change with a message and a timestamp
 *
 * ```
 * doc1 = automerge.change(doc1, {message: "add another value", timestamp: 1640995200}, d => {
 *     d.key2 = "value2"
 * })
 * ```
 *
 * @example responding to a patch callback
 * ```
 * let patchedPath
 * let patchCallback = patch => {
 *    patchedPath = patch.path
 * }
 * doc1 = automerge.change(doc1, {message, "add another value", timestamp: 1640995200, patchCallback}, d => {
 *     d.key2 = "value2"
 * })
 * assert.equal(patchedPath, ["key2"])
 * ```
 */
export function change(doc, options, callback) {
    if (typeof options === "function") {
        return _change(doc, {}, options);
    }
    else if (typeof callback === "function") {
        if (typeof options === "string") {
            options = { message: options };
        }
        return _change(doc, options, callback);
    }
    else {
        throw RangeError("Invalid args for change");
    }
}
function progressDocument(doc, heads, callback) {
    if (heads == null) {
        return doc;
    }
    const state = _state(doc);
    const nextState = Object.assign(Object.assign({}, state), { heads: undefined });
    const nextDoc = state.handle.applyPatches(doc, nextState, callback);
    state.heads = heads;
    return nextDoc;
}
function _change(doc, options, callback) {
    if (typeof callback !== "function") {
        throw new RangeError("invalid change function");
    }
    const state = _state(doc);
    if (doc === undefined || state === undefined) {
        throw new RangeError("must be the document root");
    }
    if (state.heads) {
        throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
    }
    if (_is_proxy(doc)) {
        throw new RangeError("Calls to Automerge.change cannot be nested");
    }
    const heads = state.handle.getHeads();
    try {
        state.heads = heads;
        const root = rootProxy(state.handle, state.textV2);
        callback(root);
        if (state.handle.pendingOps() === 0) {
            state.heads = undefined;
            return doc;
        }
        else {
            state.handle.commit(options.message, options.time);
            return progressDocument(doc, heads, options.patchCallback || state.patchCallback);
        }
    }
    catch (e) {
        state.heads = undefined;
        state.handle.rollback();
        throw e;
    }
}
/**
 * Make a change to a document which does not modify the document
 *
 * @param doc - The doc to add the empty change to
 * @param options - Either a message or a {@link ChangeOptions} for the new change
 *
 * Why would you want to do this? One reason might be that you have merged
 * changes from some other peers and you want to generate a change which
 * depends on those merged changes so that you can sign the new change with all
 * of the merged changes as part of the new change.
 */
export function emptyChange(doc, options) {
    if (options === undefined) {
        options = {};
    }
    if (typeof options === "string") {
        options = { message: options };
    }
    const state = _state(doc);
    if (state.heads) {
        throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
    }
    if (_is_proxy(doc)) {
        throw new RangeError("Calls to Automerge.change cannot be nested");
    }
    const heads = state.handle.getHeads();
    state.handle.emptyChange(options.message, options.time);
    return progressDocument(doc, heads);
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
    const actor = opts.actor;
    const patchCallback = opts.patchCallback;
    const handle = ApiHandler.load(data, opts.enableTextV2 || false, actor);
    handle.enablePatches(true);
    handle.enableFreeze(!!opts.freeze);
    handle.registerDatatype("counter", (n) => new Counter(n));
    const textV2 = opts.enableTextV2 || false;
    if (textV2) {
        handle.registerDatatype("str", (n) => new RawString(n));
    }
    else {
        handle.registerDatatype("text", (n) => new Text(n));
    }
    const doc = handle.materialize("/", undefined, {
        handle,
        heads: undefined,
        patchCallback,
        textV2,
    });
    return doc;
}
/**
 * Load changes produced by {@link saveIncremental}, or partial changes
 *
 * @typeParam T - The type of the value which is contained in the document.
 *                Note that no validation is done to make sure this type is in
 *                fact the type of the contained value so be a bit careful
 * @param data  - The compressedchanges
 * @param opts  - an {@link ApplyOptions}
 *
 * This function is useful when staying up to date with a connected peer.
 * Perhaps the other end sent you a full compresed document which you loaded
 * with {@link load} and they're sending you the result of
 * {@link getLastLocalChange} every time they make a change.
 *
 * Note that this function will succesfully load the results of {@link save} as
 * well as {@link getLastLocalChange} or any other incremental change.
 */
export function loadIncremental(doc, data, opts) {
    if (!opts) {
        opts = {};
    }
    const state = _state(doc);
    if (state.heads) {
        throw new RangeError("Attempting to change an out of date document - set at: " + _trace(doc));
    }
    if (_is_proxy(doc)) {
        throw new RangeError("Calls to Automerge.change cannot be nested");
    }
    const heads = state.handle.getHeads();
    state.handle.loadIncremental(data);
    return progressDocument(doc, heads, opts.patchCallback || state.patchCallback);
}
/**
 * Export the contents of a document to a compressed format
 *
 * @param doc - The doc to save
 *
 * The returned bytes can be passed to {@link load} or {@link loadIncremental}
 */
export function save(doc) {
    return _state(doc).handle.save();
}
/**
 * Merge `local` into `remote`
 * @typeParam T - The type of values contained in each document
 * @param local - The document to merge changes into
 * @param remote - The document to merge changes from
 *
 * @returns - The merged document
 *
 * Often when you are merging documents you will also need to clone them. Both
 * arguments to `merge` are frozen after the call so you can no longer call
 * mutating methods (such as {@link change}) on them. The symtom of this will be
 * an error which says "Attempting to change an out of date document". To
 * overcome this call {@link clone} on the argument before passing it to {@link
 * merge}.
 */
export function merge(local, remote) {
    const localState = _state(local);
    if (localState.heads) {
        throw new RangeError("Attempting to change an out of date document - set at: " + _trace(local));
    }
    const heads = localState.handle.getHeads();
    const remoteState = _state(remote);
    const changes = localState.handle.getChangesAdded(remoteState.handle);
    localState.handle.applyChanges(changes);
    return progressDocument(local, heads, localState.patchCallback);
}
/**
 * Get the actor ID associated with the document
 */
export function getActorId(doc) {
    const state = _state(doc);
    return state.handle.getActorId();
}
function conflictAt(context, objectId, prop, textV2) {
    const values = context.getAll(objectId, prop);
    if (values.length <= 1) {
        return;
    }
    const result = {};
    for (const fullVal of values) {
        switch (fullVal[0]) {
            case "map":
                result[fullVal[1]] = mapProxy(context, fullVal[1], textV2, [prop], true);
                break;
            case "list":
                result[fullVal[1]] = listProxy(context, fullVal[1], textV2, [prop], true);
                break;
            case "text":
                if (textV2) {
                    result[fullVal[1]] = context.text(fullVal[1]);
                }
                else {
                    result[fullVal[1]] = textProxy(context, objectId, [prop], true);
                }
                break;
            //case "table":
            //case "cursor":
            case "str":
            case "uint":
            case "int":
            case "f64":
            case "boolean":
            case "bytes":
            case "null":
                result[fullVal[2]] = fullVal[1];
                break;
            case "counter":
                result[fullVal[2]] = new Counter(fullVal[1]);
                break;
            case "timestamp":
                result[fullVal[2]] = new Date(fullVal[1]);
                break;
            default:
                throw RangeError(`datatype ${fullVal[0]} unimplemented`);
        }
    }
    return result;
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
    const state = _state(doc, false);
    const objectId = _obj(doc);
    if (objectId != null) {
        return conflictAt(state.handle, objectId, prop, state.textV2);
    }
    else {
        return undefined;
    }
}
/**
 * Get the binary representation of the last change which was made to this doc
 *
 * This is most useful when staying in sync with other peers, every time you
 * make a change locally via {@link change} you immediately call {@link
 * getLastLocalChange} and send the result over the network to other peers.
 */
export function getLastLocalChange(doc) {
    const state = _state(doc);
    return state.handle.getLastLocalChange() || undefined;
}
/**
 * Return the object ID of an arbitrary javascript value
 *
 * This is useful to determine if something is actually an automerge document,
 * if `doc` is not an automerge document this will return null.
 */
export function getObjectId(doc, prop) {
    if (prop) {
        const state = _state(doc, false);
        const objectId = _obj(doc);
        if (!state || !objectId) {
            return null;
        }
        return state.handle.get(objectId, prop);
    }
    else {
        return _obj(doc);
    }
}
/**
 * Get the changes which are in `newState` but not in `oldState`. The returned
 * changes can be loaded in `oldState` via {@link applyChanges}.
 *
 * Note that this will crash if there are changes in `oldState` which are not in `newState`.
 */
export function getChanges(oldState, newState) {
    const n = _state(newState);
    return n.handle.getChanges(getHeads(oldState));
}
/**
 * Get all the changes in a document
 *
 * This is different to {@link save} because the output is an array of changes
 * which can be individually applied via {@link applyChanges}`
 *
 */
export function getAllChanges(doc) {
    const state = _state(doc);
    return state.handle.getChanges([]);
}
/**
 * Apply changes received from another document
 *
 * `doc` will be updated to reflect the `changes`. If there are changes which
 * we do not have dependencies for yet those will be stored in the document and
 * applied when the depended on changes arrive.
 *
 * You can use the {@link ApplyOptions} to pass a patchcallback which will be
 * informed of any changes which occur as a result of applying the changes
 *
 */
export function applyChanges(doc, changes, opts) {
    const state = _state(doc);
    if (!opts) {
        opts = {};
    }
    if (state.heads) {
        throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
    }
    if (_is_proxy(doc)) {
        throw new RangeError("Calls to Automerge.change cannot be nested");
    }
    const heads = state.handle.getHeads();
    state.handle.applyChanges(changes);
    state.heads = heads;
    return [
        progressDocument(doc, heads, opts.patchCallback || state.patchCallback),
    ];
}
/** @hidden */
export function getHistory(doc) {
    const textV2 = _state(doc).textV2;
    const history = getAllChanges(doc);
    return history.map((change, index) => ({
        get change() {
            return decodeChange(change);
        },
        get snapshot() {
            const [state] = applyChanges(init({ enableTextV2: textV2 }), history.slice(0, index + 1));
            return state;
        },
    }));
}
/** @hidden */
// FIXME : no tests
// FIXME can we just use deep equals now?
export function equals(val1, val2) {
    if (!isObject(val1) || !isObject(val2))
        return val1 === val2;
    const keys1 = Object.keys(val1).sort(), keys2 = Object.keys(val2).sort();
    if (keys1.length !== keys2.length)
        return false;
    for (let i = 0; i < keys1.length; i++) {
        if (keys1[i] !== keys2[i])
            return false;
        if (!equals(val1[keys1[i]], val2[keys2[i]]))
            return false;
    }
    return true;
}
/**
 * encode a {@link SyncState} into binary to send over the network
 *
 * @group sync
 * */
export function encodeSyncState(state) {
    const sync = ApiHandler.importSyncState(state);
    const result = ApiHandler.encodeSyncState(sync);
    sync.free();
    return result;
}
/**
 * Decode some binary data into a {@link SyncState}
 *
 * @group sync
 */
export function decodeSyncState(state) {
    const sync = ApiHandler.decodeSyncState(state);
    const result = ApiHandler.exportSyncState(sync);
    sync.free();
    return result;
}
/**
 * Generate a sync message to send to the peer represented by `inState`
 * @param doc - The doc to generate messages about
 * @param inState - The {@link SyncState} representing the peer we are talking to
 *
 * @group sync
 *
 * @returns An array of `[newSyncState, syncMessage | null]` where
 * `newSyncState` should replace `inState` and `syncMessage` should be sent to
 * the peer if it is not null. If `syncMessage` is null then we are up to date.
 */
export function generateSyncMessage(doc, inState) {
    const state = _state(doc);
    const syncState = ApiHandler.importSyncState(inState);
    const message = state.handle.generateSyncMessage(syncState);
    const outState = ApiHandler.exportSyncState(syncState);
    return [outState, message];
}
/**
 * Update a document and our sync state on receiving a sync message
 *
 * @group sync
 *
 * @param doc     - The doc the sync message is about
 * @param inState - The {@link SyncState} for the peer we are communicating with
 * @param message - The message which was received
 * @param opts    - Any {@link ApplyOption}s, used for passing a
 *                  {@link PatchCallback} which will be informed of any changes
 *                  in `doc` which occur because of the received sync message.
 *
 * @returns An array of `[newDoc, newSyncState, syncMessage | null]` where
 * `newDoc` is the updated state of `doc`, `newSyncState` should replace
 * `inState` and `syncMessage` should be sent to the peer if it is not null. If
 * `syncMessage` is null then we are up to date.
 */
export function receiveSyncMessage(doc, inState, message, opts) {
    const syncState = ApiHandler.importSyncState(inState);
    if (!opts) {
        opts = {};
    }
    const state = _state(doc);
    if (state.heads) {
        throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
    }
    if (_is_proxy(doc)) {
        throw new RangeError("Calls to Automerge.change cannot be nested");
    }
    const heads = state.handle.getHeads();
    state.handle.receiveSyncMessage(syncState, message);
    const outSyncState = ApiHandler.exportSyncState(syncState);
    return [
        progressDocument(doc, heads, opts.patchCallback || state.patchCallback),
        outSyncState,
        null,
    ];
}
/**
 * Create a new, blank {@link SyncState}
 *
 * When communicating with a peer for the first time use this to generate a new
 * {@link SyncState} for them
 *
 * @group sync
 */
export function initSyncState() {
    return ApiHandler.exportSyncState(ApiHandler.initSyncState());
}
/** @hidden */
export function encodeChange(change) {
    return ApiHandler.encodeChange(change);
}
/** @hidden */
export function decodeChange(data) {
    return ApiHandler.decodeChange(data);
}
/** @hidden */
export function encodeSyncMessage(message) {
    return ApiHandler.encodeSyncMessage(message);
}
/** @hidden */
export function decodeSyncMessage(message) {
    return ApiHandler.decodeSyncMessage(message);
}
/**
 * Get any changes in `doc` which are not dependencies of `heads`
 */
export function getMissingDeps(doc, heads) {
    const state = _state(doc);
    return state.handle.getMissingDeps(heads);
}
/**
 * Get the hashes of the heads of this document
 */
export function getHeads(doc) {
    const state = _state(doc);
    return state.heads || state.handle.getHeads();
}
/** @hidden */
export function dump(doc) {
    const state = _state(doc);
    state.handle.dump();
}
/** @hidden */
export function toJS(doc) {
    const state = _state(doc);
    const enabled = state.handle.enableFreeze(false);
    const result = state.handle.materialize();
    state.handle.enableFreeze(enabled);
    return result;
}
export function isAutomerge(doc) {
    if (typeof doc == "object" && doc !== null) {
        return getObjectId(doc) === "_root" && !!Reflect.get(doc, STATE);
    }
    else {
        return false;
    }
}
function isObject(obj) {
    return typeof obj === "object" && obj !== null;
}

// import * as wasm from './automerge_wasm_bg.wasm';

const wasmconfig = {
    "./automerge_wasm_bg.js": { __wbindgen_string_new, __wbindgen_object_drop_ref, __wbindgen_object_clone_ref, __wbindgen_is_undefined, __wbindgen_number_new, __wbindgen_number_get, __wbindgen_is_string,
        __wbindgen_is_null, __wbindgen_boolean_get, __wbindgen_json_serialize, __wbindgen_string_get, __wbindgen_error_new, __wbindgen_is_function,
        __wbg_new_abda76e883ba8a5f, __wbg_stack_658279fe44541cf6, __wbg_error_f851667af71bcfc6, __wbindgen_bigint_from_i64, __wbindgen_bigint_from_u64, __wbindgen_is_object, __wbindgen_jsval_loose_eq, __wbg_String_91fba7ded13ba54c,
        __wbg_set_20cbc34131e76824, __wbg_crypto_e1d53a1d73fb10b8, __wbg_process_038c26bf42b093f8, __wbg_versions_ab37218d2f0b24a8, __wbg_node_080f4b19d15bc1fe, __wbg_msCrypto_6e7d3e1f92610cbb, __wbg_require_78a3dcfbdba9cbce,
        __wbg_getRandomValues_805f1c3d65988a5a, __wbg_randomFillSync_6894564c2c334c42, __wbg_log_4b5638ad60bdc54a, __wbg_log_89ca282a8a49b121, __wbg_get_57245cc7d7c7619d, __wbg_length_6e3bbe7c8bd4dbd8, __wbg_new_1d9a920c6bfc44a8,
        __wbg_newnoargs_b5b063fc6c2f0376, __wbg_next_579e583d33566a86, __wbg_next_aaef7c8aa5e212ac, __wbg_done_1b73b0672e15f234, __wbg_value_1ccc36bc03462d71, __wbg_iterator_6f9d4f28845f426c, __wbg_get_765201544a2b6869,
        __wbg_call_97ae9d8645dc388b, __wbg_new_0b9bfdd97583284e, __wbg_length_f2ab5db52e68a619, __wbg_self_6d479506f72c6a71, __wbg_window_f2557cc78490aceb, __wbg_globalThis_7f206bda628d5286, __wbg_global_ba75c50d1cf384f4,
        __wbg_set_a68214f35c417fa9, __wbg_from_7ce3cb27cb258569, __wbg_isArray_27c46c67f498e15d, __wbg_push_740e4b286702d964, __wbg_unshift_1bf718f5eb23ad8a, __wbg_instanceof_ArrayBuffer_e5e48f4762c5610b, __wbg_new_8d2af00bc1e329ee,
        __wbg_call_168da88779e35f61, __wbg_call_e1f72c051cdab859, __wbg_instanceof_Date_b979044f17219415, __wbg_getTime_cb82adb2556ed13e, __wbg_new_c8631234f931e1c4, __wbg_instanceof_Object_595a1007518cbea3, __wbg_assign_e3deabdbb7f0913d,
        __wbg_defineProperty_e47dcaf04849e02c, __wbg_entries_65a76a413fc91037, __wbg_freeze_863b0fb5229a1aa6, __wbg_keys_0702294afaeb6044, __wbg_values_f72d246067c121fe, __wbg_concat_783dc3b16a989c3a, __wbg_slice_283900b9d91a5de8,
        __wbg_for_5dcca67bf52b18ca, __wbg_toString_1f0448acb8520180, __wbg_buffer_3f3d764d4747d564, __wbg_newwithbyteoffsetandlength_d9aa266703cb98be, __wbg_new_8c3f0052272a457a, __wbg_set_83db9690f9353e79, __wbg_length_9e1ae1900cb0fbd5,
        __wbg_instanceof_Uint8Array_971eeda69eb75003, __wbg_newwithlength_f5933855e4f48a19, __wbg_subarray_58ad4efbb5bcb886, __wbg_apply_75f7334893eef4ad, __wbg_deleteProperty_424563545efc9635, __wbg_ownKeys_bf24e1178641d9f0,
        __wbg_set_bf3f89b92d5a34bf, __wbindgen_debug_string, __wbindgen_throw, __wbindgen_memory
    },
    module: {},
    env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
    }
};
const wasmmodule = await WebAssembly.instantiateStreaming(fetch('/thoregon.neuland/modules/browserpeer/ext/automerge/wasm/automerge_wasm_bg.wasm'), wasmconfig);
const wasm = wasmmodule.instance.exports;

const lTextDecoder = /*typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder :*/ TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}
/**
* @param {boolean} text_v2
* @param {string | undefined} actor
* @returns {Automerge}
*/
export function create(text_v2, actor) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.create(retptr, text_v2, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return Automerge.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} data
* @param {boolean} text_v2
* @param {string | undefined} actor
* @returns {Automerge}
*/
export function load(data, text_v2, actor) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.load(retptr, addHeapObject(data), text_v2, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return Automerge.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {any} change
* @returns {Uint8Array}
*/
export function encodeChange(change) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.encodeChange(retptr, addHeapObject(change));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} change
* @returns {any}
*/
export function decodeChange(change) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.decodeChange(retptr, addHeapObject(change));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @returns {SyncState}
*/
export function initSyncState() {
    const ret = wasm.initSyncState();
    return SyncState.__wrap(ret);
}

/**
* @param {any} state
* @returns {SyncState}
*/
export function importSyncState(state) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.importSyncState(retptr, addHeapObject(state));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return SyncState.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {SyncState} state
* @returns {any}
*/
export function exportSyncState(state) {
    _assertClass(state, SyncState);
    const ret = wasm.exportSyncState(state.ptr);
    return takeObject(ret);
}

/**
* @param {any} message
* @returns {Uint8Array}
*/
export function encodeSyncMessage(message) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.encodeSyncMessage(retptr, addHeapObject(message));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} msg
* @returns {any}
*/
export function decodeSyncMessage(msg) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.decodeSyncMessage(retptr, addHeapObject(msg));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {SyncState} state
* @returns {Uint8Array}
*/
export function encodeSyncState(state) {
    _assertClass(state, SyncState);
    const ret = wasm.encodeSyncState(state.ptr);
    return takeObject(ret);
}

/**
* @param {Uint8Array} data
* @returns {SyncState}
*/
export function decodeSyncState(data) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.decodeSyncState(retptr, addHeapObject(data));
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return SyncState.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
* How text is represented in materialized objects on the JS side
*/
export const TextRepresentation = Object.freeze({
/**
* As an array of characters and objects
*/
Array:0,"0":"Array",
/**
* As a single JS string
*/
String:1,"1":"String", });

const AutomergeFinalization = new FinalizationRegistry(ptr => wasm.__wbg_automerge_free(ptr));
/**
*/
export class Automerge {

    static __wrap(ptr) {
        const obj = Object.create(Automerge.prototype);
        obj.ptr = ptr;
        AutomergeFinalization.register(obj, obj.ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
        AutomergeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_automerge_free(ptr);
    }
    /**
    * @param {string | undefined} actor
    * @param {number} text_rep
    * @returns {Automerge}
    */
    static new(actor, text_rep) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.automerge_new(retptr, ptr0, len0, text_rep);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Automerge.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string | undefined} actor
    * @returns {Automerge}
    */
    clone(actor) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.automerge_clone(retptr, this.ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Automerge.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string | undefined} actor
    * @param {any} heads
    * @returns {Automerge}
    */
    fork(actor, heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.automerge_fork(retptr, this.ptr, ptr0, len0, addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return Automerge.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {any}
    */
    pendingOps() {
        const ret = wasm.automerge_pendingOps(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {string | undefined} message
    * @param {number | undefined} time
    * @returns {any}
    */
    commit(message, time) {
        var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.automerge_commit(this.ptr, ptr0, len0, !isLikeNone(time), isLikeNone(time) ? 0 : time);
        return takeObject(ret);
    }
    /**
    * @param {Automerge} other
    * @returns {Array<any>}
    */
    merge(other) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(other, Automerge);
            wasm.automerge_merge(retptr, this.ptr, other.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {number}
    */
    rollback() {
        const ret = wasm.automerge_rollback(this.ptr);
        return ret;
    }
    /**
    * @param {any} obj
    * @param {Array<any> | undefined} heads
    * @returns {Array<any>}
    */
    keys(obj, heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_keys(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {Array<any> | undefined} heads
    * @returns {string}
    */
    text(obj, heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_text(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr0 = r0;
            var len0 = r1;
            if (r3) {
                ptr0 = 0; len0 = 0;
                throw takeObject(r2);
            }
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(ptr0, len0);
        }
    }
    /**
    * @param {any} obj
    * @param {number} start
    * @param {number} delete_count
    * @param {any} text
    */
    splice(obj, start, delete_count, text) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_splice(retptr, this.ptr, addHeapObject(obj), start, delete_count, addHeapObject(text));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} value
    * @param {any} datatype
    */
    push(obj, value, datatype) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_push(retptr, this.ptr, addHeapObject(obj), addHeapObject(value), addHeapObject(datatype));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} value
    * @returns {string | undefined}
    */
    pushObject(obj, value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_pushObject(retptr, this.ptr, addHeapObject(obj), addHeapObject(value));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            let v0;
            if (r0 !== 0) {
                v0 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 1);
            }
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {number} index
    * @param {any} value
    * @param {any} datatype
    */
    insert(obj, index, value, datatype) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_insert(retptr, this.ptr, addHeapObject(obj), index, addHeapObject(value), addHeapObject(datatype));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {number} index
    * @param {any} value
    * @returns {string | undefined}
    */
    insertObject(obj, index, value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_insertObject(retptr, this.ptr, addHeapObject(obj), index, addHeapObject(value));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            let v0;
            if (r0 !== 0) {
                v0 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 1);
            }
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} prop
    * @param {any} value
    * @param {any} datatype
    */
    put(obj, prop, value, datatype) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_put(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), addHeapObject(value), addHeapObject(datatype));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} prop
    * @param {any} value
    * @returns {any}
    */
    putObject(obj, prop, value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_putObject(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), addHeapObject(value));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} prop
    * @param {any} value
    */
    increment(obj, prop, value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_increment(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), addHeapObject(value));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} prop
    * @param {Array<any> | undefined} heads
    * @returns {any}
    */
    get(obj, prop, heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_get(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), isLikeNone(heads) ? 0 : addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} prop
    * @param {Array<any> | undefined} heads
    * @returns {any}
    */
    getWithType(obj, prop, heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_getWithType(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), isLikeNone(heads) ? 0 : addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} arg
    * @param {Array<any> | undefined} heads
    * @returns {Array<any>}
    */
    getAll(obj, arg, heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_getAll(retptr, this.ptr, addHeapObject(obj), addHeapObject(arg), isLikeNone(heads) ? 0 : addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} enable
    * @returns {any}
    */
    enableFreeze(enable) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_enableFreeze(retptr, this.ptr, addHeapObject(enable));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} enable
    * @returns {any}
    */
    enablePatches(enable) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_enablePatches(retptr, this.ptr, addHeapObject(enable));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} datatype
    * @param {any} _function
    */
    registerDatatype(datatype, _function) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_registerDatatype(retptr, this.ptr, addHeapObject(datatype), addHeapObject(_function));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} object
    * @param {any} meta
    * @param {any} callback
    * @returns {any}
    */
    applyPatches(object, meta, callback) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_applyPatches(retptr, this.ptr, addHeapObject(object), addHeapObject(meta), addHeapObject(callback));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {Array<any>}
    */
    popPatches() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_popPatches(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {Array<any> | undefined} heads
    * @returns {number}
    */
    length(obj, heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_length(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads));
            var r0 = getFloat64Memory0()[retptr / 8 + 0];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {any} prop
    */
    delete(obj, prop) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_delete(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {Uint8Array}
    */
    save() {
        const ret = wasm.automerge_save(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Uint8Array}
    */
    saveIncremental() {
        const ret = wasm.automerge_saveIncremental(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {Uint8Array} data
    * @returns {number}
    */
    loadIncremental(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_loadIncremental(retptr, this.ptr, addHeapObject(data));
            var r0 = getFloat64Memory0()[retptr / 8 + 0];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} changes
    */
    applyChanges(changes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_applyChanges(retptr, this.ptr, addHeapObject(changes));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} have_deps
    * @returns {Array<any>}
    */
    getChanges(have_deps) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_getChanges(retptr, this.ptr, addHeapObject(have_deps));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} hash
    * @returns {any}
    */
    getChangeByHash(hash) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_getChangeByHash(retptr, this.ptr, addHeapObject(hash));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Automerge} other
    * @returns {Array<any>}
    */
    getChangesAdded(other) {
        _assertClass(other, Automerge);
        const ret = wasm.automerge_getChangesAdded(this.ptr, other.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Array<any>}
    */
    getHeads() {
        const ret = wasm.automerge_getHeads(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {string}
    */
    getActorId() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_getActorId(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * @returns {any}
    */
    getLastLocalChange() {
        const ret = wasm.automerge_getLastLocalChange(this.ptr);
        return takeObject(ret);
    }
    /**
    */
    dump() {
        wasm.automerge_dump(this.ptr);
    }
    /**
    * @param {Array<any> | undefined} heads
    * @returns {Array<any>}
    */
    getMissingDeps(heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_getMissingDeps(retptr, this.ptr, isLikeNone(heads) ? 0 : addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {SyncState} state
    * @param {Uint8Array} message
    */
    receiveSyncMessage(state, message) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(state, SyncState);
            wasm.automerge_receiveSyncMessage(retptr, this.ptr, state.ptr, addHeapObject(message));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {SyncState} state
    * @returns {any}
    */
    generateSyncMessage(state) {
        _assertClass(state, SyncState);
        const ret = wasm.automerge_generateSyncMessage(this.ptr, state.ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} meta
    * @returns {any}
    */
    toJS(meta) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_toJS(retptr, this.ptr, addHeapObject(meta));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} obj
    * @param {Array<any> | undefined} heads
    * @param {any} meta
    * @returns {any}
    */
    materialize(obj, heads, meta) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.automerge_materialize(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads), addHeapObject(meta));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string | undefined} message
    * @param {number | undefined} time
    * @returns {any}
    */
    emptyChange(message, time) {
        var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.automerge_emptyChange(this.ptr, ptr0, len0, !isLikeNone(time), isLikeNone(time) ? 0 : time);
        return takeObject(ret);
    }
}

const SyncStateFinalization = new FinalizationRegistry(ptr => wasm.__wbg_syncstate_free(ptr));
/**
*/
export class SyncState {

    static __wrap(ptr) {
        const obj = Object.create(SyncState.prototype);
        obj.ptr = ptr;
        SyncStateFinalization.register(obj, obj.ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
        SyncStateFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_syncstate_free(ptr);
    }
    /**
    * @returns {any}
    */
    get sharedHeads() {
        const ret = wasm.syncstate_sharedHeads(this.ptr);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get lastSentHeads() {
        const ret = wasm.syncstate_lastSentHeads(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} heads
    */
    set lastSentHeads(heads) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.syncstate_set_lastSentHeads(retptr, this.ptr, addHeapObject(heads));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {any} hashes
    */
    set sentHashes(hashes) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.syncstate_set_sentHashes(retptr, this.ptr, addHeapObject(hashes));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {SyncState}
    */
    clone() {
        const ret = wasm.syncstate_clone(this.ptr);
        return SyncState.__wrap(ret);
    }
}

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbindgen_is_null(arg0) {
    const ret = getObject(arg0) === null;
    return ret;
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_json_serialize(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = JSON.stringify(obj === undefined ? null : obj);
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_error_f851667af71bcfc6(arg0, arg1) {
    try {
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
    }
};

export function __wbindgen_bigint_from_i64(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = getObject(arg0) == getObject(arg1);
    return ret;
};

export function __wbg_String_91fba7ded13ba54c(arg0, arg1) {
    const ret = String(getObject(arg1));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_set_20cbc34131e76824(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_crypto_e1d53a1d73fb10b8(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_process_038c26bf42b093f8(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_ab37218d2f0b24a8(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_080f4b19d15bc1fe(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbg_msCrypto_6e7d3e1f92610cbb(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_require_78a3dcfbdba9cbce() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getRandomValues_805f1c3d65988a5a() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_randomFillSync_6894564c2c334c42() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_log_4b5638ad60bdc54a(arg0) {
    console.log(getObject(arg0));
};

export function __wbg_log_89ca282a8a49b121(arg0, arg1) {
    console.log(getObject(arg0), getObject(arg1));
};

export function __wbg_get_57245cc7d7c7619d(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_6e3bbe7c8bd4dbd8(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_1d9a920c6bfc44a8() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_b5b063fc6c2f0376(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_next_579e583d33566a86(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_aaef7c8aa5e212ac() { return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_done_1b73b0672e15f234(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_1ccc36bc03462d71(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_6f9d4f28845f426c() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_765201544a2b6869() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_97ae9d8645dc388b() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_0b9bfdd97583284e() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_length_f2ab5db52e68a619(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_self_6d479506f72c6a71() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_f2557cc78490aceb() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_7f206bda628d5286() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_ba75c50d1cf384f4() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_a68214f35c417fa9(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_from_7ce3cb27cb258569(arg0) {
    const ret = Array.from(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_isArray_27c46c67f498e15d(arg0) {
    const ret = Array.isArray(getObject(arg0));
    return ret;
};

export function __wbg_push_740e4b286702d964(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

export function __wbg_unshift_1bf718f5eb23ad8a(arg0, arg1) {
    const ret = getObject(arg0).unshift(getObject(arg1));
    return ret;
};

export function __wbg_instanceof_ArrayBuffer_e5e48f4762c5610b(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_new_8d2af00bc1e329ee(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_168da88779e35f61() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_e1f72c051cdab859() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3), getObject(arg4));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_instanceof_Date_b979044f17219415(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Date;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_getTime_cb82adb2556ed13e(arg0) {
    const ret = getObject(arg0).getTime();
    return ret;
};

export function __wbg_new_c8631234f931e1c4(arg0) {
    const ret = new Date(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_instanceof_Object_595a1007518cbea3(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Object;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_assign_e3deabdbb7f0913d(arg0, arg1) {
    const ret = Object.assign(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_defineProperty_e47dcaf04849e02c(arg0, arg1, arg2) {
    const ret = Object.defineProperty(getObject(arg0), getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_entries_65a76a413fc91037(arg0) {
    const ret = Object.entries(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_freeze_863b0fb5229a1aa6(arg0) {
    const ret = Object.freeze(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_keys_0702294afaeb6044(arg0) {
    const ret = Object.keys(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_values_f72d246067c121fe(arg0) {
    const ret = Object.values(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_concat_783dc3b16a989c3a(arg0, arg1) {
    const ret = getObject(arg0).concat(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_slice_283900b9d91a5de8(arg0, arg1, arg2) {
    const ret = getObject(arg0).slice(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_for_5dcca67bf52b18ca(arg0, arg1) {
    const ret = Symbol.for(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_toString_1f0448acb8520180(arg0) {
    const ret = getObject(arg0).toString();
    return addHeapObject(ret);
};

export function __wbg_buffer_3f3d764d4747d564(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_d9aa266703cb98be(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_8c3f0052272a457a(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_83db9690f9353e79(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_9e1ae1900cb0fbd5(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_instanceof_Uint8Array_971eeda69eb75003(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Uint8Array;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_newwithlength_f5933855e4f48a19(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_58ad4efbb5bcb886(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_apply_75f7334893eef4ad() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.apply(getObject(arg0), getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_deleteProperty_424563545efc9635() { return handleError(function (arg0, arg1) {
    const ret = Reflect.deleteProperty(getObject(arg0), getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_ownKeys_bf24e1178641d9f0() { return handleError(function (arg0) {
    const ret = Reflect.ownKeys(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_bf3f89b92d5a34bf() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};


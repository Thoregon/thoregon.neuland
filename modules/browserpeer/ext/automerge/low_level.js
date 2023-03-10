export function UseApi(api) {
    for (const k in api) {
        ApiHandler[k] = api[k];
    }
}
/* eslint-disable */
export const ApiHandler = {
    create(textV2, actor) {
        throw new RangeError("Automerge.use() not called");
    },
    load(data, textV2, actor) {
        throw new RangeError("Automerge.use() not called (load)");
    },
    encodeChange(change) {
        throw new RangeError("Automerge.use() not called (encodeChange)");
    },
    decodeChange(change) {
        throw new RangeError("Automerge.use() not called (decodeChange)");
    },
    initSyncState() {
        throw new RangeError("Automerge.use() not called (initSyncState)");
    },
    encodeSyncMessage(message) {
        throw new RangeError("Automerge.use() not called (encodeSyncMessage)");
    },
    decodeSyncMessage(msg) {
        throw new RangeError("Automerge.use() not called (decodeSyncMessage)");
    },
    encodeSyncState(state) {
        throw new RangeError("Automerge.use() not called (encodeSyncState)");
    },
    decodeSyncState(data) {
        throw new RangeError("Automerge.use() not called (decodeSyncState)");
    },
    exportSyncState(state) {
        throw new RangeError("Automerge.use() not called (exportSyncState)");
    },
    importSyncState(state) {
        throw new RangeError("Automerge.use() not called (importSyncState)");
    },
};
/* eslint-enable */

/**
 * in memory key/value storage adapter for neuland
 * - uses simple file on filesystem
 * - implement subclass
 *   - load and store (of whole DB)
 *   - provide this.db with a [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) interface
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class NeulandStorageAdapter {

    init(opt) {
        // implement by subclass
    }

    //
    // storage
    //

    async load() {
        // implement by subclass
    }

    async store(backup = false) {
        // implement by subclass
    }

    keys() {
        const db = this.db;
        return db.keys();
    }

    //
    // items
    //

    has(soul) {
        const db = this.db;
        if (!db) return false;
        return db.has(soul);
    }

    get(soul) {
        const db = this.db;
        if (!db) return;
        return db.get(soul);
    }

    set(soul, item) {
        let db = this.db;
        if (!db) db = this.db = new Map();
        db.set(soul, item);
    }

    del(soul) {
        const db = this.db;
        if (!db) return;
        db.delete(soul);
    }
}

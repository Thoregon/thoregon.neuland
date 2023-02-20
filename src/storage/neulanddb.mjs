/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

let WRITE_INTERVAL = 1200;
let WRITE_COUNT    = 100;
let storage;

export default class NeulandDB {

    init(StorageAdapter, storageOpt) {
        this.mod       = 0;
        WRITE_COUNT    = storageOpt.writeCount ?? WRITE_COUNT;
        WRITE_INTERVAL = storageOpt.writeInterval ?? WRITE_INTERVAL;
        storage        = this.storage = new StorageAdapter();
        storage.init(storageOpt);
        universe.$neuland = this;
        return this;
    }

    start() {
        (async () => {
            await storage.load();
            this.ready = true;
            this.auto();
            this._onready?.(this);
            delete this._onready;
        })();
        return this;
    }

    stop() {
        if (this.autoid) clearTimeout(this.autoid);
        if (this.mod > 0) storage.store();
        this.ready = false;
        return this;
    }

    onready(fn) {
        if (this.ready) return fn(this);
        this._onready = fn;
    }

    //
    // management
    //
    auto() {
        this.autoid = setTimeout(() => {
            if (this.mod > 0) {
                this.mod = 0;
                storage.store();
            }
            this.auto();
        }, WRITE_INTERVAL);
    }

    modified() {
        const mod = ++this.mod;
        if (mod < WRITE_COUNT) return this;
        this.mod = 0;
        storage.store();
    }

    //
    // items
    //

    get(soul) {
        return storage.get(soul);
    }

    set(soul, item) {
        storage.set(soul, item);
        this.modified();
    }

    del(soul) {
        storage.del(soul);
        this.modified();
    }

}

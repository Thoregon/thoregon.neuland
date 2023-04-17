/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

let WRITE_INTERVAL = 2000;
let WRITE_COUNT    = 100;
let storage;

const debuglog = (...args) => {}; // console.log("NeulandDB", Date.now(), ":", ...args);
const debugerr = (...args) => console.error("NeulandDB", Date.now(), ":", ...args);

const TEN_MIN             = 10 * 60 * 1000;
const ONE_HOUR            = 60 * 60 * 1000;
const NEULAND_STORAGE_OPT = { store: 'data', name: 'neuland', backup: ONE_HOUR, maxmod: 1000 }
const USE_BACKUP          = false;

export default class NeulandDB {

    init(StorageAdapter, storageOpt) {
        this.mod       = 0;
        WRITE_COUNT    = storageOpt.writeCount ?? WRITE_COUNT;
        WRITE_INTERVAL = storageOpt.writeInterval ?? WRITE_INTERVAL;
        this.opt = { ...NEULAND_STORAGE_OPT, ...storageOpt };
        debuglog("init storage start");
        storage        = this.storage = new StorageAdapter();
        storage.init(this.opt);
        universe.$neuland = this;
        this.lastbackup = universe.inow;
        debuglog("init storage done");
        return this;
    }

    async start() {
        debuglog("load storage start");
        await storage.load();
        this.ready = true;
        this.auto();
        this._onready?.(this);
        delete this._onready;
        debuglog("load storage done");
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
                debuglog("storage store");
                const backup = USE_BACKUP && (this.lastbackup + this.opt.backup > universe.inow);
                storage.store(backup);
                if (backup) this.lastbackup = universe.inow;
            }
            this.auto();
        }, WRITE_INTERVAL);
    }

    modified() {
        const mod = ++this.mod;
        if (mod < WRITE_COUNT) return this;
        const backup = mod > this.opt.maxmod;
        this.mod = 0;
        debuglog("storage store");
        storage.store(backup);
        if (backup) this.lastbackup = universe.inow;
    }

    keys() {
        // return known (persistent) keys
        return storage.keys();
    }

    //
    // items
    //

    has(soul) {
        return storage.has(soul);
    }

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

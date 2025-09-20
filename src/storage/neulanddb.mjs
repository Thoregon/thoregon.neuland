/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

let WRITE_INTERVAL = 2000;
let WRITE_COUNT    = 100;

const debuglog = (...args) => {}; // console.log("NeulandDB", Date.now(), ":", ...args);
const debugerr = (...args) => console.error("NeulandDB", Date.now(), ":", ...args);

const FIVE_MIN            =  5 * 60 * 1000;
const TEN_MIN             = 10 * 60 * 1000;
const ONE_HOUR            = 60 * 60 * 1000;
const NEULAND_STORAGE_OPT = { store: 'data', name: 'neuland', backup: ONE_HOUR, maxmod: 1000 }
const USE_BACKUP          = true;

const DBGID = '** NeulandDB';

export default class NeulandDB {

    init(StorageAdapter, storageOpt) {
        universe.debuglog(DBGID, "init");
        this.mod       = 0;
        WRITE_COUNT    = storageOpt.writeCount ?? WRITE_COUNT;
        WRITE_INTERVAL = storageOpt.writeInterval ?? WRITE_INTERVAL;
        this.opt = { ...NEULAND_STORAGE_OPT, ...storageOpt };
        this.name = (storageOpt.name ?? 'neuland');
        this.storage = new StorageAdapter();
        this.storage.init(this.opt);
        if (!this.opt.dontPublish) {
            const name = '$' + this.name;
            universe[name] = this;   // universe.$neuland = this;
        }
        this.lastbackup = universe.inow;
        universe.debuglog(DBGID, "init DONE");
        return this;
    }

    async start() {
        universe.debuglog(DBGID, "start");
        const ok = await this.storage.load();
        this.ready = ok;
        if (!ok) {
            universe.debuglog(DBGID, "start DONE");
            return;
        }
        this.auto();
        this._onready?.(this);
        delete this._onready;
        universe.debuglog(DBGID, "start DONE");
        return this;
    }

    async stop() {
        if (this._autoid) clearTimeout(this._autoid);
        /*if (this.mod > 0)*/ await this.storage.store(USE_BACKUP, true);
        await this.storage.close();
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
        this._autoid = setTimeout(async () => {
            if (this.mod > 0) {
                this.mod = 0;
                universe.debuglog(DBGID, "auto store");
                const backup = USE_BACKUP && (this.lastbackup + this.opt.backup > universe.inow);
                const stored = await this.storage.store(backup);
                if (!stored) this.mod++;
                if (backup) this.lastbackup = universe.inow;
            }
            this.auto();
        }, WRITE_INTERVAL);
    }

    modified({ immed = false } = {}) {
        const mod = ++this.mod;
        if (immed || this.opt.immed) return this._store();
        if (mod < WRITE_COUNT) return this;
        const backup = mod > this.opt.maxmod;
        this.mod = 0;
        this._store();
    }

    _store(backup) {
        (async () => {
            universe.debuglog(DBGID, "modified store");
            const stored = await this.storage.store(backup);
            if (!stored) this.mod++; // mark modified for auto store
            if (backup) this.lastbackup = universe.inow;
        })();
    }

    keys() {
        // return known (persistent) keys
        return this.storage.keys();
    }

    size() {
        return this.storage.size()
    }

    flush() {
        return this._store();
    }

    //
    // items
    //

    has(soul) {
        return this.storage.has(soul);
    }

    get(soul) {
        universe.debuglog(DBGID, "get", soul);
        return this.storage.get(soul);
    }

    set(soul, item, opt) {
        universe.debuglog(DBGID, "set", soul);
        this.storage.set(soul, item);
        this.modified(opt);
    }

    del(soul, opt) {
        universe.debuglog(DBGID, "del", soul);
        this.storage.del(soul);
        this.modified(opt);
    }

    //
    // migration
    //

    async migrateTo(TargetStorageAdapter) {
        const target = new TargetStorageAdapter();
        target.init(this.opt)
        const ok = await this.storage.load();
        if (!ok) return console.warn("NeulandDB: can't migrate, target not ready");

        const keys = this.keys();
        let i = 0;
        for (const key of keys) {
            const val = this.get(key);
            if (!val) continue;
            target.set(key, val);
            i++;
        }

        const stored = await target.store();
        await target.close();
        console.log("NeulandDB: migration done:", stored, "#", i);
    }
}

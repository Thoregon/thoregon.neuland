/**
 * storage adapter for neuland on node
 * - uses simple file on filesystem
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { serialize, deserialize } from "v8";
import sfs                        from "fs";
import fs                         from "fs/promises";
import path                       from "path";
import NeulandStorageAdapter      from "../../src/storage/neulandstorageadapter.mjs";
import { exists, ensureDir }      from "/evolux.universe/lib/loader/fsutils.mjs";
import process                    from "process";
import { ensureDir }              from "../../../../Puls.Container/lib/loader/fsutils.mjs";
import { soul }                   from "../../../thoregon.crystalline/lib/thoregon/util.mjs";
import * as console               from "node:console";
import * as console               from "node:console";
import * as console               from "node:console";

// let storing = false;

const DBGID = '** NeulandDB';

export default class RocksDBNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        universe.debuglog(DBGID, "RocksDB adapter init");
        this.opt           = { location, name };
        const directory    = path.resolve(process.cwd(), location);
        this.opt.directory = directory;
        this.opt.filepath  = `${directory}/${name ?? 'neuland'}`;
        this.storing = false;
        ensureDir(location);
        universe.debuglog(DBGID, "RocksDB adapter init DONE", this.opt.filepath);
    }

    //
    // access
    //


    keys() {
        return super.keys();
    }

    size() {
        return super.size();
    }

    newInnerDB() {
        return super.newInnerDB();
    }

    has(soul) {
        return super.has(soul);
    }

    get(soul) {
        return super.get(soul);
    }

    set(soul, item) {
        super.set(soul, item);
    }

    del(soul) {
        return super.del(soul);
    }

//
    // storage
    //

    async load(retry = true) {
    }

    async store(backup = true, force = false) {
        return true;
    }

    get isPROD() {
        return universe.stage === 'PROD';
    }

    async create() {
        this.storing = true;
        console.log("== Neuland: start storing (create)");
        try {
            const db = this.db;
            if (!db) return;
            const bin = serialize(db);
            const createpath = this.opt.directory;
            if (!sfs.existsSync(createpath)) sfs.mkdirSync(createpath, { recursive: true });
            await fs.writeFile(this.opt.filepath, bin);
        } catch (e) {
            console.error(e, e.stack);
        } finally {
            console.log("== Neuland: end storing (create)");
            this.storing = false;
        }
    }
}

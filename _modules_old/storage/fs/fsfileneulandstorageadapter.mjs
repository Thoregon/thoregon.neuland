/**
 * storage adapter for neuland on node
 * - uses simple file on filesystem
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import sfs                        from "fs";
import fs                         from "fs/promises";
import path                       from "path";
import NeulandStorageAdapter      from "../neulandstorageadapter.mjs";
import process                    from "process";

// let storing = false;

const DBGID = '** NeulandDB';

export default class FSFileDBNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        universe.debuglog(DBGID, "FSFileDB adapter init");
        this.opt           = { location, name };
        const directory    = path.resolve(process.cwd(), location, `${name ?? 'neuland'}.fdb` );
        this.opt.directory = directory;
        this.storing = false;
        if (!sfs.existsSync(directory)) sfs.mkdirSync(directory, { recursive: true });
        universe.debuglog(DBGID, "FSFileDB adapter init DONE", this.opt.directory);
    }

    //
    // access
    //


    keys() {
        const files = sfs.readdirSync(this.opt.directory);
        return files;
    }

    size() {
        const keys = this.get(keys);
        return keys.length;
    }

    newInnerDB() {}

    has(soul) {
        const filename = path.join(this.opt.directory, soul);
        const exists = sfs.existsSync(filename);
        return exists;
    }

    get(soul) {
        try {
            const filename = path.join(this.opt.directory, soul);
            if (!sfs.existsSync(filename)) return null;
            const data = String(sfs.readFileSync(filename));
            return data;
        } catch (e) {
            debugger;
        }
        return null;
    }

    set(soul, item) {
        fs.writeFile(path.join(this.opt.directory, soul), item);
        // console.log("FSFileDB set", soul);
    }

    del(soul) {
        fs.rm(path.join(this.opt.directory, soul));
    }

//
    // storage
    //

    async load(retry = true) {
        return true;
    }

    async store(backup = true, force = false) {
        return true;
    }

    async create() {}
}

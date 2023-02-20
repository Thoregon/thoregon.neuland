/**
 * storage adapter for neuland on node
 * - uses simple file on filesystem
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { serialize, deserialize } from "v8";
import fs                         from "fs/promises";
import path                       from "path";
import NeulandStorageAdapter      from "../../src/storage/neulandstorageadapter.mjs";
import { exists, ensureDir }      from "/evolux.universe/lib/loader/fsutils.mjs";

export default class FSNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        this.opt = { location, name };
        const directory = path.resolve(process.cwd(), location);
        this.opt.filepath = `${directory}/${name ?? 'neuland'}.tdb`;
    }

    //
    // storage
    //

    async load() {
        const filepath = this.opt.filepath;
        if (!exists(filepath)) {
            ensureDir(filepath, true);
            this.db = new Map();
            await this.store();
        } else {
            const bin = await fs.readFile(filepath);
            this.db = bin ? deserialize(bin) : new Map();
        }
    }

    async store() {
        try {
            const db = this.db;
            if (!db) return;
            const bin = serialize(db);
            await fs.writeFile(this.opt.filepath, bin);
        } catch (e) {
            console.log(e);
        }
    }

}

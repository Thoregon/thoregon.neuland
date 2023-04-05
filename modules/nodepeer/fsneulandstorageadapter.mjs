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

let storing = false;

export default class FSNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        this.opt           = { location, name };
        const directory    = path.resolve(process.cwd(), location);
        this.opt.directory = directory;
        this.opt.filepath  = `${directory}/${name ?? 'neuland'}.tdb`;
        ensureDir(location);
        ensureDir(`${location}/backup`);
    }

    //
    // storage
    //

    async load(retry = true) {
        const filepath = this.opt.filepath;
        if (!exists(filepath)) {
            this.db = new Map();
            await this.store();
        } else {
            try {
                const bin = await fs.readFile(filepath);
                this.db   = bin ? deserialize(bin) : new Map();
            } catch (e) {
                if (!retry) return;
                console.log("FSNeulandStorageAdapter can't open DB file", e);
                if (retry) await fs.unlink(filepath);
                await this.load(false);
            }
        }
    }

    async store(backup = false) {
        if (storing) return;
        storing = true;
        try {
            if (backup) await this.backup(universe.inow);
            const db = this.db;
            if (!db) return;
            const bin = serialize(db);
            if (bin == undefined || bin.length === 0) return;
            await fs.writeFile(this.opt.filepath, bin);
        } catch (e) {
            console.log(e);
        }
        storing = false;
    }

    async backup(id) {
        try {
            const backuppath = this.getBackupFilepath(id);
            await fs.copyFile(this.opt.filepath, backuppath);
        } catch (e) {
            console.log(e);
        }
    }

    getBackupFilepath(id) {
        const { directory, name } = this.opt;
        const backup = `${directory}/backup/${name ?? 'neuland'}_${id}.tdb`;
        return backup;
    }

}

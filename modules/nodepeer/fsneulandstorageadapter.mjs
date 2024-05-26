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

const DBGID = '** NeulandDB';

export default class FSNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        universe.debuglog(DBGID, "FS adapter init");
        this.opt           = { location, name };
        const directory    = path.resolve(process.cwd(), location);
        this.opt.directory = directory;
        this.opt.filepath  = `${directory}/${name ?? 'neuland'}.tdb`;
        ensureDir(location);
        ensureDir(`${location}/backup`);
        universe.debuglog(DBGID, "FS adapter init DONE");
    }

    //
    // storage
    //

    async load(retry = true) {
        const filepath = this.opt.filepath;
        if (!exists(filepath)) {
            if (!(await this.restoreBackup(filepath))) {
                this.db = new Map();
                await this.create();
            }
        } else {
            try {
                universe.debuglog(DBGID, "load");
                const bin = await fs.readFile(filepath);
                this.db   = bin ? deserialize(bin) : new Map();
            } catch (e) {
                debugger;
                if (!retry) return;
                universe.debuglog(DBGID, "FSNeulandStorageAdapter can't open DB file", e);
                if (retry) {
                    await fs.unlink(filepath);
                    await this.restoreBackup(filepath);
                }
                await this.load(false);
            }
        }
    }

    async store(backup = true) {
        if (storing) return;
        storing = true;
        universe.debuglog(DBGID, "store");
        try {
            if (backup) await this.backup(universe.nowFormated);
            const db = this.db;
            if (!db) return;
            const bin = serialize(db);
            if (bin == undefined || bin.length < 6) {
                console.log("DB corrupted");
                debugger;
                return;
            }
            await fs.writeFile(this.opt.filepath, bin);
            const size = await fs.stat(this.opt.filepath);
            if (size < 6) {
                console.log("DB corrupted");
                debugger;
            }
            universe.debuglog(DBGID, "store done");
        } catch (e) {
            await this.backup(universe.nowFormated);
            debugger;
            console.log(e);
        } finally {
            storing = false;
        }
    }

    async create() {
        storing = true;
        try {
            const db = this.db;
            if (!db) return;
            const bin = serialize(db);
            await fs.writeFile(this.opt.filepath, bin);
        } catch (e) {
            console.log(e);
        } finally {
            storing = false;
        }
    }

    async backup(id) {
        try {
            const size = await fs.stat(this.opt.filepath);
            if (size < 1) {
                console.log("DB corrupted");
                debugger;
                return;
            }
            const backuppath = this.getBackupFilepath(id);
            await fs.copyFile(this.opt.filepath, backuppath);
            universe.debuglog(DBGID, "backup done");
        } catch (e) {
            console.log(e);
        }
    }

    async restoreBackup(filepath) {
        const backuppath = this.getBackupFilepath();
        if (!exists(backuppath)) return false;
        try {
            universe.debuglog(DBGID, "restore backup");
            if (exists(filepath)) await fs.unlink(filepath);
            await fs.copyFile(backuppath, filepath);
            universe.debuglog(DBGID, "restore backup done");
            return true;
        } catch (e) {
            universe.debuglog(DBGID, "restore backup error", e);
            return false;
        }
    }

    getBackupFilepath(id) {
        const { directory, name } = this.opt;
        const backup = `${directory}/backup/${name ?? 'neuland'}_${id}.tdb`; // `${directory}/backup/${name ?? 'neuland'}_bak.tdb`;    // `${directory}/backup/${name ?? 'neuland'}_${id}.tdb`
        return backup;
    }

}

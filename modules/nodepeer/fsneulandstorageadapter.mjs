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

// let storing = false;

const DBGID = '** NeulandDB';

export default class FSNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        universe.debuglog(DBGID, "FS adapter init");
        this.opt           = { location, name };
        const directory    = path.resolve(process.cwd(), location);
        this.opt.directory = directory;
        this.opt.filepath  = `${directory}/${name ?? 'neuland'}.tdb`;
        this.storing = false;
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
                this.db = this.newInnerDB();
                await this.create();
            }
        } else {
            try {
                universe.debuglog(DBGID, "load");
                const bin = await fs.readFile(filepath);
                this.db   = bin ? deserialize(bin) : this.newInnerDB();
            } catch (e) {
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

    async store(backup = true, force = false) {
        if (this.storing && !force) {
            console.log("== Neuland: not stored, store while storing");
            return false;
        }
        this.storing = true;
        console.log("== Neuland: start storing (store)");
        universe.debuglog(DBGID, "store");
        try {
            if (backup) await this.backup();
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
            this.storing = false;
            await this.backup();
            debugger;
            console.error(e, e.stack);
        } finally {
            console.log("== Neuland: end storing (store)");
            this.storing = false;
        }
        return true;
    }

    async create() {
        this.storing = true;
        console.log("== Neuland: start storing (create)");
        try {
            const db = this.db;
            if (!db) return;
            const bin = serialize(db);
            const createpath = this.opt.directory;
            if (!sfs.existsSync(createpath)) fs.mkdirSync(createpath, { recursive: true });
            await fs.writeFile(this.opt.filepath, bin);
        } catch (e) {
            console.error(e, e.stack);
        } finally {
            console.log("== Neuland: end storing (create)");
            this.storing = false;
        }
    }

    async backup(withTimestamp = false) {
        try {
            const stats = await fs.stat(this.opt.filepath);
            if (stats.size < 5) {
                console.log("DB corrupted");
                debugger;
                return;
            }
            const backupdir = `${this.opt.directory}/backup`;
            if (!sfs.existsSync(backupdir)) fs.mkdirSync(backupdir, { recursive: true });
            const id = withTimestamp ? universe.nowFormated : '';
            const backuppath = this.getBackupFilepath(id);
            await fs.copyFile(this.opt.filepath, backuppath);
            universe.debuglog(DBGID, "backup done");
        } catch (e) {
            console.error(e, e.stack);
        }
    }

    async restoreBackup(filepath) {
        const backuppath = this.getBackupFilepath();
        if (!exists(backuppath)) return false;
        try {
            universe.debuglog(DBGID, "restore backup");
            if (exists(filepath)) await fs.unlink(filepath);
            await fs.copyFile(backuppath, filepath);
            await this.backup(true);    //  save a copy from the old back to rollback eventually later
            universe.debuglog(DBGID, "restore backup done");
            return true;
        } catch (e) {
            console.error(e, e.stack);
            universe.debuglog(DBGID, "restore backup error", e);
            return false;
        }
    }

    getBackupFilepath(id) {
        const { directory, name } = this.opt;
        const backup = id
                       ? `${directory}/backup/${name ?? 'neuland'}_${id}.tdb`
                       : `${directory}/backup/${name ?? 'neuland'}_bak.tdb`;
        return backup;
    }

}

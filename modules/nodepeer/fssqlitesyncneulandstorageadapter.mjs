/**
 * storage adapter for neuland on node
 * - uses simple file on filesystem
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import sfs                   from "fs";
import fs                    from "fs/promises";
import path                  from "path";
import NeulandStorageAdapter from "../../src/storage/neulandstorageadapter.mjs";
import process               from "process";
// import Database              from 'better-sqlite3';
// import { DatabaseSync }      from 'node:sqlite';
const Database = universe.nodeVersion >= 24
                 ? (await import('node:sqlite')).DatabaseSync
                 : (await import('better-sqlite3')).default;
// let storing = false;

const DBGID = '** NeulandDB';

export default class FSSQLiteSyncNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        universe.debuglog(DBGID, "SQLiteDB adapter init");
        this.opt           = { location, name };
        const directory    = path.resolve(process.cwd(), location);
        this.opt.directory = directory;
        this.opt.sqlitefile = `${directory}/${name ?? 'neuland'}.sqlite`
        this.storing = false;
        if (!sfs.existsSync(directory)) sfs.mkdirSync(directory, { recursive: true });
        this.initDB(this.opt);
        universe.debuglog(DBGID, "SQLiteDB adapter init DONE", this.opt.directory);
    }

    static existsSQLite({ location, name } = {}) {
        const directory    = path.resolve(process.cwd(), location);
        const neulandsqlitefile = `${directory}/${name ?? 'neuland'}.sqlite`;
        const olapsqlitefile = `${directory}/olap/upayme.sqlite`;
        const neulandSQLite = sfs.existsSync(neulandsqlitefile);
        const olapSQLite = sfs.existsSync(olapsqlitefile);

        return { neulandSQLite, olapSQLite };
    }


    //
    //
    //

    initDB(opt) {
        try {
            const filepath = opt.sqlitefile;
            const mkdb     = !sfs.existsSync(filepath);
            const db       = this.db = new Database(filepath);
            process.on('exit', () => this.db?.close());
            if (mkdb) this.makeDB(db);
            this.prepareStatements(db);
            console.log("** SQLiteDB adapter initialized");
        } catch (e) {
            console.error('>> FSSQLiteSyncNeulandStorageAdapter', e, e.stack);
        }
    }

    makeDB(db) {
        if (universe.nodeVersion >= 24) {
            db.exec('PRAGMA journal_mode = WAL');
        } else {
            db.pragma('journal_mode = WAL');
        }
        db.prepare(`
  CREATE TABLE IF NOT EXISTS neuland (
    soul TEXT PRIMARY KEY NOT NULL,
    object TEXT NOT NULL
  )
`).run();
        db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS soul on neuland(soul)`).run();
    }

    prepareStatements(db) {
        this._stmtkeys = db.prepare('SELECT soul FROM neuland');
        this._stmthas = db.prepare('SELECT EXISTS(SELECT 1 FROM neuland WHERE soul = ?) AS has');
        this._stmtsize = db.prepare('SELECT count(*) as size FROM neuland');
        this._stmtget = db.prepare('SELECT soul, object FROM neuland WHERE soul = ?');
        this._stmtset = db.prepare('INSERT INTO neuland (soul, object) VALUES (?, ?) ON CONFLICT(soul) DO UPDATE SET object = excluded.object WHERE neuland.object IS DISTINCT FROM excluded.object');
        this._stmtdel = db.prepare('DELETE FROM neuland WHERE soul = ?');
    }


    //
    // access
    //


    keys() {
        const keys = this._stmtkeys.get().soul;
        return keys;
    }

    size() {
        const size = this._stmtsize.get().size;
        return keys.length;
    }

    newInnerDB() {}

    has(soul) {
        const has = this._stmthas.get(soul).has;
        return has === 1;
    }

    get(soul) {
        const row = this._stmtget.get(soul);
        if (!row) return null;
        const object = row.object;
        return object;
    }

    set(soul, item) {
        this._stmtset.run(soul, item);
    }

    del(soul) {
        this._stmtdel.run(soul);
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

    async close() {
        this.db?.close();
        delete this.db;
    }
}

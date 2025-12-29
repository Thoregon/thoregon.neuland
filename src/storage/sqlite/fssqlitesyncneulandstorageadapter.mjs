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
import NeulandStorageAdapter from "../neulandstorageadapter.mjs";
import process               from "process";
// import Database              from 'better-sqlite3';
import { DatabaseSync }      from 'node:sqlite';
import { manageBackups}      from "evolux.util/lib/managebackup.mjs";
import universe              from "evolux.universe/lib/universe.mjs";

const Database = DatabaseSync;

// const Database = universe.nodeVersion >= 24
//                  ? (await import('node:sqlite')).DatabaseSync
//                  : (await import('better-sqlite3')).default;
// let storing = false;

const DBGID = '** NeulandDB';

export default class FSSQLiteSyncNeulandStorageAdapter extends NeulandStorageAdapter {

    init({ location, name } = {}) {
        universe.debuglog(DBGID, "SQLiteDB adapter init");
        this.opt          = { location, name };
        const directory   = this.opt.directory = this.getStorageLocation({ location, name });
        this.opt.filepath = this.getFileLocation({ location, name });
        this.storing      = false;
        if (!sfs.existsSync(directory)) sfs.mkdirSync(directory, { recursive: true });

        this.manageBackups(directory, `${name}.sqlite`);

        this.initDB(this.opt);
        universe.debuglog(DBGID, "SQLiteDB adapter init DONE", directory);
    }

    //
    // info
    //

    getStorageLocation({ location, name } = {}) {
        const directory    = path.resolve(process.cwd(), location);
        return directory;
    }

    getFileLocation({ location, name } = {}) {
        const directory    = this.getStorageLocation({ location, name });
        const filepath = `${directory}/${name ?? 'neuland'}.sqlite`;
        return filepath;
    }

    //
    // SQLite
    //

    manageBackups(directory, name) {
        let db;
        try {
            const filepath = this.opt.filepath;
            if (!sfs.existsSync(filepath)) return; // only if it exists
            db = new Database(filepath);
            db.exec('PRAGMA journal_mode = WAL');
            db.exec('PRAGMA wal_autocheckpoint = 2');
            db.close();
            manageBackups(directory, name);
        } catch (e) {
            if (db) try { db.close() } catch(ignore) {}
            const alias = universe.account?.alias ?? 'unknown';
            universe.MailSender?.sendDirectEmail({ sender: alias +'.upayme@upay.me', receiver: 'upaymeinstance@bernhard-lukassen.com', subject: 'NEULAND BACKUP ERROR ' + alias, bodytext: `Error at neuland backup ${e.message}\n\n${e.stack}` });
        }
    }

    initDB(opt) {
        try {
            const filepath = opt.filepath;
            const db       = this.db = new Database(filepath);
            universe.atDusk(() => this.closeDB(db));
            this.migrateDB(db);
            this.prepareStatements(db);
            console.log("** SQLiteDB adapter initialized");
        } catch (e) {
            console.error('>> FSSQLiteSyncNeulandStorageAdapter', e, e.stack);
        }
    }

    closeDB(db) {
        if (this._dbclosed) return;
        try {
            this._dbclosed = true
            db?.close();
            console.log(">> FSSQLiteSyncNeulandStorageAdapter: SQLite DB closed");
        } catch (ignore) {
            console.error("** FSSQLiteSyncNeulandStorageAdapter", ignore);
        }
    }

    migrateDB(db) {
        console.log("SQLiteNeulandAdapter.migrate");
        if (universe.nodeVersion >= 24) {
            db.exec('PRAGMA journal_mode = WAL');
            db.exec('PRAGMA wal_autocheckpoint = 2');
        } else {
            db.pragma('journal_mode = WAL');
            db.pragma('wal_autocheckpoint = 2');
        }
        if (db.prepare('SELECT COUNT(*) as i FROM sqlite_schema WHERE type=\'table\' and name=\'neuland\';').get().i === 0) {
            db.exec(`
  CREATE TABLE IF NOT EXISTS neuland (
    soul TEXT PRIMARY KEY NOT NULL,
    object TEXT NOT NULL
  )
`);
            console.log(">> SQLITE: CREATE TABLE neuland");
            db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS soul on neuland(soul)`);
            console.log(">> SQLITE: CREATE  UNIQUE INDEX neuland");
        } else {
            console.log(">> SQLITE: TABLE neuland EXISTS");
        }
        if (db.prepare('SELECT COUNT(*) as i FROM sqlite_schema WHERE type=\'table\' and name=\'neuland_fts\';').get().i === 0) {
            // full text search for garbage collection
            // create FTS index on the object column

            db.exec(`
CREATE VIRTUAL TABLE neuland_fts USING fts5(
  object,
  content='neuland',
  content_rowid='rowid',
  tokenize = "unicode61 tokenchars '@:'"
);
`);
            console.log(">> SQLITE: CREATE VIRTUAL TABLE neuland_fts");
            // Build the index from existing rows, populate the index once

            db.exec(`
INSERT INTO neuland_fts(neuland_fts) VALUES('rebuild');
`);
            // Keep it in sync with triggers

            console.log(">> SQLITE: INSERT INTO neuland_fts");
            db.exec(`
CREATE TRIGGER neuland_ai AFTER INSERT ON neuland BEGIN
    INSERT INTO neuland_fts(rowid, object) VALUES (new.rowid, new.object);
END;`);
            console.log(">> SQLITE: CREATE TRIGGER on 'neuland' for insert");
            db.exec(`
CREATE TRIGGER neuland_ad AFTER DELETE ON neuland BEGIN
    INSERT INTO neuland_fts(neuland_fts, rowid, object) VALUES ('delete', old.rowid, old.object);
END;`);
            console.log(">> SQLITE: CREATE TRIGGER on 'neuland' for delete");
            db.exec(`
CREATE TRIGGER neuland_au AFTER UPDATE ON neuland BEGIN
    INSERT INTO neuland_fts(neuland_fts, rowid, object) VALUES ('delete', old.rowid, old.object);
    INSERT INTO neuland_fts(rowid, object) VALUES (new.rowid, new.object);
END;`);
            console.log(">> SQLITE: CREATE TRIGGER on 'neuland' for update");
        } else {
            console.log(">> SQLITE: TABLE neuland_tfs EXISTS");
        }
        console.log("SQLiteNeulandAdapter.migrate DONE");
    }

    prepareStatements(db) {
        this._stmtkeys = db.prepare('SELECT soul FROM neuland');
        this._stmthas = db.prepare('SELECT EXISTS(SELECT 1 FROM neuland WHERE soul = ?) AS has');
        this._stmtsize = db.prepare('SELECT count(*) as size FROM neuland');
        this._stmtget = db.prepare('SELECT soul, object FROM neuland WHERE soul = ?');
        this._stmtset = db.prepare('INSERT INTO neuland (soul, object) VALUES (?, ?) ON CONFLICT(soul) DO UPDATE SET object = excluded.object WHERE neuland.object IS DISTINCT FROM excluded.object');
        this._stmtdel = db.prepare('DELETE FROM neuland WHERE soul = ?');

        this._stmtObjectCount = db.prepare('SELECT count(*) as num FROM neuland');

        this._stmtGCcount = db.prepare(`
SELECT count(*) as num
FROM neuland AS n
    WHERE n.soul <> '00000000000000000000000000000000' AND
        NOT EXISTS (
          SELECT 1
          FROM neuland_fts AS f
          WHERE f.rowid <> n.rowid
            -- exact-token match for @soul:<that soul>
            AND neuland_fts MATCH '"' || '@soul:' || n.soul || '"'
)`);
        this._stmtGCRun = db.prepare(`
DELETE
FROM neuland
WHERE soul in (SELECT n.soul
   FROM neuland AS n
   WHERE n.soul <> '00000000000000000000000000000000' AND
     NOT EXISTS (
        SELECT 1
         FROM neuland_fts AS f
         WHERE f.rowid <> n.rowid
           -- exact-token match for @soul:<that soul>
           AND neuland_fts MATCH '"' || '@soul:' || n.soul || '"'))`);

        this._stmtVacuum = db.prepare(`VACUUM`);
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
        this.closeDB(this.db);
        delete this.db;
    }

    //
    // garbage collection
    //

    runGarbageCollection() {
        // check again if it works proper!
/*
        try {
            let i = 15, num = 0, start = Date.now();
            console.log("** SQLite Neuland adapter run Garbage Collection, current num of objects", this._stmtObjectCount.get().num);
            do {
                i--;
                this._stmtGCRun.run();
                num = this._stmtGCcount.get().num;
                console.log("After GC removed:", num);
            } while (num > 0 && i > 0)      // sanity: restrict number of runs. maybe next time it cleans all
            // at the end vacuum to reorganize and speed up
            this._stmtVacuum.run();
            console.log("** SQLite Neuland adapter run Garbage Collection: ", `${(Date.now()-start) / 1000} sec`, i === 0 ? 'PARTLY' : '', `Objects left: ${this._stmtObjectCount.get().num}`);
        } catch (e) {
            console.error("** SQLite Neuland adapter during Garbage Collection", e, e.stack);
        }
*/
    }

    //
    // testing & debugging
    //

    query(sql, params = []) {
        try {
            const db = this.db;
            db.prepare(sql);
            const res = db.all(...params);
            return res;
        } catch (e) {
            console.error(e, e.stack);
            return e;
        }
    }
}

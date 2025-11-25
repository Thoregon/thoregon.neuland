/**
 * use an OLAP DB for transaction queries and aggregations
 * currently the schema 'main' is used because every agent instance has its own db
 * if multiple OLAP DB's needs to be
 *
 * todo: avoid SQL injections -> use variables (?::<type>) an pass params to db.run()
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { Service, Attach } from "/thoregon.truCloud";
import { cleanObject }     from "/evolux.util/lib/objutils.mjs";
import fs                  from "fs";
import path                from "path";
import { isObject }        from "/evolux.util/lib/objutils.mjs";
import { DatabaseSync }    from 'node:sqlite';
import process             from "process";

const Database = DatabaseSync;

// const Database = universe.nodeVersion >= 24
//                  ? (await import('node:sqlite')).DatabaseSync
//                  : (await import('better-sqlite3')).default;

let connection;
const preparedStatements = {};

async function fsstat(path){
    const fs   = universe.fs;    // get file system
    let stat;
    try {
        stat = await fs.stat(path);
    } catch (ignore) {}
    return stat;
}

function prefixKeysWithColon(obj) {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [":" + key, value])
    );
}
"@Service"
export default class OLAPService {


    "@Attach"
    async attach(handle, appinstance, home) {
        this.handle   = handle;
        this.instance = appinstance;
        this.home     = home;
        await this.init(handle.settings);
        console.log(">> OLAPService >> SQLite Sync ++", appinstance.qualifier);
    }

    //
    // info
    //

/*
    static isOLAPDBmissing(datalocation) {
        const filepath = this.getDBFilePath(datalocation);
        return !fs.existsSync(filepath);
    }

    static getDBFilePath(datalocation) {
        const dir = this.getOLAPDBLocation(datalocation);
        const dbfile = this.getDBFileName();
        const filepath = path.join(dir, dbfile);
        return filepath;
    }

    static getDBFileName() {
        const dbname = 'upayme';
        const dbfile = `${dbname}.sqlite`;
        return dbfile;
    }

    static getOLAPDBLocation(datalocation) {
        return path.join(datalocation, 'olap');
    }
*/


    //
    // service
    //

    async deactivate() {
        // run downcmds
        await this.closeDB(connection);
    }

    async init(settings) {
        this.settings = settings;

        const dir  = path.resolve((universe.NEULAND_STORAGE_OPT.location ?? 'data'), 'olap');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const dbname = /*settings?.db ??*/ 'upayme';
        const dbfile = path.join(dir, `${dbname}.sqlite`);
        connection = await this.openDB(dbfile);

        await this.checkMigration();

    }

    hasPrepared(name) {
        return !!preparedStatements[name];
    }

    prepare(name, sql) {
        if (!connection) throw new Error(`SQLite DB not available`);
        const prepared = connection.prepare(sql);
        preparedStatements[name] = prepared;
        return prepared;
    }

    prepared(name) {
        return preparedStatements[name];
    }

    queryPrepared(name, params) {
        const stmt = this.prepared(name);
        let result;
        if (Array.isArray(params)) {
            result = stmt.all(...params);
        } else if (isObject(params)) {
            params = prefixKeysWithColon(params);
            result = stmt.all(params);
        } else {
            result = stmt.all();
        }

        return this._buildResult(result, stmt.columns());
    }

    runPrepared(name, params) {
        const stmt = this.prepared(name);
        let result;
        if (Array.isArray(params)) {
            result = stmt.run(...params);
        } else if (isObject(params)) {
            params = prefixKeysWithColon(params);
            result = stmt.run(params);
        } else {
            result = stmt.run();
        }

        return result;
    }

    queryPreparedPlus(name, sql, params) {
        if (!this.hasPrepared(name)) this.prepare(name, sql);
        return this.queryPrepared(name, params);
    }

    async checkMigration() {
        let currentVersion = await this.getDBVersionFromDB(); // await this.getDBVersionFromFile();
        if (!currentVersion) {
            currentVersion = 0;
            // no migration needed, but initial version record is needed
            // await this.initMigration(currentVersion);
        }
        console.log("OLAPService.checkMigration current version", currentVersion);

        // for migration testing:
        // currentVersion = requiredVersion - 1;
        const requiredVersion = this.settings.version;
        console.log("OLAPService.checkMigration required version", requiredVersion);
        if (requiredVersion <= currentVersion) return;

        await this.migrate(currentVersion);
    }

    async ensureMigrationLog() {
        const db = this.db;
        if (db.prepare('SELECT COUNT(*) as i FROM sqlite_schema WHERE type=\'table\' and name=\'db_migration\';').get().i === 0) {
            db.exec(`
                CREATE TABLE IF NOT EXISTS db_migration
                (
                    version INTEGER PRIMARY KEY,
                    type TEXT,
                    error TEXT,
                    dttm DATETIME DEFAULT (CURRENT_TIMESTAMP)
                )
            `);
            console.log(">> SQLITE: CREATE TABLE db_migration");
            db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS version on db_migration(version)`);
            console.log(">> SQLITE: CREATE  UNIQUE INDEX db_migration(version)");
        }
    }

    async getDBVersionFromDB() {
        try {
            await this.ensureMigrationLog();
            const res = await this.query('SELECT MAX(version) as current_version FROM db_migration');
            const currentVersion = res?.rows[0]?.current_version ?? 0;
            console.log(">> SQLite OLAPServer.getDBVersionFromDB", currentVersion);
            return currentVersion;
        } catch (e) {
            console.log(">> SQLite OLAPServer.getDBVersionFromDB: db_migration table does not exist");
            return null;
        }
    }

    async migrate(currentVersion) {
        console.log("OLAPService.mirgate to version", currentVersion);
        const fs               = universe.fs;    // get file system
        const requiredVersion  = this.settings.version;
        let nextMigrateVersion = currentVersion + 1;
        do {
            const migration = this.settings.migration[nextMigrateVersion];
            if (migration) {
                const error = await this.doMigration(migration);
                await this.insert('db_migration', { version: nextMigrateVersion, type: 'migration', error });
            }
            nextMigrateVersion++;
        } while (requiredVersion >= nextMigrateVersion);
        console.log("OLAPService.mirgate DONE");

        // await fs.writeFile(olapsettingsfile, `export default { version: ${requiredVersion} }`, { encoding: 'utf8' });
    }

    async initMigration(currentVersion) {
        await this.insert('db_migration', { version: currentVersion, type: 'migration', error: '' });
    }

    async doMigration(migration) {
        let error = '';
        for await (const migrationstep of migration) {
            try {
                if (migrationstep.sql) {
                    console.log("-- OLAPService (SQLLite): migration SQL: ", migrationstep.sql);
                    await this.exec(migrationstep.sql);
                } else if (migrationstep.insert) {
                    if (migrationstep.table) {
                        await this.insert(migrationstep.table, migrationstep.insert);
                    } else {
                        console.log(">> OLAPService (SQLLite): migration insert: no table specified");
                    }
                } else if (migrationstep.update) {
                    if (migrationstep.table || !migrationstep.set) {
                        await this.update(migrationstep.table, migrationstep.update, migrationstep.set);
                    } else {
                        console.log(">> OLAPService (SQLLite): migration update: no table or where specified");
                    }
                } else if (migrationstep.js) {
                    console.log("-- OLAPService (SQLLite): migration JS: ", await migrationstep.js(this, migrationstep.params, this.home));
                } else if (migrationstep.table && migrationstep.columns) {
                    await this.initTable(migrationstep.table, migrationstep.columns);
                } else {
                    console.error(">> OLAPService (SQLLite): unknown migration step", JSON.stringify(migrationstep));
                    error += `${((error.length > 0) ? '\n' : '')}unknown migration step: ${JSON.stringify(migrationstep)}`;
                }
            } catch (e) {
                console.error("** OLAPService: error while migration step", e);
                error += `${((error.length > 0) ? '\n' : '')}error while migration step: ${e}, ${e.stack}}`;
            }
        }
        return (error.length > 0) ? error : null;
    }

    async openDB(dbfile) {
        const mkdb     = !fs.existsSync(dbfile);
        const db =  new Database(dbfile);
        process.on('exit', () => this.closeDB(db) );
        process.on('SIGTERM', () => this.closeDB(db));
        process.on('SIGINT', () => this.closeDB(db));
        // if (mkdb) {
        if (universe.nodeVersion >= 24) {
            db.exec('PRAGMA journal_mode = WAL');
        } else {
            db.pragma('journal_mode = WAL');
        }
        // }
        return db;
    }

    closeDB(db) {
        if (this._dbclosed) return;
        try {
            this._dbclosed = true
            db?.close();
            console.log(">> OLAPService: SQLite DB closed");
        } catch (ignore) {
            console.error("** OLAPService", ignore);
        }
    }

    get db() {
        return connection;
    }

    async getTables() {
        const tables = [];
        const { columnNames, rows } = await this.query("select * from sqlite_schema where type='table' and name not like 'sqlite_%'");
        for (const row of rows) {
            tables.push({ name: row.name, catalog: 'upayme', schema: 'upayme' });
        }
        return tables;
    }

    async initTable(tablename, tabledef) {
        const columns   = tabledef.filter((item) => item.name).map(item => `${item.name} ${item.def}`);
        const defs      = tabledef.filter((item) => item.def && !item.name).map(item => item.def).join(', ');
        const cmds      = tabledef.filter((item) => item.cmd).map(item => item.cmd);
        const createsql = `CREATE TABLE IF NOT EXISTS ${tablename} (${columns.join(', ')}${defs ? ', ' + defs : ''});`;
        console.log(">> SQLite: ", createsql);
        try {
            connection.prepare(createsql).run();
            // await connection.exec(createsql);
            for await (const cmd of cmds) {
                console.log("SQL CMD> ", cmd);
                connection.prepare(cmd).run();
                // await connection.exec(cmd);
            }
        } catch (e) {
            console.error(">> OLAP SQL CMD ERROR", e.stack);
        }
    }


    //
    // simplified interface
    //

    /**
     *
     * @param table
     * @param data      ... can be an array, inserts the values by position of columns. otherwise can be an object, property named will be treated as colum names
     * @param replace   ... do a replace instead of an insert
     * @param sequence  ... return the current value of the specified sequence
     * @returns {Promise<unknown>}
     */
    async insert(table, data, { replace = false/*, sequence*/ } = {}) {
        let sql = `INSERT ${replace ? 'OR REPLACE' : ''} INTO ${table} `;

        // todo: filter all 'null/undefined' values
        if (Array.isArray(data)) {
            data = [...data];
            if (data.length < 0) return;
            sql += 'VALUES (' + new Array(data.length).fill('?').join(", ") + ')'
        } else {
            data = cleanObject(data);
            const names = Object.keys(data);
            if (names.length < 0) return;
            data = Object.values(data);
            sql += '(' + names.join(', ') + ') ';
            sql += 'VALUES (' + new Array(data.length).fill('?').join(", ") + ')'
        }

        const values = this._asSQLValues(data);
        let res = await this.exec(sql, values);

        return res;
    }

    async get(table, where) {
        let sql = `SELECT * FROM ${table} `;

        const whereFields = Object.entries(where);
        sql += ' WHERE ' + whereFields.map(([name, value]) => `${name} = ?`).join(' AND ');
        // console.log("-- OLAPService (SQLLite): update SQL: ", sql);

        const values = this._asSQLValues([...(Object.values(where))]);

        return await this.query(sql, values);
    }

    async update(table, where, data) {
        let sql = `UPDATE ${table} SET `;
        const setFields = Object.keys(data);
        sql += setFields.map((name) => `${name} = ?`).join(', ');

        const whereFields = Object.entries(where);
        sql += ' WHERE ' + whereFields.map(([name, value]) => `${name} = ?`).join(' AND ');
        // console.log("-- OLAPService (SQLLite): update SQL: ", sql);

        const values = this._asSQLValues([...(Object.values(data)), ...(Object.values(where))]);

        return await this.exec(sql, values);
    }

    /**
     * query whole result as array of rows
     *
     * DuckDBTypeValues -> value.toParts(), value.toString():
     * - DecimalType: toString -> '2.718'
     *   properties:
     *      - width: 18
     *      - scale: 3      -> BigInt(10**value.scale) to calculate with BigInts
     *      - value: 2718n (BigInt)
     *          - see [How to deal with big numbers](https://stackoverflow.com/questions/4288821/how-to-deal-with-big-numbers-in-javascript)
     *
     * - Timestamp: toString -> '2025-02-19 12:21:10.61'
     *  parts: {
     *    "date": {
     *       "year": 2025,
     *       "month": 2,
     *       "day": 19
     *    },
     *    "time": {
     *       "hour": 12,
     *       "min": 21,
     *       "sec": 10,
     *       "micros": 610000
     *    }
     * }
     * - Date: toString -> '2025-02-19'
     *  parts: {
     *    "year": 2025,
     *    "month": 2,
     *    "day": 19
     *  }
     *
     * @param sql
     * @param params
     * @returns {Promise<*[]>}
     */

    query(sql, params = []) {
        const stmt = connection.prepare(sql);
        const result = stmt.all(...params);
        return this._buildResult(result, stmt.columns());
    }

    _buildResult(result, columns) {
        const columnNames = columns.map(column => column.name)
        result.forEach(row => {
            columnNames.forEach((column) => {
                if (row[column] === 'true') {
                    row[column] = true;
                } else if (row[column] === 'false') {
                    row[column] = false;
                }
            })
        })
        return { columnNames, rows: result };
    }

    exec(sql, params = []) {
        // console.log("-- OLAPService (SQLLite): exec SQL: ", sql, JSON.stringify(params));
        const result = connection.prepare(sql).run(...params);
        // const result = await connection.run(sql, params);
        return result;
    }

    //
    // SQL Helper
    //

    convertToObjects(result, defaults = {}) {
        const columns = result.columnNames;
        const rows    = result.rows;
        if (Object.keys(defaults).length === 0) return rows;
        rows.forEach(row => {
            columns.forEach(column => {
                if (row[column] == undefined) row[column] = defaults[column];
            })
        });
        return rows;
    }

    _asSQLValues(values) {
        const sqlValues = values.map(value => this._asSQLValue(value));
        return sqlValues;
    }

    _asSQLValue(value) {
        if (value == undefined) return 'NULL'; // null;
        // if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value.toString();
        if (value instanceof Date) return value.toISOString();
        return value.toString();
    }

/*

    _getDBTypes(values) {
        const dbTypes = values.map(value => this._getDBType(value));
        return dbTypes;
    }

    _getDBType(value) {
        if (value == undefined) return DuckDBSQLNullType.instance;
        // if (typeof value === 'number') {
        //     return value % 1 === 0 ? DuckDBIntegerType.instance : DuckDBDoubleType.instance; // new DuckDBDecimalType(18,3);
        // }
        if (typeof value === 'boolean') return DuckDBBooleanType.instance;
        // if (value instanceof Date) return DuckDBTimestampType.instance;
        return DuckDBVarCharType.instance;
    }

    _bindValue(stmt, idx, value) {
        if (value == undefined) return stmt.bindNull(idx) ; // todo
        // if (typeof value === 'number') {
        //     if (value % 1 === 0) {
        //         stmt.bindInteger(idx, value);
        //     } else {
        //         stmt.bindDouble(idx, value);
        //     }
        //     return;
        // }
        if (typeof value === 'boolean') return stmt.bindBoolean(idx, value);
        if (value instanceof Date) return stmt.bindVarchar(idx, value.toISOString());
        stmt.bindVarchar(idx, value.toString());
    }

    _asSQLStmtValues(values) {
        const sqlValues = values.map(value => this._asSQLStmtValue(value));
        return sqlValues.join(', ');
    }

    _asSQLStmtValue(value) {
        if (value === undefined) return 'NULL';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        if (value instanceof Date) return `'${value.toISOString()}'`;
        return `'${value}'`;
    }
*/

}

OLAPService.checkIn(import.meta);

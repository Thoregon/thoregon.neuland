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

import { Service, Attach }   from "/thoregon.truCloud";
import { cleanObject }       from "/evolux.util/lib/objutils.mjs";
import sfs                   from "fs";
// import sqlite3             from 'sqlite3';
// import { open }            from 'sqlite';
// import Database              from 'better-sqlite3';
// import { DatabaseSync }      from 'node:sqlite';
const Database = universe.nodeVersion >= 24
                 ? (await import('node:sqlite')).DatabaseSync
                 : (await import('better-sqlite3')).default;

let connection;


async function fsstat(path){
    const fs   = universe.fs;    // get file system
    let stat;
    try {
        stat = await fs.stat(path);
    } catch (ignore) {}
    return stat;
}

"@Service"
export default class OLAPService {


    "@Attach"
    async attach(handle, appinstance, home) {
        this.handle   = handle;
        this.instance = appinstance;
        this.home     = home;
        await this.init(handle.settings);
        console.log(">> OLAPService (SQLite)", appinstance.qualifier);
    }

    async deactivate() {
        // run downcmds
        await connection?.close();
    }

    async init(settings) {
        this.settings = settings;

        const fs   = universe.fs;    // get file system
        const path = universe.path;
        const dir  = (universe.NEULAND_STORAGE_OPT.location ?? 'data') + '/olap';
        const stat = await fsstat(dir);
        if (!stat) await fs.mkdir(dir, { recursive: true });
        const dbname = settings?.db ?? 'olap';
        const dbfile = path.resolve(dir, `${dbname}.sqlite`);
        connection = await this.openDB(dbfile);

        // run upcmds

        await this.checkMigration();

    }

    async checkMigration() {
        const fs   = universe.fs;    // get file system
        const path = universe.path;
        const olapsettingsfile = (universe.env.etcdir ?? './etc') + '/olap.mjs';
        const stat = await fsstat(olapsettingsfile);
        const requiredVersion = this.settings.version;
        let currentVersion;
        if (stat) {
            try {
                const module = await import(olapsettingsfile);
                const olapetc = module.default;
                currentVersion = olapetc?.version;
            } catch (e) {
                console.error(">> OLAPService (SQLLite): can't read olap version file", e);
            }
        }

        if (!currentVersion) {
            // write olapsettingsfile
            await fs.writeFile(olapsettingsfile, `export default { version: 0 }`, { encoding: 'utf8' });
            currentVersion = 0;
        }

        // for migration testing:
        // currentVersion = requiredVersion - 1;
        if (requiredVersion <= currentVersion) return; // no migration needed

        await this.migrate(currentVersion, olapsettingsfile);
    }

    async migrate(currentVersion, olapsettingsfile) {
        const fs               = universe.fs;    // get file system
        const requiredVersion  = this.settings.version;
        let nextMigrateVersion = currentVersion + 1;
        do {
            const migration = this.settings.migration[nextMigrateVersion];
            if (migration) await this.doMigration(migration);
            nextMigrateVersion++;
        } while (requiredVersion >= nextMigrateVersion);

        await fs.writeFile(olapsettingsfile, `export default { version: ${requiredVersion} }`, { encoding: 'utf8' });
    }

    async doMigration(migration) {
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
                }
            } catch (e) {
                console.error("** OLAPService: error while migration step", e);
            }
        }
    }

    async openDB(dbfile) {
        const mkdb     = !sfs.existsSync(dbfile);
        const db =  new Database(dbfile);
        if (mkdb) {
            if (universe.nodeVersion >= 24) {
                db.exec('PRAGMA journal_mode = WAL');
            } else {
                db.pragma('journal_mode = WAL');
            }
        }
        return db;
    }

    get db() {
        return db;
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
        const createsql = `CREATE TABLE ${tablename} (${columns.join(', ')}${defs ? ', ' + defs : ''});`;
        console.log("SQL> ", createsql);
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


    async query(sql, params = []) {
        const stmt = connection.prepare(sql);
        const result = stmt.all(...params);
        // const result = await connection.all(sql, params);
        return await this._buildResult(result, stmt.columns());
    }

    async _buildResult(result, columns) {
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

    async exec(sql, params = []) {
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
        if (value === undefined) return ''; // null;
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

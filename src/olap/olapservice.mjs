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
import { DuckDBInstance, DuckDBTypeId, DuckDBVarCharType, DuckDBBooleanType, DuckDBIntegerType, DuckDBDoubleType, DuckDBTimestampType, DuckDBDateType, DuckDBTimeType, DuckDBIntervalType, DuckDBDecimalType, DuckDBEnumType, DuckDBAnyType, DuckDBBlobType, DuckDBSQLNullType }  from "/@duckdb/node-api";

let db;
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
        console.log(">> OLAPService", appinstance.qualifier);
    }

    async deactivate() {
        // run downcmds

        connection?.close();
    }

    async init(settings) {
        this.settings = settings;

        const fs   = universe.fs;    // get file system
        const path = universe.path;
        const dir  = (universe.NEULAND_STORAGE_OPT.location ?? 'data') + '/olap';
        const stat = await fsstat(dir);
        if (!stat) await fs.mkdir(dir, { recursive: true });
        const dbname = settings?.db ?? 'olap';
        const dbfile = path.resolve(dir, `${dbname}.db`);
        db = await this.openDB(dbfile);
        connection = await db.connect();

        // run upcmds

        await this.checkMigration();

        // const tables = settings?.tables;
        // if (!tables) return;
        // await this.initTables(tables);
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
                console.error(">> OLAPService: can't read olap version file", e);
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
                    console.log("-- OLAPService: migration SQL: ", migrationstep.sql);
                    await this.exec(migrationstep.sql);
                } else if (migrationstep.insert) {
                    if (migrationstep.table) {
                        await this.insert(migrationstep.table, migrationstep.insert);
                    } else {
                        console.log(">> OLAPService: migration insert: no table specified");
                    }
                } else if (migrationstep.update) {
                    if (migrationstep.table || !migrationstep.set) {
                        await this.update(migrationstep.table, migrationstep.update, migrationstep.set);
                    } else {
                        console.log(">> OLAPService: migration update: no table or where specified");
                    }
                } else if (migrationstep.js) {
                    console.log("-- OLAPService: migration JS: ", await migrationstep.js(connection, migrationstep.params, this.home));
                } else if (migrationstep.table && migrationstep.columns) {
                    await this.initTable(migrationstep.table, migrationstep.columns);
                } else {
                    console.error(">> OLAPService: unknown migration step", JSON.stringify(migrationstep));
                }
            } catch (e) {
                console.error("** OLAPService: error while migration step", e);
            }
        }
    }

    async openDB(dbfile) {
        const db = await DuckDBInstance.create(dbfile,  {
            "access_mode": "READ_WRITE",
            "threads": "4"
        });

        return db;
    }

    get db() {
        return db;
    }

    async getTables() {
        const tables = [];
        const { columnNames, rows } = await this.query('SELECT * FROM information_schema.tables');
        for (const row of rows) {
            tables.push({ name: row[2], catalog: row[1], schema: row[0] });
        }
        return tables;
    }

    async initTables(tables) {
        const tablenames = Object.keys(tables);

        for await (const tablename of tablenames) {
            const tabledef = tables[tablename];
            await this.initTable(tablename, tabledef);
        }
    }

    async initTable(tablename, tabledef) {
        const columns   = tabledef.filter((item) => item.name).map(item => `${item.name} ${item.def}`);
        const defs      = tabledef.filter((item) => item.def && !item.name).map(item => item.def).join(', ');
        const cmds      = tabledef.filter((item) => item.cmd).map(item => item.cmd);
        const createsql = `CREATE OR REPLACE TABLE ${tablename} (${columns.join(', ')}${defs ? ', ' + defs : ''});`;
        console.log("SQL> ", createsql);
        try {
            await connection.run(createsql);
            for await (const cmd of cmds) {
                console.log("SQL CMD> ", cmd);
                await connection.run(cmd);
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
     * @param replace
     * @returns {Promise<unknown>}
     */
    async insert(table, data, { replace = false } = {}) {
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
        if (!replace) sql += ' ON CONFLICT DO NOTHING';

        const values = this._asSQLValues(data);
        const types = this._getDBTypes(values);

        return await this.exec(sql, values, types);
    }

    async get(table, where) {
        let sql = `SELECT * FROM ${table} `;

        const whereFields = Object.entries(where);
        sql += ' WHERE ' + whereFields.map(([name, value]) => `${name} = ?`).join(' AND ');
        // console.log("-- OLAPService: update SQL: ", sql);

        const values = this._asSQLValues([...(Object.values(where))]);

        return await this.query(sql, values);
    }

    async update(table, where, data) {
        let sql = `UPDATE ${table} SET `;
        const setFields = Object.keys(data);
        sql += setFields.map((name) => `${name} = ?`).join(', ');

        const whereFields = Object.entries(where);
        sql += ' WHERE ' + whereFields.map(([name, value]) => `${name} = ?`).join(' AND ');
        // console.log("-- OLAPService: update SQL: ", sql);

        const values = this._asSQLValues([...(Object.values(data)), ...(Object.values(where))]);
        const types = this._getDBTypes(values);

        return await this.exec(sql, values, types);
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
        // console.log("-- OLAPService: query SQL: ", sql, JSON.stringify(params));
        const statements = await connection.extractStatements(sql, params);
        let result;
        for (let i = 0; i < statements.count; i++) {
            const stmt = await statements.prepare(i);
            for (let i = 1; i <= stmt.parameterCount; i++) {
                const value = params[i-1];
                this._bindValue(stmt, i, value);
                // stmt.bind(i, value);
            }
            result = await stmt.run(sql, params);
        }
        // const result = await connection.run(sql, params);
        const columnNames = result.columnNames();
        const rows = [];
        while (true) {
            const chunk = await result.fetchChunk();
            // Last chunk will have zero rows.
            if (!chunk || chunk.rowCount === 0) {
                break;
            }
            const crows = chunk.getRows();
            rows.push(...crows);
        }
        return { columnNames, rows };
    }

    async read(sql, params = []) {
        // console.log("-- OLAPService: read SQL: ", sql, JSON.stringify(params));
        const reader = await connection.runAndRead(sql, params);
        return reader;
    }

    async exec(sql, params = [], types) {
        // console.log("-- OLAPService: exec SQL: ", sql, JSON.stringify(params));
        const result = await connection.run(sql, params, types);
        return result;
    }

    //
    // SQL Helper
    //

    _getDBTypes(values) {
        const dbTypes = values.map(value => this._getDBType(value));
        return dbTypes;
    }

    _getDBType(value) {
        if (value == undefined) return DuckDBSQLNullType.instance;
        if (typeof value === 'number') {
            return value % 1 === 0 ? DuckDBIntegerType.instance : DuckDBDoubleType.instance; // new DuckDBDecimalType(18,3);
        }
        if (typeof value === 'boolean') return DuckDBBooleanType.instance;
        // if (value instanceof Date) return DuckDBTimestampType.instance;
        return DuckDBVarCharType.instance;
    }

    _bindValue(stmt, idx, value) {
        if (value == undefined) return ; // todo
        if (typeof value === 'number') {
            if (value % 1 === 0) {
                stmt.bindInteger(idx, value);
            } else {
                stmt.bindDouble(idx, value);
            }
            return;
        }
        if (typeof value === 'boolean') return stmt.bindBoolean(idx, value);
        if (value instanceof Date) return stmt.bindVarchar(idx, value.toISOString());
        stmt.bindVarchar(idx, value);
    }

    _asSQLValues(values) {
        const sqlValues = values.map(value => this._asSQLValue(value));
        return sqlValues;
    }

    _asSQLValue(value) {
        if (value === undefined) return ''; // null;
        if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value.toString();
        if (value instanceof Date) return value.toISOString();
        return value.toString();
    }

    _asSQLStmtValues(values) {
        const sqlValues = values.map(value => this._asSQLStmtValue(value));
        return sqlValues.join(', ');
    }

    _asSQLStmtValue(value) {
        if (value === undefined) return 'NULL';
        if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value.toString();
        if (value instanceof Date) return `'${value.toISOString()}'`;
        return `'${value}'`;
    }

    //
    // inernal
    //

    _run(fn, ...args) {
        return new Promise((resolve, reject) => {
            const res = fn(...args, (err) => {
                if (err) return reject(err);
                resolve(res);
            })
        })
    }

    _all(fn, ...args) {
        return new Promise((resolve, reject) => {
            fn(...args, (err) => {
                if (err) return reject(err);
                resolve(res);
            })
        })
    }
}

OLAPService.checkIn(import.meta);
